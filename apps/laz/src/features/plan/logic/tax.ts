/**
 * The statutory rates by § 32d Abs. 1 EStG (story 048 AC1): the Kirchensteuer lowers the Kapitalertragsteuer,
 * so KapESt = amount · 25 % / (1 + 0,25 · k), Soli = 5,5 % of the KapESt and KiSt = k · KapESt, with k = 8 %
 * (Bayern, Baden-Württemberg) or 9 % (every other Bundesland) and 0 without the church tax. The division by
 * 1,02 or 1,0225 has no exact integer unit, so values stay unrounded here and are rounded once, when shown.
 */

import { RATE_UNIT, type Tax } from './projection.ts';

const KAPEST_NOMINAL = 0.25;
const SOLZ_ON_KAPEST = 0.055;

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

/** k: the church tax as a fraction of the KapESt (0,08 or 0,09), 0 outside the tax case or without the checkbox. */
function churchFraction(state: TaxState): number {
  if (!state.kstOn || !state.kistOn) return 0;
  const land = BUNDESLAENDER.find((entry) => entry.id === state.bundesland);
  return land === undefined ? 0 : land.kistPercent / 100;
}

/** The three parts of the tax on one taxable amount, unrounded; all 0 while the KapESt checkbox is off. */
export interface TaxParts {
  readonly kapESt: number;
  readonly soli: number;
  readonly kist: number;
}

/** The one tax function: liquidation, Vorabpauschale and interest all read it (story 048 AC1). */
export function taxParts(amount: number, state: TaxState): TaxParts {
  if (!state.kstOn) return { kapESt: 0, soli: 0, kist: 0 };
  const k = churchFraction(state);
  const kapESt = (amount * KAPEST_NOMINAL) / (1 + KAPEST_NOMINAL * k);
  return { kapESt, soli: kapESt * SOLZ_ON_KAPEST, kist: kapESt * k };
}

/** The effective rate on the gain as a fraction (0,263750 / 0,278186 / 0,279951), derived from `taxParts`. */
export function effectiveRate(state: TaxState): number {
  const parts = taxParts(1, state);
  return parts.kapESt + parts.soli + parts.kist;
}

/** The same rate as the model's `Tax`, so the projection reads one shape. */
export function taxFromState(state: TaxState): Tax {
  return { on: state.kstOn, rateMillionths: effectiveRate(state) * RATE_UNIT };
}
