import { describe, expect, it } from 'vitest';
import { etfDepot } from './etfDepot.ts';
import type { Inputs } from './parseInputs.ts';

// Branching ETF tax logic of ADR 0009 (story 016), inputs other than the AC values; the AC
// oracles are checked in e2e. Expected values from two independent scratchpad models.
const BASE: Inputs = {
  age: 57,
  payoutAge: 65,
  monthlyCents: 15_000,
  children: 0,
  returnBp: 500,
  costsBp: 50,
  taxRateBp: 3000,
  retirementRateBp: 2000,
};
/** 70 % taxable (Teilfreistellung) times 26,375 %. */
const EFFECTIVE_RATE = 0.7 * 0.26375;
const SPANS = [
  [18, 65],
  [18, 70],
  [40, 65],
  [40, 70],
  [69, 70],
] as const;

describe('etfDepot', () => {
  it('AC8: without the Pauschbetrag the tax is 26,375 % of 70 % of the gain, taxed once', () => {
    const problems: string[] = [];
    for (const [age, payoutAge] of SPANS) {
      for (const monthlyCents of [1_000, 15_000, 57_000]) {
        for (const returnBp of [300, 500, 2000]) {
          for (const costsBp of [0, 100]) {
            const inputs: Inputs = { ...BASE, age, payoutAge, monthlyCents, returnBp, costsBp };
            const etf = etfDepot(inputs, false);
            const own = 12 * monthlyCents * (payoutAge - age);
            const expected = EFFECTIVE_RATE * (etf.grossPayoutsCents - own);
            if (Math.abs(etf.taxCents - expected) >= 1) {
              problems.push(
                `${String(age)}/${String(payoutAge)}/${String(monthlyCents)}/${String(returnBp)}/${String(costsBp)}: ${String(etf.taxCents)} vs ${String(expected)}`,
              );
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('AC12: sells first in, first out with the yearly Pauschbetrag (average cost would give 521,75)', () => {
    const etf = etfDepot({ ...BASE, age: 30, monthlyCents: 5_000, costsBp: 100 }, true);
    expect(etf.taxCents).toBe(77_487);
  });

  it('AC12: with one saving year the Vorabpauschale is income of the first payout year', () => {
    const inputs: Inputs = { ...BASE, age: 69, payoutAge: 70 };
    expect(etfDepot(inputs, false)).toEqual({
      depotCents: 183_663,
      grossPayoutsCents: 250_976,
      taxCents: 13_104,
      // Taxed in its own year, the saving phase would show 3,96 EUR.
      savingPhaseTaxCents: 0,
    });
    expect(etfDepot(inputs, true).taxCents).toBe(0);
  });

  it('AC7, AC12: every amount is a finite integer, the Pauschbetrag never raises the tax, no tax without a return', () => {
    const problems: string[] = [];
    for (const [age, payoutAge] of [
      [18, 65],
      [57, 70],
      [69, 70],
    ] as const) {
      for (const monthlyCents of [0, 999, 57_000]) {
        for (const returnBp of [-1000, 0, 1, 500, 2000]) {
          for (const costsBp of [0, 100]) {
            const inputs: Inputs = { ...BASE, age, payoutAge, monthlyCents, returnBp, costsBp };
            const key = `${String(age)}/${String(payoutAge)}/${String(monthlyCents)}/${String(returnBp)}/${String(costsBp)}`;
            const checked = etfDepot(inputs, true);
            const unchecked = etfDepot(inputs, false);
            for (const etf of [checked, unchecked]) {
              const values = Object.values(etf);
              if (!values.every((v) => Number.isSafeInteger(v) && v >= 0)) {
                problems.push(`${key}: ${JSON.stringify(etf)}`);
              }
              if (etf.grossPayoutsCents < etf.taxCents) problems.push(`${key}: tax above gross`);
              if (returnBp <= 0 && etf.taxCents !== 0) problems.push(`${key}: tax without return`);
            }
            if (checked.taxCents > unchecked.taxCents)
              problems.push(`${key}: allowance raised tax`);
            if (checked.depotCents !== unchecked.depotCents) problems.push(`${key}: depot moved`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
