import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import net from "node:net";
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

test("security boundaries reject unapproved provider endpoints and oversized JSON", async (t) => {
  const server = createPullimServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const rejected = await fetch(`${baseUrl}/api/unravel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      concern: "일반적인 고민",
      config: { provider: "openai", apiKey: "synthetic-secret", baseUrl: "http://127.0.0.1:9" },
    }),
  });
  assert.equal(rejected.status, 200);
  const rejectedData = await rejected.json();
  assert.equal(rejectedData.providerUsed, "builtin");
  assert.match(rejectedData.fallbackReason, /연결 실패/);

  const oversized = await fetch(`${baseUrl}/api/crisis-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": String(1024 * 1024 + 1) },
    body: "{" + "\"text\":\"" + "x".repeat(1024 * 1024 - 10) + "\"}",
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error, "Request body is too large");
});

test("workbench HTML escapes untrusted renderer fields and has no dynamic inline handlers", async (t) => {
  const server = createPullimServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const html = await (await fetch(`http://127.0.0.1:${server.address().port}/`)).text();
  assert.match(html, /function escapeHtml/);
  const uiSource = await readFile(new URL("../src/server/workbench-ui.ts", import.meta.url), "utf8");
  assert.doesNotMatch(uiSource, /onclick=\\\"commitActionFromUnravel/);
  assert.doesNotMatch(uiSource, /onclick=\\\"stepLadder\(\{type:'select_option'/);
});


test("chunked oversized JSON returns 413 and health remains available", async (t) => {
  const server = createPullimServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const response = await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let data = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => { data += chunk; });
    socket.on("error", reject);
    socket.on("end", () => resolve(data));
    socket.on("connect", () => {
      socket.write("POST /api/crisis-check HTTP/1.1\r\nHost: 127.0.0.1\r\nTransfer-Encoding: chunked\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n");
      const chunk = "a".repeat(256 * 1024);
      for (let i = 0; i < 5; i += 1) socket.write(`${chunk.length.toString(16)}\r\n${chunk}\r\n`);
      socket.end("0\r\n\r\n");
    });
  });
  assert.match(response, /HTTP\/1\.1 413/);
  assert.match(response, /Request body is too large/);
  const health = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(health.status, 200);
});
