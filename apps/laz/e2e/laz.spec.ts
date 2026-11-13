/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, test, type Locator } from '@playwright/test';
import {
  amountInput,
  cellByHeader,
  fixtureAsOf,
  fixtureFunds,
  euro,
  figure,
  fundInput,
  fundTable,
  germanDate,
  liveRegion,
  open,
  phaseEndInput,
  phaseStartInput,
  result,
  resultText,
  rowByHeader,
  yearTable,
} from './laz.helpers.ts';

// Story 024 – iBonds payout phase. One test per visible AC (rebuild oracle).
// Parsing branches and the projection formula (AC1, AC4) and the round trip (AC3) are unit-tested
// next to the logic, so they are not repeated here. Euro figures contain U+00A0: matched with \s.
// Hand oracles, recomputed from the data file (spans asOf 2026-12-31 → 31.12. of the fund year):
//   2028 d=731 ρ=1,040456 · 38,00 = 39,5373 | 2029 d=1096 ρ=1,076963 · 40,00 = 43,0785 |
//   2030 d=1461 ρ=1,125600 · 42,00 = 47,2752 | 2031 d=1826 ρ=1,187798 · 44,00 = 52,2631 |
//   2032 d=2192 ρ=1,265591 · 46,00 = 58,2172 | 2033 d=2557 ρ=1,361190 · 48,00 = 65,3371 |
//   2034 d=2922 ρ=1,477850 · 50,00 = 73,8925.
// Phase 1.1.2028 – 31.3.2034 (2028 has no funding fund): F = 55,125236, so depot 10.000,00 EUR
// gives 18.140,512 cents per month, total 1.142.852 cents = 11.428,52 EUR over 6 funded years.

test.beforeEach(async ({ page }) => {
  await open(page);
});

test('AC2: the year overview reports the missing 2028 with no amount and funds each year with the December liquidation of the year before', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2034');
  await amountInput(page).fill('10000,00');

  // UX §5: the caption names the phase period so a missing year reads in context. Review round 1,
  // finding 3: it names the two phase MONTHS (no day, since a day would have to be invented), so the
  // assertion pins the two month names in start – end order. The names are the test's own oracle
  // (German month names of the phase months 2028-01 and 2034-03), not a copy of `formatMonth`.
  const names = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  const monthName = (isoMonth: string): string => {
    const parts = isoMonth.split('-').map(Number);
    const year = parts[0] ?? 0;
    const month = parts[1] ?? 1;
    return `${names[(month - 1) % 12] ?? ''} ${String(year)}`;
  };
  const caption = await yearTable(page).locator('caption').innerText();
  const startName = monthName('2028-01');
  const endName = monthName('2034-03');
  expect(caption, 'caption names the phase start month').toContain(startName);
  expect(caption, 'caption names the phase end month').toContain(endName);
  expect(caption.indexOf(endName), 'caption lists start month before end month').toBeGreaterThan(
    caption.indexOf(startName),
  );
  expect(caption, 'caption names months, not days').not.toMatch(/\d{2}\.\d{2}\.\d{4}/);

  const cell = async (row: Locator, header: string): Promise<Locator> =>
    cellByHeader(yearTable(page), row, header);

  // 2028: reported as missing, and no amount invented for it (open question 3).
  const row2028 = rowByHeader(yearTable(page), '2028');
  await expect(await cell(row2028, 'Monate')).toHaveText('12');
  await expect(await cell(row2028, 'Finanzierung durch Fonds')).toHaveText(
    'kein Fonds für dieses Jahr',
  );
  const amount2028 = await cell(row2028, 'Betrag für das Jahr');
  await expect(amount2028).toHaveText('–');
  await expect(amount2028).not.toHaveText(euro('0,00'));

  // 2029–2034: each year names the fund liquidated in December of the year before.
  for (const phaseYear of [2029, 2030, 2031, 2032, 2033, 2034]) {
    const row = rowByHeader(yearTable(page), String(phaseYear));
    const months = phaseYear === 2034 ? '3' : '12'; // only the phase months of a partly covered year
    await expect(await cell(row, 'Monate'), `year ${phaseYear}`).toHaveText(months);
    await expect(await cell(row, 'Finanzierung durch Fonds'), `year ${phaseYear}`).toHaveText(
      `Fonds ${String(phaseYear - 1)} (Auflösung Dezember ${String(phaseYear - 1)})`,
    );
    await expect(await cell(row, 'Betrag für das Jahr'), `year ${phaseYear}`).toHaveText(
      phaseYear === 2034 ? euro('544,22') : euro('2.176,86'),
    );
  }

  // Only the years with a funding fund count in the sum: 6 years, 63 phase months.
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('181,41'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('11.428,52'));

  // N = 1 (first and last phase year are the same year, one month): funded by fund 2029, d = 1096,
  // so 1000000 / (1 / 1,076963) = 1.076.963,48 cents.
  await phaseStartInput(page).fill('01.01.2030');
  await phaseEndInput(page).fill('31.01.2030');
  await expect(yearTable(page).locator('tbody tr')).toHaveCount(1);
  const single = rowByHeader(yearTable(page), '2030');
  await expect(await cell(single, 'Monate')).toHaveText('1');
  await expect(await cell(single, 'Finanzierung durch Fonds')).toHaveText(
    'Fonds 2029 (Auflösung Dezember 2029)',
  );
  await expect(await cell(single, 'Betrag für das Jahr')).toHaveText(euro('10.769,63'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('10.769,63'));

  await expect(
    page.getByText(
      'Jedes Phase-Jahr wird durch die Auflösung des Fonds im Dezember des Vorjahres finanziert. Ein Jahr ohne Fonds wird ohne Betrag gezeigt und zählt nicht in der Summe.',
      { exact: true },
    ),
  ).toBeVisible();
});

