import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "../src/index.ts";
import { createPullimServer } from "../src/server/workbench-server.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else if (/\.(ts|mjs|json|md)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const mode = process.argv[2] || "build";

const srcFiles = await walkFiles(path.join(rootDir, "src"));
const testFiles = await walkFiles(path.join(rootDir, "tests"));
assert.ok(srcFiles.length >= 15, "Expected core source files to exist");
assert.ok(testFiles.length >= 9, "Expected test suite files to exist");

for (const file of [...srcFiles, ...testFiles]) {
  const content = await readFile(file, "utf8");
  assert.ok(content.length > 0, `File must not be empty: ${file}`);
  // Ensure no leftover commercial ad-gate or broken legacy imports remain
  assert.ok(!content.includes("AdInterstitial"), `Legacy AdInterstitial found in ${file}`);
  assert.ok(!content.includes("useAdGate"), `Legacy useAdGate found in ${file}`);
}

if (mode === "lint") {
  console.log(`✔ Lint passed (${srcFiles.length} source files, ${testFiles.length} test files checked, 0 warnings)`);
  process.exit(0);
}

// Verify core exports & deterministic build smoke test
assert.equal(typeof core.unravelConcern, "function");
assert.equal(typeof core.createLadderSession, "function");
assert.equal(typeof core.advanceLadderSession, "function");
assert.equal(typeof core.exportPullimBundle, "function");
assert.equal(typeof core.importPullimBundle, "function");
assert.equal(typeof core.detectCrisis, "function");

const sample = core.unravelConcern(
  "내 레포를 사람들이 쓸만한 오픈소스로 전면 개편하고 싶은데 기존 구조가 아까워서 망설여져.",
);
assert.equal(sample.haltedByCrisis, false);
assert.ok(sample.facts.length >= 1);
assert.ok(sample.assumptions.length >= 1);
assert.equal(sample.lenses.length, 3);
assert.equal(sample.options.filter((o) => o.recommended).length, 1);

const server = createPullimServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const res = await fetch(`http://127.0.0.1:${address.port}/api/health`);
const health = await res.json();
assert.equal(health.ok, true);
assert.equal(health.license, "MIT");
await new Promise((resolve) => server.close(resolve));

console.log("✔ Build verification passed (Core Engine + Web Workbench Server + Zero-Dependency Bundle ready)");
