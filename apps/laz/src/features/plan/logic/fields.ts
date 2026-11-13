/** The fields of the form, in the order of the form (UX design §1). */
export type FieldId = 'phaseStart' | 'phaseEnd' | 'amount' | 'taxRate';

/** Which way the app calculates; decides the label and the range of the amount field. */
export type Direction = 'depot' | 'payout';

/** The raw text of every field, exactly as typed. */
export type RawInputs = Readonly<Record<FieldId, string>>;

/**
 * The largest whole number a `Number` holds exactly: 2^53 − 1. A money field has no maximum of its
 * own (story 030); its only limit is that its value must be an exact integer in its unit, so this
 * bound is read as digits, never as a Number.
 */
export const MAX_EXACT_UNITS = '9007199254740991';

export interface FieldSpec {
  /** Micro-euro for the NAV cell, basis points for the rate (1 % = 100), `year * 12 + month` for a phase, cents for the amounts. `null` for a phase field: a month has no bound of its own (story 033). */
  readonly min: number | null;
  /** `null` for a money field: the value is only limited by what is exact in its unit (story 030), and for a phase field, which has no range (story 033). A percent field keeps a bound that belongs to what the value means. */
  readonly max: number | null;
  /** 0: whole numbers only; 2: up to two decimals; 6: up to six, the NAV cell's unit (story 025). Not used by the date fields. */
  readonly decimals: 0 | 2 | 6;
  /** A `MM.JJJJ` date field (story 033: a day may still be typed); its value is a whole calendar month. */
  readonly date: boolean;
}

/** Form order; also the order in which the first invalid field is named. */
export const FIELD_IDS: readonly FieldId[] = ['phaseStart', 'phaseEnd', 'amount', 'taxRate'];

/** A whole calendar month as `year * 12 + month`, which is how the phase ranges compare. */
export function monthKey(year: number, month: number): number {
  return year * 12 + month;
}

export function monthParts(key: number): { year: number; month: number } {
  const month = ((key - 1) % 12) + 1;
  return { year: (key - month) / 12, month };
}

/** A month key → the `YYYY-MM` name the parser normalises phase dates to. */
export function monthName(key: number): string {
  const { year, month } = monthParts(key);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** A `YYYY-MM` month name → its key, the shape the phase ranges compare against. */
export function monthKeyOf(name: string): number {
  return monthKey(Number(name.slice(0, 4)), Number(name.slice(5, 7)));
}

/**
 * The rules the copy quotes. Money fields have no maximum, only the decimals of their unit and the
 * exact-integer bound of that unit (story 030); the tax rate keeps 0 – 50 % until story 031 replaces it
 * with the statutory rates; a phase month has no range (story 033): the 1.1.2027 – 31.12.2034 bound 024
 * had was not a business rule, because a phase year the fund list cannot fund is already reported as a
 * missing year (024 AC2). The amount field exists once, with the rule of the chosen direction.
 */
export function fieldSpec(field: FieldId): FieldSpec {
  if (field === 'amount') {
    return { min: 0, max: null, decimals: 2, date: false };
  }
  if (field === 'taxRate') return { min: 0, max: 5000, decimals: 2, date: false };
  return { min: null, max: null, decimals: 0, date: true };
}
/**
 * The two input cells of a fund row (UX design §2). The YTM cell allows negative values because the
 * override path can make the gain negative (risk 4), which `max(0, gain)` then keeps untaxed.
 */
export type OverrideField = 'nav' | 'ytm';

export const OVERRIDE_SPECS: Readonly<Record<OverrideField, FieldSpec>> = {
  // Story 030: the NAV cell has no amount cap; the value must be an exact integer in micro-euro, the
  // unit story 025 gave it.
  nav: { min: 0, max: null, decimals: 6, date: false },
  ytm: { min: -10000, max: 10000, decimals: 2, date: false },
};
