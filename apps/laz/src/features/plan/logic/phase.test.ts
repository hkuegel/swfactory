import { describe, expect, it } from 'vitest';
// Story 046: the changed functions gained `deposit` after `flat`, so every existing call site passes the
// control case `DEPOSIT_OFF` (the design's line for call sites). No hand value here changes.
import { DEPOSIT_OFF, type DepositOption } from './deposit.ts';
import { FLAT_OFF, type FlatRate } from './flat.ts';
import { FUND_LIST } from './fund.ts';
import { formatEuro } from './format.ts';
import {
  buildPlan,
  depotFromPayoutCents,
  displayYearCents,
  flatCashCents,
  payoutFromDepotCents,
  phaseFactor,
  phaseYears,
  yearRows,
} from './phase.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';
import { taxFromState } from './tax.ts';

/** The example phase of the story (1.1.2028 – 31.3.2034). AC3 names the tax parameter, so both states. */
const PHASE: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
const TAX_OFF: Tax = { on: false, rateMillionths: 0 };
const TAX_25: Tax = { on: true, rateMillionths: 250000 };

/** Story 045: the flat rate is 0 in these hand cases, so `cash` is 0 and `P = D / F` is the pair ADR 0012
 * gives; the hand values of 024, 030, 031 and 035 are unchanged by the new parameter. `FLAT_OFF` is the
 * shape the rate has when 0 is typed in the field. */

