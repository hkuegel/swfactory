import { describe, expect, it } from 'vitest';
import { cashflowRows, flatPartsSum } from './cashflow.ts';
import { flatYearMicroEur } from './flat.ts';
import type { Fund } from './fund.ts';
import type { ParkReason, ParkTaxReason, Phase, Plan, YearRow } from './phase.ts';
import type { PurchaseReason, PurchaseRow } from './purchase.ts';
import type { TaxState } from './tax.ts';

/**
 * Story 047. Hand oracles, the tester's own arithmetic on the fixture copy (asOf 31.12.2026), never read
 * back from `cashflow.ts` (P16). The rules as the tester reads them: rho = (1 + ytm)^(days/365) from asOf
 * to 31.12. of the fund year; the base of a flat year = min(max(0, the year's increase), the value at the
 * start of that year x rate x wholeMonths/12), wholeMonths = 1 in asOf's own year (December) and 12 later,
 * the counted years from asOf's year through fundYear - 1; the rates of 031 (25 %, 5,5 % of that, and 8 or
 * 9 % of the Kapitalsteuer); the money rule's reading order = the fund table's purchase parts row by row,
 * then the flat figures per phase year (column A before column B), then the year section's line for a fund
 * whose sale year is not a phase year, and within a split figure the last piece from that fund's own part.
 * Every expected figure below is a hand literal, and the rows are hand rows too, so this file does not
 * read its oracle from the module it checks.
 */
const AS_OF = '2026-12-31';
const TAX_ON: TaxState = { kstOn: true, kistOn: false, bundesland: 'bayern' };
const TAX_OFF: TaxState = { kstOn: false, kistOn: false, bundesland: 'bayern' };
const KIST_9: TaxState = { kstOn: true, kistOn: true, bundesland: 'brandenburg' };
const FLAT_OFF = { hundredths: 0 };
const FLAT_224 = { hundredths: 224 };
const TAX_26375 = { on: true, rateMillionths: 263750 };

function fund(year: number, navMicroEur: number, ytmBp: number): Fund {
  return {
    year,
    isin: `DE000HAND${String(year)}`,
    name: 'hand case',
    navMicroEur,
    ytmBp,
    avgMaturityHundredths: 0,
    sharesOutstanding: 0,
  };
}

const HAND_FUNDS = [
  fund(2027, 36000000, 150),
  fund(2028, 38000000, 200),
  fund(2029, 40000000, 250),
  fund(2030, 42000000, 300),
  fund(2031, 44000000, 350),
  fund(2032, 46000000, 400),
  fund(2033, 48000000, 450),
  fund(2034, 50000000, 500),
  fund(2035, 52000000, 550),
];

/** The hand list, read by year so no test here indexes into an array it cannot type. */
const handFund = (year: number): Fund => {
  const found = HAND_FUNDS.find((entry) => entry.year === year);
  if (found === undefined) {
    throw new Error(`hand fund ${String(year)} is missing from the tester's list`);
  }
  return found;
};

/** A hand fund row: `purchaseMicroEur` unrounded, so the money rule can round it once. */
function handPurchase(
  fundYear: number,
  phaseYear: number | null,
  shares: number | null,
  purchaseMicroEur: number | null,
  reason: PurchaseReason | null,
): PurchaseRow {
  return { fundYear, phaseYear, yearAmountMicroEur: 0, shares, purchaseMicroEur, reason };
}

/** A hand year row: the figures the year table reads, written as hand values (P16). */
function handYear(
  year: number,
  months: number,
  fundingFund: Fund | null,
  yearAmountCents: number,
  parkReason: ParkReason | null,
  parkTaxReason: ParkTaxReason | null,
  parkInterestMicroEur: number | null = null,
  parkTaxMicroEur: number | null = null,
): YearRow {
  return {
    year,
    months,
    fundingFund,
    yearAmountCents,
    parkInterestMicroEur,
    parkTaxMicroEur,
    parkReason,
    parkTaxReason,
  };
}

