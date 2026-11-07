import type { Inputs } from './parseInputs.ts';
import { refundCents } from './taxRefund.ts';
import { zulage, zulageOfYear } from './zulage.ts';

/** The flows of one saving year (story 015 Context), integer cents. */
export interface ScheduleYear {
  /** 1-based saving year. */
  readonly year: number;
  /** 12 · monthly contribution. */
  readonly ownCents: number;
  /** Refund of the previous year paid in on 1 January; 0 in year 1 and while unchecked. */
  readonly reinvestedCents: number;
  /** c(n) = own + reinvested, <= CONTRIBUTION_CAP_CENTS. */
  readonly contributionCents: number;
  /** Z(n) from c(n), incl. the bonus in year 1; credited in January of the next year (last: at payout). */
  readonly zulageCents: number;
  /** R(n) = refundCents(c(n), Z(n), t). */
  readonly refundCents: number;
}

/** Highest contribution per year (6.840 EUR); a reinvested refund counts against it (015, 2a). */
export const CONTRIBUTION_CAP_CENTS = 684_000;
const MONTHS = 12;

/**
 * The yearly schedule of the saving phase, computed before the balance loop (ADR 0008). With
 * `reinvestRefund`, R(n − 1) is paid in on 1 January of year n as far as the cap allows and
 * counts as own contribution of year n; R(N) is never reinvested. Unchecked, c = 12 · monthly in
 * every year, so Zulage and refund equal those of story 013/014.
 */
export function savingSchedule(inputs: Inputs, reinvestRefund: boolean): readonly ScheduleYear[] {
  const { age, payoutAge, monthlyCents, children, taxRateBp } = inputs;
  const ownCents = MONTHS * monthlyCents;
  // parseInputs caps the monthly contribution at 570 EUR, so this is >= 0; max() keeps it so.
  const room = Math.max(0, CONTRIBUTION_CAP_CENTS - ownCents);
  const years: ScheduleYear[] = [];
  let previousRefund = 0;
  for (let year = 1; year <= payoutAge - age; year++) {
    const reinvestedCents = reinvestRefund && year >= 2 ? Math.min(previousRefund, room) : 0;
    const contributionCents = ownCents + reinvestedCents;
    const zulageCents = zulageOfYear(zulage(contributionCents, children, age), year);
    const refund = refundCents(contributionCents, zulageCents, taxRateBp);
    years.push({
      year,
      ownCents,
      reinvestedCents,
      contributionCents,
      zulageCents,
      refundCents: refund,
    });
    previousRefund = refund;
  }
  return years;
}

export interface CentsRange {
  readonly min: number;
  readonly max: number;
}

/**
 * Smallest and largest of a yearly value (index = year − 1) over the years that the "per year"
 * figures describe (story 015, UX §2): years 2 … N, plus year 1 when it has no bonus (year 1
 * with the bonus has its own row). null when there is no such year (one saving year with bonus).
 */
export function perYearRange(
  valuesByYear: readonly number[],
  hasBonus: boolean,
): CentsRange | null {
  const values = hasBonus ? valuesByYear.slice(1) : valuesByYear;
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}
