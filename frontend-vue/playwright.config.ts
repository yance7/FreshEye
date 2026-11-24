import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/fixtures/production-server.mjs',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
