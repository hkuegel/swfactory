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
    reporter: process.env.CI ? 'github' : 'list',
    use: {
      baseURL: `http://localhost:${port}`,
      trace: 'on-first-retry',
      launchOptions: { args: [...(options.launchArgs ?? [])] },
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      {
        name: 'platform',
        testDir: platformE2eDir,
        // The pages spec needs the built `_site/`, not the dev server (story 018).
        testIgnore: '**/pages/**',
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
