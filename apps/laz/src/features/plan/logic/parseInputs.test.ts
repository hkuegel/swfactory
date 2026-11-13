import { describe, expect, it } from 'vitest';
import { OVERRIDE_SPECS, fieldSpec, type FieldId, type RawInputs } from './fields.ts';
import {
  isExactInUnit,
  parseField,
  parseInputs,
  parseMonth,
  parseMonthInput,
  toUnits,
  unitDigits,
} from './parseInputs.ts';

/** The example phase, so only the field under test can fail (T5: the parsing branches). Story 031 removed the rate field, so `BASE` has no rate. */
const BASE: RawInputs = {
  phaseStart: '1.1.2028',
  phaseEnd: '31.3.2034',
  amount: '10000,00',
};

function errorsOf(changes: Partial<RawInputs>) {
  const result = parseInputs({ ...BASE, ...changes });
  return result.ok ? {} : result.errors;
}

function errorOf(field: FieldId, text: string) {
  return errorsOf({ [field]: text })[field];
}

describe('parseInputs', () => {
  it('T5: the parsing branches — near misses, bounds, German dates, and the conditional rate', () => {
    // Number fields: near misses.
    for (const [text, kind] of [
      ['', 'empty'],
      ['  ', 'empty'],
      ['abc', 'format'],
      ['1e2', 'format'],
      ['0x1A', 'format'],
      ['Infinity', 'format'],
      ['NaN', 'format'],
      ['12abc', 'format'],
      ['1.234,56', 'format'],
      ['9,999', 'format'],
      ['+5', 'format'],
      ['5 5', 'format'],
      ['150 €', 'format'],
    ] as const) {
      expect(errorOf('amount', text)).toEqual({ kind });
    }

    // Typing states and the dot as decimal separator; `-0` stays 0 (never -0).
    for (const [text, cents] of [
      ['5,', 500],
      [',5', 50],
      ['9.99', 999],
      ['9,99', 999],
      ['-0', 0],
    ] as const) {
      expect(toUnits(text, 2)).toBe(cents);
      expect(Object.is(toUnits(text, 2), -0)).toBe(false);
    }
    // U+2212 reads as the minus sign, which the YTM override needs for a negative gain (risk 4).
    expect(toUnits('\u22122,5', 2)).toBe(-250);
    expect(parseField(OVERRIDE_SPECS.ytm, '\u22122,5')).toEqual({ ok: true, value: -250 });

    // Story 030, AC1: no maximum amount. The values 024 measured below its old cap keep working and
    // the values above it are accepted and used for the result. Hand values in cents: 250.000,00 € is
    // 25.000.000, 12.000,00 € per month is 1.200.000, 200.000,00 € is 20.000.000 — the same rule as
    // 9,99 € = 999 above, so the direction cannot change it.
    for (const [text, cents] of [
      ['0', 0],
      ['10000,00', 1000000],
      ['200000,00', 20000000],
      ['250000,00', 25000000],
      ['12000,00', 1200000],
    ] as const) {
      const result = parseInputs({ ...BASE, amount: text });
      if (!result.ok) throw new Error(`${text} must be accepted`);
      expect(result.inputs.amountCents).toBe(cents);
    }

    // AC2: the only upper limit left in a money field is what its unit holds exactly. Hand: the largest
    // whole cent is 9007199254740991, typed as 90.071.992.547.409,91 €; one unit above it is refused.
    // The check reads digits, so it sees the bound before the value becomes a Number that is no longer
    // exact — `Number('90071992547409.92') · 100` would already be off by one cent.
    expect(errorOf('amount', '90071992547409,91')).toBeUndefined();
    expect(errorOf('amount', '90071992547409,92')).toEqual({ kind: 'exact' });
    expect(unitDigits('90071992547409,92', 2)).toBe('9007199254740992');
    expect(isExactInUnit('9007199254740992')).toBe(false);
    // The sign is still its own rule.
    expect(errorOf('amount', '-0,01')).toEqual({ kind: 'range' });
    // Story 031: no field of the form has a percent bound of its own, because the rates come from the
    // checkboxes. The fund-row YTM cell keeps the range a percent means, -100 % to 100 %.
    for (const [inside, value, outside] of [
      ['0', 0, '-100,01'],
      ['100,00', 10000, '100,01'],
    ] as const) {
      expect(parseField(OVERRIDE_SPECS.ytm, inside)).toEqual({ ok: true, value });
      expect(parseField(OVERRIDE_SPECS.ytm, outside)).toEqual({
        ok: false,
        error: { kind: 'range' },
      });
    }

    // The NAV cell in micro-euro (story 025): the same rule in its own unit, 6 decimals.
    for (const [text, microEur] of [
      ['5,113521', 5113521],
      ['5,', 5000000],
      [',5', 500000],
      ['-0', 0],
      ['200000,000000', 200000000000],
    ] as const) {
      expect(toUnits(text, 6)).toBe(microEur);
    }
    expect(parseField(OVERRIDE_SPECS.nav, '5,1234567')).toEqual({
      ok: false,
      error: { kind: 'format' },
    });
    // The largest exact value in micro-euro is 9007199254740991, which in the field's own format is
    // 9.007.199.254,740991 €; one micro-euro above it is refused.
    expect(parseField(OVERRIDE_SPECS.nav, '9007199254,740991')).toEqual({
      ok: true,
      value: 9007199254740991,
    });
    expect(parseField(OVERRIDE_SPECS.nav, '9007199254,740992')).toEqual({
      ok: false,
      error: { kind: 'exact' },
    });
    expect(parseField(OVERRIDE_SPECS.nav, '-0,000001')).toEqual({
      ok: false,
      error: { kind: 'range' },
    });

    // endMonth before startMonth.
    expect(errorsOf({ phaseStart: '1.1.2034', phaseEnd: '31.12.2034' })).toEqual({});
    expect(errorsOf({ phaseStart: '1.1.2034', phaseEnd: '31.12.2033' })).toEqual({
      phaseEnd: { kind: 'endBeforeStart', start: '2034-01' },
    });

    // German dates as real branches: accepted as whole months, rejected only as a format error.
    // Story 033, AC1: the phase fields have no range, so a month outside the range 024 had is a value.
    // Hand month keys (year · 12 + month): 2028·12+1 = 24337, 2034·12+3 = 24411, 2027·12+1 = 24325,
    // 2034·12+12 = 24420, 2026·12+1 = 24313, 2035·12+1 = 24421.
    for (const [text, month, key] of [
      ['1.1.2028', '2028-01', 24337],
      ['01.01.2028', '2028-01', 24337],
      [' 31.3.2034 ', '2034-03', 24411],
      ['29.2.2028', '2028-02', 24338],
      ['1.1.2027', '2027-01', 24325],
      ['31.12.2034', '2034-12', 24420],
      // AC1: the years outside 024's range are values, not errors.
      ['1.1.2026', '2026-01', 24313],
      ['1.1.2035', '2035-01', 24421],
      // AC2: the short form is the same value as the long form.
      ['01.2028', '2028-01', 24337],
      ['3.2034', '2034-03', 24411],
    ] as const) {
      expect(parseMonth(text)).toBe(month);
      expect(parseField(fieldSpec('phaseStart'), text)).toEqual({ ok: true, value: key });
    }

    // AC2: an incomplete entry is a typing state. It names no error and gives no value, so the field is
    // not marked and nothing is calculated. Hand states: only a month, only a year, a month with a
    // trailing separator, a year that is not four digits yet.
    for (const text of ['1', '2028', '1.', '1.2', '1.2.', '01.20', '20']) {
      expect(parseMonthInput(text)).toEqual({ state: 'partial' });
      expect(parseField(fieldSpec('phaseStart'), text)).toEqual({ ok: false, error: null });
      expect(errorOf('phaseStart', text)).toBeUndefined();
    }

    // A complete input that is not a real month is still a format error; the day rule stays.
    for (const text of ['31.13.2028', '29.2.2027', '13.2028', '1.0.2028', 'abc.2028']) {
      expect(parseField(fieldSpec('phaseEnd'), text)).toEqual({
        ok: false,
        error: { kind: 'format' },
      });
    }

    // Story 031: there is no rate to parse any more, so the conditional-required branch is gone; the
    // rates come from `taxFromState`, which has no error state because a checkbox cannot hold an
    // invalid value. The amount field is required.
    const ok = parseInputs(BASE);
    if (!ok.ok) throw new Error('the base inputs should parse');
    expect(ok.inputs.amountCents).toBe(1000000);
    expect(errorsOf({ amount: '' })).toEqual({ amount: { kind: 'empty' } });
  });
});
