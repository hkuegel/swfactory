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

    // Hand oracles on the fixture copy as story 035 extended it (nine funds, so 2028 is funded by the
    // 2027 fund): F = 66,947895916 (tax off) and F = 68,710921111 (tax on, r 25 %), so depot
    // 10.000,00 € = 1.000.000 Cent gives 14936,989226 cents = 149,37 € and 14553,727178 cents =
    // 145,54 €. The value 024 measured at its old cap, 200.000,00 € = 20.000.000 cents, gives
    // 298739,785 cents = 2.987,40 € (tax off).
    // Story 030, AC3: a value above that cap follows the same rule. Hand: 100.000.000 cents / F
    // (tax off) = 1.493.698,923 cents = 14.936,99 €.
    const monthlyOff = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_OFF);
    const monthlyTaxed = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_25);
    expect(formatEuro(monthlyOff)).toBe('149,37\u00a0€');
    expect(formatEuro(monthlyTaxed)).toBe('145,54\u00a0€');
    expect(formatEuro(payoutFromDepotCents(20000000, FUND_LIST, PHASE, TAX_OFF))).toBe(
      '2.987,40\u00a0€',
    );
    expect(formatEuro(payoutFromDepotCents(100000000, FUND_LIST, PHASE, TAX_OFF))).toBe(
      '14.936,99\u00a0€',
    );

    // Finding 8, made falsifiable: `formatEuro(Math.round(x))` equals `formatEuro(x)` for every x, so
    // the single rounding at display is checked against hand values instead. Hand case on the extended
    // copy, depot 10.003,00 € = 1.000.300 cents: the internal value is not already a whole cent
    // (14941,470323 cents tax off, 14558,093296 cents tax on), and feeding the SHOWN figure back misses
    // the depot by more than one cent, because F is a multiplier: 14941 × F = 1.000.268,51 cents, a
    // miss of 31,49 cents tax off, and 14558 × F = 1.000.293,59, a miss of 6,41 cents tax on.
    const backOff = payoutFromDepotCents(1000300, FUND_LIST, PHASE, TAX_OFF);
    const backTaxed = payoutFromDepotCents(1000300, FUND_LIST, PHASE, TAX_25);
    // The unrounded model value is not a whole Cent, which is what makes the display rounding a step:
    // `Math.round` of it is an integer by definition, so the claim is about the value before rounding.
    expect(Number.isInteger(backOff)).toBe(false);
    expect(Number.isInteger(backTaxed)).toBe(false);
    expect(Math.round(backOff)).toBe(14941);
    expect(Math.round(backTaxed)).toBe(14558);
    expect(Math.abs(depotFromPayoutCents(14941, FUND_LIST, PHASE, TAX_OFF) - 1000300)).toBeCloseTo(
      31.49,
      1,
    );
    expect(Math.abs(depotFromPayoutCents(14558, FUND_LIST, PHASE, TAX_25) - 1000300)).toBeCloseTo(
      6.41,
      1,
    );
  });

  it('033 AC1: a phase outside the fund list keeps every phase year and totals 0,00 €', () => {
    // Hand oracle: no phase year has a funding fund, so the sum is 0 cents = 0,00 €, and no year is
    // dropped. Before the list: 2026-01 to 2026-12 would need the December 2025 liquidation. This is
    // the measurement story 035 AC3 names for 024 AC2: a year outside the extended list, not 2028.
    const before: Phase = { startMonth: '2026-01', endMonth: '2026-12' };
    const beforePlan = buildPlan(FUND_LIST, before, TAX_OFF, 1000000, 'depot');
    expect(phaseYears(before)).toEqual([2026]);
    expect(beforePlan.fundedYears).toEqual([]);
    expect(beforePlan.totalCents).toBe(0);
    expect(formatEuro(beforePlan.totalCents)).toBe('0,00\u00a0€');
    expect(displayYearCents(beforePlan)).toEqual([null]);

    // After the list as story 035 extended it: 2036-01 to 12.2036 is funded by the 2035 fund, so the
    // case here is the year after it: 2037-01 to 2038-02 needs the December 2036 and 2037 liquidations,
    // and both years stay in the table. Hand: 12 months and 2 months.
    const after: Phase = { startMonth: '2037-01', endMonth: '2038-02' };
    const afterPlan = buildPlan(FUND_LIST, after, TAX_OFF, 1000000, 'depot');
    expect(phaseYears(after)).toEqual([2037, 2038]);
    expect(afterPlan.years.map((row) => row.months)).toEqual([12, 2]);
    expect(afterPlan.years.map((row) => row.fundingFund)).toEqual([null, null]);
    expect(displayYearCents(afterPlan)).toEqual([null, null]);
    expect(formatEuro(afterPlan.totalCents)).toBe('0,00\u00a0€');
  });

  it('035 AC1: the phase boundary years name the fund that funds them', () => {
    // Hand case: the phase hak named, 01.2028 to 03.2036, depot 10.000,00 € = 1.000.000 Cent, tax off.
    // F = 83,532002665, so the monthly payout is 11971,459657 cents = 119,71 €.
    // 2028 is funded by the 2027 fund, 2036 by the 2035 fund, and 2036 has three phase months.
    // Hand amounts in cents: 143657,515887 for a 12-month year, 35914,378972 for the three months of
    // 2036, so the shown lines are 143658 for the eight full years and 1185175 − 1149264 = 35911 for the
    // last line, which adds up to the shown total 11.851,75 €. No full year is invented for 2036.
    const phase: Phase = { startMonth: '2028-01', endMonth: '2036-03' };
    const plan = buildPlan(FUND_LIST, phase, TAX_OFF, 1000000, 'depot');
    expect(phaseYears(phase)).toEqual([2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036]);
    const first = plan.years.find((row) => row.year === 2028);
    const last = plan.years.find((row) => row.year === 2036);
    expect(first?.fundingFund?.year).toBe(2027);
    expect(first?.months).toBe(12);
    expect(last?.fundingFund?.year).toBe(2035);
    expect(last?.months).toBe(3);
    expect(last?.yearAmountCents).toBeCloseTo(35914.378972, 6);
    expect(plan.phaseFactor).toBeCloseTo(83.532002665, 9);
    expect(displayYearCents(plan)).toEqual([
      143658, 143658, 143658, 143658, 143658, 143658, 143658, 143658, 35911,
    ]);
    expect(formatEuro(plan.totalCents)).toBe('11.851,75\u00a0€');
    expect(formatEuro(plan.monthlyCents)).toBe('119,71\u00a0€');
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
