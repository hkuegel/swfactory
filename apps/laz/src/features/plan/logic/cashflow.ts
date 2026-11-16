/**
 * The cashflows of one phase year (story 047): one figure per cashflow, the reason for a cashflow that
 * does not exist, the sum of each column, and the money rule read across the two tables. Values stay
 * unrounded until here, every figure is rounded once, and the last part with a figure in the reading
 * order is derived from its total instead of rounded on its own (the money rule of 032 AC2, 045 AC5 and
 * 046 AC4).
 *
 * The reading order the money rule needs is the order the two tables read: the fund table's purchase
 * parts row by row, then the year table's flat figures row by row (column A before column B), then the
 * year section's line for a fund whose sale year is not a phase year. Phase knowledge and the reason
 * strings live here, because `flat.ts` and `deposit.ts` keep neither (045, 046). The interest columns
 * keep the orders 046 gives them in `phase.ts` (AC4 names them unchanged), so this module reads them
 * through `YearRow` and takes no `DepositOption`.
 */

import {
  flatBaseFactor,
  flatTaxMicroEur,
  flatYears,
  flatYearMicroEur,
  type FlatRate,
} from './flat.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { roundEuroCents } from './format.ts';
import { displayYearCents, phaseYears, type ParkReason, type Phase, type Plan } from './phase.ts';
import type { FundParts, PurchaseReason, PurchaseRow } from './purchase.ts';
import { RATE_UNIT, rhoFactor } from './projection.ts';
import {
  KST_MILLIONTHS,
  SOLZ_ON_KST_MILLIONTHS,
  churchTaxMillionths,
  taxFromState,
  type TaxState,
} from './tax.ts';

/** One column of the year table, in the order the UX design names it (AC2). `parked` is the year
 * table's existing `Betrag für das Jahr` column: the money that was there at the start of the year. */
export type CashflowColumn =
  | 'proceeds'
  | 'kst'
  | 'solz'
  | 'kist'
  | 'flatBeforePhase'
  | 'flatForYear'
  | 'payout'
  | 'parked'
  | 'interest'
  | 'interestTax';

/** The columns with a sum line, in the order the table reads them, so the year section reads its sum
 * lines in this order (AC3). `Monate` and `Finanzierung durch Fonds` have none. */
export const SUM_COLUMNS: readonly CashflowColumn[] = [
  'proceeds',
  'kst',
  'solz',
  'kist',
  'flatBeforePhase',
  'flatForYear',
  'payout',
  'parked',
  'interest',
  'interestTax',
];

/** 045 AC4's three flat reasons, read by the year table now that the fund table shows no tax figure. */
export type FlatReason = 'outside-tax-case' | 'no-year-counts' | 'no-year-pays';

/** A row can show two dashes with two different reasons, so the flat column reads its own one. */
export type FlatRowReason = PurchaseReason | FlatReason;

/** The one reason union for the whole table (AC4): each column reads its own reason, because one row can
 * show a figure in one column and a dash with another reason in another. `park-year-not-a-phase-year` is
 * not part of it, because the copy names no string for it and no cell can read it. */
export type CashflowReason =
  FlatRowReason | ParkReason | 'kist-off' | 'no-positive-gain' | 'sale-year-not-a-phase-year';

/** The three strings of 032, read after each column's own reasons (AC4). */
const PHASE_SIDE: readonly PurchaseReason[] = [
  'before-phase-start',
  'after-phase-end',
  'no-payout-per-share',
];

/** The order the copy names for the two flat columns (AC4), typed as the flat column's own reasons so the
 * exported reader can return one of them. `Auflösung in einem Jahr, das kein Phase-Jahr ist` never reads in
 * a cell: it reads in `COPY.flatNoRowLine`. */
const FLAT_ORDER: readonly FlatRowReason[] = [
  'outside-tax-case',
  'no-year-counts',
  'no-year-pays',
  ...PHASE_SIDE,
];

