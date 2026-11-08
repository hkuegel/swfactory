// Annuity math of the payout phase, shared by both depots (story 016, ADR 0009). Payouts at the end
// of each month from the month after payout start; the remaining balance keeps earning the net
// annual rate q of the saving phase. `log1p`/`expm1` keep the formulas exact for tiny |q|.

/** Both depots are paid out completely by this age (AltZertG payout plan, story 016 Context). */
export const PAYOUT_END_AGE = 85;
const MONTHS = 12;

/** 12 · (85 − payoutAge): 240 at 65, 180 at 70. */
export function payoutMonths(payoutAge: number): number {
  return MONTHS * (PAYOUT_END_AGE - payoutAge);
}

/** ln(g) with g = (1 + q)^(1/12), the monthly growth factor. */
export function monthlyLog(netRate: number): number {
  return Math.log1p(netRate) / MONTHS;
}

/**
 * Σ of `months` equal end-of-month payouts that empty a depot of 1 at net annual rate `netRate`:
 * n · (g − 1) / (1 − g^−n). Exactly 1 when the rate is 0 (the formula would give 0/0 there).
 */
export function payoutMultiple(netRate: number, months: number): number {
  if (netRate === 0) return 1;
  const lambda = monthlyLog(netRate);
  return (months * Math.expm1(lambda)) / -Math.expm1(-months * lambda);
}

/**
 * Share of the current depot (after this month's growth) paid out with this payout when
 * `remaining` payouts are left, the current one included: (g − 1) / (g − g^(1−r)); 1 for the last.
 */
export function soldFraction(netRate: number, remaining: number): number {
  if (remaining <= 1) return 1;
  if (netRate === 0) return 1 / remaining;
  const lambda = monthlyLog(netRate);
  const growth = Math.expm1(lambda);
  return growth / (growth - Math.expm1((1 - remaining) * lambda));
}
