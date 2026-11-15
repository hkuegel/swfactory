import { describe, expect, it } from 'vitest';
import { flatBaseFactor, flatTaxMicroEur } from './flat.ts';
import type { Fund } from './fund.ts';
import { formatEuroMicroEur } from './format.ts';
import type { Phase } from './phase.ts';
import { payoutFactor, payoutPerShareMicroEur, type Tax } from './projection.ts';
import { purchaseRows } from './purchase.ts';

/**
 * Story 045, AC2 and AC3. The hand oracle of the story: fund NAV 100 € = 100.000.000 micro-euro,
 * YTM 5 %, asOf 1.1.2025, fund year 2027, rate 2,24 % (224), tax 26,375 %. Every expected number is
 * written here by hand from the story's rule, and the arithmetic is the tester's own; nothing is read
 * back from `flat.ts` (P16). The year helper is internal, so the base is read through its exported
 * caller (story 026 R3). AC3 compares two shapes of the same rule, the hand sum and the factor form, so
 * its equality does read `flatBaseFactor` and `payoutFactor` — the numbers on both sides are hand
 * literals, which is what keeps it able to break.
 *
 * The order of the assertions is the order P32 needs: each rule can only move the assertion that pins
 * it, because a failing assertion ends the test and the later lines do not run. So the case that pins
 * a rule must be insensitive to the rules pinned below it: the hand sum has asOf on a year start (no
 * month fraction), YTM 5 % (the cap never binds) and a positive gain; the month case has a cap that
 * does not bind (the year's increase is 2,476357 € against the base 1,12 €); the cap case has a
 * positive gain.
 */
const FLAT = { hundredths: 224 };
const TAX: Tax = { on: true, rateMillionths: 263750 };

function fund(year: number, navMicroEur: number, ytmBp: number): Fund {
  return {
    year,
    isin: `DE000HAND${String(year)}`,
    name: 'hand case',
    navMicroEur,
    ytmBp,
    avgMaturityHundredths: 0,
    sharesOutstanding: 0,
  };
}

describe('flat (story 045, AC2: the base of a calendar year)', () => {
  it('AC2: the hand bases, the whole-month rule, the cap, the sign, and the liquidation year', () => {
    // 1. The hand sum of the story: the counted years are 2025 and 2026, the year of liquidation (2027)
    //    does not count (hak's answer of 2026-11-15). 2,24 € + 2,352 € = 4,592 € -> 1.211.140 micro-euro.
    const hand = fund(2027, 100000000, 500);
    expect(flatTaxMicroEur(hand, FLAT, TAX, '2025-01-01')).toBeCloseTo(1211140, 6);

    // 2. The whole-month rule (§ 18 InvStG, hak's answer to Q2): asOf 1.7.2025 puts six whole calendar
    //    months before the acquisition month, so 2025 counts 12 − 6 = 6 months: base 2,24 € × 6/12 =
    //    1,12 € -> 295.400 micro-euro. The cap does not bind here: the year's own increase on the day
    //    count (183 days from 1.7.2025 to 1.1.2026) is 2,476357 €, which is above the base, so this
    //    figure is the month rule alone.
    expect(flatTaxMicroEur(fund(2026, 100000000, 500), FLAT, TAX, '2025-07-01')).toBeCloseTo(
      295400,
      6,
    );

    // 3. The cap: the base cannot be larger than the year's actual increase. YTM 1 % makes the increase
    //    1,00 €, below the base of 2,24 € -> 0,26375 €. Hand: 1.000.000 × 0,26375 % = 263.750 micro-euro.
    expect(flatTaxMicroEur(fund(2026, 100000000, 100), FLAT, TAX, '2025-01-01')).toBeCloseTo(
      263750,
      6,
    );

    // 4. A year whose increase is not positive pays nothing: YTM −5 % -> 0. Positive pair of the same
    //    rule: 2,24 € -> 590.800 micro-euro.
    expect(flatTaxMicroEur(fund(2026, 100000000, -500), FLAT, TAX, '2025-01-01')).toBe(0);
    expect(flatTaxMicroEur(fund(2026, 100000000, 500), FLAT, TAX, '2025-01-01')).toBeCloseTo(
      590800,
      6,
    );

    // 5. N = 1: asOf is inside the fund's own year, so the first and the last year are the same year and
    //    no year counts; no number is invented, the row shows the dash with its reason. Positive pair,
    //    same asOf, the fund one year later: the counted year is 2027, base 2,24 € -> 590.800.
    const asOfInside = '2027-01-01';
    const phase: Phase = { startMonth: '2027-01', endMonth: '2029-12' };
    const rows = purchaseRows(
      [fund(2027, 100000000, 500), fund(2028, 100000000, 500)],
      phase,
      100000,
      TAX,
      FLAT,
      asOfInside,
    );
    expect(rows.map((row) => `${String(row.fundYear)} ${row.flatReason ?? 'figure'}`)).toEqual([
      '2027 no-year-counts',
      '2028 figure',
    ]);
    expect(rows[0]?.flatMicroEur).toBeNull();
    expect(rows[1]?.flatMicroEur).toBeCloseTo(590800, 6);
  });
});

describe('flat (story 045, AC3: no base is taxed twice)', () => {
  it('AC3: the hand sum plus the tax at liquidation equals the rate times the whole gain', () => {
    const hand = fund(2027, 100000000, 500);
    const asOf = '2025-01-01';

    // The tester's own arithmetic on the day count of ADR 0012, which is the difference between the two
    // dates: 1.1.2025 to 31.12.2027 is 1094 days, so ρ = 1,05^(1094/365) = 1,1574702686601952. The story
    // counts 1095 days, which is one day more; the defect is recorded in the Test report (the figures
    // that follow the 1095-day count are 15,7625 € gain and `112,82 €`, and the app cannot reach them).
    const rhoHand = Math.pow(1.05, 1094 / 365);
    // Hand values, written here as literals from the tester's own arithmetic (P16): the hand sum of the
    // counted years, the tax at liquidation, and the sum of both.
    const flatTaxMicro = 1211140; // 0,5908 € + 0,62034 €
    const totalTaxMicro = 4153278.335913; // 26,375 % × 15,747026866 € = 4,153278335913 €

    // The equality AC3 names, read through the factor form (the second implementation), because the rule
    // cannot be asserted by hand alone: no base is taxed twice.
    const taxThroughFactor =
      hand.navMicroEur *
      (rhoHand - payoutFactor(hand, TAX, flatBaseFactor(hand, FLAT, asOf), asOf));
    expect(flatTaxMicro + taxThroughFactor).toBeCloseTo(totalTaxMicro, 6);

    // The fund's own figure is not reduced by the yearly payments (hak's answer of 2026-11-15): the tax
    // at liquidation is 26,375 % of the gain minus the credited bases, so payout per share =
    // 100 € + 15,747026866 € − 2,9421383359126487 € = 112.804.888,53010687 micro-euro -> `112,80 €`.
    // This is the figure the rule "the fund's value is not reduced by the payments" pins.
    expect(
      formatEuroMicroEur(payoutPerShareMicroEur(hand, TAX, flatBaseFactor(hand, FLAT, asOf), asOf)),
    ).toBe('112,80\u00a0€');
  });
});
