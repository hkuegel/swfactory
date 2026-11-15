/**
 * The purchase side of the model (story 032): `shares = phase-year amount / projected payout per share`
 * and `purchase now = shares × NAV`, the same projection and the same tax state as the payout column
 * (024 AC2, ADR 0012). "Jetzt" is the NAV of the committed data file, not a live price (ADR 0013), so the
 * asOf of the existing projection label names the date (024 AC5). Values stay unrounded here.
 *
 * The row of the fund table is the fund, and the fund finances the phase year `year + 1`; a fund whose
 * liquidation falls outside the phase has no phase year, so it shows no purchase.
 *
 * Story 045 adds the flat part of the same row: the Vorabpauschale of the years the fund is held, read
 * through `flat.ts` for the same funds `phase.ts` used for `cash`, so the figures in the table and the
 * depot are the same numbers.
 *
 * Story 046 AC5: the year amount is the money that must be there at the START of the phase year, which is
 * `P · m_y` minus the net interest the parked money earns, so `shares` follows it. The same `deposit.ts`
 * expression the year table shows is used here, so the two tables cannot show two different numbers for the
 * same year. With `DEPOSIT_OFF` this is exactly the row story 032 and story 045 have.
 */

import { monthKeyOf, monthParts } from './fields.ts';
import { DEPOSIT_OFF, parkNetMicroEur, type DepositOption } from './deposit.ts';
import { roundEuroCents } from './format.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { flatBaseFactor, flatTaxMicroEur, flatYears, type FlatRate } from './flat.ts';
import { monthsInYear, phaseYears, type Phase } from './phase.ts';
import { payoutPerShareMicroEur, type Tax } from './projection.ts';

/**
 * Why a row shows no number. Hak named `Auflösung nach Phasenende` (032 AC3); the other two are decisions
 * of this story, recorded in its Decision log, because AC3 gives no string for a fund that liquidates
 * before the phase begins or for a payout per share of 0, where no number may be invented.
 */
export type PurchaseReason = 'after-phase-end' | 'before-phase-start' | 'no-payout-per-share';

/** Story 045 AC4: the three reasons of the flat column; `fieldCopy.ts` turns them into the copy. */
export type FlatReason = 'outside-tax-case' | 'no-year-counts' | 'no-year-pays';

/** A row can show two dashes with two different reasons, so the flat column reads its own one. */
export type FlatRowReason = PurchaseReason | FlatReason;

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
  /** Story 045 AC4: the flat tax of the counted years of this fund, unrounded, or null for a dash. */
  readonly flatMicroEur: number | null;
  /** Set only when the flat column shows a dash. */
  readonly flatReason: FlatRowReason | null;
}

/** The fund row's phase year: a fund finances the phase year after its liquidation year. */
export function fundPhaseYear(phase: Phase, fundYear: number): number | null {
  const phaseYear = fundYear + 1;
  return phaseYears(phase).includes(phaseYear) ? phaseYear : null;
}

/**
 * The flat column's reason (AC4), in the order the copy reads it: the tax case first, because AC1 says the
 * rate counts only there and ux-designer lets that reason name every cell; then story 032's phase-side
 * reason, because a fund outside the phase is not bought and its money is not part of the depot; then the
 * two flat reasons. A row can name a flat reason while its purchase columns name another one, so this is
 * read on its own: a typed YTM of −100 % keeps `keine Hochrechnung je Anteil` in the purchase columns and
 * names `kein Jahr zahlt Steuer` here.
 */
export function flatReasonFor(
  row: Pick<PurchaseRow, 'phaseYear' | 'reason'>,
  fund: Fund,
  flat: FlatRate,
  tax: Tax,
  asOf: string,
): FlatRowReason | null {
  if (!tax.on) return 'outside-tax-case';
  if (row.phaseYear === null) return row.reason;
  if (flatYears(asOf, fund.year).length === 0) return 'no-year-counts';
  // A year whose increase is not positive pays nothing (AC2), and a rate of 0 pays nothing either, so no
  // number is invented for this column either.
  return flatTaxMicroEur(fund, flat, tax, asOf) === 0 ? 'no-year-pays' : null;
}

