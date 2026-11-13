import { createAppViteConfig } from '@swfactory/platform/config/vite';
import { fileURLToPath } from 'node:url';

// Story 025, ADR 0013: the tests read the fixture copy, not the file the writer refreshes, so a
// refresh cannot move a hand oracle. `test.alias` covers the vitest run; `resolve.alias` covers the
// Playwright dev server in `--mode e2e`. The app's own import and the production build keep the real
// data file, which is why the alias is conditional on the mode.
const FIXTURE = fileURLToPath(
  new URL('src/features/plan/data/fund-list.fixture.json', import.meta.url),
);
const ALIAS = { '../data/fund-list.json': FIXTURE };

// A config function of `mode`, because the alias must not apply to the production build.
export default (env: { mode: string }) =>
  createAppViteConfig({
    test: { alias: ALIAS },
    ...(env.mode === 'e2e' ? { resolve: { alias: ALIAS } } : {}),
  });
