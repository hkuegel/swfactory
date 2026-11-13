import { describe, expect, it } from 'vitest';
import { OVERRIDE_SPECS, fieldSpec, monthKey, type FieldId, type RawInputs } from './fields.ts';
import {
  isExactInUnit,
  parseField,
  parseInputs,
  parseMonth,
  toUnits,
  unitDigits,
} from './parseInputs.ts';

/** The example phase, so only the field under test can fail (T5: the parsing branches). */
const BASE: RawInputs = {
  phaseStart: '1.1.2028',
  phaseEnd: '31.3.2034',
  amount: '10000,00',
  taxRate: '25',
};

function errorsOf(changes: Partial<RawInputs>, taxOn = true) {
  const result = parseInputs({ ...BASE, ...changes }, taxOn);
  return result.ok ? {} : result.errors;
}

function errorOf(field: FieldId, text: string, taxOn = true) {
  return errorsOf({ [field]: text }, taxOn)[field];
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
      expect(errorOf('taxRate', text)).toEqual({ kind });
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
      const result = parseInputs({ ...BASE, amount: text }, false);
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
    // The tax rate keeps the bound that belongs to what a percent means (0 – 50 %, until 031 replaces
    // the field with the statutory rates); its unit is a basis point.
    for (const [inside, outside] of [
      ['0', '-0,01'],
      ['50,00', '50,01'],
    ] as const) {
      expect(errorOf('taxRate', inside)).toBeUndefined();
      expect(errorOf('taxRate', outside)).toEqual({ kind: 'range' });
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

    // German dates as real branches: accepted as whole months, rejected as format or range.
    for (const [text, month, key] of [
      ['1.1.2028', '2028-01', monthKey(2028, 1)],
      ['01.01.2028', '2028-01', monthKey(2028, 1)],
      [' 31.3.2034 ', '2034-03', monthKey(2034, 3)],
      ['29.2.2028', '2028-02', monthKey(2028, 2)],
      ['1.1.2027', '2027-01', monthKey(2027, 1)],
      ['31.12.2034', '2034-12', monthKey(2034, 12)],
    ] as const) {
      expect(parseMonth(text)).toBe(month);
      expect(parseField(fieldSpec('phaseStart'), text)).toEqual({ ok: true, value: key });
    }
    for (const [text, kind] of [
      ['31.13.2028', 'format'],
      ['29.2.2027', 'format'],
      ['31.12.2026', 'range'],
      ['1.1.2026', 'range'],
      ['1.1.2035', 'range'],
    ] as const) {
      expect(parseField(fieldSpec('phaseEnd'), text)).toEqual({
        ok: false,
        error: { kind },
      });
    }

    // The conditional-required branch: the rate is read only while the checkbox is checked.
    const off = parseInputs({ ...BASE, taxRate: 'abc' }, false);
    if (!off.ok) throw new Error('the rate should not be read while tax is off');
    expect(off.inputs.taxRateBp).toBe(0);
    expect(errorsOf({ taxRate: 'abc' }, false)).toEqual({});
    expect(errorOf('taxRate', 'abc')).toEqual({ kind: 'format' });
    expect(errorOf('taxRate', '')).toEqual({ kind: 'empty' });

    // The amount field is required in both directions.
    expect(errorsOf({ amount: '' })).toEqual({ amount: { kind: 'empty' } });
    expect(errorsOf({ amount: '' }, false)).toEqual({ amount: { kind: 'empty' } });
  });
});
