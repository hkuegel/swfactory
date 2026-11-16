import { describe, expect, it } from 'vitest';
import {
  cashflowReasonText,
  columnLabel,
  COPY,
  DEPOSIT_COPY,
  amountCopy,
  errorMessage,
  FIELD_COPY,
  firstInvalidField,
  flatReasonText,
  overrideCopy,
  parkReasonText,
  parkTaxReasonText,
  projectionLabel,
  purchaseReasonText,
  TAX_COPY,
} from './fieldCopy.ts';
import type { CashflowColumn } from './logic/cashflow.ts';
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
    // not the rule of its own unit; the fund-row YTM cell keeps the bound a percent means. The exceptions are
    // the percent fields of the form, which keep it: the flat field of story 045 and the deposit field of
    // story 046 (0 to 100 %), so the copies above are the money fields without it.
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
    // removed the field for a typed rate. The fields that keep a percent are the exceptions: the flat field of
    // story 045 and the deposit field of story 046 both quote the bound a percent means (0 to 100 %).
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
    // adds the flat field as the control of the tax block and story 046 the deposit field as the control of
    // its own block, so the key list gains `flatRate` and then `depositRate`, last, in the form order of
    // `FIELD_IDS` (the hand strings of UX §2 are asserted in the story's own test).
    expect(Object.keys(FIELD_COPY)).toEqual([
      'phaseStart',
      'phaseEnd',
      'amount',
      'flatRate',
      'depositRate',
    ]);
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
  });
  it('046 AC1: the copy of the deposit field and its own block, and the form order that names it last', () => {
    // Hand strings from UX §2 of the story, written here rather than read from the module (P16). The bound
    // itself (0 to 10000 hundredths) is asserted in `parseInputs.test.ts`, where the range error is the
    // assertion the mutation of the bound can move; here only the copy is asserted (P32).
    expect(FIELD_COPY.depositRate.label).toBe('Zinssatz in Prozent');
    expect(FIELD_COPY.depositRate.range).toBe('0,00 bis 100,00 %');
    expect(FIELD_COPY.depositRate.hint).toBe(
      'Prozentsatz, höchstens 2 Nachkommastellen. Er gilt für das Geld, das zu Beginn eines Monats noch ' +
        'für die späteren Monate desselben Jahres braucht; er bleibt über die Laufzeit gleich und zählt nur, ' +
        'wenn die Option an ist.',
    );
    expect(FIELD_COPY.depositRate.formatWord).toBe('keine gültige Zahl');
    expect(FIELD_COPY.depositRate.unit).toBe('Hundertstel Prozent');
    // The errors the pattern gives, in the words UX §2 names (the four of the story).
    expect(errorMessage(FIELD_COPY.depositRate, { kind: 'format' })).toBe(
      'Zinssatz in Prozent: keine gültige Zahl. Erlaubt: 0,00 bis 100,00 %.',
    );
    expect(errorMessage(FIELD_COPY.depositRate, { kind: 'range' })).toBe(
      'Zinssatz in Prozent: Wert außerhalb des erlaubten Bereichs. Erlaubt: 0,00 bis 100,00 %.',
    );
    expect(errorMessage(FIELD_COPY.depositRate, { kind: 'exact' })).toBe(
      'Zinssatz in Prozent: Wert ist keine ganze Anzahl Hundertstel Prozent. Erlaubt: 0,00 bis 100,00 %.',
    );
    expect(errorMessage(FIELD_COPY.depositRate, { kind: 'empty' })).toBe(
      'Zinssatz in Prozent: Wert fehlt. Erlaubt: 0,00 bis 100,00 %.',
    );
    // AC1: the block is its own fieldset (Q5), so the legend names the group and the control label names
    // what the control does - two different strings, and the legend is not a substring of the label.
    expect(DEPOSIT_COPY.legend).toBe('Geld auf dem Tagesgeldkonto parken');
    expect(DEPOSIT_COPY.controlLabel).toBe('Zinsen auf das Geld, das noch nicht gebraucht wird');
    expect(DEPOSIT_COPY.controlHint).toBe(
      'Die Auszahlung fällt am letzten Tag jedes Phase-Monats, das Geld wartet bis dahin, und das Depot, ' +
        'das die App sucht, wird um die Zinsen kleiner, die das wartende Geld bringt.',
    );
    // The two phrases AC4 says the copy states once. Each lives in one string of this block: the control hint
    // names the day the payout falls, the field's hint names the rate as an assumption constant over the term.
    // No other copy of the form repeats either, and neither the legend nor the control label does.
    expect(DEPOSIT_COPY.controlHint).toContain('letzten Tag jedes Phase-Monats');
    expect(FIELD_COPY.depositRate.hint).toContain('über die Laufzeit gleich');
    for (const [key, copy] of Object.entries(FIELD_COPY)) {
      if (key === 'depositRate') continue;
      const text = `${copy.label} ${copy.hint ?? ''} ${copy.range}`;
      expect(text, `copy ${key}`).not.toContain('Zinssatz');
      expect(text, `copy ${key}`).not.toContain('letzten Tag jedes Phase-Monats');
      expect(text, `copy ${key}`).not.toContain('über die Laufzeit gleich');
    }
    for (const phrase of ['letzten Tag jedes Phase-Monats', 'über die Laufzeit gleich']) {
      expect(DEPOSIT_COPY.legend, `legend and ${phrase}`).not.toContain(phrase);
      expect(DEPOSIT_COPY.controlLabel, `label and ${phrase}`).not.toContain(phrase);
    }
    // AC4: the two column headers and the sum line, read as the full string. The sum line is paragraph
    // text, and the tax sentence is part of it only when a row has a tax figure (the developer's deviation 4).
    expect(COPY.parkColumn).toBe('Zinsen über das Phase-Jahr in Euro');
    expect(COPY.parkTaxColumn).toBe('Steuer auf die Zinsen in Euro');
    // Story 047 AC3: the two lines are one base string applied to the two hand labels.
    expect(COPY.columnSumLine('Zinsen über das Phase-Jahr in Euro', '32,50\u00a0€')).toBe(
      'Summe Zinsen über das Phase-Jahr in Euro: 32,50\u00a0€.',
    );
    expect(COPY.columnSumLine('Steuer auf die Zinsen in Euro', '8,58\u00a0€')).toBe(
      'Summe Steuer auf die Zinsen in Euro: 8,58\u00a0€.',
    );
    expect(COPY.parkFacts).toBe(
      'Die Zinsen werden einfach gerechnet, auf dem Geld, das bis zur Auszahlung wartet; innerhalb eines ' +
        'Jahres werden die Zinsen nicht verzinst. Die Steuer auf die Zinsen wird am Zufluss gerechnet, und ' +
        'das Jahr des Zuflusses ist das Phase-Jahr.',
    );
    // The reason texts, the first-match-wins map of UX §2, each written once.
    expect(parkReasonText('option-off')).toBe('Geld wird nicht geparkt (Option aus)');
    expect(parkReasonText('no-funding-fund')).toBe('kein Fonds für dieses Jahr');
    expect(parkReasonText('no-money-to-park')).toBe('kein Geld zum Parken (Wert nicht positiv)');
    expect(parkReasonText('no-rate')).toBe('kein Zinssatz');
    expect(parkTaxReasonText('outside-tax-case')).toBe('Steuer nicht angehakt');
    // There is no tax without interest, so the tax column reads the tax case first and then the same map:
    // a row that shows a figure in the interest column and a dash here names the tax case alone.
    expect(parkTaxReasonText('no-rate')).toBe('kein Zinssatz');
    // AC1, the form order: `depositRate` is last in `FIELD_IDS`, so a rate error is named only when the
    // fields before it are valid. Hand order: phaseStart, phaseEnd, amount, flatRate, depositRate.
    expect(firstInvalidField({ depositRate: { kind: 'empty' } })).toBe('depositRate');
    expect(firstInvalidField({ depositRate: { kind: 'empty' }, amount: { kind: 'empty' } })).toBe(
      'amount',
    );
    expect(
      firstInvalidField({ depositRate: { kind: 'range' }, flatRate: { kind: 'format' } }),
    ).toBe('flatRate');
  });
});