test('AC5: the projection label is the accessible description of the figures, names the asOf from the data file, and an override is marked', async ({
  page,
}) => {
  // Finding 6 as resolved (ADR 0013): `asOf` belongs to the file, not to a fund, so the helper reads
  // the top-level value. The displayed string stays `Stand der Daten: 31.12.2026.`: the hand value is
  // pinned, and the shown date is compared with the file's own `asOf` so it cannot be a copy of itself.
  const fileAsOf = fixtureAsOf();
  expect(fileAsOf, 'committed data file asOf (hand value)').toBe('2026-12-31');
  const label = `Diese Beträge sind eine Hochrechnung aus YTM und NAV und kein veröffentlichter Marktwert. Stand der Daten: ${germanDate(fileAsOf)}.`;

  // AC5's claim: the date the page shows is the file-level asOf, read back from the page (risk 2:
  // the app formats it from the parts, and so does this oracle).
  const labelLine = await page
    .getByRole('region', { name: 'Fondsplan', exact: true })
    .locator('p')
    .filter({ hasText: 'Stand der Daten:' })
    .first()
    .innerText();
  const matches = labelLine.match(/\d{2}\.\d{2}\.\d{4}/) ?? [];
  const shown = matches[0] ?? '';
  expect(shown, 'shown date equals the file-level asOf').toBe(germanDate(fileAsOf));
  expect(shown, 'the displayed date stays the hand value 31.12.2026').toBe('31.12.2026');

  await expect(page.getByRole('region', { name: 'Fondsplan', exact: true })).toContainText(label);

  // Every projection figure of the column carries the label as its accessible description (AC5).
  for (const fund of fixtureFunds()) {
    const cell = await cellByHeader(
      fundTable(page),
      rowByHeader(fundTable(page), String(fund.year)),
      'Hochrechnung je Anteil in Euro',
    );
    await expect(
      cell.locator('[aria-describedby]'),
      `row ${fund.year}`,
    ).toHaveAccessibleDescription(label);
  }

  // An override marks the field and changes the figure; the same value as the data file does not.
  const nav2030 = fundInput(page, 'nav', 2030);
  const figure2030 = (
    await cellByHeader(
      fundTable(page),
      rowByHeader(fundTable(page), '2030'),
      'Hochrechnung je Anteil in Euro',
    )
  ).locator('[aria-describedby]');
  await expect(figure2030).toHaveText(euro('47,28'));
  // The text is typed differently ('42,0' parses to the same 4200 cents) so the change handler
  // really runs: `fill` with the value the cell already shows does not fire onChange, and the
  // marker assertion would pass without the comparison ever being made.
  await nav2030.fill('42,0'); // equals the data file value: no marker
  await expect(nav2030).not.toHaveAccessibleDescription(/Wert vom Nutzer eingegeben/);
  await nav2030.fill('40,00'); // 40,00 · 1,125600 = 45,0240
  await expect(nav2030).toHaveAccessibleDescription(/Wert vom Nutzer eingegeben/);
  await expect(figure2030).toHaveText(euro('45,02'));
});

