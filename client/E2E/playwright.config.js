// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Fixture users are now isolated per-test (dynamic usernames) or seeded once
  // via storageState, so nothing here relies on cross-file execution order —
  // safe to run with more than one worker in CI. Capped well under nginx's
  // rate_limit_zone (30r/s, burst 50 — see nginx/nginx.conf) to avoid 503s.
  workers: process.env.CI ? 4 : undefined,
  reporter: 'html',
  // Fails fast with a clear message if the app stack isn't up, instead of
  // every test timing out individually with ERR_CONNECTION_REFUSED.
  globalSetup: './global-setup.js',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Runs to completion before the chromium project starts (see
    // `dependencies` below), regardless of worker count — this is what makes
    // the login/homepage fixture user available deterministically instead of
    // depending on another spec file happening to run first.
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
