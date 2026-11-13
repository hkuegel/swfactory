import { describe, expect, it } from 'vitest';
import { FUND_LIST } from './fund.ts';
import { formatEuro } from './format.ts';
import { depotFromPayoutCents, payoutFromDepotCents } from './phase.ts';
import type { Phase } from './phase.ts';
import type { Tax } from './projection.ts';

/** The example phase of the story (1.1.2028 – 31.3.2034). AC3 names the tax parameter, so both states. */
const PHASE: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
const TAX_OFF: Tax = { on: false, rateBp: 0 };
const TAX_25: Tax = { on: true, rateBp: 2500 };

describe('phase (ADR 0012, the one closed form)', () => {
  it('AC3: the round trip depot → monthly payout → depot differs by at most one cent', () => {
    for (const tax of [TAX_OFF, TAX_25]) {
      for (const depotCents of [0, 1000000, 20000000]) {
        // The unrounded internal value is fed back, not the shown text (risk 1).
        const monthlyCents = payoutFromDepotCents(depotCents, FUND_LIST, PHASE, tax);
        const back = depotFromPayoutCents(monthlyCents, FUND_LIST, PHASE, tax);
        expect(Math.abs(back - depotCents)).toBeLessThanOrEqual(1);
      }
    }

    // Hand oracles: F = 55,125236 (tax off) and F = 56,844419 (tax on, r 25 %), so depot 10.000,00 €
    // gives 18140,512 cents = 181,41 € and 17591,876 cents = 175,92 €; the largest depot the list
    // covers, 200.000,00 €, gives 362810,239 cents = 3.628,10 € (tax off).
    const monthlyOff = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_OFF);
    const monthlyTaxed = payoutFromDepotCents(1000000, FUND_LIST, PHASE, TAX_25);
    expect(formatEuro(monthlyOff)).toBe('181,41\u00a0€');
    expect(formatEuro(monthlyTaxed)).toBe('175,92\u00a0€');
    expect(formatEuro(payoutFromDepotCents(20000000, FUND_LIST, PHASE, TAX_OFF))).toBe(
      '3.628,10\u00a0€',
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
});
