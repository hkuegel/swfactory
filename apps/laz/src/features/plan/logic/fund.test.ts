import { describe, expect, it } from 'vitest';
import { FUND_LIST, FUND_LIST_AS_OF } from './fund.ts';

/**
 * Story 025 AC4: the app's tests read the fixture copy, so refreshing the data file cannot move a
 * hand oracle. The values below are hand-pinned from the fixture copy; the committed data file holds
 * the writer's values, which are different (its last live run of 2026-11-14 stamps asOf 2026-11-14 and
 * fund 2028 with NAV 5677917 micro-euro), so this test fails when the app reads that file instead. It
 * compares the app's import with hand values, never with the file it parses (P16), and it is the only
 * test that names the fixture copy as the source.
 * Story 025's CI round (hak, 2026-11-14) names this source in the CI checks step with `LAZ_FUND=fixture`
 * and `VITE_TEST_MODE=local`, so the source is stated by the run, not by a default; `fundSource.test.ts`
 * holds that rule and refuses a test run that names the live source.
 * Story 035 (hak, 2026-11-14) extends the copy with the two boundary funds, 2027 and 2035. The two new
 * rows are hand values that continue the steps the copy already uses: nav +2.000.000 micro-euro,
 * ytm +50 basis points, maturity +100 hundredths, shares +100.000 per year.
 */
describe('fund list source (story 025, ADR 0013)', () => {
  it('reads the fixture copy, and the hand values are not the data file values', () => {
    expect(FUND_LIST_AS_OF).toBe('2026-12-31');
    const fund = FUND_LIST.find((row) => row.year === 2028);
    expect(fund).toBeDefined();
    expect(fund?.navMicroEur).toBe(38000000);
    expect(fund?.ytmBp).toBe(200);

    // Story 035 AC1, the data the phase boundary years need: nine funds, in year order, 2027 first.
    // Hand expectation for the two new rows.
    expect(FUND_LIST.map((row) => row.year)).toEqual([
      2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
    ]);
    const boundary = [2027, 2035].map((year) => FUND_LIST.find((row) => row.year === year));
    expect(boundary.map((row) => `${row?.isin} ${row?.navMicroEur} ${row?.ytmBp}`)).toEqual([
      'DE000FIX27 36000000 150',
      'DE000FIX35 52000000 550',
    ]);
  });
});
