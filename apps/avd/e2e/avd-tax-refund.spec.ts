/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  ageInput,
  chart,
  childrenInput,
  columnTexts,
  euro,
  figure,
  monthlyInput,
  noResult,
  open,
  rateInput,
  setReference,
  tableRows,
} from './avd.helpers.ts';

// Story 014 – tax refund from the Günstigerprüfung. One test per AC (rebuild oracle).
// Branching logic (floor, clamp, cap, rounding, sweep) is unit-tested in logic/taxRefund.test.ts.

const PER_YEAR = 'Steuererstattung pro Sparjahr';
const FIRST_YEAR = 'Steuererstattung im 1. Sparjahr';
const TOTAL = 'Steuererstattung gesamt';
const NET = 'Eigene Beiträge nach Erstattung';

test.beforeEach(async ({ page }) => {
  await open(page);
});

test('AC1: the rate input with default 30, hint and a result including the refund are shown on load', async ({
  page,
}) => {
  await expect(rateInput(page)).toHaveValue('30');
  await expect(rateInput(page)).toHaveAccessibleDescription(/Soli/);
  await expect(rateInput(page)).toHaveAccessibleDescription(/Kirchensteuer/);
  await expect(rateInput(page)).toHaveAccessibleDescription(/0 bis 50 %/);
  await expect(figure(page, PER_YEAR)).toHaveText(euro('162,00'));
});

test('AC2: the reference at 42 % shows the refund and net own contributions outside the depot', async ({
  page,
}) => {
  await setReference(page);
  await rateInput(page).fill('42');
  await expect(figure(page, PER_YEAR)).toHaveText(euro('442,80'));
  await expect(figure(page, TOTAL)).toHaveText(euro('3.542,40'));
  await expect(figure(page, NET)).toHaveText(euro('10.857,60'));

  // The refund figures sit in their own group that says it is not part of the depot.
  const group = page.getByRole('region', { name: 'Vom Finanzamt erstattet, nicht im Depot' });
  await expect(group).toContainText('nicht im Endwert enthalten');
  await expect(group.getByText(TOTAL, { exact: true })).toBeVisible();
  await expect(group.getByText(NET, { exact: true })).toBeVisible();
  await expect(group.locator('dt', { hasText: /^(Endwert|Erträge|Zulagen gesamt)$/ })).toHaveCount(
    0,
  );

  // Depot figures of 013/AC4 are unchanged and still add up.
  await expect(figure(page, 'Eigene Beiträge')).toHaveText(euro('14.400,00'));
  await expect(figure(page, 'Zulagen gesamt')).toHaveText(euro('4.320,00'));
  await expect(figure(page, 'Erträge')).toHaveText(euro('3.536,44'));
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));
});

test('AC3: the refund per year for the rates 0, 23, 23,10, 42 and 50 %', async ({ page }) => {
  await setReference(page);
  const expected: readonly [string, string][] = [
    ['0', '0,00'],
    ['23', '0,00'],
    ['23,10', '0,54'],
    ['42', '442,80'],
    ['50', '630,00'],
  ];
  for (const [rate, refund] of expected) {
    await rateInput(page).fill(rate);
    await expect(figure(page, PER_YEAR), `rate ${rate}`).toHaveText(euro(refund));
  }
});

test('AC4: refund by contribution, children and the bonus year', async ({ page }) => {
  await rateInput(page).fill('42');
  const byMonthly: readonly [string, string][] = [
    ['0', '0,00'],
    ['9,99', '0,00'],
    ['10', '15,60'],
    ['25', '39,00'],
    ['570', '442,80'],
  ];
  for (const [monthly, refund] of byMonthly) {
    await monthlyInput(page).fill(monthly);
    await expect(figure(page, PER_YEAR), `monthly ${monthly}`).toHaveText(euro(refund));
  }

  await monthlyInput(page).fill('150');
  await childrenInput(page).fill('2');
  await expect(figure(page, PER_YEAR)).toHaveText(euro('94,80'));

  // Age 24: the bonus counts as Zulage of saving year 1 only.
  await childrenInput(page).fill('0');
  await ageInput(page).fill('24');
  await expect(figure(page, FIRST_YEAR)).toHaveText(euro('326,80'));
  await expect(figure(page, PER_YEAR)).toHaveText(euro('442,80'));
  const refunds = await columnTexts(page, 'Steuererstattung');
  expect(refunds[0]).toMatch(euro('326,80'));
  expect(refunds[1]).toMatch(euro('442,80'));
  expect(refunds.slice(1).every((text) => euro('442,80').test(text))).toBe(true);

  // Without the bonus (age 25) there is no year-1 row.
  await ageInput(page).fill('25');
  await expect(figure(page, PER_YEAR)).toHaveText(euro('442,80'));
  await expect(figure(page, FIRST_YEAR)).toHaveCount(0);
});

/** Texts of every depot column, row by row (everything except the refund column). */
async function depotColumns(page: Page): Promise<string[][]> {
  const out: string[][] = [];
  for (const header of [
    'Eigene Beiträge',
    'Zulagen gutgeschrieben',
    'Erträge',
    'Kontostand am Jahresende',
  ]) {
    out.push(await columnTexts(page, header));
  }
  return out;
}

