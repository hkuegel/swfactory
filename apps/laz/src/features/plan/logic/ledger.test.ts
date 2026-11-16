import { describe, expect, it } from 'vitest';
import { DEPOSIT_OFF, type DepositOption } from './deposit.ts';
import { FLAT_OFF, type FlatRate } from './flat.ts';
import { FUND_LIST, type Fund } from './fund.ts';
import {
  buildPlan,
  buildStatement,
  depotFromPayoutCents,
  payoutFromDepotCents,
  FLOW_COLUMNS,
  type Statement,
} from './ledger.ts';
import { monthsInYear, type Phase } from './phase.ts';
import type { TaxState } from './tax.ts';

/**
 * Story 048 (the ledger). The hand cases are written here from the story's rules, never read back from
 * the module. The fixture copy (asOf 2026-12-31) is the fund list of the unit tests; the example phase
 * is 01.2028-03.2034, where F = 66,947895916 gives, with tax and parking off, 14.936,989225972 Cent a
 * month for a depot of 1.000.000 Cent (the pin of AC6, from `main` before the change).
 */
const PHASE: Phase = { startMonth: '2028-01', endMonth: '2034-03' };
const OFF: TaxState = { kstOn: false, kistOn: false, bundesland: 'bayern' };
const KST: TaxState = { kstOn: true, kistOn: false, bundesland: 'bayern' };
const KIST: TaxState = { kstOn: true, kistOn: true, bundesland: 'bayern' };
const FLAT_224: FlatRate = { hundredths: 224 };
const PARK_250: DepositOption = { on: true, hundredths: 250 };

function closes(statement: Statement | null): Statement {
  expect(statement).not.toBeNull();
  const checked = statement as Statement;
  let previous = checked.depotCents;
  for (const row of checked.rows) {
    expect(row.start, `start of ${String(row.year)}`).toBe(previous);
    const flows = FLOW_COLUMNS.reduce((sum, column) => sum + row.flows[column], 0);
    expect(row.start + flows, `end of ${String(row.year)}`).toBe(row.end);
    previous = row.end;
  }
  expect(previous).toBe(0);
  return checked;
}

describe('ledger (story 048, AC6: nothing else moves)', () => {
  it('AC6: the pins of main, tax and parking off, in both directions', () => {
    expect(payoutFromDepotCents(1_000_000, FUND_LIST, PHASE, OFF, FLAT_OFF)).toBeCloseTo(
      14936.989225972,
      6,
    );
    // The same model with the flat rate typed: tax off means no Vorabpauschale, so nothing moves.
    expect(payoutFromDepotCents(1_000_000, FUND_LIST, PHASE, OFF, FLAT_224)).toBeCloseTo(
      14936.989225972,
      6,
    );
    expect(depotFromPayoutCents(14936.989225972, FUND_LIST, PHASE, OFF, FLAT_OFF)).toBeCloseTo(
      1_000_000,
      4,
    );
  });

  it('AC3: the round trip depot to payout to depot closes within one cent in every state', () => {
    for (const state of [OFF, KST, KIST]) {
      for (const flat of [FLAT_OFF, FLAT_224]) {
        for (const park of [DEPOSIT_OFF, PARK_250]) {
          const payout = payoutFromDepotCents(30_000_000, FUND_LIST, PHASE, state, flat, park);
          const depot = depotFromPayoutCents(payout, FUND_LIST, PHASE, state, flat, park);
          expect(Math.abs(depot - 30_000_000)).toBeLessThan(0.01);
        }
      }
    }
  });
});

