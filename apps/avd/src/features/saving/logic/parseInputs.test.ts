import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, type FieldId, type RawInputs } from './fields.ts';
import { parseInputs, type FieldError } from './parseInputs.ts';

function errorsOf(changes: Partial<RawInputs>) {
  const result = parseInputs({ ...DEFAULT_INPUTS, ...changes });
  return result.ok ? {} : result.errors;
}

function errorOf(field: FieldId, text: string): FieldError | undefined {
  return errorsOf({ [field]: text })[field];
}

function valueOf(field: 'monthly' | 'returnPct' | 'costsPct' | 'age', text: string): number {
  const result = parseInputs({ ...DEFAULT_INPUTS, [field]: text });
  if (!result.ok) throw new Error(`${field} "${text}" was rejected`);
  const { inputs } = result;
  return {
    monthly: inputs.monthlyCents,
    returnPct: inputs.returnBp,
    costsPct: inputs.costsBp,
    age: inputs.age,
  }[field];
}

describe('parseInputs', () => {
  it('AC1: the defaults parse to age 40, payout 65, 150 EUR, 0 children, 5 %, 0,5 %', () => {
    expect(parseInputs(DEFAULT_INPUTS)).toEqual({
      ok: true,
      inputs: {
        age: 40,
        payoutAge: 65,
        monthlyCents: 15000,
        children: 0,
        returnBp: 500,
        costsBp: 50,
      },
    });
  });

  it.each([
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
    ['-', 'format'],
  ] as const)('AC6: rejects monthly contribution %j as %s', (text, kind) => {
    expect(errorOf('monthly', text)).toEqual({ kind });
  });

  it('AC6: rejects decimals in whole-number fields', () => {
    expect(errorOf('age', '40,5')).toEqual({ kind: 'format' });
    expect(errorOf('children', '1,5')).toEqual({ kind: 'format' });
  });

  it.each([
    ['monthly', ' 150 ', 15000],
    ['monthly', '9.99', 999],
    ['monthly', '9,99', 999],
    ['monthly', '5,', 500],
    ['monthly', ',5', 50],
    ['returnPct', '−2,5', -250],
    ['age', '040', 40],
    ['returnPct', '-0', 0],
  ] as const)('accepts %s %j as %d', (field, text, expected) => {
    expect(valueOf(field, text)).toBe(expected);
    expect(Object.is(valueOf(field, text), -0)).toBe(false);
  });

  it.each([
    ['monthly', '570,00', '570,01'],
    ['monthly', '0', '-0,01'],
    ['costsPct', '1,00', '1,01'],
    ['costsPct', '0', '-0,01'],
    ['returnPct', '-10,00', '-10,01'],
    ['returnPct', '20,00', '20,01'],
    ['age', '18', '17'],
    ['children', '10', '11'],
    ['children', '0', '-1'],
  ] as const)('AC6: %s accepts %j and rejects %j', (field, inside, outside) => {
    expect(errorOf(field, inside)).toBeUndefined();
    expect(errorOf(field, outside)).toEqual({ kind: 'range' });
  });

  it('AC6: age 69 / 70 and payout 65 / 64 and 70 / 71 at the range bounds', () => {
    expect(errorsOf({ age: '69', payoutAge: '70' })).toEqual({});
    expect(errorsOf({ age: '70', payoutAge: '70' }).age).toEqual({ kind: 'range' });
    expect(errorsOf({ payoutAge: '64' }).payoutAge).toEqual({ kind: 'range' });
    expect(errorsOf({ payoutAge: '71' }).payoutAge).toEqual({ kind: 'range' });
  });

  it('AC6: payout start equal to or before the age is notAfterAge', () => {
    expect(errorsOf({ age: '66', payoutAge: '66' })).toEqual({
      payoutAge: { kind: 'notAfterAge', age: 66 },
    });
    expect(errorsOf({ age: '68', payoutAge: '67' })).toEqual({
      payoutAge: { kind: 'notAfterAge', age: 68 },
    });
  });

  it('AC6: an invalid age with payout 65 gives only the age error', () => {
    expect(errorsOf({ age: '17', payoutAge: '65' })).toEqual({ age: { kind: 'range' } });
  });

  it('AC6: two invalid fields give two errors', () => {
    expect(errorsOf({ monthly: '600', costsPct: '' })).toEqual({
      monthly: { kind: 'range' },
      costsPct: { kind: 'empty' },
    });
  });
});
