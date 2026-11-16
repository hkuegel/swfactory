import { describe, expect, it } from 'vitest';
// Story 046 AC5: `purchaseRows` gained `deposit` after `flat`; these hand values are the control case, so the
// call site passes `DEPOSIT_OFF` and the values do not move.
import { DEPOSIT_OFF, type DepositOption } from './deposit.ts';
import { FLAT_OFF } from './flat.ts';
import type { Fund } from './fund.ts';
import { formatEuro, formatShares, roundEuroCents } from './format.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { purchaseRows } from './purchase.ts';

/**
 * Story 032, AC2 and the branch of AC3 that the UI cannot reach by hand (a payout per share of 0). The
 * displayed figures are tested in `e2e/laz.spec.ts`, so this file only tests the rule and the money rule.
 * Hand oracles, recomputed from the fixture copy by hand (spans asOf 2026-12-31 → 31.12. of the fund year),
 * with the two funds story 035 adds at both ends of the copy:
 *   ρ = 1,0150000 (2027) · 1,0404564 (2028) · 1,0769635 (2029) · 1,1256000 (2030) · 1,1877983 (2031) ·
 *   1,2655910 (2032) · 1,3611901 (2033) · 1,4778505 (2034) · 1,6195693 (2035); F for the example phase
 *   01.2028–03.2034 = 66,947895916, so depot 1.000.000 Cent gives 14.936,989225972 Cent per month. The
 *   values are hand-pinned, never read back from the module (P16).
 */
const AS_OF = '2026-12-31';
const TAX_OFF: Tax = { on: false, rateMillionths: 0 };

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

/** The fixture copy's nine funds, the fund table's own order (story 035 adds the boundary funds). */
const HAND_FUNDS = [
  fund(2027, 36000000, 150),
  fund(2028, 38000000, 200),
  fund(2029, 40000000, 250),
  fund(2030, 42000000, 300),
  fund(2031, 44000000, 350),
  fund(2032, 46000000, 400),
  fund(2033, 48000000, 450),
  fund(2034, 50000000, 500),
  fund(2035, 52000000, 550),
];

describe('purchase (story 032, AC3: no number invented)', () => {
  it('a fund outside the phase shows no number and names why', () => {
    // Case C, hand: phase 01.2030–12.2030. Funds 2027 and 2028 liquidate before the phase begins, fund
    // 2029 funds the phase year 2030, and the funds 2030 and later liquidate after the phase end —
    // including the new boundary fund 2035, whose phase year 2036 is outside this phase (story 035).
    // Monthly is the hand value 1.000.000 Cent / F (F = 12 / 1,0769573 = 11,142439108464284).
    const phase: Phase = { startMonth: '2030-01', endMonth: '2030-12' };
    const rows = purchaseRows(HAND_FUNDS, phase, 8974.695668207478, TAX_OFF, FLAT_OFF);
    expect(rows.map((row) => `${String(row.fundYear)} ${row.reason ?? ''}`)).toEqual([
      '2027 before-phase-start',
      '2028 before-phase-start',
      '2029 ',
      '2030 after-phase-end',
      '2031 after-phase-end',
      '2032 after-phase-end',
      '2033 after-phase-end',
      '2034 after-phase-end',
      '2035 after-phase-end',
    ]);
    // The fund inside the phase keeps its hand figures: 25,00 shares and 1.000,00 € at its NAV.
    const insideIndex = rows.findIndex((row) => row.fundYear === 2029);
    const inside = rows[insideIndex];
    expect(inside?.shares).toBeDefined();
    expect(formatShares(inside?.shares as number)).toBe('25,00');
    expect(roundEuroCents(inside?.purchaseMicroEur ?? 0)).toBe(100000);
    // No figure is invented for a row without a purchase.
    expect(rows[0]?.purchaseMicroEur).toBeNull();
  });

  it('a payout per share of 0 is not divided by', () => {
    // A typed YTM of −100 % (the YTM cell's own minimum, so the form can produce this) makes the factor 0,
    // so `amount / payout per share` has no number: the guard names the reason instead of inventing one,
    // which the e2e test shows through the input. Hand values: 12 phase months × 100.000 Cent.
    const phase: Phase = { startMonth: '2029-01', endMonth: '2029-12' };
    const rows = purchaseRows([fund(2028, 38000000, -10000)], phase, 100000, TAX_OFF, FLAT_OFF);
    expect(rows[0]?.shares).toBeNull();
    expect(rows[0]?.purchaseMicroEur).toBeNull();
    expect(rows[0]?.reason).toBe('no-payout-per-share');
    // The year amount itself is still the model's number, and the shown total keeps its own figure.
    expect(rows[0]?.yearAmountMicroEur).toBe(12000000000);
    // asOf is the fixture copy's date, which the projection label reads (024 AC5).
    expect(AS_OF).toBe('2026-12-31');
  });
});