describe('fieldCopy (story 047, AC4): the year table reads one reason map and states the rules once', () => {
  it('AC4 the three new strings are written once, in the map the cells read', () => {
    // Hand strings of the AC and of UX §2. The tax-off answer is the same string in every tax column
    // (hak's gate 1 answer of 2026-11-16), so each map is read against the hand string here.
    const taxOff = 'Steuer nicht angehakt';
    expect(cashflowReasonText('outside-tax-case')).toBe(taxOff);
    expect(flatReasonText('outside-tax-case')).toBe(taxOff);
    expect(parkTaxReasonText('outside-tax-case')).toBe(taxOff);
    expect(cashflowReasonText('kist-off')).toBe('Kirchensteuer nicht angehakt');
    expect(cashflowReasonText('no-positive-gain')).toBe('kein Gewinn, darauf keine Steuer');
    // The string of the year section's line: it never reads in a cell, so it is stated once here, and
    // `COPY.flatNoRowLine` reads the same string through this map.
    const noPhaseYear = 'Auflösung in einem Jahr, das kein Phase-Jahr ist';
    expect(cashflowReasonText('sale-year-not-a-phase-year')).toBe(noPhaseYear);
    expect(COPY.flatNoRowLine(2029, '0,48\u00a0€')).toBe(
      `Fonds 2029: 0,48\u00a0€ (${noPhaseYear}).`,
    );
    // A cell with no figure of its own still names its reason, and each column reads its own map.
    expect(cashflowReasonText('no-year-counts')).toBe('kein Jahr zählt (nur das Auflösungsjahr)');
    expect(cashflowReasonText('no-year-pays')).toBe('kein Jahr zahlt Steuer');
    expect(cashflowReasonText('no-funding-fund')).toBe('kein Fonds für dieses Jahr');
    expect(cashflowReasonText('after-phase-end')).toBe('Auflösung nach Phasenende');
    expect(purchaseReasonText('after-phase-end')).toBe('Auflösung nach Phasenende');
    expect(flatReasonText('before-phase-start')).toBe('Auflösung vor Phasenbeginn');
    expect(cashflowReasonText('no-rate')).toBe('kein Zinssatz');
  });

  it('AC4 the thirteen column labels in the order of the table, and the five lines below it', () => {
    // Hand strings of the AC, each read against the label the copy gives that column.
    const hand: [CashflowColumn, string][] = [
      ['proceeds', 'Erlös aus der Fondsauflösung in Euro'],
      ['kst', 'Kapitalsteuer in Euro'],
      ['solz', 'Solzzuschlag in Euro'],
      ['kist', 'Kirchensteuer in Euro'],
      ['flatBeforePhase', 'Pauschalsteuer für die Jahre vor der Phase in Euro'],
      ['flatForYear', 'Pauschalsteuer für das Phase-Jahr in Euro'],
      ['payout', 'Auszahlung in Euro'],
      ['parked', 'Betrag für das Jahr'],
      ['interest', 'Zinsen über das Phase-Jahr in Euro'],
      ['interestTax', 'Steuer auf die Zinsen in Euro'],
    ];
    for (const [column, label] of hand) {
      expect(columnLabel(column), `column ${column}`).toBe(label);
    }
    // The five sentences AC4 names, read as the full line.
    expect(COPY.readerLine).toBe(
      'Das Geld eines Jahres: die Steuer-Spalten der Auflösung, Betrag für das Jahr und die Zinsen.',
    );
    expect(COPY.payoutCheck).toBe(
      'Dasselbe Geld: die Auszahlung plus die Steuer. Die Auszahlung wird nicht noch einmal addiert.',
    );
    expect(COPY.netNote).toBe(
      'Das Netto der Zinsen ist die Differenz aus der Zinsenspalte und ihrer Steuerspalte.',
    );
    expect(COPY.flatNote).toBe(
      'Die Pauschalsteuer-Spalten sind Depotteile aus anderen Jahren und zählen nicht zum Geld ' +
        'des Jahres.',
    );
    expect(COPY.parkedNote).toBe(
      'Der Betrag für das Jahr ist das Geld, das am Anfang des Jahres da war, kein Zufluss.',
    );
    // The two totals the section states once, one line each, never a `dd`.
    expect(COPY.taxTotalLine('78,59\u00a0€')).toBe(
      'Summe der Steuer über die Phase-Jahre: 78,59\u00a0€.',
    );
    expect(COPY.cashTotalLine('3.678,95\u00a0€')).toBe(
      'Summe des Gelds der Phase-Jahre: 3.678,95\u00a0€.',
    );
  });
});
