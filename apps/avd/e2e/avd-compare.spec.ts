/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';
import {
  ageInput,
  allowanceBox,
  cents,
  childrenInput,
  compareDifference,
  compareFigure,
  comparison,
  costsInput,
  depotBlock,
  euro,
  expectSavingUnchanged,
  monthlyInput,
  noResult,
  open,
  payoutInput,
  rateInput,
  reinvestBox,
  retirementInput,
  returnInput,
  savingSnapshot,
  setReference,
} from './avd.helpers.ts';

// Story 016 – comparison of the Altersvorsorgedepot with a normal ETF depot. One test per AC
// (rebuild oracle); reference values from the Technical design. Branching tax logic (FIFO, the
// 1/12 rule, Variante A netting, the payout annuity) is unit-tested in logic/*.test.ts.

const DEPOT = 'Depotwert bei Auszahlungsbeginn';
const TAX = 'Steuern gesamt';
const NET = 'Ausgezahlt nach allen Steuern';
const MONTHLY = 'Netto-Auszahlung pro Monat (Durchschnitt)';
const OWN = 'Eigene Beiträge';
const YIELD = 'Ertrag nach Steuer';
const AVD_AHEAD = 'Das Altersvorsorgedepot liegt vorn.';
const ETF_AHEAD = 'Das ETF-Depot liegt vorn.';

test.beforeEach(async ({ page }) => {
  await open(page);
});

const note = (page: Page) => comparison(page).getByText(/^Hinweis zum Vergleich:/);
const verdict = (page: Page, text: string) => comparison(page).getByText(text, { exact: true });

/** R0 of the story: age 57, payout 65, 150 EUR, 0 children, 0 % / 0 %, marginal 30 %, retirement 20 %. */
async function setR0(page: Page) {
  await ageInput(page).fill('57');
  await payoutInput(page).fill('65');
  await monthlyInput(page).fill('150');
  await childrenInput(page).fill('0');
  await returnInput(page).fill('0');
  await costsInput(page).fill('0');
  await rateInput(page).fill('30');
  await retirementInput(page).fill('20');
}

/** The AC8/AC12 setup: age 40, payout 65, 570 EUR, 5 %, 0,5 %. */
async function setAge40(page: Page) {
  await ageInput(page).fill('40');
  await payoutInput(page).fill('65');
  await monthlyInput(page).fill('570');
  await returnInput(page).fill('5');
  await costsInput(page).fill('0,5');
}

async function expectFigures(page: Page, depot: 'AVD' | 'ETF', figures: Record<string, string>) {
  for (const [label, amount] of Object.entries(figures)) {
    await expect(compareFigure(page, depot, label), `${depot} ${label}`).toHaveText(euro(amount));
  }
}

const blockText = (page: Page, depot: 'AVD' | 'ETF') => depotBlock(page, depot).innerText();

test('AC1: the retirement rate and the Pauschbetrag box are there with their defaults, the comparison shows at once and 013–015 stay unchanged', async ({
  page,
}) => {
  await expect(retirementInput(page)).toHaveValue('20');
  await expect(retirementInput(page)).toHaveAccessibleDescription(
    /Soli und Kirchensteuer, 0 bis 50 %/,
  );
  await expect(allowanceBox(page)).toBeChecked();
  await expect(comparison(page)).toBeVisible();
  await expect(compareFigure(page, 'AVD', YIELD)).toHaveText(euro('85.916,78'));
  await expect(compareFigure(page, 'ETF', YIELD)).toHaveText(euro('71.613,71'));
  await expect(compareDifference(page)).toHaveText(euro('14.303,07'));

  const before = await savingSnapshot(page);
  await retirementInput(page).fill('35');
  await allowanceBox(page).uncheck();
  // Non-vacuous: the comparison did move.
  await expect(compareFigure(page, 'AVD', YIELD)).not.toHaveText(euro('85.916,78'));
  await expect(compareFigure(page, 'ETF', YIELD)).not.toHaveText(euro('71.613,71'));
  await expectSavingUnchanged(page, before);
});

