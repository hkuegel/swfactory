import { describe, expect, it } from 'vitest';
import { FUND_LIST } from './fund.ts';
import { formatEuro } from './format.ts';
import {
  buildPlan,
  depotFromPayoutCents,
  displayYearCents,
  payoutFromDepotCents,
  phaseYears,
} from './phase.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { taxFromState } from './tax.ts';

/** The example phase of the story (1.1.2028 – 31.3.2034). AC3 names the tax parameter, so both states. */
const PHASE: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
const TAX_OFF: Tax = { on: false, rateMillionths: 0 };
const TAX_25: Tax = { on: true, rateMillionths: 250000 };

describe('phase (ADR 0012, the one closed form)', () => {
  it('AC3: the round trip depot → monthly payout → depot differs by at most one cent', () => {
    for (const tax of [TAX_OFF, TAX_25]) {
      for (const depotCents of [0, 1000000, 20000000, 100000000]) {
        // The unrounded internal value is fed back, not the shown text (risk 1).
        const monthlyCents = payoutFromDepotCents(depotCents, FUND_LIST, PHASE, tax);
        const back = depotFromPayoutCents(monthlyCents, FUND_LIST, PHASE, tax);
        expect(Math.abs(back - depotCents)).toBeLessThanOrEqual(1);
      }
    }

    // Hand oracles: F = 55,125236 (tax off) and F = 56,844419 (tax on, r 25 %), so depot 10.000,00 €
    // gives 18140,512 cents = 181,41 € and 17591,876 cents = 175,92 €; the value 024 measured at its
    // old cap, 200.000,00 €, gives 362810,239 cents = 3.628,10 € (tax off).
    // Story 030, AC3: a value above that cap follows the same rule. Hand: 100.000.000 cents / F
    // (tax off) = 1.814.051,19 cents = 18.140,51 € for 1.000.000,00 €.
    const monthlyOff = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_OFF);
    const monthlyTaxed = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_25);
    expect(formatEuro(monthlyOff)).toBe('181,41\u00a0€');
    expect(formatEuro(monthlyTaxed)).toBe('175,92\u00a0€');
    expect(formatEuro(payoutFromDepotCents(20000000, FUND_LIST, PHASE, TAX_OFF))).toBe(
      '3.628,10\u00a0€',
    );
    expect(formatEuro(payoutFromDepotCents(100000000, FUND_LIST, PHASE, TAX_OFF))).toBe(
      '18.140,51\u00a0€',
    );

    // Finding 8, made falsifiable: `formatEuro(Math.round(x))` equals `formatEuro(x)` for every x, so
    // the single rounding at display is checked against hand values instead. The internal value is not
    // already a whole cent, and feeding the SHOWN figure back misses the depot by more than one cent
    // (the amplification risk 1 names): 26,9 cents tax off, 7,0 cents tax on.
    expect(Number.isInteger(monthlyOff)).toBe(false);
    expect(Number.isInteger(monthlyTaxed)).toBe(false);
    expect(Math.round(monthlyOff)).toBe(18141);
    expect(Math.round(monthlyTaxed)).toBe(17592);
    expect(Math.abs(depotFromPayoutCents(18141, FUND_LIST, PHASE, TAX_OFF) - 1000000)).toBeCloseTo(
      26.9,
      1,
    );
    expect(Math.abs(depotFromPayoutCents(17592, FUND_LIST, PHASE, TAX_25) - 1000000)).toBeCloseTo(
      7.0,
      1,
    );
  });

  it('033 AC1: a phase outside the fund list keeps every phase year and totals 0,00 €', () => {
    // Hand oracle: no phase year has a funding fund, so the sum is 0 cents = 0,00 €, and no year is
    // dropped. Before the list: 2026-01 to 2026-12 would need the December 2025 liquidation.
    const before: Phase = { startMonth: '2026-01', endMonth: '2026-12' };
    const beforePlan = buildPlan(FUND_LIST, before, TAX_OFF, 1000000, 'depot');
    expect(phaseYears(before)).toEqual([2026]);
    expect(beforePlan.fundedYears).toEqual([]);
    expect(beforePlan.totalCents).toBe(0);
    expect(formatEuro(beforePlan.totalCents)).toBe('0,00\u00a0€');
    expect(displayYearCents(beforePlan)).toEqual([null]);

    // After the list: 2036-01 to 2037-02 needs the December 2035 and 2036 liquidations, and both years
    // stay in the table. Hand: 12 months and 2 months.
    const after: Phase = { startMonth: '2036-01', endMonth: '2037-02' };
    const afterPlan = buildPlan(FUND_LIST, after, TAX_OFF, 1000000, 'depot');
    expect(phaseYears(after)).toEqual([2036, 2037]);
    expect(afterPlan.years.map((row) => row.months)).toEqual([12, 2]);
    expect(afterPlan.years.map((row) => row.fundingFund)).toEqual([null, null]);
    expect(displayYearCents(afterPlan)).toEqual([null, null]);
    expect(formatEuro(afterPlan.totalCents)).toBe('0,00\u00a0€');
  });

  it('031 AC3: the round trip of 024 AC3 holds within one cent for every checkbox state', () => {
    // Hand states: the four the AC names. The rate is the hand value of `tax.test.ts`, so the round trip
    // is checked with the rates the form can actually produce.
    const states = [
      { kstOn: false, kistOn: false, bundesland: 'bayern' },
      { kstOn: true, kistOn: false, bundesland: 'bayern' },
      { kstOn: true, kistOn: true, bundesland: 'bayern' },
      { kstOn: true, kistOn: true, bundesland: 'berlin' },
    ] as const;
    for (const state of states) {
      const tax = taxFromState(state);
      for (const depotCents of [0, 1000000, 20000000, 100000000]) {
        const monthly = payoutFromDepotCents(depotCents, FUND_LIST, PHASE, tax);
        const back = depotFromPayoutCents(monthly, FUND_LIST, PHASE, tax);
        expect(Math.abs(back - depotCents)).toBeLessThanOrEqual(1);
      }
    }
  });
});
