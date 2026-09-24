import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const ROOT = "/Users/sanggyulee/H/01_프로젝트/resume-repo-alignment/2026-09-24_session";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const exec = promisify(execFile);
const RECEIPTS = {
  redis_rest: ["redis-rest.json", "node pullim/scripts/verify-redis-rest-policy.mjs"],
  http_regressions: ["regressions.json", "node pullim/scripts/verify-policy-regressions.mjs --out <policy-http-24.json>"],
  npm_test: ["npm-test.log", "cd pullim && npm test"],
  typescript: ["tsc.log", "cd pullim && npx tsc --noEmit"],
  build: ["build.log", "cd pullim && npm run build"],
};

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function verifyFile(file, digest) {
  const bytes = await readFile(file);
  requireValue(createHash("sha256").update(bytes).digest("hex") === digest, `SHA-256 mismatch: ${file}`);
  return bytes;
}

function checkRedis(value) {
  requireValue(value.result === "PASS" && value.engine === "local redis-server" && value.transport === "HTTPS REST", "Redis REST receipt failed or has unsupported scope");
  requireValue(value.productionCommands?.GET > 0 && value.productionCommands?.SET > 0 && value.productionCommands?.EVAL > 0, "Redis production commands missing");
  requireValue(value.winners === 1 && value.stale === 1 && value.staleOpen === "rejected" && value.finalRiskState === "emergency", "Redis race or emergency check failed");
}

function checkHttp(value, regression = false) {
  requireValue(value.result === "PASS" && value.engine === "local redis-server" && value.transport === "HTTPS REST + Next HTTP", "Next HTTP receipt failed or has unsupported scope");
  requireValue(value.productionCommands?.GET > 0 && value.productionCommands?.SET > 0 && value.productionCommands?.EVAL > 0, "Next HTTP production commands missing");
  requireValue(value.race?.emergencyMark === true && value.race?.finalRiskState === "emergency" && value.race?.staleReason === "stale_policy_state", "Next HTTP race or emergency check failed");
  const boundaries = new Map(value.boundaries?.map(item => [item.name, item]));
  for (const name of ["empty", "4097_bytes", "bad_signature", "bad_format"]) {
    const item = boundaries.get(name);
    requireValue(item?.status === 400 && item.reason === "invalid_policy_cookie" && item.setCookie === false && item.redisCommands === 0, `Cookie boundary failed: ${name}`);
  }
  if (regression) requireValue(value.regressions?.checks === 24 && value.regressions?.cookieReplay === "PASS", "HTTP regression receipt failed");
}

function checkClaims(text, label) {
  requireValue(!/\b(?:managed|production)\s+(?:redis|service|deployment)\b.{0,30}\b(?:verified|validated|passed|proven)\b/i.test(text), `${label} claims unsupported managed service verification`);
  requireValue(!/(?:관리형|매니지드)\s*(?:Redis|레디스|서비스|환경)?\s*(?:검증|입증|통과|확인)(?:됐다|되었다|완료|함)/i.test(text), `${label} claims unsupported managed service verification`);
  requireValue(!/(?:임상\s*안전성|clinical\s*safety).{0,30}(?:(?<!미)검증(?!하지|되지)|(?<!미)입증(?!하지|되지)|통과|확인(?!하지|되지)|(?<!not )verified|(?<!not )proven)/i.test(text), `${label} claims unsupported clinical safety verification`);
}