test('AC5: edits update refund, net and column; a rate-only change leaves every depot figure and the chart untouched', async ({
  page,
}) => {
  await setReference(page);
  await rateInput(page).fill('42');
  await expect(tableRows(page)).toHaveCount(8);
  const refunds = await columnTexts(page, 'Steuererstattung');
  expect(refunds).toHaveLength(8);
  expect(refunds.every((text) => euro('442,80').test(text))).toBe(true);

  // Any other input: 9,99 EUR per month has no refund, net equals own contributions.
  await monthlyInput(page).fill('9,99');
  await expect(figure(page, TOTAL)).toHaveText(euro('0,00'));
  await expect(figure(page, NET)).toHaveText(euro('959,04'));
  expect((await columnTexts(page, 'Steuererstattung')).every((t) => euro('0,00').test(t))).toBe(
    true,
  );
  await monthlyInput(page).fill('150');
  await expect(figure(page, TOTAL)).toHaveText(euro('3.542,40'));

  // Rate-only change.
  const depot = ['Eigene Beiträge', 'Zulagen gesamt', 'Erträge', 'Endwert'];
  const readDepot = async () => Promise.all(depot.map((l) => figure(page, l).innerText()));
  const figuresBefore = await readDepot();
  const columnsBefore = await depotColumns(page);
  const chartBefore = await chart(page).screenshot({ animations: 'disabled' });
  const nameBefore = await chart(page).getAttribute('aria-label');
  expect(nameBefore).not.toMatch(/erstattung/i);

  await rateInput(page).fill('50');
  await expect(figure(page, PER_YEAR)).toHaveText(euro('630,00'));
  await expect(figure(page, TOTAL)).toHaveText(euro('5.040,00'));
  await expect(figure(page, NET)).toHaveText(euro('9.360,00'));
  expect((await columnTexts(page, 'Steuererstattung'))[0]).toMatch(euro('630,00'));

  expect(await readDepot()).toEqual(figuresBefore);
  expect(await depotColumns(page)).toEqual(columnsBefore);
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  const chartAfter = await chart(page).screenshot({ animations: 'disabled' });
  expect(chartAfter.equals(chartBefore)).toBe(true);
  expect(await chart(page).getAttribute('aria-label')).toBe(nameBefore);
});

test('AC6: an invalid tax rate names field and range, replaces the result and leaves no NaN or negative amount', async ({
  page,
}) => {
  const range = /Erlaubt: 0,00 bis 50,00 % \(höchstens 2 Nachkommastellen\)\./;
  for (const value of ['', 'abc', '-1', '30,001', '51']) {
    await rateInput(page).fill(value);
    await expect(rateInput(page), `value "${value}"`).toHaveAttribute('aria-invalid', 'true');
    await expect(rateInput(page)).toHaveAccessibleDescription(/^Ein kombinierter Satz/);
    await expect(rateInput(page)).toHaveAccessibleDescription(/Grenzsteuersatz: /);
    await expect(rateInput(page)).toHaveAccessibleDescription(range);
    await expect(noResult(page)).toBeVisible();
    await expect(figure(page, TOTAL)).toHaveCount(0);
    await expect(figure(page, NET)).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(chart(page)).toHaveCount(0);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/NaN|Infinity|-\d[\d.]*,\d{2}\s€/);
    await rateInput(page).fill('30');
    await expect(rateInput(page)).not.toHaveAttribute('aria-invalid', 'true');
    await expect(figure(page, PER_YEAR)).toHaveText(euro('162,00'));
  }

  // The other fields still validate as in 013 (and the rate stays valid).
  await monthlyInput(page).fill('600');
  await expect(monthlyInput(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(rateInput(page)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(noResult(page)).toBeVisible();
});

test('AC7: the rate follows the costs field in tab order, is labelled and described, and is announced after a pause', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));

  await page.getByLabel('Kosten pro Jahr', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(rateInput(page)).toBeFocused();
  await expect(rateInput(page)).toHaveAccessibleName('Grenzsteuersatz');
  await expect(rateInput(page)).toHaveAccessibleDescription(/Soli/);

  const live = page.locator('[aria-live="polite"]');
  await expect(live).toBeEmpty();
  await rateInput(page).fill('42');
  await page.clock.runFor(300);
  await expect(live).toBeEmpty();
  await page.clock.runFor(500);
  await expect(live).toHaveText(
    /^Endwert bei Auszahlungsbeginn mit 65: [\d.]+,\d{2}\s€\. Steuererstattung gesamt: 11\.070,00\s€\.$/,
  );

  await rateInput(page).fill('51');
  await expect(rateInput(page)).toHaveAccessibleDescription(/Grenzsteuersatz: Wert außerhalb/);
  await page.clock.runFor(800);
  await expect(live).toHaveText('Kein Ergebnis: Grenzsteuersatz ist ungültig.');
});

test('AC8: the note states the simplified refund model, payment by the Finanzamt and no tax advice', async ({
  page,
}) => {
  const note: Locator = page
    .getByRole('region', { name: 'Ergebnis' })
    .getByText(/^Hinweis: Die Zahlen sind Modellrechnungen/);
  await expect(note).toBeVisible();
  await expect(note).toContainText(
    'vereinfacht mit einem über alle Sparjahre gleichbleibenden Grenzsteuersatz',
  );
  await expect(note).toContainText('Das Finanzamt zahlt sie an die steuerpflichtige Person aus');
  await expect(note).toContainText('nicht im Depot gutgeschrieben');
  await expect(note).toContainText('keine Steuerberatung');
  // 013/AC8 statements remain.
  await expect(note).toContainText('keine Anlage- oder Steuerberatung');
  await expect(note).toContainText('Anspruch auf die staatliche Zulage besteht');
});
