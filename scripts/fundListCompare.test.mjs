import { describe, expect, it } from 'vitest';
import { compareCommitted, differenceText, fits } from './fundListCompare.mjs';

// Story 025, the CI round (hak, 2026-11-14): the frozen run compares its result with the committed file
// and names each difference. The committed text below is written by hand, and the produced records are
// hand values, so no expectation is computed from the file it checks (P16). No disk, no clock, no request
// (P17).

const COMMITTED = `{
  "asOf": "2026-11-13",
  "funds": [
    {
      "year": 2028,
      "isin": "IE0008UEVOE0",
      "name": "iBonds EUR Corporate UCITS 2028",
      "navMicroEur": 5677761,
      "ytmBp": 376,
      "avgMaturityHundredths": 162,
      "sharesOutstanding": 191664314
    },
    {
      "year": 2029,
      "isin": "IE000SNLFDR7",
      "name": "iBonds EUR Corporate UCITS 2029",
      "navMicroEur": 5850000,
      "ytmBp": 390,
      "avgMaturityHundredths": 205,
      "sharesOutstanding": 98000000
    }
  ]
}
`;

const FUND_2028 = {
  year: 2028,
  isin: 'IE0008UEVOE0',
  name: 'iBonds EUR Corporate UCITS 2028',
  navMicroEur: 5677761,
  ytmBp: 376,
  avgMaturityHundredths: 162,
  sharesOutstanding: 191664314,
};

const FUND_2029 = {
  year: 2029,
  isin: 'IE000SNLFDR7',
  name: 'iBonds EUR Corporate UCITS 2029',
  navMicroEur: 5850000,
  ytmBp: 390,
  avgMaturityHundredths: 205,
  sharesOutstanding: 98000000,
};

describe('the frozen comparison names each difference (story 025, CI round)', () => {
  it('a market value that moved is named with fund, field, committed value and new value', () => {
    // Hand expectation: one difference, NAV, on the 2028 fund; the identity fields are equal, so the
    // result still fits and a `--full` run may write it. The whole table is produced, because a run that
    // produced only one fund would also be named for the fund it did not read.
    const produced = [{ ...FUND_2028, navMicroEur: 5700000 }, FUND_2029];
    const differences = compareCommitted(COMMITTED, produced);
    expect(differences).toEqual([
      {
        fund: 'fund 2028 (IE0008UEVOE0)',
        field: 'navMicroEur',
        committed: '5677761',
        produced: '5700000',
        kind: 'value',
      },
    ]);
    expect(fits(differences)).toBe(true);
    expect(differenceText(differences[0])).toBe(
      'fund 2028 (IE0008UEVOE0): navMicroEur — committed 5677761, new 5700000 (value)',
    );
  });

  it('the file-level asOf is never compared, because a comparison always moves it', () => {
    // Hand expectation: a run date of 2026-11-14 against a committed asOf of 2026-11-13 names nothing;
    // the run date is the writer's own value (ADR 0013), not a field of a fund. The only difference here
    // is the moved NAV of the 2028 fund.
    const differences = compareCommitted(COMMITTED, [
      { ...FUND_2028, navMicroEur: 5700000 },
      FUND_2029,
    ]);
    expect(differences).toHaveLength(1);
    expect(differences[0]?.field).toBe('navMicroEur');
  });

  it('a fund identity that moved does not fit, so a run must not write over it', () => {
    // Hand expectation: the ISIN of the accumulating fund replaced by the distributing one is an identity
    // difference, not a value difference, and the fund is named as the committed file names it.
    const produced = [{ ...FUND_2028, isin: 'IE000264WWY0' }, FUND_2029];
    const differences = compareCommitted(COMMITTED, produced);
    expect(differences.filter((difference) => difference.kind === 'identity')).toEqual([
      {
        fund: 'fund 2028 (IE0008UEVOE0)',
        field: 'isin',
        committed: 'IE0008UEVOE0',
        produced: 'IE000264WWY0',
        kind: 'identity',
      },
    ]);
    expect(fits(differences)).toBe(false);
  });

  it('a fund the committed file does not have, and a committed fund this run did not read, are both named', () => {
    // Hand expectation: the produced table has one fund, the committed file has two, so all three are
    // named as identity differences. This is the case hak named: a run that read six of the seven funds
    // can never be written over the whole table.
    const produced = [
      {
        year: 2030,
        isin: 'IE000Y2BJVK9',
        name: 'iBonds EUR Corporate UCITS 2030',
        navMicroEur: 6000000,
        ytmBp: 400,
        avgMaturityHundredths: 240,
        sharesOutstanding: 90000000,
      },
    ];
    const differences = compareCommitted(COMMITTED, produced);
    expect(
      differences.map((difference) => `${difference.fund} ${difference.field} ${difference.kind}`),
    ).toEqual([
      'fund 2028 (IE0008UEVOE0) fund identity',
      'fund 2029 (IE000SNLFDR7) fund identity',
      'fund 2030 (IE000Y2BJVK9) fund identity',
    ]);
    expect(fits(differences)).toBe(false);
  });

  it('a committed file that cannot be read as the fund list is named and does not fit', () => {
    // Hand expectation: the run cannot compare against a file it cannot read, so it writes nothing.
    const differences = compareCommitted('not a fund list', [FUND_2028]);
    expect(differences).toEqual([
      {
        fund: 'committed file',
        field: 'file',
        committed: 'not readable as the fund list',
        produced: 'the produced table',
        kind: 'identity',
      },
    ]);
    expect(fits(differences)).toBe(false);
  });

  it('the result fits when the run produced the committed table with the same fund identity', () => {
    // Hand expectation: no difference at all, which is the case a `--frozen` run reports as green.
    expect(compareCommitted(COMMITTED, [FUND_2028, FUND_2029])).toEqual([]);
    expect(fits([])).toBe(true);
  });
});
