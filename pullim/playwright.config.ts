import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 10 * 60 * 1000, // 테스트당 최대 10분 (GLM 느림)
  workers: 1,              // 순차 실행 — 서버 하나, 병렬 X
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "on",
    video: "off",
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro 기준
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // 이미 실행 중이면 재사용
    timeout: 60_000,
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "../tests/glm-test-result.json" }],
  ],
});