/** The first-match-wins order of every column (AC4). The same tax answer reads in every tax column, and
 * the Solzzuschlag has no reason of its own because its base is the Kapitalsteuer. The parked column
 * never reads `Geld wird nicht geparkt (Option aus)` or `kein Zinssatz`, because its figure stays while
 * the option is off (046 AC5), and the interest columns keep the orders 046 gives them in `phase.ts`. */
export const COLUMN_REASON_ORDER: Readonly<Record<CashflowColumn, readonly CashflowReason[]>> = {
  proceeds: ['no-funding-fund', ...PHASE_SIDE],
  kst: ['outside-tax-case', 'no-positive-gain', ...PHASE_SIDE],
  solz: ['outside-tax-case', 'no-positive-gain', ...PHASE_SIDE],
  kist: ['outside-tax-case', 'kist-off', 'no-positive-gain', ...PHASE_SIDE],
  flatBeforePhase: FLAT_ORDER,
  flatForYear: FLAT_ORDER,
  payout: ['no-funding-fund'],
  parked: ['no-funding-fund', 'no-money-to-park'],
  interest: ['option-off', 'no-funding-fund', 'no-money-to-park', 'no-rate'],
  interestTax: ['outside-tax-case', 'option-off', 'no-funding-fund', 'no-money-to-park', 'no-rate'],
};

/** The cell a flat figure is read in: column A, column B, or the year section's line for a fund whose
 * sale year is not a phase year (answer 12). */
export type FlatCell = 'flatBeforePhase' | 'flatForYear' | 'flatNoRowLine';

/** One part of one fund's flat figure, as it is shown, in the order the money rule reads it (AC3's
 * identity: column A of a fund's row plus the column B figures of the earlier rows is that fund's figure). */
export interface FlatFigure {
  readonly fundYear: number;
  readonly cell: FlatCell;
  /** the phase year of the row it reads in; null for the year section's line */
  readonly year: number | null;
  /** the counted years this figure covers, so the pieces of one fund are the same expression as that
   * fund's whole figure (risk 8) and AC3's identity can be read */
  readonly years: readonly number[];
  /** the figure as it is shown; the last part in the reading order is derived from its total */
  cents: number;
}

/** One figure of one column of one phase-year row, as it is shown; null for a dash. */
export interface CashflowCell {
  readonly cents: number | null;
  /** the reason the cell names when it shows no figure; null when it shows one */
  readonly reason: CashflowReason | null;
}

export interface CashflowRow {
  readonly year: number;
  readonly months: number;
  /** the fund that funds this year (`fund year + 1`), as 032, 035 and 045 write it. */
  readonly fundingFund: Fund | null;
  /** the fund sold in this phase year, whose flat figure reads in column A (AC2, answer 4). */
  readonly saleFund: Fund | null;
  readonly cells: Readonly<Record<CashflowColumn, CashflowCell>>;
  /** the single rounding of the row's tax: the three parts plus the tax on the interest, stated once. */
  readonly taxTotalCents: number | null;
  /** the tax parts plus the parked money plus the gross interest, stated once (AC3). */
  readonly cashTotalCents: number | null;
}

/** The whole table the two sections read: the rows, the fund table's parts, the flat figures in the
 * reading order the money rule uses, the per-column sums and the two totals. */
export interface CashflowTable {
  readonly rows: readonly CashflowRow[];
  /** the fund table's purchase parts, rounded once (032 AC2 read without the flat part). */
  readonly fundParts: readonly FundParts[];
  /** the flat figures in the reading order the money rule uses, the year section's line last. */
  readonly flatFigures: readonly FlatFigure[];
  /** the sum of the figures shown in each column, null for a column without a figure. */
  readonly columnSums: Readonly<Record<CashflowColumn, number | null>>;
  /** the two totals the year section states once (AC3), null when nothing is shown for them. */
  readonly taxTotalCents: number | null;
  readonly cashTotalCents: number | null;
}

