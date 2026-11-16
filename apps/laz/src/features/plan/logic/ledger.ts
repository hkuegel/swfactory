/**
 * The ledger (story 048): the plan as an account statement, built from real share counts. For each phase
 * year the fund of the year before is bought with `shares = (that year's payouts - net interest) / net
 * proceeds per share` (`purchase.ts`, the proceeds after the tax on the gain minus the Vorabpauschale
 * bases). The Vorabpauschale tax of a fund and year is `shares x flat base per share x rate`, paid in the
 * row of the next year; the liquidation and its tax fall in the maturity year; the purchase is in the first
 * row, the year of the data file's date. The depot is the sum of the purchases plus the cash reserve that
 * pays the Vorabpauschale, so the last row ends at 0. Everything is linear in the monthly payout `P`, so
 * `depot(P) = P * depot(1 EUR)`, and the depot direction divides by that unit depot.
 *
 * Values stay unrounded until `buildStatement`: each shown cell is rounded once, the balances follow from
 * the rounded flows, and the rounding residue is derived into the last payout (CLAUDE.md money rule).
 */

import {
  DEPOSIT_OFF,
  parkInterestMicroEur,
  parkTaxMicroEur,
  type DepositOption,
} from './deposit.ts';
import {
  flatTaxMicroEur,
  flatBaseFactor,
  flatYears,
  flatYearMicroEur,
  type FlatRate,
} from './flat.ts';
import { FUND_LIST_AS_OF, type Fund } from './fund.ts';
import { fundingFund, monthsInYear, phaseYears, type Phase } from './phase.ts';
import { preTaxPerShareMicroEur, rhoFactor } from './projection.ts';
import { purchaseRows, type PurchaseRow } from './purchase.ts';
import { taxFromState, taxParts, type TaxState } from './tax.ts';

/** The result of the depot or the payout and the number of funded phase years. */
export interface Plan {
  /** Unrounded float in cents; rounded once when shown. */
  readonly monthlyCents: number;
  readonly depotCents: number;
  /** Phase years with a funding fund that can be bought. */
  readonly fundedYears: number;
}

/** A monthly target of 1 EUR: the unit the depot direction divides by (the model is linear in `P`). */
const UNIT_MONTHLY_CENTS = 100;

/** The cash reserve of the plan and the interest it earns per calendar year (story 049), unrounded. */
interface Reserve {
  readonly startMicro: number;
  /** Gross interest and the tax on it per year from the first row; empty without parking or reserve. */
  readonly interestMicro: readonly number[];
  readonly interestTaxMicro: readonly number[];
}

/**
 * The reserve: the Vorabpauschale of the whole holding (story 048). With parking on it earns interest
 * (story 049 AC1): per year `rate x balance / 12` for each month from the month after the purchase month,
 * January already lowered by the payment of that January; credited at year end, taxed by `taxParts`, the
 * net stays. The recursion is linear in the starting reserve `R`, `end(R) = a + b R`, so the smallest
 * reserve that ends at 0 (and so pays every payment) is `-a / b` from two forward runs (AC2).
 */
