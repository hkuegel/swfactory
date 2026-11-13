/**
 * Raw field texts → integer cents, basis points and whole phase months (ADR 0012, Technical
 * design). One error per invalid field; the rate is parsed only while the tax checkbox is checked.
 */

import {
  FIELD_IDS,
  fieldSpec,
  monthKeyOf,
  monthName,
  type Direction,
  type FieldId,
  type FieldSpec,
  type RawInputs,
} from './fields.ts';

export interface ParsedInputs {
  /** Whole calendar month as `YYYY-MM`, normalised from `TT.MM.JJJJ`. */
  readonly phaseStart: string;
  readonly phaseEnd: string;
  /** Cents, in the unit of the chosen direction. */
  readonly amountCents: number;
  /** 0 while the tax checkbox is unchecked, because the field is not read then. */
  readonly taxRateBp: number;
}

export type FieldError =
  | { readonly kind: 'empty' }
  /** Not a number, too many decimals, or a date that is not a real date. */
  | { readonly kind: 'format' }
  /** Outside the spec of the field. */
  | { readonly kind: 'range' }
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
/** `TT.MM.JJJJ`, as UX types the phase (not `type="date"`, which is browser-locale dependent). */
const DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * Text already matched by WHOLE or DECIMAL → integer in the field's unit, by string arithmetic
 * (`"9,99"` → 999, `"5,113521"` → 5113521), never `parseFloat · 100`. `-0` gives 0.
 */
export function toUnits(text: string, decimals: 0 | 2 | 6): number {
  // U+2212 (typed minus) reads as the minus sign, as avd's parser does.
  const normalized = text.replace(/−/g, '-');
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = '', fraction = ''] = unsigned.split(/[.,]/);
  const scale = decimals === 0 ? 1 : decimals === 2 ? 100 : 1_000_000;
  const magnitude =
    Number(whole === '' ? '0' : whole) * scale +
    (decimals === 0 ? 0 : Number(fraction.padEnd(decimals, '0')));
  return negative && magnitude !== 0 ? -magnitude : magnitude;
}

/** A real calendar date, normalised to its whole month `YYYY-MM`. */
export function parseMonth(raw: string): string | null {
  const match = DATE.exec(raw.trim().replace(/−/g, '-'));
  if (match === null) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (month < 1 || month > 12) return null;
  // The day must be a real day of that month, so 31.13.2028 and 29.2.2027 are format errors and
  // 29.2.2028 is valid. Date.UTC parts only (risk 2).
  const parts = new Date(Date.UTC(year, month - 1, day));
  if (
    parts.getUTCFullYear() !== year ||
    parts.getUTCMonth() !== month - 1 ||
    parts.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

export type FieldResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: FieldError };

const PATTERN: Readonly<Record<0 | 2 | 6, RegExp>> = { 0: WHOLE, 2: DECIMAL, 6: DECIMAL_6 };

/** One field against its spec; `parseInputs` and the fund-row overrides share this. */
export function parseField(spec: FieldSpec, raw: string): FieldResult {
  const text = raw.trim().replace(/−/g, '-');
  if (text === '') return { ok: false, error: { kind: 'empty' } };
  if (spec.date) {
    const month = parseMonth(text);
    if (month === null) return { ok: false, error: { kind: 'format' } };
    const key = monthKeyOf(month);
    if (key < spec.min || key > spec.max) return { ok: false, error: { kind: 'range' } };
    return { ok: true, value: key };
  }
  if (!PATTERN[spec.decimals].test(text)) {
    return { ok: false, error: { kind: 'format' } };
  }
  const value = toUnits(text, spec.decimals);
  if (value < spec.min || value > spec.max) return { ok: false, error: { kind: 'range' } };
  return { ok: true, value };
}

/**
 * The phase fields, the amount field of the chosen direction and the rate. The rate is required
 * and parsed only while `taxOn` is true; otherwise it produces no error and `taxRateBp` is 0.
 */
export function parseInputs(raw: RawInputs, direction: Direction, taxOn: boolean): ParseResult {
  const errors: Partial<Record<FieldId, FieldError>> = {};
  const values: Partial<Record<FieldId, number>> = {};
  for (const field of FIELD_IDS) {
    if (field === 'taxRate' && !taxOn) continue;
    const result = parseField(fieldSpec(field, direction), raw[field]);
    if (result.ok) values[field] = result.value;
    else errors[field] = result.error;
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
