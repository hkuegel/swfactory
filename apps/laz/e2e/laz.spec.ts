/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, test, type Locator } from '@playwright/test';
import {
  amountInput,
  cellByHeader,
  depositInput,
  depositSwitch,
  fixtureAsOf,
  fixtureFunds,
  flatInput,
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
  yearRegion,
  yearTable,
} from './laz.helpers.ts';

// Story 024 – iBonds payout phase. One test per visible AC (rebuild oracle).
// Parsing branches and the projection formula (AC1, AC4) and the round trip (AC3) are unit-tested
// next to the logic, so they are not repeated here. Euro figures contain U+00A0: matched with \s.
// Hand oracles, recomputed from the data file (spans asOf 2026-12-31 → 31.12. of the fund year), with the
// two funds story 035 adds at both ends of the fixture copy:
//   2027 d=365 ρ=1,0150000 · 36,00 = 36,5400 | 2028 d=731 ρ=1,0404564 · 38,00 = 39,5373 |
//   2029 d=1096 ρ=1,0769635 · 40,00 = 43,0785 | 2030 d=1461 ρ=1,1256000 · 42,00 = 47,2752 |
//   2031 d=1826 ρ=1,1877983 · 44,00 = 52,2631 | 2032 d=2192 ρ=1,2655910 · 46,00 = 58,2172 |
//   2033 d=2557 ρ=1,3611901 · 48,00 = 65,3371 | 2034 d=2922 ρ=1,4778505 · 50,00 = 73,8925 |
//   2035 d=3287 ρ=1,6195693 · 52,00 = 84,2176.
// Phase 1.1.2028 – 31.3.2034 (story 035: every year in it now has a funding fund): F = 66,947895916, so
// depot 10.000,00 EUR gives 14.936,989 Cent per month, 149,37 EUR, and 1.120.274 Cent = 11.202,74 EUR
// over the 75 phase months of the seven funded years.

test.beforeEach(async ({ page }) => {
  await open(page);
});

// Story 035 restates where 024 AC2's two halves are measured: the example phase inside the extended list
// now has a funding fund for its first year (2028 by the 2027 fund), so the missing-year half is measured
// on a phase year outside the list. Both halves are the same rule.
test('024 AC2: the year overview funds each phase year with the fund that liquidates in the year before, and reports a phase year outside the list with no amount', async ({
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

  // Every phase year of the example phase names the fund liquidated in December of the year before
  // (story 035 extended the list so 2028 has one: the 2027 fund). Hand, tax off: F = 66,947895916, so the
  // monthly payout for depot 10.000,00 € is 14.936,989225972 Cent, and a 12-month year shows
  // 179.244 Cent = 1.792,44 €; the last line is the money rule's value, the shown total 1.120.274 Cent
  // minus the six other parts = 44.810 Cent = 448,10 €, which is one Cent less than its own rounding
  // (44.811 Cent), so the rule changes this figure.
  for (const phaseYear of [2028, 2029, 2030, 2031, 2032, 2033, 2034]) {
    const row = rowByHeader(yearTable(page), String(phaseYear));
    const months = phaseYear === 2034 ? '3' : '12'; // only the phase months of a partly covered year
    await expect(await cell(row, 'Monate'), `year ${phaseYear}`).toHaveText(months);
    await expect(await cell(row, 'Finanzierung durch Fonds'), `year ${phaseYear}`).toHaveText(
      `Fonds ${String(phaseYear - 1)} (Auflösung Dezember ${String(phaseYear - 1)})`,
    );
    await expect(await cell(row, 'Betrag für das Jahr'), `year ${phaseYear}`).toHaveText(
      phaseYear === 2034 ? euro('448,10') : euro('1.792,44'),
    );
  }

  // Only the years with a funding fund count in the sum: 7 years, 75 phase months.
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('149,37'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('11.202,74'));

  // AC2's missing-year half, measured on a phase year outside the extended list (story 035): 2026 would
  // need the December 2025 liquidation, which the list does not have, so the year is reported with no
  // amount and nothing is invented for it (open question 3). The same rule, a different year.
  await phaseStartInput(page).fill('01.2026');
  await phaseEndInput(page).fill('12.2026');
  const missingRow = rowByHeader(yearTable(page), '2026');
  await expect(await cell(missingRow, 'Monate')).toHaveText('12');
  await expect(await cell(missingRow, 'Finanzierung durch Fonds')).toHaveText(
    'kein Fonds für dieses Jahr',
  );
  const missingAmount = await cell(missingRow, 'Betrag für das Jahr');
  await expect(missingAmount).toHaveText('–');
  await expect(missingAmount).not.toHaveText(euro('0,00'));

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
    .getByRole('region', { name: 'Fondsstaffel', exact: true })
    .locator('p')
    .filter({ hasText: 'Stand der Daten:' })
    .first()
    .innerText();
  const matches = labelLine.match(/\d{2}\.\d{2}\.\d{4}/) ?? [];
  const shown = matches[0] ?? '';
  expect(shown, 'shown date equals the file-level asOf').toBe(germanDate(fileAsOf));
  expect(shown, 'the displayed date stays the hand value 31.12.2026').toBe('31.12.2026');

  await expect(page.getByRole('region', { name: 'Fondsstaffel', exact: true })).toContainText(
    label,
  );

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

  // The announced text is the UX §4 wording with the hand-oracle figures for this state: tax off gives
  // F = 66,947895916 (story 035 extended the fixture, so 2028 is funded by the 2027 fund) → 14936,989226
  // cents per month (149,37 €) and 1.120.274 cents for the 75 phase months (11.202,74 €); the NAV override
  // does not change F, because F uses the payout factor per euro.
  // Asserting the announced string against the oracle, not against the visible figures, is what keeps the
  // live region from being a copy of them. Story 031 removed the typed rate, so this state has no tax.
  await page.waitForTimeout(900); // past the 700 ms live-region delay
  await expect(liveText()).resolves.toMatch(
    /^Maximale monatliche Auszahlung: 149,37\s€\. Summe der finanzierten Jahre: 11\.202,74\s€\.$/,
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
  // Hand: 1.200.000 cents / F (tax off, F = 66,947895916) = 17.924,387 cents = 179,24 €, and the 75 funded
  // phase months give 1.344.329 cents = 13.443,29 €. Both figures are derived from F, not read from the
  // app, and this state has no tax, because the tax is a checkbox now (story 031).
  await expect(liveText()).resolves.toMatch(
    /^Maximale monatliche Auszahlung: 179,24\s€\. Summe der finanzierten Jahre: 13\.443,29\s€\.$/,
  );
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

// Story 030 – no invented maximum in a money field. Hand oracles for the same fixture as story 035
// extended it (nine funds, so the example phase has seven funded years and 75 phase months) and the same
// phase, with F = 66,947895916 (tax off), recomputed here by hand in cents:
//   depot 250.000,00 € = 25.000.000 cents → 25.000.000 / F = 373.424,731 cents = 3.734,25 €, and the
//   75 funded phase months give 28.006.855 cents = 280.068,55 €.
//   monthly target 12.000,00 € = 1.200.000 cents → 1.200.000 × F = 80.337.475 cents = 803.374,75 €,
//   and 1.200.000 · 75 = 90.000.000 cents = 900.000,00 € for the sum.
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
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('3.734,25'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('280.068,55'));

  // The other direction, on the monthly target above 024's maximum.
  // Story 044: the radio names the whole rule, so the test names the radio by its copy.
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  const target = page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true });
  await target.fill('12000,00');
  await expect(target).not.toHaveAttribute('aria-invalid');
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('803.374,75'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('900.000,00'));
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
// outside the fund list as story 035 extended it (2027 through 2035): a phase in 2026 has no funding fund
// for any year, since it would need the December 2025 liquidation. The shown total of 0,00 € is asserted
// at logic level in `phase.test.ts`; here the UI shows the no-funding callout (UX §2), so the visible claim
// is that no year is dropped from the table.
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
      'Erster Monat der Auszahlungsphase: kein gültiges Datum. Erlaubt: Monat und Jahr, zum Beispiel 01.2028; ein ergänzter Tag muss ein echter Tag dieses Monats sein.',
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
    page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }),
    page.getByRole('checkbox', { name: 'Kirchensteuer auf die Kapitalertragsteuer', exact: true }),
    page.getByLabel('Bundesland für die Kirchensteuer', { exact: true }),
    // Story 046 adds the parking switch and its field after the tax controls, in the order of `FIELD_IDS`.
    depositSwitch(page),
    depositInput(page),
  ];
  for (const field of fields) {
    await expect(field, `field ${field}`).not.toBeDisabled();
  }

  // The form order of `FIELD_IDS` (Beginn, Ende, Betrag), then the tax controls in the order the form
  // renders them (story 031 replaced the typed rate). The order stops here: story 046's own test reads the
  // parking controls by their names, so this test does not assume where they sit in the tab chain.
  await phaseStartInput(page).focus();
  await expect(phaseStartInput(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(phaseEndInput(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(amountInput(page)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }),
  ).toBeFocused();
});

