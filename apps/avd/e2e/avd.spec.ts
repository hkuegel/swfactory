/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, test, type Locator, type Page } from '@playwright/test';

// Story 013 – Altersvorsorgedepot, saving phase with Zulagen. One test per AC (rebuild oracle).
// Parsing, Zulage rules, projection and chart geometry are unit-tested next to the code.
// Euro figures contain U+00A0 before the euro sign: matched with \s.

async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByRole('form', { name: 'Eingaben' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await open(page);
});

// Exact labels: "pro Jahr" is shared by several labels and rows.
const ageInput = (page: Page) => page.getByLabel('Alter heute', { exact: true });
const payoutInput = (page: Page) =>
  page.getByLabel('Auszahlungsbeginn (Lebensjahr)', { exact: true });
const monthlyInput = (page: Page) => page.getByLabel('Monatlicher Beitrag', { exact: true });
const childrenInput = (page: Page) => page.getByLabel('Kinder mit Kindergeld', { exact: true });
const returnInput = (page: Page) => page.getByLabel('Erwartete Rendite pro Jahr', { exact: true });
const costsInput = (page: Page) => page.getByLabel('Kosten pro Jahr', { exact: true });

/** The value belonging to a result label (`dt` -> following `dd`). */
const figure = (page: Page, label: string): Locator =>
  page
    .locator('dt', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
    .locator('xpath=following-sibling::dd');

const euro = (amount: string) => new RegExp(`^${amount.replace(/\./g, '\\.')}\\s€`);
const chart = (page: Page) => page.getByRole('img', { name: /^Gestapeltes Säulendiagramm/ });
const tableRows = (page: Page) => page.getByRole('table').locator('tbody tr');
const noResult = (page: Page) =>
  page.getByText('Kein Ergebnis möglich. Bitte die markierten Felder korrigieren.');

/** Cents of a displayed amount such as "-4.478,79 €" (parses the page text, not the model). */
function cents(text: string | null): number {
  const match = /^(-?)([\d.]+),(\d{2})\s€/.exec((text ?? '').trim());
  if (match === null) throw new Error(`not an amount: ${String(text)}`);
  const value = Number((match[2] ?? '').replace(/\./g, '')) * 100 + Number(match[3]);
  return match[1] === '-' ? -value : value;
}

/** Counts chart pixels within a small tolerance of each series token colour. */
async function chartSeriesPixels(page: Page) {
  const png = (await chart(page).screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(async (data) => {
    const style = getComputedStyle(document.documentElement);
    const rgb = (name: string) => {
      const probe = document.createElement('span');
      probe.style.color = style.getPropertyValue(name);
      document.body.append(probe);
      const m = /rgba?\((\d+), (\d+), (\d+)/.exec(getComputedStyle(probe).color);
      probe.remove();
      return [Number(m?.[1]), Number(m?.[2]), Number(m?.[3])];
    };
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('no 2d context');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const count = (target: number[]) => {
      let n = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (
          Math.abs((pixels[i] ?? 0) - (target[0] ?? 0)) < 12 &&
          Math.abs((pixels[i + 1] ?? 0) - (target[1] ?? 0)) < 12 &&
          Math.abs((pixels[i + 2] ?? 0) - (target[2] ?? 0)) < 12
        )
          n += 1;
      }
      return n;
    };
    return {
      contributions: count(rgb('--chart-contributions')),
      zulagen: count(rgb('--chart-zulagen')),
      returns: count(rgb('--chart-returns')),
    };
  }, png);
}

test('AC1: the title, six labelled inputs with their defaults and a result are shown on load', async ({
  page,
}) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Altersvorsorgedepot' })).toBeVisible();
  await expect(ageInput(page)).toHaveValue('40');
  await expect(payoutInput(page)).toHaveValue('65');
  await expect(monthlyInput(page)).toHaveValue('150');
  await expect(childrenInput(page)).toHaveValue('0');
  await expect(returnInput(page)).toHaveValue('5');
  await expect(costsInput(page)).toHaveValue('0,5');
  await expect(figure(page, 'Endwert')).toContainText(/\d[\d.]*,\d{2}\s€/);
  await expect(chart(page)).toBeVisible();
});

test('AC2: the yearly Zulage for 0, 9,99, 10, 30, 150 and 570 EUR per month', async ({ page }) => {
  const expected: readonly [string, string][] = [
    ['0', '0,00'],
    ['9,99', '0,00'],
    ['10', '60,00'],
    ['30', '180,00'],
    ['150', '540,00'],
    ['570', '540,00'],
  ];
  for (const [monthly, zulage] of expected) {
    await monthlyInput(page).fill(monthly);
    await expect(figure(page, 'Zulage pro Jahr'), `monthly ${monthly}`).toHaveText(euro(zulage));
  }
});

test('AC3: Kinderzulage and Berufseinsteigerbonus depend on children, age and the 120 EUR floor', async ({
  page,
}) => {
  await monthlyInput(page).fill('25');
  await childrenInput(page).fill('2');

  await ageInput(page).fill('24');
  await expect(figure(page, 'Zulage pro Jahr')).toHaveText(euro('750,00'));
  await expect(figure(page, 'Berufseinsteigerbonus (einmalig, im 1. Jahr)')).toHaveText(
    euro('200,00'),
  );
  await expect(figure(page, 'Zulage im 1. Jahr')).toHaveText(euro('950,00'));

  await ageInput(page).fill('25');
  await expect(figure(page, 'Zulage pro Jahr')).toHaveText(euro('750,00'));
  await expect(figure(page, 'Berufseinsteigerbonus (einmalig, im 1. Jahr)')).toHaveText('keiner');
  await expect(page.getByText('Zulage im 1. Jahr', { exact: true })).toHaveCount(0);

  // Below 120 EUR per year: no Zulage and no bonus, although age 24 would qualify.
  await ageInput(page).fill('24');
  await childrenInput(page).fill('1');
  await monthlyInput(page).fill('9,99');
  await expect(figure(page, 'Zulage pro Jahr')).toHaveText(euro('0,00'));
  await expect(figure(page, 'Berufseinsteigerbonus (einmalig, im 1. Jahr)')).toHaveText('keiner');
  await expect(page.getByText('Zulage im 1. Jahr', { exact: true })).toHaveCount(0);
});

test('AC4: the reference example gives the four exact figures, their sum, and is repeatable', async ({
  page,
}) => {
  const setReference = async () => {
    await ageInput(page).fill('57');
    await payoutInput(page).fill('65');
    await monthlyInput(page).fill('150');
    await childrenInput(page).fill('0');
    await returnInput(page).fill('5');
    await costsInput(page).fill('0,5');
  };
  const read = async () => ({
    own: await figure(page, 'Eigene Beiträge').innerText(),
    zulagen: await figure(page, 'Zulagen gesamt').innerText(),
    returns: await figure(page, 'Erträge').innerText(),
    end: await figure(page, 'Endwert').innerText(),
  });

  await setReference();
  await expect(figure(page, 'Eigene Beiträge')).toHaveText(euro('14.400,00'));
  await expect(figure(page, 'Zulagen gesamt')).toHaveText(euro('4.320,00'));
  await expect(figure(page, 'Erträge')).toHaveText(euro('3.536,44'));
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));
  const first = await read();
  expect(cents(first.own) + cents(first.zulagen) + cents(first.returns)).toBe(cents(first.end));

  // Another valid value, then the reference again: identical numbers.
  await monthlyInput(page).fill('200');
  await expect(figure(page, 'Eigene Beiträge')).not.toHaveText(euro('14.400,00'));
  await setReference();
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));
  expect(await read()).toEqual(first);
});

