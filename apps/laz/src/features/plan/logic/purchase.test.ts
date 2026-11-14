import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuro, formatShares } from './format.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { displayPurchaseCents, purchaseRows } from './purchase.ts';

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

describe('purchase (story 032, AC2)', () => {
  it('the parts add up to the depot, and the last part is the total minus the others', () => {
    // Case A, hand: example phase, depot 1.000.000 Cent, tax off, monthly 14.936,989225972 Cent
    // (= 1.000.000 / F, F = 66,947895916), pinned from the hand computation. The 2027 fund funds the
    // phase year 2028 (story 035), so this case has seven funded rows, not six.
    const phase: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
    const rows = purchaseRows(HAND_FUNDS, phase, 14936.989225972, TAX_OFF);
    // Hand: the unrounded parts sum to the depot (10.000.000.000.000 micro-euro), within one cent.
    const unrounded = rows.reduce((sum, row) => sum + (row.purchaseMicroEur ?? 0), 0);
    expect(Math.abs(unrounded - 10000000000)).toBeLessThan(10000);

    // Hand, rounded separately: 176595 · 172274 · 166434 · 159243 · 150904 · 141629 Cent, so the last
    // part is the shown depot 1.000.000 Cent minus those = 32921 Cent. Rounding 32920,4333 Cent on its
    // own would show 329,20 €, so the rule changes this figure.
    const shown = displayPurchaseCents(rows, 1000000);
    expect(shown.map((cents) => (cents === null ? null : formatEuro(cents)))).toEqual([
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
    expect(shown.reduce((sum: number, cents) => sum + (cents ?? 0), 0)).toBe(1000000);
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
    const rows = purchaseRows(HAND_FUNDS, phase, 100001, TAX_OFF);
    const shown = displayPurchaseCents(rows, 2267607);
    const row2028 = rows.findIndex((row) => row.fundYear === 2028);
    const row2029 = rows.findIndex((row) => row.fundYear === 2029);
    expect([formatEuro(shown[row2028] ?? 0), formatEuro(shown[row2029] ?? 0)]).toEqual([
      '11.533,51\u00a0€',
      '11.142,56\u00a0€',
    ]);
    expect(shown.reduce((sum: number, cents) => sum + (cents ?? 0), 0)).toBe(2267607);
    // Hand shares: 303,51 and 278,56.
    expect([
      formatShares(rows[row2028]?.shares as number),
      formatShares(rows[row2029]?.shares as number),
    ]).toEqual(['303,51', '278,56']);
  });
});

describe('purchase (story 032, AC3: no number invented)', () => {
  it('a fund outside the phase shows no number and names why', () => {
    // Case C, hand: phase 01.2030–12.2030. Funds 2027 and 2028 liquidate before the phase begins, fund
    // 2029 funds the phase year 2030, and the funds 2030 and later liquidate after the phase end —
    // including the new boundary fund 2035, whose phase year 2036 is outside this phase (story 035).
    // Monthly is the hand value 1.000.000 Cent / F (F = 12 / 1,0769573 = 11,142439108464284).
    const phase: Phase = { startMonth: '2030-01', endMonth: '2030-12' };
    const rows = purchaseRows(HAND_FUNDS, phase, 8974.695668207478, TAX_OFF);
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
    expect(formatEuro(displayPurchaseCents(rows, 100000)[insideIndex] as number)).toBe(
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
    const rows = purchaseRows([fund(2028, 38000000, -10000)], phase, 100000, TAX_OFF);
    expect(rows[0]?.shares).toBeNull();
    expect(rows[0]?.purchaseMicroEur).toBeNull();
    expect(rows[0]?.reason).toBe('no-payout-per-share');
    // The year amount itself is still the model's number, and the shown total keeps its own figure.
    expect(rows[0]?.yearAmountMicroEur).toBe(12000000000);
    expect(displayPurchaseCents(rows, 100000)).toEqual([null]);
    // asOf is the fixture copy's date, which the projection label reads (024 AC5).
    expect(AS_OF).toBe('2026-12-31');
  });
});
