import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";
import { createPullimServer } from "../src/server/workbench-server.ts";

const exec = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(repoRoot, "bin/pullim.mjs");

test("HTTP Workbench server serves UI pages and JSON APIs end-to-end", async (t) => {
  const server = createPullimServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.ok, true);
  assert.equal(health.license, "MIT");

  // 2. HTML UI pages
  for (const route of ["/", "/ladder", "/history", "/privacy"]) {
    const pageRes = await fetch(`${baseUrl}${route}`);
    assert.equal(pageRes.status, 200);
    const html = await pageRes.text();
    assert.match(html, /풀림/);
  }

  // 3. POST /api/unravel
  const unravelRes = await fetch(`${baseUrl}/api/unravel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concern: "내 레포를 사람들이 쓸만한 오픈소스로 변화시키고 싶은데 어디서부터 바꿀지 고민이야.",
      lens: "structural",
    }),
  });
  assert.equal(unravelRes.status, 200);
  const unravelData = await unravelRes.json();
  assert.equal(unravelData.result.haltedByCrisis, false);
  assert.equal(unravelData.result.lenses.length, 3);
  assert.match(unravelData.markdown, /풀림\(Pullim\) 사고 구조화 리포트/);

  // 4. POST /api/ladder/start & /api/ladder/step
  const startRes = await fetch(`${baseUrl}/api/ladder/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concern: "할 일이 너무 많아서 막막해요.",
      direction: "up",
    }),
  });
  assert.equal(startRes.status, 200);
  const started = await startRes.json();
  assert.equal(started.session.currentLevel, 1);

  const stepRes = await fetch(`${baseUrl}/api/ladder/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: started.session,
      action: {
        type: "select_option",
        optionId: started.stepCard.options[0].id,
      },
    }),
  });
  assert.equal(stepRes.status, 200);
  const stepped = await stepRes.json();
  assert.equal(stepped.session.currentLevel, 2);
});

test("CLI commands (demo, unravel, ladder, crisis-check) execute cleanly", async () => {
  const { stdout: demoOut } = await exec(process.execPath, [cliPath, "demo", "--json"]);
  const demoJson = JSON.parse(demoOut);
  assert.equal(demoJson.haltedByCrisis, false);
  assert.equal(demoJson.options.filter((o) => o.recommended).length, 1);

  const { stdout: mdOut } = await exec(process.execPath, [
    cliPath,
    "unravel",
    "이직을 해야 할지 남아서 새 프로젝트를 맡을지 고민입니다.",
    "--markdown",
  ]);
  assert.match(mdOut, /# 풀림\(Pullim\) 사고 구조화 리포트/);

  const { stdout: ladderOut } = await exec(process.execPath, [
    cliPath,
    "ladder",
    "머리로는 분석이 끝났는데 마음이 안 움직여요.",
    "--direction",
    "down",
    "--json",
  ]);
  const ladderJson = JSON.parse(ladderOut);
  assert.equal(ladderJson.direction, "down");
  assert.ok(ladderJson.steps.length >= 2);

  const { stdout: crisisOut } = await exec(process.execPath, [
    cliPath,
    "crisis-check",
    "죽고 싶다",
    "--json",
  ]);
  const crisisJson = JSON.parse(crisisOut);
  assert.equal(crisisJson.tier, "A");
});