/** The flat figure of one fund, split into the cells it reads in. */
interface FlatFund {
  readonly fund: Fund;
  /** the fund's own part, unrounded; null when its cell shows a dash */
  readonly microEur: number | null;
  /** the counted years that read in column A, and the phase years that read in column B */
  readonly pieces: FlatFigure[];
}

/** What one column reads for one row: the fund it reads, its figure, and the reasons it can name. The
 * flat column reads the fund sold in this year (column A) or a fund still held in it (column B); the
 * money columns read the funding fund, which is the fund sold in the year before. */
interface CellContext {
  readonly taxState: TaxState;
  readonly asOf: string;
  readonly flat: FlatRate;
  /** the funding fund of this row, the fund whose money the year table reads here */
  readonly fundingFund: Fund | null;
  /** the fund this column reads for this row, null when no fund is read here */
  readonly fund: Fund | null;
  /** the phase-side reason 032 gives for that fund, null when its figure exists */
  readonly phaseReason: CashflowReason | null;
  /** the tax base of the row, micro-euro: `shares · NAV · max(0, ρ − 1 − flatBaseFactor)` */
  readonly baseMicroEur: number | null;
  /** the flat figure of the fund the flat column reads, micro-euro, null when it shows no figure */
  readonly flatMicroEur: number | null;
  /** the counted years of that fund, and how many of them read in this column's cell */
  readonly countedYears: number;
  readonly readsInCell: number;
  /** the monthly money, micro-euro: the base `no-money-to-park` reads (046 AC2) */
  readonly monthlyMicroEur: number;
}

function applies(reason: CashflowReason, ctx: CellContext): boolean {
  switch (reason) {
    case 'outside-tax-case':
      return !ctx.taxState.kstOn;
    case 'kist-off':
      return !ctx.taxState.kistOn;
    case 'no-positive-gain':
      return ctx.baseMicroEur === null || ctx.baseMicroEur <= 0;
    case 'no-year-counts':
      return ctx.countedYears === 0;
    case 'no-year-pays':
      return ctx.countedYears > 0 && (ctx.flatMicroEur ?? 0) === 0;
    case 'no-funding-fund':
      return ctx.fundingFund === null;
    case 'no-money-to-park':
      return ctx.monthlyMicroEur <= 0;
    default:
      // The three phase-side strings of 032 are read through `purchaseReasonText` unchanged.
      return ctx.phaseReason === reason;
  }
}

/** The first match wins, in the order the copy names for this column (AC4). */
function firstMatchIn<T extends CashflowReason>(order: readonly T[], ctx: CellContext): T | null {
  for (const reason of order) {
    if (applies(reason, ctx)) return reason;
  }
  return null;
}

function firstMatch(column: CashflowColumn, ctx: CellContext): CashflowReason | null {
  return firstMatchIn(COLUMN_REASON_ORDER[column], ctx);
}

/**
 * The flat column's reason (045 AC4), in the order the copy reads it: the tax case first, because 045 AC1
 * says the rate counts only there; then the two flat reasons; then story 032's phase-side reason, because
 * a fund outside the phase is not bought and its money is not part of the depot. Read on its own, so a row
 * can name a flat reason while its purchase columns name another one. `fieldCopy.ts` turns it into the copy.
 *
 * A cell that shows no figure must name its reason, so `readsInCell` is the number of that fund's counted
 * years that read in this cell: a fund whose figure all reads in the other flat column names `kein Jahr
 * zählt (nur das Auflösungsjahr)` here, which is the one reading `flatPartsSum` can still check.
 */
