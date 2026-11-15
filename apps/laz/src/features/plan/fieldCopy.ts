/**
 * The exact UX copy (story 024, UX §2). Only the copy lives here, so the UI and the tests read the
 * same strings.
 */

import type { Fund } from './logic/fund.ts';
import {
  FIELD_IDS,
  MAX_EXACT_UNITS,
  type Direction,
  type FieldId,
  type OverrideField,
} from './logic/fields.ts';
import type { FieldError } from './logic/parseInputs.ts';
import type { FlatRowReason, PurchaseReason } from './logic/purchase.ts';
import { formatDate, formatMonth } from './logic/format.ts';

export interface FieldCopy {
  readonly label: string;
  /** The rule the error quotes: a range that belongs to what the value means, or the rule of its unit (story 030). */
  readonly range: string;
  /** Story 044: a table cell has no hint of its own, its rule is the section's footnote, so a copy can have none. */
  readonly hint?: string;
  /** `kein gültiges Datum` for the phase fields, `keine gültige Zahl` for the numbers (UX §2). */
  readonly formatWord: 'keine gültige Zahl' | 'kein gültiges Datum';
  /** The field's unit, named in the error when a value is not an exact whole unit (story 030). */
  readonly unit?: string;
}

/**
 * The largest whole number a `Number` holds exactly, as the German copy quotes it (story 030). It is
 * the exact-integer limit of a unit, not an amount cap: 9.007.199.254.740.991 Cent is
 * 90.071.992.547.409,91 €. The digits come from `MAX_EXACT_UNITS`, so copy and constant cannot drift
 * (the defect story 025 found).
 */
const LARGEST_EXACT_UNITS = MAX_EXACT_UNITS.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** The rule of a money field: sign, the decimals of its unit, and a value exact in that unit. */
function moneyRule(unit: string, decimals: number, suffix = ''): string {
  return (
    `0 € oder mehr${suffix}, höchstens ${decimals} Nachkommastellen, Wert muss eine ganze Anzahl ` +
    `${unit} sein (bis ${LARGEST_EXACT_UNITS} ${unit})`
  );
}

export const FIELD_COPY: Readonly<Record<FieldId, FieldCopy>> = {
  phaseStart: {
    // Story 044: the label is a sentence, so it says what the field is, not what it is called in the code.
    label: 'Erster Monat der Auszahlungsphase',
    // Story 033: no range. The rule is the shape of a month, so the error names the shape, not a range.
    range:
      'Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    // Story 044: the hint is what to type; what the field means is the label, so the two no longer repeat
    // each other.
    hint: 'Format MM.JJJJ, zum Beispiel 01.2028; ein Tag kann ergänzt werden.',
    formatWord: 'kein gültiges Datum',
  },
  phaseEnd: {
    label: 'Letzter Monat der Auszahlungsphase',
    range:
      'Monat und Jahr, zum Beispiel 03.2034; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    hint: 'Format MM.JJJJ, zum Beispiel 03.2034; ein Tag kann ergänzt werden; muss nach dem Beginn liegen.',
    formatWord: 'kein gültiges Datum',
  },
  amount: {
    label: 'Depot am Anfang der Phase (EUR)',
    range: moneyRule('Cent', 2),
    hint: '0 € oder mehr, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
    formatWord: 'keine gültige Zahl',
    unit: 'Cent',
  },
  // Story 045 AC1: the flat rate keeps the bound a percent means, which no other field of the form has
  // since story 031 removed the typed rate. Its unit is a hundredth of a percent, so the exact-unit error
  // names that unit.
  flatRate: {
    label: 'Vorabpauschale',
    range: '0,00 bis 100,00 %',
    hint: 'Prozentsatz, höchstens 2 Nachkommastellen. Er bleibt über die ganze Laufzeit gleich und zählt nur, wenn die Kapitalertragsteuer angehakt ist; der Depot-Auszug nennt das Vorsteuerpauschale.',
    formatWord: 'keine gültige Zahl',
    unit: 'Hundertstel Prozent',
  },
};

/**
 * The tax controls of story 031. The rates are the measured facts of 2026-11-13, so the copy quotes
 * them; no control of this block can be invalid, because a checkbox and a select cannot hold a value
 * outside their own options.
 */
export const TAX_COPY = {
  legend: 'Steuer auf den Gewinn',
  kstLabel: 'Kapitalertragsteuer (25 %)',
  kstHint:
    'Der Solzzuschlag von 5,5 % auf die Kapitalertragsteuer ist enthalten, das sind 26,375 % auf den Gewinn.',
  kistLabel: 'Kirchensteuer auf die Kapitalertragsteuer',
  kistHint:
    '8 % in Bayern und Baden-Württemberg, 9 % in den anderen Bundesländern; wird nur gerechnet, wenn die Kapitalertragsteuer angehakt ist.',
  bundeslandLabel: 'Bundesland für die Kirchensteuer',
} as const;

