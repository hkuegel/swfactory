import type { Inputs } from './parseInputs.ts';
import { zulage, type Zulage } from './zulage.ts';

export interface YearRow {
  /** 1-based saving year. */
  readonly year: number;
  /** Age in that year: age + year − 1. */
  readonly age: number;
  /** Cumulative own contributions. */
  readonly contributionsCents: number;
  /** Cumulative Zulagen credited (row 1: 0; last row incl. the final one). */
  readonly zulagenCents: number;
  /** balance − contributions − Zulagen (may be negative). */
  readonly returnsCents: number;
  /** Balance at year end, rounded once. */
  readonly balanceCents: number;
}

export interface Projection {
  readonly zulage: Zulage;
  /** length = payoutAge − age, >= 1. */
  readonly years: readonly YearRow[];
  /** = last row: end value at payout start and its three parts. */
  readonly total: YearRow;
}

const BP = 10_000;
const MONTHS = 12;

/**
 * Monthly projection of the saving phase (story 013 Context, ADR 0007): contributions at the end
 * of each month, net return (1 + r)(1 − costs) − 1, Zulage of year n credited at the end of
 * January of year n + 1, the last Zulage added at payout start without returns. The balance is
 * an unrounded float in cents; each reported value is rounded once.
 */
export function project(inputs: Inputs): Projection {
  const { age, payoutAge, monthlyCents, children, returnBp, costsBp } = inputs;
  const savingYears = payoutAge - age;
  const z = zulage(MONTHS * monthlyCents, children, age);
  const zulageOf = (year: number): number => z.perYearCents + (year === 1 ? z.bonusCents : 0);
  const netRate = (1 + returnBp / BP) * (1 - costsBp / BP) - 1;
  const monthlyGrowth = (1 + netRate) ** (1 / MONTHS);

  const years: YearRow[] = [];
  let balance = 0;
  let zulagenCents = 0;
  for (let year = 1; year <= savingYears; year++) {
    for (let month = 1; month <= MONTHS; month++) {
      balance = balance * monthlyGrowth + monthlyCents;
      if (month === 1 && year >= 2) {
        balance += zulageOf(year - 1);
        zulagenCents += zulageOf(year - 1);
      }
    }
    if (year === savingYears) {
      balance += zulageOf(year);
      zulagenCents += zulageOf(year);
    }
    const contributionsCents = year * MONTHS * monthlyCents;
    const balanceCents = Math.round(balance);
    years.push({
      year,
      age: age + year - 1,
      contributionsCents,
      zulagenCents,
      returnsCents: balanceCents - contributionsCents - zulagenCents,
      balanceCents,
    });
  }
  const total = years[years.length - 1];
  // parseInputs guarantees payoutAge > age, so there is at least one saving year.
  if (total === undefined) throw new Error('project: no saving year');
  return { zulage: z, years, total };
}
