/**
 * The payout phase (ADR 0012): the phase months per calendar year and the fund that funds a year. A phase
 * year is funded by the fund whose maturity year is `year - 1`. The money of the phase is built in
 * `ledger.ts` (story 048), which replaced the factor closed form of ADR 0012 and 0016.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import type { Fund } from './fund.ts';

/** Whole calendar months, inclusive, as `YYYY-MM` (normalised by the parser from TT.MM.JJJJ). */
export interface Phase {
  readonly startMonth: string;
  readonly endMonth: string;
}

/** The phase months in one year (a partly covered year: 3 months for 1.1–31.3.2034). */
export function monthsInYear(phase: Phase, year: number): number {
  const start = monthParts(monthKeyOf(phase.startMonth));
  const end = monthParts(monthKeyOf(phase.endMonth));
  if (year < start.year || year > end.year) return 0;
  if (start.year === end.year) return end.month - start.month + 1;
  if (year === start.year) return 12 - start.month + 1;
  if (year === end.year) return end.month;
  return 12;
}

/** Every year the phase covers, in order, including a year without a funding fund (AC2). */
export function phaseYears(phase: Phase): number[] {
  const startYear = monthParts(monthKeyOf(phase.startMonth)).year;
  const endYear = monthParts(monthKeyOf(phase.endMonth)).year;
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) years.push(year);
  return years;
}

/** The fund that funds a phase year, or null when its December liquidation is not in the list. */
export function fundingFund(funds: readonly Fund[], year: number): Fund | null {
  return funds.find((fund) => fund.year === year - 1) ?? null;
}
