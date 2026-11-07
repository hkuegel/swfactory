import { describe, expect, it } from 'vitest';
import type { Inputs } from './parseInputs.ts';
import { project } from './project.ts';
import { refundCents, taxRefund } from './taxRefund.ts';

// Inputs other than the AC values of story 014; the AC oracles are checked in e2e.
const BASE: Inputs = {
  age: 57,
  payoutAge: 65,
  monthlyCents: 12_345,
  children: 0,
  returnBp: 500,
  costsBp: 50,
  taxRateBp: 2600,
};

function refundOf(inputs: Inputs) {
  return taxRefund(inputs, project(inputs));
}

describe('refundCents', () => {
  it('AC2: the half cent rounds up once (1.941,75 · 26 % = 504,855 → 44,51 EUR)', () => {
    expect(refundCents(148_140, 46_035, 2600)).toBe(4451);
  });
});

describe('taxRefund', () => {
  it('AC2: the total is the sum of the rounded yearly amounts and net = own − total', () => {
    const refund = refundOf(BASE);
    expect(refund.byYearCents).toEqual(Array<number>(8).fill(4451));
    expect(refund.perYearCents).toBe(4451);
    expect(refund.firstYearCents).toBe(4451);
    // Rounding the total once would give 356,04 EUR.
    expect(refund.totalCents).toBe(35_608);
    expect(refund.netContributionsCents).toBe(8 * 12 * 12_345 - 35_608);
  });

  it('AC3, AC6: refunds are integers >= 0, never fall with a higher rate, and net stays >= 0', () => {
    const problems: string[] = [];
    for (const monthlyCents of [0, 998, 1000, 10_000, 15_000, 57_000]) {
      for (const children of [0, 1, 10]) {
        for (const age of [20, 40]) {
          const inputs: Inputs = { ...BASE, age, monthlyCents, children };
          const projection = project(inputs);
          let previous: readonly number[] = [];
          for (let taxRateBp = 0; taxRateBp <= 5000; taxRateBp += 25) {
            const refund = taxRefund({ ...inputs, taxRateBp }, projection);
            const key = `${String(monthlyCents)}/${String(children)}/${String(age)}/${String(taxRateBp)}`;
            refund.byYearCents.forEach((cents, i) => {
              if (!Number.isSafeInteger(cents) || cents < 0)
                problems.push(`${key}: ${String(cents)}`);
              if (cents < (previous[i] ?? 0))
                problems.push(`${key}: fell in year ${String(i + 1)}`);
            });
            if (refund.netContributionsCents < 0) problems.push(`${key}: negative net`);
            previous = refund.byYearCents;
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
