import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuroMicroEur } from './format.ts';
import { payoutPerShareMicroEur } from './projection.ts';
import {
  BUNDESLAENDER,
  DEFAULT_BUNDESLAND,
  effectiveRate,
  taxFromState,
  taxParts,
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

/**
 * The flat base factor is 0 here (story 045): the flat field is prefilled with 2,24, so the existing hand
 * values of the tax case are kept by reading the rate as 0 — `ρ′ = ρ − r × max(0, ρ − 1 − 0)`, which is
 * exactly the value ADR 0012 gives (AC3 of 024 holds while the flat rate is 0).
 */
const FLAT_BASE = 0;

/** Hand payout per share on NAV 40,00 € with the factor 2: 40 × (2 − rate), the rate by § 32d EStG. */
const HAND_PAYOUT = {
  off: 80000000,
  kst: 69450000,
  kist8: 40000000 * (2 - 0.278186274509804),
  kist9: 40000000 * (2 - 0.279951100244499),
} as const;

/** The AC1 oracle of story 048, written by hand: a gain of 1.000,00 € in cents, KapESt / Soli / KiSt. */
const GAIN_MICRO = 1000_000_000;

describe('tax (story 048 AC1, the rates by § 32d EStG)', () => {
  it('AC1: the hand oracle for a gain of 1.000,00 €, without KiSt, with 8 % and with 9 %', () => {
    const cents = (state: TaxState) => {
      const parts = taxParts(GAIN_MICRO / 10000, state);
      return [parts.kapESt, parts.soli, parts.kist].map((value) => Math.round(value));
    };
    // Hand: 250 / 1,02 = 245,098 € (245,10), 5,5 % of it 13,480 € (13,48), 8 % of it 19,608 € (19,61).
    expect(cents(state(true, false))).toEqual([25000, 1375, 0]);
    expect(cents(state(true, true, 'bayern'))).toEqual([24510, 1348, 1961]);
    expect(cents(state(true, true, 'berlin'))).toEqual([24450, 1345, 2200]);
    // The total, by hand: 263,75 € / 278,19 € / 279,95 €.
    const total = (s: TaxState) => Math.round((effectiveRate(s) * GAIN_MICRO) / 10000);
    expect(total(state(true, false))).toBe(26375);
    expect(total(state(true, true, 'bayern'))).toBe(27819);
    expect(total(state(true, true, 'berlin'))).toBe(27995);
    // The church tax lowers the KapESt, so the three parts do not exceed 25 % + 5,5 % of it + k of it.
    expect(taxParts(1000, state(false, true, 'bayern'))).toEqual({ kapESt: 0, soli: 0, kist: 0 });
  });

  it('AC1: the same rate taxes the proceeds at liquidation, and the BL select lists 8 % and 9 %', () => {
    for (const [on, payout] of [
      [false, HAND_PAYOUT.off],
      [true, HAND_PAYOUT.kst],
    ] as const) {
      const tax = taxFromState(state(on, false));
      expect(payoutPerShareMicroEur(HAND_FUND, tax, FLAT_BASE, AS_OF)).toBeCloseTo(payout, 3);
    }
    expect(formatEuroMicroEur(HAND_PAYOUT.kst)).toBe('69,45\u00a0€');
    for (const [land, payout] of [
      ['bayern', HAND_PAYOUT.kist8],
      ['baden-wuerttemberg', HAND_PAYOUT.kist8],
      ['berlin', HAND_PAYOUT.kist9],
    ] as const) {
      const tax = taxFromState(state(true, true, land));
      expect(payoutPerShareMicroEur(HAND_FUND, tax, FLAT_BASE, AS_OF)).toBeCloseTo(payout, 3);
    }
    // A checkbox change cannot produce an invalid value, so there is no error state to test here.
    expect(taxFromState(state(false, true))).toEqual({ on: false, rateMillionths: 0 });
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

  it('AC3: the model keeps a hand rate of 100 % as a model-level case, and a negative gain stays untaxed', () => {
    const hand = { on: true, rateMillionths: 1000000 };
    expect(payoutPerShareMicroEur(HAND_FUND, hand, FLAT_BASE, AS_OF)).toBe(40000000);
    const loss: Fund = { ...HAND_FUND, ytmBp: -100 };
    expect(payoutPerShareMicroEur(loss, taxFromState(state(true, false)), FLAT_BASE, AS_OF)).toBe(
      39600000,
    );
  });
});
