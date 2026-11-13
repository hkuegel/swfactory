import { describe, expect, it } from 'vitest';
import { amountCopy, errorMessage, FIELD_COPY, overrideCopy } from './fieldCopy.ts';
import { MAX_EXACT_UNITS, OVERRIDE_SPECS, fieldSpec } from './logic/fields.ts';

/**
 * Story 030, AC3: the copy of a money field states the decimal rule and the exact-integer rule of its
 * unit and quotes no maximum amount. The expected strings are written here by hand from the AC, so the
 * test does not read its oracle from the module it checks.
 */
const CENTS = 'Wert muss eine ganze Anzahl Cent sein (bis 9.007.199.254.740.991 Cent)';
const MICRO = 'Wert muss eine ganze Anzahl Micro-Euro sein (bis 9.007.199.254.740.991 Micro-Euro)';

describe('fieldCopy (story 030, AC3: the rule, not an invented maximum)', () => {
  it('the money copy states the decimals of its unit and the exact-integer rule', () => {
    expect(FIELD_COPY.amount.range).toBe(`0 € oder mehr, höchstens 2 Nachkommastellen, ${CENTS}`);
    expect(FIELD_COPY.amount.hint).toBe(
      '0 € oder mehr, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
    );
    expect(amountCopy('payout').range).toBe(
      `0 € oder mehr pro Monat, höchstens 2 Nachkommastellen, ${CENTS}`,
    );
    expect(amountCopy('payout').hint).toBe(
      '0 € oder mehr pro Monat, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
    );
    expect(overrideCopy('nav', 2028).range).toBe(
      `0 € oder mehr, höchstens 6 Nachkommastellen, ${MICRO}`,
    );
    expect(overrideCopy('nav', 2028).hint).toBe(
      'Wert aus der Fondsliste; eigener Wert, höchstens 6 Nachkommastellen; der Wert muss eine ganze Anzahl Micro-Euro sein.',
    );
  });

  it('the copy quotes no maximum amount; the number it quotes is the bound of the unit (025 defect pattern)', () => {
    // The two amounts 024 quoted are gone, and the number that stays is read as digits, which is the
    // same constant the parser uses.
    const copies = [
      FIELD_COPY.amount,
      amountCopy('depot'),
      amountCopy('payout'),
      overrideCopy('nav', 2028),
    ];
    for (const copy of copies) {
      const quoted = `${copy.hint} ${copy.range}`;
      expect(quoted).not.toMatch(/200\.000|10\.000|20\.000/u);
      const digits = (quoted.match(/bis ([\d.]+) /u) ?? [])[1] ?? '';
      expect(digits.replace(/\./g, '')).toBe(MAX_EXACT_UNITS);
    }
    // The spec has no maximum for a money field, so the copy cannot quote one.
    expect(fieldSpec('amount').max).toBeNull();
    expect(OVERRIDE_SPECS.nav.max).toBeNull();
    // A field that keeps a bound that belongs to what the value means still quotes a range (the tax
    // rate is removed by 031; until then its 0 – 50 % is not a money rule).
    expect(fieldSpec('taxRate').max).toBe(5000);
  });

  it('AC2: the error names the reason of the unit instead of a maximum amount', () => {
    expect(errorMessage(FIELD_COPY.amount, { kind: 'exact' })).toBe(
      `Depot am Anfang der Phase (EUR): Wert ist keine ganze Anzahl Cent. Erlaubt: 0 € oder mehr, höchstens 2 Nachkommastellen, ${CENTS}.`,
    );
    expect(errorMessage(overrideCopy('nav', 2028), { kind: 'exact' })).toBe(
      `NAV in Euro für Jahr 2028: Wert ist keine ganze Anzahl Micro-Euro. Erlaubt: 0 € oder mehr, höchstens 6 Nachkommastellen, ${MICRO}.`,
    );
    // The sign is still its own reason, and the decimals are still a format error.
    expect(errorMessage(FIELD_COPY.amount, { kind: 'format' })).toContain('keine gültige Zahl');
  });
});
