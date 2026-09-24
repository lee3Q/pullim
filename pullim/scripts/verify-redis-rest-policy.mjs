import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const script = fileURLToPath(import.meta.url);
const token = "synthetic-local-redis-token";
const secret = "synthetic-local-policy-secret-32-characters";

function decodeReply(buffer) {
  const end = buffer.indexOf("\r\n");
  if (end < 0) return null;
  const prefix = String.fromCharCode(buffer[0]);
  const head = buffer.subarray(1, end).toString();
  if (prefix === "+") return { value: head, bytes: end + 2 };
  if (prefix === ":") return { value: Number(head), bytes: end + 2 };
  if (prefix === "-") throw new Error(`Redis ${head}`);
  if (prefix !== "$") throw new Error(`unexpected Redis reply ${prefix}`);
  const size = Number(head);
  if (size === -1) return { value: null, bytes: end + 2 };
  if (!Number.isSafeInteger(size) || size < 0) throw new Error("invalid Redis bulk size");
  if (buffer.length < end + 2 + size + 2) return null;
  return { value: buffer.subarray(end + 2, end + 2 + size).toString(), bytes: end + 2 + size + 2 };
}

function redisCommand(port, args) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const chunks = args.map((arg) => {
      const value = Buffer.from(String(arg));
      return Buffer.concat([Buffer.from(`$${value.length}\r\n`), value, Buffer.from("\r\n")]);
    });
    const payload = Buffer.concat([Buffer.from(`*${args.length}\r\n`), ...chunks]);
    let response = Buffer.alloc(0);
    socket.setTimeout(5000, () => socket.destroy(new Error("Redis timeout")));
    socket.on("connect", () => socket.write(payload));
    socket.on("data", (chunk) => {
      try {
        response = Buffer.concat([response, chunk]);
        const parsed = decodeReply(response);
        if (parsed) { socket.end(); resolve(parsed.value); }
      } catch (error) { socket.destroy(); reject(error); }
    });
    socket.on("error", reject);
    socket.on("end", () => { if (response.length === 0) reject(new Error("empty Redis reply")); });
  });
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForRedis(port, process) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (process.startError) throw new Error(`redis-server start failed: ${process.startError.message}`);
    if (process.exitCode !== null) throw new Error(`redis-server exited ${process.exitCode}`);
    try { if (await redisCommand(port, ["PING"]) === "PONG") return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("redis-server did not start");
}

async function stop(process) {
  if (!process?.pid || process.exitCode !== null) return;
  process.kill("SIGTERM");
  await new Promise((resolve) => {
    const timeout = setTimeout(() => { process.kill("SIGKILL"); resolve(); }, 2000);
    process.once("exit", () => { clearTimeout(timeout); resolve(); });
  });
}

async function client() {
  const { commitPolicyState, loadPolicyState, markPolicyEmergency, StalePolicyState } =
    await import("../src/lib/safety/policy-state-store.ts");
  const state = { sessionId: "s1", version: 0, stage: "check_in", riskState: "open",
    consent: "unknown", choiceHashes: [], events: [] };
  await commitPolicyState(state);
  assert.equal(state.version, 1);
  const left = await loadPolicyState("s1");
  const right = await loadPolicyState("s1");
  assert.ok(left && right);
  const outcomes = await Promise.allSettled([commitPolicyState(left), commitPolicyState(right)]);
  const winners = outcomes.filter((outcome) => outcome.status === "fulfilled").length;
  const stale = outcomes.filter((outcome) => outcome.status === "rejected" && outcome.reason instanceof StalePolicyState).length;
  assert.equal(winners, 1);
  assert.equal(stale, 1);
  const olderOpen = await loadPolicyState("s1");
  assert.equal(olderOpen.version, 2);
  await markPolicyEmergency("s1");
  const emergency = await loadPolicyState("s1");
  assert.equal(emergency.riskState, "emergency");
  await commitPolicyState(emergency);
  assert.equal(emergency.version, 3);
  await assert.rejects(commitPolicyState(olderOpen), StalePolicyState);
  const finalState = await loadPolicyState("s1");
  assert.equal(finalState.version, 3);
  assert.equal(finalState.riskState, "emergency");
  process.stdout.write(JSON.stringify({ winners, stale, emergency: finalState.version, stale_open: "rejected" }));
}

