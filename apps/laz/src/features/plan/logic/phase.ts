/**
 * The payout phase and the one closed form in both directions (ADR 0012):
 * `F = Σ m_y / ρ′_y`, `P = (D − cash) / F` and `D = P · F + cash`. A phase year is funded by the fund
 * whose maturity year is `year − 1`; values stay unrounded here. Story 045 AC5: `cash` is the flat tax of
 * the funds that fund a phase year, undiscounted, because the yearly payments are money that leaves the
 * plan, not money that is invested. With `flat = FLAT_OFF` this is the pair ADR 0012 gives.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { flatBaseFactor, flatTaxMicroEur, type FlatRate } from './flat.ts';
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
  /** Story 045 AC5: the part of the depot the fund table does not show, in cents, unrounded. */
  readonly flatCashCents: number;
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
export function phaseFactor(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  asOf: string = FUND_LIST_AS_OF,
): number {
  let factor = 0;
  for (const year of phaseYears(phase)) {
    const fund = fundingFund(funds, year);
    if (fund === null) continue;
    const base = flatBaseFactor(fund, flat, asOf);
    factor += monthsInYear(phase, year) / payoutFactor(fund, tax, base, asOf);
  }
  return factor;
}

/**
 * The flat tax of the funds that fund a phase year, undiscounted, in cents (unrounded). Only those funds
 * are in the depot: a fund outside the phase is not bought, so its money is not part of the depot (the
 * architect's decision of 2026-11-15, the same reason story 032 AC3 gives for its dash).
 */
export function flatCashCents(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  asOf: string = FUND_LIST_AS_OF,
): number {
  let cash = 0;
  for (const year of phaseYears(phase)) {
    const fund = fundingFund(funds, year);
    if (fund === null) continue;
    cash += flatTaxMicroEur(fund, flat, tax, asOf) / 10000;
  }
  return cash;
}

/** Depot value → monthly payout (AC2, AC5 of 045): `P = (D − cash) / F`. */
export function payoutFromDepotCents(
  depotCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  asOf: string = FUND_LIST_AS_OF,
): number {
  const factor = phaseFactor(funds, phase, tax, flat, asOf);
  if (factor === 0) return 0;
  return (depotCents - flatCashCents(funds, phase, tax, flat, asOf)) / factor;
}

/** Monthly target → depot value (the same pair inverted): `D = P · F + cash`. */
export function depotFromPayoutCents(
  monthlyCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  asOf: string = FUND_LIST_AS_OF,
): number {
  return (
    monthlyCents * phaseFactor(funds, phase, tax, flat, asOf) +
    flatCashCents(funds, phase, tax, flat, asOf)
  );
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

/** The plan the components read; both directions use the same `F` and the same `cash`. */
export function buildPlan(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  amountCents: number,
  direction: 'depot' | 'payout',
  asOf: string = FUND_LIST_AS_OF,
): Plan {
  const factor = phaseFactor(funds, phase, tax, flat, asOf);
  const cash = flatCashCents(funds, phase, tax, flat, asOf);
  // A phase with no funding fund has no factor (risk 4 in the technical design), so there is no
  // division by zero here; the UI shows "no result possible" instead of a figure.
  const monthlyCents =
    direction === 'depot'
      ? payoutFromDepotCents(amountCents, funds, phase, tax, flat, asOf)
      : amountCents;
  const rows = yearRows(funds, phase, monthlyCents);
  const fundedYears = rows.filter((row) => row.fundingFund !== null);
  return {
    years: rows,
    fundedYears,
    phaseFactor: factor,
    monthlyCents,
    depotCents: direction === 'depot' ? amountCents : monthlyCents * factor + cash,
    totalCents: fundedYears.reduce((sum, row) => sum + row.yearAmountCents, 0),
    flatCashCents: cash,
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
