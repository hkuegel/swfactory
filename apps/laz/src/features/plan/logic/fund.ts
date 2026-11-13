import fundListJson from '../data/fund-list.json';

/** One fund per maturity year, as committed in the data file (ADR 0013). */
export interface Fund {
  /** maturity year, the fund list key: 2028..2034 */
  readonly year: number;
  readonly isin: string;
  readonly name: string;
  /** NAV in micro-euro (1 = 0,000001 EUR): the source's own precision, so the file never rounds (ADR 0013 as amended by 025) */
  readonly navMicroEur: number;
  /** weighted average YTM, basis points (1 % = 100) */
  readonly ytmBp: number;
  /** hundredths of a year as the source publishes it; display only, not read by the calculation (ADR 0012: the horizon is the liquidation date) */
  readonly avgMaturityHundredths: number;
  /** integer, display only */
  readonly sharesOutstanding: number;
}

/**
 * Shape of `data/fund-list.json` (ADR 0013): `asOf` is one value for the whole file, stamped by the
 * writer script per refresh run, so it belongs to the file and not to a fund. A malformed file is a
 * build failure, not a runtime check.
 */
export interface FundList {
  /** ISO calendar date YYYY-MM-DD; the UI renders it as TT.MM.JJJJ (AC5). */
  readonly asOf: string;
  readonly funds: readonly Fund[];
}

/** The fixed fund list, read as a build-time import and never fetched (AC6, ADR 0013). */
const FUND_LIST_FILE: FundList = fundListJson;

export const FUND_LIST: readonly Fund[] = FUND_LIST_FILE.funds;

/** The single asOf of the file, the date the projection label shows (AC5). */
export const FUND_LIST_AS_OF: string = FUND_LIST_FILE.asOf;

/** 31 December of the fund's maturity year: the projection horizon (ADR 0012), ISO `YYYY-MM-DD`. */
export function liquidationDate(fund: Fund): string {
  return `${String(fund.year)}-12-31`;
}

/** A fund row typed in the UI, in the units of the calculation; an empty cell is no override. */
export interface FundOverride {
  navMicroEur?: number;
  ytmBp?: number;
}

/** The fund as the calculation uses it: the typed value where there is one, else the file value. */
export function effectiveFund(fund: Fund, override: FundOverride): Fund {
  return {
    ...fund,
    navMicroEur: override.navMicroEur ?? fund.navMicroEur,
    ytmBp: override.ytmBp ?? fund.ytmBp,
  };
}
