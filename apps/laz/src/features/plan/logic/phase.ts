/**
 * The payout phase and the one closed form in both directions (ADR 0012, extended by ADR 0016):
 * `F = Σ m_y / ρ′_y`, `P = (D − cash) / (F − K)` and `D = P · (F − K) + cash`, where `K` is the parking term
 * of story 046 and is 0 while the option is off or the rate is 0, so the option-off pair is exactly what
 * ADR 0012 gives. A phase year is funded by the fund whose maturity year is `year − 1`; values stay
 * unrounded here. Story 045 AC5: `cash` is the flat tax of the funds that fund a phase year, undiscounted,
 * because the yearly payments are money that leaves the plan, not money that is invested.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import {
  DEPOSIT_OFF,
  parkInterestMicroEur,
  parkNetMicroEur,
  parkTaxMicroEur,
  parkTerm,
  type DepositOption,
} from './deposit.ts';
import { roundEuroCents } from './format.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { flatBaseFactor, flatTaxMicroEur, type FlatRate } from './flat.ts';
import { payoutFactor, type Tax } from './projection.ts';

/** Whole calendar months, inclusive, as `YYYY-MM` (normalised by the parser from TT.MM.JJJJ). */
export interface Phase {
  readonly startMonth: string;
  readonly endMonth: string;
}

/** Story 046 AC2/AC4: why the interest column of a row shows no number. `no-funding-fund` names the same
 * thing the funding column names, so its string is story 024's `COPY.missingYear`. */
export type ParkReason = 'option-off' | 'no-rate' | 'no-funding-fund' | 'no-money-to-park';

/** Story 046 AC3/AC4: the tax column's own reason; there is no tax without interest, so it reads the tax
 * case first and then the interest column's reason. */
export type ParkTaxReason = 'outside-tax-case' | ParkReason;

