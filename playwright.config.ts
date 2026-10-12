import { defineConfig, devices } from '@playwright/test'

// Isolated frontend/backend fixtures: server permission reads must never reach real BE.
process.env.WORKSPACE_TEST_BASE_URL = 'http://localhost:3210'
process.env.SESSION_SECRET = 'splitly-local-playwright-session-fixture'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.WORKSPACE_TEST_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'chrome' },
    },
  ],
  webServer: [
    {
      command: 'node tests/helpers/permissions-backend.mjs',
      url: 'http://127.0.0.1:3211/health',
      reuseExistingServer: false,
    },
    {
      command:
        'npm exec -- cross-env NODE_ENV=production next start --hostname 127.0.0.1 --port 3210',
      url: process.env.WORKSPACE_TEST_BASE_URL,
      env: {
        BACKEND_API_URL: 'http://127.0.0.1:3211',
        SESSION_SECRET: process.env.SESSION_SECRET,
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
