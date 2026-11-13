import { defineConfig } from "@playwright/test";

// Synthetic browser auth only. No real account or provider is used.
process.env.PULLIM_AUTH_FIXTURE = "1";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "session-save-ui.spec.ts",
  outputDir: "./.playwright-results/session-save",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3233", headless: true, serviceWorkers: "block",
    viewport: { width: 390, height: 844 },
    ...(process.env.PULLIM_TEST_CHROME ? { launchOptions: { executablePath: process.env.PULLIM_TEST_CHROME, args: ["--no-sandbox"] } } : {}),
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3233",
    url: "http://127.0.0.1:3233", reuseExistingServer: false, timeout: 60000,
    env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3999", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon-not-real", ANTHROPIC_API_KEY: "", GLM_API_KEY: "", OPENAI_API_KEY: "", GOOGLE_AI_API_KEY: "", LLM_MODE: "" },
  },
  reporter: [["list"], ["json", { outputFile: "./.playwright-results/session-save-report.json" }]],
});
