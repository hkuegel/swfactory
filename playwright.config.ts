import { defineConfig, devices } from '@playwright/test';

// Own port, so reuseExistingServer never picks up a normal `npm run dev` on 5173, which
// would run against real Google instead of the e2e fake (ADR 0003).
const port = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Dev server in mode "e2e": swaps in the fake AuthClient (window.__fakeGoogle).
    command: `npm run dev -- --mode e2e --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