test('AC2: R0 pays out from 65 to 85 in 240 payouts; AVD yield 1.872,00, ETF 0,00', async ({
  page,
}) => {
  await setR0(page);
  await expect(
    comparison(page).getByText(/von 65 bis 85 in 240 monatlichen Auszahlungen/),
  ).toBeVisible();
  await expectFigures(page, 'AVD', {
    [DEPOT]: '18.720,00',
    [TAX]: '3.744,00',
    [NET]: '14.976,00',
    [OWN]: '14.400,00',
    [MONTHLY]: '62,40',
    [YIELD]: '1.872,00',
  });
  await expectFigures(page, 'ETF', {
    [DEPOT]: '14.400,00',
    [TAX]: '0,00',
    [NET]: '14.400,00',
    [OWN]: '14.400,00',
    [MONTHLY]: '60,00',
    [YIELD]: '0,00',
  });
  await expect(compareDifference(page)).toHaveText(euro('1.872,00'));
  await expect(verdict(page, AVD_AHEAD)).toBeVisible();
});

test('AC3: the retirement rate moves only the AVD side: 0 / 20 / 50 % give 5.616,00 / 1.872,00 / -3.744,00', async ({
  page,
}) => {
  await setR0(page);
  const etfAt20 = await blockText(page, 'ETF');
  const savingAt20 = await savingSnapshot(page);
  const cases = [
    ['0', '5.616,00', AVD_AHEAD],
    ['20', '1.872,00', AVD_AHEAD],
    ['50', '-3.744,00', ETF_AHEAD],
  ] as const;
  for (const [rate, amount, wording] of cases) {
    await retirementInput(page).fill(rate);
    await expect(compareFigure(page, 'AVD', YIELD), `rate ${rate}`).toHaveText(euro(amount));
    await expect(compareDifference(page), `rate ${rate}`).toHaveText(euro(amount));
    await expect(verdict(page, wording), `rate ${rate}`).toBeVisible();
    expect(await blockText(page, 'ETF'), `rate ${rate}`).toBe(etfAt20);
    await expectSavingUnchanged(page, savingAt20);
  }
});

test('AC4: at 570 EUR only the subsidised 18.720,00 is taxed and the AVD block states the assumption', async ({
  page,
}) => {
  await setR0(page);
  await monthlyInput(page).fill('570');
  await expectFigures(page, 'AVD', {
    [DEPOT]: '59.040,00',
    [TAX]: '3.744,00',
    [NET]: '55.296,00',
    [YIELD]: '1.872,00',
  });
  await expectFigures(page, 'ETF', { [DEPOT]: '54.720,00', [YIELD]: '0,00' });
  await expect(
    depotBlock(page, 'AVD').getByText(/^Annahme, noch nicht durch BMF geklärt/),
  ).toBeVisible();
});

test('AC5: reinvested refunds are unsubsidised and untaxed; the last refund still counts', async ({
  page,
}) => {
  await setR0(page);
  const etfUnchecked = await blockText(page, 'ETF');
  await reinvestBox(page).check();
  await expectFigures(page, 'AVD', {
    [DEPOT]: '19.854,00',
    [TAX]: '3.744,00',
    [NET]: '16.110,00',
    [OWN]: '14.400,00',
    [YIELD]: '1.872,00',
  });
  expect(await blockText(page, 'ETF')).toBe(etfUnchecked);

  await reinvestBox(page).uncheck();
  await expectFigures(page, 'AVD', { [DEPOT]: '18.720,00', [NET]: '14.976,00' });
});

test('AC6: one saving year from 69 to 70 pays out 180 times, with the reinvest box off and on', async ({
  page,
}) => {
  await setR0(page);
  await payoutInput(page).fill('70');
  await ageInput(page).fill('69');
  for (const reinvest of [false, true]) {
    await reinvestBox(page).setChecked(reinvest);
    await expect(
      comparison(page).getByText(/von 70 bis 85 in 180 monatlichen Auszahlungen/),
    ).toBeVisible();
    await expectFigures(page, 'AVD', {
      [DEPOT]: '2.340,00',
      [TAX]: '468,00',
      [NET]: '1.872,00',
      [MONTHLY]: '10,40',
      [OWN]: '1.800,00',
      [YIELD]: '234,00',
    });
    await expectFigures(page, 'ETF', {
      [DEPOT]: '1.800,00',
      [TAX]: '0,00',
      [MONTHLY]: '10,00',
      [YIELD]: '0,00',
    });
    await expect(compareDifference(page), `reinvest ${String(reinvest)}`).toHaveText(
      euro('234,00'),
    );
  }
});

