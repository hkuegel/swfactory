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
import { formatDate, formatMonth } from './logic/format.ts';

export interface FieldCopy {
  readonly label: string;
  /** The rule the error quotes: a range that belongs to what the value means, or the rule of its unit (story 030). */
  readonly range: string;
  readonly hint: string;
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
    label: 'Phase Beginn (Monat)',
    // Story 033: no range. The rule is the shape of a month, so the error names the shape, not a range.
    range:
      'Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    hint: 'Erster Monat der Auszahlungsphase; Format MM.JJJJ, zum Beispiel 01.2028; ein Tag kann ergänzt werden.',
    formatWord: 'kein gültiges Datum',
  },
  phaseEnd: {
    label: 'Phase Ende (Monat)',
    range:
      'Monat und Jahr, zum Beispiel 03.2034; ein ergänzter Tag muss ein echter Tag dieses Monats sein',
    hint: 'Letzter Monat der Auszahlungsphase; Format MM.JJJJ, zum Beispiel 03.2034; ein Tag kann ergänzt werden; muss nach dem Beginn liegen.',
    formatWord: 'kein gültiges Datum',
  },
  amount: {
    label: 'Depot am Anfang der Phase (EUR)',
    range: moneyRule('Cent', 2),
    hint: '0 € oder mehr, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
    formatWord: 'keine gültige Zahl',
    unit: 'Cent',
  },
  taxRate: {
    label: 'Steuersatz in Prozent',
    range: '0 bis 50 %',
    hint: '0 bis 50 %, höchstens 2 Nachkommastellen; wird nur benutzt, wenn die Steuer angehakt ist.',
    formatWord: 'keine gültige Zahl',
  },
};

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

/** The input cells of a fund row carry their own visually hidden label (UX §2). */
export function overrideCopy(field: OverrideField, year: number): FieldCopy {
  // The NAV cell's decimal rule follows its unit, micro-euro (story 025), and it has no amount cap
  // (story 030); the YTM cell keeps 2 decimals and the range of a percent.
  if (field === 'nav') {
    return {
      label: `NAV in Euro für Jahr ${String(year)}`,
      range: moneyRule('Micro-Euro', 6),
      hint: 'Wert aus der Fondsliste; eigener Wert, höchstens 6 Nachkommastellen; der Wert muss eine ganze Anzahl Micro-Euro sein.',
      formatWord: 'keine gültige Zahl',
      unit: 'Micro-Euro',
    };
  }
  return {
    label: `YTM in Prozent für Jahr ${String(year)}`,
    range: '-100,00 bis 100,00 %',
    hint: 'Wert aus der Fondsliste; eigener Wert, höchstens 2 Nachkommastellen.',
    formatWord: 'keine gültige Zahl',
  };
}

/** The field's error text; always names the field and the rule it broke (UX §2, story 030). */
export function errorMessage(copy: FieldCopy, error: FieldError): string {
  if (error.kind === 'endBeforeStart') {
    return `Phase Ende (Monat): muss nach dem Beginn liegen (${formatMonth(error.start)}). Erlaubt: ein Monat ab dem Beginn.`;
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

/** Radiogroup, checkbox, table caption and the strings of the result area (UX §2). */
export const COPY = {
  directionLegend: 'Rechenrichtung',
  depotRadio: 'Depot gegeben, Auszahlung gesucht',
  payoutRadio: 'Auszahlung gegeben, Depot gesucht',
  taxCheckbox: 'Steuer auf den Gewinn anwenden',
  resultHeading: 'Ergebnis',
  inputsHeading: 'Eingaben',
  yearsHeading: 'Jahresübersicht',
  captionPrefix: 'Auszahlungsphase',
  fundsHeading: 'Fondsplan',
  scrollerLabel: 'Jahresübersicht, horizontal scrollbar',
  yearColumn: 'Jahr',
  monthsColumn: 'Monate',
  fundingColumn: 'Finanzierung durch Fonds',
  amountColumn: 'Betrag für das Jahr',
  navColumn: 'NAV in Euro',
  ytmColumn: 'YTM in Prozent',
  projectionColumn: 'Hochrechnung je Anteil in Euro',
  fundingLabel: (fund: Fund): string =>
    `Fonds ${String(fund.year)} (Auflösung Dezember ${String(fund.year)})`,
  missingYear: 'kein Fonds für dieses Jahr',
  missingAmount: '–',
  footnote:
    'Jedes Phase-Jahr wird durch die Auflösung des Fonds im Dezember des Vorjahres finanziert. ' +
    'Ein Jahr ohne Fonds wird ohne Betrag gezeigt und zählt nicht in der Summe.',
  marker: 'Wert vom Nutzer eingegeben',
  fundCaption: 'Fondsliste nach Jahr',
  fundScrollerLabel: 'Fondsplan, horizontal scrollbar',
  emptyResult: 'Noch kein Ergebnis: bitte Phase und Betrag ausfüllen.',
  invalidResult: 'Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.',
  noFundingYear: 'Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.',
  sumFigures: 'Summe der finanzierten Jahre',
  figure: (direction: Direction): string =>
    direction === 'depot' ? 'Maximale monatliche Auszahlung' : 'Benötigtes Depot für die Phase',
} as const;

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