// Story 031, AC1 and AC2: the typed rate is gone, the rates are the measured ones, and the church tax
// counts only while the Kapitalertragsteuer checkbox is checked.
test('031 AC1, AC2: no control for a typed rate, the two checkboxes and the Bundesland select, with hand rates', async ({
  page,
}) => {
  await open(page);

  // AC1: the accessibility tree has no control for a typed rate.
  await expect(page.getByLabel('Steuersatz in Prozent', { exact: true })).toHaveCount(0);
  const kst = page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true });
  const kist = page.getByRole('checkbox', {
    name: 'Kirchensteuer auf die Kapitalertragsteuer',
    exact: true,
  });
  const land = page.getByRole('combobox', {
    name: 'Bundesland für die Kirchensteuer',
    exact: true,
  });

  // AC2: the select lists the 16 Bundesländer with the rate each one uses, starting at Bayern (hak's
  // default of 2026-11-13).
  await expect(land.getByRole('option')).toHaveCount(16);
  await expect(land).toHaveValue('bayern');
  await expect(land.getByRole('option').first()).toHaveText('Bayern (8 %)');

  // Story 045: the flat field is prefilled with 2,24, and the hand factor below is the one ADR 0012 gives
  // when the flat base is 0, so the flat field is set to 0 before the tax checks.
  await flatInput(page).fill('0');

  // Hand case, so the projection is a plain multiplication: NAV 40,00 € typed, YTM 100 %, and the file's
  // asOf (31.12.2026) is 731 days before the liquidation of 2028, so the factor is 2^(731/365) =
  // 4,0076034, and the fund row's figure is 40.000.000 micro-euro times that factor = 160,30 €. Story 047
  // AC1: the fund table shows no tax figure, so 160,30 € is the same in the tax case, and the rate is read
  // in the year table. The phase 01.2029-12.2029 is funded by fund 2028, and the given payout is 100,01 €
  // = 10.001 Cent, so the tester's own arithmetic gives the hand shares and the hand figures below.
  const table = fundTable(page);
  const fundRow = rowByHeader(table, '2028');
  const shown = await cellByHeader(table, fundRow, 'Hochrechnung je Anteil in Euro');
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,01');
  await phaseStartInput(page).fill('01.2029');
  await phaseEndInput(page).fill('12.2029');
  await fundInput(page, 'nav', 2028).fill('40,00');
  await fundInput(page, 'ytm', 2028).fill('100,00');
  await expect(shown).toHaveText(euro('160,30')); // no tax
  const years = yearTable(page);
  const yearRow = rowByHeader(years, '2029');
  const taxCell = (header: string): Promise<Locator> => cellByHeader(years, yearRow, header);
  // The tester's own arithmetic for the tax case (P16), the same base the model applies to the row: the
  // payout per share is 4.000 Cent x (4,0076034 - 0,26375 x 3,0076034) = 12.857,673 Cent, so the hand
  // shares are 120.012 Cent / 12.857,673 = 9,3340858888 and the base is 112.293,4 Cent. Its parts are
  // 28.073 Cent and 1.544 Cent; with Bayern's 8 % the effective rate is 28,375 % and the base becomes
  // 114.434 Cent (parts 28.609, 1.573, 2.289), with Brandenburg's 9 % it is 114.708 Cent (parts 28.677,
  // 1.577, 2.581). Every figure asserted below is one of these hand values.
  await kst.check();
  await expect(shown).toHaveText(euro('160,30')); // AC1: no tax figure in the fund table
  await expect(await taxCell('Kapitalsteuer in Euro')).toHaveText(euro('280,73')); // 25 %
  await expect(await taxCell('Solzzuschlag in Euro')).toHaveText(euro('15,44')); // 5,5 % of that
  await expect(await taxCell('Kirchensteuer in Euro')).toHaveText('– Kirchensteuer nicht angehakt');
  await kist.check();
  await expect(await taxCell('Kapitalsteuer in Euro')).toHaveText(euro('286,09'));
  await expect(await taxCell('Solzzuschlag in Euro')).toHaveText(euro('15,73'));
  await expect(await taxCell('Kirchensteuer in Euro')).toHaveText(euro('22,89')); // Bayern at 8 %
  await land.selectOption('brandenburg');
  await expect(await taxCell('Kapitalsteuer in Euro')).toHaveText(euro('286,77'));
  await expect(await taxCell('Solzzuschlag in Euro')).toHaveText(euro('15,77'));
  await expect(await taxCell('Kirchensteuer in Euro')).toHaveText(euro('25,81')); // 9 %
  // AC2, second half: the church tax is computed on the Kapitalertragsteuer, so it is ignored while that
  // checkbox is unchecked, and the fund row's figure is the pre-tax projection again.
  await kst.uncheck();
  for (const header of ['Kapitalsteuer in Euro', 'Solzzuschlag in Euro', 'Kirchensteuer in Euro']) {
    await expect(await taxCell(header)).toHaveText('– Steuer nicht angehakt');
  }
  await expect(shown).toHaveText(euro('160,30'));
  await expect(kst).not.toBeDisabled();
  await expect(kist).not.toBeDisabled();
});

// Story 032 – the purchase side of the fund table: `shares = phase-year amount / projected payout per
// share`, `purchase = shares × NAV`. Hand oracles, recomputed by hand from the fixture copy as story 035
// extended it with the two boundary funds, using the same spans 024 uses (asOf 31.12.2026 → 31.12. of the
// fund year): the pre-tax factors are ρ = 1,0150000 (2027), 1,0404516 (2028), 1,0769573 (2029), 1,1255649
// (2030), 1,1878281 (2031), 1,2655355 (2032), 1,3612328 (2033), 1,4778504 (2034), 1,6195693 (2035).
// A fund row funds the phase year after its liquidation year (024 AC2), and `shares × NAV` cancels the
// NAV, so a row's purchase is its phase year's amount divided by that factor.

