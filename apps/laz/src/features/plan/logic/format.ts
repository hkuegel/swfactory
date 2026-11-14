// The only money, date and month formatting of the app (ADR 0012, UX §2): German format, `€`
// after a no-break space, dates as `TT.MM.JJJJ`, phase months as their month name (no day, so no
// day is invented for a month the user entered). Values are unrounded until here, so this is where
// the single rounding happens.
import type { Fund } from './fund.ts';
const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const MONTH_NAME = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

/** `18141` → `181,41 €`. */
export function formatEuro(cents: number): string {
  return EURO.format(cents / 100);
}

/**
 * A micro-euro value from the data file or the projection as `46,80 €`: the single rounding of this
 * story's unit, and the only place a micro-euro value is rounded (ADR 0012).
 */
export function formatEuroMicroEur(microEur: number): string {
  return EURO.format(microEur / 1_000_000);
}

/**
 * A `YYYY-MM-DD` from the data file as `31.12.2026`, from its parts only, never from a hand-typed
 * string (risk 2), so AC5's "the shown asOf equals the data file's asOf" holds.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year)}`;
}

/**
 * A whole phase month `YYYY-MM` as its German month name and year, `Januar 2028`, with no day: the
 * phase model stores a month, so a day would have to be invented (review round 1, finding 3), which
 * showed `01.03.2034` for a phase that ends `31.03.2034`.
 */
export function formatMonth(isoMonth: string): string {
  const [year = 0, month = 1] = isoMonth.split('-').map(Number);
  // Date.UTC parts only (risk 2).
  return MONTH_NAME.format(new Date(Date.UTC(year, month - 1, 1)));
}

const PLAIN = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
/** Shares are shown with two decimals (story 032): the model's number is not a whole share. */
const SHARES = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Shares as the fund table shows them (story 032 AC1): `55,06`. Shares are not money, so the money rule
 * of the last part does not apply to this column.
 */
export function formatShares(shares: number): string {
  return SHARES.format(shares);
}
/** Micro-euro shows the decimals it has, up to 6, so the cell text round-trips through the same parser. */
const MICRO = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 6 });

/**
 * The text a fund-row cell shows when the user has typed nothing: the value from the data file, so
 * the cell round-trips through the same parser (`3800` → `38,00`, `250` → `2,5`, `5113521` →
 * `5,113521`). The NAV cell shows up to 6 decimals because its unit is micro-euro (story 025); the
 * YTM cell keeps its 2-decimal rule.
 */
export function fundValueText(fund: Fund, field: 'nav' | 'ytm'): string {
  return field === 'nav'
    ? MICRO.format(fund.navMicroEur / 1_000_000)
    : PLAIN.format(fund.ytmBp / 100);
}