test('AC5: edits update figures, table and chart at once; table and chart text match the result', async ({
  page,
}) => {
  await ageInput(page).fill('57');
  await expect(tableRows(page)).toHaveCount(8);
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));
  await expect(chart(page)).toHaveAccessibleName(
    /bis zum Auszahlungsbeginn mit 65, Endwert 22\.256,44\s€\./,
  );
  const lastRow = tableRows(page).last();
  await expect(lastRow.locator('td').last()).toHaveText(euro('22.256,44'));
  await expect(page.getByRole('columnheader')).toHaveText([
    'Jahr',
    'Alter',
    'Eigene Beiträge',
    'Zulagen gutgeschrieben',
    'Erträge',
    'Kontostand am Jahresende',
  ]);
  // The parts of the last row sum to its balance (table text equals the figures of AC4).
  const cells = await lastRow.locator('td').allInnerTexts();
  const [own, zul, ret, bal] = cells.slice(1).map((text) => cents(text));
  expect((own ?? 0) + (zul ?? 0) + (ret ?? 0)).toBe(bal);

  // The chart really draws all three series (token-coloured pixels, not only a changed picture).
  const drawn = await chartSeriesPixels(page);
  expect(drawn.contributions).toBeGreaterThan(50);
  expect(drawn.zulagen).toBeGreaterThan(50);
  expect(drawn.returns).toBeGreaterThan(50);

  // Row 1: Zulagen come one year later.
  await expect(tableRows(page).first().locator('td').nth(2)).toHaveText(euro('0,00'));

  const before = await chart(page).screenshot({ animations: 'disabled' });
  await monthlyInput(page).fill('300');
  await expect(figure(page, 'Eigene Beiträge')).toHaveText(euro('28.800,00'));
  const during = await chart(page).screenshot({ animations: 'disabled' });
  expect(during.equals(before)).toBe(false);
  await monthlyInput(page).fill('150');
  await expect(figure(page, 'Endwert')).toHaveText(euro('22.256,44'));
  const after = await chart(page).screenshot({ animations: 'disabled' });
  expect(after.equals(before)).toBe(true);

  // Payout start 70: 13 rows, the last balance is the new end value, the chart label follows.
  await payoutInput(page).fill('70');
  await expect(tableRows(page)).toHaveCount(13);
  const end = (await figure(page, 'Endwert').innerText()).match(/\d[\d.]*,\d{2}\s€/)?.[0] ?? '';
  expect(end).not.toBe('');
  await expect(tableRows(page).last().locator('td').last()).toHaveText(end);
  await expect(chart(page)).toHaveAccessibleName(
    new RegExp(`mit 70, Endwert ${end.replace(/\./g, '\\.')}`),
  );
});

