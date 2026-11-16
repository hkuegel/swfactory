/**
 * The flat rate for accumulating funds: the Vorabpauschale of § 18 InvStG (story 045, ADR 0015). Hak's
 * model takes one rate constant over the whole term, prefilled with the Basiszins of 2026 (2,24 %). The
 * base of a calendar year is the value at the start of that year on the projection's own day count
 * (ADR 0012, so the bases stay a part of the gain the tax at liquidation reads), times the rate, reduced
 * by 1/12 for every whole calendar month before the month of acquisition, capped at the year's actual
 * increase and floored at 0. The year of liquidation does not count.
 *
 * The flat path knows a fund, its years and the rate: no phase knowledge and no reason strings, because
 * the phase decides which funds are bought and the reasons stay in the row module that shows them.
 * The year-start value and the base of a single year are internal, so a fix is tested through its
 * callers (CLAUDE.md, story 026 R3). Values stay unrounded here.
 */

import { monthKey, monthParts } from './fields.ts';
import type { Fund } from './fund.ts';
import { dayCount, RATE_UNIT, type Tax } from './projection.ts';

/** The flat rate as the form reads it: whole hundredths of a percent, 2,24 % is 224 (story 033's unit). */
export interface FlatRate {
  /** whole hundredths of a percent; 0 = no flat rate, the state the existing hand values of the tax case keep */
  readonly hundredths: number;
}

export const FLAT_OFF: FlatRate = { hundredths: 0 };

/** asOf's year and month, read from the parts of the ISO date (risk 2), in the month shape `fields.ts` normalises. */
function asOfParts(asOf: string): { year: number; month: number } {
  const [year = 0, month = 1] = asOf.split('-').map(Number);
  return monthParts(monthKey(year, month));
}

/**
 * The counted years: asOf's own year through `fundYear − 1`, so the year of liquidation does not count
 * (AC2, hak's answer of 2026-11-15). Exported because the row module names the reason "no year counts";
 * the shape of one year's base stays internal.
 */
export function flatYears(asOf: string, fundYear: number): number[] {
  const startYear = asOfParts(asOf).year;
  const years: number[] = [];
  for (let year = startYear; year <= fundYear - 1; year++) years.push(year);
  return years;
}

/**
 * The value at the start of a calendar year, as a factor per euro invested, on the projection's ACT/365
 * day count. Never earlier than `asOf`: the fund is bought now, so asOf's own year starts at the NAV.
 * Internal: it is the body of the two exported functions.
 */
function yearFactor(fund: Fund, year: number, asOf: string): number {
  const days = Math.max(0, dayCount(asOf, `${String(year)}-01-01`));
  return Math.pow(1 + fund.ytmBp / 10000, days / 365);
}

/**
 * Whole calendar months the year counts: 12 − the whole months before the acquisition month, which is
 * asOf's month (story 032 buys at the data file's NAV), and 12 for every year after it. Hak's answer to
 * Q2, so the whole-month rule reduces only asOf's own year. Internal.
 */
function wholeMonths(year: number, asOf: string): number {
  const parts = asOfParts(asOf);
  return year === parts.year ? 12 - (parts.month - 1) : 12;
}

/**
 * The base of one year, per euro invested, in the sign-safe shape the code uses:
 * `min(max(0, the year's actual increase), value at the start of the year × rate × wholeMonths / 12)`.
 * The `max(0, …)` is written on the increase, not as a possibly negative cap, because the two differ
 * exactly on the negative branch (risk 2). The increase is read on the same day count, so the bases stay
 * a part of the gain the tax at liquidation reads (risk 1). Internal.
 */
function yearBase(fund: Fund, year: number, flat: FlatRate, asOf: string): number {
  const start = yearFactor(fund, year, asOf);
  const increase = yearFactor(fund, year + 1, asOf) - start;
  const rate = flat.hundredths / 10000;
  return Math.min(Math.max(0, increase), start * rate * (wholeMonths(year, asOf) / 12));
}

/** Sum of the bases of the counted years, per euro invested — the shape `payoutFactor` reads (AC3). */
export function flatBaseFactor(fund: Fund, flat: FlatRate, asOf: string): number {
  let factor = 0;
  for (const year of flatYears(asOf, fund.year)) factor += yearBase(fund, year, flat, asOf);
  return factor;
}

/**
 * The flat tax of one counted year, micro-euro, unrounded: the internal `yearBase` of that year times the
 * rate (story 047 AC5). This is the exported caller of `yearBase`, so the year table can read one figure
 * per year, and the pieces of one fund are the same expression as the fund's whole figure below (risk 8):
 * they cannot disagree with the money rule, which is why AC5 pins the base itself from a hand value.
 */
export function flatYearMicroEur(
  fund: Fund,
  year: number,
  flat: FlatRate,
  tax: Tax,
  asOf: string,
): number {
  if (!tax.on) return 0;
  return fund.navMicroEur * yearBase(fund, year, flat, asOf) * (tax.rateMillionths / RATE_UNIT);
}

/** The flat tax of the counted years of one fund, micro-euro, unrounded; 0 outside the tax case (AC1). */
export function flatTaxMicroEur(fund: Fund, flat: FlatRate, tax: Tax, asOf: string): number {
  if (!tax.on) return 0;
  return fund.navMicroEur * flatBaseFactor(fund, flat, asOf) * (tax.rateMillionths / RATE_UNIT);
}