test('AC7: the balance earns during payout; losses give no tax, negative yields and no NaN', async ({
  page,
}) => {
  const read = async (depot: 'AVD' | 'ETF', label: string) =>
    cents(await compareFigure(page, depot, label).innerText());
  const expectClean = async () => {
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/NaN|Infinity/);
    for (const depot of ['AVD', 'ETF'] as const) {
      for (const label of [DEPOT, NET, MONTHLY]) {
        expect(await read(depot, label), `${depot} ${label}`).toBeGreaterThanOrEqual(0);
      }
    }
  };

  await setReference(page);
  await retirementInput(page).fill('0');
  await expect(compareFigure(page, 'AVD', NET)).toHaveText(euro('33.464,75'));
  expect(await read('AVD', NET)).toBeGreaterThan(await read('AVD', DEPOT));
  expect(await read('AVD', DEPOT)).toBe(2225644);
  expect((await read('ETF', NET)) + (await read('ETF', TAX))).toBeGreaterThan(
    await read('ETF', DEPOT),
  );

  await returnInput(page).fill('-10');
  await expect(compareFigure(page, 'ETF', TAX)).toHaveText(euro('0,00'));
  await expect(compareFigure(page, 'ETF', YIELD)).toHaveText(euro('-11.791,16'));
  expect(await read('ETF', YIELD)).toBeLessThan(0);
  await expectClean();

  await setR0(page);
  await expect(compareFigure(page, 'AVD', YIELD)).toHaveText(euro('1.872,00'));
  await expectClean();
});

test('AC8: the ETF is taxed with the capital gains tax, not the retirement rate', async ({
  page,
}) => {
  await setAge40(page);
  await retirementInput(page).fill('20');
  await expect(compareFigure(page, 'ETF', TAX)).toHaveText(euro('43.977,43'));
  const etfAt20 = await blockText(page, 'ETF');
  const cases = [
    ['0', '335.054,82'],
    ['20', '259.853,86'],
    ['50', '147.052,41'],
  ] as const;
  for (const [rate, avdYield] of cases) {
    await retirementInput(page).fill(rate);
    await expect(compareFigure(page, 'AVD', YIELD), `rate ${rate}`).toHaveText(euro(avdYield));
    expect(await blockText(page, 'ETF'), `rate ${rate}`).toBe(etfAt20);
  }
});

test('AC9: an invalid retirement rate (or any invalid field) replaces result and comparison by the hint', async ({
  page,
}) => {
  for (const text of ['', 'abc', '-1', '20,001', '50,01']) {
    await retirementInput(page).fill(text);
    await expect(retirementInput(page), `"${text}"`).toHaveAttribute('aria-invalid', 'true');
    await expect(retirementInput(page), `"${text}"`).toHaveAccessibleDescription(
      /Steuersatz im Ruhestand: .*Erlaubt: 0,00 bis 50,00 %/,
    );
    await expect(noResult(page), `"${text}"`).toBeVisible();
    await expect(comparison(page), `"${text}"`).toHaveCount(0);
    expect(await page.locator('main').innerText()).not.toMatch(/NaN|Infinity/);
  }

  await retirementInput(page).fill('20');
  await expect(comparison(page)).toBeVisible();
  await ageInput(page).fill('17');
  await expect(noResult(page)).toBeVisible();
  await expect(comparison(page)).toHaveCount(0);
  await ageInput(page).fill('40');
  await expect(comparison(page)).toBeVisible();
});

test('AC10: keyboard reaches the rate and the box, they are labelled and described, and the difference is announced after a pause', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));

  const tabTo = async (target: ReturnType<typeof retirementInput>) => {
    for (
      let i = 0;
      i < 12 && !(await target.evaluate((el) => el === document.activeElement));
      i += 1
    ) {
      await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
  };

  await reinvestBox(page).focus();
  await tabTo(retirementInput(page));
  await expect(retirementInput(page)).toHaveAccessibleName('Steuersatz im Ruhestand');
  await expect(retirementInput(page)).toHaveAccessibleDescription(/Soli/);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('51');
  await expect(retirementInput(page)).toHaveAccessibleDescription(
    /Steuersatz im Ruhestand: Wert außerhalb/,
  );
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('20');
  await expect(retirementInput(page)).not.toHaveAttribute('aria-invalid', 'true');

  await tabTo(allowanceBox(page));
  await expect(allowanceBox(page)).toHaveAccessibleName(
    'Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen',
  );
  await page.keyboard.press('Space');
  await expect(allowanceBox(page)).not.toBeChecked();
  await expect(allowanceBox(page)).toBeFocused();

  // Defaults with the Pauschbetrag off: the AVD is 22.602,52 ahead.
  const live = page.locator('[aria-live="polite"]');
  await page.clock.runFor(600);
  await expect(live).toBeEmpty();
  await page.clock.runFor(200);
  await expect(live).toHaveText(
    /^Endwert bei Auszahlungsbeginn mit 65: .* Vergleich mit dem ETF-Depot, Ertrag nach Steuer: Das Altersvorsorgedepot liegt um 22\.602,52\s€ vorn\.$/,
  );
});

