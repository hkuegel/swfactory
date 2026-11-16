/**
 * The deposit account's own path (story 046, ADR 0016): the month sum of one phase year, the interest it
 * earns, the tax on that interest at the Zufluss, the net interest and the term `k_y` that `phase.ts` sums.
 * Like `flat.ts` of story 045 it knows a month count, the rate and the tax: no phase knowledge and no
 * reason strings, because the phase decides which years are bought and the reasons stay in the row module
 * that shows them. The sign of the monthly money is not decided here either: the term is a factor and
 * cannot see it, so that branch lives in `phase.ts` (risk 8). Values stay unrounded here.
 */

import { RATE_UNIT, type Tax } from './projection.ts';

/** The option as the form reads it: the switch of AC1 and the rate in whole hundredths of a percent
 * (2,50 % is 250, the unit the flat field of story 045 uses), constant over the whole term (hak's Q1). */
export interface DepositOption {
  /** the switch; off means no interest is calculated anywhere (AC1) */
  readonly on: boolean;
  /** whole hundredths of a percent; 0 is the rate that pays nothing */
  readonly hundredths: number;
}

/** The state the app starts with: off, so the first render and every existing hand value stay (AC1). */
export const DEPOSIT_OFF: DepositOption = { on: false, hundredths: 0 };

/**
 * `(1 + 2 + … + m) / 12 = m(m + 1) / 24` year units, 0 for `m = 0` (AC2): the average of the balances that
 * wait at the start of each month of one phase year. Internal: it is the body of the interest, the net and
 * the term below, and the one expression AC2's figure and AC5's term share, so a mutation of it moves both
 * (risk 4, P32).
 */
function monthSum(months: number): number {
  return months === 0 ? 0 : (months * (months + 1)) / 24;
}

/**
 * The interest of one phase year, micro-euro, unrounded, in the sign-safe shape the code uses:
 * `max(0, monthlyMicroEur) × (hundredths / 10000) × monthSum(months)`. It takes the MONTHLY money, because
 * the story's formula is `P × rate × m(m+1)/24`; a year amount (`P·m`) would need `(m+1)/24` and hides an
 * `m` (risk 7). It is 0 when the option is off, the rate is 0 or there is no month, and it is never
 * negative (AC2), because a deposit account cannot go below zero.
 */
export function parkInterestMicroEur(
  monthlyMicroEur: number,
  deposit: DepositOption,
  months: number,
): number {
  if (!deposit.on) return 0;
  return Math.max(0, monthlyMicroEur) * (deposit.hundredths / 10000) * monthSum(months);
}

/** The tax on that interest at the Zufluss (hak's Q4), micro-euro, unrounded, with the rate story 031
 * gives; 0 outside the tax case, where the gross interest is what reduces the money the plan needs (AC3). */
export function parkTaxMicroEur(interestMicroEur: number, tax: Tax): number {
  return tax.on ? interestMicroEur * (tax.rateMillionths / RATE_UNIT) : 0;
}

/** The net interest of one phase year (AC3, AC5): `interest − tax`, in one call, so the year table's two
 * figures and the fund row's shares cannot drift apart. */
export function parkNetMicroEur(
  monthlyMicroEur: number,
  deposit: DepositOption,
  months: number,
  tax: Tax,
): number {
  const interest = parkInterestMicroEur(monthlyMicroEur, deposit, months);
  return interest - parkTaxMicroEur(interest, tax);
}

/**
 * One phase year's term `k_y = (hundredths / 10000) · monthSum(months) · (1 − τ)`, the shape `phase.ts`
 * sums for `K`; 0 when the option is off or there is no month. It is a factor: it cannot see the sign of
 * `P`, so it carries no sign guard (risk 8), and `τ` is 0 outside the tax case.
 */
export function parkTerm(months: number, deposit: DepositOption, tax: Tax): number {
  if (!deposit.on) return 0;
  return (deposit.hundredths / 10000) * monthSum(months) * (1 - tax.rateMillionths / RATE_UNIT);
}