describe('ledger (story 048, AC3 and AC5: the statement)', () => {
  // Hand case with N = 1 phase year (first and last phase year are the same year): asOf 31.12.2028, one fund
  // 2029 with NAV 40,00 € and YTM 100 % over exactly 365 days (factor 2), phase 2030, 1.000,00 € a month, KapESt
  // only (26,375 %), no flat rate. Net per share 40 × (2 − 0,26375) = 69,45 €, so shares = 12.000 / 69,45 =
  // 172,786177; Einstand 6.911,45 €; proceeds 13.822,89 €; taxable gain 6.911,45 €; KapESt 25 % = 1.727,86 €,
  // Soli 5,5 % of that = 95,03 €; net 12.000,00 € = the payout of 2030.
  const HAND: Fund[] = [
    {
      year: 2029,
      isin: 'DE000HAND1',
      name: 'hand case',
      navMicroEur: 40_000_000,
      ytmBp: 10000,
      avgMaturityHundredths: 0,
      sharesOutstanding: 0,
    },
  ];
  const HAND_PHASE: Phase = { startMonth: '2030-01', endMonth: '2030-12' };

  it('AC3, AC5: the hand statement of one fund, one phase year, in cents', () => {
    const plan = buildPlan(
      HAND,
      HAND_PHASE,
      KST,
      FLAT_OFF,
      DEPOSIT_OFF,
      100_000,
      'payout',
      '2028-12-31',
    );
    expect(plan.depotCents).toBeCloseTo(691144.708, 3);
    const statement = closes(
      buildStatement(HAND, HAND_PHASE, KST, FLAT_OFF, DEPOSIT_OFF, plan, '2028-12-31'),
    );
    expect(statement.rows.map((row) => [row.year, row.start, row.end])).toEqual([
      [2028, 691145, 0],
      [2029, 0, 1_200_000],
      [2030, 1_200_000, 0],
    ]);
    const flows = (year: number) => statement.rows.find((row) => row.year === year)?.flows;
    expect(flows(2028)?.purchase).toBe(-691145);
    expect(flows(2029)?.proceeds).toBe(1_382_289);
    expect(flows(2029)?.kapESt).toBe(-172_786);
    expect(flows(2029)?.soli).toBe(-9_503);
    expect(flows(2030)?.payout).toBe(-1_200_000);
    // Without a flat rate, parking or KiSt, those columns have no amount and are not shown (AC3).
    expect(statement.columns).toEqual(['purchase', 'proceeds', 'kapESt', 'soli', 'payout']);
    // AC5: Depot - Kauf + Erlöse - alle Steuern + Zinsen - Auszahlungen = 0, each a column sum.
    expect(statement.check).toEqual({
      depot: 691145,
      purchase: 691145,
      proceeds: 1_382_289,
      taxes: 182_289,
      interest: 0,
      payout: 1_200_000,
    });
    expect(statement.reserveCents).toBe(0);
    // AC4: the way to the gain of that fund.
    expect(statement.funds[0]).toMatchObject({
      einstandCents: 691145,
      proceedsCents: 1_382_289,
      gainCents: 691_144,
      basesCents: 0,
      taxableGainCents: 691_144,
    });
  });

  it('AC3: the tax-free case shows the three columns of the money only', () => {
    const plan = buildPlan(FUND_LIST, PHASE, OFF, FLAT_224, DEPOSIT_OFF, 30_000_000, 'depot');
    const statement = closes(buildStatement(FUND_LIST, PHASE, OFF, FLAT_224, DEPOSIT_OFF, plan));
    expect(statement.columns).toEqual(['purchase', 'proceeds', 'payout']);
    expect(statement.rows[0]?.year).toBe(2026);
    expect(statement.rows[statement.rows.length - 1]?.year).toBe(2034);
  });

  it('AC3: the full case closes at 0,00 € in both directions, with every column', () => {
    for (const direction of ['depot', 'payout'] as const) {
      const plan = buildPlan(
        FUND_LIST,
        PHASE,
        KIST,
        FLAT_224,
        PARK_250,
        direction === 'depot' ? 30_000_000 : 400_000,
        direction,
      );
      const statement = closes(buildStatement(FUND_LIST, PHASE, KIST, FLAT_224, PARK_250, plan));
      expect(statement.columns).toEqual(FLOW_COLUMNS);
      const check = statement.check;
      expect(
        check.depot - check.purchase + check.proceeds - check.taxes + check.interest - check.payout,
      ).toBe(0);
      // The Vorabpauschale of year Y is paid in row Y + 1: nothing in the first row.
      expect(statement.rows[0]?.flows.flat).toBe(0);
      expect(statement.rows[1]?.flows.flat).toBeLessThan(0);
      // The depot is the Einstand of all funds plus a reserve above 0 that pays the Vorabpauschale.
      expect(statement.reserveCents).toBeGreaterThan(0);
    }
  });
});

describe('ledger (story 048, AC2: the Vorabpauschale is money of the whole holding)', () => {
  it('AC2: flat tax paid plus the tax at liquidation is the rate times the whole gain, so no base is taxed twice', () => {
    const plan = buildPlan(FUND_LIST, PHASE, KST, FLAT_224, DEPOSIT_OFF, 30_000_000, 'depot');
    const statement = closes(buildStatement(FUND_LIST, PHASE, KST, FLAT_224, DEPOSIT_OFF, plan));
    const flat = -statement.sums.flat;
    const liquidation = -(statement.sums.kapESt + statement.sums.soli + statement.sums.kist);
    expect(flat).toBeGreaterThan(0);
    const gain = statement.funds.reduce((sum, entry) => sum + (entry?.gainCents ?? 0), 0);
    // Hand: 26,375 % of the gain of the whole holding, up to one cent per rounded cell (nine cells).
    expect(Math.abs(flat + liquidation - gain * 0.26375)).toBeLessThan(10);
    // The same shares without a flat rate pay the whole tax at liquidation: the flat total is the part
    // of that tax that moved to the earlier years (here measured on the flat 0 statement of the same plan).
    const noFlat = buildStatement(FUND_LIST, PHASE, KST, FLAT_OFF, DEPOSIT_OFF, plan);
    const noFlatTax = -((noFlat?.sums.kapESt ?? 0) + (noFlat?.sums.soli ?? 0));
    expect(noFlatTax).toBeGreaterThan(liquidation);
  });

  it('AC2: the tax paid earlier needs a reserve, so the payout is a little lower, never higher (the old defect raised it)', () => {
    const off = payoutFromDepotCents(30_000_000, FUND_LIST, PHASE, KIST, FLAT_OFF);
    const on = payoutFromDepotCents(30_000_000, FUND_LIST, PHASE, KIST, FLAT_224);
    expect(on).toBeLessThan(off);
    expect(off - on).toBeLessThan(off * 0.005);
  });
});

