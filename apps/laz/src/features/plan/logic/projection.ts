/**
 * The projection convention (ADR 0012): annual effective compounding, ACT/365 from `asOf` to
 * 31.12 of the maturity year. Tax is on the gain only, at liquidation, base `max(0, gain)`:
 * `payout = pre-tax − r × max(0, gain)`. Values stay unrounded here; rounding happens once, at
 * display.
 */

import { FUND_LIST_AS_OF, liquidationDate, type Fund } from './fund.ts';

/** Tax as the form gives it: `on` is the checkbox, `rateBp` is 0 while it is unchecked. */
export interface Tax {
  readonly on: boolean;
  /** 0..5000, 1 % = 100 basis points. */
  readonly rateBp: number;
}

/** Actual calendar days from `asOf` to the liquidation date; `Date.UTC` parts only (risk 2). */
export function dayCount(asOf: string, liquidation: string): number {
  const day = (iso: string): number => {
    // The parts come from the parser or the data file; the defaults keep the arithmetic total.
    const [year = 0, month = 1, date = 1] = iso.split('-').map(Number);
    return Date.UTC(year, month - 1, date);
  };
  return Math.round((day(liquidation) - day(asOf)) / 86400000);
}

/**
 * ρ′ = ρ − r·max(0, ρ − 1), the payout factor per euro invested, where ρ = (1 + ytm)^(d/365). This
 * is `pre-tax − r × max(0, gain)` (review round 1, finding 7): equivalent to `NAV + (1 − r)·gain`
 * for a positive gain, but a negative gain stays untaxed instead of being lifted back to the NAV,
 * so tax ON at r = 0 % still returns exactly the pre-tax projection (AC4). Tax off gives ρ.
 * `asOf` is the file-level asOf of the data file (ADR 0013), the default the app uses.
 */
export function payoutFactor(fund: Fund, tax: Tax, asOf: string = FUND_LIST_AS_OF): number {
  const rho = Math.pow(1 + fund.ytmBp / 10000, dayCount(asOf, liquidationDate(fund)) / 365);
  if (!tax.on) return rho;
  return rho - (tax.rateBp / 10000) * Math.max(0, rho - 1);
}

/** Payout per share in micro-euro, unrounded: `navMicroEur · ρ′` (AC1, AC4 of 024). */
export function payoutPerShareMicroEur(
  fund: Fund,
  tax: Tax,
  asOf: string = FUND_LIST_AS_OF,
): number {
  return fund.navMicroEur * payoutFactor(fund, tax, asOf);
}