/** The amount field exists once; its label follows the direction, its rule is the rule of its unit (UX §2, story 030). */
export function amountCopy(direction: Direction): FieldCopy {
  if (direction === 'payout') {
    return {
      label: 'Monatliche Auszahlung als Ziel (EUR)',
      range: moneyRule('Cent', 2, ' pro Monat'),
      hint: '0 € oder mehr pro Monat, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
      formatWord: 'keine gültige Zahl',
      unit: 'Cent',
    };
  }
  return FIELD_COPY.amount;
}

/** Story 044: the fund input cells keep their visually hidden label (024 UX §2), but have no hint of
 * their own, because the rule the cells share is stated once in the section's footnote. */
export function overrideCopy(field: OverrideField, year: number): FieldCopy {
  // The NAV cell's decimal rule follows its unit, micro-euro (story 025), and it has no amount cap
  // (story 030); the YTM cell keeps 2 decimals and the range of a percent.
  if (field === 'nav') {
    return {
      label: `Kurs in Euro für Jahr ${String(year)}`,
      range: moneyRule('Micro-Euro', 6),
      formatWord: 'keine gültige Zahl',
      unit: 'Micro-Euro',
    };
  }
  return {
    label: `YTM in Prozent für Jahr ${String(year)}`,
    range: '-100,00 bis 100,00 %',
    formatWord: 'keine gültige Zahl',
  };
}

/** The field's error text; always names the field and the rule it broke (UX §2, story 030). */
export function errorMessage(copy: FieldCopy, error: FieldError): string {
  if (error.kind === 'endBeforeStart') {
    // Story 044: the wording quotes the label it is given, so it cannot disagree with the label.
    return `${copy.label}: muss nach dem Beginn liegen (${formatMonth(error.start)}). Erlaubt: ein Monat ab dem Beginn.`;
  }
  const word =
    error.kind === 'empty'
      ? 'Wert fehlt'
      : error.kind === 'format'
        ? copy.formatWord
        : error.kind === 'exact'
          ? `Wert ist keine ganze Anzahl ${copy.unit ?? 'der Einheit des Felds'}`
          : 'Wert außerhalb des erlaubten Bereichs';
  return `${copy.label}: ${word}. Erlaubt: ${copy.range}.`;
}

/** The app name, the intro, the copy of the controls, table captions and the strings of the result area (UX §2). */
export const COPY = {
  /** Story 044 (hak): the name the user sees. The app id stays `laz`, so the published path and the CI
   * paths do not move; `index.html` carries the same string as its `<title>`. */
  appTitle: 'Bond ladder',
  /** Story 044: the first text of the app content, the one that explains what the app calculates. */
  intro:
    'Ein Bond ladder ist eine Staffel von Fonds, einer pro Jahr. Jeder Fonds wird am 31. Dezember seines ' +
    'Jahres aufgelöst, und das Geld dieses Fonds finanziert die Auszahlungen des Jahres danach. Diese App ' +
    'zeigt, welche monatliche Auszahlung ein Depot über eine Phase trägt, oder welches Depot eine ' +
    'gewünschte monatliche Auszahlung braucht.',
  directionLegend: 'Was ist gegeben und was wird gesucht?',
  depotRadio: 'Das Depot ist gegeben, gesucht wird die monatliche Auszahlung',
  payoutRadio: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot',
  resultHeading: 'Ergebnis',
  inputsHeading: 'Eingaben',
  yearsHeading: 'Jahresübersicht',
  captionPrefix: 'Auszahlungsphase',
  fundsHeading: 'Fondsstaffel',
  scrollerLabel: 'Jahresübersicht, horizontal scrollbar',
  yearColumn: 'Jahr',
  monthsColumn: 'Monate',
  fundingColumn: 'Finanzierung durch Fonds',
  amountColumn: 'Betrag für das Jahr',
  /** Story 036 (hak's gate 1 answers of 2026-11-14): the fund row names the fund it is. The strings are
   * the values as the data file stores them, so no formatting is invented for them. */
  nameColumn: 'Fondsname',
  isinColumn: 'ISIN',
  /** Hak's word for the value the source publishes with its asOf date: "nenne es Kurs wenn es der
   * aktuelle Kurs ist" (2026-11-14). The source publishes no separate market price for these funds, so the
   * column shows the net asset value per share the data file has (story 025). */
  navColumn: 'Kurs',
  ytmColumn: 'YTM in Prozent',
  projectionColumn: 'Hochrechnung je Anteil in Euro',
  /** Story 032: the two columns of the purchase side. Hak's wording is "wieviel ich von jedem ETF JETZT kaufen muss". */
  sharesColumn: 'Anteile jetzt kaufen',
  purchaseColumn: 'Kaufpreis heute in Euro',
  fundingLabel: (fund: Fund): string =>
    `Fonds ${String(fund.year)} (Auflösung Dezember ${String(fund.year)})`,
  missingYear: 'kein Fonds für dieses Jahr',
  missingAmount: '–',
  footnote:
    'Jedes Phase-Jahr wird durch die Auflösung des Fonds im Dezember des Vorjahres finanziert. ' +
    'Ein Jahr ohne Fonds wird ohne Betrag gezeigt und zählt nicht in der Summe.',
  marker: 'Wert vom Nutzer eingegeben',
  fundCaption: 'Ein Fonds pro Jahr, aufgelöst am 31. Dezember des Jahres',
  fundScrollerLabel: 'Fondsstaffel, horizontal scrollbar',
  /** Story 044: the rule the input cells shared, written once. The cells keep their own label because a
   * column header cannot name a control inside a cell (024 UX §2). */
  fundFootnote:
    'Die Werte in den Kurs- und YTM-Zellen stammen aus der Fondsliste und können überschrieben werden; ' +
    'ein überschriebener Wert wird markiert und die Hochrechnung rechnet mit ihm. Kurs: höchstens 6 ' +
    'Nachkommastellen, der Wert muss eine ganze Anzahl Micro-Euro sein. YTM: höchstens 2 ' +
    'Nachkommastellen.',
  /** Story 045 AC4: the new column names the money it shows; `Vorabpauschale` stays on the field's label,
   * so the column uses the shorthand. `Haltedauer` occurs here once. */
  flatColumn: 'Pauschalsteuer über die Haltedauer in Euro',
  /** The fund section states the sum once, as a paragraph, never as a `dd`. `{wert}` is `formatEuro` of
   * the shown parts; the paragraph is not shown when no row has a flat figure. */
  flatSumLine: (wert: string): string => `Summe der Pauschalsteuer über alle Fonds: ${wert}.`,
  /** The three facts AC4 names, stated once in the fund section. */
  flatFacts:
    'Die Pauschalsteuer für ein Jahr wird am ersten Werktag des nächsten Jahres gezahlt (für 2026: ' +
    '4.1.2027). Das Jahr der Auflösung zählt nicht. Das Geld kommt vom Verrechnungskonto, der Wert des ' +
    'Fonds wird dadurch nicht kleiner.',
  /** The one sentence that names what the searched depot includes (AC5); it states the rule the result
   * figure follows, so it is read in the fund section, not in the result block. */
  flatDepotNote:
    'Das Depot, das die App sucht, enthält die jährlichen Pauschalsteuer-Zahlungen; eine negative ' +
    'monatliche Auszahlung wird als negative Zahl gezeigt.',
  emptyResult: 'Noch kein Ergebnis: bitte Phase und Betrag ausfüllen.',
  invalidResult: 'Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.',
  noFundingYear: 'Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.',
  sumFigures: 'Summe der finanzierten Jahre',
  figure: (direction: Direction): string =>
    direction === 'depot' ? 'Maximale monatliche Auszahlung' : 'Benötigtes Depot für die Phase',
} as const;