describe('ledger (story 048, AC3: the closing at 0 is not forced by the last payout)', () => {
  it('AC3: the derived last payout equals months x the monthly payout, within the rounded cells', () => {
    // buildStatement derives the last payout from the residue, so "last end = 0" alone cannot fail. The
    // residue is what the rounded cells leave: here the derived payout is compared with the plain
    // months x monthly payout of its row. Measured max over the two directions: 1 cent (depot given) and 4 cents (payout
    // given, the depot is rounded once and the share counts differ by the unrounded depot); bound 5.
    const park: DepositOption = PARK_250;
    const plans = [
      buildPlan(FUND_LIST, PHASE, KIST, FLAT_224, park, 30_000_000, 'depot'),
      buildPlan(FUND_LIST, PHASE, KIST, FLAT_224, park, 400_000, 'payout'),
    ];
    for (const plan of plans) {
      const statement = closes(buildStatement(FUND_LIST, PHASE, KIST, FLAT_224, park, plan));
      const last = [...statement.rows].reverse().find((row) => row.flows.payout !== 0);
      expect(last).toBeDefined();
      const year = (last as { year: number }).year;
      const plain = -Math.round(plan.monthlyCents * monthsInYear(PHASE, year));
      const diff = Math.abs((last as { flows: { payout: number } }).flows.payout - plain);
      expect(diff).toBeLessThanOrEqual(5);
    }
  });
});

describe('ledger (story 049: the reserve earns interest)', () => {
  // One fund 2031 (NAV 40 EUR, YTM 100 %), bought in November 2028, flat rate 2,24 %, KapESt only, parking
  // 2,40 %, phase 2032. The Vorabpauschale of 2028 (two months), 2029 and 2030 is paid in January 2029, 2030
  // and 2031. The hand recursion below takes the shown reserve and payments as input and applies the story's
  // rule: interest = rate x balance after the January payment, credited at year end, net stays.
  const LONG: Fund[] = [
    {
      year: 2031,
      isin: 'DE000HAND2',
      name: 'reserve case',
      navMicroEur: 40_000_000,
      ytmBp: 10000,
      avgMaturityHundredths: 0,
      sharesOutstanding: 0,
    },
  ];
  const LONG_PHASE: Phase = { startMonth: '2032-01', endMonth: '2032-12' };
  const PARK_240: DepositOption = { on: true, hundredths: 240 };
  const AS_OF = '2028-11-30';

  function longStatement() {
    const plan = buildPlan(LONG, LONG_PHASE, KST, FLAT_224, PARK_240, 100_000, 'payout', AS_OF);
    return closes(buildStatement(LONG, LONG_PHASE, KST, FLAT_224, PARK_240, plan, AS_OF));
  }

  it('AC1: December only in the purchase year, then the balance after the January payment, net kept', () => {
    const statement = longStatement();
    const row = (year: number) => statement.rows.find((entry) => entry.year === year);
    let balance = statement.reserveCents;
    expect(balance).toBeGreaterThan(0);
    // Purchase in November: only December counts, 1 / 12 of a year (hand oracle 1.000 EUR -> 2,00 EUR).
    expect(Math.abs((row(2028)?.flows.interest ?? 0) - (balance * 0.024) / 12)).toBeLessThanOrEqual(
      1,
    );
    balance += (row(2028)?.flows.interest ?? 0) + (row(2028)?.flows.interestTax ?? 0);
    for (const year of [2029, 2030, 2031]) {
      balance += row(year)?.flows.flat ?? 0; // negative: paid on the first working day of January
      const interest = balance * 0.024;
      expect(
        Math.abs((row(year)?.flows.interest ?? 0) - interest),
        String(year),
      ).toBeLessThanOrEqual(3);
      // 2031: the last payment empties the reserve, so nothing is left to earn.
      if (year < 2031) expect(row(year)?.flows.interestTax ?? 0).toBeLessThan(0);
      balance += (row(year)?.flows.interest ?? 0) + (row(year)?.flows.interestTax ?? 0);
    }
    // The reserve is used up by the last payment, so it holds nothing at the end of 2031.
    expect(Math.abs(balance)).toBeLessThanOrEqual(5);
  });

  it('AC2: the payout is higher than with a reserve that earns nothing, by less than 0,5 %', () => {
    const plan = buildPlan(FUND_LIST, PHASE, KIST, FLAT_224, PARK_250, 400_000, 'payout');
    const statement = closes(buildStatement(FUND_LIST, PHASE, KIST, FLAT_224, PARK_250, plan));
    // A reserve that earns nothing would be the whole Vorabpauschale paid; the gain of the payout for the
    // same depot is (that reserve - the reserve held) / the depot held.
    const gain = (-statement.sums.flat - statement.reserveCents) / statement.depotCents;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(0.005);
  });
});
