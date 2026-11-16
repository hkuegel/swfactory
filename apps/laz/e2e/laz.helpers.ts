/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Story 024 helpers. Euro figures contain U+00A0 before the euro sign: matched with \s.

export async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByRole('form', { name: 'Eingaben' })).toBeVisible();
}

export const phaseStartInput = (page: Page): Locator =>
  page.getByLabel('Erster Monat der Auszahlungsphase', { exact: true });
export const phaseEndInput = (page: Page): Locator =>
  page.getByLabel('Letzter Monat der Auszahlungsphase', { exact: true });
export const amountInput = (page: Page): Locator =>
  page.getByLabel('Depot am Anfang der Phase (EUR)', { exact: true });

/** Story 045: the field for the flat rate, read by its label (UX §2), never by position. */
export const flatInput = (page: Page): Locator =>
  page.getByLabel('Vorabpauschale', { exact: true });

/** Story 046 AC1: the parking block's control and its field, read by the names UX §2 gives them. The
 * legend names the group and the label names what the control does, so they are two different strings. */
export const depositSwitch = (page: Page): Locator =>
  page.getByRole('checkbox', {
    name: 'Zinsen auf das Geld, das noch nicht gebraucht wird',
    exact: true,
  });
export const depositInput = (page: Page): Locator =>
  page.getByLabel('Zinssatz in Prozent', { exact: true });

/** A fund-row override input by its visually hidden label (UX §2), never by cell position. */
export const fundInput = (page: Page, field: 'nav' | 'ytm', year: number): Locator =>
  page.getByLabel(
    `${field === 'nav' ? 'Kurs in Euro' : 'YTM in Prozent'} für Jahr ${String(year)}`,
    {
      exact: true,
    },
  );

export const result = (page: Page): Locator =>
  page.getByRole('region', { name: 'Ergebnis', exact: true });

/**
 * Story 048: the account statement's section, read inside its own region. The scroller inside it has its
 * own name (`Kontoauszug, horizontal scrollbar`), so this helper and the table helper never select the
 * same element.
 */
export const statementRegion = (page: Page): Locator =>
  page.getByRole('region', { name: 'Kontoauszug', exact: true });

/** The visually hidden polite live region inside "Ergebnis" (UX §4). */
export const liveRegion = (page: Page): Locator => result(page).locator('p[aria-live]');
export const statementTable = (page: Page): Locator => statementRegion(page).getByRole('table');
export const fundTable = (page: Page): Locator =>
  page.getByRole('region', { name: 'Fondsstaffel', exact: true }).getByRole('table');

/** The `dd` of a `dt` with exactly this text inside `scope`. */
const valueOf = (scope: Locator, label: string): Locator =>
  scope
    .locator('dt', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
    .locator('xpath=following-sibling::dd');

/** A result figure in "Ergebnis" by its exact label. */
export const figure = (page: Page, label: string): Locator => valueOf(result(page), label);

/** Figures and notes of "Ergebnis", without the visually hidden live region (story 015). */
export const resultText = async (page: Page): Promise<string> =>
  (await result(page).locator('dl, p:not([aria-live])').allInnerTexts()).join('\n');

export const euro = (amount: string): RegExp => new RegExp(`^${amount.replace(/\./g, '\\.')}\\s€`);

/** Cell of a row under a column header of `table`, looked up by header text (never by position). */
export async function cellByHeader(table: Locator, row: Locator, header: string): Promise<Locator> {
  const headers = await table.getByRole('columnheader').allInnerTexts();
  const index = headers.map((h) => h.trim()).indexOf(header);
  expect(index, `column "${header}"`).toBeGreaterThanOrEqual(0);
  return row.locator('th, td').nth(index);
}

/** A table row through its row header (a year), so no column order is assumed. */
export const rowByHeader = (table: Locator, key: string): Locator =>
  table.getByRole('rowheader', { name: key, exact: true }).locator('xpath=parent::tr');

/** Fund row of the fixture copy the tests read (ADR 0013 as amended by story 025). Story 036 reads the
 * identity fields too, from the same file the app is built with. */
export interface FixtureFileFund {
  readonly year: number;
  readonly isin: string;
  readonly name: string;
  readonly navMicroEur: number;
  readonly ytmBp: number;
}

/** Finding 6 / ADR 0013: `asOf` is one value for the whole file, stamped per refresh run, so the
 * helper reads it from the file top level, not from a fund. The file is the fixture copy, not the
 * data file: in `--mode e2e` the app is built with the same copy, so a refresh of the data file
 * cannot move these oracles (story 025). */
export interface FixtureFile {
  readonly asOf: string;
  readonly funds: FixtureFileFund[];
}

export function fixtureFile(): FixtureFile {
  const path = fileURLToPath(
    new URL('../src/features/plan/data/fund-list.fixture.json', import.meta.url),
  );
  return JSON.parse(readFileSync(path, 'utf8')) as FixtureFile;
}

export const fixtureFunds = (): FixtureFileFund[] => fixtureFile().funds;
export const fixtureAsOf = (): string => fixtureFile().asOf;

/** `2026-12-31` as `31.12.2026`, computed from the file's parts, not copied from the app. */
export const germanDate = (iso: string): string => {
  const [year = 0, month = 0, day = 0] = iso.split('-').map(Number);
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${String(year)}`;
};

/** Story 048: a money cell as whole Cent (`-1.234,56 €` is -123456, the dash is 0), parsed by string, not by float. */
export function toCents(text: string): number {
  const cleaned = text.replace(/\s|€/g, '');
  if (cleaned === '–' || cleaned === '') return 0;
  const negative = cleaned.startsWith('-');
  const [whole = '0', fraction = '00'] = cleaned.replace(/^-/, '').replace(/\./g, '').split(',');
  return (negative ? -1 : 1) * (Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
}

export interface StatementRead {
  readonly headers: string[];
  /** One entry per row: the year and the cells by header text, in Cent. */
  readonly rows: { year: string; cells: Record<string, number> }[];
}

/** The whole statement read from the page: headers by text, cells by the header they sit under. */
export async function readStatement(page: Page): Promise<StatementRead> {
  const table = statementTable(page);
  const headers = (await table.getByRole('columnheader').allInnerTexts()).map((h) => h.trim());
  const rows: StatementRead['rows'] = [];
  for (const row of await table.locator('tbody tr').all()) {
    const texts = await row.locator('th, td').allInnerTexts();
    const cells: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (index > 0) cells[header] = toCents(texts[index] ?? '');
    });
    rows.push({ year: (texts[0] ?? '').trim(), cells });
  }
  return { headers, rows };
}

/** The payout direction: the monthly payout is given, the depot is looked for. */
export async function givenPayout(page: Page, euroText: string): Promise<void> {
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill(euroText);
}

export const kstBox = (page: Page): Locator =>
  page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true });
export const kistBox = (page: Page): Locator =>
  page.getByRole('checkbox', { name: 'Kirchensteuer auf die Kapitalertragsteuer', exact: true });

/** Every money amount in a text, in Cent. */
export const toCentsAll = (text: string): number[] =>
  [...text.matchAll(/-?[\d.]+,\d{2}/g)].map((m) => toCents(m[0]));
