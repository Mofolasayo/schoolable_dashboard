import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer:
    process.env.E2E_START === '1'
      ? {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120 * 1000,
        }
      : undefined,
});
