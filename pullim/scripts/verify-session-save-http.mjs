import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

// Actual Next and Supabase SDK transport with synthetic auth/RLS HTTP fixtures.
// This does not create an account, contact Supabase, or execute database RLS.
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(path.join(os.tmpdir(), "pullim-session-save-"));
const logPath = path.join(temp, "next.log");
const log = createWriteStream(logPath);
const users = { "synthetic-a": "00000000-0000-4000-8000-000000000001", "synthetic-b": "00000000-0000-4000-8000-000000000002" };
const rows = new Map();
const requests = [];
const checks = [];
let child;
const fixture = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  let text = "";
  for await (const bytes of req) text += bytes;
  const body = text ? JSON.parse(text) : null;
  requests.push({ path: url.pathname, method: req.method, token, userId: body?.user_id });
  const respond = (status, value) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(value)); };
  if (url.pathname === "/auth/v1/user") {
    if (token === "synthetic-outage") return respond(503, { message: "synthetic unavailable" });
    if (!users[token]) return respond(401, { message: "synthetic invalid JWT", code: "bad_jwt" });
    return respond(200, { id: users[token], aud: "authenticated", email: "synthetic@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
  }
  if (url.pathname !== "/rest/v1/sessions") return respond(404, {});
  if (req.method === "POST") {
    if (!users[token] || body.user_id !== users[token] || body.summary === "synthetic-rls-denied") return respond(403, { code: "42501", message: "synthetic RLS rejection" });
    if (rows.has(body.id)) return respond(409, { code: "23505", message: "synthetic duplicate primary key" });
    rows.set(body.id, body);
    return respond(201, {});
  }
  const id = url.searchParams.get("id")?.replace(/^eq\./, "");
  const requestedUser = url.searchParams.get("user_id")?.replace(/^eq\./, "");
  const row = rows.get(id);
  if (row?.summary === "synthetic-read-error") return respond(503, { message: "synthetic read unavailable" });
  return respond(200, row && row.user_id === users[token] && requestedUser === users[token] ? [row] : []);
});
async function freePort() {
  const server = http.createServer(); await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port; await new Promise(r => server.close(r)); return port;
}
try {
  await new Promise(r => fixture.listen(0, "127.0.0.1", r));
  const port = await freePort();
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixture.address().port}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon-not-real" };
  for (const name of ["ANTHROPIC_API_KEY", "GLM_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "LLM_MODE"]) delete env[name];
  child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: app, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(log); child.stderr.pipe(log);
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (child.exitCode !== null) throw new Error("Next exited before ready");
    try { if ((await fetch(`${base}/api/session-save`)).status === 405) { ready = true; break; } } catch { /* starting */ }
    await new Promise(r => setTimeout(r, 200));
  }
  assert(ready, "Next ready");
  const payload = { id: "00000000-0000-4000-8000-000000000003", user_id: users["synthetic-a"], session_id: "synthetic-session", theme: "모험가", summary: "가상 요약", turn_count: 1, cheat_count: 0, messages_count: 2, entry_mode: "concern", created_at: "2026-11-13T00:00:00.000Z" };
  async function post(name, body, token, status, raw = false) {
    const before = requests.length;
    const response = await fetch(`${base}/api/session-save`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: raw ? body : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const result = await response.json(); assert.equal(response.status, status, name);
    if (status === 200) assert.deepEqual(result, { ok: true, storage: "supabase" });
    else assert.equal(result.ok, undefined, name);
    checks.push({ name, status, requests: requests.slice(before), passed: true });
  }
  await post("malformed JSON", "{", null, 400, true);
  await post("null body", null, null, 400);
  await post("missing user", {}, null, 400);
  await post("invalid save ID", { ...payload, id: "bad" }, "synthetic-a", 400);
  assert.equal(requests.length, 0);
  await post("anonymous fails closed", payload, null, 401); assert.equal(requests.length, 0);
  await post("expired identity", payload, "synthetic-expired", 401);
  await post("body user mismatch", { ...payload, user_id: users["synthetic-b"] }, "synthetic-a", 403);
  assert.equal(requests.some(r => r.path === "/rest/v1/sessions"), false);
  await post("verified A persists with A bearer", payload, "synthetic-a", 200);
  await post("same request after lost response is idempotent", payload, "synthetic-a", 200); assert.equal(rows.size, 1);
  await post("same ID altered contents cannot overwrite", { ...payload, summary: "changed" }, "synthetic-a", 409); assert.equal(rows.get(payload.id).summary, payload.summary);
  await post("B cannot reuse A primary key", { ...payload, user_id: users["synthetic-b"] }, "synthetic-b", 409); assert.equal(rows.size, 1);
  await post("verified B has isolated bearer", { ...payload, id: "00000000-0000-4000-8000-000000000004", user_id: users["synthetic-b"] }, "synthetic-b", 200); assert.equal(rows.size, 2);
  const unreadable = { ...payload, id: "00000000-0000-4000-8000-000000000006", summary: "synthetic-read-error" };
  await post("initial save before readback outage", unreadable, "synthetic-a", 200);
  await post("duplicate with unavailable readback is not confirmed", unreadable, "synthetic-a", 503);
  await post("auth outage fails closed", payload, "synthetic-outage", 503);
  await post("database rejection is not success", { ...payload, id: "00000000-0000-4000-8000-000000000005", summary: "synthetic-rls-denied" }, "synthetic-a", 500); assert.equal(rows.size, 3);
  for (const request of requests.filter(r => r.path === "/rest/v1/sessions")) assert.notEqual(request.token, "synthetic-anon-not-real");
  const report = { result: "PASS", scope: "actual local Next route + Supabase SDK against synthetic auth/RLS fixtures, not real login/database/persistence", checks, savedRows: rows.size };
  const out = process.argv.indexOf("--out");
  if (out >= 0) await writeFile(process.argv[out + 1], JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} catch (error) {
  console.error(error.stack || error); console.error(await readFile(logPath, "utf8").catch(() => "")); process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) { child.kill("SIGTERM"); await new Promise(r => child.once("exit", r)); }
  await new Promise(r => fixture.close(r)); log.end(); await rm(temp, { recursive: true, force: true });
}