export function flatReasonFor(
  row: Pick<PurchaseRow, 'phaseYear' | 'reason'>,
  fund: Fund,
  flat: FlatRate,
  taxState: TaxState,
  asOf: string,
  readsInCell: number = flatYears(asOf, fund.year).length,
): FlatRowReason | null {
  return firstMatchIn(FLAT_ORDER, {
    taxState,
    asOf,
    flat,
    fundingFund: fund,
    fund,
    phaseReason: row.reason,
    baseMicroEur: null,
    flatMicroEur:
      readsInCell === 0 ? null : flatTaxMicroEur(fund, flat, taxFromState(taxState), asOf),
    countedYears: flatYears(asOf, fund.year).length,
    readsInCell,
    monthlyMicroEur: 0,
  });
}

/** The sum of the figures shown in one column, null for a column without a figure: nothing is invented
 * for an empty sum (the display rule 045 records). Carried over from 046 AC4's `parkSumsCents`. */
export function columnSumsCents(
  rows: readonly CashflowRow[],
): Record<CashflowColumn, number | null> {
  const sums: Record<CashflowColumn, number | null> = {
    proceeds: null,
    kst: null,
    solz: null,
    kist: null,
    flatBeforePhase: null,
    flatForYear: null,
    payout: null,
    parked: null,
    interest: null,
    interestTax: null,
  };
  for (const column of SUM_COLUMNS) {
    const figures = rows
      .map((row) => row.cells[column]?.cents ?? null)
      .filter((cents) => cents !== null);
    if (figures.length > 0) sums[column] = figures.reduce((sum, cents) => sum + cents, 0);
  }
  return sums;
}

/** The flat parts as the money rule reads them across both tables: the sum of the shown figures, null
 * when no fund has a flat figure (045 AC5, moved out of `purchase.ts` with the flat figures). */
export function flatPartsSum(figures: readonly FlatFigure[]): number | null {
  if (figures.length === 0) return null;
  return figures.reduce((sum, figure) => sum + figure.cents, 0);
}

/** The sum of the pieces one flat cell shows, null when the cell shows a dash. */
function cellSum(figures: readonly FlatFigure[], cell: FlatCell, year: number): number | null {
  const pieces = figures.filter((figure) => figure.cell === cell && figure.year === year);
  return pieces.length === 0 ? null : pieces.reduce((sum, piece) => sum + piece.cents, 0);
}

/** A total the year section states once: the sum of the figures shown for it, null when none is shown. */
function sumOf(
  rows: readonly CashflowRow[],
  key: 'taxTotalCents' | 'cashTotalCents',
): number | null {
  const figures = rows.map((row) => row[key]).filter((cents) => cents !== null);
  return figures.length === 0 ? null : figures.reduce((sum, cents) => sum + cents, 0);
}

/**
 * The tax split of one row (AC5): 25 % Kapitalsteuer on the base, 5,5 % Solzzuschlag of that Kapitalsteuer,
 * and the church tax as a whole hundredths rate on the Kapitalsteuer, counted only while the Kapitalsteuer
 * is on. The row's tax total is one rounding on the same base plus the one figure of the interest tax
 * (answer 11), and the last part with a figure in the reading order is derived from it, so the parts the
 * table shows add up to the total the section states. The Solzzuschlag is never derived from a base of its
 * own, because its base is the Kapitalsteuer.
 */
