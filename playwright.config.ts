import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.CI
    ? [
        {
          command: 'npm run dev:server',
          url: 'http://localhost:3001/api/health',
          reuseExistingServer: false,
          timeout: 120_000,
        },
        {
          command: 'VITE_API_MODE=true npm run dev -- --host 127.0.0.1 --port 5173',
          url: 'http://127.0.0.1:5173',
          reuseExistingServer: false,
          timeout: 120_000,
        },
      ]
    : [
        {
          command: 'npm run dev:server',
          url: 'http://localhost:3001/api/health',
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: 'VITE_API_MODE=true npm run dev -- --host 127.0.0.1 --port 5173',
          url: 'http://127.0.0.1:5173',
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],
});
