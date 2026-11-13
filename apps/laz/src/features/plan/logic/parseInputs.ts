/**
 * Raw field texts → integer cents, basis points and whole phase months (ADR 0012, Technical
 * design). One error per invalid field; the rate is parsed only while the tax checkbox is checked.
 */

import {
  FIELD_IDS,
  MAX_EXACT_UNITS,
  fieldSpec,
  monthKey,
  monthName,
  type FieldId,
  type FieldSpec,
  type RawInputs,
} from './fields.ts';

export interface ParsedInputs {
  /** Whole calendar month as `YYYY-MM`, normalised from `MM.JJJJ`. */
  readonly phaseStart: string;
  readonly phaseEnd: string;
  /** Cents, in the unit of the chosen direction. */
  readonly amountCents: number;
  /** 0 while the tax checkbox is unchecked, because the field is not read then. */
  readonly taxRateBp: number;
}

export type FieldError =
  | { readonly kind: 'empty' }
  /** Not a number, too many decimals, or a complete date that is not a real date. */
  | { readonly kind: 'format' }
  /** Outside the spec of the field; a phase field has no spec range (story 033), so this is a number field's reason. */
  | { readonly kind: 'range' }
  /** Story 030: the value is not an exact whole unit (cents, micro-euro), so it cannot be used. */
  | { readonly kind: 'exact' }
  /** `phaseEnd` only: before the start. */
  | { readonly kind: 'endBeforeStart'; readonly start: string };

export type FieldErrors = Readonly<Partial<Record<FieldId, FieldError>>>;

export type ParseResult =
  | { readonly ok: true; readonly inputs: ParsedInputs }
  | { readonly ok: false; readonly errors: FieldErrors };

const WHOLE = /^-?\d+$/;
// Comma is the decimal separator, a dot is accepted too; no grouping; `5,` and `,5` are typing
// states and valid. The number of decimals is the field's unit, so the NAV cell takes up to 6
// (story 025) and the other numeric fields keep 2.
const DECIMAL_DECIMALS = (decimals: number): RegExp =>
  new RegExp(`^-?(\\d+([.,]\\d{0,${decimals}})?|[.,]\\d{1,${decimals}})$`);
const DECIMAL = DECIMAL_DECIMALS(2);
const DECIMAL_6 = DECIMAL_DECIMALS(6);
const DIGITS = /^\d+$/;

/**
 * Text already matched by WHOLE or DECIMAL → its magnitude in the field's unit as digits, exact, so a
 * value above the exact-integer bound is seen before it becomes a `Number` (story 030, AC2). `"9,99"`
 * with 2 decimals is `999`, `"5,113521"` with 6 is `5113521`; a leading zero of the digits is dropped.
 */
export function unitDigits(text: string, decimals: 0 | 2 | 6): string {
  // U+2212 (typed minus) reads as the minus sign, as avd's parser does.
  const unsigned = text.replace(/−/g, '-').replace(/^-/, '');
  const [whole = '', fraction = ''] = unsigned.split(/[.,]/);
  const digits = whole + (decimals === 0 ? '' : fraction.padEnd(decimals, '0'));
  return digits.replace(/^0+/, '') || '0';
}

/** The digits are within what a `Number` holds exactly (2^53 − 1 in the field's unit). */
export function isExactInUnit(digits: string): boolean {
  return (
    digits.length < MAX_EXACT_UNITS.length ||
    (digits.length === MAX_EXACT_UNITS.length && digits <= MAX_EXACT_UNITS)
  );
}

/** A field's magnitude read as digits → integer in the field's unit, never `parseFloat · 100`. `-0` gives 0. */
export function toUnits(text: string, decimals: 0 | 2 | 6): number {
  const negative = text.replace(/−/g, '-').startsWith('-');
  const magnitude = Number(unitDigits(text, decimals));
  return negative && magnitude !== 0 ? -magnitude : magnitude;
}

/** Days of a month, index 0 = January; February reads the leap rule, so no calendar object is needed and a year like `0004` is not read as 1904 (risk 2). */
function daysInMonth(year: number, month: number): number {
  const common = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month !== 2) return common[month - 1] ?? 0;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
}

/**
 * The three states of a phase field (story 033, AC2). `MM.JJJJ` is the accepted short form and
 * `TT.MM.JJJJ` the long one; UX types the phase as text, not `type="month"`, which is browser-locale
 * dependent and gives an empty value for a partial entry. An entry that is not complete yet (`01`,
 * `2028`, `01.`) is a typing state and names no error: only a complete input can be invalid.
 */
export type MonthInput =
  | { readonly state: 'partial' }
  | { readonly state: 'invalid' }
  | { readonly state: 'month'; readonly key: number };

