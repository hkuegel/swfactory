/**
 * The payout phase and the one closed form in both directions (ADR 0012):
 * `F = Σ m_y / ρ′_y`, `P = D / F` and `D = P · F`. A phase year is funded by the fund whose
 * maturity year is `year − 1`; values stay unrounded here.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import type { Fund } from './fund.ts';
import { payoutFactor, type Tax } from './projection.ts';

/** Whole calendar months, inclusive, as `YYYY-MM` (normalised by the parser from TT.MM.JJJJ). */
export interface Phase {
  readonly startMonth: string;
  readonly endMonth: string;
}

export interface YearRow {
  readonly year: number;
  /** Phase months in this year (1..12). */
  readonly months: number;
  /** The funding fund (maturity year − 1), or null when the year is reported as missing. */
  readonly fundingFund: Fund | null;
  /** Unrounded: months · monthlyCents. */
  readonly yearAmountCents: number;
}

export interface Plan {
  readonly years: readonly YearRow[];
  /** Only the years with a funding fund count (AC2). */
  readonly fundedYears: readonly YearRow[];
  readonly phaseFactor: number;
  /** Unrounded floats in cents; rounded once when shown. */
  readonly monthlyCents: number;
  readonly depotCents: number;
  readonly totalCents: number;
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

/** ρ′ of the fund that funds one year; a year without a fund has no ρ′ (AC2). */
export function phaseFactor(funds: readonly Fund[], phase: Phase, tax: Tax): number {
  let factor = 0;
  for (const year of phaseYears(phase)) {
    const fund = fundingFund(funds, year);
    if (fund === null) continue;
    factor += monthsInYear(phase, year) / payoutFactor(fund, tax);
  }
  return factor;
}

/** Depot value → monthly payout (AC2): `P = D / F`. */
export function payoutFromDepotCents(
  depotCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
): number {
  const factor = phaseFactor(funds, phase, tax);
  return factor === 0 ? 0 : depotCents / factor;
}

/** Monthly target → depot value (AC2 the other way): `D = P · F`, the same `F` inverted. */
export function depotFromPayoutCents(
  monthlyCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
): number {
  return monthlyCents * phaseFactor(funds, phase, tax);
}

export function yearRows(funds: readonly Fund[], phase: Phase, monthlyCents: number): YearRow[] {
  return phaseYears(phase).map((year) => {
    const fund = fundingFund(funds, year);
    const months = monthsInYear(phase, year);
    return {
      year,
      months,
      fundingFund: fund,
      yearAmountCents: fund === null ? 0 : monthlyCents * months,
    };
  });
}

/** The plan the components read; both directions use the same `F`. */
export function buildPlan(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  amountCents: number,
  direction: 'depot' | 'payout',
): Plan {
  const factor = phaseFactor(funds, phase, tax);
  // A phase with no funding fund has no factor (risk 4 in the technical design), so there is no
  // division by zero here; the UI shows "no result possible" instead of a figure.
  const monthlyCents =
    direction === 'depot' ? payoutFromDepotCents(amountCents, funds, phase, tax) : amountCents;
  const rows = yearRows(funds, phase, monthlyCents);
  const fundedYears = rows.filter((row) => row.fundingFund !== null);
  return {
    years: rows,
    fundedYears,
    phaseFactor: factor,
    monthlyCents,
    depotCents: direction === 'depot' ? amountCents : monthlyCents * factor,
    totalCents: fundedYears.reduce((sum, row) => sum + row.yearAmountCents, 0),
  };
}

/**
 * Cents as they are shown: rounded once, and the last funded year as the total minus the others,
 * so the shown rows add up to the shown total (ADR 0012). `null` for a year without a fund.
 */
export function displayYearCents(plan: Plan): readonly (number | null)[] {
  const funded = plan.years.filter((row) => row.fundingFund !== null);
  if (funded.length === 0) return plan.years.map(() => null);
  const total = Math.round(plan.totalCents);
  const others = funded.slice(0, -1).reduce((sum, row) => sum + Math.round(row.yearAmountCents), 0);
  const last = funded[funded.length - 1];
  return plan.years.map((row) => {
    if (row.fundingFund === null) return null;
    return row === last ? total - others : Math.round(row.yearAmountCents);
  });
}