export async function verifyPolicyEvidence({
  evidenceDir = path.join(ROOT, "03_evidence/pullim-successor"),
  reportFile = path.join(ROOT, "02_outputs/Pullim_운영경로_검증_보고.md"),
} = {}) {
  const summaryFile = path.join(evidenceDir, "verification-summary.json");
  await rm(summaryFile, { force: true });
  const exits = await readJson(path.join(evidenceDir, "command-exits.json"));
  const { stdout: head } = await exec("git", ["rev-parse", "HEAD"], { cwd: REPO });
  requireValue(exits.schema_version === 2 && exits.result === "PASS" && exits.worktree_commit === head.trim(), "Source revision or run result mismatch");
  requireValue(exits.source_tree_clean === true && exits.source_hashes && Object.keys(exits.source_hashes).length >= 11, "Source provenance missing");
  for (const [name, hash] of Object.entries(exits.source_hashes)) {
    requireValue(name.startsWith("pullim/") && !name.includes(".."), "Invalid source path");
    const bytes = await readFile(path.join(REPO, name));
    requireValue(createHash("sha256").update(bytes).digest("hex") === hash, `Source hash mismatch: ${name}`);
  }
  requireValue(exits.scope === "local redis-server HTTPS REST + Next HTTP synthetic verification", "Command summary scope mismatch");
  requireValue(Array.isArray(exits.receipts), "Command exit receipts missing");
  const recorded = new Map(exits.receipts.map(item => [item.name, item]));
  requireValue(recorded.size === exits.receipts.length, "Duplicate command receipt");
  const build = recorded.get("build");
  requireValue(build?.exit_code === 0 && Number.isFinite(Date.parse(build.finished_at)), "Build provenance missing");
  const verified = {};
  for (const [name, [filename, command]] of Object.entries(RECEIPTS)) {
    const item = recorded.get(name);
    const file = path.join(evidenceDir, filename);
    requireValue(item?.command === command && item.exit_code === 0 && item.file === file && Number.isFinite(Date.parse(item.started_at)) && Number.isFinite(Date.parse(item.finished_at)), `Missing or failing command receipt: ${name}`);
    requireValue(Date.parse(item.started_at) <= Date.parse(item.finished_at), `Invalid command timing: ${name}`);
    const bytes = await verifyFile(file, item.sha256);
    verified[name] = { command, receipt: file, sha256: item.sha256 };
    if (filename.endsWith(".json")) {
      const value = JSON.parse(bytes.toString("utf8"));
      if (name === "redis_rest") checkRedis(value);
      if (name === "next_cookie" || name === "http_regressions") checkHttp(value, name === "http_regressions");
    }
  }
  const httpRepeats = [];
  for (let index = 1; index <= 3; index++) {
    const name = `next_cookie_${index}`;
    const item = recorded.get(name);
    const file = path.join(evidenceDir, `cookie-boundaries-${index}.json`);
    requireValue(item?.command === "node pullim/scripts/verify-cookie-boundaries.mjs" && item.exit_code === 0 && item.file === file, `Missing HTTP repetition: ${name}`);
    requireValue(Date.parse(build.finished_at) <= Date.parse(item.started_at), `HTTP repetition predates build: ${name}`);
    const bytes = await verifyFile(file, item.sha256);
    const value = JSON.parse(bytes.toString("utf8"));
    checkHttp(value);
    requireValue(value.race?.staleStatus === 409 && value.race?.emergencyMark === true, `HTTP repetition failed: ${name}`);
    httpRepeats.push({ name, sessionId: value.sessionId, receipt: file, sha256: item.sha256 });
  }
  requireValue(new Set(httpRepeats.map(item => item.sessionId)).size === 3, "HTTP repetitions did not use distinct sessions");
  requireValue(Date.parse(build.finished_at) <= Date.parse(recorded.get("http_regressions").started_at), "HTTP regressions predate build");
  const legacy = exits.policy_http_24;
  const legacyFile = path.join(evidenceDir, "policy-http-24.json");
  requireValue(legacy?.file === legacyFile && legacy.status === "PASS" && legacy.checks === 24 && legacy.passed === 24, "Legacy HTTP summary failed");
  const legacyBytes = await verifyFile(legacyFile, legacy.sha256);
  const legacyData = JSON.parse(legacyBytes.toString("utf8"));
  requireValue(legacyData.status === "PASS" && legacyData.checks?.length === 24 && legacyData.checks.every(item => item.passed === true), "Legacy HTTP cases failed");
  requireValue(legacyData.checks.some(item => item.name === "old valid cookie cannot roll back emergency"), "Cookie replay case missing");
  const testLog = await readFile(path.join(evidenceDir, "npm-test.log"), "utf8");
  const testCount = Number(testLog.match(/(?:^|\n)(?:#|ℹ) tests (\d+)/)?.[1]);
  const passCount = Number(testLog.match(/(?:^|\n)(?:#|ℹ) pass (\d+)/)?.[1]);
  requireValue(testCount >= 11 && passCount === testCount && /(?:^|\n)(?:#|ℹ) fail 0\b/.test(testLog), "Passing tests not recorded");

  const qa = await readFile(path.join(evidenceDir, "independent-qa.md"), "utf8");
  if (/(?:^|\n)\s*(?:판정|Verdict)\s*:\s*REVISE\b/im.test(qa)) throw new Error("independent-qa.md verdict is REVISE");
  if (/(?:^|\n)\s*(?:판정|Verdict)\s*:\s*FAIL\b/im.test(qa)) throw new Error("independent-qa.md verdict is FAIL");
  requireValue(/(?:^|\n)\s*(?:판정|Verdict)\s*:\s*PASS\b/im.test(qa), "Independent QA is not PASS");
  const report = await readFile(reportFile, "utf8");
  requireValue(/(?:로컬|local).{0,80}(?:Redis|redis-server).{0,80}(?:REST|HTTPS)/i.test(report) && /Next HTTP/i.test(report), "Report omits verified local scope");
  requireValue(/(?:관리형|매니지드|managed).{0,80}(?:미검증|검증하지|unverified|not verified)/i.test(report), "Report omits managed-service limit");
  checkClaims(qa, "QA");
  checkClaims(report, "Report");
  const summary = {
    result: "PASS",
    source_revision: head.trim(),
    scope: "local redis-server HTTPS REST + Next HTTP synthetic verification",
    commands: verified,
    policy_http_24: { receipt: legacyFile, checks: 24, passed: 24 },
    http_repeats: httpRepeats,
    qa_verdict: "PASS",
    qa_file: path.join(evidenceDir, "independent-qa.md"),
    report_file: reportFile,
  };
  await writeFile(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const options = {};
  while (args.length) {
    const flag = args.shift();
    const value = args.shift();
    if (!value || (flag !== "--evidence-dir" && flag !== "--report")) {
      console.error("ERROR: usage: node pullim/scripts/verify-policy-evidence.mjs [--evidence-dir DIR] [--report FILE]");
      process.exit(1);
    }
    options[flag === "--report" ? "reportFile" : "evidenceDir"] = value;
  }
  verifyPolicyEvidence(options).then(
    summary => console.log(JSON.stringify(summary)),
    error => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; },
  );
}
