import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { promisify } from "node:util";
import { verifyPolicyEvidence } from "../scripts/verify-policy-evidence.mjs";

const exec = promisify(execFile);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const start = "2026-09-25T00:00:00.000Z";
const end = "2026-09-25T00:00:01.000Z";
const afterBuild = "2026-09-25T00:00:02.000Z";
const commands = {
  npm_test: ["npm-test.log", "cd pullim && npm test"],
  typescript: ["tsc.log", "cd pullim && npx tsc --noEmit"],
  build: ["build.log", "cd pullim && npm run build"],
  redis_rest: ["redis-rest.json", "node pullim/scripts/verify-redis-rest-policy.mjs"],
  http_regressions: ["regressions.json", "node pullim/scripts/verify-policy-regressions.mjs --out <policy-http-24.json>"],
};
const sourceFiles = ["pullim/package.json", "pullim/package-lock.json",
  "pullim/src/lib/safety/policy-state-store.ts", "pullim/src/lib/safety/ultimate-policy.ts",
  "pullim/src/lib/safety/ultimate-guard.ts", "pullim/scripts/verify-redis-rest-policy.mjs",
  "pullim/scripts/verify-cookie-boundaries.mjs", "pullim/scripts/verify-policy-regressions.mjs",
  "pullim/scripts/verify-policy-http.mjs", "pullim/scripts/record-policy-evidence.mjs",
  "pullim/scripts/verify-policy-evidence.mjs"];
const boundaries = ["empty", "4097_bytes", "bad_signature", "bad_format"].map(name =>
  ({ name, status: 400, reason: "invalid_policy_cookie", setCookie: false, redisCommands: 0 }));
const http = (sessionId, regression = false) => ({ result: "PASS", engine: "local redis-server",
  transport: "HTTPS REST + Next HTTP", sessionId, productionCommands: { GET: 3, SET: 1, EVAL: 2 },
  race: { staleStatus: 409, staleReason: "stale_policy_state", emergencyMark: true, finalRiskState: "emergency" },
  boundaries, ...(regression ? { regressions: { checks: 24, cookieReplay: "PASS" } } : {}) });

async function fixture(t) {
  const evidenceDir = await mkdtemp(path.join(os.tmpdir(), "pullim-policy-evidence-"));
  t.after(() => rm(evidenceDir, { recursive: true, force: true }));
  const { stdout: head } = await exec("git", ["rev-parse", "HEAD"], { cwd: repo });
  const exits = { schema_version: 2, result: "PASS", worktree_commit: head.trim(),
    scope: "local redis-server HTTPS REST + Next HTTP synthetic verification", source_tree_clean: true,
    source_hashes: {}, receipts: [] };
  for (const name of sourceFiles) exits.source_hashes[name] = digest(await readFile(path.join(repo, name)));
  async function add(name, filename, command, content, started_at = start) {
    const file = path.join(evidenceDir, filename);
    const bytes = Buffer.from(typeof content === "string" ? content : JSON.stringify(content));
    await writeFile(file, bytes);
    const entry = { name, command, started_at, finished_at: started_at === start ? end : "2026-09-25T00:00:03.000Z",
      exit_code: 0, file, sha256: digest(bytes) };
    exits.receipts.push(entry);
    return entry;
  }
  await add("npm_test", ...commands.npm_test, "ℹ tests 16\nℹ pass 16\nℹ fail 0\n");
  await add("typescript", ...commands.typescript, "");
  await add("build", ...commands.build, "build passed\n");
  await add("redis_rest", ...commands.redis_rest, { result: "PASS", engine: "local redis-server", transport: "HTTPS REST",
    productionCommands: { GET: 3, SET: 1, EVAL: 2 }, winners: 1, stale: 1, staleOpen: "rejected", finalRiskState: "emergency" }, afterBuild);
  for (let index = 1; index <= 3; index++) {
    await add(`next_cookie_${index}`, `cookie-boundaries-${index}.json`, "node pullim/scripts/verify-cookie-boundaries.mjs",
      http(`fixture-${index}`), afterBuild);
  }
  await add("http_regressions", ...commands.http_regressions, http("fixture-regression", true), afterBuild);
  const legacy = { status: "PASS", checks: Array.from({ length: 24 }, (_, index) =>
    ({ name: index === 0 ? "old valid cookie cannot roll back emergency" : `case-${index}`, passed: true })) };
  const legacyFile = path.join(evidenceDir, "policy-http-24.json");
  const legacyBytes = Buffer.from(JSON.stringify(legacy));
  await writeFile(legacyFile, legacyBytes);
  exits.policy_http_24 = { file: legacyFile, sha256: digest(legacyBytes), status: "PASS", checks: 24, passed: 24 };
  await writeFile(path.join(evidenceDir, "command-exits.json"), JSON.stringify(exits));
  const reportFile = path.join(evidenceDir, "report.md");
  await writeFile(path.join(evidenceDir, "independent-qa.md"), "Verdict: PASS\nIndependent fixture review.\n");
  await writeFile(reportFile, "Local Redis HTTPS REST and Next HTTP were verified. Managed production is not verified.\n");
  return { evidenceDir, reportFile };
}

