import { expect, type Locator, type Page } from '@playwright/test';

// Helpers of the story 014 spec. Euro figures contain U+00A0 before the euro sign: matched with \s.

export async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByRole('form', { name: 'Eingaben' })).toBeVisible();
}

export const ageInput = (page: Page) => page.getByLabel('Alter heute', { exact: true });
export const payoutInput = (page: Page) =>
  page.getByLabel('Auszahlungsbeginn (Lebensjahr)', { exact: true });
export const monthlyInput = (page: Page) => page.getByLabel('Monatlicher Beitrag', { exact: true });
export const childrenInput = (page: Page) =>
  page.getByLabel('Kinder mit Kindergeld', { exact: true });
export const returnInput = (page: Page) =>
  page.getByLabel('Erwartete Rendite pro Jahr', { exact: true });
export const costsInput = (page: Page) => page.getByLabel('Kosten pro Jahr', { exact: true });
export const rateInput = (page: Page) => page.getByLabel('Grenzsteuersatz', { exact: true });

/** The value belonging to a result label (`dt` -> following `dd`), full label only. */
export const figure = (page: Page, label: string): Locator =>
  page
    .locator('dt', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
    .locator('xpath=following-sibling::dd');

export const euro = (amount: string) => new RegExp(`^${amount.replace(/\./g, '\\.')}\\s€`);
export const chart = (page: Page) => page.getByRole('img', { name: /^Gestapeltes Säulendiagramm/ });
export const tableRows = (page: Page) => page.getByRole('table').locator('tbody tr');
export const noResult = (page: Page) =>
  page.getByText('Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.');

/** The cell of a table row under a column header, looked up by header text (never by position). */
export async function cellByHeader(page: Page, row: Locator, header: string): Promise<Locator> {
  const headers = await page.getByRole('columnheader').allInnerTexts();
  const index = headers.map((h) => h.trim()).indexOf(header);
  expect(index, `column "${header}"`).toBeGreaterThanOrEqual(0);
  return row.locator('th, td').nth(index);
}

/** Texts of one column over all rows. */
export async function columnTexts(page: Page, header: string): Promise<string[]> {
  const rows = tableRows(page);
  const n = await rows.count();
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push((await (await cellByHeader(page, rows.nth(i), header)).innerText()).trim());
  }
  return out;
}

/** Sets the reference example inputs (age 57, payout 65, 150 EUR, 0 children, 5 %, 0,5 %). */
export async function setReference(page: Page) {
  await ageInput(page).fill('57');
  await payoutInput(page).fill('65');
  await monthlyInput(page).fill('150');
  await childrenInput(page).fill('0');
  await returnInput(page).fill('5');
  await costsInput(page).fill('0,5');
}
