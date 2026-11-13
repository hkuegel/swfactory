/**
 * The exact UX copy (story 024, UX §2). Only the copy lives here, so the UI and the tests read the
 * same strings.
 */

import type { Fund } from './logic/fund.ts';
import { FIELD_IDS, type Direction, type FieldId, type OverrideField } from './logic/fields.ts';
import type { FieldError } from './logic/parseInputs.ts';
import { formatDate, formatMonth } from './logic/format.ts';

export interface FieldCopy {
  readonly label: string;
  /** The allowed range as quoted in error messages. */
  readonly range: string;
  readonly hint: string;
  /** `kein gültiges Datum` for the phase fields, `keine gültige Zahl` for the numbers (UX §2). */
  readonly formatWord: 'keine gültige Zahl' | 'kein gültiges Datum';
}

export const FIELD_COPY: Readonly<Record<FieldId, FieldCopy>> = {
  phaseStart: {
    label: 'Phase Beginn (Monat)',
    range: '1.1.2027 bis 31.12.2034',
    hint: 'Erster Monat der Auszahlungsphase; Format TT.MM.JJJJ, zum Beispiel 01.01.2028.',
    formatWord: 'kein gültiges Datum',
  },
  phaseEnd: {
    label: 'Phase Ende (Monat)',
    range: '1.1.2027 bis 31.12.2034',
    hint: 'Letzter Monat der Auszahlungsphase; Format TT.MM.JJJJ, zum Beispiel 31.03.2034; muss nach dem Beginn liegen.',
    formatWord: 'kein gültiges Datum',
  },
  amount: {
    label: 'Depot am Anfang der Phase (EUR)',
    range: '0 bis 200.000,00 €',
    hint: '0 bis 200.000,00 €, höchstens 2 Nachkommastellen.',
    formatWord: 'keine gültige Zahl',
  },
  taxRate: {
    label: 'Steuersatz in Prozent',
    range: '0 bis 50 %',
    hint: '0 bis 50 %, höchstens 2 Nachkommastellen; wird nur benutzt, wenn die Steuer angehakt ist.',
    formatWord: 'keine gültige Zahl',
  },
};

/** The amount field exists once; its label and range follow the direction (UX §2). */
export function amountCopy(direction: Direction): FieldCopy {
  if (direction === 'payout') {
    return {
      label: 'Monatliche Auszahlung als Ziel (EUR)',
      range: '0,00 bis 10.000,00 € pro Monat',
      hint: '0,00 € oder mehr pro Monat, höchstens 2 Nachkommastellen.',
      formatWord: 'keine gültige Zahl',
    };
  }
  return FIELD_COPY.amount;
}

/** The input cells of a fund row carry their own visually hidden label (UX §2). */
export function overrideCopy(field: OverrideField, year: number): FieldCopy {
  // The NAV cell's decimal rule follows its unit, micro-euro (story 025); the YTM cell keeps 2.
  const hint =
    field === 'nav'
      ? 'Wert aus der Fondsliste; eigener Wert, höchstens 6 Nachkommastellen.'
      : 'Wert aus der Fondsliste; eigener Wert, höchstens 2 Nachkommastellen.';
  return field === 'nav'
    ? {
        label: `NAV in Euro für Jahr ${String(year)}`,
        range: '0 bis 200.000,00 €',
        hint,
        formatWord: 'keine gültige Zahl',
      }
    : {
        label: `YTM in Prozent für Jahr ${String(year)}`,
        range: '-100,00 bis 100,00 %',
        hint,
        formatWord: 'keine gültige Zahl',
      };
}

/** The field's error text; always names the field and its allowed range (UX §2). */
export function errorMessage(copy: FieldCopy, error: FieldError): string {
  if (error.kind === 'endBeforeStart') {
    return `Phase Ende (Monat): muss nach dem Beginn liegen (${formatMonth(error.start)}). Erlaubt: ein Monat ab dem Beginn.`;
  }
  const word =
    error.kind === 'empty'
      ? 'Wert fehlt'
      : error.kind === 'format'
        ? copy.formatWord
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
