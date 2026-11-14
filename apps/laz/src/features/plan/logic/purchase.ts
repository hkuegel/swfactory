/**
 * The purchase side of the model (story 032): `shares = phase-year amount / projected payout per share`
 * and `purchase now = shares × NAV`, the same projection and the same tax state as the payout column
 * (024 AC2, ADR 0012). "Jetzt" is the NAV of the committed data file, not a live price (ADR 0013), so the
 * asOf of the existing projection label names the date (024 AC5). Values stay unrounded here.
 *
 * The row of the fund table is the fund, and the fund finances the phase year `year + 1`; a fund whose
 * liquidation falls outside the phase has no phase year, so it shows no purchase.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import type { Fund } from './fund.ts';
import { monthsInYear, phaseYears, type Phase } from './phase.ts';
import { payoutPerShareMicroEur, type Tax } from './projection.ts';

/**
 * Why a row shows no number. Hak named `Auflösung nach Phasenende` (032 AC3); the other two are decisions
 * of this story, recorded in its Decision log, because AC3 gives no string for a fund that liquidates
 * before the phase begins or for a payout per share of 0, where no number may be invented.
 */
export type PurchaseReason = 'after-phase-end' | 'before-phase-start' | 'no-payout-per-share';

export interface PurchaseRow {
  readonly fundYear: number;
  /** The phase year this fund finances (`fund year + 1`), or null when it falls outside the phase. */
  readonly phaseYear: number | null;
  /** Unrounded micro-euro of that phase year; 0 for a fund outside the phase. */
  readonly yearAmountMicroEur: number;
  /** Unrounded shares, or null when no number is shown (AC3). */
  readonly shares: number | null;
  /** Unrounded micro-euro at the data-file NAV, or null when no number is shown (AC3). */
  readonly purchaseMicroEur: number | null;
  /** Set only when there is no number. */
  readonly reason: PurchaseReason | null;
}

/** The fund row's phase year: a fund finances the phase year after its liquidation year. */
export function fundPhaseYear(phase: Phase, fundYear: number): number | null {
  const phaseYear = fundYear + 1;
  return phaseYears(phase).includes(phaseYear) ? phaseYear : null;
}

export function purchaseRows(
  funds: readonly Fund[],
  phase: Phase,
  monthlyCents: number,
  tax: Tax,
): PurchaseRow[] {
  const startYear = monthParts(monthKeyOf(phase.startMonth)).year;
  return funds.map((fund) => {
    const phaseYear = fundPhaseYear(phase, fund.year);
    if (phaseYear === null) {
      return {
        fundYear: fund.year,
        phaseYear: null,
        yearAmountMicroEur: 0,
        shares: null,
        purchaseMicroEur: null,
        reason: fund.year + 1 > startYear ? 'after-phase-end' : 'before-phase-start',
      };
    }
    const yearAmountMicroEur = monthlyCents * monthsInYear(phase, phaseYear) * 10000;
    // A payout per share of 0 cannot be divided by: no number is invented (AC3). The model reaches it
    // through a typed YTM of −100 %, where the factor is 0.
    const payoutPerShare = payoutPerShareMicroEur(fund, tax);
    if (payoutPerShare === 0) {
      return {
        fundYear: fund.year,
        phaseYear,
        yearAmountMicroEur,
        shares: null,
        purchaseMicroEur: null,
        reason: 'no-payout-per-share',
      };
    }
    const shares = yearAmountMicroEur / payoutPerShare;
    return {
      fundYear: fund.year,
      phaseYear,
      yearAmountMicroEur,
      shares,
      purchaseMicroEur: shares * fund.navMicroEur,
      reason: null,
    };
  });
}

/**
 * Cents as shown (ADR 0012, story 032 AC2): rounded once, with the last purchase part derived from the
 * total instead of rounded on its own, so the shown parts add up to the shown depot. `null` for a row
 * without a number. The parts are the parts of the depot, because `Σ shares × NAV = monthly × F`.
 */
export function displayPurchaseCents(
  rows: readonly PurchaseRow[],
  totalCents: number,
): readonly (number | null)[] {
  const parts = rows.filter(
    (row): row is PurchaseRow & { purchaseMicroEur: number } => row.purchaseMicroEur !== null,
  );
  if (parts.length === 0) return rows.map(() => null);
  const cents = new Map<number, number>();
  let others = 0;
  for (const row of parts.slice(0, -1)) {
    const value = Math.round(row.purchaseMicroEur / 10000);
    cents.set(row.fundYear, value);
    others += value;
  }
  // The last part is read through the slice, not through an index, so no undefined value is used.
  for (const row of parts.slice(-1)) {
    cents.set(row.fundYear, Math.round(totalCents) - others);
  }
  return rows.map((row) => cents.get(row.fundYear) ?? null);
}
