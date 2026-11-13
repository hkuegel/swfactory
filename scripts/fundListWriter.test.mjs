import { describe, expect, it } from 'vitest';
import { buildFileJson } from './fundListWriter.mjs';

// Story 025, AC4: the writer's output is the shape the app reads (ADR 0013). The expected text is written
// by hand here, not produced by the module under test, so the assertion is an oracle and not a copy of the
// writer's own formatting. No repository read, no request, no clock (P17); the run date is passed in.

const RECORD_2028 = {
  year: 2028,
  isin: 'IE0008UEVOE0',
  name: 'iBonds EUR Corporate UCITS 2028',
  navMicroEur: 5113521,
  ytmBp: 376,
  avgMaturityHundredths: 162,
  sharesOutstanding: 269922969,
};

const RECORD_2030 = {
  year: 2030,
  isin: 'IE000Y2BJVK9',
  name: 'iBonds EUR Corporate UCITS 2030',
  navMicroEur: 42000000,
  ytmBp: 300,
  avgMaturityHundredths: 362,
  sharesOutstanding: 1200000,
};

/** The whole expected file, written by hand: asOf first, funds by year. */
const HAND_FILE = `{
  "asOf": "2026-11-13",
  "funds": [
    {
      "year": 2028,
      "isin": "IE0008UEVOE0",
      "name": "iBonds EUR Corporate UCITS 2028",
      "navMicroEur": 5113521,
      "ytmBp": 376,
      "avgMaturityHundredths": 162,
      "sharesOutstanding": 269922969
    },
    {
      "year": 2030,
      "isin": "IE000Y2BJVK9",
      "name": "iBonds EUR Corporate UCITS 2030",
      "navMicroEur": 42000000,
      "ytmBp": 300,
      "avgMaturityHundredths": 362,
      "sharesOutstanding": 1200000
    }
  ]
}
`;

describe('fund list writer, the file it produces (AC4)', () => {
  it('the output equals the hand-written file, with asOf first and the funds ordered by year', () => {
    expect(buildFileJson([RECORD_2030, RECORD_2028], '2026-11-13')).toBe(HAND_FILE);
  });

  it('the fields of a produced record are the fields of the app interface, written by hand', () => {
    const parsed = JSON.parse(buildFileJson([RECORD_2028], '2026-11-13'));
    expect(Object.keys(parsed)).toEqual(['asOf', 'funds']);
    expect(Object.keys(parsed.funds?.[0] ?? {})).toEqual([
      'year',
      'isin',
      'name',
      'navMicroEur',
      'ytmBp',
      'avgMaturityHundredths',
      'sharesOutstanding',
    ]);
    expect(parsed.asOf).toBe('2026-11-13');
    expect(parsed.funds?.[0]?.navMicroEur).toBe(5113521);
  });

  it('a run date that is not an ISO calendar date, and an empty record list, are refused before anything is written', () => {
    expect(() => buildFileJson([RECORD_2028], '13.11.2026')).toThrow('not an ISO calendar date');
    expect(() => buildFileJson([], '2026-11-13')).toThrow('no fund record to write');
  });
});
