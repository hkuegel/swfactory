/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';
import {
  ageInput,
  cellByHeader,
  cents,
  chart,
  chartSeriesPixels,
  childrenInput,
  columnTexts,
  differingPixels,
  euro,
  figure,
  monthlyInput,
  noResult,
  open,
  payoutInput,
  rateInput,
  reinvestBox,
  result,
  savingSnapshot,
  setReference,
  tableRows,
} from './avd.helpers.ts';

// Story 015 – optional reinvestment of the tax refund. One test per AC (rebuild oracle).
// Branching logic (cap, schedule sweep, rounding) is unit-tested in logic/schedule.test.ts.
// "Unchecked equals 014" is also proven by the unchanged 013 and 014 specs.

const REINVESTED = 'Reinvestierte Steuererstattung';
const NET = 'Eigene Beiträge nach Erstattung';
const FIGURES = ['Eigene Beiträge', 'Zulagen gesamt', 'Erträge', 'Endwert'] as const;

test.beforeEach(async ({ page }) => {
  await open(page);
});

const endValue = async (page: Page) => cents(await figure(page, 'Endwert').innerText());

test('AC1: unchecked by default and equal to 014; toggling updates and announces without a submit and unchecking restores it', async ({
  page,
}) => {
  // Reload under a fake clock so the 700 ms debounce can be crossed deterministically.
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));

  const box = reinvestBox(page);
  await expect(box).toBeVisible();
  await expect(box).not.toBeChecked();
  await expect(figure(page, NET)).toBeVisible();
  await expect(page.locator('dt', { hasText: new RegExp(`^${REINVESTED}$`) })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Wieder angelegt' })).toHaveCount(0);
  await expect(page.getByText(REINVESTED, { exact: true })).toHaveCount(0);

  await setReference(page);
  await rateInput(page).fill('42');
  const before = await savingSnapshot(page);

  // Keyboard only: from the rate field one Tab reaches the box, Space toggles it.
  await rateInput(page).focus();
  await page.keyboard.press('Tab');
  await expect(box).toBeFocused();
  const live = page.locator('[aria-live="polite"]');
  await page.clock.runFor(900);
  await page.keyboard.press('Space');
  await expect(box).toBeChecked();
  await expect(box).toBeFocused();
  await expect(figure(page, REINVESTED)).toBeVisible();
  await expect(figure(page, NET)).toHaveCount(0);
  await expect(figure(page, 'Endwert')).not.toHaveText(euro('22.256,44'));
  await page.clock.runFor(800);
  await expect(live).toHaveText(/Davon wieder angelegt: 3\.099,60\s€\./);

  await page.keyboard.press('Space');
  await expect(box).not.toBeChecked();
  await expect(figure(page, REINVESTED)).toHaveCount(0);
  const after = await savingSnapshot(page);
  expect(after.figures).toBe(before.figures);
  expect(after.table).toBe(before.table);
  expect(await differingPixels(page, after.chart, before.chart)).toBe(0);
  await page.clock.runFor(800);
  await expect(live).toHaveText(
    /^Endwert bei Auszahlungsbeginn mit 65: 22\.256,44\s€\. Steuererstattung gesamt: 3\.542,40\s€\./,
  );
  await expect(live).not.toContainText('Davon wieder angelegt');
});

test('AC2: the reference at 42 % reinvests 3.099,60 and reaches 25.963,41', async ({ page }) => {
  await setReference(page);
  await rateInput(page).fill('42');
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));

  await reinvestBox(page).check();
  await expect(figure(page, 'Eigene Beiträge')).toHaveText(euro('14.400,00'));
  await expect(figure(page, 'Zulagen gesamt')).toHaveText(euro('4.320,00'));
  await expect(figure(page, REINVESTED)).toHaveText(euro('3.099,60'));
  await expect(figure(page, 'Erträge')).toHaveText(euro('4.143,81'));
  await expect(figure(page, 'Endwert')).toHaveText(euro('25.963,41'));

  const parts = [...FIGURES.filter((l) => l !== 'Endwert'), REINVESTED] as const;
  let sum = 0;
  for (const label of parts) sum += cents(await figure(page, label).innerText());
  expect(sum).toBe(await endValue(page));

  await expect(figure(page, NET)).toHaveCount(0);
  await expect(figure(page, 'Steuererstattung pro Sparjahr')).toHaveText(euro('442,80'));
  await expect(figure(page, 'Steuererstattung gesamt')).toHaveText(euro('3.542,40'));
});

test('AC3: the reinvested refund counts as contribution of the next year; at the cap nothing is reinvested', async ({
  page,
}) => {
  await ageInput(page).fill('40');
  await payoutInput(page).fill('65');
  await childrenInput(page).fill('0');
  await rateInput(page).fill('42');
  await monthlyInput(page).fill('25');

  const zulagenOfYear2 = async () => {
    const rows = tableRows(page);
    const row2 = cents(
      await (await cellByHeader(page, rows.nth(1), 'Zulagen gutgeschrieben')).innerText(),
    );
    const row3 = cents(
      await (await cellByHeader(page, rows.nth(2), 'Zulagen gutgeschrieben')).innerText(),
    );
    return row3 - row2;
  };
  expect(await zulagenOfYear2()).toBe(15000);

  await reinvestBox(page).check();
  expect(await zulagenOfYear2()).toBe(16950);
  const refunds = await columnTexts(page, 'Steuererstattung');
  expect(refunds[0]).toMatch(euro('39,00'));
  expect(refunds[1]).toMatch(euro('44,07'));

  await monthlyInput(page).fill('570');
  await expect(figure(page, REINVESTED)).toHaveText(euro('0,00'));
  const checkedEnd = await endValue(page);
  await reinvestBox(page).uncheck();
  expect(await endValue(page)).toBe(checkedEnd);
});

