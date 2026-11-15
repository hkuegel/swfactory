import { describe, expect, it } from 'vitest';
import {
  COPY,
  amountCopy,
  errorMessage,
  FIELD_COPY,
  firstInvalidField,
  overrideCopy,
  projectionLabel,
  TAX_COPY,
} from './fieldCopy.ts';
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
    // Story 044: a cell has no hint of its own; the rule the cells share is the section's footnote,
    // written once (hand string from the AC of 044).
    expect(overrideCopy('nav', 2028).hint).toBeUndefined();
    expect(COPY.fundFootnote).toBe(
      'Die Werte in den Kurs- und YTM-Zellen stammen aus der Fondsliste und können überschrieben ' +
        'werden; ein überschriebener Wert wird markiert und die Hochrechnung rechnet mit ihm. Kurs: ' +
        'höchstens 6 Nachkommastellen, der Wert muss eine ganze Anzahl Micro-Euro sein. YTM: ' +
        'höchstens 2 Nachkommastellen.',
    );
    // The footnote names both units, so it is the rule of the column, not of one row.
    expect(COPY.fundFootnote).toContain('Kurs');
    expect(COPY.fundFootnote).toContain('YTM');
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
      // A copy without a hint (story 044: a table cell) is checked through its rule alone.
      const quoted = [copy.hint, copy.range].filter((part) => part !== undefined).join(' ');
      expect(quoted).not.toMatch(/200\.000|10\.000|20\.000/u);
      const digits = (quoted.match(/bis ([\d.]+) /u) ?? [])[1] ?? '';
      expect(digits.replace(/\./g, '')).toBe(MAX_EXACT_UNITS);
    }
    // The spec has no maximum for a money field, so the copy cannot quote one.
    expect(fieldSpec('amount').max).toBeNull();
    expect(OVERRIDE_SPECS.nav.max).toBeNull();
    // Story 031 removed the percent bound of a typed rate, so no field of the form quotes a range that is
    // not the rule of its own unit; the fund-row YTM cell keeps the bound a percent means. Story 045 adds
    // the flat field, which is the one field of the form that keeps the bound of a percent (0 to 100 %), so
    // the copies above are the money fields without it.
    expect(fieldSpec('phaseStart').max).toBeNull();
    expect(OVERRIDE_SPECS.ytm.max).toBe(10000);
  });

  it('AC2: the error names the reason of the unit instead of a maximum amount', () => {
    expect(errorMessage(FIELD_COPY.amount, { kind: 'exact' })).toBe(
      `Depot am Anfang der Phase (EUR): Wert ist keine ganze Anzahl Cent. Erlaubt: 0 € oder mehr, höchstens 2 Nachkommastellen, ${CENTS}.`,
    );
    expect(errorMessage(overrideCopy('nav', 2028), { kind: 'exact' })).toBe(
      `Kurs in Euro für Jahr 2028: Wert ist keine ganze Anzahl Micro-Euro. Erlaubt: 0 € oder mehr, höchstens 6 Nachkommastellen, ${MICRO}.`,
    );
    // The sign is still its own reason, and the decimals are still a format error.
    expect(errorMessage(FIELD_COPY.amount, { kind: 'format' })).toContain('keine gültige Zahl');
  });

  it('036 AC1, AC3: the fund row names the fund, and the column that shows the course is named Kurs', () => {
    // Hand strings from the AC and from hak's wording of 2026-11-14 ("nenne es Kurs wenn es der aktuelle
    // Kurs ist"), written here rather than read from the module under test (P16).
    expect(COPY.nameColumn).toBe('Fondsname');
    expect(COPY.isinColumn).toBe('ISIN');
    expect(COPY.navColumn).toBe('Kurs');
    // The input cell of the same column keeps the unit in its label, in the style of the YTM cell, because
    // a column header cannot name a control inside a cell (story 024 UX §2).
    expect(overrideCopy('nav', 2028).label).toBe('Kurs in Euro für Jahr 2028');
    // The copy states no price the source does not publish: the value is the net asset value with its asOf
    // date, and the projection label says so in the words of story 024 AC5.
    expect(COPY.navColumn).not.toMatch(/Marktkurs|Preis/u);
    expect(projectionLabel('2026-12-31')).toContain('kein veröffentlichter Marktwert');
  });

  it('033 AC1, AC3: the phase copy quotes the shape of a month, not a range', () => {
    // Hand oracle: the strings from the AC. No range, no year bound, and the short form is the format
    // the hint shows, so the copy cannot disagree with the parser (the 025 defect pattern).
    expect(FIELD_COPY.phaseStart.range).toBe(
      'Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    );
    // Story 044: the label says what the field means, so the hint is only what to type.
    expect(FIELD_COPY.phaseStart.label).toBe('Erster Monat der Auszahlungsphase');
    expect(FIELD_COPY.phaseEnd.label).toBe('Letzter Monat der Auszahlungsphase');
    expect(FIELD_COPY.phaseStart.hint).toBe(
      'Format MM.JJJJ, zum Beispiel 01.2028; ein Tag kann ergänzt werden.',
    );
    expect(FIELD_COPY.phaseEnd.hint).toBe(
      'Format MM.JJJJ, zum Beispiel 03.2034; ein Tag kann ergänzt werden; muss nach dem Beginn liegen.',
    );
    // Story 044: the error quotes the label it is given, so it cannot disagree with the label.
    expect(errorMessage(FIELD_COPY.phaseEnd, { kind: 'format' })).toBe(
      'Letzter Monat der Auszahlungsphase: kein gültiges Datum. Erlaubt: Monat und Jahr, zum Beispiel 03.2034; ein ergänzter Tag muss ein echter Tag dieses Monats sein.',
    );
    expect(errorMessage(FIELD_COPY.phaseEnd, { kind: 'endBeforeStart', start: '2034-03' })).toBe(
      'Letzter Monat der Auszahlungsphase: muss nach dem Beginn liegen (März 2034). Erlaubt: ein Monat ab dem Beginn.',
    );
    // Without a range in the spec the copy cannot quote one: the phase fields have no bounds, and story 031
    // removed the field for a typed rate, so no field of the form has a percent bound.
    for (const field of ['phaseStart', 'phaseEnd'] as const) {
      expect(fieldSpec(field).min).toBeNull();
      expect(fieldSpec(field).max).toBeNull();
    }
    for (const copy of [FIELD_COPY.phaseStart, FIELD_COPY.phaseEnd]) {
      expect(`${copy.hint ?? ''} ${copy.range}`).not.toMatch(/2027|2035|TT\.MM\.JJJJ/u);
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
    // The copy has no entry for a typed rate: the accessibility tree shows no such control (AC1). Story 045
    // adds the flat field as the control of the tax block, so the key list gains `flatRate`, last, in the
    // form order of `FIELD_IDS` (the hand strings of UX §2 are asserted in the story's own test).
    expect(Object.keys(FIELD_COPY)).toEqual(['phaseStart', 'phaseEnd', 'amount', 'flatRate']);
    expect(Object.keys(FIELD_COPY)).not.toContain('taxRate');
  });

  it('045 AC1: the copy of the flat field, and the form order that names it last', () => {
    // Hand strings from UX §2 of the story, written here rather than read from the module (P16). The
    // bound itself (0 to 10000 hundredths) is asserted in `parseInputs.test.ts`, where the range error
    // is the assertion the mutation of the bound can move; here only the copy is asserted.
    expect(FIELD_COPY.flatRate.label).toBe('Vorabpauschale');
    expect(FIELD_COPY.flatRate.range).toBe('0,00 bis 100,00 %');
    expect(FIELD_COPY.flatRate.hint).toBe(
      'Prozentsatz, höchstens 2 Nachkommastellen. Er bleibt über die ganze Laufzeit gleich und zählt nur, wenn die Kapitalertragsteuer angehakt ist; der Depot-Auszug nennt das Vorsteuerpauschale.',
    );
    expect(FIELD_COPY.flatRate.formatWord).toBe('keine gültige Zahl');
    expect(FIELD_COPY.flatRate.unit).toBe('Hundertstel Prozent');
    // The errors the pattern gives, in the words UX §2 names.
    expect(errorMessage(FIELD_COPY.flatRate, { kind: 'format' })).toBe(
      'Vorabpauschale: keine gültige Zahl. Erlaubt: 0,00 bis 100,00 %.',
    );
    expect(errorMessage(FIELD_COPY.flatRate, { kind: 'range' })).toBe(
      'Vorabpauschale: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0,00 bis 100,00 %.',
    );
    expect(errorMessage(FIELD_COPY.flatRate, { kind: 'empty' })).toBe(
      'Vorabpauschale: Wert fehlt. Erlaubt: 0,00 bis 100,00 %.',
    );
    // The word `Vorabpauschale` stays on exactly one element, the label (UX §2), so no other copy of the
    // form repeats it; the colloquial word is named once, inside the hint.
    for (const [key, copy] of Object.entries(FIELD_COPY)) {
      if (key !== 'flatRate') expect(copy.label, `copy ${key}`).not.toContain('Vorabpauschale');
    }
    // AC1, the form order: `flatRate` is last in `FIELD_IDS`, so a flat error is named only when the
    // fields before it are valid. Hand order: phaseStart, phaseEnd, amount, flatRate.
    expect(firstInvalidField({ flatRate: { kind: 'empty' } })).toBe('flatRate');
    expect(firstInvalidField({ amount: { kind: 'empty' }, flatRate: { kind: 'empty' } })).toBe(
      'amount',
    );
    expect(firstInvalidField({ flatRate: { kind: 'range' }, phaseStart: { kind: 'format' } })).toBe(
      'phaseStart',
    );
  });
});