/** A hand plan: the totals are hand sums, so a derivation reads a hand total (P16). */
function handPlan(rows: YearRow[], monthlyCents: number, depotCents: number): Plan {
  return {
    years: rows,
    fundedYears: rows.filter((row) => row.fundingFund !== null),
    phaseFactor: 0,
    monthlyCents,
    depotCents,
    totalCents: rows.reduce((sum, row) => sum + row.yearAmountCents, 0),
    flatCashCents: 0,
  };
}

describe('cashflow (story 047, AC5): the tax split on one base', () => {
  const phase: Phase = { startMonth: '2028-01', endMonth: '2028-12' };
  const rowA = handYear(2028, 12, handFund(2027), 120000, 'option-off', 'outside-tax-case');

  it('AC5 the parts are the rates of 031 on the same base, and the last part is derived', () => {
    // Hand: rho = 1,015 exactly (365 days), the payout per share is 3.600 Cent x (1,015 - 0,26375 x 0,015)
    // = 3.639,7575 Cent, so shares = 120.000 / 3.639,7575 = 32,9692294061 and the base is that times
    // 3.600 Cent x 0,015 = 1.780,3383877 Cent. Own roundings: KSt 445, Solz 24, no church tax. The row's
    // tax total is one rounding on the same base (469,5642 Cent -> 470), and the last part with a figure -
    // the Solzzuschlag - is derived from it: 470 - 445 = 25 Cent, one Cent more than its own rounding.
    const shares = 32.9692294061;
    const purchase = 1186892258.4648; // shares x NAV, micro-euro
    const row = handPurchase(2027, 2028, shares, purchase, null);
    const table = cashflowRows(
      handPlan([rowA], 10000, 118689),
      phase,
      TAX_ON,
      FLAT_OFF,
      [row],
      HAND_FUNDS,
      AS_OF,
    );
    const shown = table.rows[0];
    expect(shown?.cells.kst?.cents, 'KSt: 25 % of the base').toBe(445);
    expect(shown?.cells.solz?.cents, 'Solz: 5,5 % of the KSt, derived from the row total').toBe(25);
    // A rate that does not apply shows no figure and names its reason (AC4).
    expect(shown?.cells.kist?.cents, 'the Kirchensteuer is not angehakt').toBeNull();
    expect(shown?.cells.kist?.reason).toBe('kist-off');
    expect(shown?.taxTotalCents, 'one rounding on the same base').toBe(470);
    const parts = (shown?.cells.kst?.cents ?? 0) + (shown?.cells.solz?.cents ?? 0);
    expect(parts, 'the parts add up to the total the section states').toBe(shown?.taxTotalCents);
    // AC3: the row's cash total is the tax parts plus the parked money plus the gross interest.
    expect(shown?.cashTotalCents).toBe(120470);
  });

  it('AC5 the church tax is a whole hundredths rate on the Kapitalsteuer, 9 % for Brandenburg', () => {
    // Hand: the rate on the gain here is 28,625 %, so the payout per share is 3.600 Cent x 1,01104375 -
    // 0,0225 x 54 Cent ... = 3.639.3181088 Cent, shares = 32,9802386533, base = 1.780,9325152 Cent.
    // Own roundings: KSt 445, Solz 24, Kist 40. The row total is one rounding on the base (510,0 -> 510),
    // so the Kirchensteuer as the last part with a figure is derived: 510 - 469 = 41 Cent.
    const row = handPurchase(2027, 2028, 32.9802386533, 1187288591.5188, null);
    const table = cashflowRows(
      handPlan([rowA], 10000, 118729),
      phase,
      KIST_9,
      FLAT_OFF,
      [row],
      HAND_FUNDS,
      AS_OF,
    );
    const shown = table.rows[0];
    expect(shown?.cells.kst?.cents).toBe(445);
    expect(shown?.cells.solz?.cents).toBe(24);
    expect(shown?.cells.kist?.cents, 'derived, its own rounding would be 40').toBe(41);
    expect(shown?.taxTotalCents).toBe(510);
    expect(shown?.cashTotalCents).toBe(120510);
  });

  it('AC5 the tax on the parked interest is one figure added to the row total, not split', () => {
    // Hand, parking on at 2,50 %: monthSum(12) = 12 x 13 / 24 = 6,5, so the interest is
    // 10.000 Cent x 0,025 x 6,5 = 1.625 Cent and its tax is 1.625 x 26,375 % = 428,59375 Cent -> 429.
    // The shares follow the money at the START of the year: 120.000 - 1.196,40625 = 118.803,59375 Cent,
    // so shares = 118.803,59375 / 3.639,7575 = 32,6405244718 and the base is 1.762,5704924 Cent:
    // KSt 441, Solz 24 (own rounding and derived, the total here does not move it), total 465 + 429 = 894.
    const row = handYear(2028, 12, handFund(2027), 118803.59375, null, null, 16250000, 4285937.5);
    const fundRow = handPurchase(2027, 2028, 32.6405244718, 1175058880.983, null);
    const table = cashflowRows(
      handPlan([row], 10000, 117506),
      phase,
      TAX_ON,
      FLAT_OFF,
      [fundRow],
      HAND_FUNDS,
      AS_OF,
    );
    const shown = table.rows[0];
    expect(shown?.cells.interest?.cents).toBe(1625);
    expect(shown?.cells.interestTax?.cents).toBe(429);
    expect(shown?.cells.kst?.cents).toBe(441);
    expect(shown?.cells.solz?.cents).toBe(24);
    expect(shown?.taxTotalCents, 'the parts plus the one figure of the interest tax').toBe(894);
    expect(shown?.cashTotalCents, 'parts + parked + gross interest').toBe(120894);
  });

  it('AC5 outside the tax case the split shows no figure anywhere (AC4 names the reason)', () => {
    // Hand: tax off, so no part of the split is read and the section states no total. The same phase and
    // the same monthly target: shares = 120.000 / 3.654 Cent = 32,8407224959, the base 1.773,4102 Cent is
    // not taxed, so every tax column names `outside-tax-case` and the cash total is the year's money.
    const fundRow = handPurchase(2027, 2028, 32.8407224959, 1182266009.8524, null);
    const table = cashflowRows(
      handPlan([rowA], 10000, 118227),
      phase,
      TAX_OFF,
      FLAT_OFF,
      [fundRow],
      HAND_FUNDS,
      AS_OF,
    );
    const shown = table.rows[0];
    for (const column of ['kst', 'solz', 'kist'] as const) {
      expect(shown?.cells[column]?.cents, `${column}: no figure outside the tax case`).toBeNull();
      expect(shown?.cells[column]?.reason, `${column}: the reason the copy names`).toBe(
        'outside-tax-case',
      );
    }
    expect(
      table.taxTotalCents,
      'nothing shown, so no sum line (the display rule 045 records)',
    ).toBeNull();
    expect(shown?.cashTotalCents).toBe(120000);
  });
});

