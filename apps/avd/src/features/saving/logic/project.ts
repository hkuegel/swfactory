import type { Inputs } from './parseInputs.ts';
import { savingSchedule, type ScheduleYear } from './schedule.ts';
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
  /** Cumulative reinvested tax refund credited (story 015; row 1: 0; 0 while unchecked). */
  readonly reinvestedCents: number;
  /** balance − contributions − Zulagen − reinvested (may be negative). */
  readonly returnsCents: number;
  /** Balance at year end, rounded once. */
  readonly balanceCents: number;
}

export interface Projection {
  /** Zulage of c = 12 · monthly (year 1, the Zulage details of 013). */
  readonly zulage: Zulage;
  /** One per saving year, index = year − 1 (ADR 0008). */
  readonly schedule: readonly ScheduleYear[];
  /** length = payoutAge − age, >= 1. */
  readonly years: readonly YearRow[];
  /** = last row: end value at payout start and its parts. */
  readonly total: YearRow;
}

export interface ProjectOptions {
  /** Story 015: pay the refund of year n into the depot on 1 January of year n + 1. */
  readonly reinvestRefund: boolean;
}

const UNCHECKED: ProjectOptions = { reinvestRefund: false };

const BP = 10_000;
const MONTHS = 12;

/** Zulage of saving year `year` (1-based) from the schedule; 0 outside it. */
function zulageOf(schedule: readonly ScheduleYear[], year: number): number {
  return schedule[year - 1]?.zulageCents ?? 0;
}

/**
 * Monthly projection of the saving phase (story 013 Context, ADR 0007, ADR 0008): the reinvested
 * refund of the previous year on 1 January (story 015), contributions at the end of each month,
 * net return (1 + r)(1 − costs) − 1, Zulage of year n credited at the end of January of year
 * n + 1, the last Zulage added at payout start without returns. Zulagen and reinvested amounts
 * come from the yearly schedule. The balance is an unrounded float in cents; each reported value
 * is rounded once. Unchecked, the reinvested amounts are 0 and the float operations are those of
 * story 013.
 */
export function project(inputs: Inputs, options: ProjectOptions = UNCHECKED): Projection {
  const { age, payoutAge, monthlyCents, children, returnBp, costsBp } = inputs;
  const savingYears = payoutAge - age;
  const z = zulage(MONTHS * monthlyCents, children, age);
  const schedule = savingSchedule(inputs, options.reinvestRefund);
  const netRate = (1 + returnBp / BP) * (1 - costsBp / BP) - 1;
  const monthlyGrowth = (1 + netRate) ** (1 / MONTHS);

  const years: YearRow[] = [];
  let balance = 0;
  let zulagenCents = 0;
  let reinvestedCents = 0;
  for (let year = 1; year <= savingYears; year++) {
    // 1 January, before the first monthly contribution: earns the full 12 months (adding 0 is exact).
    const reinvested = schedule[year - 1]?.reinvestedCents ?? 0;
    balance += reinvested;
    reinvestedCents += reinvested;
    for (let month = 1; month <= MONTHS; month++) {
      balance = balance * monthlyGrowth + monthlyCents;
      if (month === 1 && year >= 2) {
        balance += zulageOf(schedule, year - 1);
        zulagenCents += zulageOf(schedule, year - 1);
      }
    }
    if (year === savingYears) {
      balance += zulageOf(schedule, year);
      zulagenCents += zulageOf(schedule, year);
    }
    const contributionsCents = year * MONTHS * monthlyCents;
    const balanceCents = Math.round(balance);
    years.push({
      year,
      age: age + year - 1,
      contributionsCents,
      zulagenCents,
      reinvestedCents,
      returnsCents: balanceCents - contributionsCents - zulagenCents - reinvestedCents,
      balanceCents,
    });
  }
  const total = years[years.length - 1];
  // parseInputs guarantees payoutAge > age, so there is at least one saving year.
  if (total === undefined) throw new Error('project: no saving year');
  return { zulage: z, schedule, years, total };
}
