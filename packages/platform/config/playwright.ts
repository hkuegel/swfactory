import { defineConfig, devices, type PlaywrightTestConfig, type Project } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import type { AppOptions, SignedInContent } from '../e2e/fixtures.ts';

// Own port, so reuseExistingServer never picks up a normal `npm run dev` on 5173, which
// would run against real Google instead of the e2e fake (ADR 0003).
const port = 5174;

const platformE2eDir = fileURLToPath(new URL('../e2e', import.meta.url));

export interface AppE2eOptions {
  /** The app's page title; the platform specs expect it as the page's h1. */
  readonly title: string;
  readonly signedInContent: SignedInContent;
  /** Further projects of the app, e.g. a variant of its own specs. */
  readonly extraProjects?: readonly Project<AppOptions>[];
  /** Extra Chromium launch arguments for every project. */
  readonly launchArgs?: readonly string[];
  /**
   * Number of Playwright workers on CI (`process.env.CI`); unset keeps Playwright's default.
   * Locally the default always applies. An app whose specs drive software WebGL sets 1: two
   * workers on the 4-vCPU runner stall its frames and time out its tests (bug 019).
   */
  readonly ciWorkers?: number | undefined;
  /**
   * Tag to leave out of the run (story 039, P34): the config answers `grepInvert` with it, which
   * removes exactly the tests that carry that tag. Unset or blank filters nothing, so a run that is
   * not filtered runs everything. The tag is data, so this config names no group of tests of its own.
   */
  readonly skipTag?: string | undefined;
}

/**
 * Playwright config of an app: its own specs in `./e2e` (project `chromium`) plus the platform's
 * sign-in specs run against the app (project `platform`), on one dev server in mode `e2e`.
 */
export function createAppPlaywrightConfig(
  options: AppE2eOptions,
): PlaywrightTestConfig<AppOptions> {
  // An empty title or signed-in locator would match anything and make the platform specs vacuous.
  if (options.title.trim() === '') {
    throw new Error('createAppPlaywrightConfig: "title" must not be blank');
  }
  if (options.signedInContent.name.trim() === '') {
    throw new Error('createAppPlaywrightConfig: "signedInContent.name" must not be blank');
  }
  return defineConfig<AppOptions>({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    ...(process.env.CI && options.ciWorkers !== undefined ? { workers: options.ciWorkers } : {}),
    reporter: process.env.CI ? 'github' : 'list',
    // Story 039 (P34): a pull-request run names the tag of the tests that compare rendered pixels or
    // frame timing, so the flaky group is left out of the per-commit round and kept in the publishing
    // run and the nightly run. `grep` matches the test title with its tags, so `grepInvert` removes
    // exactly the tagged tests. An unset variable arrives as an empty string and filters nothing.
    ...(options.skipTag ? { grepInvert: new RegExp(options.skipTag) } : {}),
    use: {
      baseURL: `http://localhost:${port}`,
      trace: 'on-first-retry',
      launchOptions: { args: [...(options.launchArgs ?? [])] },
    },
    projects: [
      {
        name: 'chromium',
        // App-owned specs of the built site run by `npm run test:pages`, not on the dev server (bug 020).
        testIgnore: '**/e2e/pages/**',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'platform',
        testDir: platformE2eDir,
        // The pages spec needs the built `_site/`, not the dev server (story 018).
        testIgnore: '**/e2e/pages/**',
        use: {
          ...devices['Desktop Chrome'],
          appTitle: options.title,
          signedInContent: options.signedInContent,
        },
      },
      ...(options.extraProjects ?? []),
    ],
    webServer: {
      // Dev server in mode "e2e": swaps in the fake AuthClient (window.__fakeGoogle).
      command: `npm run dev -- --mode e2e --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
    },
  });
}
