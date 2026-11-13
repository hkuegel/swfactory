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

const DECIMAL = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PLAIN = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

/**
 * The text a fund-row cell shows when the user has typed nothing: the value from the data file, so
 * the cell round-trips through the same parser (`3800` → `38,00`, `250` → `2,5`).
 */
export function fundValueText(fund: Fund, field: 'nav' | 'ytm'): string {
  return field === 'nav' ? DECIMAL.format(fund.navCents / 100) : PLAIN.format(fund.ytmBp / 100);
}