test('AC4: table column and chart series appear while checked, add up, update and vanish when unchecked', async ({
  page,
}) => {
  await setReference(page);
  await rateInput(page).fill('42');

  const unchecked = await page.getByRole('columnheader').allInnerTexts();
  expect(unchecked.map((h) => h.trim())).not.toContain('Wieder angelegt');
  expect((await chartSeriesPixels(page)).reinvested).toBe(0);
  await expect(chart(page)).not.toHaveAccessibleName(/reinvestierte Steuererstattung/);

  await reinvestBox(page).check();
  const headers = (await page.getByRole('columnheader').allInnerTexts()).map((h) => h.trim());
  expect(headers).toContain('Wieder angelegt');

  const assertRows = async () => {
    const own = await columnTexts(page, 'Eigene Beiträge');
    const zul = await columnTexts(page, 'Zulagen gutgeschrieben');
    const re = await columnTexts(page, 'Wieder angelegt');
    const ret = await columnTexts(page, 'Erträge');
    const bal = await columnTexts(page, 'Kontostand am Jahresende');
    expect(own.length).toBeGreaterThan(1);
    for (let i = 0; i < own.length; i += 1) {
      const sum =
        cents(own[i] ?? '') + cents(zul[i] ?? '') + cents(re[i] ?? '') + cents(ret[i] ?? '');
      expect(sum, `row ${i + 1}`).toBe(cents(bal[i] ?? ''));
    }
    expect(cents(re[0] ?? '')).toBe(0);
    expect(cents(re[re.length - 1] ?? '')).toBe(cents(await figure(page, REINVESTED).innerText()));
  };
  await assertRows();

  await expect(page.getByText(REINVESTED, { exact: true })).toHaveCount(2); // figure and legend
  await expect(chart(page)).toHaveAccessibleName(/reinvestierte Steuererstattung 3\.099,60\s€/);
  expect((await chartSeriesPixels(page)).reinvested).toBeGreaterThan(50);

  await monthlyInput(page).fill('100');
  await assertRows();
  const reinvested = cents(await figure(page, REINVESTED).innerText());
  expect(reinvested).not.toBe(309960);
  await expect(chart(page)).toHaveAccessibleName(
    new RegExp(
      `reinvestierte Steuererstattung ${(reinvested / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }).replace(/\./g, '\\.')}\\s€`,
    ),
  );

  await reinvestBox(page).uncheck();
  expect((await page.getByRole('columnheader').allInnerTexts()).map((h) => h.trim())).not.toContain(
    'Wieder angelegt',
  );
  await expect(page.getByText(REINVESTED, { exact: true })).toHaveCount(0);
  expect((await chartSeriesPixels(page)).reinvested).toBe(0);
});

test('AC5: zero refund and one saving year reinvest 0,00; an invalid field keeps the box and shows no bad amount', async ({
  page,
}) => {
  const box = reinvestBox(page);
  const sameAsUnchecked = async () => {
    await box.check();
    await expect(figure(page, REINVESTED)).toHaveText(euro('0,00'));
    const checkedEnd = await endValue(page);
    await box.uncheck();
    expect(await endValue(page)).toBe(checkedEnd);
  };

  await setReference(page);
  await rateInput(page).fill('0');
  await sameAsUnchecked();

  await rateInput(page).fill('42');
  await monthlyInput(page).fill('9,99');
  await sameAsUnchecked();

  await monthlyInput(page).fill('150');
  await ageInput(page).fill('69');
  await payoutInput(page).fill('70');
  await sameAsUnchecked();

  // Invalid input while checked.
  await ageInput(page).fill('57');
  await payoutInput(page).fill('65');
  await box.check();
  await expect(figure(page, REINVESTED)).toHaveText(euro('3.099,60'));
  await ageInput(page).fill('17');
  await expect(noResult(page)).toBeVisible();
  await expect(box).toBeChecked();
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/NaN|Infinity|-\d[\d.]*,\d{2}\s€/);
  await ageInput(page).fill('57');
  await expect(box).toBeChecked();
  await expect(figure(page, REINVESTED)).toHaveText(euro('3.099,60'));
  expect(await page.locator('body').innerText()).not.toMatch(/NaN|Infinity|-\d[\d.]*,\d{2}\s€/);
});

test('AC6: the checked note states the 1 January payment and the last-year exception, the unchecked one does not', async ({
  page,
}) => {
  const note = result(page).getByText(/^Hinweis: Die Zahlen sind Modellrechnungen/);
  await expect(note).toContainText('nicht im Depot gutgeschrieben');
  await expect(note).not.toContainText('1. Januar');

  await reinvestBox(page).check();
  await expect(note).toContainText('am 1. Januar des Folgejahres ins Depot eingezahlt');
  await expect(note).toContainText(
    'Die Erstattung des letzten Sparjahres wird nicht wieder angelegt',
  );
  await expect(note).toContainText('keine Anlage- oder Steuerberatung');
  await expect(note).toContainText('Anspruch auf die staatliche Zulage besteht');
  await expect(note).toContainText('Grenzsteuersatz');
  await expect(note).toContainText('Soli');
  await expect(note).toContainText('Kirchensteuer');
  await expect(note).toContainText('Das Finanzamt zahlt sie an die steuerpflichtige Person aus');
  await expect(note).toContainText('keine Steuerberatung');
  await expect(note).not.toContainText('nicht im Depot gutgeschrieben');

  await reinvestBox(page).uncheck();
  await expect(note).toContainText('nicht im Depot gutgeschrieben');
});
