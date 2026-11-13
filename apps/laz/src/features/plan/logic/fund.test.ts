import { describe, expect, it } from 'vitest';
import { FUND_LIST, FUND_LIST_AS_OF } from './fund.ts';

/**
 * Story 025 AC4: the app's tests read the fixture copy, so refreshing the data file cannot move a
 * hand oracle. The values below are hand-pinned from the fixture copy; the committed data file holds
 * other values (asOf 2026-11-13, fund 2028 with NAV 5677761 micro-euro, the accumulating variant), so
 * this test fails when the app reads that file instead. It compares the app's import with hand values,
 * never with the file it parses (P16), and it is the only test that names the fixture copy as the source.
 */
describe('fund list source (story 025, ADR 0013)', () => {
  it('reads the fixture copy, and the hand values are not the data file values', () => {
    expect(FUND_LIST_AS_OF).toBe('2026-12-31');
    const fund = FUND_LIST.find((row) => row.year === 2028);
    expect(fund).toBeDefined();
    expect(fund?.navMicroEur).toBe(38000000);
    expect(fund?.ytmBp).toBe(200);
    expect(FUND_LIST.map((row) => row.year)).toEqual([2028, 2029, 2030, 2031, 2032, 2033, 2034]);
  });
});
