// Story 025, the CI round (hak, 2026-11-14; ADR 0014): a test run reads stored data. `VITE_TEST_MODE`
// names the mode a test run has, and `LAZ_FUND` names the fund data the run reads. Both are read by the
// app's own config, which passes them here as data; this module reads no environment, so the rule is
// testable without a run (P17).
//
// The default is the fixture copy, which is what keeps a hand oracle away from the file the writer
// refreshes (AC4). `live` is the mode of the writer's own run, never of a test run: a test that reads a
// moving source has no hand oracle, and CI's checks must not depend on the source staying readable (AC3).

export interface FundRunEnv {
  readonly mode?: string | undefined;
  readonly fund?: string | undefined;
}

/** The data sources a run can name: the stored fixture copy, or the file the writer writes. */
export const FUND_SOURCES = Object.freeze(['fixture', 'committed']);

/** The answer of one run: the mode it named and the data it reads. */
export function fundSourceFor(env: FundRunEnv): { mode: string; fund: string } {
  const mode = env.mode ?? 'local';
  const fund = env.fund ?? 'fixture';
  if (mode === 'live') {
    throw new Error(
      'fundSourceFor: a test run cannot read the live source; `live` is the mode of the writer run (ADR 0014)',
    );
  }
  if (mode !== 'local') {
    throw new Error(`fundSourceFor: unknown test mode "${mode}"; a test run runs in mode local`);
  }
  if (!FUND_SOURCES.includes(fund)) {
    throw new Error(
      `fundSourceFor: unknown fund data source "${fund}"; use ${FUND_SOURCES.join(' or ')}`,
    );
  }
  return { mode, fund };
}
