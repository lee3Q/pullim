import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const app = path.join(repo, "pullim");
const defaultEvidence = "/Users/sanggyulee/H/01_프로젝트/resume-repo-alignment/2026-09-24_session/03_evidence/pullim-successor";
const options = {};
const args = process.argv.slice(2);
while (args.length) {
  const flag = args.shift();
  const value = args.shift();
  if (!value || !["--out-dir", "--inject-failure-at", "--inject-timeout-at", "--inject-hang-at", "--inject-dirty-at"].includes(flag)) {
    throw new Error("usage: node pullim/scripts/record-policy-evidence.mjs [--out-dir DIR] [--inject-failure-at NAME] [--inject-timeout-at NAME] [--inject-hang-at NAME] [--inject-dirty-at final]");
  }
  options[flag] = value;
}
const evidenceDir = path.resolve(options["--out-dir"] ?? defaultEvidence);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const now = () => new Date().toISOString();
const receipts = [];
const httpRepeats = [];
async function trackedFiles() {
  const { stdout } = await exec("git", ["ls-files", "-z", "pullim"], { cwd: repo, encoding: "buffer", maxBuffer: 4 * 1024 * 1024 });
  return stdout.toString().split("\0").filter(Boolean).sort();
}

async function run({ name, command, file, args, cwd = repo, json = false, timeout = 180000, outputFile }) {
  const started_at = now();
  let stdout = "";
  let stderr = "";
  let exit_code = 0;
  if (options["--inject-failure-at"] === name || options["--inject-timeout-at"] === name) {
    exit_code = options["--inject-timeout-at"] === name ? 124 : 1;
    stderr = `injected ${exit_code === 124 ? "timeout" : "interruption"} at ${name}\n`;
  } else {
    try {
      const hang = options["--inject-hang-at"] === name;
      ({ stdout, stderr } = await exec(hang ? process.execPath : file,
        hang ? ["-e", "setInterval(() => {}, 1000)"] : args,
        { cwd, timeout: hang ? 250 : timeout, maxBuffer: 16 * 1024 * 1024 }));
    } catch (error) {
      stdout = error.stdout ?? "";
      stderr = error.stderr ?? String(error);
      exit_code = error.killed || error.signal ? 124 : Number.isInteger(error.code) ? error.code : 1;
      if (options["--inject-hang-at"] === name && exit_code === 124)
        stderr += `\nreal child process timed out at ${name}\n`;
    }
  }
  const finished_at = now();
  const bytes = Buffer.from(json ? stdout : stdout + (stderr ? `\n[stderr]\n${stderr}` : ""));
  const receiptFile = path.join(evidenceDir, outputFile);
  await writeFile(receiptFile, bytes);
  const receipt = { name, command, started_at, finished_at, exit_code, file: receiptFile, sha256: sha256(bytes) };
  if (options["--inject-hang-at"] === name) receipt.injection = "real_child_timeout";
  if (json && stderr) {
    const stderrFile = `${receiptFile}.stderr.log`;
    await writeFile(stderrFile, stderr);
    receipt.stderr_file = stderrFile;
    receipt.stderr_sha256 = sha256(Buffer.from(stderr));
  }
  receipts.push(receipt);
  if (exit_code !== 0) throw new Error(`${name} failed with exit ${exit_code}; see ${receiptFile}`);
  if (json) {
    try { JSON.parse(stdout); } catch { throw new Error(`${name} returned invalid JSON`); }
  }
  return { receipt, stdout };
}

await mkdir(evidenceDir, { recursive: true });
await rm(path.join(evidenceDir, "verification-summary.json"), { force: true });
const { stdout: head } = await exec("git", ["rev-parse", "HEAD"], { cwd: repo });
const { stdout: dirty } = await exec("git", ["status", "--porcelain"], { cwd: repo });
if (dirty.trim()) throw new Error("source worktree is dirty; commit source before recording evidence");
const worktree_commit = head.trim();
const source_hashes = {};
for (const name of await trackedFiles()) source_hashes[name] = sha256(await readFile(path.join(repo, name)));
const summary = {
  schema_version: 2,
  observed_at: now(),
  worktree_commit,
  source_tree_clean: true,
  source_hashes,
  scope: "local redis-server HTTPS REST + Next HTTP synthetic verification",
  receipts,
  http_repeats: httpRepeats,
};

try {
  await run({ name: "npm_test", command: "cd pullim && npm test", file: "npm", args: ["test"], cwd: app, outputFile: "npm-test.log" });
  await run({ name: "typescript", command: "cd pullim && npx tsc --noEmit", file: "npx", args: ["tsc", "--noEmit"], cwd: app, outputFile: "tsc.log" });
  await run({ name: "build", command: "cd pullim && npm run build", file: "npm", args: ["run", "build"], cwd: app, outputFile: "build.log", timeout: 300000 });
  await run({ name: "redis_rest", command: "node pullim/scripts/verify-redis-rest-policy.mjs", file: process.execPath,
    args: ["pullim/scripts/verify-redis-rest-policy.mjs"], json: true, outputFile: "redis-rest.json" });
  for (let index = 1; index <= 3; index++) {
    const name = `next_cookie_${index}`;
    const result = await run({ name, command: "node pullim/scripts/verify-cookie-boundaries.mjs", file: process.execPath,
      args: ["pullim/scripts/verify-cookie-boundaries.mjs"], json: true, outputFile: `cookie-boundaries-${index}.json` });
    httpRepeats.push(result.receipt);
  }
  const legacyFile = path.join(evidenceDir, "policy-http-24.json");
  await run({ name: "http_regressions", command: "node pullim/scripts/verify-policy-regressions.mjs --out <policy-http-24.json>",
    file: process.execPath, args: ["pullim/scripts/verify-policy-regressions.mjs", "--out", legacyFile], json: true,
    outputFile: "regressions.json" });
  const legacyBytes = await readFile(legacyFile);
  const legacy = JSON.parse(legacyBytes.toString("utf8"));
  summary.policy_http_24 = { file: legacyFile, sha256: sha256(legacyBytes), status: legacy.status,
    checks: legacy.checks?.length, passed: legacy.checks?.filter((item) => item.passed).length };
  if (options["--inject-dirty-at"] === "final") {
    await appendFile(path.join(repo, "pullim/README.md"), "\n<!-- synthetic final-dirty probe -->\n");
    summary.final_dirty_injection = true;
  }
  summary.result = "PASS";
} catch (error) {
  summary.result = "FAIL";
  summary.error = String(error.message);
  process.stderr.write(`${summary.error}\n`);
  process.exitCode = 1;
} finally {
  const { stdout: dirtyEnd } = await exec("git", ["status", "--porcelain"], { cwd: repo });
  summary.source_tree_clean_end = !dirtyEnd.trim();
  if (!summary.source_tree_clean_end) {
    summary.result = "FAIL";
    summary.error = "source worktree became dirty during evidence recording";
    process.exitCode = 1;
  }
  summary.finished_at = now();
  await writeFile(path.join(evidenceDir, "command-exits.json"), `${JSON.stringify(summary, null, 2)}\n`);
}
if (summary.result === "PASS") process.stdout.write(`${JSON.stringify(summary)}\n`);
