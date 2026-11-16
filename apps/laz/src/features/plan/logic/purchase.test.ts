import { describe, expect, it } from 'vitest';
// Story 046 AC5: `purchaseRows` gained `deposit` after `flat`; these hand values are the control case, so the
// call site passes `DEPOSIT_OFF` and the values do not move.
import { DEPOSIT_OFF, type DepositOption } from './deposit.ts';
import { FLAT_OFF } from './flat.ts';
import type { Fund } from './fund.ts';
import { formatEuro, formatShares, roundEuroCents } from './format.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { displayFundParts, flatPartsSum, fundPhaseYear, purchaseRows } from './purchase.ts';

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

/**
 * Story 045: the flat rate is 0 in these cases, so no row has a flat figure and `displayFundParts` is
 * story 032's rule unchanged — the hand values below hold as they were. The parts are read through
 * `purchaseCents`; the flat part is null for every row here, which is the dash the column shows.
 */

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

describe('purchase (story 032, AC2)', () => {
  it('the parts add up to the depot, and the last part is the total minus the others', () => {
    // Case A, hand: example phase, depot 1.000.000 Cent, tax off, monthly 14.936,989225972 Cent
    // (= 1.000.000 / F, F = 66,947895916), pinned from the hand computation. The 2027 fund funds the
    // phase year 2028 (story 035), so this case has seven funded rows, not six.
    const phase: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
    const rows = purchaseRows(HAND_FUNDS, phase, 14936.989225972, TAX_OFF, FLAT_OFF);
    // Hand: the unrounded parts sum to the depot (10.000.000.000.000 micro-euro), within one cent.
    const unrounded = rows.reduce((sum, row) => sum + (row.purchaseMicroEur ?? 0), 0);
    expect(Math.abs(unrounded - 10000000000)).toBeLessThan(10000);

    // Hand, rounded separately: 176595 · 172274 · 166434 · 159243 · 150904 · 141629 Cent, so the last
    // part is the shown depot 1.000.000 Cent minus those = 32921 Cent. Rounding 32920,4333 Cent on its
    // own would show 329,20 €, so the rule changes this figure.
    const shown = displayFundParts(rows, 1000000);
    expect(
      shown.map((part) => (part.purchaseCents === null ? null : formatEuro(part.purchaseCents))),
    ).toEqual([
      '1.765,95\u00a0€',
      '1.722,74\u00a0€',
      '1.664,34\u00a0€',
      '1.592,43\u00a0€',
      '1.509,04\u00a0€',
      '1.416,29\u00a0€',
      '329,21\u00a0€',
      null, // fund 2034: its phase year 2035 is outside the phase, so no figure
      null, // fund 2035: its phase year 2036 is outside the phase, so no figure
    ]);
    expect(shown.reduce((sum, part) => sum + (part.purchaseCents ?? 0), 0)).toBe(1000000);
    // The shares column is not money, so the money rule does not apply to it (hand values).
    expect(rows.map((row) => (row.shares === null ? null : formatShares(row.shares)))).toEqual([
      '49,05',
      '45,34',
      '41,61',
      '37,91',
      '34,30',
      '30,79',
      '6,86',
      null,
      null,
    ]);
  });

  it('AC2, second direction: the last part is derived from the shown depot, not rounded on its own', () => {
    // Case B, hand: phase 01.2029–12.2030, monthly target 100.001 Cent (1.000,01 €), tax off. Rows 2028 and
    // 2029 fund 2029 and 2030. Parts: 11.533.514.961 and 11.142.550.533 micro-euro; the shown depot is
    // 2.267.607 Cent, so the last part is 2.267.607 − 1.153.351 = 1.114.256 Cent, which is one Cent more
    // than rounding its own value (1.114.255 Cent). Case B is not moved by the two new funds: the phase
    // has no year that they fund.
    const phase: Phase = { startMonth: '2029-01', endMonth: '2030-12' };
    const rows = purchaseRows(HAND_FUNDS, phase, 100001, TAX_OFF, FLAT_OFF);
    const parts = displayFundParts(rows, 2267607);
    const row2028 = rows.findIndex((row) => row.fundYear === 2028);
    const row2029 = rows.findIndex((row) => row.fundYear === 2029);
    expect([
      formatEuro(parts[row2028]?.purchaseCents ?? 0),
      formatEuro(parts[row2029]?.purchaseCents ?? 0),
    ]).toEqual(['11.533,51\u00a0€', '11.142,56\u00a0€']);
    expect(parts.reduce((sum, part) => sum + (part.purchaseCents ?? 0), 0)).toBe(2267607);
    // Hand shares: 303,51 and 278,56.
    expect([
      formatShares(rows[row2028]?.shares as number),
      formatShares(rows[row2029]?.shares as number),
    ]).toEqual(['303,51', '278,56']);
  });

  it('045 AC5, the money rule over both groups: the last flat part is the depot minus the other parts', () => {
    // Hand case, the tester's own arithmetic on the fixture copy, tax 26,375 %, flat 2,24 %. asOf is
    // written as 1.1.2027 so the whole-month rule cannot bind here, and the funds have a YTM that makes
    // the cap bind the same way in every counted year, so that only the assertion in `flat.test.ts` that
    // pins those rules is moved by their mutation (P32).
    // Phase 01.2031–12.2033, monthly target 100,01 € = 10.001 Cent. The funding funds are 2030, 2031,
    // 2032; their flat taxes are 76,698488 + 109,573624 + 147,208175 = 333,480288 Cent (`cash`), and
    // ρ′ = 1,1106674062 · 1,1630871390 · 1,2274430132, so F = 30,8981055149 and the shown depot is
    // 10.001 × F + cash = 309.345,433542 Cent -> 309.345 Cent.
    // Parts in the order the table reads them: 108.054 and 77 (row 2030), 103.184 and 110 (row 2031),
    // 97.774 and the rule's value 309.345 − 309.199 = 146 Cent for row 2032, which is one Cent less than
    // its own rounding (147,208175 -> 147 Cent), so the rule moves this figure. The fund section's sum
    // line is the sum of the shown parts, 77 + 110 + 146 = 333 Cent.
    const phase: Phase = { startMonth: '2031-01', endMonth: '2033-12' };
    const tax: Tax = { on: true, rateMillionths: 263750 };
    const flat = { hundredths: 224 };
    const asOf = '2027-01-01';
    const rows = purchaseRows(HAND_FUNDS, phase, 10001, tax, flat, DEPOSIT_OFF, asOf);
    const parts = displayFundParts(rows, 309345);
    expect(parts.map((part) => [part.purchaseCents, part.flatCents])).toEqual([
      [null, null], // 2027 funds 2028, which is before the phase
      [null, null],
      [null, null],
      [108054, 77],
      [103184, 110],
      [97774, 146], // 146 is derived from the depot; its own rounding would be 147
      [null, null], // 2033 funds 2034, which is after the phase end
      [null, null],
      [null, null],
    ]);
    expect(
      parts.reduce((sum, part) => sum + (part.purchaseCents ?? 0) + (part.flatCents ?? 0), 0),
    ).toBe(309345);
    expect(flatPartsSum(parts)).toBe(333);
  });
});

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
    expect(formatEuro(displayFundParts(rows, 100000)[insideIndex]?.purchaseCents ?? 0)).toBe(
      '1.000,00\u00a0€',
    );
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
    expect(displayFundParts(rows, 100000)).toEqual([{ purchaseCents: null, flatCents: null }]);
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

  it('AC5: the shown parts still add up to the shown depot, the last one derived from the total', () => {
    const rows = purchaseRows(HAND_FUNDS, CASE_B, 10000, TAX_26375, FLAT_224, ON_250, AS_OF);
    // Hand depot: F = 30,895207753782 and K = 0,308026830431 over the three funding funds, cash
    // 333,842117 Cent -> 306.205,651351 Cent -> shown 306.206 Cent = 3.062,06 €.
    const shown = displayFundParts(rows, 306206);
    // Hand parts in the order the table reads them: the purchase part is shares × NAV at the file's NAV
    // (106.957,287489 · 102.135,423050 · 96.779,098695 Cent) and the flat part is 76,794412 · 109,693335 ·
    // 147,354370 Cent. The last part with a figure is the rule's value 306.206 − 306.058 = 148 Cent, one
    // Cent more than its own rounding of 147,354370 would give, so the rule moves this figure; the distance
    // to the .5 boundary is 0,354370 Cent (risk 5). The control case (option off) rounds to 147 here, so the
    // two cases differ by this one Cent.
    expect(shown.map((part) => [part.purchaseCents, part.flatCents])).toEqual([
      [null, null], // 2027 funds 2028, before the phase
      [null, null],
      [null, null],
      [106957, 77],
      [102135, 110],
      [96779, 148], // 148 is derived from the depot; its own rounding would be 147
      [null, null], // 2033 funds 2034, after the phase end
      [null, null], // 2034 funds 2035, after the phase end
      [null, null],
    ]);
    expect(
      shown.reduce((sum, part) => sum + (part.purchaseCents ?? 0) + (part.flatCents ?? 0), 0),
      'the shown parts, in whole Cent',
    ).toBe(306206);
    // Fund 2034 is inside the fund list but outside the phase, so its money is never parked: the phase sum
    // is 3 × 16,25 = 48,75 € against the whole-list reading of 9 × 16,25 = 146,25 € (difference 113,75 €),
    // and this row shows the dash because its phase year 2035 is outside the phase.
    expect(fundPhaseYear(CASE_B, 2034)).toBeNull();
    expect(rows[7]?.reason).toBe('after-phase-end');
    expect(fundPhaseYear(CASE_B, 2032)).toBe(2033);
    expect(flatPartsSum(shown)).toBe(335);
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