test("complete bounded receipts produce a PASS summary", async t => {
  const input = await fixture(t);
  const summary = await verifyPolicyEvidence(input);
  assert.equal(summary.result, "PASS");
  assert.equal(summary.http_repeats.length, 3);
});

test("REVISE QA removes a stale PASS summary", async t => {
  const input = await fixture(t);
  await verifyPolicyEvidence(input);
  await writeFile(path.join(input.evidenceDir, "independent-qa.md"), "Verdict: REVISE\n");
  await assert.rejects(verifyPolicyEvidence(input), /independent-qa.md verdict is REVISE/);
  await assert.rejects(readFile(path.join(input.evidenceDir, "verification-summary.json")), { code: "ENOENT" });
});

test("REVISE CLI exits 1 with its exact reason and no stdout", async t => {
  const input = await fixture(t);
  await writeFile(path.join(input.evidenceDir, "independent-qa.md"), "Verdict: REVISE\n");
  const script = path.join(repo, "pullim/scripts/verify-policy-evidence.mjs");
  await assert.rejects(exec(process.execPath, [script, "--evidence-dir", input.evidenceDir,
    "--report", input.reportFile], { cwd: repo }), error => {
    assert.equal(error.code, 1);
    assert.equal(error.stdout, "");
    assert.equal(error.stderr, "ERROR: independent-qa.md verdict is REVISE\n");
    return true;
  });
});

test("HTTP receipt before build is rejected", async t => {
  const input = await fixture(t);
  const file = path.join(input.evidenceDir, "command-exits.json");
  const exits = JSON.parse(await readFile(file, "utf8"));
  exits.receipts.find(item => item.name === "next_cookie_2").started_at = "2026-09-24T23:59:59.000Z";
  await writeFile(file, JSON.stringify(exits));
  await assert.rejects(verifyPolicyEvidence(input), /predates build/);
});

test("tampered receipt is rejected", async t => {
  const input = await fixture(t);
  await writeFile(path.join(input.evidenceDir, "redis-rest.json"), '{"result":"PASS"}');
  await assert.rejects(verifyPolicyEvidence(input), /SHA-256 mismatch/);
});

test("changed source hash is rejected", async t => {
  const input = await fixture(t);
  const file = path.join(input.evidenceDir, "command-exits.json");
  const exits = JSON.parse(await readFile(file, "utf8"));
  exits.source_hashes["pullim/src/lib/safety/policy-state-store.ts"] = "0".repeat(64);
  await writeFile(file, JSON.stringify(exits));
  await assert.rejects(verifyPolicyEvidence(input), /Source hash mismatch/);
});

test("unsupported managed-service claim is rejected", async t => {
  const input = await fixture(t);
  await writeFile(input.reportFile, "Local Redis HTTPS REST and Next HTTP. Managed production is not verified. Managed Redis is verified.\n");
  await assert.rejects(verifyPolicyEvidence(input), /unsupported managed service/);
});

test("unsupported clinical-safety claim is rejected", async t => {
  const input = await fixture(t);
  await writeFile(input.reportFile, "Local Redis HTTPS REST and Next HTTP. Managed production is not verified. Clinical safety is proven.\n");
  await assert.rejects(verifyPolicyEvidence(input), /unsupported clinical safety/);
});