function reserveOf(
  funds: readonly Fund[],
  rows: readonly PurchaseRow[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption,
  asOf: string,
): Reserve {
  const tax = taxFromState(taxState);
  let plain = 0;
  funds.forEach((fund, index) => {
    const row = rows[index];
    if (row?.shares == null) return;
    plain += row.shares * flatTaxMicroEur(fund, flat, tax, asOf);
  });
  const none: Reserve = { startMicro: plain, interestMicro: [], interestTaxMicro: [] };
  const firstYear = Number(asOf.slice(0, 4));
  const years = phaseYears(phase);
  const lastYear = years[years.length - 1] ?? firstYear - 1;
  if (!deposit.on || deposit.hundredths === 0 || plain <= 0 || lastYear < firstYear) return none;
  const count = lastYear - firstYear + 1;
  const payments: number[] = Array.from({ length: count }, () => 0);
  funds.forEach((fund, index) => {
    const row = rows[index];
    if (row?.shares == null) return;
    for (const year of flatYears(asOf, fund.year)) {
      const at = year + 1 - firstYear;
      if (at < count)
        payments[at] =
          (payments[at] ?? 0) + row.shares * flatYearMicroEur(fund, year, flat, tax, asOf);
    }
  });
  const rate = deposit.hundredths / 10000;
  const firstMonths = 12 - Number(asOf.slice(5, 7));
  const run = (start: number, paid = true): Reserve & { end: number } => {
    let balance = start;
    const gross: number[] = [];
    const taxes: number[] = [];
    payments.forEach((payment, at) => {
      balance -= paid ? payment : 0;
      const interest = (balance * rate * (at === 0 ? firstMonths : 12)) / 12;
      const parts = taxParts(interest, taxState);
      const owed = parts.kapESt + parts.soli + parts.kist;
      gross.push(interest);
      taxes.push(owed);
      balance += interest - owed;
    });
    return { startMicro: start, interestMicro: gross, interestTaxMicro: taxes, end: balance };
  };
  const zero = run(0);
  // The slope is the growth of 1 EUR without payments: a difference of the two runs would lose digits.
  const slope = run(1, false).end;
  const start = -zero.end / slope;
  if (!(slope > 0) || !Number.isFinite(start) || start <= 0) return none;
  return run(start);
}

function depotCentsAt(
  monthlyCents: number,
  funds: readonly Fund[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption,
  asOf: string,
): number {
  const rows = purchaseRows(
    funds,
    phase,
    monthlyCents,
    taxFromState(taxState),
    flat,
    deposit,
    asOf,
  );
  let micro = 0;
  rows.forEach((row) => {
    if (row.shares === null || row.purchaseMicroEur === null) return;
    micro += row.purchaseMicroEur;
  });
  // Plus the cash reserve for the Vorabpauschale of the whole holding (story 048 AC2, story 049).
  micro += reserveOf(funds, rows, phase, taxState, flat, deposit, asOf).startMicro;
  return micro / 10000;
}

/** Depot value to monthly payout: `P = D / depot(1 EUR)`; 0 when no year can be funded. */
export function payoutFromDepotCents(
  depotCents: number,
  funds: readonly Fund[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  asOf: string = FUND_LIST_AS_OF,
): number {
  const unit = depotCentsAt(UNIT_MONTHLY_CENTS, funds, phase, taxState, flat, deposit, asOf);
  return unit <= 0 ? 0 : (depotCents * UNIT_MONTHLY_CENTS) / unit;
}

/** Monthly target to depot value (the same pair inverted). */
export function depotFromPayoutCents(
  monthlyCents: number,
  funds: readonly Fund[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  asOf: string = FUND_LIST_AS_OF,
): number {
  return depotCentsAt(monthlyCents, funds, phase, taxState, flat, deposit, asOf);
}

/** The plan the components read; a phase with no funded year has no result (the UI says so). */
export function buildPlan(
  funds: readonly Fund[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption = DEPOSIT_OFF,
  amountCents: number,
  direction: 'depot' | 'payout',
  asOf: string = FUND_LIST_AS_OF,
): Plan {
  const monthlyCents =
    direction === 'depot'
      ? payoutFromDepotCents(amountCents, funds, phase, taxState, flat, deposit, asOf)
      : amountCents;
  const fundedYears = phaseYears(phase).filter((year) => fundingFund(funds, year) !== null).length;
  return {
    monthlyCents,
    depotCents:
      direction === 'depot'
        ? amountCents
        : depotFromPayoutCents(amountCents, funds, phase, taxState, flat, deposit, asOf),
    fundedYears,
  };
}

/** One money column of the statement, in the order the table reads them (AC3). */
export type FlowColumn =
  | 'purchase'
  | 'flat'
  | 'proceeds'
  | 'kapESt'
  | 'soli'
  | 'kist'
  | 'interest'
  | 'interestTax'
  | 'payout';

export const FLOW_COLUMNS: readonly FlowColumn[] = [
  'purchase',
  'flat',
  'proceeds',
  'kapESt',
  'soli',
  'kist',
  'interest',
  'interestTax',
  'payout',
];

/** One calendar year, in whole cents as shown; outflows are negative. */
export interface StatementRow {
  readonly year: number;
  readonly start: number;
  readonly flows: Readonly<Record<FlowColumn, number>>;
  readonly end: number;
}

/** AC5: the check line, every figure is a column sum of the statement, as a positive amount. */
export interface StatementCheck {
  readonly depot: number;
  readonly purchase: number;
  readonly proceeds: number;
  readonly taxes: number;
  readonly interest: number;
  readonly payout: number;
}

/** AC4: the way to the gain of one bought fund, in whole cents as shown. */
export interface FundFigures {
  readonly shares: number;
  readonly einstandCents: number;
  readonly proceedsCents: number;
  readonly gainCents: number;
  /** Sum of the Vorabpauschale bases of the whole holding; 0 outside the tax case. */
  readonly basesCents: number;
  readonly taxableGainCents: number;
}

export interface Statement {
  readonly rows: readonly StatementRow[];
  /** The columns with an amount somewhere in the plan; the others are not shown (AC3). */
  readonly columns: readonly FlowColumn[];
  readonly sums: Readonly<Record<FlowColumn, number>>;
  readonly check: StatementCheck;
  /** The depot, as shown: the start of the first row. */
  readonly depotCents: number;
  /** The cash reserve for the Vorabpauschale: the depot minus the Einstand of all funds, derived. */
  readonly reserveCents: number;
  /** One entry per fund of the list; null for a fund that is not bought. */
  readonly funds: readonly (FundFigures | null)[];
}

/** Rounds the size once and keeps the sign, so an outflow and an inflow of the same size round alike. */
function roundCents(cents: number): number {
  return (cents < 0 ? -Math.round(-cents) : Math.round(cents)) + 0;
}

function emptyFlows(): Record<FlowColumn, number> {
  return {
    purchase: 0,
    flat: 0,
    proceeds: 0,
    kapESt: 0,
    soli: 0,
    kist: 0,
    interest: 0,
    interestTax: 0,
    payout: 0,
  };
}

/** The statement of one plan, or null while there is no year to show or nothing is paid out. */
export function buildStatement(
  funds: readonly Fund[],
  phase: Phase,
  taxState: TaxState,
  flat: FlatRate,
  deposit: DepositOption,
  plan: Plan,
  asOf: string = FUND_LIST_AS_OF,
  purchases: readonly PurchaseRow[] = purchaseRows(
    funds,
    phase,
    plan.monthlyCents,
    taxFromState(taxState),
    flat,
    deposit,
    asOf,
  ),
): Statement | null {
  const tax = taxFromState(taxState);
  const firstYear = Number(asOf.slice(0, 4));
  const years = phaseYears(phase);
  const lastYear = years[years.length - 1] ?? firstYear - 1;
  if (lastYear < firstYear) return null;
  // Unrounded cents per year and column.
  const raw: Record<FlowColumn, number>[] = [];
  for (let year = firstYear; year <= lastYear; year++) raw.push(emptyFlows());
  const rawRow = (year: number): Record<FlowColumn, number> | undefined => raw[year - firstYear];

  const figures: (FundFigures | null)[] = funds.map((fund, index) => {
    const purchase = purchases[index];
    if (purchase?.shares == null || purchase.purchaseMicroEur === null) return null;
    const shares = purchase.shares;
    const einstandCents = roundCents(purchase.purchaseMicroEur / 10000);
    const proceedsMicro = shares * preTaxPerShareMicroEur(fund, asOf);
    const proceedsCents = roundCents(proceedsMicro / 10000);
    const gainCents = proceedsCents - einstandCents;
    const basesCents = taxState.kstOn
      ? roundCents((shares * fund.navMicroEur * flatBaseFactor(fund, flat, asOf)) / 10000)
      : 0;
    // The tax base of the liquidation, unrounded: the gain minus the bases already taxed, not below 0.
    const baseMicro =
      shares *
      fund.navMicroEur *
      Math.max(0, rhoFactor(fund, asOf) - 1 - flatBaseFactor(fund, flat, asOf));
    const liquidation = rawRow(fund.year);
    if (liquidation !== undefined) {
      const parts = taxParts(baseMicro, taxState);
      liquidation.proceeds += proceedsMicro / 10000;
      liquidation.kapESt -= parts.kapESt / 10000;
      liquidation.soli -= parts.soli / 10000;
      liquidation.kist -= parts.kist / 10000;
    }
    // The Vorabpauschale of year Z is paid on the first working day of year Z + 1.
    for (const year of flatYears(asOf, fund.year)) {
      const paid = rawRow(year + 1);
      if (paid !== undefined) {
        paid.flat -= (shares * flatYearMicroEur(fund, year, flat, tax, asOf)) / 10000;
      }
    }
    return {
      shares,
      einstandCents,
      proceedsCents,
      gainCents,
      basesCents,
      taxableGainCents: taxState.kstOn ? Math.max(0, gainCents - basesCents) : 0,
    };
  });

  // The phase years: payouts, and the interest of the money that waits for them.
  const monthlyMicro = plan.monthlyCents * 10000;
  for (const year of years) {
    const row = rawRow(year);
    const fund = fundingFund(funds, year);
    const fundIndex = fund === null ? -1 : funds.findIndex((entry) => entry.year === fund.year);
    if (row === undefined || fundIndex < 0 || figures[fundIndex] === null) continue;
    const months = monthsInYear(phase, year);
    const interest = parkInterestMicroEur(monthlyMicro, deposit, months);
    row.interest += interest / 10000;
    row.interestTax -= parkTaxMicroEur(interest, tax) / 10000;
    row.payout -= plan.monthlyCents * months;
  }

  // The reserve's interest (story 049 AC1), also in the years before the phase.
  const reserve = reserveOf(funds, purchases, phase, taxState, flat, deposit, asOf);
  reserve.interestMicro.forEach((interest, at) => {
    const row = raw[at];
    if (row === undefined) return;
    row.interest += interest / 10000;
    row.interestTax -= (reserve.interestTaxMicro[at] ?? 0) / 10000;
  });

  // One rounding per cell; the purchase is the sum of the rounded Einstand figures of the fund table.
  const shown: Record<FlowColumn, number>[] = raw.map((flows) => {
    const rounded = emptyFlows();
    for (const column of FLOW_COLUMNS) rounded[column] = roundCents(flows[column]);
    return rounded;
  });
  const first = shown[0];
  if (first === undefined) return null;
  first.purchase = -figures.reduce((sum, entry) => sum + (entry?.einstandCents ?? 0), 0);

  // The residue of the roundings goes into the last payout, so the last end is exactly 0,00 EUR.
  const lastPayout = shown.reduce(
    (found, flows, index) => (flows.payout !== 0 ? index : found),
    -1,
  );
  if (lastPayout < 0) return null;
  let balance = roundCents(plan.depotCents);
  const depotCents = balance;
  const rows: StatementRow[] = shown.map((flows, index) => {
    const start = balance;
    if (index === lastPayout) {
      const others = FLOW_COLUMNS.reduce(
        (sum, column) => sum + (column === 'payout' ? 0 : flows[column]),
        0,
      );
      flows.payout = -(start + others);
    }
    balance = start + FLOW_COLUMNS.reduce((sum, column) => sum + flows[column], 0);
    return { year: firstYear + index, start, flows, end: balance };
  });

  const sums = emptyFlows();
  for (const row of rows) for (const column of FLOW_COLUMNS) sums[column] += row.flows[column];
  const einstand = figures.reduce((sum, entry) => sum + (entry?.einstandCents ?? 0), 0);
  return {
    rows,
    columns: FLOW_COLUMNS.filter((column) => sums[column] !== 0),
    sums,
    check: {
      depot: depotCents,
      purchase: 0 - sums.purchase,
      proceeds: sums.proceeds,
      taxes: 0 - (sums.flat + sums.kapESt + sums.soli + sums.kist + sums.interestTax),
      interest: sums.interest,
      payout: 0 - sums.payout,
    },
    depotCents,
    reserveCents: depotCents - einstand,
    funds: figures,
  };
}
