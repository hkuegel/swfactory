import { createAppViteConfig } from '@swfactory/platform/config/vite';
import { fileURLToPath } from 'node:url';
import { fundSourceFor } from './src/features/plan/logic/fundSource.ts';

// Story 025, ADR 0013: the tests read the fixture copy, not the file the writer refreshes, so a
// refresh cannot move a hand oracle. `test.alias` covers the vitest run; `resolve.alias` covers the
// Playwright dev server in `--mode e2e`. The app's own import and the production build keep the real
// data file, which is why the alias is conditional on the mode.
//
// Story 025, the CI round (hak, 2026-11-14): the names of a run are read here, in the app's own config.
// `VITE_TEST_MODE` is the mode a test run has (`local`), `LAZ_FUND` is the fund data it reads
// (`fixture` or `committed`). The alias applies only when the run names the fixture copy, so the CI checks
// step reads the stored data and the live comparison step reads the file the writer wrote. A run that
// names `live` as its test mode is refused by `fundSourceFor`, which is ADR 0014's rule that a test never
// reaches the source.
const source = fundSourceFor({ mode: process.env.VITE_TEST_MODE, fund: process.env.LAZ_FUND });
const FIXTURE = fileURLToPath(
  new URL('src/features/plan/data/fund-list.fixture.json', import.meta.url),
);
const ALIAS = source.fund === 'fixture' ? { '../data/fund-list.json': FIXTURE } : {};

// A config function of `mode`, because the alias must not apply to the production build.
export default (env: { mode: string }) =>
  createAppViteConfig({
    test: { alias: ALIAS },
    ...(env.mode === 'e2e' ? { resolve: { alias: ALIAS } } : {}),
  });
