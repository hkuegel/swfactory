import type { FieldId } from './logic/fields.ts';
import type { FieldError, FieldErrors } from './logic/parseInputs.ts';
import { FIELD_IDS } from './logic/fields.ts';
import { formatWholeEuro } from './logic/format.ts';
import { CONTRIBUTION_CAP_CENTS } from './logic/schedule.ts';

export interface FieldCopy {
  readonly label: string;
  /** Decorative unit after the input (aria-hidden); the hint names the unit. */
  readonly suffix: string;
  readonly hint: string;
  /** The allowed range as quoted in error messages. */
  readonly range: string;
}

/** Exact texts of the UX design (story 013, UX §2; tax rate: story 014, UX §2). */
export const FIELD_COPY: Readonly<Record<FieldId, FieldCopy>> = {
  age: {
    label: 'Alter heute',
    suffix: 'Jahre',
    hint: 'Ganze Jahre, 18 bis 69.',
    range: '18 bis 69 Jahre',
  },
  payoutAge: {
    label: 'Auszahlungsbeginn (Lebensjahr)',
    suffix: 'Jahre',
    hint: 'Ganze Jahre, 65 bis 70, später als das heutige Alter.',
    range: '65 bis 70 Jahre, später als das heutige Alter',
  },
  monthly: {
    label: 'Monatlicher Beitrag',
    suffix: '€',
    hint: '0 bis 570,00 € pro Monat, höchstens 2 Nachkommastellen.',
    range: '0 bis 570,00 € pro Monat',
  },
  children: {
    label: 'Kinder mit Kindergeld',
    suffix: 'Kinder',
    hint: 'Ganze Zahl, 0 bis 10; gilt für die gesamte Sparzeit.',
    range: '0 bis 10 Kinder (ganze Zahl)',
  },
  returnPct: {
    label: 'Erwartete Rendite pro Jahr',
    suffix: '%',
    hint: '-10,00 bis 20,00 % pro Jahr vor Kosten, höchstens 2 Nachkommastellen.',
    range: '-10,00 bis 20,00 % (höchstens 2 Nachkommastellen)',
  },
  costsPct: {
    label: 'Kosten pro Jahr',
    suffix: '%',
    hint: '0,00 bis 1,00 % pro Jahr (Obergrenze beim Standarddepot), höchstens 2 Nachkommastellen.',
    range: '0,00 bis 1,00 % (höchstens 2 Nachkommastellen)',
  },
  taxRatePct: {
    label: 'Grenzsteuersatz',
    suffix: '%',
    hint: 'Ein kombinierter Satz einschließlich Soli und Kirchensteuer, 0 bis 50 %, höchstens 2 Nachkommastellen.',
    range: '0,00 bis 50,00 % (höchstens 2 Nachkommastellen)',
  },
};

/** The reinvest checkbox (story 015, UX §2); not a text field, so not a `FieldId`. */
export const REINVEST_COPY = {
  label: 'Steuererstattung wieder anlegen',
  hint: `Angehakt: Die Erstattung eines Sparjahres wird am 1. Januar des Folgejahres ins Depot eingezahlt, höchstens bis ${formatWholeEuro(CONTRIBUTION_CAP_CENTS)} Beitrag pro Jahr. Nicht angehakt: Sie bleibt bei der steuerpflichtigen Person.`,
} as const;

/** The field's error text; always names the field and its allowed range (AC6). */
export function errorMessage(field: FieldId, error: FieldError): string {
  const { label, range } = FIELD_COPY[field];
  switch (error.kind) {
    case 'empty':
      return `${label}: Wert fehlt. Erlaubt: ${range}.`;
    case 'format':
      return `${label}: keine gültige Zahl. Erlaubt: ${range}.`;
    case 'range':
      return `${label}: Wert außerhalb des erlaubten Bereichs. Erlaubt: ${range}.`;
    case 'notAfterAge':
      return `${FIELD_COPY.payoutAge.label}: muss später liegen als das heutige Alter (${String(error.age)} Jahre). Erlaubt: 65 bis 70 Jahre.`;
  }
}

/** The first invalid field in form order, if any. */
export function firstInvalidField(errors: FieldErrors): FieldId | undefined {
  return FIELD_IDS.find((field) => errors[field] !== undefined);
}