function taxSplit(
  baseMicroEur: number | null,
  interestTaxMicroEur: number | null,
  taxState: TaxState,
): { parts: Record<'kst' | 'solz' | 'kist', number | null>; total: number | null } {
  const parts: Record<'kst' | 'solz' | 'kist', number | null> = {
    kst: baseMicroEur === null ? null : roundEuroCents(baseMicroEur * (KST_MILLIONTHS / RATE_UNIT)),
    solz:
      baseMicroEur === null
        ? null
        : roundEuroCents(baseMicroEur * (SOLZ_ON_KST_MILLIONTHS / RATE_UNIT)),
    kist:
      baseMicroEur === null || !taxState.kistOn
        ? null
        : roundEuroCents(baseMicroEur * (churchTaxMillionths(taxState) / RATE_UNIT)),
  };
  const interestTaxCents =
    interestTaxMicroEur === null ? null : roundEuroCents(interestTaxMicroEur);
  if (baseMicroEur === null && interestTaxCents === null) return { parts, total: null };
  const total = Math.round(((baseMicroEur ?? 0) + (interestTaxMicroEur ?? 0)) / 10000);
  const order: ('kst' | 'solz' | 'kist')[] = ['kst', 'solz', 'kist'];
  const derived = order.filter((part) => parts[part] !== null).pop();
  if (derived !== undefined) {
    const others = order
      .filter((part) => part !== derived)
      .reduce((sum, part) => sum + (parts[part] ?? 0), 0);
    parts[derived] = total - others - (interestTaxCents ?? 0);
  }
  return { parts, total };
}

/** One part of the depot, so the reading order can name its last part with a figure. */
interface DepotPart {
  cents: number | null;
}

/**
 * The rows of the year table (AC2, AC3), in the order the table reads them. `funds` and `purchases` are in
 * the order of the fund table, and `funds` is a parameter because `PurchaseRow` no longer carries the flat
 * part: the flat figures are read in this table, so the fund's NAV and its YTM are needed here (the
 * design's signature, read as this deviation; recorded in the Implementation notes).
 *
 * The money rule has one derived part per identity: the last flat part in the reading order is derived
 * from the shown depot, the last part with a figure of a row's tax is derived from that row's tax total,
 * and within a fund whose figure is split across cells the last piece is derived from that fund's own
 * part. A fund with one piece is exactly 032 AC2's rule, which is what keeps its hand values.
 */
