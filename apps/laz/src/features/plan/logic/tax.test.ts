import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuroMicroEur } from './format.ts';
import { payoutPerShareMicroEur } from './projection.ts';
import {
  BUNDESLAENDER,
  DEFAULT_BUNDESLAND,
  churchTaxMillionths,
  effectiveRateMillionths,
  taxFromState,
  type TaxState,
} from './tax.ts';

/**
 * Hand case, exact by construction (the architect rule of story 024): asOf on a year boundary and the
 * fund's liquidation exactly 365 days later, so the projection factor is 2 with a hand YTM of 100 %, and
 * the tax is a plain multiplication. Hand: NAV 40,00 € and the rate as a percent of the gain.
 */
const AS_OF = '2028-12-31';
const HAND_FUND: Fund = {
  year: 2029,
  isin: 'DE000HAND1',
  name: 'hand case',
  navMicroEur: 40000000,
  ytmBp: 10000,
  avgMaturityHundredths: 360,
  sharesOutstanding: 1000000,
};

function state(kstOn: boolean, kistOn: boolean, bundesland = DEFAULT_BUNDESLAND): TaxState {
  return { kstOn, kistOn, bundesland };
}

/** The hand rates, written as percent of the gain: 25 % + 1,375 % SolZ, plus 2 % or 2,25 % church tax. */
const HAND = {
  off: 0,
  kst: 263750,
  kist8: 283750,
  kist9: 286250,
} as const;

/** Hand payout per share on NAV 40,00 € with the factor 2: 40 × (2 − rate). */
const HAND_PAYOUT = {
  off: 80000000,
  kst: 69450000,
  kist8: 68650000,
  kist9: 68550000,
} as const;

describe('tax (story 031, the statutory rates)', () => {
  it('AC1: the KSt checkbox is 26,375 % on the gain, and unchecked the result is exactly the pre-tax projection', () => {
    expect(effectiveRateMillionths(state(false, false))).toBe(HAND.off);
    expect(effectiveRateMillionths(state(true, false))).toBe(HAND.kst);
    for (const [on, payout] of [
      [false, HAND_PAYOUT.off],
      [true, HAND_PAYOUT.kst],
    ] as const) {
      const tax = taxFromState(state(on, false));
      expect(payoutPerShareMicroEur(HAND_FUND, tax, AS_OF)).toBe(payout);
      expect(formatEuroMicroEur(payout)).toBe(on ? '69,45\u00a0€' : '80,00\u00a0€');
    }
    // A checkbox change cannot produce an invalid value, so there is no error state to test here.
    expect(taxFromState(state(false, true))).toEqual({ on: false, rateMillionths: 0 });
  });

  it('AC2: 8 % for Bayern and Baden-Württemberg, 9 % for every other Bundesland, measured as effective rates', () => {
    expect(effectiveRateMillionths(state(true, true, 'bayern'))).toBe(HAND.kist8);
    expect(effectiveRateMillionths(state(true, true, 'baden-wuerttemberg'))).toBe(HAND.kist8);
    expect(effectiveRateMillionths(state(true, true, 'berlin'))).toBe(HAND.kist9);
    expect(
      payoutPerShareMicroEur(HAND_FUND, taxFromState(state(true, true, 'bayern')), AS_OF),
    ).toBe(HAND_PAYOUT.kist8);
    expect(
      payoutPerShareMicroEur(HAND_FUND, taxFromState(state(true, true, 'berlin')), AS_OF),
    ).toBe(HAND_PAYOUT.kist9);
    // The church tax is computed on the KSt, so it is ignored while the KSt checkbox is unchecked.
    expect(churchTaxMillionths(state(false, true, 'bayern'))).toBe(0);
    expect(
      payoutPerShareMicroEur(HAND_FUND, taxFromState(state(false, true, 'bayern')), AS_OF),
    ).toBe(HAND_PAYOUT.off);

    // The select's list: 16 Bundesländer, Bayern first (hak's default of 2026-11-13), each naming the rate
    // it uses. Hand: two states at 8 %, fourteen at 9 %.
    expect(BUNDESLAENDER.length).toBe(16);
    expect(BUNDESLAENDER[0]?.id).toBe('bayern');
    const eight = BUNDESLAENDER.filter((land) => land.kistPercent === 8).map((land) => land.name);
    expect(eight).toEqual(['Bayern', 'Baden-Württemberg']);
    expect(
      BUNDESLAENDER.filter((land) => land.kistPercent !== 8).every(
        (land) => land.kistPercent === 9,
      ),
    ).toBe(true);
  });

  it('AC3: the model keeps a hand rate of 100 % as a model-level case, which the form cannot reach any more', () => {
    // No control can produce 100 %: the checkboxes are on or off, so this stays a hand value.
    const hand = { on: true, rateMillionths: 1000000 };
    expect(payoutPerShareMicroEur(HAND_FUND, hand, AS_OF)).toBe(40000000);
    // A fund whose gain is negative stays untaxed (024 AC4), here with the KSt rate.
    const loss: Fund = { ...HAND_FUND, ytmBp: -100 };
    // Hand: factor 0,99 for YTM -1 % over exactly one year, so the payout is 40 × 0,99 = 39,60 €
    // = 39600000 micro-euro and no tax is taken, because the base is max(0, gain).
    expect(payoutPerShareMicroEur(loss, taxFromState(state(true, false)), AS_OF)).toBe(39600000);
  });
});
