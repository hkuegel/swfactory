import { etfDepot } from './etfDepot.ts';
import type { Inputs } from './parseInputs.ts';
import { payoutMonths, payoutMultiple } from './payout.ts';
import { netAnnualRate, type Projection } from './project.ts';
import type { ScheduleYear } from './schedule.ts';
import { DEDUCTIBLE_LIMIT_CENTS, type TaxRefund } from './taxRefund.ts';
import { MIN_CONTRIBUTION_CENTS } from './zulage.ts';

/** The result of one depot after the payout phase (story 016), integer cents. */
export interface DepotOutcome {
  readonly depotCents: number;
  readonly grossPayoutsCents: number;
  readonly taxCents: number;
  /** gross − tax. */
  readonly netPayoutsCents: number;
  readonly ownContributionsCents: number;
  /** Refunds that stay with the saver; ETF: 0. */
  readonly keptRefundsCents: number;
  /** net − own + kept, may be negative. */
  readonly yieldCents: number;
  /** round(net / months), an average (equal every month for the AVD). */
  readonly monthlyNetCents: number;
}

export interface Comparison {
  readonly payoutMonths: number;
  /** unsubsidisedCents = B_U, the contributions taxed only on their gain (Variante A). */
  readonly avd: DepotOutcome & { readonly unsubsidisedCents: number };
  readonly etf: DepotOutcome & { readonly savingPhaseTaxCents: number };
  /** avd.yieldCents − etf.yieldCents. */
  readonly differenceCents: number;
}

export interface CompareOptions {
  /** The Pauschbetrag checkbox; never read for the AVD. */
  readonly useAllowance: boolean;
}

const BP = 10_000;

/**
 * B_U, the unsubsidised contributions (ADR 0009): Σ per saving year of c(n) when c(n) < 120 EUR
 * (no Zulage, no deduction), else c(n) − min(c(n), 1.800 EUR). c(n) includes a reinvested refund.
 */
export function unsubsidisedCents(schedule: readonly ScheduleYear[]): number {
  let total = 0;
  for (const { contributionCents: c } of schedule) {
    total += c < MIN_CONTRIBUTION_CENTS ? c : c - Math.min(c, DEDUCTIBLE_LIMIT_CENTS);
  }
  return total;
}

/**
 * Both depots paid out in equal gross monthly payouts until 85 and their yield after tax (story
 * 016, ADR 0009). AVD: tax = round(t · max(0, D · M − B_U)) at the retirement rate t (Variante A,
 * B_U netted over the whole plan; assumption, not clarified by the BMF); refunds that are not
 * reinvested count nominally. ETF: `etfDepot()`. Reads the existing projection and refund, so
 * depot, Zulagen and refunds have one source.
 */
export function compareDepots(
  inputs: Inputs,
  projection: Projection,
  refund: TaxRefund,
  options: CompareOptions,
): Comparison {
  const months = payoutMonths(inputs.payoutAge);
  const multiple = payoutMultiple(netAnnualRate(inputs), months);
  const own = projection.total.contributionsCents;

  const depotCents = projection.total.balanceCents;
  const unsubsidised = unsubsidisedCents(projection.schedule);
  const gross = depotCents * multiple;
  const grossPayoutsCents = Math.round(gross);
  const taxCents = Math.round((Math.max(0, gross - unsubsidised) * inputs.retirementRateBp) / BP);
  const netPayoutsCents = grossPayoutsCents - taxCents;
  const keptRefundsCents = refund.totalCents - projection.total.reinvestedCents;
  const avdYield = netPayoutsCents - own + keptRefundsCents;

  const etf = etfDepot(inputs, options.useAllowance);
  const etfNet = etf.grossPayoutsCents - etf.taxCents;
  const etfYield = etfNet - own;

  return {
    payoutMonths: months,
    avd: {
      depotCents,
      grossPayoutsCents,
      taxCents,
      netPayoutsCents,
      ownContributionsCents: own,
      keptRefundsCents,
      yieldCents: avdYield,
      monthlyNetCents: Math.round(netPayoutsCents / months),
      unsubsidisedCents: unsubsidised,
    },
    etf: {
      depotCents: etf.depotCents,
      grossPayoutsCents: etf.grossPayoutsCents,
      taxCents: etf.taxCents,
      savingPhaseTaxCents: etf.savingPhaseTaxCents,
      netPayoutsCents: etfNet,
      ownContributionsCents: own,
      keptRefundsCents: 0,
      yieldCents: etfYield,
      monthlyNetCents: Math.round(etfNet / months),
    },
    differenceCents: avdYield - etfYield,
  };
}