test('AC6: a guest session makes no request of its own, writes nothing to storage, and changes the result only on input', async ({
  page,
  context,
}) => {
  const requests: { url: string; type: string }[] = [];
  page.on('request', (request) => {
    requests.push({ url: request.url(), type: request.resourceType() });
  });

  await open(page);

  const liveText = async (): Promise<string> => (await liveRegion(page).textContent()) ?? '';
  // UX §4: the region is mounted empty and announces nothing before the first edit.
  await expect(liveText()).resolves.toBe('');

  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2034');
  await amountInput(page).fill('10000,00');
  await page.getByRole('checkbox', { name: 'Steuer auf den Gewinn anwenden', exact: true }).check();
  await page.getByLabel('Steuersatz in Prozent', { exact: true }).fill('25');
  await fundInput(page, 'nav', 2030).fill('40,00');

  const origin = new URL(page.url()).origin;
  const foreign = requests.filter((r) => new URL(r.url).origin !== origin);
  expect(foreign).toEqual([]);
  // No request of the app's own: only its bundle and static files are loaded.
  expect(requests.filter((r) => r.type === 'xhr' || r.type === 'fetch')).toEqual([]);
  // The data file reaches the app as a build-time import (ADR 0013), so no `fund-list.json` request is
  // asserted here: that holds only on the dev server, while a built site bundles the values
  // (finding 9). What holds in both modes is that no request of its own is made and the rows shown
  // come from the fixture copy, which this test reads from disk and which the app is built with in
  // `--mode e2e` (story 025).
  const shownYears = await fundTable(page).locator('tbody tr th').allInnerTexts();
  expect(shownYears).toEqual(fixtureFunds().map((fund) => String(fund.year)));

  // Nothing written, measured after a full interaction (risk 5), not only on load.
  const storage = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
  }));
  expect(storage).toEqual({ local: 0, session: 0, cookie: '' });
  expect(await page.evaluate(async () => (await indexedDB.databases()).length)).toBe(0);
  expect(await context.cookies()).toEqual([]);

  // The announced text is the UX §4 wording with the hand-oracle figures for this state: tax 25 %
  // gives F = 56,844419 → 17.591,876 cents per month (175,92 €) and 1.108.288 cents for the 63
  // phase months (11.082,88 €); the NAV override does not change F, because F uses the payout
  // factor per euro. Asserting the announced string against the oracle, not against the visible
  // figures, is what keeps the live region from being a copy of them.
  await page.waitForTimeout(900); // past the 700 ms live-region delay
  await expect(liveText()).resolves.toMatch(
    /^Maximale monatliche Auszahlung: 175,92\s€\. Summe der finanzierten Jahre: 11\.082,88\s€\.$/,
  );

  // Only an input changes the result: double clicks, keyboard-only focus moves and the debounce
  // must move neither the visible figures nor the announced text.
  const before = await resultText(page);
  const beforeLive = await liveText();
  await result(page).dblclick();
  await amountInput(page).dblclick();
  await page.keyboard.press('Escape');
  await amountInput(page).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900); // past the 700 ms live-region delay
  expect(await resultText(page)).toBe(before);
  expect(await liveText()).toBe(beforeLive);

  await amountInput(page).fill('12000,00');
  await page.waitForTimeout(900);
  expect(await resultText(page)).not.toBe(before);
  await expect(liveText()).resolves.toMatch(
    /^Maximale monatliche Auszahlung: 211,10\s€\. Summe der finanzierten Jahre: 13\.299,46\s€\.$/,
  );
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

// Story 030 – no invented maximum in a money field. Hand oracles for the same fixture and the same
// phase, with F = 55,125236 (tax off), recomputed here by hand in cents:
//   depot 250.000,00 € = 25.000.000 cents → 25.000.000 / F = 453.512,799 cents = 4.535,13 €, and the
//   63 funded phase months give 28.571.306,347 cents = 285.713,06 €.
//   monthly target 12.000,00 € = 1.200.000 cents → 1.200.000 × F = 66.150.282,98 cents = 661.502,83 €,
//   and 1.200.000 · 63 = 75.600.000 cents = 756.000,00 € for the sum.
// Both are above the maximum 024 had (depot 200.000,00 €, target 10.000,00 €), so the test is the
// case that the old bound refused. The digits bound is 2^53 − 1 = 9007199254740991 units.
test('030 AC1: an amount above the maximum 024 had is accepted and used for the result', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2034');
  const depot = amountInput(page);
  await depot.fill('250000,00');

  await expect(depot, 'no error for a depot above the old maximum').not.toHaveAttribute(
    'aria-invalid',
  );
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('4.535,13'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('285.713,06'));

  // The other direction, on the monthly target above 024's maximum.
  await page.getByRole('radio', { name: 'Auszahlung gegeben, Depot gesucht' }).check();
  const target = page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true });
  await target.fill('12000,00');
  await expect(target).not.toHaveAttribute('aria-invalid');
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('661.502,83'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('756.000,00'));
});

