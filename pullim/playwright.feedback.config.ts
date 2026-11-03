import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Synthetic credentials and intercepted host only. Never contact a real project.
export default defineConfig({
  ...base,
  testMatch: 'feedback-submit.spec.ts',
  timeout: 30000,
  use: { ...base.use, baseURL: 'http://localhost:3021' },
  webServer: {
    command: 'npm run dev -- --port 3021',
    url: 'http://localhost:3021',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://feedback-test.invalid',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-feedback-test-key',
    },
  },
});