export function cashflowRows(
  plan: Plan,
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  purchases: readonly PurchaseRow[],
  funds: readonly Fund[],
  asOf: string = FUND_LIST_AS_OF,
): CashflowTable {
  const tax = taxFromState(taxState);
  const years = phaseYears(phase);
  const indexOf = (fund: Fund): number => funds.findIndex((entry) => entry.year === fund.year);

  // 1. one flat figure per fund that is part of the depot, in the order the fund table lists the funds.
  // Only the funds that fund a phase year are depot parts (045 AC5): a fund outside the phase is never
  // bought, so it shows no flat figure anywhere and names its phase-side reason in the fund table. A fund
  // whose cell shows a dash has no part here, because `flatPartsSum` sums the figures that are shown.
  const flatFunds: FlatFund[] = funds.map((fund, position) => {
    const row = purchases[position];
    if (row === undefined || row.phaseYear === null) {
      return { fund, microEur: null, pieces: [] };
    }
    const microEur = flatTaxMicroEur(fund, flat, tax, asOf);
    if (microEur === 0) return { fund, microEur: null, pieces: [] };
    const counted = flatYears(asOf, fund.year);
    const pieces: FlatFigure[] = counted
      .filter((year) => years.includes(year))
      .map((year) => ({
        fundYear: fund.year,
        cell: 'flatForYear',
        year,
        years: [year],
        cents: 0,
      }));
    if (counted.some((year) => !years.includes(year))) {
      // The counted years that have no row of their own read on the row of the fund's sale year; a fund
      // whose sale year is not a phase year has no row, so its figure is stated once in the year section,
      // with its reason, and that line is the last part of the reading order (answer 12).
      const beforePhase = counted.filter((year) => !years.includes(year));
      const cell: FlatCell = years.includes(fund.year) ? 'flatBeforePhase' : 'flatNoRowLine';
      pieces.push({
        fundYear: fund.year,
        cell,
        year: cell === 'flatNoRowLine' ? null : fund.year,
        years: beforePhase,
        cents: 0,
      });
    }
    return { fund, microEur, pieces };
  });

  // 2. the reading order the money rule uses: the fund table's purchase parts row by row, then the year
  // table's flat figures row by row (column A before column B), then the year section's line.
  const purchaseParts: DepotPart[] = purchases.map((row) => ({
    cents: row.purchaseMicroEur === null ? null : roundEuroCents(row.purchaseMicroEur),
  }));
  const flatOrder: FlatFigure[] = [];
  for (const year of years) {
    for (const fund of flatFunds) {
      for (const piece of fund.pieces) {
        if (piece.cell === 'flatBeforePhase' && piece.year === year) flatOrder.push(piece);
      }
      for (const piece of fund.pieces) {
        if (piece.cell === 'flatForYear' && piece.year === year) flatOrder.push(piece);
      }
    }
  }
  for (const fund of flatFunds) {
    for (const piece of fund.pieces) {
      if (piece.cell === 'flatNoRowLine') flatOrder.push(piece);
    }
  }

  // 3. one rounding per figure, then the two derivations: the last piece of a fund from that fund's own
  // part, then the last part with a figure in the whole reading order from the shown depot, so the parts
  // of the two tables add up to the shown depot. When no fund has a flat figure, that last part is the
  // last purchase part, which is exactly 032 AC2's rule.
  for (const fund of flatFunds) {
    for (const piece of fund.pieces) {
      const microEur = piece.years.reduce(
        (sum, year) => sum + flatYearMicroEur(fund.fund, year, flat, tax, asOf),
        0,
      );
      piece.cents = roundEuroCents(microEur);
    }
    const pieces = flatOrder.filter((piece) => piece.fundYear === fund.fund.year);
    const derived = pieces[pieces.length - 1];
    if (fund.microEur === null || derived === undefined || pieces.length < 2) continue;
    const others = pieces.slice(0, -1).reduce((sum, piece) => sum + piece.cents, 0);
    derived.cents = roundEuroCents(fund.microEur) - others;
  }
  const parts: DepotPart[] = [...purchaseParts, ...flatOrder];
  const lastPart = parts.filter((part) => part.cents !== null).pop();
  if (lastPart !== undefined) {
    lastPart.cents =
      Math.round(plan.depotCents) -
      parts.reduce((sum, part) => sum + (part === lastPart ? 0 : (part.cents ?? 0)), 0);
  }

  // 4. the rows: one figure per cashflow, the reason for the ones that do not exist.
  const parked = displayYearCents(plan);
  const rows: CashflowRow[] = plan.years.map((row, position) => {
    const fund = row.fundingFund;
    const purchase = fund === null ? undefined : purchases[indexOf(fund)];
    const shares = purchase?.shares ?? null;
    const baseFactor =
      fund === null ? 0 : Math.max(0, rhoFactor(fund, asOf) - 1 - flatBaseFactor(fund, flat, asOf));
    const baseMicroEur =
      fund === null || shares === null || baseFactor === 0
        ? null
        : shares * fund.navMicroEur * baseFactor;
    const interestCents =
      row.parkReason === null ? roundEuroCents(row.parkInterestMicroEur ?? 0) : null;
    const { parts: taxParts, total: taxTotal } = taxSplit(
      baseMicroEur,
      row.parkTaxMicroEur,
      taxState,
    );
    const interestTaxCents =
      row.parkTaxReason === null ? roundEuroCents(row.parkTaxMicroEur ?? 0) : null;

    /** The fund this column reads for this row: the funding fund for the money columns, the fund sold in
     * this year for column A, and the first fund still held in this year for column B (045 AC2, AC3). A
     * fund never contributes to column B of the row it is read in, so column B reads the funds with a
     * counted year equal to this row's year. */
    const flatFundFor = (column: 'flatBeforePhase' | 'flatForYear'): FlatFund | null => {
      const read = flatFunds.filter((entry) =>
        column === 'flatBeforePhase'
          ? entry.fund.year === row.year
          : entry.pieces.some((piece) => piece.cell === 'flatForYear' && piece.year === row.year),
      );
      return read[0] ?? null;
    };

    function cellFor(column: CashflowColumn, cents: number | null): CashflowCell {
      if (cents !== null) return { cents, reason: null };
      // `Betrag für das Jahr` keeps its plain dash for a phase year without a fund, because its reason is
      // the funding cell's line as 024 AC4 has it (the decision of 2026-11-16), so the reads of 024 AC2,
      // 033 AC1, 035 AC1 and 046 AC5 stay where they are.
      if (column === 'parked' && fund === null) return { cents: null, reason: null };
      const entry =
        column === 'flatBeforePhase' || column === 'flatForYear' ? flatFundFor(column) : null;
      // Deviation, recorded in the Implementation notes: a flat cell that reads no fund at all names the
      // same thing the funding cell names, because none of the copy's flat reasons can apply without a fund.
      if (entry === null && (column === 'flatBeforePhase' || column === 'flatForYear')) {
        return { cents: null, reason: 'no-funding-fund' };
      }
      const countedYears = entry === null ? 0 : flatYears(asOf, entry.fund.year).length;
      const ctx: CellContext = {
        taxState,
        asOf,
        flat,
        fundingFund: fund,
        fund: entry?.fund ?? fund,
        phaseReason:
          entry === null
            ? (purchase?.reason ?? null)
            : (purchases[indexOf(entry.fund)]?.reason ?? null),
        baseMicroEur,
        flatMicroEur: entry?.microEur ?? null,
        countedYears,
        readsInCell:
          entry === null
            ? 0
            : entry.pieces.filter((piece) => piece.cell === column && piece.year === row.year)
                .length,
        monthlyMicroEur: plan.monthlyCents * 10000,
      };
      return { cents: null, reason: firstMatch(column, ctx) };
    }

    const parkedCents = fund === null ? null : (parked[position] ?? null);
    const cells: Record<CashflowColumn, CashflowCell> = {
      proceeds: cellFor(
        'proceeds',
        fund === null ? null : (purchaseParts[indexOf(fund)]?.cents ?? null),
      ),
      kst: cellFor('kst', taxParts.kst),
      solz: cellFor('solz', taxParts.solz),
      kist: cellFor('kist', taxParts.kist),
      flatBeforePhase: cellFor('flatBeforePhase', cellSum(flatOrder, 'flatBeforePhase', row.year)),
      flatForYear: cellFor('flatForYear', cellSum(flatOrder, 'flatForYear', row.year)),
      // AC2: `P · m` for this year, and this cell does not read the base factor (P32).
      payout: cellFor('payout', fund === null ? null : Math.round(row.months * plan.monthlyCents)),
      // 046 AC5: the money that must be there at the START of the year, the figure `displayYearCents`
      // shows, so the two tables cannot show two numbers for one year.
      parked: cellFor('parked', parkedCents),
      // 046 AC4: the two orders 046 gives these columns stay, so the row's own reasons are read here.
      interest: { cents: interestCents, reason: row.parkReason },
      interestTax: { cents: interestTaxCents, reason: row.parkTaxReason },
    };

    const cashParts = [taxParts.kst, taxParts.solz, taxParts.kist, parkedCents, interestCents];
    return {
      year: row.year,
      months: row.months,
      fundingFund: fund,
      saleFund: funds.find((entry) => entry.year === row.year) ?? null,
      cells,
      taxTotalCents: taxTotal,
      cashTotalCents: cashParts.some((part) => part !== null)
        ? cashParts.reduce<number>((sum, part) => sum + (part ?? 0), 0)
        : null,
    };
  });

  return {
    rows,
    fundParts: purchaseParts.map((part) => ({ purchaseCents: part.cents })),
    flatFigures: flatOrder,
    columnSums: columnSumsCents(rows),
    taxTotalCents: sumOf(rows, 'taxTotalCents'),
    cashTotalCents: sumOf(rows, 'cashTotalCents'),
  };
}