test('AC11: the comparison note states the model, the ETF taxes, the assumption and what is not modelled', async ({
  page,
}) => {
  const text = note(page);
  await expect(text).toBeVisible();
  for (const part of [
    'keine Anlage- oder Steuerberatung',
    'denselben Monatsbeitrag, dieselbe Rendite und dieselben Kosten',
    'bis zum Alter von 85 in gleich hohen Monatsraten ganz ausgezahlt',
    'verglichen wird der Ertrag nach Steuer',
    'keine Zulage und keine Steuererstattung',
    '26,375 %',
    '25 % Abgeltungsteuer plus 5,5 % Soli, ohne Kirchensteuer',
    '30 % Teilfreistellung',
    'Basiszins von 3,20 %',
    'Sparer-Pauschbetrag von 1.000 € pro Jahr ist für das ETF-Depot angesetzt.',
    'mit dem eingegebenen Satz für den Ruhestand',
    'nur auf seinen Gewinn (Annahme, noch nicht durch BMF geklärt)',
    'zählen nominal zum Ertrag des Altersvorsorgedepots',
    'Inflation',
    'Kirchensteuer beim ETF-Depot',
    'Zusammenveranlagung',
    '30-%-Einmalauszahlung',
    'eine lebenslange Rente',
    'Günstigerprüfung der Abgeltungsteuer',
    'Kranken- und Pflegeversicherungsbeiträge',
  ]) {
    await expect(text, part).toContainText(part);
  }
  await expect(text).not.toContainText('nicht angesetzt');

  await allowanceBox(page).uncheck();
  await expect(text).toContainText(
    'Sparer-Pauschbetrag von 1.000 € pro Jahr ist für das ETF-Depot nicht angesetzt.',
  );
});

test('AC12: without the Pauschbetrag the ETF pays more tax; the AVD and both depot values stay; no gain, no change', async ({
  page,
}) => {
  await setAge40(page);
  await expect(compareFigure(page, 'ETF', TAX)).toHaveText(euro('43.977,43'));
  await expect(compareFigure(page, 'ETF', YIELD)).toHaveText(euro('251.094,40'));
  const avdChecked = await blockText(page, 'AVD');
  const etfDepotChecked = await compareFigure(page, 'ETF', DEPOT).innerText();
  const etfChecked = await blockText(page, 'ETF');

  await allowanceBox(page).uncheck();
  await expect(compareFigure(page, 'ETF', TAX)).toHaveText(euro('54.477,64'));
  await expect(compareFigure(page, 'ETF', YIELD)).toHaveText(euro('240.594,19'));
  expect(cents(await compareFigure(page, 'ETF', TAX).innerText())).toBeGreaterThan(4397743);
  expect(cents(await compareFigure(page, 'ETF', YIELD).innerText())).toBeLessThan(25109440);
  expect(await blockText(page, 'AVD')).toBe(avdChecked);
  expect(await compareFigure(page, 'ETF', DEPOT).innerText()).toBe(etfDepotChecked);
  await expect(note(page)).toContainText('ist für das ETF-Depot nicht angesetzt.');

  await allowanceBox(page).check();
  expect(await blockText(page, 'ETF')).toBe(etfChecked);

  await setR0(page);
  await expect(compareFigure(page, 'AVD', YIELD)).toHaveText(euro('1.872,00'));
  const figuresOf = async () => (await comparison(page).locator('dl').allInnerTexts()).join('\n');
  const r0Checked = await figuresOf();
  await allowanceBox(page).uncheck();
  await expect(note(page)).toContainText('nicht angesetzt');
  expect(await figuresOf()).toBe(r0Checked);
});