test('030 AC2, AC3: the error names the rule of the unit, and the copy quotes no maximum amount', async ({
  page,
}) => {
  const depot = amountInput(page);
  // One unit above what a Number holds exactly in Cent: 9007199254740991 Cent is 90.071.992.547.409,91 €
  // and is accepted, so this input is refused for the reason of the unit. The expected strings are the
  // hand oracle of the test.
  await depot.fill('90071992547409,92');
  await expect(depot).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByText(
      'Depot am Anfang der Phase (EUR): Wert ist keine ganze Anzahl Cent. Erlaubt: 0 € oder mehr, höchstens 2 Nachkommastellen, Wert muss eine ganze Anzahl Cent sein (bis 9.007.199.254.740.991 Cent).',
      { exact: true },
    ),
  ).toBeVisible();

  // AC3: the hint states the same rule, and the amount 024 quoted is gone from the copy.
  await expect(
    page.getByText(
      '0 € oder mehr, höchstens 2 Nachkommastellen; der Wert muss eine ganze Anzahl Cent sein.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText(/200\.000,00|10\.000,00/)).toHaveCount(0);

  // The largest value that is still exact in the unit is accepted, so the same field shows no error.
  await depot.fill('90071992547409,91');
  await expect(depot).not.toHaveAttribute('aria-invalid');
});

// Story 033 – the phase fields have no range and take the short month form. Hand oracle for the phase
// outside the fund list: the fund list covers 2028–2034, so a phase in 2026 has no funding fund for any
// year. The shown total of 0,00 € is asserted at logic level in `phase.test.ts`; here the UI shows the
// no-funding callout (UX §2), so the visible claim is that no year is dropped from the table.
test('033 AC1, AC2: a phase outside the fund list keeps every year, the short month form is accepted, and a partial month names no error', async ({
  page,
}) => {
  const start = phaseStartInput(page);
  const end = phaseEndInput(page);

  // AC2 while typing: `13.` is not a complete input, so nothing is marked, and a complete input that is
  // not a real month is. The hand error string is the copy of the field.
  await start.fill('13.');
  await expect(start).not.toHaveAttribute('aria-invalid');
  await expect(start).not.toHaveAccessibleDescription(/kein gültiges Datum/);
  await start.fill('13.2028');
  await expect(start).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByText(
      'Phase Beginn (Monat): kein gültiges Datum. Erlaubt: Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein.',
      { exact: true },
    ),
  ).toBeVisible();

  // AC1: a phase entirely before the list, typed in the short form. Hand: 2026 is the only year, and it
  // is a missing year, so the table keeps it with no amount.
  await start.fill('01.2026');
  await end.fill('12.2026');
  await amountInput(page).fill('1000,00');

  const table = yearTable(page);
  await expect(table.locator('tbody tr')).toHaveCount(1);
  const row2026 = rowByHeader(table, '2026');
  await expect(await cellByHeader(table, row2026, 'Monate')).toHaveText('12');
  await expect(await cellByHeader(table, row2026, 'Finanzierung durch Fonds')).toHaveText(
    'kein Fonds für dieses Jahr',
  );
  await expect(await cellByHeader(table, row2026, 'Betrag für das Jahr')).toHaveText('–');
  const shown = await resultText(page);
  expect(shown).toContain('Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.');

  // The caption names the phase months with no day (024, review round 1 finding 3); the month names are
  // this test's own oracle, not `formatMonth`.
  const caption = await table.locator('caption').innerText();
  expect(caption).toContain('Januar 2026');
  expect(caption).toContain('Dezember 2026');
  expect(caption.indexOf('Januar 2026')).toBeLessThan(caption.indexOf('Dezember 2026'));
  expect(caption).not.toMatch(/\d{2}\.\d{2}\.\d{4}/);
});

// Story 033, AC3: the defaults are hak's example phase, the keyboard order is the one 024 fixed, and no
// field is ever disabled (UX §2, UX §4).
test('033 AC3: the phase fields start with the example phase hak gave, are reached by the keyboard in the form order, and none is disabled', async ({
  page,
}) => {
  // Hand oracle: hak's example phase, written as the field's own format.
  await expect(phaseStartInput(page)).toHaveValue('01.2028');
  await expect(phaseEndInput(page)).toHaveValue('03.2034');

  const fields = [
    phaseStartInput(page),
    phaseEndInput(page),
    amountInput(page),
    page.getByLabel('Steuersatz in Prozent', { exact: true }),
  ];
  for (const field of fields) {
    await expect(field, `field ${field}`).not.toBeDisabled();
  }

  // The form order of `FIELD_IDS`: Beginn, Ende, Betrag, Steuersatz.
  await phaseStartInput(page).focus();
  await expect(phaseStartInput(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(phaseEndInput(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(amountInput(page)).toBeFocused();
});