describe('cashflow (story 047, AC3): the money rule read across the two tables', () => {
  // The tester's own flat table on the fixture copy (asOf 31.12.2026, flat 2,24 %, tax 26,375 %):
  // fund 2030 counts the years 2026-2029 with bases 0,065809 + 101,147418 + 104,147491 + 107,147491 Cent
  // of base value, that is 291,163648 Cent of base -> 76,794412 Cent of tax; fund 2031 counts
  // 2026-2030 -> 415,898900 Cent -> 109,693335 Cent; fund 2032 counts 2026-2031 -> 558,689554 Cent
  // -> 147,354370 Cent. Phase 01.2031-12.2033, monthly 100,01 € = 10.001 Cent, parking off, church off,
  // so the shown depot is 10.001 x F + cash = 309.317 Cent.
  const phase: Phase = { startMonth: '2031-01', endMonth: '2033-12' };
  // Hand shares: 25,7250474961 / 23,4487021895 / 21,2529312236; the funds outside the phase are not
  // bought, so they show no figure and name their phase-side reason (032 AC3).
  const handRows: [number, number | null, number | null, PurchaseReason | null][] = [
    [2027, null, null, 'before-phase-start'],
    [2028, null, null, 'before-phase-start'],
    [2029, null, null, 'before-phase-start'],
    [2030, 25.7250474961, 1080451994.8362, null],
    [2031, 23.4487021895, 1031742895.9384, null],
    [2032, 21.2529312236, 977634836.2836, null],
    [2033, null, null, 'after-phase-end'],
    [2034, null, null, 'after-phase-end'],
    [2035, null, null, 'after-phase-end'],
  ];
  const purchases = handRows.map(([year, shares, purchase, reason]) =>
    handPurchase(year, shares === null ? null : year + 1, shares, purchase, reason),
  );
  const rows = [2031, 2032, 2033].map((year) =>
    handYear(year, 12, handFund(year - 1), 120012, 'option-off', 'outside-tax-case'),
  );
  const table = cashflowRows(
    handPlan(rows, 10001, 309317),
    phase,
    TAX_ON,
    FLAT_224,
    purchases,
    HAND_FUNDS,
    AS_OF,
  );

  it("AC3 the pieces of one fund are the same expression as that fund's own figure", () => {
    // Hand per counted year (the year's base x NAV x the rate): fund 2032's year 2031 is 31,7998 Cent and
    // its counted years 2026-2030 together are 115,5545 Cent, so the fund's own figure is 147,3544 Cent.
    // Those two pieces read in column B of row 2031 and in column A of its own row 2032, and the last one
    // is derived from the fund's own part: 147 - 32 = 115, one Cent less than its own rounding (116).
    expect(flatYearMicroEur(handFund(2032), 2031, FLAT_224, TAX_26375, AS_OF)).toBeCloseTo(
      317998.45,
      2,
    );
    const pieces = table.flatFigures.filter((figure) => figure.fundYear === 2032);
    expect(pieces.map((figure) => [figure.cell, figure.year, figure.cents])).toEqual([
      ['flatForYear', 2031, 32],
      ['flatBeforePhase', 2032, 115],
    ]);
    expect(pieces.reduce((sum, figure) => sum + figure.cents, 0)).toBe(147);
  });

  it('AC3 the last part in the reading order is derived from the shown depot', () => {
    // Reading order: the purchase parts 108045, 103174, 97763, then the flat figures per phase year
    // (column A before column B): 110 (column A of row 2031, fund 2031), 32 (column B of row 2031, fund
    // 2032), 115 (column A of row 2032, fund 2032, derived from its own part), then the year section's
    // line for fund 2030, whose sale year is not a phase year - the last part in the order, so the rule
    // derives it: 309.317 - 309.239 = 78 Cent, one Cent more than its own rounding (77).
    expect(table.flatFigures.map((figure) => [figure.cell, figure.year, figure.cents])).toEqual([
      ['flatBeforePhase', 2031, 110],
      ['flatForYear', 2031, 32],
      ['flatBeforePhase', 2032, 115],
      ['flatNoRowLine', null, 78],
    ]);
    const flatParts = flatPartsSum(table.flatFigures);
    const purchaseCents = table.fundParts.reduce((sum, part) => sum + (part.purchaseCents ?? 0), 0);
    expect(flatParts, 'the flat figures as shown').toBe(335);
    expect(purchaseCents + (flatParts ?? 0), 'the parts add up to the shown depot').toBe(309317);
  });

  it('AC3 each sum line is the sum of the figures shown in that column', () => {
    // Hand tax parts per row: 1520 + 84, 2406 + 132, 3523 + 194; the church column has no figure, so it
    // has no sum line; the flat columns 110 + 32 and 115; the money columns are P x m (120.012 Cent).
    expect(table.columnSums.proceeds).toBe(367895);
    expect(table.columnSums.kst).toBe(7449);
    expect(table.columnSums.solz).toBe(410);
    expect(table.columnSums.kist, 'no figure in the church column').toBeNull();
    expect(table.columnSums.flatBeforePhase).toBe(225);
    expect(table.columnSums.flatForYear).toBe(32);
    expect(table.columnSums.payout).toBe(360036);
    expect(table.columnSums.parked).toBe(360036);
    expect(table.columnSums.interest, 'the parking option is off, so no figure').toBeNull();
    expect(table.columnSums.interestTax).toBeNull();
    // The two totals the year section states once: 7449 + 410 = 7859, and 7859 + 360036 = 367895.
    expect(table.taxTotalCents).toBe(7859);
    expect(table.cashTotalCents).toBe(367895);
    for (const row of table.rows) {
      const parts = [row.cells.kst.cents, row.cells.solz.cents, row.cells.kist.cents];
      const taxSum = parts.reduce<number>((sum, cents) => sum + (cents ?? 0), 0);
      expect(taxSum, `row ${String(row.year)}: the parts add to the total it states`).toBe(
        row.taxTotalCents,
      );
      expect(taxSum + (row.cells.parked.cents ?? 0), `row ${String(row.year)} cash`).toBe(
        row.cashTotalCents,
      );
    }
  });
});

