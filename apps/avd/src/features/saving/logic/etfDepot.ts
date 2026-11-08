import type { Inputs } from './parseInputs.ts';
import { monthlyLog, payoutMonths, payoutMultiple, soldFraction } from './payout.ts';
import { netAnnualRate } from './project.ts';

/** Abgeltungsteuer 25 % plus 5,5 % Solidaritätszuschlag, no church tax (§ 32d EStG, SolZG). */
export const CAPITAL_GAINS_TAX_RATE = 0.26375;
/** Teilfreistellung of an equity fund (§ 20 Abs. 1 InvStG): 30 % of gains and Vorabpauschale are tax-free. */
export const PARTIAL_EXEMPTION = 0.3;
/** Basiszins 2026, one fixed assumption for all years (§ 18 InvStG; story 016 Context). */
export const BASE_RATE_BP = 320;
/** Sparer-Pauschbetrag of a single person per year (§ 20 Abs. 9 EStG). */
export const ALLOWANCE_CENTS = 100_000;

/** The Vorabpauschale is the Basiszins times this share of the value at the start of the year. */
const BASE_YIELD_SHARE = 0.7;
const BP = 10_000;
const MONTHS = 12;

export interface EtfDepot {
  /** Depot value at payout start, round(E). */
  readonly depotCents: number;
  /** round(depotCents · M), the equal gross payouts until 85 in total (ADR 0009). */
  readonly grossPayoutsCents: number;
  /** Every tax of the depot over all calendar years, rounded once. */
  readonly taxCents: number;
  /** The taxes of the saving years 1 … N, rounded once (Vorabpauschale only). */
  readonly savingPhaseTaxCents: number;
}

/**
 * The normal ETF depot of the comparison (story 016, ADR 0009): the same monthly rate, return and
 * costs as the Altersvorsorgedepot, no Zulage, no refund. One lot per monthly contribution, bought
 * at the end of its month at price g^t; at the end of every calendar year each held unit gets the
 * Vorabpauschale (1/12 rule in the year of purchase), income of the following year. Payout k sells
 * `soldFraction` of the remaining units, oldest lot first; the gain is reduced by the lot's
 * Vorabpauschalen. Tax per year = 26,375 % · max(0, 70 % · income − Pauschbetrag); a negative year
 * is lost. Taxes are paid from outside the depot or withheld from the payout: they never change
 * the depot. Reads only age, payout age, monthly rate, return and costs, plus the checkbox.
 */
export function etfDepot(inputs: Inputs, useAllowance: boolean): EtfDepot {
  const { age, payoutAge, monthlyCents } = inputs;
  const savingYears = payoutAge - age;
  const months = payoutMonths(payoutAge);
  const totalYears = savingYears + months / MONTHS;
  const netRate = netAnnualRate(inputs);
  const lambda = monthlyLog(netRate);
  const price = (month: number) => Math.exp(lambda * month);
  const allowance = useAllowance ? ALLOWANCE_CENTS : 0;

  // Lots, index = purchase month − 1: units held, purchase price, accumulated Vorabpauschale per unit.
  const units: number[] = [];
  const purchasePrice: number[] = [];
  const vapPerUnit: number[] = [];
  let head = 0; // oldest lot still held (FIFO)
  let unitsHeld = 0;
  // Taxable income per calendar year (index = year; one spare slot for the last year's Vorabpauschale).
  const income = new Array<number>(totalYears + 2).fill(0);

  /** Vorabpauschale per unit of year `year` (1-based calendar year, saving and payout phase). */
  const vapOfYear = (year: number) => {
    const start = price(MONTHS * (year - 1));
    const end = price(MONTHS * year);
    return Math.max(0, Math.min((start * BASE_RATE_BP * BASE_YIELD_SHARE) / BP, end - start));
  };

  /** Credits the Vorabpauschale of `year` to every held lot; income of the following year. */
  const creditVap = (year: number, boughtInYear: boolean) => {
    const v = vapOfYear(year);
    if (v === 0) return;
    let total = 0;
    for (let lot = head; lot < units.length; lot++) {
      const month = lot + 1 - MONTHS * (year - 1); // month of purchase within `year`, if bought then
      const share = boughtInYear && month >= 1 ? (MONTHS + 1 - month) / MONTHS : 1;
      const perUnit = v * share;
      vapPerUnit[lot] = (vapPerUnit[lot] ?? 0) + perUnit;
      total += (units[lot] ?? 0) * perUnit;
    }
    income[year + 1] = (income[year + 1] ?? 0) + total;
  };

  for (let year = 1; year <= savingYears; year++) {
    for (let month = 1; month <= MONTHS; month++) {
      const p = price(MONTHS * (year - 1) + month);
      units.push(monthlyCents / p);
      purchasePrice.push(p);
      vapPerUnit.push(0);
      unitsHeld += monthlyCents / p;
    }
    creditVap(year, true);
  }

  const endOfSaving = MONTHS * savingYears;
  let depot = 0;
  for (let lot = 0; lot < units.length; lot++) depot += (units[lot] ?? 0) * price(endOfSaving);
  const depotCents = Math.round(depot);

  for (let k = 1; k <= months; k++) {
    const year = savingYears + Math.ceil(k / MONTHS);
    const p = price(endOfSaving + k);
    const last = k === months;
    const requested = soldFraction(netRate, months - k + 1) * unitsHeld;
    let toSell = last ? Number.POSITIVE_INFINITY : requested;
    let gain = 0;
    while (toSell > 0 && head < units.length) {
      const held = units[head] ?? 0;
      const basis = (purchasePrice[head] ?? 0) + (vapPerUnit[head] ?? 0);
      // A lot is consumed when the request covers it, so float residues never linger (Risks 5).
      const sold = toSell >= held ? held : toSell;
      gain += sold * (p - basis);
      toSell -= sold;
      if (sold === held) {
        units[head] = 0;
        head++;
      } else {
        units[head] = held - sold;
      }
    }
    unitsHeld = last ? 0 : Math.max(0, unitsHeld - requested);
    income[year] = (income[year] ?? 0) + gain;
    if (k % MONTHS === 0 && !last) creditVap(year, false);
  }

  let tax = 0;
  let savingPhaseTax = 0;
  for (let year = 1; year <= totalYears; year++) {
    const taxable = Math.max(0, (1 - PARTIAL_EXEMPTION) * (income[year] ?? 0) - allowance);
    const yearTax = CAPITAL_GAINS_TAX_RATE * taxable;
    tax += yearTax;
    if (year <= savingYears) savingPhaseTax += yearTax;
  }

  return {
    depotCents,
    grossPayoutsCents: Math.round(depotCents * payoutMultiple(netRate, months)),
    taxCents: Math.round(tax),
    savingPhaseTaxCents: Math.round(savingPhaseTax),
  };
}
