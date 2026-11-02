import { describe, expect, it } from 'vitest';
import type { SetupErrors, SetupValues } from './types.ts';
import { DEFAULT_SETUP, setupLimits, validateSetup } from './validateSetup.ts';

const v = (rows: string, cols: string, mines: string): SetupValues => ({ rows, cols, mines });
const range = (min: number, max: number) => ({ kind: 'outOfRange', min, max }) as const;

describe('validateSetup', () => {
  it.each<[string, SetupValues, SetupErrors | null]>([
    ['AC1: defaults are valid', DEFAULT_SETUP, null],
    ['AC3: empty rows', v('', '9', '10'), { rows: { kind: 'required' } }],
    ['AC3: blank rows', v(' ', '9', '10'), { rows: { kind: 'required' } }],
    ['AC3: decimal columns', v('9', '4.5', '10'), { cols: { kind: 'notWholeNumber' } }],
    ['AC3: negative columns', v('9', '-3', '10'), { cols: { kind: 'notWholeNumber' } }],
    ['AC3: text mines', v('9', '9', 'abc'), { mines: { kind: 'notWholeNumber' } }],
    ['AC3: rows 4 is too small', v('4', '9', '10'), { rows: range(5, 30) }],
    ['AC3: rows 5 is ok, spaces trimmed', v(' 5 ', '9', '10'), null],
    ['AC3: columns 30 is ok', v('9', '30', '10'), null],
    ['AC3: columns 31 is too big', v('9', '31', '10'), { cols: range(5, 30) }],
    ['AC3: mines 0 is too few', v('9', '9', '0'), { mines: range(1, 72) }],
    ['AC3: mines 1 is ok', v('9', '9', '1'), null],
    ['AC3: 9 × 9 with 72 mines is ok', v('9', '9', '72'), null],
    ['AC3: 9 × 9 with 73 mines is too many', v('9', '9', '73'), { mines: range(1, 72) }],
    [
      'AC3: mines 0 with invalid rows',
      v('3', '9', '0'),
      { rows: range(5, 30), mines: { kind: 'dependsOnSize' } },
    ],
    [
      'AC3: mines above any board with invalid rows',
      v('', '9', '892'),
      { rows: { kind: 'required' }, mines: { kind: 'dependsOnSize' } },
    ],
    [
      'AC3: plausible mines with invalid rows are not judged',
      v('x', '9', '500'),
      { rows: { kind: 'notWholeNumber' } },
    ],
    [
      'AC3: several errors at once',
      v('', '31', 'x'),
      { rows: { kind: 'required' }, cols: range(5, 30), mines: { kind: 'notWholeNumber' } },
    ],
  ])('%s', (_, values, errors) => {
    const result = validateSetup(values);
    if (errors === null) {
      expect(result.ok).toBe(true);
    } else {
      expect(result).toEqual({ ok: false, errors });
    }
  });

  it('AC1: returns the parsed config and the mines limit for the hint', () => {
    expect(validateSetup(v('16', '30', '99'))).toEqual({
      ok: true,
      config: { rows: 16, cols: 30, mines: 99 },
    });
    expect(setupLimits(DEFAULT_SETUP).mines.max).toBe(72);
    expect(setupLimits(v('9', '', '10')).mines.max).toBeNull();
  });
});
