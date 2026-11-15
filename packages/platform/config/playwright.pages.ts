import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { PAGES_BASE, PAGES_PORT, SITE_DIR } from './pages.ts';

const serveScript = fileURLToPath(new URL('../../../scripts/serve-pages.mjs', import.meta.url));

export interface PagesE2eOptions {
  /**
   * Tag to leave out of the run (story 039, P34): the config answers `grepInvert` with it, which
   * removes exactly the tests that carry that tag. Unset or blank filters nothing, so a run that is
   * not filtered runs everything. The tag is data, so this config names no group of tests of its own.
   */
  readonly skipTag?: string | undefined;
}

/**
 * Playwright config of the published pages (story 018, P34): the smoke test of the GitHub Pages
 * artefact `_site/`, served by a strict static server under the subpath, like Pages (no SPA fallback).
 * Run by `npm run test:pages` after `build:pages`.
 */
export function createPagesPlaywrightConfig(options: PagesE2eOptions): PlaywrightTestConfig {
  return defineConfig({
    testDir: '../e2e/pages',
    outputDir: '../test-results/pages',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    // Story 039: the same filter as the app config, so a pull-request run leaves out the tagged tests
    // and the publishing run and the nightly run read the whole tree. An unset variable arrives as an
    // empty string and filters nothing.
    ...(options.skipTag ? { grepInvert: new RegExp(options.skipTag) } : {}),
    use: {
      baseURL: `http://localhost:${PAGES_PORT}${PAGES_BASE}`,
      trace: 'on-first-retry',
    },
    projects: [
      { name: 'pages', use: { ...devices['Desktop Chrome'] } },
      {
        // App-owned checks of the production build: apps/<name>/e2e/pages/*.pages.spec.ts (bug 020).
        name: 'app-pages',
        testDir: '../../../apps',
        testMatch: '*/e2e/pages/*.pages.spec.ts',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        // The landing page at the site root: landing/e2e/pages/*.pages.spec.ts (story 021).
        name: 'landing-pages',
        testDir: '../../../landing/e2e/pages',
        testMatch: '*.pages.spec.ts',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
    webServer: {
      command: `node "${serveScript}" "${SITE_DIR}" ${PAGES_BASE} ${PAGES_PORT}`,
      // Port, not url: a url would also work now (the root answers), but port needs no status rule.
      port: PAGES_PORT,
      reuseExistingServer: false,
    },
  });
}

// The config `npm run test:pages` loads: the tag the run names, which is nothing on a run that is not
// filtered (story 039).
export default createPagesPlaywrightConfig({ skipTag: process.env.E2E_SKIP_TAG });
