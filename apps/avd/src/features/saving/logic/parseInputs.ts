import { FIELD_IDS, FIELD_SPECS, type FieldId, type RawInputs } from './fields.ts';

export interface Inputs {
  readonly age: number;
  readonly payoutAge: number;
  readonly monthlyCents: number;
  readonly children: number;
  readonly returnBp: number;
  readonly costsBp: number;
  /** Combined marginal tax rate (story 014), 0..5000, 1 % = 100. */
  readonly taxRateBp: number;
  /** Combined retirement tax rate (story 016), 0..5000, 1 % = 100. Read only by compare.ts. */
  readonly retirementRateBp: number;
}

export type FieldError =
  | { readonly kind: 'empty' }
  /** Not a number, too many decimals, decimals in a whole field. */
  | { readonly kind: 'format' }
  /** Outside FIELD_SPECS[field]. */
  | { readonly kind: 'range' }
  /** payoutAge only: not after the age. */
  | { readonly kind: 'notAfterAge'; readonly age: number };

export type FieldErrors = Readonly<Partial<Record<FieldId, FieldError>>>;

export type ParseResult =
  | { readonly ok: true; readonly inputs: Inputs }
  | { readonly ok: false; readonly errors: FieldErrors };

const WHOLE = /^-?\d+$/;
// Comma is the decimal separator, a dot is accepted too; no grouping; `5,` and `,5` are typing
// states and valid.
const DECIMAL = /^-?(\d+([.,]\d{0,2})?|[.,]\d{1,2})$/;

type FieldResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: FieldError };

/**
 * Text already matched by WHOLE or DECIMAL → integer in the field's unit, by string arithmetic
 * (`"9,99"` → 999), never `parseFloat · 100`. `-0` gives 0.
 */
function toUnits(text: string, decimals: 0 | 2): number {
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole = '', fraction = ''] = unsigned.split(/[.,]/);
  const scale = decimals === 2 ? 100 : 1;
  const magnitude =
    Number(whole === '' ? '0' : whole) * scale +
    (decimals === 2 ? Number(fraction.padEnd(2, '0')) : 0);
  return negative && magnitude !== 0 ? -magnitude : magnitude;
}

function parseField(field: FieldId, raw: string): FieldResult {
  const spec = FIELD_SPECS[field];
  const text = raw.trim().replace(/−/g, '-');
  if (text === '') return { ok: false, error: { kind: 'empty' } };
  if (!(spec.decimals === 0 ? WHOLE : DECIMAL).test(text)) {
    return { ok: false, error: { kind: 'format' } };
  }
  const value = toUnits(text, spec.decimals);
  if (value < spec.min || value > spec.max) return { ok: false, error: { kind: 'range' } };
  return { ok: true, value };
}

/** Raw field texts → integer inputs, or one error per invalid field (incl. the cross-field check). */
export function parseInputs(raw: RawInputs): ParseResult {
  const errors: Partial<Record<FieldId, FieldError>> = {};
  const values: Partial<Record<FieldId, number>> = {};
  for (const field of FIELD_IDS) {
    const result = parseField(field, raw[field]);
    if (result.ok) values[field] = result.value;
    else errors[field] = result.error;
  }
  const { age, payoutAge, monthly, children, returnPct, costsPct, taxRatePct, retirementRatePct } =
    values;
  if (age !== undefined && payoutAge !== undefined && payoutAge <= age) {
    errors.payoutAge = { kind: 'notAfterAge', age };
  }
  if (
    age === undefined ||
    payoutAge === undefined ||
    monthly === undefined ||
    children === undefined ||
    returnPct === undefined ||
    costsPct === undefined ||
    taxRatePct === undefined ||
    retirementRatePct === undefined ||
    errors.payoutAge !== undefined
  ) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    inputs: {
      age,
      payoutAge,
      monthlyCents: monthly,
      children,
      returnBp: returnPct,
      costsBp: costsPct,
      taxRateBp: taxRatePct,
      retirementRateBp: retirementRatePct,
    },
  };
}