describe('phase (ADR 0012, the one closed form)', () => {
  it('AC3: the round trip depot → monthly payout → depot differs by at most one cent', () => {
    for (const tax of [TAX_OFF, TAX_25]) {
      for (const depotCents of [0, 1000000, 20000000, 100000000]) {
        // The unrounded internal value is fed back, not the shown text (risk 1).
        const monthlyCents = payoutFromDepotCents(depotCents, FUND_LIST, PHASE, tax, FLAT_OFF);
        const back = depotFromPayoutCents(monthlyCents, FUND_LIST, PHASE, tax, FLAT_OFF);
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
    const monthlyOff = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_OFF, FLAT_OFF);
    const monthlyTaxed = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_25, FLAT_OFF);
    expect(formatEuro(monthlyOff)).toBe('149,37\u00a0€');
    expect(formatEuro(monthlyTaxed)).toBe('145,54\u00a0€');
    expect(formatEuro(payoutFromDepotCents(20000000, FUND_LIST, PHASE, TAX_OFF, FLAT_OFF))).toBe(
      '2.987,40\u00a0€',
    );
    expect(formatEuro(payoutFromDepotCents(100000000, FUND_LIST, PHASE, TAX_OFF, FLAT_OFF))).toBe(
      '14.936,99\u00a0€',
    );

    // Finding 8, made falsifiable: `formatEuro(Math.round(x))` equals `formatEuro(x)` for every x, so
    // the single rounding at display is checked against hand values instead. Hand case on the extended
    // copy, depot 10.003,00 € = 1.000.300 cents: the internal value is not already a whole cent
    // (14941,470323 cents tax off, 14558,093296 cents tax on), and feeding the SHOWN figure back misses
    // the depot by more than one cent, because F is a multiplier: 14941 × F = 1.000.268,51 cents, a
    // miss of 31,49 cents tax off, and 14558 × F = 1.000.293,59, a miss of 6,41 cents tax on.
    const backOff = payoutFromDepotCents(1000300, FUND_LIST, PHASE, TAX_OFF, FLAT_OFF);
    const backTaxed = payoutFromDepotCents(1000300, FUND_LIST, PHASE, TAX_25, FLAT_OFF);
    // The unrounded model value is not a whole Cent, which is what makes the display rounding a step:
    // `Math.round` of it is an integer by definition, so the claim is about the value before rounding.
    expect(Number.isInteger(backOff)).toBe(false);
    expect(Number.isInteger(backTaxed)).toBe(false);
    expect(Math.round(backOff)).toBe(14941);
    expect(Math.round(backTaxed)).toBe(14558);
    expect(
      Math.abs(depotFromPayoutCents(14941, FUND_LIST, PHASE, TAX_OFF, FLAT_OFF) - 1000300),
    ).toBeCloseTo(31.49, 1);
    expect(
      Math.abs(depotFromPayoutCents(14558, FUND_LIST, PHASE, TAX_25, FLAT_OFF) - 1000300),
    ).toBeCloseTo(6.41, 1);
  });

  it('045 AC5, the round trip with a nonzero flat rate: the same cash in both directions', () => {
    // The tester's own arithmetic on the fixture copy, tax 26,375 %, flat 2,24 %, asOf written as
    // 1.1.2027 so the whole-month rule cannot bind here, and funds whose YTM is above the rate so the cap
    // cannot move this test either (P32). Phase 01.2031–12.2034, monthly target 100,00 € = 10.000 Cent.
    // The funding funds are 2030, 2031, 2032, 2033 (a phase year is funded by the fund of the year
    // before); their flat taxes are 76,698488 + 109,573624 + 147,208175 + 190,496279 = 523,976566 Cent
    // (`cash`), and ρ′ = 1,1106674062 · 1,1630871390 · 1,2274430132 · 1,3054920822, so
    // F = 40,0900417691 and D = 10.000 × F + cash = 401.424,394258 Cent -> shown 401.424 Cent = 4.014,24 €.
    const phase: Phase = { startMonth: '2031-01', endMonth: '2034-12' };
    const tax: Tax = { on: true, rateMillionths: 263750 };
    const flat: FlatRate = { hundredths: 224 };
    const asOf = '2027-01-01';

    // Assertion 1 pins that both directions use the same `cash`: the round trip is self-consistent, so a
    // cash read in only one direction cannot keep it, while a change of the cash's VALUE cannot move it.
    const depot = depotFromPayoutCents(10000, FUND_LIST, phase, tax, flat, DEPOSIT_OFF, asOf);
    expect(
      Math.abs(payoutFromDepotCents(depot, FUND_LIST, phase, tax, flat, DEPOSIT_OFF, asOf) - 10000),
    ).toBeLessThanOrEqual(1);
    // The shown figure fed back: (401.424 − 523,976566) / F = 9.999,990166 Cent, a miss of 0,01 Cent.
    expect(
      Math.abs(
        payoutFromDepotCents(401424, FUND_LIST, phase, tax, flat, DEPOSIT_OFF, asOf) - 10000,
      ),
    ).toBeLessThanOrEqual(1);

    // Assertion 2 pins `cash` itself, and that only the funds that fund a phase year are in the depot: the
    // whole list would give 1.131,130246 Cent here, not 523,976566 Cent.
    expect(flatCashCents(FUND_LIST, phase, tax, flat, asOf)).toBeCloseTo(523.976566, 6);
    expect(phaseFactor(FUND_LIST, phase, tax, flat, asOf)).toBeCloseTo(40.090041769, 7);
    expect(formatEuro(depot)).toBe('4.014,24\u00a0€');

    // Control, the pair ADR 0012 gives without cash: the same phase with the rate 0 has no cash, and the
    // hand factor uses the tax-on factors with base 0, ρ′ = 1,0924058614 · 1,1381840425 · 1,1954412359 ·
    // 1,2658053575, so F = 41,0463037208 and the shown depot is 410.463,037208 Cent = 4.104,63 €.
    expect(flatCashCents(FUND_LIST, phase, tax, FLAT_OFF, asOf)).toBe(0);
    expect(
      formatEuro(depotFromPayoutCents(10000, FUND_LIST, phase, tax, FLAT_OFF, DEPOSIT_OFF, asOf)),
    ).toBe('4.104,63\u00a0€');
  });

  it('033 AC1: a phase outside the fund list keeps every phase year and totals 0,00 €', () => {
    // Hand oracle: no phase year has a funding fund, so the sum is 0 cents = 0,00 €, and no year is
    // dropped. Before the list: 2026-01 to 2026-12 would need the December 2025 liquidation. This is
    // the measurement story 035 AC3 names for 024 AC2: a year outside the extended list, not 2028.
    const before: Phase = { startMonth: '2026-01', endMonth: '2026-12' };
    const beforePlan = buildPlan(
      FUND_LIST,
      before,
      TAX_OFF,
      FLAT_OFF,
      DEPOSIT_OFF,
      1000000,
      'depot',
    );
    expect(phaseYears(before)).toEqual([2026]);
    expect(beforePlan.fundedYears).toEqual([]);
    expect(beforePlan.totalCents).toBe(0);
    expect(formatEuro(beforePlan.totalCents)).toBe('0,00\u00a0€');
    expect(displayYearCents(beforePlan)).toEqual([null]);

    // After the list as story 035 extended it: 2036-01 to 12.2036 is funded by the 2035 fund, so the
    // case here is the year after it: 2037-01 to 2038-02 needs the December 2036 and 2037 liquidations,
    // and both years stay in the table. Hand: 12 months and 2 months.
    const after: Phase = { startMonth: '2037-01', endMonth: '2038-02' };
    const afterPlan = buildPlan(FUND_LIST, after, TAX_OFF, FLAT_OFF, DEPOSIT_OFF, 1000000, 'depot');
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
    const plan = buildPlan(FUND_LIST, phase, TAX_OFF, FLAT_OFF, DEPOSIT_OFF, 1000000, 'depot');
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
        const monthly = payoutFromDepotCents(depotCents, FUND_LIST, PHASE, tax, FLAT_OFF);
        const back = depotFromPayoutCents(monthly, FUND_LIST, PHASE, tax, FLAT_OFF);
        expect(Math.abs(back - depotCents)).toBeLessThanOrEqual(1);
      }
    }
  });
});

