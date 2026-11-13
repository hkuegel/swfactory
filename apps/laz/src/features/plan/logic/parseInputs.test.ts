import { describe, expect, it } from 'vitest';
import {
  OVERRIDE_SPECS,
  fieldSpec,
  monthKey,
  type Direction,
  type FieldId,
  type RawInputs,
} from './fields.ts';
import { parseField, parseInputs, parseMonth, toUnits } from './parseInputs.ts';

/** The example phase, so only the field under test can fail (T5: the parsing branches). */
const BASE: RawInputs = {
  phaseStart: '1.1.2028',
  phaseEnd: '31.3.2034',
  amount: '10000,00',
  taxRate: '25',
};

function errorsOf(changes: Partial<RawInputs>, direction: Direction = 'depot', taxOn = true) {
  const result = parseInputs({ ...BASE, ...changes }, direction, taxOn);
  return result.ok ? {} : result.errors;
}

function errorOf(field: FieldId, text: string, direction: Direction = 'depot', taxOn = true) {
  return errorsOf({ [field]: text }, direction, taxOn)[field];
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

    // Range bounds: depot, monthly target, rate.
    for (const [direction, inside, outside] of [
      ['depot', '0', '-0,01'],
      ['depot', '200000,00', '200000,01'],
      ['payout', '0', '-0,01'],
      ['payout', '10000,00', '10000,01'],
    ] as const) {
      expect(errorOf('amount', inside, direction)).toBeUndefined();
      expect(errorOf('amount', outside, direction)).toEqual({ kind: 'range' });
    }
    for (const [inside, outside] of [
      ['0', '-0,01'],
      ['50,00', '50,01'],
    ] as const) {
      expect(errorOf('taxRate', inside)).toBeUndefined();
      expect(errorOf('taxRate', outside)).toEqual({ kind: 'range' });
    }

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
      expect(parseField(fieldSpec('phaseStart', 'depot'), text)).toEqual({ ok: true, value: key });
    }
    for (const [text, kind] of [
      ['31.13.2028', 'format'],
      ['29.2.2027', 'format'],
      ['31.12.2026', 'range'],
      ['1.1.2026', 'range'],
      ['1.1.2035', 'range'],
    ] as const) {
      expect(parseField(fieldSpec('phaseEnd', 'depot'), text)).toEqual({
        ok: false,
        error: { kind },
      });
    }

    // The conditional-required branch: the rate is read only while the checkbox is checked.
    const off = parseInputs({ ...BASE, taxRate: 'abc' }, 'depot', false);
    if (!off.ok) throw new Error('the rate should not be read while tax is off');
    expect(off.inputs.taxRateBp).toBe(0);
    expect(errorsOf({ taxRate: 'abc' }, 'depot', false)).toEqual({});
    expect(errorOf('taxRate', 'abc')).toEqual({ kind: 'format' });
    expect(errorOf('taxRate', '')).toEqual({ kind: 'empty' });

    // The amount field is required in both directions.
    expect(errorsOf({ amount: '' })).toEqual({ amount: { kind: 'empty' } });
    expect(errorsOf({ amount: '' }, 'payout', false)).toEqual({ amount: { kind: 'empty' } });
  });
});
