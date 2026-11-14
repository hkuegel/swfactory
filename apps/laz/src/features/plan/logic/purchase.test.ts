import { describe, expect, it } from 'vitest';
import type { Fund } from './fund.ts';
import { formatEuro, formatShares } from './format.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { displayPurchaseCents, purchaseRows } from './purchase.ts';

/**
 * Story 032, AC2 and the branch of AC3 that the UI cannot reach by hand (a payout per share of 0). The
 * displayed figures are tested in `e2e/laz.spec.ts`, so this file only tests the rule and the money rule.
 * Hand oracles, recomputed from the fixture copy by hand (spans asOf 2026-12-31 → 31.12. of the fund year):
 *   ρ = 1,0404516 (2028) · 1,0769573 (2029) · 1,1255649 (2030) · 1,1878281 (2031) · 1,2655355 (2032) ·
 *   1,3612328 (2033); F for the example phase 01.2028–03.2034 = 55,125235818, so depot 1.000.000 Cent
 *   gives 18.140,512 Cent per month. The values are hand-pinned, never read back from the module (P16).
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

/** The fixture copy's seven funds, the fund table's own order. */
const HAND_FUNDS = [
  fund(2028, 38000000, 200),
  fund(2029, 40000000, 250),
  fund(2030, 42000000, 300),
  fund(2031, 44000000, 350),
  fund(2032, 46000000, 400),
  fund(2033, 48000000, 450),
  fund(2034, 50000000, 500),
];

describe('purchase (story 032, AC2)', () => {
  it('the parts add up to the depot, and the last part is the total minus the others', () => {
    // Case A, hand: example phase, depot 1.000.000 Cent, tax off, monthly 18.140,511966417154 Cent
    // (= 1.000.000 / F, F = 55,125235818), pinned from the hand computation.
    const phase: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
    const rows = purchaseRows(HAND_FUNDS, phase, 18140.511966417154, TAX_OFF);
    // Hand: the unrounded parts sum to the depot (10.000.000.000.000 micro-euro), within one cent.
    const unrounded = rows.reduce((sum, row) => sum + (row.purchaseMicroEur ?? 0), 0);
    expect(Math.abs(unrounded - 10000000000)).toBeLessThan(10000);

    // Hand, rounded separately: 209222 · 202130 · 193396 · 183269 · 172004 Cent, so the last part is the
    // shown depot 1.000.000 Cent minus those = 39979 Cent. Rounding 399.808492090 micro Cent on its own
    // would show 399,81 €, so the rule changes this figure.
    const shown = displayPurchaseCents(rows, 1000000);
    expect(shown.map((cents) => (cents === null ? null : formatEuro(cents)))).toEqual([
      '2.092,22\u00a0€',
      '2.021,30\u00a0€',
      '1.933,96\u00a0€',
      '1.832,69\u00a0€',
      '1.720,04\u00a0€',
      '399,79\u00a0€',
      null, // fund 2034: its phase year 2035 is outside the phase, so no figure
    ]);
    expect(shown.reduce((sum: number, cents) => sum + (cents ?? 0), 0)).toBe(1000000);
    // The shares column is not money, so the money rule does not apply to it (hand values).
    expect(rows.map((row) => (row.shares === null ? null : formatShares(row.shares)))).toEqual([
      '55,06',
      '50,53',
      '46,05',
      '41,65',
      '37,39',
      '8,33',
      null,
    ]);
  });

  it('AC2, second direction: the last part is derived from the shown depot, not rounded on its own', () => {
    // Case B, hand: phase 01.2029–12.2030, monthly target 100.001 Cent (1.000,01 €), tax off. Rows 2028 and
    // 2029 fund 2029 and 2030. Parts: 11.533.514.961 and 11.142.550.533 micro-euro; the shown depot is
    // 2.267.607 Cent, so the last part is 2.267.607 − 1.153.351 = 1.114.256 Cent, which is one Cent more
    // than rounding its own value (1.114.255 Cent).
    const phase: Phase = { startMonth: '2029-01', endMonth: '2030-12' };
    const rows = purchaseRows(HAND_FUNDS, phase, 100001, TAX_OFF);
    const shown = displayPurchaseCents(rows, 2267607);
    expect(shown.slice(0, 2).map((cents) => (cents === null ? null : formatEuro(cents)))).toEqual([
      '11.533,51\u00a0€',
      '11.142,56\u00a0€',
    ]);
    expect(shown.reduce((sum: number, cents) => sum + (cents ?? 0), 0)).toBe(2267607);
    // Hand shares: 303,51 and 278,56.
    expect(rows.slice(0, 2).map((row) => formatShares(row.shares as number))).toEqual([
      '303,51',
      '278,56',
    ]);
  });
});

describe('purchase (story 032, AC3: no number invented)', () => {
  it('a fund outside the phase shows no number and names why', () => {
    // Case C, hand: phase 01.2030–12.2030. Fund 2028 liquidates before the phase begins, fund 2029 funds
    // the phase year 2030, and the funds 2030 and later liquidate after the phase end. Monthly is the hand
    // value 1.000.000 Cent / F (F = 12 / 1,0769573 = 11,142439108464284).
    const phase: Phase = { startMonth: '2030-01', endMonth: '2030-12' };
    const rows = purchaseRows(HAND_FUNDS, phase, 8974.695668207478, TAX_OFF);
    expect(rows.map((row) => `${String(row.fundYear)} ${row.reason ?? ''}`)).toEqual([
      '2028 before-phase-start',
      '2029 ',
      '2030 after-phase-end',
      '2031 after-phase-end',
      '2032 after-phase-end',
      '2033 after-phase-end',
      '2034 after-phase-end',
    ]);
    // The fund inside the phase keeps its hand figures: 25,00 shares and 1.000,00 € at its NAV.
    const inside = rows.find((row) => row.fundYear === 2029);
    expect(inside?.shares).toBeDefined();
    expect(formatShares(inside?.shares as number)).toBe('25,00');
    expect(formatEuro(displayPurchaseCents(rows, 100000)[1] as number)).toBe('1.000,00\u00a0€');
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