async function main() {
  if (process.env.PULLIM_REDIS_VERIFY_CLIENT === "1") return client();
  const temp = await mkdtemp(path.join(os.tmpdir(), "pullim-redis-verify-"));
  let redis;
  let gateway;
  try {
    const redisPort = await freePort();
    const cert = path.join(temp, "cert.pem");
    const key = path.join(temp, "key.pem");
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
      "-keyout", key, "-out", cert], { stdio: "ignore" });
    redis = spawn("redis-server", ["--bind", "127.0.0.1", "--port", String(redisPort),
      "--save", "", "--appendonly", "no", "--dir", temp], { stdio: "ignore" });
    redis.on("error", (error) => { redis.startError = error; });
    await waitForRedis(redisPort, redis);
    const counts = { GET: 0, SET: 0, EVAL: 0 };
    const evalResults = [];
    let policyKey;
    let emergencyKey;
    gateway = https.createServer({ key: await readFile(key), cert: await readFile(cert) }, async (request, response) => {
      try {
        if (request.method !== "POST" || request.headers.authorization !== `Bearer ${token}`)
          throw new Error("unauthorized REST request");
        let body = "";
        for await (const chunk of request) body += chunk;
        const args = JSON.parse(body);
        if (!Array.isArray(args) || !["GET", "SET", "EVAL"].includes(args[0]))
          throw new Error("unsupported Redis command");
        const result = await redisCommand(redisPort, args);
        counts[args[0]]++;
        if (args[0] === "EVAL") {
          policyKey = args[3];
          emergencyKey = args[4];
          evalResults.push(result);
        }
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ result }));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: String(error.message) }));
      }
    });
    await new Promise((resolve) => gateway.listen(0, "127.0.0.1", resolve));
    const url = `https://127.0.0.1:${gateway.address().port}`;
    const probe = (args) => new Promise((resolve, reject) => {
      const request = https.request(url, { method: "POST", ca: [awaitedCert],
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }, (response) => {
        let body = "";
        response.on("data", (chunk) => body += chunk);
        response.on("end", () => {
          try { const value = JSON.parse(body); if (value.error) throw new Error(value.error); resolve(value.result); }
          catch (error) { reject(error); }
        });
      });
      request.on("error", reject);
      request.end(JSON.stringify(args));
    });
    const awaitedCert = await readFile(cert);
    assert.equal(await probe(["SET", "policy:probe", "v1"]), "OK");
    assert.equal(await probe(["GET", "policy:probe"]), "v1");
    const beforeClient = { ...counts };
    const { stdout, stderr } = await run(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", script], { env: {
      ...process.env, NODE_ENV: "production", NODE_EXTRA_CA_CERTS: cert,
      PULLIM_POLICY_REDIS_URL: url, PULLIM_POLICY_REDIS_TOKEN: token,
      PULLIM_POLICY_SECRET: secret, PULLIM_REDIS_VERIFY_CLIENT: "1",
    }, timeout: 15000 });
    assert.equal(stderr, "");
    assert.deepEqual(JSON.parse(stdout), { winners: 1, stale: 1, emergency: 3, stale_open: "rejected" });
    const productionCommands = Object.fromEntries(Object.entries(counts)
      .map(([command, total]) => [command, total - beforeClient[command]]));
    assert.ok(productionCommands.GET >= 1 && productionCommands.SET >= 1 && productionCommands.EVAL >= 1);
    assert.deepEqual(evalResults.slice().sort((a, b) => a - b), [-2, 0, 1, 1, 1]);
    assert.equal(typeof policyKey, "string");
    assert.equal(typeof emergencyKey, "string");
    assert.deepEqual(JSON.parse(await redisCommand(redisPort, ["GET", policyKey])), {
      sessionId: "s1", version: 3, stage: "check_in", riskState: "emergency",
      consent: "unknown", choiceHashes: [], events: [],
    });
    assert.equal(await redisCommand(redisPort, ["GET", emergencyKey]), "1");
    assert.equal(await redisCommand(redisPort, ["GET", "policy:probe"]), "v1");
    process.stdout.write(`${JSON.stringify({ result: "PASS", engine: "local redis-server", transport: "HTTPS REST", productionCommands, evalResults, winners: 1, stale: 1, finalVersion: 3, finalRiskState: "emergency", staleOpen: "rejected" })}\n`);
  } finally {
    if (gateway) await new Promise((resolve) => gateway.close(resolve));
    await stop(redis);
    await rm(temp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const reason = String(error.message).split("\n")[0];
  process.stderr.write(`FAIL redis-rest-policy: ${reason}\nredis_rest_policy: FAIL: ${reason}\n`);
  process.exitCode = 1;
});