/**
 * The flat column's figure. No number is invented for a dash (the rule story 032 AC3 gives for the
 * purchase columns, which AC4 of 045 extends to this column), so the part stays null when the reason names
 * one. `cash` in `phase.ts` sums the same funds, so the parts still add up to the depot: a row that shows a
 * dash contributes nothing on either side.
 */
function withFlatFigure(
  row: PurchaseRow,
  fund: Fund,
  flat: FlatRate,
  tax: Tax,
  asOf: string,
): PurchaseRow {
  const flatReason = flatReasonFor(row, fund, flat, tax, asOf);
  return {
    ...row,
    flatReason,
    flatMicroEur: flatReason === null ? flatTaxMicroEur(fund, flat, tax, asOf) : null,
  };
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
      flatMicroEur: null,
      flatReason: null,
    };
    if (phaseYear === null) return withFlatFigure(row, fund, flat, tax, asOf);

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
      return withFlatFigure(
        { ...row, yearAmountMicroEur, reason: 'no-payout-per-share' },
        fund,
        flat,
        tax,
        asOf,
      );
    }
    const shares = yearAmountMicroEur / payoutPerShare;
    return withFlatFigure(
      {
        ...row,
        yearAmountMicroEur,
        shares,
        purchaseMicroEur: shares * fund.navMicroEur,
      },
      fund,
      flat,
      tax,
      asOf,
    );
  });
}

/**
 * Cents as shown (ADR 0012, story 032 AC2, extended by story 045): rounded once, with the last part that
 * has a figure derived from the shown depot instead of rounded on its own, so the shown parts add up to
 * the shown depot. The parts are read in the order the table shows them, row by row: the purchase part of
 * the row, then its flat part. `null` for a part without a figure. The parts are the parts of the depot,
 * because `Σ (shares × NAV) + Σ flat = monthly × F + cash` (AC5). When no row has a flat figure the result
 * is identical to story 032's, which is what keeps its hand values.
 */
export interface FundParts {
  readonly purchaseCents: number | null;
  readonly flatCents: number | null;
}

export function displayFundParts(
  rows: readonly PurchaseRow[],
  totalCents: number,
): readonly FundParts[] {
  const parts: FundParts[] = rows.map((row) => ({
    purchaseCents: row.purchaseMicroEur === null ? null : roundEuroCents(row.purchaseMicroEur),
    flatCents: row.flatMicroEur === null ? null : roundEuroCents(row.flatMicroEur),
  }));
  const shown: { part: FundParts; key: 'purchaseCents' | 'flatCents'; cents: number }[] = [];
  for (const part of parts) {
    if (part.purchaseCents !== null) {
      shown.push({ part, key: 'purchaseCents', cents: part.purchaseCents });
    }
    if (part.flatCents !== null) {
      shown.push({ part, key: 'flatCents', cents: part.flatCents });
    }
  }
  if (shown.length === 0) return parts;
  const total = Math.round(totalCents);
  const others = shown.slice(0, -1).reduce((sum, entry) => sum + entry.cents, 0);
  // The last part is read through the slice, not through an index, so no undefined value is used.
  for (const entry of shown.slice(-1)) {
    const derived = total - others;
    return parts.map((part) =>
      part === entry.part
        ? entry.key === 'purchaseCents'
          ? { ...part, purchaseCents: derived }
          : { ...part, flatCents: derived }
        : part,
    );
  }
  return parts;
}

/**
 * The sum the fund section states once (AC4): the sum of the shown flat parts, so a reader adding the
 * column gets the figure the section names. `null` when no row has a flat figure: nothing is invented for
 * an empty sum, the display rule ux-designer recorded on 2026-11-15.
 */
export function flatPartsSum(parts: readonly FundParts[]): number | null {
  const shown = parts.filter(
    (part): part is FundParts & { flatCents: number } => part.flatCents !== null,
  );
  if (shown.length === 0) return null;
  return shown.reduce((sum, part) => sum + part.flatCents, 0);
}
