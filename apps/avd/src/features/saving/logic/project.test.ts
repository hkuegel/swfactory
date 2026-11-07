import { describe, expect, it } from 'vitest';
import type { Inputs } from './parseInputs.ts';
import { project } from './project.ts';
import { zulage } from './zulage.ts';

const BASE: Inputs = {
  age: 30,
  payoutAge: 67,
  monthlyCents: 20_000,
  children: 1,
  returnBp: 600,
  costsBp: 30,
  taxRateBp: 3000,
};

/** E = m · Σ g^i + Σ_{n<N} zulageOf(n) · g^{12(N−n)−1} + zulageOf(N) (story 013 design). */
function closedForm(inputs: Inputs): number {
  const n = inputs.payoutAge - inputs.age;
  const z = zulage(12 * inputs.monthlyCents, inputs.children, inputs.age);
  const zulageOf = (year: number) => z.perYearCents + (year === 1 ? z.bonusCents : 0);
  const g = ((1 + inputs.returnBp / 10_000) * (1 - inputs.costsBp / 10_000)) ** (1 / 12);
  let contributions = 0;
  for (let i = 0; i < 12 * n; i++) contributions += g ** i;
  let zulagen = zulageOf(n);
  for (let year = 1; year < n; year++) zulagen += zulageOf(year) * g ** (12 * (n - year) - 1);
  return inputs.monthlyCents * contributions + zulagen;
}

const ORACLE_CASES: readonly (readonly [string, Inputs])[] = [
  ['default-like', BASE],
  ['one saving year', { ...BASE, age: 69, payoutAge: 70 }],
  ['52 saving years', { ...BASE, age: 18, payoutAge: 70 }],
  ['return -10 %', { ...BASE, returnBp: -1000, costsBp: 100 }],
  ['children and bonus', { ...BASE, age: 22, children: 3, monthlyCents: 3_000 }],
];

describe('project', () => {
  it.each(ORACLE_CASES)('AC4: end value matches the closed form (%s)', (_name, inputs) => {
    expect(Math.abs(project(inputs).total.balanceCents - closedForm(inputs))).toBeLessThanOrEqual(
      1,
    );
  });

  it.each(ORACLE_CASES)('AC4/AC5: rows add up and follow the row semantics (%s)', (_, inputs) => {
    const { years, total } = project(inputs);
    expect(years).toHaveLength(inputs.payoutAge - inputs.age);
    // Row 1 has nothing credited yet, unless it is also the last row (final Zulage at payout).
    if (years.length > 1) expect(years[0]?.zulagenCents).toBe(0);
    expect(years.at(-1)).toBe(total);
    for (const row of years) {
      expect(row.contributionsCents + row.zulagenCents + row.returnsCents).toBe(row.balanceCents);
      expect(row.age).toBe(inputs.age + row.year - 1);
    }
  });

  it('AC5: a higher cost value never raises the end value', () => {
    const raised: string[] = [];
    for (const [age, monthlyCents] of [
      [18, 1_000],
      [40, 15_000],
      [64, 57_000],
    ] as const) {
      for (let returnBp = -1000; returnBp <= 2000; returnBp += 250) {
        let previous = Infinity;
        for (let costsBp = 0; costsBp <= 100; costsBp += 10) {
          const end = project({ ...BASE, age, monthlyCents, returnBp, costsBp }).total.balanceCents;
          if (end > previous) raised.push(`${age}/${monthlyCents}/${returnBp}/${costsBp}`);
          previous = end;
        }
      }
    }
    expect(raised).toEqual([]);
  });

  it.each([
    ['20 %', 2000, 0],
    ['-10 % and 1 % costs', -1000, 100],
  ] as const)('AC6: extremes stay finite and non-negative (%s)', (_name, returnBp, costsBp) => {
    const { years } = project({
      age: 18,
      payoutAge: 70,
      monthlyCents: 57_000,
      children: 10,
      returnBp,
      costsBp,
      taxRateBp: 5000,
    });
    for (const row of years) {
      for (const value of [
        row.contributionsCents,
        row.zulagenCents,
        row.returnsCents,
        row.balanceCents,
      ]) {
        expect(Number.isSafeInteger(value)).toBe(true);
      }
      expect(row.balanceCents).toBeGreaterThanOrEqual(0);
    }
  });
});