/**
 * Story 046, AC5: the parking term. Hand oracles written here from the tester's own arithmetic on the
 * fixture copy (asOf 2026-12-31), never read back from `deposit.ts` or `phase.ts` (P16). The rate is `2,50 %`
 * = 250 hundredths. `ON` is the option on; `DEPOSIT_OFF` is the control that keeps the values of 024, 032
 * and 045 (risk 1).
 */
const ON_250: DepositOption = { on: true, hundredths: 250 };

describe('phase (story 046, AC5: the term over the phase years, the sign branch)', () => {
  it('AC5: the round trip stays inverse in both directions with the option on, on unrounded values', () => {
    // Hand, phase 01.2028-12.2036 - the nine funds of the fixture copy, so its phase years are the whole
    // list and the phase restriction cannot bind here: F = 89,089035488581, K = 1,206414022241, cash = 0
    // (flat off), so D = 10.000 Cent x (F - K) = 878.826,214663 Cent = 8.788,26 € and the way back gives
    // 10.000 Cent exactly. This closure is the round trip AC5 names; it is read in both directions, so it
    // cannot see the sign of K - the falsifiable form of the sign is the hand depot below (limit, risk 4).
    const full: Phase = { startMonth: '2028-01', endMonth: '2036-12' };
    const taxOff: Tax = { on: false, rateMillionths: 0 };
    const depot = depotFromPayoutCents(10000, FUND_LIST, full, taxOff, FLAT_OFF, ON_250);
    const back = payoutFromDepotCents(depot, FUND_LIST, full, taxOff, FLAT_OFF, ON_250);
    expect(Math.abs(back - 10000)).toBeLessThanOrEqual(1e-9);
  });

  it('AC5: the term is read over the phase years, not over the whole fund list', () => {
    // Hand, phase 01.2033-12.2034, tax off, flat off, P = 100 € = 10.000 Cent: the phase years are 2033 and
    // 2034, funded by the funds of 2032 and 2033, so K = 0,025 x 6,5 x (1 - 0) / 1,2655910 + the same for
    // 1,3611901 = 0,247779341224 against F = 18,297551351950, and the depot is 10.000 Cent x (F - K) =
    // 180.497,720107 Cent = 1.804,98 €. Reading the term over the whole list (the nine funds, each a full
    // phase-year term) would give K = 1,206414022241 and 170.911,373297 Cent = 1.709,11 €: the difference is
    // 95,86 Cent, and the eight funds outside the phase would be parked, which never happens because no
    // fund outside the phase is bought. The interest sum of the same case is 2 x 16,25 = 32,50 € against
    // 9 x 16,25 = 146,25 €, the difference 113,75 €, and fund 2034 alone shows 16,25 € with the dash
    // `Auflösung nach Phasenende` (asserted in `purchase.test.ts`).
    const phase: Phase = { startMonth: '2033-01', endMonth: '2034-12' };
    const taxOff: Tax = { on: false, rateMillionths: 0 };
    expect(
      formatEuro(depotFromPayoutCents(10000, FUND_LIST, phase, taxOff, FLAT_OFF, ON_250)),
    ).toBe('1.804,98\u00a0€');
  });

  it('AC5: the negative branch closes through F alone, because the term is not applied there', () => {
    // Hand, phase 01.2031-12.2033, tax 26,375 %, flat 2,24 %, depot 300 Cent: cash is the flat tax of the
    // funds that fund the phase years (2030, 2031, 2032) = 76,698488 + 109,693335 + 147,354370 =
    // 333,842117 Cent, so the money for the plan is negative (-33,842117 Cent) and F = 30,895207753782
    // gives the monthly -1,095384 Cent = -0,01 €. Feeding it back through F alone closes exactly; through
    // F - K (K = 0,308026830431) it would miss the depot by 0,337408 Cent, which is why the branch is the
    // sign of the money and not of the rate (risk 8).
    const phase: Phase = { startMonth: '2031-01', endMonth: '2033-12' };
    const tax: Tax = { on: true, rateMillionths: 263750 };
    const flat: FlatRate = { hundredths: 224 };
    const monthly = payoutFromDepotCents(300, FUND_LIST, phase, tax, flat, ON_250);
    expect(monthly).toBeCloseTo(-1.095384, 6);
    expect(formatEuro(monthly)).toBe('-0,01\u00a0€');
    expect(flatCashCents(FUND_LIST, phase, tax, flat)).toBeCloseTo(333.842117, 6);
  });

  it('AC4: the reason a year row names, read at logic level for the case the UI also reaches', () => {
    // `no-funding-fund` is asserted here at logic level and in the e2e test of AC4, because the year table
    // does show it: a phase year the fund list does not fund still has a row, so the interest cell can name
    // this reason (phase 01.2026-12.2026). The copy strings are in `fieldCopy.test.ts`.
    const phase: Phase = { startMonth: '2026-01', endMonth: '2026-12' };
    const taxOff: Tax = { on: false, rateMillionths: 0 };
    const rows = yearRows(FUND_LIST, phase, 10000, taxOff, ON_250);
    expect(rows[0]?.parkReason).toBe('no-funding-fund');
  });
});
