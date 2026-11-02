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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // Story 008/AC4: the flows of 005 (flag, long press, keyboard, lose, win) once more with
      // the 3D view chosen (minesweeper.spec.ts selects it in its beforeEach).
      name: 'chromium-3d',
      testMatch: 'minesweeper.spec.ts',
      grep: /AC(6|8|9|10):/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Dev server in mode "e2e": swaps in the fake AuthClient (window.__fakeGoogle).
    command: `npm run dev -- --mode e2e --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
