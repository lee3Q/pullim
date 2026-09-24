import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { execFile, execFileSync, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const secret = "synthetic-local-policy-secret-32-characters";
const token = "synthetic-local-redis-token";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const run = promisify(execFile);
const temp = await mkdtemp(path.join(os.tmpdir(), "pullim-cookie-http-"));
let redis, gateway, next;
let heldOpen;
let releaseOpen;
const counts = { GET: 0, SET: 0, EVAL: 0 };
const evalResults = [];

function reply(buffer) {
  const end = buffer.indexOf("\r\n");
  if (end < 0) return null;
  const type = String.fromCharCode(buffer[0]);
  const head = buffer.subarray(1, end).toString();
  if (type === "-") throw new Error(`Redis ${head}`);
  if (type === "+") return { value: head, bytes: end + 2 };
  if (type === ":") return { value: Number(head), bytes: end + 2 };
  if (type !== "$") throw new Error(`unexpected Redis reply ${type}`);
  const size = Number(head);
  if (size === -1) return { value: null, bytes: end + 2 };
  if (buffer.length < end + 2 + size + 2) return null;
  return { value: buffer.subarray(end + 2, end + 2 + size).toString(), bytes: end + 2 + size + 2 };
}
function command(port, args) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const fields = args.map((arg) => {
      const data = Buffer.from(String(arg));
      return Buffer.concat([Buffer.from(`$${data.length}\r\n`), data, Buffer.from("\r\n")]);
    });
    const payload = Buffer.concat([Buffer.from(`*${args.length}\r\n`), ...fields]);
    let data = Buffer.alloc(0);
    socket.setTimeout(5000, () => socket.destroy(new Error("Redis timeout")));
    socket.on("connect", () => socket.write(payload));
    socket.on("data", (chunk) => {
      try {
        data = Buffer.concat([data, chunk]);
        const result = reply(data);
        if (result) { socket.end(); resolve(result.value); }
      } catch (error) { socket.destroy(); reject(error); }
    });
    socket.on("error", reject);
  });
}
async function port() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return value;
}
async function stop(child) {
  if (!child?.pid || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => child.once("exit", resolve)), delay(2000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}
async function ready(check, child, name) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (child.startError) throw child.startError;
    if (child.exitCode !== null) throw new Error(`${name} exited ${child.exitCode}`);
    try { if (await check()) return; } catch { /* starting */ }
    await delay(50);
  }
  throw new Error(`${name} did not start`);
}
function signedCookie(sessionId) {
  const payload = Buffer.from(JSON.stringify({ sessionId })).toString("base64url");
  return `pullim_policy=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
async function post(base, route, body, cookie) {
  const response = await fetch(`${base}/api/ultimate/${route}`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie !== undefined ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  return { status: response.status, headers: response.headers,
    body: response.headers.get("content-type")?.includes("text/event-stream") ? text : JSON.parse(text) };
}

try {
  const redisPort = await port();
  const httpPort = await port();
  const cert = path.join(temp, "cert.pem");
  const key = path.join(temp, "key.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
    "-keyout", key, "-out", cert], { stdio: "ignore" });
  redis = spawn("redis-server", ["--bind", "127.0.0.1", "--port", String(redisPort),
    "--save", "", "--appendonly", "no", "--dir", temp], { stdio: "ignore" });
  redis.on("error", (error) => { redis.startError = error; });
  await ready(async () => await command(redisPort, ["PING"]) === "PONG", redis, "redis-server");
  gateway = https.createServer({ key: await readFile(key), cert: await readFile(cert) }, async (request, response) => {
    try {
      if (request.method !== "POST" || request.headers.authorization !== `Bearer ${token}`) throw new Error("unauthorized");
      let body = "";
      for await (const chunk of request) body += chunk;
      const args = JSON.parse(body);
      if (!Array.isArray(args) || !["GET", "SET", "EVAL"].includes(args[0])) throw new Error("unsupported command");
      if (heldOpen && args[0] === "EVAL" && JSON.parse(args[6]).riskState === "open") {
        const hold = heldOpen;
        heldOpen = null;
        hold();
        await new Promise((resolve) => { releaseOpen = resolve; });
      }
      const result = await command(redisPort, args);
      counts[args[0]]++;
      if (args[0] === "EVAL") evalResults.push(result);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ result }));
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: String(error.message) }));
    }
  });
  await new Promise((resolve) => gateway.listen(0, "127.0.0.1", resolve));
  const redisUrl = `https://127.0.0.1:${gateway.address().port}`;
  const app = path.resolve("pullim");
  next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(httpPort)], {
    cwd: app, env: { ...process.env, NODE_ENV: "production", NODE_EXTRA_CA_CERTS: cert,
      PULLIM_POLICY_REDIS_URL: redisUrl, PULLIM_POLICY_REDIS_TOKEN: token, PULLIM_POLICY_SECRET: secret }, stdio: "ignore" });
  next.on("error", (error) => { next.startError = error; });
  const base = `http://127.0.0.1:${httpPort}`;
  await ready(async () => (await fetch(`${base}/api/ultimate/listen`)).status === 405, next, "Next HTTP");
  const sessionId = `synthetic-http-${randomUUID()}`;
  const cookie = signedCookie(sessionId);
  const normal = { sessionId, messages: [{ role: "user", content: "선택을 고민해요" }], turnCount: 0, userName: null };
  const first = await post(base, "listen", normal);
  assert.equal(first.status, 200);
  const issuedCookie = first.headers.get("set-cookie")?.split(";")[0];
  assert.equal(issuedCookie, cookie);
  const beforeRace = { ...counts };
  const paused = new Promise((resolve) => { heldOpen = resolve; });
  const oldRequest = post(base, "listen", normal, cookie);
  await Promise.race([paused, delay(10000).then(() => { throw new Error("open write did not reach gateway"); })]);
  const emergency = await post(base, "listen", { ...normal, messages: [{ role: "user", content: "죽고 싶어" }] }, cookie);
  assert.equal(emergency.status, 200);
  assert.equal(emergency.headers.get("x-pullim-policy-risk"), "emergency");
  releaseOpen();
  const stale = await oldRequest;
  assert.equal(stale.status, 409);
  assert.equal(stale.body.policy.reason, "stale_policy_state");
  assert.equal(stale.headers.get("set-cookie"), null);
  assert.ok(counts.GET > beforeRace.GET && counts.SET > beforeRace.SET && counts.EVAL > beforeRace.EVAL);
  assert.ok(evalResults.includes(-2));
  const stateKey = `pullim:policy:${createHmac("sha256", secret).update(sessionId).digest("hex")}`;
  const final = JSON.parse(await command(redisPort, ["GET", stateKey]));
  assert.equal(final.riskState, "emergency");
  assert.equal(await command(redisPort, ["GET", `${stateKey}:emergency`]), "1");
  const boundaries = [
    ["empty", "listen", "pullim_policy=", normal],
    ["4097_bytes", "listen", `pullim_policy=${"x".repeat(4097)}`, normal],
    ["bad_signature", "confirm-safety", `${cookie.slice(0, -1)}${cookie.endsWith("A") ? "B" : "A"}`, { answer: "safe" }],
    ["bad_format", "action", "pullim_policy=not-a-signed-cookie", { decisionConsent: true }],
  ];
  const boundaryResults = [];
  for (const [name, route, badCookie, body] of boundaries) {
    const before = { ...counts };
    const result = await post(base, route, body, badCookie);
    assert.equal(result.status, 400, name);
    assert.equal(result.body.policy.reason, "invalid_policy_cookie", name);
    assert.equal(result.headers.get("set-cookie"), null, name);
    assert.deepEqual(counts, before, `${name}: Redis side effect`);
    assert.deepEqual(JSON.parse(await command(redisPort, ["GET", stateKey])), final, `${name}: policy state`);
    boundaryResults.push({ name, status: result.status, reason: result.body.policy.reason, setCookie: false, redisCommands: 0 });
  }
  let regressions;
  if (process.env.PULLIM_RUN_POLICY_REGRESSIONS === "1") {
    const outIndex = process.argv.indexOf("--out");
    const receiptFile = outIndex >= 0 ? process.argv[outIndex + 1] : path.join(temp, "policy-http.json");
    if (!receiptFile) throw new Error("--out requires a file path");
    const legacyScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "verify-policy-http.mjs");
    await run(process.execPath, [legacyScript, "--out", receiptFile], {
      env: { ...process.env, PULLIM_TEST_BASE_URL: base }, timeout: 120000 });
    const receipt = JSON.parse(await readFile(receiptFile, "utf8"));
    assert.equal(receipt.status, "PASS");
    assert.equal(receipt.checks.length, 24);
    assert.ok(receipt.checks.some((item) => item.name === "old valid cookie cannot roll back emergency" && item.passed));
    regressions = { checks: receipt.checks.length, cookieReplay: "PASS" };
  }
  console.log(JSON.stringify({ result: "PASS", engine: "local redis-server", transport: "HTTPS REST + Next HTTP",
    sessionId, race: { staleStatus: stale.status, staleReason: stale.body.policy.reason, finalVersion: final.version,
      finalRiskState: final.riskState, emergencyMark: true }, productionCommands: counts, evalResults,
    boundaries: boundaryResults, ...(regressions ? { regressions } : {}) }));
} catch (error) {
  console.error(`FAIL cookie-boundaries: ${error.stack || error}`);
  process.exitCode = 1;
} finally {
  if (releaseOpen) releaseOpen();
  await stop(next);
  if (gateway) await new Promise((resolve) => gateway.close(resolve));
  await stop(redis);
  await rm(temp, { recursive: true, force: true });
}