test('AC6: invalid input names field and range, marks it invalid and replaces result, table and chart', async ({
  page,
}) => {
  const cases: readonly [() => Locator, string, RegExp][] = [
    [() => ageInput(page), '', /Alter heute: Wert fehlt\. Erlaubt: 18 bis 69 Jahre\./],
    [() => ageInput(page), 'abc', /Alter heute: keine gültige Zahl\. Erlaubt: 18 bis 69 Jahre\./],
    [
      () => ageInput(page),
      '17',
      /Alter heute: Wert außerhalb des erlaubten Bereichs\. Erlaubt: 18 bis 69 Jahre\./,
    ],
    [() => ageInput(page), '40,5', /Alter heute: keine gültige Zahl/],
    [
      () => monthlyInput(page),
      '600',
      /Monatlicher Beitrag: Wert außerhalb des erlaubten Bereichs\. Erlaubt: 0 bis 570,00 € pro Monat\./,
    ],
    [() => monthlyInput(page), '-5', /Monatlicher Beitrag: Wert außerhalb/],
    [
      () => childrenInput(page),
      '11',
      /Kinder mit Kindergeld: Wert außerhalb des erlaubten Bereichs\. Erlaubt: 0 bis 10 Kinder \(ganze Zahl\)\./,
    ],
    [
      () => returnInput(page),
      '20,01',
      /Erwartete Rendite pro Jahr: Wert außerhalb des erlaubten Bereichs/,
    ],
    [
      () => costsInput(page),
      '1,01',
      /Kosten pro Jahr: Wert außerhalb des erlaubten Bereichs\. Erlaubt: 0,00 bis 1,00 %/,
    ],
  ];
  for (const [field, value, message] of cases) {
    await field().fill(value);
    await expect(field(), `value "${value}"`).toHaveAttribute('aria-invalid', 'true');
    await expect(field()).toHaveAccessibleDescription(message);
    await expect(page.getByText(message)).toBeVisible();
    await expect(noResult(page)).toBeVisible();
    await expect(figure(page, 'Endwert')).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(chart(page)).toHaveCount(0);
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/NaN|Infinity/);
    // Fixing the value brings everything back.
    await field().fill(await defaultOf(field()));
    await expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    await expect(figure(page, 'Endwert')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(chart(page)).toBeVisible();
  }

  // Payout start not after the age (both fields valid on their own).
  await ageInput(page).fill('66');
  await expect(payoutInput(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(payoutInput(page)).toHaveAccessibleDescription(
    /Auszahlungsbeginn \(Lebensjahr\): muss später liegen als das heutige Alter \(66 Jahre\)\. Erlaubt: 65 bis 70 Jahre\./,
  );
  await expect(noResult(page)).toBeVisible();
  await expect(figure(page, 'Endwert')).toHaveCount(0);
  await payoutInput(page).fill('67');
  await expect(figure(page, 'Endwert')).toBeVisible();
});

/** Default text of an input, by its label. */
async function defaultOf(field: Locator): Promise<string> {
  const label =
    (await field.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.textContent ?? '')) ?? '';
  const defaults: Record<string, string> = {
    'Alter heute': '40',
    'Auszahlungsbeginn (Lebensjahr)': '65',
    'Monatlicher Beitrag': '150',
    'Kinder mit Kindergeld': '0',
    'Erwartete Rendite pro Jahr': '5',
    'Kosten pro Jahr': '0,5',
  };
  const value = defaults[label];
  if (value === undefined) throw new Error(`unknown field ${label}`);
  return value;
}

test('AC7: keyboard reaches every labelled input, errors are descriptions, the live region follows after a pause', async ({
  page,
}) => {
  // Reload under a fake clock so the 700 ms debounce can be crossed deterministically.
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));

  const inputs = [ageInput, payoutInput, monthlyInput, childrenInput, returnInput, costsInput];
  await ageInput(page).focus();
  await page.keyboard.press('Shift+Tab'); // leave the form backwards, then tab through it
  for (const input of inputs) {
    const target = input(page);
    for (
      let i = 0;
      i < 12 && !(await target.evaluate((el) => el === document.activeElement));
      i += 1
    ) {
      await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
    await expect(target).toHaveAccessibleName(/\S/);
  }

  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveCount(1);
  await expect(live).toBeEmpty();

  await monthlyInput(page).fill('200');
  await page.clock.runFor(300);
  await expect(live).toBeEmpty();
  await page.clock.runFor(500);
  await expect(live).toHaveText(/^Endwert bei Auszahlungsbeginn mit 65: [\d.]+,\d{2}\s€\.$/);

  await ageInput(page).fill('17');
  await page.clock.runFor(800);
  await expect(live).toHaveText('Kein Ergebnis: Alter heute ist ungültig.');
  await expect(ageInput(page)).toHaveAccessibleDescription(/Alter heute: Wert außerhalb/);
});

test('AC8: the model note is shown next to the result and no recommendation is made', async ({
  page,
}) => {
  const note = page.getByText(/^Hinweis: Die Zahlen sind Modellrechnungen/);
  await expect(note).toBeVisible();
  await expect(note).toContainText('keine Anlage- oder Steuerberatung');
  await expect(note).toContainText('Anspruch auf die staatliche Zulage besteht');
  // Same section as the figures.
  await expect(
    page.getByRole('region', { name: 'Ergebnis' }).getByText(/Modellrechnungen/),
  ).toBeVisible();
});

test.describe('narrow screen', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('AC5: at 375 px the page does not scroll sideways, even for 52 saving years', async ({
    page,
  }) => {
    await ageInput(page).fill('18');
    await payoutInput(page).fill('70');
    await monthlyInput(page).fill('570');
    await expect(tableRows(page)).toHaveCount(52);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
