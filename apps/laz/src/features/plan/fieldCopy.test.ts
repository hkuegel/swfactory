import { describe, expect, it } from 'vitest';
import { amountCopy, errorMessage, FIELD_COPY, overrideCopy, TAX_COPY } from './fieldCopy.ts';
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
    // Story 031 removed the percent bound of a typed rate, so no field of the form quotes a range that is
    // not the rule of its own unit; the fund-row YTM cell keeps the bound a percent means.
    expect(fieldSpec('phaseStart').max).toBeNull();
    expect(OVERRIDE_SPECS.ytm.max).toBe(10000);
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

  it('033 AC1, AC3: the phase copy quotes the shape of a month, not a range', () => {
    // Hand oracle: the strings from the AC. No range, no year bound, and the short form is the format
    // the hint shows, so the copy cannot disagree with the parser (the 025 defect pattern).
    expect(FIELD_COPY.phaseStart.range).toBe(
      'Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    );
    expect(FIELD_COPY.phaseStart.hint).toBe(
      'Erster Monat der Auszahlungsphase; Format MM.JJJJ, zum Beispiel 01.2028; ein Tag kann ergänzt werden.',
    );
    expect(FIELD_COPY.phaseEnd.hint).toBe(
      'Letzter Monat der Auszahlungsphase; Format MM.JJJJ, zum Beispiel 03.2034; ein Tag kann ergänzt werden; muss nach dem Beginn liegen.',
    );
    expect(errorMessage(FIELD_COPY.phaseEnd, { kind: 'format' })).toBe(
      'Phase Ende (Monat): kein gültiges Datum. Erlaubt: Monat und Jahr, zum Beispiel 03.2034; ein ergänzter Tag muss ein echter Tag dieses Monats sein.',
    );
    // Without a range in the spec the copy cannot quote one: the phase fields have no bounds, and story 031
    // removed the field for a typed rate, so no field of the form has a percent bound.
    for (const field of ['phaseStart', 'phaseEnd'] as const) {
      expect(fieldSpec(field).min).toBeNull();
      expect(fieldSpec(field).max).toBeNull();
    }
    for (const copy of [FIELD_COPY.phaseStart, FIELD_COPY.phaseEnd]) {
      expect(`${copy.hint} ${copy.range}`).not.toMatch(/2027|2035|TT\.MM\.JJJJ/u);
    }
  });

  it('031 AC1, AC2: the tax copy quotes the measured rates and the field for a typed rate is gone', () => {
    // Hand oracle: the strings of the story, written here from the measured facts of 2026-11-13.
    expect(TAX_COPY.kstLabel).toBe('Kapitalertragsteuer (25 %)');
    expect(TAX_COPY.kstHint).toBe(
      'Der Solzzuschlag von 5,5 % auf die Kapitalertragsteuer ist enthalten, das sind 26,375 % auf den Gewinn.',
    );
    expect(TAX_COPY.kistLabel).toBe('Kirchensteuer auf die Kapitalertragsteuer');
    expect(TAX_COPY.kistHint).toBe(
      '8 % in Bayern und Baden-Württemberg, 9 % in den anderen Bundesländern; wird nur gerechnet, wenn die Kapitalertragsteuer angehakt ist.',
    );
    expect(TAX_COPY.bundeslandLabel).toBe('Bundesland für die Kirchensteuer');
    // The copy has no entry for a typed rate: the accessibility tree shows no such control (AC1).
    expect(Object.keys(FIELD_COPY)).toEqual(['phaseStart', 'phaseEnd', 'amount']);
    expect(Object.keys(FIELD_COPY)).not.toContain('taxRate');
  });
});
