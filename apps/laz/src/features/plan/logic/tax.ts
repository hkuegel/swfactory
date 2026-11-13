/**
 * The statutory rates story 031 uses, in millionths of a percent (1 % = 1 000 000). The unit is chosen
 * because the Solzzuschlag is 5,5 % of 25 % = 1,375 %, which is not a whole basis point, and the money
 * rule forbids float percentages. The rates are the measured facts of 2026-11-13: Kapitalertragsteuer
 * 25 % of the gain; Solzzuschlag 5,5 % of the Kapitalertragsteuer; Kirchensteuer is computed on the
 * Kapitalertragsteuer, not on the gain — 8 % in Bayern and Baden-Württemberg, 9 % in every other
 * Bundesland.
 */

import type { Tax } from './projection.ts';

/** 25 % of the gain, as millionths of a percent. */
export const KST_MILLIONTHS = 250_000;

/** 5,5 % of the Kapitalertragsteuer, so 1,375 % of the gain. */
export const SOLZ_ON_KST_MILLIONTHS = 13_750;

export interface Bundesland {
  readonly id: string;
  readonly name: string;
  /** The church tax as a whole percent of the Kapitalertragsteuer, the number the select shows. */
  readonly kistPercent: number;
}

/** The 16 Bundesländer, Bayern first (hak's default of 2026-11-13), then the others in the order the select shows them. */
export const BUNDESLAENDER: readonly Bundesland[] = [
  { id: 'bayern', name: 'Bayern', kistPercent: 8 },
  { id: 'baden-wuerttemberg', name: 'Baden-Württemberg', kistPercent: 8 },
  { id: 'berlin', name: 'Berlin', kistPercent: 9 },
  { id: 'brandenburg', name: 'Brandenburg', kistPercent: 9 },
  { id: 'bremen', name: 'Bremen', kistPercent: 9 },
  { id: 'hamburg', name: 'Hamburg', kistPercent: 9 },
  { id: 'hessen', name: 'Hessen', kistPercent: 9 },
  { id: 'mecklenburg-vorpommern', name: 'Mecklenburg-Vorpommern', kistPercent: 9 },
  { id: 'niedersachsen', name: 'Niedersachsen', kistPercent: 9 },
  { id: 'northrhein-westfalen', name: 'Nordrhein-Westfalen', kistPercent: 9 },
  { id: 'rheinland-pfalz', name: 'Rheinland-Pfalz', kistPercent: 9 },
  { id: 'saarland', name: 'Saarland', kistPercent: 9 },
  { id: 'sachsen', name: 'Sachsen', kistPercent: 9 },
  { id: 'sachsen-anhalt', name: 'Sachsen-Anhalt', kistPercent: 9 },
  { id: 'schleswig-holstein', name: 'Schleswig-Holstein', kistPercent: 9 },
  { id: 'thueringen', name: 'Thüringen', kistPercent: 9 },
];

export const DEFAULT_BUNDESLAND = 'bayern';

export interface TaxState {
  readonly kstOn: boolean;
  readonly kistOn: boolean;
  readonly bundesland: string;
}

/** Whole percent × the KSt, exact as integers: 8 % of 250 000 is 20 000, 9 % is 22 500. */
export function churchTaxMillionths(state: TaxState): number {
  if (!state.kstOn || !state.kistOn) return 0;
  const land = BUNDESLAENDER.find((entry) => entry.id === state.bundesland);
  if (land === undefined) return 0;
  return (KST_MILLIONTHS * land.kistPercent) / 100;
}

/** The rate on the gain the model uses: KSt plus SolZ, plus the church tax when both checkboxes apply. */
export function effectiveRateMillionths(state: TaxState): number {
  if (!state.kstOn) return 0;
  return KST_MILLIONTHS + SOLZ_ON_KST_MILLIONTHS + churchTaxMillionths(state);
}

/** The same rate as the model's `Tax`, so the projection reads one shape. */
export function taxFromState(state: TaxState): Tax {
  return { on: state.kstOn, rateMillionths: effectiveRateMillionths(state) };
}
