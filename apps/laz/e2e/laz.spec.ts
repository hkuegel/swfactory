/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, test, type Locator } from '@playwright/test';
import {
  amountInput,
  cellByHeader,
  dataFileAsOf,
  dataFileFunds,
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
  const fileAsOf = dataFileAsOf();
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
  for (const fund of dataFileFunds()) {
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
  // come from the repo data file, which this test reads from disk.
  const shownYears = await fundTable(page).locator('tbody tr th').allInnerTexts();
  expect(shownYears).toEqual(dataFileFunds().map((fund) => String(fund.year)));

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
