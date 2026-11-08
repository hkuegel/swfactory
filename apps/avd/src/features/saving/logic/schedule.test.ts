import { describe, expect, it } from 'vitest';
import type { Inputs } from './parseInputs.ts';
import { CONTRIBUTION_CAP_CENTS, perYearRange, savingSchedule } from './schedule.ts';

// Inputs other than the AC values of story 015; the AC oracles are checked in e2e.
const BASE: Inputs = {
  age: 57,
  payoutAge: 65,
  monthlyCents: 54_500,
  children: 0,
  returnBp: 500,
  costsBp: 50,
  taxRateBp: 4200,
  retirementRateBp: 2000,
};

describe('savingSchedule', () => {
  it('2a: only the part of the refund up to the 6.840 EUR cap is reinvested; R(N) never', () => {
    const schedule = savingSchedule(BASE, true);
    expect(schedule).toHaveLength(8);
    expect(schedule.map((y) => y.reinvestedCents)).toEqual([0, ...Array<number>(7).fill(30_000)]);
    expect(schedule.map((y) => y.contributionCents)).toEqual([
      654_000,
      ...Array<number>(7).fill(684_000),
    ]);
    // c above 1.800 EUR: Zulage and deduction at their maximum, so R stays 442,80 EUR.
    expect(schedule.every((y) => y.refundCents === 44_280)).toBe(true);
    // 7 · 300 EUR in; R(8) is not in any year (there is no year 9).
    expect(schedule.reduce((sum, y) => sum + y.reinvestedCents, 0)).toBe(210_000);
  });

  it('2a, AC5: invariants over a sweep of inputs, unchecked = 12 · monthly in every year', () => {
    const problems: string[] = [];
    for (const age of [18, 24, 40, 69]) {
      for (const monthlyCents of [0, 999, 1_000, 2_501, 15_000, 54_500, 57_000]) {
        for (const children of [0, 1, 10]) {
          for (const taxRateBp of [0, 2310, 4200, 5000]) {
            const inputs: Inputs = {
              ...BASE,
              age,
              payoutAge: 70,
              monthlyCents,
              children,
              taxRateBp,
            };
            const key = `${String(age)}/${String(monthlyCents)}/${String(children)}/${String(taxRateBp)}`;
            const checked = savingSchedule(inputs, true);
            const unchecked = savingSchedule(inputs, false);
            checked.forEach((y, i) => {
              const previousRefund = checked[i - 1]?.refundCents ?? 0;
              const values = [y.ownCents, y.reinvestedCents, y.contributionCents];
              if (![...values, y.zulageCents, y.refundCents].every(Number.isSafeInteger))
                problems.push(`${key}: not an integer in year ${String(y.year)}`);
              if (y.contributionCents > CONTRIBUTION_CAP_CENTS)
                problems.push(`${key}: above the cap in year ${String(y.year)}`);
              if (y.reinvestedCents < 0 || y.reinvestedCents > previousRefund)
                problems.push(`${key}: reinvested out of range in year ${String(y.year)}`);
              if (y.contributionCents !== y.ownCents + y.reinvestedCents)
                problems.push(`${key}: c != own + reinvested in year ${String(y.year)}`);
            });
            unchecked.forEach((y) => {
              if (y.reinvestedCents !== 0 || y.contributionCents !== 12 * monthlyCents)
                problems.push(`${key}: unchecked year ${String(y.year)} differs from 014`);
            });
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('perYearRange', () => {
  it('covers years 2 … N, year 1 only without the bonus, and is null for one year with bonus', () => {
    expect(perYearRange([20_000, 150, 172], true)).toEqual({ min: 150, max: 172 });
    expect(perYearRange([140, 150, 172], false)).toEqual({ min: 140, max: 172 });
    expect(perYearRange([20_000], true)).toBeNull();
    expect(perYearRange([150], false)).toEqual({ min: 150, max: 150 });
  });
});
