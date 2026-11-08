import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PAGES_BASE, PAGES_PORT, SITE_DIR } from './pages.ts';

const serveScript = fileURLToPath(new URL('../../../scripts/serve-pages.mjs', import.meta.url));

/**
 * Smoke test of the GitHub Pages artefact `_site/` (story 018): served by a strict static server
 * under the subpath, like Pages (no SPA fallback). Run by `npm run test:pages` after `build:pages`.
 */
export default defineConfig({
  testDir: '../e2e/pages',
  outputDir: '../test-results/pages',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PAGES_PORT}${PAGES_BASE}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'pages', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node "${serveScript}" "${SITE_DIR}" ${PAGES_BASE} ${PAGES_PORT}`,
    // Port, not url: the site root has no index page, so a url would answer 404.
    port: PAGES_PORT,
    reuseExistingServer: false,
  },
});
