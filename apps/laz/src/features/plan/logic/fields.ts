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
  /** Micro-euro for the NAV cell, basis points for the rate (1 % = 100), `year * 12 + month` for a phase, cents for the amounts. */
  readonly min: number;
  /** `null` for a money field: the value is only limited by what is exact in its unit (story 030). A percent field and a date field keep a bound that belongs to what the value means. */
  readonly max: number | null;
  /** 0: whole numbers only; 2: up to two decimals; 6: up to six, the NAV cell's unit (story 025). Not used by the date fields. */
  readonly decimals: 0 | 2 | 6;
  /** A `TT.MM.JJJJ` date field; its value is a whole calendar month. */
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

/** Phase range (Technical design): 1.1.2027 – 31.12.2034, whole months. */
export const PHASE_MIN = monthKey(2027, 1);
export const PHASE_MAX = monthKey(2034, 12);

/**
 * The rules the copy quotes (story 030): the money fields have no maximum, only the decimals of their
 * unit and the exact-integer bound of that unit; the tax rate keeps 0 – 50 % until story 031 replaces
 * it with the statutory rates; phase months 1.1.2027 – 31.12.2034 until story 033 drops the range. The
 * amount field exists once, with the rule of the chosen direction, and the YTM override may be
 * negative so a gain can be negative.
 */
export function fieldSpec(field: FieldId): FieldSpec {
  if (field === 'amount') {
    return { min: 0, max: null, decimals: 2, date: false };
  }
  if (field === 'taxRate') return { min: 0, max: 5000, decimals: 2, date: false };
  return { min: PHASE_MIN, max: PHASE_MAX, decimals: 0, date: true };
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
