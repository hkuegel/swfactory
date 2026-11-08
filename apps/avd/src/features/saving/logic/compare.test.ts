import { describe, expect, it } from 'vitest';
import { compareDepots, unsubsidisedCents } from './compare.ts';
import type { Inputs } from './parseInputs.ts';
import { project } from './project.ts';
import type { ScheduleYear } from './schedule.ts';
import { taxRefund } from './taxRefund.ts';

// Branching AVD logic of ADR 0009 (story 016), inputs other than the AC values; the AC oracles are
// checked in e2e. Expected values from two independent scratchpad models.
const BASE: Inputs = {
  age: 57,
  payoutAge: 65,
  monthlyCents: 57_000,
  children: 0,
  returnBp: 500,
  costsBp: 50,
  taxRateBp: 3000,
  retirementRateBp: 2000,
};

function compare(inputs: Inputs, reinvestRefund = false) {
  const projection = project(inputs, { reinvestRefund });
  return compareDepots(inputs, projection, taxRefund(inputs, projection), { useAllowance: true });
}

function year(contributionCents: number): ScheduleYear {
  return {
    year: 1,
    ownCents: contributionCents,
    reinvestedCents: 0,
    contributionCents,
    zulageCents: 0,
    refundCents: 0,
  };
}

describe('unsubsidisedCents', () => {
  it('AC4: below 120 EUR all of c, else the part above 1.800 EUR', () => {
    const cases = [
      [11_988, 11_988],
      [12_000, 0],
      [180_000, 0],
      [196_200, 16_200],
      [684_000, 504_000],
    ] as const;
    for (const [c, expected] of cases)
      expect(unsubsidisedCents([year(c)]), String(c)).toBe(expected);
  });
});

describe('compareDepots', () => {
  it('AC4: the unsubsidised part is taxed on its gain only', () => {
    const { avd } = compare({ ...BASE, age: 69, payoutAge: 70 });
    expect(avd.depotCents).toBe(751_918);
    expect(avd.grossPayoutsCents).toBe(1_027_497);
    expect(avd.unsubsidisedCents).toBe(504_000);
    expect(avd.taxCents).toBe(104_699);
  });

  it('AC7: payouts below the unsubsidised contributions are not taxed', () => {
    const { avd } = compare({ ...BASE, returnBp: -1000, costsBp: 100, retirementRateBp: 2500 });
    expect(avd.grossPayoutsCents).toBe(986_871);
    expect(avd.unsubsidisedCents).toBe(4_032_000);
    expect(avd.taxCents).toBe(0);
    expect(avd.netPayoutsCents).toBe(avd.grossPayoutsCents);
  });

  it('AC5: refunds above the 6.840 EUR cap stay with the saver and count to the yield', () => {
    const { avd } = compare({ ...BASE, monthlyCents: 54_500, taxRateBp: 4200 }, true);
    // 3.542,40 refunds − 7 · 300,00 reinvested: more than the last year's 442,80.
    expect(avd.keptRefundsCents).toBe(144_240);
    expect(avd.unsubsidisedCents).toBe(4_002_000);
    expect(avd.yieldCents).toBe(4_144_031);
  });
});