/** Whole Cent as the German display shows them: 1.153.351 Cent → `11.533,51`. The test's own formatting. */
function germanCents(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const fraction = String(Math.abs(cents % 100)).padStart(2, '0');
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`;
}

test('032 AC1: a fund row inside the phase shows the hand shares and the hand purchase at the data-file NAV', async ({
  page,
}) => {
  // Hak's example phase, depot 10.000,00 € (1.000.000 Cent), tax off: hand F = 66,947895916 on the
  // fixture copy as story 035 extended it, so the monthly payout is 14.936,989225972 Cent and the shown
  // depot is 10.000,00 €. Rows 2028 (phase year 2029) and 2030 (phase year 2031).
  await phaseStartInput(page).fill('01.2028');
  await phaseEndInput(page).fill('03.2034');
  await amountInput(page).fill('10000,00');
  // Story 045: the hand factors below are the pre-tax factors, which the model uses when the flat rate
  // is 0, so the flat field is set to 0 (its prefilled 2,24 would change the projection).
  await flatInput(page).fill('0');

  const table = fundTable(page);
  const hand: [string, string, string][] = [
    ['2028', '45,34', '1.722,74'],
    ['2030', '37,91', '1.592,43'],
  ];
  for (const [year, shares, purchase] of hand) {
    const row = rowByHeader(table, year);
    await expect(await cellByHeader(table, row, 'Anteile jetzt kaufen'), `row ${year}`).toHaveText(
      shares,
    );
    await expect(
      await cellByHeader(table, row, 'Kaufpreis heute in Euro'),
      `row ${year}`,
    ).toHaveText(euro(purchase));
  }

  // AC1, the other state of the same model: KSt alone is 26,375 % (Soli included, church tax off), so the
  // factor becomes ρ − 0,26375·(ρ − 1) = 1,0297879 for 2028 and the hand figures become 44,56 shares and
  // 1.693,44 € (F = 68,812020831, monthly 14.532,344610 Cent). The tax is the one the projection column
  // already uses (024 AC4, story 031).
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  const row2028 = rowByHeader(table, '2028');
  await expect(await cellByHeader(table, row2028, 'Anteile jetzt kaufen')).toHaveText('44,56');
  await expect(await cellByHeader(table, row2028, 'Kaufpreis heute in Euro')).toHaveText(
    euro('1.693,44'),
  );
});

// Case B, chosen so AC2 is not vacuous: rounding the last part on its own would show a different figure
// than the money rule does. Phase 01.2029–12.2030 (two funded years), monthly target 1.000,01 € =
// 100.001 Cent. Hand: F = 12/1,0404516 + 12/1,0769573 = 22,675,06…, so the shown depot is
// 100.001 Cent × F = 2.267.607 Cent = 22.676,07 €.
test('032 AC2: the shown parts add up to the shown depot, with the last part taken from the total', async ({
  page,
}) => {
  // Story 044: the radio names the whole rule, so the test names the radio by its copy.
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2029');
  await phaseEndInput(page).fill('12.2030');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('1000,01');
  // Story 045: the hand parts below are the flat-free parts, which `displayFundParts` returns when the
  // flat rate is 0 (then no row has a flat figure), so the flat field is set to 0.
  await flatInput(page).fill('0');

  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('22.676,07'));

  const table = fundTable(page);
  // Hand parts in Cent: 1.153.351 for row 2028, and the rule's value 2.267.607 − 1.153.351 = 1.114.256
  // for row 2029, one Cent more than its own rounding (1.114.255 Cent = 11.142,55 €).
  const parts = [1153351, 1114256];
  for (const [index, cents] of parts.entries()) {
    const year = String(2028 + index);
    await expect(
      await cellByHeader(table, rowByHeader(table, year), 'Kaufpreis heute in Euro'),
      `row ${year}`,
    ).toHaveText(euro(germanCents(cents)));
  }
  expect(
    parts.reduce((sum, cents) => sum + cents, 0),
    'the shown parts, in whole Cent',
  ).toBe(2267607);

  // The parts are the parts of the depot, so the last row inside the phase keeps the rule's figure when
  // the tax changes the total: hand parts for KSt on are 1.165.302 and 1.135.661 Cent, which add up to the
  // shown depot 23.009,63 €.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('23.009,63'));
  await expect(
    await cellByHeader(table, rowByHeader(table, '2029'), 'Kaufpreis heute in Euro'),
  ).toHaveText(euro(germanCents(1135661)));
  await expect(
    await cellByHeader(table, rowByHeader(table, '2028'), 'Kaufpreis heute in Euro'),
  ).toHaveText(euro(germanCents(1165302)));
  expect(1165302 + 1135661, 'the same parts, in whole Cent, with the tax on').toBe(2300963);
});

// AC3 names two example strings, one for each table: `kein Fonds für dieses Jahr` is the year table's line
// for a phase year without a funding fund (024 AC2), and `Auflösung nach Phasenende` is the fund row's
// reason. The fund row on the other side of the phase and a payout per share of 0 have no string in the
// AC, so the strings the app shows for them are decisions of this story (Decision log) and are asserted
// here as the app's own wording, not as an oracle.
test('032 AC3: no purchase for a row that funds no phase year, the dash with its reason, and the projection label stays associated with the row', async ({
  page,
}) => {
  const table = fundTable(page);
  const sharesCell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Anteile jetzt kaufen');
  const purchaseCell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Kaufpreis heute in Euro');

  // Empty state: nothing is invented while no result is possible, so the dash stands alone, without a
  // reason, in both new cells.
  const row2034Shares = await sharesCell('2034');
  const row2034Purchase = await purchaseCell('2034');
  await expect(row2034Shares).toHaveText('–');
  await expect(row2034Purchase).toHaveText('–');

  // Hand case, tax off, depot 100,00 €: the phase 01.2026–12.2026 is outside the extended list (story
  // 035), so its only year has no funding fund and the year table keeps its missing-year line, and no
  // fund row funds a phase year of this phase. Row 2028 is on the other side of the phase end.
  await phaseStartInput(page).fill('01.2026');
  await phaseEndInput(page).fill('12.2026');
  await amountInput(page).fill('100,00');
  await expect(
    await cellByHeader(
      yearTable(page),
      rowByHeader(yearTable(page), '2026'),
      'Finanzierung durch Fonds',
    ),
  ).toHaveText('kein Fonds für dieses Jahr');
  await expect(await sharesCell('2028')).toHaveText('– Auflösung nach Phasenende');
  await expect(await purchaseCell('2028')).toHaveText('– Auflösung nach Phasenende');

  // Hand case on the other side of the phase: 01.2030–12.2030, depot 1.000,00 € and tax off, so
  // F = 12/1,0769573 = 11,142439108464284 and the monthly payout is 89.746,95668207478 Cent. Row 2029
  // funds that year: hand shares 25,00 and the hand purchase 1.000,00 €, the only part, so it equals the
  // shown depot. Row 2028 liquidates before the phase begins, so it shows no number.
  await phaseStartInput(page).fill('01.2030');
  await phaseEndInput(page).fill('12.2030');
  await amountInput(page).fill('1000,00');
  await expect(await sharesCell('2028')).toHaveText('– Auflösung vor Phasenbeginn');
  await expect(await sharesCell('2029')).toHaveText('25,00');
  await expect(await purchaseCell('2029')).toHaveText(euro('1.000,00'));

  // The branch a typed YTM produces: −100 % makes the factor 0, so `amount / payout per share` has no
  // number and the guard names why instead of inventing one. Hand: the row keeps its dash in both cells,
  // and the projection figure itself is 0,00 €.
  await fundInput(page, 'ytm', 2029).fill('-100,00');
  await expect(
    await cellByHeader(table, rowByHeader(table, '2029'), 'Hochrechnung je Anteil in Euro'),
  ).toHaveText(euro('0,00'));
  await expect(await sharesCell('2029')).toHaveText('– keine Hochrechnung je Anteil');
  await expect(await purchaseCell('2029')).toHaveText('– keine Hochrechnung je Anteil');

  // AC3, second half: the projection label with its asOf stays the accessible description of the row.
  const fileAsOf = fixtureAsOf();
  expect(fileAsOf, 'the asOf the label names, from the fixture copy').toBe('2026-12-31');
  const label = `Diese Beträge sind eine Hochrechnung aus YTM und NAV und kein veröffentlichter Marktwert. Stand der Daten: ${germanDate(fileAsOf)}.`;
  await expect(row2034Shares.locator('[aria-describedby]')).toHaveAccessibleDescription(label);
  await expect(row2034Purchase.locator('[aria-describedby]')).toHaveAccessibleDescription(label);
});

// Story 035 – the fund list reaches the funding years of the phase boundaries, 2027 and 2035. Hand oracles
// on the fixture copy as story 035 extended it (nine funds): phase 01.2028–03.2036, depot 10.000,00 €
// = 1.000.000 Cent, tax off. F = 83,532002665, so the monthly payout is 11.971,459657 Cent = 119,71 €.
// A 12-month phase year shows 143.658 Cent = 1.436,58 €; the three months of 2036 are the money rule's
// value, the shown total 1.185.175 Cent minus the eight other parts (8 × 143.658) = 35.911 Cent =
// 359,11 €, which is what the shown total adds up to. No full year is invented for 2036: the phase has
// three months in it (hak's second request), and 2036 is funded by the fund that matures in 2035.
test('035 AC1: 2028 names the 2027 fund as its funding fund, 2036 names the 2035 fund, and the amount of 2036 is the monthly payout times its three months', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2036');
  await amountInput(page).fill('10000,00');

  const table = yearTable(page);
  await expect(table.locator('tbody tr')).toHaveCount(9);

  const first = rowByHeader(table, '2028');
  await expect(await cellByHeader(table, first, 'Monate')).toHaveText('12');
  await expect(await cellByHeader(table, first, 'Finanzierung durch Fonds')).toHaveText(
    'Fonds 2027 (Auflösung Dezember 2027)',
  );
  await expect(await cellByHeader(table, first, 'Betrag für das Jahr')).toHaveText(
    euro('1.436,58'),
  );

  const last = rowByHeader(table, '2036');
  await expect(await cellByHeader(table, last, 'Monate')).toHaveText('3');
  await expect(await cellByHeader(table, last, 'Finanzierung durch Fonds')).toHaveText(
    'Fonds 2035 (Auflösung Dezember 2035)',
  );
  await expect(await cellByHeader(table, last, 'Betrag für das Jahr')).toHaveText(euro('359,11'));

  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('119,71'));
  await expect(figure(page, 'Summe der finanzierten Jahre')).toHaveText(euro('11.851,75'));
});

// Story 036 – the fund row names the fund it is. The strings below are written by hand from the fixture
// copy (P16), then cross-checked against the same file the app is built with in e2e mode (story 025,
// ADR 0013), so the oracle is not the module under test.
test('036 AC1, AC2, AC3: the fund row shows the hand name and ISIN, the course column is named Kurs, and the row header stays the year', async ({
  page,
}) => {
  const table = fundTable(page);

  // AC1: the columns have one order for the whole table.
  const headers = await table.getByRole('columnheader').allInnerTexts();
  expect(headers.map((header) => header.trim())).toEqual([
    'Jahr',
    'Fondsname',
    'ISIN',
    'Kurs',
    'YTM in Prozent',
    'Hochrechnung je Anteil in Euro',
    'Anteile jetzt kaufen',
    'Kaufpreis heute in Euro',
    // Story 047 AC1: the tax column of 045 AC4 is gone, so the pinned list is the eight columns the table
    // actually has, not deleted (AC7). The figures it used to show are read in the year table.
  ]);

  const hand = {
    year: 2030,
    name: 'iBonds EUR Corporate UCITS 2030 (hand fixture)',
    isin: 'DE000FIX30',
    // 42.000.000 micro-euro as the cell shows it: the micro-euro format prints the decimals a value has,
    // so a whole euro shows as `42`, which is what lets the cell round-trip through the same parser
    // (story 025). Hand value, not read from the format module.
    kurs: '42',
    projection: '47,28',
  };
  const fileRow = fixtureFunds().find((fund) => fund.year === hand.year);
  expect([fileRow?.name, fileRow?.isin], 'the hand row is the row the app shows').toEqual([
    hand.name,
    hand.isin,
  ]);

  // AC2, hak's gate 1 answer of 2026-11-14: the row header stays the fund's year, so the name and the ISIN
  // are cells of the row and the tests that read rows by year keep their oracles.
  const row = rowByHeader(table, String(hand.year));
  await expect(row.locator('th').first()).toHaveText(String(hand.year));
  await expect(await cellByHeader(table, row, 'Fondsname')).toHaveText(hand.name);
  await expect(await cellByHeader(table, row, 'ISIN')).toHaveText(hand.isin);

  // AC3: the column that shows the course names what it is, and the value is the one the source published
  // with its asOf date, which the projection label states as a projection, not as a market price.
  await expect(fundInput(page, 'nav', hand.year)).toHaveValue(hand.kurs);
  const label = `Diese Beträge sind eine Hochrechnung aus YTM und NAV und kein veröffentlichter Marktwert. Stand der Daten: ${germanDate(fixtureAsOf())}.`;
  await expect(
    page.getByRole('region', { name: 'Fondsstaffel', exact: true }).locator('p').first(),
  ).toHaveText(label);

  // The figures of the row are still described by the label; the name and the ISIN are not figures, so the
  // label does not describe them.
  const projectionCell = await cellByHeader(table, row, 'Hochrechnung je Anteil in Euro');
  await expect(projectionCell.locator('[aria-describedby]')).toHaveText(euro(hand.projection));
  await expect(projectionCell.locator('[aria-describedby]')).toHaveAccessibleDescription(label);
  for (const header of ['Fondsname', 'ISIN']) {
    await expect(await cellByHeader(table, row, header)).not.toHaveAccessibleDescription(label);
  }
});

// Story 045 – the flat rate for accumulating funds (§ 18 InvStG), one rate constant over the term,
// prefilled with 2,24 %. Hand oracles, the tester's own arithmetic on the fixture copy as story 035
// extended it (asOf 31.12.2026, so the counted years of a fund are 2026 through its fund year − 1): the
// value at the start of a year is (1 + YTM)^(days/365), days the whole days between asOf and 1.1. of that
// year and never negative; a year's base is the smaller of that year's increase and that start value ×
// 2,24 % × whole months / 12, whole months being 1 for 2026 (asOf is in December) and 12 for every later
// year; the tax is base × NAV × 26,375 %, in Cent:
//   2029  0,270613 + 89,606062 + 91,846213 = 181,722888 € -> 47,929412 Cent -> 0,48 €
//   2030  0,340142 + 94,087619 + 96,910248 + 99,825639 = 291,163648 € -> 76,794412 Cent -> 0,77 €
//   2031  0,414722 + 98,569290 + 102,019215 + 105,599840 + 109,295834 = 415,898900 € -> 109,693335 Cent -> 1,10 €
//   2032  0,494315 + 103,051073 + 107,173116 + 111,472018 + 115,930898 + 120,568134 = 558,689554 € -> 147,354370 Cent -> 1,47 €
//   2033  0,578887 + 107,532967 + 112,371951 + 117,442850 + 122,727779 + 128,250529 + 134,021803 = 722,926765 € -> 190,671934 Cent -> 1,91 €
// The whole list would read 1.132,29 Cent = 11,32 €, which the fund section must not state for a phase
// that funds only some of the funds (risk 5).
test('045 AC1: the flat field in the tax block with the copy of UX §2, prefilled 2,24, and nothing counted while the tax is off', async ({
  page,
}) => {
  const taxBlock = page.getByRole('group', { name: 'Steuer auf den Gewinn', exact: true });

  // AC1: the field is the last control of the tax block, prefilled with the value AC1 names, and reads as
  // a number in its own unit.
  await expect(
    taxBlock.getByRole('textbox', { name: 'Vorabpauschale', exact: true }),
  ).toBeVisible();
  await expect(flatInput(page)).toHaveValue('2,24');
  await expect(flatInput(page)).toHaveAttribute('inputmode', 'decimal');
  await expect(flatInput(page)).not.toBeDisabled();

  // The hint says the rate stays the same over the whole term and counts only in the tax case. The whole
  // string is asserted in `fieldCopy.test.ts`; here only the two phrases AC1 names, so this test does not
  // read its oracle from the copy module it checks (P16).
  await expect(flatInput(page)).toHaveAccessibleDescription(
    /über die ganze Laufzeit gleich und zählt nur, wenn die Kapitalertragsteuer angehakt ist/,
  );

  const fundSection = page.getByRole('region', { name: 'Fondsstaffel', exact: true });
  const section = yearRegion(page);
  const years = yearTable(page);
  const colA = 'Pauschalsteuer für die Jahre vor der Phase in Euro';
  const colB = 'Pauschalsteuer für das Phase-Jahr in Euro';
  const flatCell = (year: string, column: string): Promise<Locator> =>
    cellByHeader(years, rowByHeader(years, year), column);

  // A result must exist for a reason to be named: the initial state has no amount typed, where story 032
  // lets the dash stand alone. Hand case, the given payout 100,01 € = 10.001 Cent and hak's example phase
  // 01.2028-03.2034, so the phase-year rows are 2028 to 2034. AC7: the figures of 045 AC4 are read here.
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,01');

  // Negative half of the rule: while the Kapitalertragsteuer is off, no flat-rate tax is calculated
  // anywhere, so every phase-year row shows the dash with its reason in both flat columns, the fund
  // section states no sum line (AC1), and no sum line is invented for an empty column.
  for (const year of ['2028', '2029', '2030', '2031', '2032', '2033', '2034']) {
    for (const column of [colA, colB]) {
      await expect(await flatCell(year, column), `row ${year}, ${column}`).toHaveText(
        '– Steuer nicht angehakt',
      );
    }
  }
  await expect(fundSection.getByText('Summe der Pauschalsteuer über alle Fonds')).toHaveCount(0);
  await expect(section.getByText(`Summe ${colA}:`)).toHaveCount(0);
  await expect(section.getByText(`Summe ${colB}:`)).toHaveCount(0);

  // Positive pair of the same rule: the tax on gives row 2028 the hand figures 0,20 € in column A (fund
  // 2028's counted years before the phase: 4 Cent for 2026 and 16 Cent for 2027) and 1,35 € in column B
  // (the funds still held in 2028: 24 + 26 + 27 + 28 + 30 Cent), and the two sum lines are the sums of the
  // figures shown in their own column, 1,51 € and 4,42 €. These are the tester's own arithmetic on the
  // table written in the comment above this test, not values read from the module it checks.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await expect(await flatCell('2028', colA)).toHaveText(euro('0,20'));
  await expect(await flatCell('2028', colB)).toHaveText(euro('1,35'));
  await expect(section.getByText(`Summe ${colA}`)).toHaveText(`Summe ${colA}: 1,51\u00a0€.`);
  await expect(section.getByText(`Summe ${colB}`)).toHaveText(`Summe ${colB}: 4,42\u00a0€.`);
});

// The sum line and the column figure are read from the tester's own table above; the hand phase is chosen
// so that the shown parts are not the whole-list reading (risk 5): phase 01.2030–12.2031 has two funded
// years, 2030 and 2031, so only rows 2029 and 2030 have a figure.
test('045 AC4: the flat column shows the hand figure, the fund section states the sum once, and each dash names its reason', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.2030');
  await phaseEndInput(page).fill('12.2031');
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,01');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();

  const fundSection = page.getByRole('region', { name: 'Fondsstaffel', exact: true });
  const section = yearRegion(page);
  const years = yearTable(page);
  const colA = 'Pauschalsteuer für die Jahre vor der Phase in Euro';
  const colB = 'Pauschalsteuer für das Phase-Jahr in Euro';
  const fund = fundTable(page);
  const flatCell = (year: string, column: string): Promise<Locator> =>
    cellByHeader(years, rowByHeader(years, year), column);

  // Hand figures of the tester's table above, read in the year table (AC7). Fund 2030 is sold in the phase
  // year 2030, so its whole money - 291,163648 Cent of base, 76,794412 Cent of tax, 77 Cent shown - reads
  // on row 2030, and fund 2029 has no row because its sale year is not a phase year, so the year section
  // states its 48 Cent once with the reason decision 12 names. The sum line is the sum of the figures
  // shown in its own column, and column B has no figure here, so it has no sum line.
  await expect(await flatCell('2030', colA)).toHaveText(euro('0,77'));
  await expect(section.getByText('Fonds 2029:')).toHaveText(
    'Fonds 2029: 0,48\u00a0€ (Auflösung in einem Jahr, das kein Phase-Jahr ist).',
  );
  await expect(section.getByText(`Summe ${colA}`)).toHaveText(`Summe ${colA}: 0,77\u00a0€.`);
  await expect(section.getByText(`Summe ${colB}`)).toHaveCount(0);
  await expect(fundSection.getByText('Summe der Pauschalsteuer')).toHaveCount(0);

  // The dashes, one per reason. The fund table keeps story 032's reasons for its rows, and the flat
  // columns read their own reason in the year table.
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2034'), 'Anteile jetzt kaufen'),
  ).toHaveText('– Auflösung nach Phasenende');
  await fundInput(page, 'ytm', 2030).fill('-100,00');
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2030'), 'Anteile jetzt kaufen'),
  ).toHaveText('– keine Hochrechnung je Anteil');
  await expect(await flatCell('2030', colA)).toHaveText('– kein Jahr zahlt Steuer');

  // The order the copy reads: the tax case names every cell, so a phase-year row with a fund in the ladder
  // shows the tax reason while the checkbox is off.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).uncheck();
  await expect(await flatCell('2030', colA)).toHaveText('– Steuer nicht angehakt');
});

// AC5 reads a case where the derived last part differs from its own rounding: phase 01.2033–12.2034,
// monthly target 100,01 € = 10.001 Cent, tax 26,375 %, rate 2,24 %. The tester's own arithmetic:
// ρ′ = 1,2275749139 (row 2032) and 1,3056495265 (row 2033), so F = 18,9661986526 and
// D = 10.001 × F + cash = 190.018,979029 Cent -> shown depot 190.019 Cent = 1.900,19 €.
// Parts in the order the money rule reads them (AC3): the purchase parts 97.763 Cent (fund 2032) and
// 91.917 Cent (fund 2033), then the flat figure per phase year - fund 2033's own 190,671934 Cent reads as
// 191 Cent on row 2033, the phase year of its sale - and last the year section's line for fund 2032, whose
// sale year is not a phase year: 190.019 - (97.763 + 191 + 91.917) = 148 Cent, one Cent more than its own
// rounding (147,354370 -> 147).
test('045 AC5: the depot includes the yearly payments, the parts of both columns add up to it, and the last part is the total minus the others', async ({
  page,
}) => {
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2033');
  await phaseEndInput(page).fill('12.2034');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,01');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();

  const fund = fundTable(page);
  const section = yearRegion(page);
  const years = yearTable(page);
  const colA = 'Pauschalsteuer für die Jahre vor der Phase in Euro';
  const flatCell = (year: string): Promise<Locator> =>
    cellByHeader(years, rowByHeader(years, year), colA);

  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('1.900,19'));

  // The fund table keeps its shares and its purchase price (AC1), and the flat figures are read in the
  // year table (AC7).
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2032'), 'Anteile jetzt kaufen'),
  ).toHaveText('21,25');
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2032'), 'Kaufpreis heute in Euro'),
  ).toHaveText(euro('977,63'));
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2033'), 'Anteile jetzt kaufen'),
  ).toHaveText('19,15');
  await expect(
    await cellByHeader(fund, rowByHeader(fund, '2033'), 'Kaufpreis heute in Euro'),
  ).toHaveText(euro('919,17'));
  // The rule's figure, not its own rounding: the line for fund 2032 is the last part in the reading order.
  await expect(await flatCell('2033')).toHaveText(euro('1,91'));
  await expect(section.getByText('Fonds 2032:')).toHaveText(
    'Fonds 2032: 1,48\u00a0€ (Auflösung in einem Jahr, das kein Phase-Jahr ist).',
  );

  // The shown parts add up to the shown depot, which is what makes the last one the total minus the others.
  expect(97763 + 191 + 91917 + 148, 'the shown parts, in whole Cent').toBe(190019);

  // The sum line is the sum of the figures shown in that column, 191 Cent, and a column with no figure has
  // no sum line.
  await expect(section.getByText(`Summe ${colA}`)).toHaveText(`Summe ${colA}: 1,91\u00a0€.`);
  await expect(section.getByText('Summe Pauschalsteuer für das Phase-Jahr in Euro')).toHaveCount(0);
});

// Story 046, AC1: the parking block is its own group (Q5), its switch and its field read by the names UX §2
// gives them, and the effect of the option asserted as a pair on one figure. Hand case: the prefilled phase
// 01.2028–03.2034, depot 10.000,00 €, tax off, so story 045's cash line is 0 and the figure is the plain
// model. F = 66,947895916081 gives 149,37 €, the figure the app shows today. With the switch on, the term of
// a full phase year is 6,5 × 0,025 = 0,1625 (2028 to 2033) and 0,5 × 0,025 = 0,0125 for the three-month year
// 2034; over the funding funds K = 0,1625 × (1/1,015 + 1/1,0404564 + 1/1,0769635 + 1/1,1256 + 1/1,1877983 +
// 1/1,265591) + 0,0125/1,3611901 = 0,885924024210, so P = 10.000 Cent / (66,947895916081 − 0,885924024210) =
// 151,372446 € -> 151,37 €. Off and on are one pair; a single figure is not an assertion.
test('046 AC1: the parking block as its own group, its switch and its field by the names UX §2 gives, and the hand figure for the option off against the option on', async ({
  page,
}) => {
  const block = page.getByRole('group', {
    name: 'Geld auf dem Tagesgeldkonto parken',
    exact: true,
  });
  await expect(block).toHaveCount(1);
  await expect(block).toBeVisible();

  // Q5: the block is its own fieldset, so it reads as a group named by its legend, and it is the last group
  // of the form - the order `fieldCopy.test.ts` pins for the key list. The field is inside it, so the group
  // is not named after the control it holds.
  await expect(page.getByRole('group').last()).toHaveAccessibleName(
    'Geld auf dem Tagesgeldkonto parken',
  );
  await expect(block.getByLabel('Zinssatz in Prozent', { exact: true })).toHaveCount(1);

  // The switch is named by what it does, which is a different string from the legend (UX §2).
  const control = depositSwitch(page);
  await expect(control).toBeVisible();
  await expect(control).not.toBeChecked();
  await expect(control).not.toBeDisabled();

  // AC1: prefilled with the value Q1 names, read as whole hundredths of a percent, never disabled.
  const field = depositInput(page);
  await expect(field).toHaveValue('2,50');
  await expect(field).toHaveAttribute('inputmode', 'decimal');
  await expect(field).not.toBeDisabled();

  // The two phrases AC4 says the copy states once, read as the accessible descriptions: the switch's hint
  // names the day the payout falls, the field's hint names the rate as constant over the term. The full
  // strings live in `fieldCopy.test.ts`, so this test does not read its oracle from the module it checks.
  await expect(control).toHaveAccessibleDescription(/letzten Tag jedes Phase-Monats/);
  await expect(field).toHaveAccessibleDescription(/über die Laufzeit gleich/);

  // UX §2: before the first edit nothing is marked, and the live region is still empty.
  await expect(field).not.toHaveAttribute('aria-invalid');
  await expect(block.getByText(/Zinssatz in Prozent: /)).toHaveCount(0);
  await expect(liveRegion(page)).toHaveText('');

  // AC1, the off half: the figures are the ones the app shows today. Hand case, tax off.
  await amountInput(page).fill('10000,00');
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('149,37'));

  // The positive half of the same pair: the switch on moves the figure to the hand value above.
  await control.check();
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('151,37'));

  // And the rate-0 half of AC1: with the option on but the rate 0, the figure is the off figure again, and
  // the year row names the reason AC4 gives for it (the copy string is in `fieldCopy.test.ts`, the cell with
  // its dash is asserted here, which is what the mutation of that branch can move).
  await field.fill('0');
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('149,37'));
  const table = yearTable(page);
  const cell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Zinsen über das Phase-Jahr in Euro');
  await expect(await cell('2028')).toHaveText('– kein Zinssatz');

  // P27: once the value is edited, an invalid one is announced with the label UX §2 gives the field, and the
  // field is marked without being disabled. The pair is the empty error before the first edit above.
  await field.fill('101,00');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).not.toBeDisabled();
  await expect(block.getByText(/Zinssatz in Prozent: /)).toHaveCount(1);
  await expect(liveRegion(page)).toHaveText('Kein Ergebnis: Zinssatz in Prozent ist ungültig.');
});

// Story 046, AC4: the two columns of the year table, the sum the year section states once, and one dash per
// reason. Hand case in the payout direction: monthly target 100,00 € = 10.000 Cent, tax 26,375 % (the
// Kapitalertragsteuer alone), flat typed 0 so the cash line is 0 and the year amount is the parked rule
// alone. Phase 01.2033–12.2034: both rows are full phase years, so the interest of each is 6,5 × 100 × 0,025
// = 16,25 € and its tax 4,2859375 € -> 4,29 €. The figures themselves are asserted at logic level in
// `deposit.test.ts` (P32); what AC4 asserts here is the sum line, and the sum of the SHOWN parts is
// 1.625 + 1.625 = 3.250 Cent and 429 + 429 = 858 Cent. Adding the unrounded figures once would give 857 Cent
// (8,57 €), so this is the assertion the shown-cents rule can move.
test('046 AC4: the two parked columns, the sum line the year section states once, and the dash with its reason for each case', async ({
  page,
}) => {
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  const target = page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true });
  await target.fill('100,00');
  await flatInput(page).fill('0');
  await phaseStartInput(page).fill('01.2033');
  await phaseEndInput(page).fill('12.2034');
  await depositSwitch(page).check();

  const section = yearRegion(page);
  const table = yearTable(page);
  const interestCell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Zinsen über das Phase-Jahr in Euro');
  const taxCell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Steuer auf die Zinsen in Euro');

  // AC4: the columns are their own, and the header list is pinned, so no column is renamed for them and the
  // year table shows no balance column. Hand strings of UX §2, in the order the table reads them (047 AC2).
  await expect(await table.getByRole('columnheader').allInnerTexts()).toEqual([
    'Jahr',
    'Monate',
    'Finanzierung durch Fonds',
    'Erlös aus der Fondsauflösung in Euro',
    'Kapitalsteuer in Euro',
    'Solzzuschlag in Euro',
    'Kirchensteuer in Euro',
    'Pauschalsteuer für die Jahre vor der Phase in Euro',
    'Pauschalsteuer für das Phase-Jahr in Euro',
    'Auszahlung in Euro',
    'Betrag für das Jahr',
    'Zinsen über das Phase-Jahr in Euro',
    'Steuer auf die Zinsen in Euro',
  ]);

  // The paragraph that states the rule inside this section, and the two phrases AC4 says are stated once:
  // each of them appears exactly once on the page, in its own block.
  await expect(section.getByText(/Zinsen werden einfach gerechnet/)).toHaveCount(1);
  const form = page.getByRole('form', { name: 'Eingaben' });
  await expect(form.getByText(/letzten Tag jedes Phase-Monats/)).toHaveCount(1);
  await expect(form.getByText(/über die Laufzeit gleich/)).toHaveCount(1);

  // The sum line, in the tax case, inside the year section and as paragraph text.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  // The hand figures of the story, read as the single rounding of the cell: the money that waits is the
  // shown row, and the column that shows it is the existing amount column (deviation 1). The sum line is the
  // sum of these two shown figures, so the two assertions are one pair, not a repeat of the same figure.
  await expect(await interestCell('2033')).toHaveText(euro('16,25'));
  await expect(await interestCell('2034')).toHaveText(euro('16,25'));
  await expect(await taxCell('2033')).toHaveText(euro('4,29'));
  await expect(await taxCell('2034')).toHaveText(euro('4,29'));
  await expect(section.getByText(/^Summe Zinsen über das Phase-Jahr in Euro: /)).toHaveText(
    'Summe Zinsen über das Phase-Jahr in Euro: 32,50\u00a0€.',
  );
  await expect(section.getByText(/^Summe Steuer auf die Zinsen in Euro: /)).toHaveText(
    'Summe Steuer auf die Zinsen in Euro: 8,58\u00a0€.',
  );

  // The pair of the second sentence: with the tax off no tax figure is shown, so the tax column reads its
  // reason, its own sum line is not stated, and the interest column keeps its line.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).uncheck();
  await expect(await taxCell('2033')).toHaveText('– Steuer nicht angehakt');
  await expect(section.getByText(/^Summe Steuer auf die Zinsen in Euro: /)).toHaveCount(0);
  await expect(section.getByText(/^Summe Zinsen über das Phase-Jahr in Euro: /)).toHaveText(
    'Summe Zinsen über das Phase-Jahr in Euro: 32,50\u00a0€.',
  );

  // The option-off reason, and no sum line at all: nothing is invented for an empty sum (the display rule
  // story 045 records), so this is the pair of the two lines above.
  await depositSwitch(page).uncheck();
  await expect(await interestCell('2033')).toHaveText('– Geld wird nicht geparkt (Option aus)');
  await expect(section.getByText('Summe der Zinsen über die Phase-Jahre')).toHaveCount(0);

  // `no-money-to-park`: hand case, flat 100 % and the tax on, so the cash line (1.532,10 Cent) is bigger
  // than the depot (1.000 Cent) and the monthly amount is negative (-6,462890 Cent). The interest stays 0,
  // so the row shows the dash with its reason rather than a negative figure (AC2).
  await depositSwitch(page).check();
  await page
    .getByRole('radio', { name: 'Das Depot ist gegeben, gesucht wird die monatliche Auszahlung' })
    .check();
  await amountInput(page).fill('10,00');
  await flatInput(page).fill('100,00');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await phaseStartInput(page).fill('01.2028');
  await phaseEndInput(page).fill('12.2035');
  await expect(await interestCell('2028')).toHaveText(
    '– kein Geld zum Parken (Wert nicht positiv)',
  );

  // `no-funding-fund`, reachable in the UI: a phase year the fund list does not fund. Hand: the phase
  // 01.2026–12.2026 is the only year of the phase and the fixture copy starts at 2027, so no money is
  // parked for it and the row names the reason the funding cell already reads.
  await phaseStartInput(page).fill('01.2026');
  await phaseEndInput(page).fill('12.2026');
  await expect(await interestCell('2026')).toHaveText('– kein Fonds für dieses Jahr');
});

// Story 047 AC1 and AC6. Hand case, the tester's own arithmetic (P16): fund 2027 of the fixture copy
// (3.600 Cent, 150 bp), asOf 31.12.2026 -> 365 days -> rho = 1,015, so the fund table's figure is the
// pre-tax proceeds per share 3.600 Cent x 1,015 = 3.654 Cent = 36,54 €, not the taxed payout of 024 AC4.
// Phase 01.2028-12.2028, monthly 100,00 € = 10.000 Cent, parking off, flat 0, KSt on, Kist off: shares =
// 120.000 Cent / (3.600 x (1,015 - 0,26375 x 0,015)) = 32,9692294061, base = shares x 3.600 Cent x 0,015
// = 1.780,3383877 Cent, its parts 445 Cent and 25 Cent (the Solzzuschlag is derived from the row's tax
// total 470 Cent, one Cent more than its own rounding), and the proceeds of the year are shares x the fund
// table's figure = 120.470 Cent, which is the row's tax plus the money that had to be at the start of the
// year (120.000 Cent). AC6's equality is the added assertion inside this spec.
test('047 AC1, AC6: no tax figure in the fund table, the tax read in the year table, and the proceeds cell is shares x the figure', async ({
  page,
}) => {
  await open(page);
  const kst = page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true });
  await flatInput(page).fill('0');
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2028');
  await phaseEndInput(page).fill('12.2028');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,00');
  await kst.check();

  // AC1: the fund table has no tax column, and the fund section states no sum line of its own.
  const fund = fundTable(page);
  const fundSection = page.getByRole('region', { name: 'Fondsstaffel', exact: true });
  const fundHeaders = await fund.getByRole('columnheader').allInnerTexts();
  expect(fundHeaders.map((header) => header.trim())).toEqual([
    'Jahr',
    'Fondsname',
    'ISIN',
    'Kurs',
    'YTM in Prozent',
    'Hochrechnung je Anteil in Euro',
    'Anteile jetzt kaufen',
    'Kaufpreis heute in Euro',
  ]);
  await expect(fundSection.getByText(/Summe/)).toHaveCount(0);

  const fundRow = rowByHeader(fund, '2027');
  await expect(await cellByHeader(fund, fundRow, 'Hochrechnung je Anteil in Euro')).toHaveText(
    euro('36,54'),
  );
  await expect(await cellByHeader(fund, fundRow, 'Anteile jetzt kaufen')).toHaveText('32,97');
  await expect(await cellByHeader(fund, fundRow, 'Kaufpreis heute in Euro')).toHaveText(
    euro('1.186,89'),
  );

  // AC2's order inside AC1's spec, so the same row is read twice: as the fund table's figure and as the
  // year table's cashflows.
  const years = yearTable(page);
  const yearRow = rowByHeader(years, '2028');
  const cell = (header: string): Promise<Locator> => cellByHeader(years, yearRow, header);
  await expect(await cell('Kapitalsteuer in Euro')).toHaveText(euro('4,45'));
  await expect(await cell('Solzzuschlag in Euro')).toHaveText(euro('0,25'));
  await expect(await cell('Kirchensteuer in Euro')).toHaveText('– Kirchensteuer nicht angehakt');
  await expect(await cell('Auszahlung in Euro')).toHaveText(euro('1.200,00'));
  await expect(await cell('Betrag für das Jahr')).toHaveText(euro('1.200,00'));
  // AC6: the proceeds cell is shares x the fund table's figure - the tester's own arithmetic, the single
  // rounding, so the cell must show the same figure the two tables agree on.
  const proceedsHand = Math.round(32.9692294061 * 3654);
  expect(proceedsHand, 'shares x the fund table figure, in whole Cent').toBe(120470);
  await expect(await cell('Erlös aus der Fondsauflösung in Euro')).toHaveText(euro('1.204,70'));
  // The row's two totals, read as the year section states them once (AC3, the N = 1 shape).
  const section = yearRegion(page);
  await expect(section.getByText(/^Summe der Steuer über die Phase-Jahre:/)).toHaveText(
    'Summe der Steuer über die Phase-Jahre: 4,70\u00a0€.',
  );
  await expect(section.getByText(/^Summe des Gelds der Phase-Jahre:/)).toHaveText(
    'Summe des Gelds der Phase-Jahre: 1.204,70\u00a0€.',
  );
});

// Story 047 AC2: one row read column by column, the columns in AC2's order. Hand case, the tester's own
// arithmetic on the fixture copy (asOf 31.12.2026): phase 01.2028-12.2033, monthly 100,00 € = 10.000 Cent,
// flat 2,24 %, parking on at 2,50 %, KSt on, church tax on at 8 % (Bayern, the prefilled select). Row
// 2028 is funded by fund 2027: rho = 1,015, the flat base of asOf's own year (one whole month, December)
// is min(max(0, 0,0000684), 1 x 0,0224 x 1/12) = 0,0000684 per euro invested, so the row's base is
// 1.759,10 Cent -> KSt 440 Cent, Solz 24 Cent, Kist 35 Cent, the row's tax total 960 Cent. The interest of
// a full phase year is 10.000 Cent x 0,025 x monthSum(12) = 1.625 Cent, its tax 1.625 x 28,375 % =
// 461 Cent, and the money that had to be at the start of the year is 120.000 - 1.196,40625 =
// 118.804 Cent. Column A reads the fund sold in this year (fund 2028, whose counted years 2026 and 2027
// are both before the phase: 22 Cent), column B the funds still held in it (26 + 27 + 29 + 30 = 112 Cent).
test('047 AC2: one row read column by column in the AC2 order, thirteen headers pinned', async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2028');
  await phaseEndInput(page).fill('12.2033');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,00');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await page
    .getByRole('checkbox', { name: 'Kirchensteuer auf die Kapitalertragsteuer', exact: true })
    .check();
  await depositSwitch(page).check();
  await depositInput(page).fill('2,50');

  const years = yearTable(page);
  const headers = await years.getByRole('columnheader').allInnerTexts();
  expect(headers.map((header) => header.trim())).toEqual([
    'Jahr',
    'Monate',
    'Finanzierung durch Fonds',
    'Erlös aus der Fondsauflösung in Euro',
    'Kapitalsteuer in Euro',
    'Solzzuschlag in Euro',
    'Kirchensteuer in Euro',
    'Pauschalsteuer für die Jahre vor der Phase in Euro',
    'Pauschalsteuer für das Phase-Jahr in Euro',
    'Auszahlung in Euro',
    'Betrag für das Jahr',
    'Zinsen über das Phase-Jahr in Euro',
    'Steuer auf die Zinsen in Euro',
  ]);

  const row = rowByHeader(years, '2028');
  const cell = (header: string): Promise<Locator> => cellByHeader(years, row, header);
  await expect(await cell('Erlös aus der Fondsauflösung in Euro')).toHaveText(euro('1.193,35'));
  await expect(await cell('Kapitalsteuer in Euro')).toHaveText(euro('4,40'));
  await expect(await cell('Solzzuschlag in Euro')).toHaveText(euro('0,24'));
  await expect(await cell('Kirchensteuer in Euro')).toHaveText(euro('0,35'));
  await expect(await cell('Pauschalsteuer für die Jahre vor der Phase in Euro')).toHaveText(
    euro('0,22'),
  );
  await expect(await cell('Pauschalsteuer für das Phase-Jahr in Euro')).toHaveText(euro('1,12'));
  await expect(await cell('Auszahlung in Euro')).toHaveText(euro('1.200,00'));
  await expect(await cell('Betrag für das Jahr')).toHaveText(euro('1.188,36'));
  await expect(await cell('Zinsen über das Phase-Jahr in Euro')).toHaveText(euro('16,25'));
  await expect(await cell('Steuer auf die Zinsen in Euro')).toHaveText(euro('4,61'));
  // The row's own totals: 960 Cent of tax, and 960 + 118.804 + 1.625 = 1.209,60 Cent of money.
  const section = yearRegion(page);
  await expect(section.getByText(/^Summe der Steuer über die Phase-Jahre:/)).toHaveText(
    'Summe der Steuer über die Phase-Jahre: 105,47\u00a0€.',
  );
  await expect(section.getByText(/^Summe des Gelds der Phase-Jahre:/)).toHaveText(
    'Summe des Gelds der Phase-Jahre: 7.333,13\u00a0€.',
  );
});

// Story 047 AC3: the parts read across the two tables, and the sums the year section states once. Hand
// case, the tester's own arithmetic: phase 01.2031-12.2033, monthly 100,01 € = 10.001 Cent, flat 2,24 %,
// parking off, KSt on, church off. The flat figures of the three funding funds are 76,794412 Cent
// (fund 2030), 109,693335 Cent (fund 2031) and 147,354410 Cent (fund 2032), and the shown depot is
// 309.317 Cent. In the reading order the purchase parts come first (108.045, 103.174, 97.763 Cent), then
// the flat figures per phase year with column A before column B: 110 Cent (column A of row 2031), 32 Cent
// (column B of row 2031 for fund 2032), 115 Cent (column A of row 2032 for fund 2032 - its own rounding
// would be 116, so the derivation within the fund moves this figure), and last the year section's line for
// fund 2030, whose sale year is not a phase year: 78 Cent against its own rounding 77, so the rule can
// move it. The flat parts add up to the shown depot minus the shown purchase parts: 309.317 - 308.982 =
// 335 Cent.
test('047 AC3: the flat identity, the derived last part, and each sum line as the figures shown in its column', async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2031');
  await phaseEndInput(page).fill('12.2033');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,01');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();

  const years = yearTable(page);
  const section = yearRegion(page);
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('3.093,17'));

  // AC3's identity: column A of a fund's row plus column B of the earlier rows is that fund's figure.
  // Fund 2032: 32 Cent in column B of row 2031 plus 115 Cent in column A of its own row = 147 Cent.
  await expect(
    await cellByHeader(
      years,
      rowByHeader(years, '2031'),
      'Pauschalsteuer für die Jahre vor der Phase in Euro',
    ),
  ).toHaveText(euro('1,10'));
  await expect(
    await cellByHeader(
      years,
      rowByHeader(years, '2031'),
      'Pauschalsteuer für das Phase-Jahr in Euro',
    ),
  ).toHaveText(euro('0,32'));
  await expect(
    await cellByHeader(
      years,
      rowByHeader(years, '2032'),
      'Pauschalsteuer für die Jahre vor der Phase in Euro',
    ),
  ).toHaveText(euro('1,15'));
  expect(32 + 115, 'the pieces of fund 2032 add to its own figure').toBe(147);

  // The last part of the reading order is the year section's line for fund 2030, so it is derived from
  // the shown depot: 309.317 - 309.239 = 78 Cent, one Cent more than its own rounding (77 Cent).
  await expect(section.getByText(/^Fonds 2030:/)).toHaveText(
    'Fonds 2030: 0,78\u00a0€ (Auflösung in einem Jahr, das kein Phase-Jahr ist).',
  );
  expect(108045 + 103174 + 97763 + 110 + 32 + 115 + 78, 'the shown parts in whole Cent').toBe(
    309317,
  );

  // Each sum line is the sum of the figures shown in that column (hand values of the three rows):
  // KSt 1.520 + 2.406 + 3.523 = 7.449 Cent, Solz 84 + 132 + 194 = 410 Cent, the church column has no
  // figure so it has no line, the flat columns 225 and 32 Cent, the money columns 360.036 Cent each.
  const lines: [string, string][] = [
    ['Kapitalsteuer in Euro', '74,49'],
    ['Solzzuschlag in Euro', '4,10'],
    ['Pauschalsteuer für die Jahre vor der Phase in Euro', '2,25'],
    ['Pauschalsteuer für das Phase-Jahr in Euro', '0,32'],
    ['Auszahlung in Euro', '3.600,36'],
    ['Betrag für das Jahr', '3.600,36'],
    ['Erlös aus der Fondsauflösung in Euro', '3.678,95'],
  ];
  for (const [label, wert] of lines) {
    await expect(section.getByText(new RegExp(`^Summe ${label}: `))).toHaveText(
      `Summe ${label}: ${wert}\u00a0€.`,
    );
  }
  await expect(section.getByText(/Kirchensteuer/)).toHaveCount(0);
  // The two totals the section states once: 7.449 + 410 = 7.859 Cent, and 7.859 + 360.036 = 367.895.
  await expect(section.getByText(/^Summe der Steuer über die Phase-Jahre:/)).toHaveText(
    'Summe der Steuer über die Phase-Jahre: 78,59\u00a0€.',
  );
  await expect(section.getByText(/^Summe des Gelds der Phase-Jahre:/)).toHaveText(
    'Summe des Gelds der Phase-Jahre: 3.678,95\u00a0€.',
  );
});

// Story 047 AC4: each dash read as the full line text of its cell, and one row that shows a figure in one
// column and a dash with another reason in another. Hand case: phase 01.2029-12.2029, monthly 100,00 €,
// flat 0, parking off, KSt on, church off, and fund 2028's YTM typed as 0,00 so the gain is 0. The
// payout and the parked cell keep their hand figures (10.000 Cent x 12 = 120.000 Cent), while the tax
// columns name three different reasons: the church tax is not angehakt, and the KSt and the Solz read the
// zero gain. Hand shares with rho = 1: 120.000 / 3.800 Cent = 31,5789473684, so the money columns keep
// their figures. AC4's "a phase year without phase months" cannot be reached (`phaseYears` never yields
// one), so no test is written for it.
test('047 AC4: the dashes name their own reason, one column at a time', async ({ page }) => {
  await open(page);
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  await phaseStartInput(page).fill('01.2029');
  await phaseEndInput(page).fill('12.2029');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('100,00');
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await fundInput(page, 'ytm', 2028).fill('0,00');

  const years = yearTable(page);
  const row = rowByHeader(years, '2029');
  const cell = (header: string): Promise<Locator> => cellByHeader(years, row, header);
  await expect(await cell('Auszahlung in Euro')).toHaveText(euro('1.200,00'));
  await expect(await cell('Betrag für das Jahr')).toHaveText(euro('1.200,00'));
  await expect(await cell('Kapitalsteuer in Euro')).toHaveText(
    '– kein Gewinn, darauf keine Steuer',
  );
  await expect(await cell('Solzzuschlag in Euro')).toHaveText('– kein Gewinn, darauf keine Steuer');
  // The first-match-wins order of the church column names its own reason before the zero gain, because the
  // checkbox is off, while the other tax columns name the gain: two reasons in one row.
  await expect(await cell('Kirchensteuer in Euro')).toHaveText('– Kirchensteuer nicht angehakt');
  // The row does have a funding fund (fund 2028 funds this phase year), so the flat column cannot name the
  // funding cell's reason: UX §2 gives the flat columns their own order, and its reason for no figure with
  // a flat rate of 0 is the zero base. The funding cell is read by its own text (story 024).
  await expect(await cell('Finanzierung durch Fonds')).toHaveText(
    'Fonds 2028 (Auflösung Dezember 2028)',
  );
  // The flat columns read the fund still held in this year, and with a YTM of 0 no year of the holding
  // period pays: the rate applies, but the base is 0.
  await expect(await cell('Pauschalsteuer für die Jahre vor der Phase in Euro')).toHaveText(
    '– kein Jahr zahlt Steuer',
  );
  await expect(await cell('Pauschalsteuer für das Phase-Jahr in Euro')).toHaveText(
    '– kein Jahr zahlt Steuer',
  );

  // A phase year without a funding fund: the funding cell names the fund it lacks, the money columns read
  // that same reason, and `Betrag für das Jahr` keeps its plain dash (the decision of 2026-11-16).
  await phaseStartInput(page).fill('01.2027');
  await phaseEndInput(page).fill('12.2027');
  const alone = rowByHeader(yearTable(page), '2027');
  const onlyCell = (header: string): Promise<Locator> =>
    cellByHeader(yearTable(page), alone, header);
  await expect(await cellByHeader(yearTable(page), alone, 'Finanzierung durch Fonds')).toHaveText(
    'kein Fonds für dieses Jahr',
  );
  await expect(await onlyCell('Erlös aus der Fondsauflösung in Euro')).toHaveText(
    '– kein Fonds für dieses Jahr',
  );
  await expect(await onlyCell('Auszahlung in Euro')).toHaveText('– kein Fonds für dieses Jahr');
  await expect(await onlyCell('Betrag für das Jahr')).toHaveText('–');
  // The tax-off pair of the same rule: outside the tax case no part of the split is shown anywhere, so
  // every tax column reads the tax case, and the section states no sum line for an empty column.
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).uncheck();
  const offRow = rowByHeader(yearTable(page), '2027');
  for (const label of ['Kapitalsteuer in Euro', 'Solzzuschlag in Euro', 'Kirchensteuer in Euro']) {
    await expect(await cellByHeader(yearTable(page), offRow, label)).toHaveText(
      '– Steuer nicht angehakt',
    );
  }
});