/**
 * Why a fund row of story 032 shows no purchase. `Auflösung nach Phasenende` is hak's example from AC3;
 * the other two strings are decisions of this story (Decision log), because AC3 names no string for a
 * fund that liquidates before the phase begins or for a payout per share of 0, where no number may be
 * invented. `kein Fonds für dieses Jahr` stays the year table's line for a phase year without a fund.
 */
export function purchaseReasonText(reason: PurchaseReason): string {
  if (reason === 'after-phase-end') return 'Auflösung nach Phasenende';
  if (reason === 'before-phase-start') return 'Auflösung vor Phasenbeginn';
  return 'keine Hochrechnung je Anteil';
}

/**
 * The flat column's dash (story 045 AC4). The three new reasons are the copy of UX §2; a phase-side reason
 * keeps the string of story 032, because a row outside the phase names the same thing in both columns. A
 * row can show two dashes with two different reasons, so this reads the flat column's own one.
 */
export function flatReasonText(reason: FlatRowReason): string {
  if (reason === 'outside-tax-case') return 'Steuer nicht angehakt';
  if (reason === 'no-year-counts') return 'kein Jahr zählt (nur das Auflösungsjahr)';
  if (reason === 'no-year-pays') return 'kein Jahr zahlt Steuer';
  return purchaseReasonText(reason);
}

/** Projection label (AC5), the accessible description of every projection figure. */
export function projectionLabel(asOf: string): string {
  return (
    'Diese Beträge sind eine Hochrechnung aus YTM und NAV und kein veröffentlichter Marktwert. ' +
    `Stand der Daten: ${formatDate(asOf)}.`
  );
}

/** Live region wording (UX §4). */
export function liveText(direction: Direction, figure: string, sum: string): string {
  return `${COPY.figure(direction)}: ${figure}. Summe der finanzierten Jahre: ${sum}.`;
}

export function invalidLiveText(label: string): string {
  return `Kein Ergebnis: ${label} ist ungültig.`;
}

/** The label as the live region names it; the amount label follows the direction (UX §2). */
export function fieldLabel(field: FieldId, direction: Direction): string {
  return field === 'amount' ? amountCopy(direction).label : FIELD_COPY[field].label;
}

/** The first invalid field in form order, if any. */
export function firstInvalidField(
  errors: Readonly<Partial<Record<FieldId, FieldError>>>,
): FieldId | undefined {
  return FIELD_IDS.find((field) => errors[field] !== undefined);
}
