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
  await page.getByRole('radio', { name: 'Auszahlung gegeben, Depot gesucht' }).check();
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
    page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }),
    page.getByRole('checkbox', { name: 'Kirchensteuer auf die Kapitalertragsteuer', exact: true }),
    page.getByLabel('Bundesland für die Kirchensteuer', { exact: true }),
  ];
  for (const field of fields) {
    await expect(field, `field ${field}`).not.toBeDisabled();
  }

  // The form order of `FIELD_IDS` (Beginn, Ende, Betrag), then the tax controls in the order the form
  // renders them (story 031 replaced the typed rate).
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

  // Hand case on one fund row, so the projection is a plain multiplication: NAV 40,00 € typed, YTM 100 %,
  // and the file's asOf (31.12.2026) is 731 days before the liquidation of 2028, so the factor is
  // 2^(731/365) = 4,0076034. The figures below are hand values derived from that factor, not read from
  // the app: 40.000.000 micro-euro times the factor, once with the rate taken off the gain.
  const table = fundTable(page);
  const row = rowByHeader(table, '2028');
  const shown = await cellByHeader(table, row, 'Hochrechnung je Anteil in Euro');
  await fundInput(page, 'nav', 2028).fill('40,00');
  await fundInput(page, 'ytm', 2028).fill('100,00');
  await expect(shown).toHaveText(euro('160,30')); // no tax
  await kst.check();
  await expect(shown).toHaveText(euro('128,57')); // 26,375 %
  await kist.check();
  await expect(shown).toHaveText(euro('126,17')); // 28,375 %, Bayern at 8 %
  await land.selectOption('brandenburg');
  await expect(shown).toHaveText(euro('125,87')); // 28,625 %
  // AC2, second half: the church tax is computed on the Kapitalertragsteuer, so it is ignored while that
  // checkbox is unchecked, and the figure goes back to the pre-tax projection.
  await kst.uncheck();
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
  await page.getByRole('radio', { name: 'Auszahlung gegeben, Depot gesucht' }).check();
  await phaseStartInput(page).fill('01.2029');
  await phaseEndInput(page).fill('12.2030');
  await page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true }).fill('1000,01');

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
    page.getByRole('region', { name: 'Fondsplan', exact: true }).locator('p').first(),
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
