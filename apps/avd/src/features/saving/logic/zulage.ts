/** Zulagen of one contribution year (story 013, Context: rules of the adopted law). */
export interface Zulage {
  readonly grundCents: number;
  readonly kinderCents: number;
  /** grund + kinder, every saving year. */
  readonly perYearCents: number;
  /** Berufseinsteigerbonus, once, part of year 1's Zulage (0 or 20000). */
  readonly bonusCents: number;
}

/** Below this own contribution per year there is no Zulage at all (and no tax benefit, story 014). */
export const MIN_CONTRIBUTION_CENTS = 12_000;
/** Grundzulage: 50 % up to here … */
const GRUND_FULL_RATE_LIMIT_CENTS = 36_000;
/** … and 25 % from there up to here (so at most 540 EUR). */
const GRUND_REDUCED_RATE_LIMIT_CENTS = 180_000;
/** Kinderzulage per child: 100 % of the contribution up to here. */
const KINDER_LIMIT_CENTS = 30_000;
const BONUS_CENTS = 20_000;
const BONUS_AGE_LIMIT = 25;

const NONE: Zulage = { grundCents: 0, kinderCents: 0, perYearCents: 0, bonusCents: 0 };

/**
 * Integer cents for every contribution the form allows: `annualCents` is 12 × the monthly
 * cents, so 0,5 · c and 0,25 · (c − 36.000) are whole cents.
 */
export function zulage(annualCents: number, children: number, ageAtStart: number): Zulage {
  if (annualCents < MIN_CONTRIBUTION_CENTS) return NONE;
  const grundCents =
    0.5 * Math.min(annualCents, GRUND_FULL_RATE_LIMIT_CENTS) +
    0.25 *
      Math.max(
        0,
        Math.min(annualCents, GRUND_REDUCED_RATE_LIMIT_CENTS) - GRUND_FULL_RATE_LIMIT_CENTS,
      );
  const kinderCents = children * Math.min(annualCents, KINDER_LIMIT_CENTS);
  return {
    grundCents,
    kinderCents,
    perYearCents: grundCents + kinderCents,
    bonusCents: ageAtStart < BONUS_AGE_LIMIT ? BONUS_CENTS : 0,
  };
}

/** Zulage credited for saving year `year` (1-based): perYearCents, plus bonusCents in year 1. */
export function zulageOfYear(z: Zulage, year: number): number {
  return z.perYearCents + (year === 1 ? z.bonusCents : 0);
}