export interface YearRow {
  readonly year: number;
  /** Phase months in this year (1..12). */
  readonly months: number;
  /** The funding fund (maturity year − 1), or null when the year is reported as missing. */
  readonly fundingFund: Fund | null;
  /** Unrounded: months · monthlyCents, minus the net interest of story 046 (AC5: the money that must be
   * there at the START of the phase year). The same expression `purchase.ts` uses for `shares`, so the year
   * table's amount column and the fund table cannot show two numbers for one year; while the option is off or
   * the rate is 0 it is `months · monthlyCents` exactly, which keeps the hand values of 024, 032 and 045. */
  readonly yearAmountCents: number;
  /** Story 046 AC2: the interest the parked money earns in this year, unrounded, or null for a dash. */
  readonly parkInterestMicroEur: number | null;
  /** Story 046 AC3: the tax on that interest at the Zufluss, unrounded, or null for a dash. */
  readonly parkTaxMicroEur: number | null;
  /** Set only when the interest column shows a dash (the `flatMicroEur`/`flatReason` pattern of 045). */
  readonly parkReason: ParkReason | null;
  /** Set only when the tax column shows a dash; each column reads its own reason. */
  readonly parkTaxReason: ParkTaxReason | null;
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
 * `K = Σ k_y / ρ′_y`, the parking term of ADR 0016, read on the same `ρ′` as `F` and over the same set of
 * funds `flatCashCents` uses (the decision of 2026-11-15): a fund outside the phase is never bought, so its
 * money is never parked. Internal: only the closed form below reads it, and the year table's figures come
 * from the same `deposit.ts` expressions (risk 4). 0 while the option is off or the rate is 0, so the
 * option-off path is `F − 0`, which is exact (risk 1).
 */
function parkedFactor(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  deposit: DepositOption,
  asOf: string = FUND_LIST_AS_OF,
): number {
  let factor = 0;
  for (const year of phaseYears(phase)) {
    const fund = fundingFund(funds, year);
    if (fund === null) continue;
    const base = flatBaseFactor(fund, flat, asOf);
    const rho = payoutFactor(fund, tax, base, asOf);
    if (rho === 0) continue;
    factor += parkTerm(monthsInYear(phase, year), deposit, tax) / rho;
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

/** Depot value → monthly payout (AC2, AC5 of 045, AC3 of 046): `P = (D − cash) / (F − K)`. The term is
 * applied only where there is money to park, so a `net` of 0 or below closes through `F` alone (risk 6, 8). */
export function payoutFromDepotCents(
  depotCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  asOf: string = FUND_LIST_AS_OF,
): number {
  const factor = phaseFactor(funds, phase, tax, flat, asOf);
  if (factor === 0) return 0;
  const net = depotCents - flatCashCents(funds, phase, tax, flat, asOf);
  return net / (net > 0 ? factor - parkedFactor(funds, phase, tax, flat, deposit, asOf) : factor);
}

/** Monthly target → depot value (the same pair inverted): `D = P · (F − K) + cash`, with `K` applied only
 * for a positive monthly target, so the negative branch is exactly today's model (ADR 0016). */
export function depotFromPayoutCents(
  monthlyCents: number,
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  asOf: string = FUND_LIST_AS_OF,
): number {
  const factor = phaseFactor(funds, phase, tax, flat, asOf);
  const applied =
    monthlyCents > 0 ? factor - parkedFactor(funds, phase, tax, flat, deposit, asOf) : factor;
  return monthlyCents * applied + flatCashCents(funds, phase, tax, flat, asOf);
}

/**
 * The year rows, with the two figures the parking columns show and their own reason. The order the copy
 * reads is the order AC names: the option first, then the funding fund, then the money that could be
 * parked, then the rate (AC1 makes a rate of 0 the same state as off). A figure is non-null exactly when its
 * reason is null, and the tax column reads the tax case before the interest column's reason, because there
 * is no tax without interest (AC3, AC4).
 */
export function yearRows(
  funds: readonly Fund[],
  phase: Phase,
  monthlyCents: number,
  tax: Tax,
  deposit: DepositOption,
): YearRow[] {
  return phaseYears(phase).map((year) => {
    const fund = fundingFund(funds, year);
    const months = monthsInYear(phase, year);
    const monthlyMicroEur = monthlyCents * 10000;
    const parkReason: ParkReason | null = !deposit.on
      ? 'option-off'
      : fund === null
        ? 'no-funding-fund'
        : monthlyMicroEur <= 0
          ? 'no-money-to-park'
          : deposit.hundredths === 0
            ? 'no-rate'
            : null;
    const parkTaxReason: ParkTaxReason | null = !tax.on ? 'outside-tax-case' : parkReason;
    const interest =
      parkReason === null ? parkInterestMicroEur(monthlyMicroEur, deposit, months) : null;
    const taxFigure =
      interest === null || parkTaxReason !== null ? null : parkTaxMicroEur(interest, tax);
    // AC5: the money that must be at the START of the phase year, the same `deposit.ts` expression
    // `purchase.ts` uses for `shares`, so the year table's amount column and the fund table cannot show two
    // numbers for one year. With the option off or the rate 0 the net is 0, so this is exactly the value
    // story 024, 032 and 045 show (risk 1), and a row without a funding fund keeps 0 (AC2).
    const netMicroEur = fund === null ? 0 : parkNetMicroEur(monthlyMicroEur, deposit, months, tax);
    return {
      year,
      months,
      fundingFund: fund,
      yearAmountCents: fund === null ? 0 : (monthlyMicroEur * months - netMicroEur) / 10000,
      parkInterestMicroEur: interest,
      parkTaxMicroEur: taxFigure,
      parkReason,
      parkTaxReason,
    };
  });
}

/** The plan the components read; both directions use the same `F`, the same `K` and the same `cash`. */
export function buildPlan(
  funds: readonly Fund[],
  phase: Phase,
  tax: Tax,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
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
      ? payoutFromDepotCents(amountCents, funds, phase, tax, flat, deposit, asOf)
      : amountCents;
  const rows = yearRows(funds, phase, monthlyCents, tax, deposit);
  const fundedYears = rows.filter((row) => row.fundingFund !== null);
  const applied =
    monthlyCents > 0 ? factor - parkedFactor(funds, phase, tax, flat, deposit, asOf) : factor;
  return {
    years: rows,
    fundedYears,
    phaseFactor: factor,
    monthlyCents,
    depotCents: direction === 'depot' ? amountCents : monthlyCents * applied + cash,
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

/** Story 046 AC4: the two parked figures of a row as they are shown, one rounding each (`roundEuroCents`),
 * `null` for a dash — so the sum line is the sum of the SHOWN figures, not of the unrounded ones. */
export interface ParkCents {
  readonly interestCents: number | null;
  readonly taxCents: number | null;
}

export function displayParkCents(plan: Plan): readonly ParkCents[] {
  return plan.years.map((row) => ({
    interestCents:
      row.parkInterestMicroEur === null ? null : roundEuroCents(row.parkInterestMicroEur),
    taxCents: row.parkTaxMicroEur === null ? null : roundEuroCents(row.parkTaxMicroEur),
  }));
}

/**
 * The sums the year section states once (AC4): the sum of the SHOWN cents, `null` when no row has an
 * interest figure — nothing is invented for an empty sum (the display rule story 045 recorded). `taxCents`
 * is `null` when no row shows a tax figure, so the second sentence of the sum line is not shown either.
 */
export interface ParkSums {
  readonly interestCents: number;
  readonly taxCents: number | null;
}

export function parkSumsCents(shown: readonly ParkCents[]): ParkSums | null {
  const interest = shown.filter((row) => row.interestCents !== null);
  if (interest.length === 0) return null;
  const tax = shown.filter((row) => row.taxCents !== null);
  return {
    interestCents: interest.reduce((sum, row) => sum + (row.interestCents ?? 0), 0),
    taxCents: tax.length === 0 ? null : tax.reduce((sum, row) => sum + (row.taxCents ?? 0), 0),
  };
}
