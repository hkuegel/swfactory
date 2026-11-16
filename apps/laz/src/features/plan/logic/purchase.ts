/**
 * The purchase side of the model (story 032): `shares = phase-year amount / projected payout per share`
 * and `purchase now = shares × NAV`, the same projection and the same tax state as the payout column
 * (024 AC2, ADR 0012). "Jetzt" is the NAV of the committed data file, not a live price (ADR 0013), so the
 * asOf of the existing projection label names the date (024 AC5). Values stay unrounded here.
 *
 * The row of the fund table is the fund, and the fund finances the phase year `year + 1`; a fund whose
 * liquidation falls outside the phase has no phase year, so it shows no purchase.
 *
 * Story 047: the flat part of the row is no longer read here, because the fund table shows no tax figure
 * (AC1). The flat figures read in the year table, so `flatReasonFor`, `flatPartsSum` and the part that is
 * derived from the depot live in `cashflow.ts`; this module keeps the purchase parts, which are rounded
 * once, and `cashflow.ts` puts them in the reading order the money rule needs.
 *
 * Story 046 AC5: the year amount is the money that must be there at the START of the phase year, which is
 * `P · m` minus the net interest the parked money earns, so `shares` follows it. The same `deposit.ts`
 * expression the year table shows is used here, so the two tables cannot show two different numbers for the
 * same year. With `DEPOSIT_OFF` this is exactly the row story 032 and story 045 have.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import { DEPOSIT_OFF, parkNetMicroEur, type DepositOption } from './deposit.ts';
import { roundEuroCents } from './format.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { flatBaseFactor, type FlatRate } from './flat.ts';
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
  /** Unrounded micro-euro of that phase year: the money that must be there at the start of it, `P · m` minus
   * the net interest (story 046 AC5); 0 for a fund outside the phase. */
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
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  asOf: string = FUND_LIST_AS_OF,
): PurchaseRow[] {
  const startYear = monthParts(monthKeyOf(phase.startMonth)).year;
  return funds.map((fund) => {
    const phaseYear = fundPhaseYear(phase, fund.year);
    const row: PurchaseRow = {
      fundYear: fund.year,
      phaseYear,
      yearAmountMicroEur: 0,
      shares: null,
      purchaseMicroEur: null,
      reason:
        phaseYear === null
          ? fund.year + 1 > startYear
            ? 'after-phase-end'
            : 'before-phase-start'
          : null,
    };
    if (phaseYear === null) return row;

    const months = monthsInYear(phase, phaseYear);
    // AC5: the money that must be at the start of the phase year is the monthly target times the phase
    // months, minus the net interest the parked money earns. `parkNetMicroEur` takes the MONTHLY money, not
    // the year amount (risk 7), and it is 0 while the option is off or the rate is 0, so the year amount is
    // the one story 032 and story 045 have. The identity `P·m − (interest − tax) = shares × payout per share`
    // holds here by construction, so no correction term is added and the money rule stays.
    const yearAmountMicroEur =
      monthlyCents * months * 10000 - parkNetMicroEur(monthlyCents * 10000, deposit, months, tax);
    // A payout per share of 0 cannot be divided by: no number is invented (AC3). The model reaches it
    // through a typed YTM of −100 %, where the factor is 0.
    const payoutPerShare = payoutPerShareMicroEur(
      fund,
      tax,
      flatBaseFactor(fund, flat, asOf),
      asOf,
    );
    if (payoutPerShare === 0) {
      return { ...row, yearAmountMicroEur, reason: 'no-payout-per-share' };
    }
    const shares = yearAmountMicroEur / payoutPerShare;
    return {
      ...row,
      yearAmountMicroEur,
      shares,
      purchaseMicroEur: shares * fund.navMicroEur,
    };
  });
}

/**
 * Cents as shown (ADR 0012, story 032 AC2, read by story 047 as the purchase parts only): one rounding per
 * figure, `null` for a part without a figure. The derived part of the depot is no longer chosen here,
 * because the flat figures are read in the other table: `cashflow.ts` reads these parts row by row and
 * derives the last flat part in the reading order from the shown depot. When no row has a flat figure the
 * two paths give the same figures, which is what keeps story 032 AC2's hand values.
 */
export interface FundParts {
  readonly purchaseCents: number | null;
}

export function displayFundParts(rows: readonly PurchaseRow[]): readonly FundParts[] {
  return rows.map((row) => ({
    purchaseCents: row.purchaseMicroEur === null ? null : roundEuroCents(row.purchaseMicroEur),
  }));
}