/**
 * Story 046, AC5: `shares` follows the money that must be there at the START of the phase year, so the fund
 * row and the year row cannot show two numbers for one year. Hand oracles, the tester's own arithmetic on the
 * fixture copy (asOf 2026-12-31), never read back from `deposit.ts` or `purchase.ts` (P16). Case B: phase
 * 01.2031–12.2033, tax 26,375 %, flat 2,24 %, monthly target 100,00 € = 10.000 Cent. The interest of one full
 * phase year is `100,00 € × 2,50 % × 6,5 = 16,25 €` and its tax `16,25 € × 26,375 % = 4,2859375 €`, so the
 * money at the start of each of the three phase years is `1.200.000.000 µ€ − 11.964.062,5 µ€ =
 * 1.188.035.937,5 µ€`. `ON_250` is the option on at `2,50 %`; `DEPOSIT_OFF` is the control (risk 1).
 */
const ON_250: DepositOption = { on: true, hundredths: 250 };
const CASE_B: Phase = { startMonth: '2031-01', endMonth: '2033-12' };
const TAX_26375: Tax = { on: true, rateMillionths: 263750 };
const FLAT_224 = { hundredths: 224 };

describe('purchase (story 046, AC5: shares follow the money at the start of the phase year)', () => {
  it('AC5: the identity on the unrounded values, and the shares follow the net money', () => {
    // Hand payout per share of the three funding funds, flat base 2,24 % (045's rule, unchanged):
    // 46.651.808,910458 · 51.180.657,688553 · 56.468.446,040517 µ€. The identity is
    // `P·m − (interest − tax) = shares × payout per share`, read on the unrounded values: the left side is
    // hand (1.188.035.937,5 µ€), the right side is the row's shares times that hand share value.
    const rows = purchaseRows(HAND_FUNDS, CASE_B, 10000, TAX_26375, FLAT_224, ON_250, AS_OF);
    const hand: [number, number, number, number][] = [
      [2030, 46651808.910458, 1188035937.5, 25.4660208306],
      [2031, 51180657.688553, 1188035937.5, 23.2125961477],
      [2032, 56468446.040517, 1188035937.5, 21.0389344989],
    ];
    for (const [fundYear, pps, amount, shares] of hand) {
      const row = rows.find((entry) => entry.fundYear === fundYear);
      expect(row, `fund ${fundYear}`).toBeDefined();
      // Hand shares: 25,4660208306 · 23,2125961477 · 21,0389344989. The identity is asserted on the
      // unrounded values, so the rounding of the shown figure cannot hide a moved rule.
      expect(row?.shares, `shares of fund ${fundYear}`).toBeCloseTo(shares, 6);
      expect(
        Math.abs((row?.shares ?? 0) * pps - amount),
        `shares x payout per share for fund ${fundYear}`,
      ).toBeLessThan(1);
    }
    // Control, the same phase with the option off: the money at the start is `P·m` exactly, so 032's and
    // 045's hand shares stay (risk 1). This is the pair that makes the assertion above positive: with the
    // option off the same rows read 25,72 · 23,45 · 21,25.
    const off = purchaseRows(HAND_FUNDS, CASE_B, 10000, TAX_26375, FLAT_224, DEPOSIT_OFF, AS_OF);
    expect(off.map((row) => (row.shares === null ? null : formatShares(row.shares)))).toEqual([
      null,
      null,
      null,
      '25,72',
      '23,45',
      '21,25',
      null,
      null,
      null,
    ]);
    expect(rows.map((row) => (row.shares === null ? null : formatShares(row.shares)))).toEqual([
      null,
      null,
      null,
      '25,47',
      '23,21',
      '21,04',
      null,
      null,
      null,
    ]);
  });

  it('AC5, the negative branch: a negative monthly target parks nothing, so the year amount is P·m alone', () => {
    // Hand: `P = -100 Cent` (the sign is the money's, not the rate's, because the term `k_y` cannot see `P`).
    // The interest guard gives 0, so the money at the start of phase year 2031 is
    // `-100 Cent × 12 = -1.200.000 µ€` -> shown `-12,00 €`. Without the `max(0, monthlyMicroEur)` guard the
    // same row would subtract a negative interest: `-1.200.000 + 119.640,625 = -11.880.359,375 µ€`, which
    // shows `-11,88 €` - the distance the mutation moves, and the only assertion this rule can move.
    const rows = purchaseRows(HAND_FUNDS, CASE_B, -100, TAX_26375, FLAT_224, ON_250, AS_OF);
    expect(formatEuro(roundEuroCents(rows[3]?.yearAmountMicroEur ?? 0))).toBe('-12,00\u00a0€');
  });
});