export function parseMonthInput(raw: string): MonthInput {
  const text = raw.trim().replace(/−/g, '-');
  const parts = text.split('.');
  // A missing part can only come from typing, so the entry is not complete and nothing is refused.
  if (parts.some((part) => part === '')) return { state: 'partial' };
  if (parts.some((part) => !DIGITS.test(part))) return { state: 'invalid' };
  if (parts.length > 3) return { state: 'invalid' };
  const yearText = parts[parts.length - 1] ?? '';
  if (yearText.length !== 4) return { state: 'partial' }; // the year is still being typed
  if (parts.length === 1) return { state: 'partial' }; // only a year: the month is missing
  const year = Number(yearText);
  const monthText = parts.length === 2 ? (parts[0] ?? '') : (parts[1] ?? '');
  if (monthText.length > 2) return { state: 'invalid' };
  const month = Number(monthText);
  if (month < 1 || month > 12) return { state: 'invalid' };
  if (parts.length === 3) {
    const dayText = parts[0] ?? '';
    if (dayText.length > 2) return { state: 'invalid' };
    // A typed day must be a real day of that month, so 31.13.2028 and 29.2.2027 are invalid and
    // 29.2.2028 is valid.
    const day = Number(dayText);
    if (day < 1 || day > daysInMonth(year, month)) return { state: 'invalid' };
  }
  return { state: 'month', key: monthKey(year, month) };
}

/** A complete, valid month input → its whole month `YYYY-MM`; a partial or invalid entry gives null. */
export function parseMonth(raw: string): string | null {
  const parsed = parseMonthInput(raw);
  return parsed.state === 'month' ? monthName(parsed.key) : null;
}

export type FieldResult =
  | { readonly ok: true; readonly value: number }
  /** Story 033, AC2: a typing state names no error, so `error` is null for it. */
  | { readonly ok: false; readonly error: null }
  | { readonly ok: false; readonly error: FieldError };

const PATTERN: Readonly<Record<0 | 2 | 6, RegExp>> = { 0: WHOLE, 2: DECIMAL, 6: DECIMAL_6 };

/** One field against its spec; `parseInputs` and the fund-row overrides share this. */
export function parseField(spec: FieldSpec, raw: string): FieldResult {
  const text = raw.trim().replace(/−/g, '-');
  if (text === '') return { ok: false, error: { kind: 'empty' } };
  if (spec.date) {
    const month = parseMonthInput(text);
    if (month.state === 'partial') return { ok: false, error: null };
    if (month.state === 'invalid') return { ok: false, error: { kind: 'format' } };
    // Story 033, AC1: no range, so a complete month is always a value. `phaseEnd` before `phaseStart`
    // is the only phase rule left, and `parseInputs` checks it.
    return { ok: true, value: month.key };
  }
  if (!PATTERN[spec.decimals].test(text)) {
    return { ok: false, error: { kind: 'format' } };
  }
  // Story 030, AC2: the magnitude is compared as digits, so a value above the exact-integer bound of
  // its unit is refused before it becomes a Number that is no longer exact.
  if (!isExactInUnit(unitDigits(text, spec.decimals))) {
    return { ok: false, error: { kind: 'exact' } };
  }
  const value = toUnits(text, spec.decimals);
  if ((spec.min !== null && value < spec.min) || (spec.max !== null && value > spec.max)) {
    return { ok: false, error: { kind: 'range' } };
  }
  return { ok: true, value };
}

/**
 * The phase fields, the amount field and the rate. The rate is required and parsed only while `taxOn`
 * is true; otherwise it produces no error and `taxRateBp` is 0. The amount field has no maximum
 * (story 030) and the phase fields have no range (story 033); a phase field that is not complete yet
 * names no error, so it appears in neither the values nor the errors.
 */
export function parseInputs(raw: RawInputs, taxOn: boolean): ParseResult {
  const errors: Partial<Record<FieldId, FieldError>> = {};
  const values: Partial<Record<FieldId, number>> = {};
  for (const field of FIELD_IDS) {
    if (field === 'taxRate' && !taxOn) continue;
    const result = parseField(fieldSpec(field), raw[field]);
    if (result.ok) values[field] = result.value;
    else if (result.error !== null) errors[field] = result.error;
  }

  const phaseStart = values.phaseStart;
  const phaseEnd = values.phaseEnd;
  const amount = values.amount;
  const taxRate = values.taxRate;

  if (phaseStart !== undefined && phaseEnd !== undefined && phaseEnd < phaseStart) {
    errors.phaseEnd = { kind: 'endBeforeStart', start: monthName(phaseStart) };
  }

  // One error per invalid field: nothing is calculated while a field is invalid (UX design §3),
  // and the rate counts as an error only while the checkbox is checked.
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  if (phaseStart === undefined || phaseEnd === undefined || amount === undefined) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    inputs: {
      phaseStart: monthName(phaseStart),
      phaseEnd: monthName(phaseEnd),
      amountCents: amount,
      taxRateBp: taxOn ? (taxRate ?? 0) : 0,
    },
  };
}