describe("cashflow (story 047, AC6): the proceeds cell is shares x the fund table's figure", () => {
  // Hand, fund 2027 (36,00 € = 3.600 Cent, 150 bp, asOf 31.12.2026, 365 days -> rho = 1,015): the fund
  // table's figure is the pre-tax proceeds per share = 3.600 Cent x 1,015 = 3.654 Cent = 36,54 €. Row
  // 2028 of phase 01.2028-12.2028: shares 32,9692294061 x 3.654 Cent = 1.204,6956 Cent -> 120.470 Cent.
  // AC2's identity for the same row: that figure is the row's tax (470 Cent) plus the money that had to
  // be there at the start of the year (120.000 Cent). With the tax off no tax is subtracted at all, so
  // the proceeds cell, the payout cell and the parked cell are the same number, and AC6 holds unchanged.
  const phase: Phase = { startMonth: '2028-01', endMonth: '2028-12' };
  const rowA = handYear(2028, 12, handFund(2027), 120000, 'option-off', 'outside-tax-case');

  it('AC6 the proceeds cell is shares x the figure, and the tax parts plus the parked money', () => {
    const shares = 32.9692294061;
    const fundRow = handPurchase(2027, 2028, shares, 1186892258.4648, null);
    const table = cashflowRows(
      handPlan([rowA], 10000, 118689),
      phase,
      TAX_ON,
      FLAT_OFF,
      [fundRow],
      HAND_FUNDS,
      AS_OF,
    );
    const row = table.rows[0];
    // Hand: shares x the fund table's figure, one rounding (the fund table shows 36,54 € = 3.654 Cent).
    const proceedsHand = Math.round(shares * 3654);
    expect(proceedsHand).toBe(120470);
    expect(row?.cells.proceeds?.cents, 'the proceeds cell as AC6 reads it').toBe(proceedsHand);
    const tax = [row?.cells.kst.cents, row?.cells.solz.cents, row?.cells.kist.cents].reduce<number>(
      (sum, cents) => sum + (cents ?? 0),
      0,
    );
    expect(tax + (row?.cells.parked.cents ?? 0), 'the identity AC2 names for this row').toBe(
      proceedsHand,
    );
  });

  it("AC6, the tax-off pair: no tax figure, so the proceeds cell is the year's money alone", () => {
    const shares = 32.8407224959;
    const fundRow = handPurchase(2027, 2028, shares, 1182266009.8524, null);
    const table = cashflowRows(
      handPlan([rowA], 10000, 118227),
      phase,
      TAX_OFF,
      FLAT_OFF,
      [fundRow],
      HAND_FUNDS,
      AS_OF,
    );
    const row = table.rows[0];
    // Hand: with the tax off the payout per share is the pre-tax figure, so shares x 3.654 Cent is the
    // year's money exactly - 120.000 Cent - and the three cells of this row show the same number.
    expect(Math.round(shares * 3654)).toBe(120000);
    expect(row?.cells.proceeds?.cents).toBe(120000);
    expect(row?.cells.payout?.cents).toBe(120000);
    expect(row?.cells.parked?.cents).toBe(120000);
    expect(row?.cashTotalCents).toBe(120000);
  });
});
