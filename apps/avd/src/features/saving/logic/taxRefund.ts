import type { Inputs } from './parseInputs.ts';
import type { Projection } from './project.ts';
import { MIN_CONTRIBUTION_CENTS } from './zulage.ts';

/** § 10a Abs. 1 EStG (new): own contributions are deductible up to this amount per year. */
export const DEDUCTIBLE_LIMIT_CENTS = 180_000;
const BP = 10_000;
const MONTHS = 12;

/**
 * Extra refund of one saving year from the Günstigerprüfung (story 014 Context):
 * 0 below c = 120 EUR; else max(0, round((min(c, 1.800 EUR) + Z) · t) − Z), rounded once.
 * Per year with explicit c and Z, because c(n) varies with a reinvested refund (story 015).
 */
export function refundCents(annualCents: number, zulageCents: number, taxRateBp: number): number {
  // Explicit floor: below it Z is 0, and the formula would otherwise give c · t.
  if (annualCents < MIN_CONTRIBUTION_CENTS) return 0;
  const base = Math.min(annualCents, DEDUCTIBLE_LIMIT_CENTS) + zulageCents;
  // base · t is an exact integer (below 2,8 · 10^9), so this is the only rounding (half up).
  return Math.max(0, Math.round((base * taxRateBp) / BP) - zulageCents);
}

export interface TaxRefund {
  /** Refund of a year without bonus (years 2 … N; year 1 too when there is no bonus). */
  readonly perYearCents: number;
  /** Refund of saving year 1 (differs from perYearCents only with the bonus). */
  readonly firstYearCents: number;
  /** One per saving year, aligned with Projection.years (index = year − 1). */
  readonly byYearCents: readonly number[];
  /** Σ byYearCents (sum of the rounded yearly amounts). */
  readonly totalCents: number;
  /** projection.total.contributionsCents − totalCents (>= 0). */
  readonly netContributionsCents: number;
}

/**
 * Reads c(n) and Z(n) of every saving year from projection.schedule (story 015, ADR 0008), so
 * Zulage, refund and depot have one source; for the projection of the same inputs each yearly
 * amount equals schedule[n].refundCents. The rate comes from `inputs`, so a caller can vary it.
 */
export function taxRefund(inputs: Inputs, projection: Projection): TaxRefund {
  const annualCents = MONTHS * inputs.monthlyCents;
  const byYearCents: number[] = [];
  let totalCents = 0;
  for (const year of projection.schedule) {
    const cents = refundCents(year.contributionCents, year.zulageCents, inputs.taxRateBp);
    byYearCents.push(cents);
    totalCents += cents;
  }
  const perYearCents = refundCents(annualCents, projection.zulage.perYearCents, inputs.taxRateBp);
  return {
    perYearCents,
    firstYearCents: byYearCents[0] ?? perYearCents,
    byYearCents,
    totalCents,
    netContributionsCents: projection.total.contributionsCents - totalCents,
  };
}
