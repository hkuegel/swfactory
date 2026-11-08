import {
  ALLOWANCE_CENTS,
  BASE_RATE_BP,
  CAPITAL_GAINS_TAX_RATE,
  PARTIAL_EXEMPTION,
} from './logic/etfDepot.ts';
import { formatEuro, formatPercent, formatWholeEuro } from './logic/format.ts';
import { PAYOUT_END_AGE } from './logic/payout.ts';
import { DEDUCTIBLE_LIMIT_CENTS } from './logic/taxRefund.ts';

// Texts of the ETF comparison (story 016, UX §2). Rates and amounts come from the logic's
// constants, so a changed constant cannot leave a stale note.

const BP = 10_000;

/** AC4: next to the AVD figures; starts with the AC words. */
export const ASSUMPTION =
  `Annahme, noch nicht durch BMF geklärt: Was über ${formatWholeEuro(DEDUCTIBLE_LIMIT_CENTS)} ` +
  'Beitrag pro Jahr hinaus eingezahlt wurde, wird nur auf seinen Gewinn besteuert, der übrige ' +
  'Teil der Auszahlungen voll mit dem Satz für den Ruhestand.';

const NOTE_START =
  'Hinweis zum Vergleich: Dies ist eine Modellrechnung, keine Anlage- oder Steuerberatung und ' +
  'keine Empfehlung für ein Produkt. Beide Depots bekommen denselben Monatsbeitrag, dieselbe ' +
  'Rendite und dieselben Kosten und werden bis zum Alter von ' +
  `${String(PAYOUT_END_AGE)} in gleich hohen Monatsraten ganz ausgezahlt; verglichen wird der ` +
  'Ertrag nach Steuer. Das ETF-Depot erhält keine Zulage und keine Steuererstattung und wird mit ' +
  `${formatPercent(CAPITAL_GAINS_TAX_RATE, 3)} besteuert (25 % Abgeltungsteuer plus 5,5 % Soli, ` +
  `ohne Kirchensteuer), mit ${formatPercent(PARTIAL_EXEMPTION, 0)} Teilfreistellung und der ` +
  `Vorabpauschale bei einem Basiszins von ${formatPercent(BASE_RATE_BP / BP, 2)}.`;

const NOTE_END =
  'Die Auszahlungen des Altersvorsorgedepots werden mit dem eingegebenen Satz für den Ruhestand ' +
  'besteuert, der nicht geförderte Teil nur auf seinen Gewinn (Annahme, noch nicht durch BMF ' +
  'geklärt). Steuererstattungen, die bei der steuerpflichtigen Person bleiben, zählen nominal zum ' +
  'Ertrag des Altersvorsorgedepots. Nicht berücksichtigt sind Inflation, Kirchensteuer beim ' +
  'ETF-Depot, Zusammenveranlagung, die 30-%-Einmalauszahlung, eine lebenslange Rente, die ' +
  'Günstigerprüfung der Abgeltungsteuer sowie Kranken- und Pflegeversicherungsbeiträge auf ' +
  'Auszahlungen aus dem Altersvorsorgedepot.';

/** AC11, AC12: the comparison note, naming the Pauschbetrag state. */
export function comparisonNote(allowance: boolean): string {
  const state = allowance ? 'angesetzt' : 'nicht angesetzt';
  const pausch = `Der Sparer-Pauschbetrag von ${formatWholeEuro(ALLOWANCE_CENTS)} pro Jahr ist für das ETF-Depot ${state}.`;
  return `${NOTE_START} ${pausch} ${NOTE_END}`;
}

/** AC2: the payout period of both depots. */
export function payoutSentence(payoutAge: number, months: number): string {
  return `Beide Depots werden mit demselben Monatsbeitrag gefüllt und von ${String(payoutAge)} bis ${String(PAYOUT_END_AGE)} in ${String(months)} monatlichen Auszahlungen ganz aufgebraucht.`;
}

/** AC2, AC3: the verdict under the difference; the sign carries the direction too. */
export function verdict(differenceCents: number): string {
  if (differenceCents > 0) return 'Das Altersvorsorgedepot liegt vorn.';
  if (differenceCents < 0) return 'Das ETF-Depot liegt vorn.';
  return 'Beide Depots liegen gleichauf.';
}

/** AC10: appended to the live text; the amount is absolute, the direction is in the words. */
export function liveSentence(differenceCents: number): string {
  const amount = formatEuro(Math.abs(differenceCents));
  const lead = 'Vergleich mit dem ETF-Depot, Ertrag nach Steuer:';
  if (differenceCents > 0) return `${lead} Das Altersvorsorgedepot liegt um ${amount} vorn.`;
  if (differenceCents < 0) return `${lead} Das ETF-Depot liegt um ${amount} vorn.`;
  return `${lead} Beide Depots liegen gleichauf.`;
}
