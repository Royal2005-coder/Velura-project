import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npm run dev -w apps/admin-web -- --port 5174',
    port: 5174,
    reuseExistingServer: true,
    timeout: 15000,
  },
});
