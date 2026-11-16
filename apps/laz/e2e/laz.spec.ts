/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib); page.evaluate callbacks run in the browser.
import { expect, test, type Locator, type Page } from '@playwright/test';
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
  givenPayout,
  kistBox,
  kstBox,
  readStatement,
  statementRegion,
  statementTable,
  toCents,
  toCentsAll,
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

/** The fund table's twelve columns in the order of the calculation (048 AC4). */
const FUND_HEADERS = [
  'Jahr',
  'Fondsname',
  'ISIN',
  'Kurs heute',
  'YTM in Prozent',
  'Hochrechnung je Anteil in Euro',
  'Anteile',
  'Einstand (Anteile × Kurs)',
  'Erlös brutto (Anteile × Hochrechnung)',
  'Gewinn (Erlös − Einstand)',
  'Summe der Vorabpauschalen-Basen',
  'Steuerpflichtiger Gewinn (Gewinn − Basen)',
];

/**
 * The one-fund case of 031 and 048: fund 2028 with NAV 40,00 and YTM 100 %, asOf 31.12.2026, so d = 731 and
 * rho = 2^(731/365) = 4,0076034; phase 2029 only, payout 100,01 EUR a month = 1.200,12 EUR, flat rate 0.
 */
async function oneFundCase(page: Page): Promise<void> {
  await flatInput(page).fill('0');
  await givenPayout(page, '100,01');
  await phaseStartInput(page).fill('01.2029');
  await phaseEndInput(page).fill('12.2029');
  await fundInput(page, 'nav', 2028).fill('40,00');
  await fundInput(page, 'ytm', 2028).fill('100,00');
}

test('024 AC2: the statement pays each phase year from the fund of the year before, and a phase outside the list has no statement', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2034');
  await amountInput(page).fill('10000,00');

  // UX §5: the caption names the two phase MONTHS in start - end order, no day. The names are the test's
  // own oracle (German month names of the phase months 2028-01 and 2034-03).
  const caption = await statementTable(page).locator('caption').innerText();
  expect(caption, 'caption names the phase start month').toContain('Januar 2028');
  expect(caption, 'caption names the phase end month').toContain('März 2034');
  expect(caption.indexOf('März 2034')).toBeGreaterThan(caption.indexOf('Januar 2028'));
  expect(caption, 'caption names months, not days').not.toMatch(/\d{2}\.\d{2}\.\d{4}/);

  // Hand, tax off: F = 66,947895916, so 10.000,00 EUR gives 149,37 EUR a month; a 12-month year pays
  // 1.792,44 EUR (179.243,87 Cent). A fund matures in December of the year before its phase year, so the
  // 1.792,44 EUR of proceeds stand in the rows 2027 to 2032 and the three months of 2034 in row 2033
  // (448,11 EUR). The seven rounded purchases 1.765,95 + 1.722,74 + 1.664,34 + 1.592,43 + 1.509,04 +
  // 1.416,29 + 329,20 add up to 9.999,99 EUR. The last payout is the residue: 0,01 + proceeds
  // (6 x 1.792,44 + 448,11 = 11.202,75) - six payouts of 1.792,44 (10.754,64) = 448,12 EUR.
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('149,37'));
  const read = await readStatement(page);
  expect(read.rows.map((row) => row.year)).toEqual([
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
    '2034',
  ]);
  const at = (year: string) => read.rows.find((row) => row.year === year)?.cells ?? {};
  expect(at('2026')['Kauf der Fonds']).toBe(-999999);
  for (const year of ['2027', '2028', '2029', '2030', '2031', '2032']) {
    expect(at(year)['Erlös aus Auflösung (brutto)'], `proceeds ${year}`).toBe(179244);
  }
  expect(at('2033')['Erlös aus Auflösung (brutto)']).toBe(44811);
  expect(at('2034')['Erlös aus Auflösung (brutto)']).toBe(0);
  expect(at('2027')['Auszahlungen']).toBe(0);
  for (const year of ['2028', '2029', '2030', '2031', '2032', '2033']) {
    expect(at(year)['Auszahlungen'], `payout ${year}`).toBe(-179244);
  }
  expect(at('2034')['Auszahlungen']).toBe(-44812);

  // A phase outside the list has no funding fund: no statement, and the callout says so.
  await phaseStartInput(page).fill('01.2026');
  await phaseEndInput(page).fill('12.2026');
  await expect(statementRegion(page)).toHaveCount(0);
  await expect(result(page)).toContainText(
    'Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.',
  );

  // N = 1 (first and last phase year are the same year, one month): funded by fund 2029, rho = 1,0769635,
  // so 10.000,00 EUR buy 10.000,00 EUR of Einstand and the payout of row 2030 is 10.769,63 EUR.
  await phaseStartInput(page).fill('01.01.2030');
  await phaseEndInput(page).fill('31.01.2030');
  const single = await readStatement(page);
  expect(single.rows.map((row) => row.year)).toEqual(['2026', '2027', '2028', '2029', '2030']);
  expect(single.rows[0]?.cells['Kauf der Fonds']).toBe(-1000000);
  expect(single.rows[3]?.cells['Erlös aus Auflösung (brutto)']).toBe(1076963);
  expect(single.rows[4]?.cells['Auszahlungen']).toBe(-1076963);
  expect(single.rows[4]?.cells['Kontostand am Ende']).toBe(0);
});

test('048 AC1: the rates by section 32d, no typed rate, the checkboxes, the Bundesland select and the effective rate', async ({
  page,
}) => {
  // The accessibility tree has no control for a typed rate.
  await expect(page.getByLabel('Steuersatz in Prozent', { exact: true })).toHaveCount(0);
  const land = page.getByRole('combobox', {
    name: 'Bundesland für die Kirchensteuer',
    exact: true,
  });
  // The select lists the 16 Bundeslaender with the rate each one uses, starting at Bayern.
  await expect(land.getByRole('option')).toHaveCount(16);
  await expect(land).toHaveValue('bayern');
  await expect(land.getByRole('option').first()).toHaveText('Bayern (8 %)');

  await oneFundCase(page);
  // Hand (rho = 4,0076034, payout 1.200,12 EUR). KapESt only: net per share 40 x (rho - 0,26375 (rho - 1)),
  // shares 9,3340859, gain 1.122,93 EUR, KapESt 280,73, Soli 15,44. KiSt 8 %: KapESt = 25 % / 1,02 =
  // 24,5098 % of the gain, Soli 13,48 per 1.000 (rate 27,8186 %), shares 9,4618947, gain 1.138,31 EUR:
  // 279,00 / 15,34 / 22,32. KiSt 9 % (rate 27,9951 %): shares 9,4777598, gain 1.139,67 EUR:
  // 278,78 / 15,33 / 25,09. The old rate 28,375 % would give a KapESt of 280,73 and a KiSt of 22,89.
  const row2028 = async (header: string): Promise<Locator> =>
    cellByHeader(statementTable(page), rowByHeader(statementTable(page), '2028'), header);
  await kstBox(page).check();
  await expect(await row2028('Kapitalertragsteuer')).toHaveText(euro('-280,73'));
  await expect(await row2028('Solidaritätszuschlag')).toHaveText(euro('-15,44'));
  await expect(
    statementTable(page).getByRole('columnheader', { name: 'Kirchensteuer' }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/sind das mit den gewählten Einstellungen 26,38 % auf den Gewinn/),
  ).toBeVisible();
  await kistBox(page).check();
  await expect(await row2028('Kapitalertragsteuer')).toHaveText(euro('-279,00'));
  await expect(await row2028('Solidaritätszuschlag')).toHaveText(euro('-15,34'));
  await expect(await row2028('Kirchensteuer')).toHaveText(euro('-22,32'));
  await expect(
    page.getByText(/sind das mit den gewählten Einstellungen 27,82 % auf den Gewinn/),
  ).toBeVisible();
  await land.selectOption('brandenburg');
  await expect(await row2028('Kapitalertragsteuer')).toHaveText(euro('-278,78'));
  await expect(await row2028('Solidaritätszuschlag')).toHaveText(euro('-15,33'));
  await expect(await row2028('Kirchensteuer')).toHaveText(euro('-25,09'));
  await expect(
    page.getByText(/sind das mit den gewählten Einstellungen 28,00 % auf den Gewinn/),
  ).toBeVisible();
  // The church tax is computed on the KapESt, so it is ignored while that checkbox is unchecked and no tax
  // column is shown.
  await kstBox(page).uncheck();
  for (const header of ['Kapitalertragsteuer', 'Solidaritätszuschlag', 'Kirchensteuer']) {
    await expect(
      statementTable(page).getByRole('columnheader', { name: header, exact: true }),
    ).toHaveCount(0);
  }
  await expect(kstBox(page)).not.toBeDisabled();
  await expect(kistBox(page)).not.toBeDisabled();
});

test('048 AC2: the Vorabpauschale is money of the whole holding, so the payout is a little lower and never higher', async ({
  page,
}) => {
  await amountInput(page).fill('300000,00');
  await kstBox(page).check();
  await kistBox(page).check();
  await flatInput(page).fill('0');
  // Hand, KiSt 8 % (rate 27,8186 %), flat rate 0: P = 300.000 / sum(12 / (rho - r (rho - 1))) over the
  // funding funds 2027 to 2033 (2034 with 3 months) = 4.352,96 EUR; the old rate 28,375 % gives less.
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('4.352,96'));
  const columns = async () => (await readStatement(page)).headers;
  expect(await columns()).not.toContain('Vorabpauschale (Steuer)');
  const base = toCents(await figure(page, 'Maximale monatliche Auszahlung').innerText());

  await flatInput(page).fill('2,24');
  const flat = toCents(await figure(page, 'Maximale monatliche Auszahlung').innerText());
  // The tax paid earlier comes from cash that no longer grows in the fund: strictly lower, at most 0,5 %.
  expect(flat).toBeLessThan(base);
  expect(base - flat).toBeLessThanOrEqual(base * 0.005);
  const read = await readStatement(page);
  expect(read.headers).toContain('Vorabpauschale (Steuer)');
  // The Vorabpauschale of year Y is paid in row Y+1: nothing in the first row, something in 2027.
  expect(read.rows[0]?.cells['Vorabpauschale (Steuer)']).toBe(0);
  expect(read.rows[1]?.cells['Vorabpauschale (Steuer)']).toBeLessThan(0);

  // Flat tax paid + liquidation tax = 27,8186 % of the whole gain of the holding (hand rate, gains from
  // the fund table). Cells are rounded one by one, so 20 Cent cover the 28 rounded cells.
  const paid = read.rows.reduce(
    (sum, row) =>
      sum -
      (row.cells['Vorabpauschale (Steuer)'] ?? 0) -
      (row.cells['Kapitalertragsteuer'] ?? 0) -
      (row.cells['Solidaritätszuschlag'] ?? 0) -
      (row.cells['Kirchensteuer'] ?? 0),
    0,
  );
  let gain = 0;
  for (const year of ['2027', '2028', '2029', '2030', '2031', '2032', '2033']) {
    const cell = await cellByHeader(
      fundTable(page),
      rowByHeader(fundTable(page), year),
      'Gewinn (Erlös − Einstand)',
    );
    gain += toCents(await cell.innerText());
  }
  expect(gain).toBeGreaterThan(0);
  expect(Math.abs(paid - gain * 0.278186)).toBeLessThanOrEqual(20);
});

test('048 AC3: the account statement, its column order, start + flows = end in every row, and hidden empty columns', async ({
  page,
}) => {
  // Full case: depot 300.000 EUR, KapESt + KiSt, flat 2,24 (the prefill), parking 2,50.
  await amountInput(page).fill('300000,00');
  await kstBox(page).check();
  await kistBox(page).check();
  await depositSwitch(page).check();
  const full = await readStatement(page);
  expect(full.headers).toEqual([
    'Jahr',
    'Kontostand am Anfang',
    'Kauf der Fonds',
    'Vorabpauschale (Steuer)',
    'Erlös aus Auflösung (brutto)',
    'Kapitalertragsteuer',
    'Solidaritätszuschlag',
    'Kirchensteuer',
    'Zinsen Tagesgeld',
    'Steuer auf Zinsen',
    'Auszahlungen',
    'Kontostand am Ende',
  ]);
  expect(full.rows.map((row) => row.year)).toEqual([
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
    '2034',
  ]);
  const flows = full.headers.filter(
    (header) => !['Jahr', 'Kontostand am Anfang', 'Kontostand am Ende'].includes(header),
  );
  let previousEnd = 30000000;
  for (const row of full.rows) {
    const start = row.cells['Kontostand am Anfang'] ?? Number.NaN;
    const sum = flows.reduce((total, header) => total + (row.cells[header] ?? 0), 0);
    expect(start, `start of ${row.year} is the end before`).toBe(previousEnd);
    expect(start + sum, `start + flows = end in ${row.year}`).toBe(row.cells['Kontostand am Ende']);
    previousEnd = row.cells['Kontostand am Ende'] ?? Number.NaN;
  }
  expect(previousEnd, 'the last end').toBe(0);
  // Outflows are negative, the purchase is in the first row only, the Vorabpauschale of 2026 is paid in 2027,
  // the liquidation of the fund 2027 stands in 2027 and the last phase year has none.
  expect(full.rows[0]?.cells['Kauf der Fonds']).toBeLessThan(0);
  expect(full.rows[1]?.cells['Kauf der Fonds']).toBe(0);
  expect(full.rows[0]?.cells['Vorabpauschale (Steuer)']).toBe(0);
  expect(full.rows[1]?.cells['Vorabpauschale (Steuer)']).toBeLessThan(0);
  expect(full.rows[0]?.cells['Erlös aus Auflösung (brutto)']).toBe(0);
  expect(full.rows[1]?.cells['Erlös aus Auflösung (brutto)']).toBeGreaterThan(0);
  expect(full.rows[8]?.cells['Erlös aus Auflösung (brutto)']).toBe(0);

  // Tax-free case, hand figures of 024 AC2: the six empty columns are not shown, and row 2028 reads
  // 1.792,45 + 1.792,44 - 1.792,44 = 1.792,45 EUR.
  await kstBox(page).uncheck();
  await kistBox(page).uncheck();
  await depositSwitch(page).uncheck();
  await amountInput(page).fill('10000,00');
  const free = await readStatement(page);
  expect(free.headers).toEqual([
    'Jahr',
    'Kontostand am Anfang',
    'Kauf der Fonds',
    'Erlös aus Auflösung (brutto)',
    'Auszahlungen',
    'Kontostand am Ende',
  ]);
  const row2028 = free.rows.find((row) => row.year === '2028')?.cells;
  expect(row2028).toEqual({
    'Kontostand am Anfang': 179245,
    'Kauf der Fonds': 0,
    'Erlös aus Auflösung (brutto)': 179244,
    Auszahlungen: -179244,
    'Kontostand am Ende': 179245,
  });
  expect(free.rows[0]?.cells['Kontostand am Anfang']).toBe(1000000);
  expect(free.rows[8]?.cells['Kontostand am Ende']).toBe(0);

  // The interest columns, hand: payout 100,00 EUR, phase 2033-2034 (two full years), KapESt only, flat 0,
  // parking 2,50 %: interest 6,5 x 100 x 2,5 % = 16,25 EUR a year, its tax 26,375 % = 4,2859 -> 4,29 EUR.
  await kstBox(page).check();
  await flatInput(page).fill('0');
  await depositSwitch(page).check();
  await givenPayout(page, '100,00');
  await phaseStartInput(page).fill('01.2033');
  await phaseEndInput(page).fill('12.2034');
  const parked = await readStatement(page);
  for (const year of ['2033', '2034']) {
    const cells = parked.rows.find((row) => row.year === year)?.cells;
    expect(cells?.['Zinsen Tagesgeld'], `interest ${year}`).toBe(1625);
    expect(cells?.['Steuer auf Zinsen'], `tax on interest ${year}`).toBe(-429);
  }
});

test('048 AC4: the fund table shows the way to the gain, the columns in order and no tax amount', async ({
  page,
}) => {
  const table = fundTable(page);
  const headers = (await table.getByRole('columnheader').allInnerTexts()).map((h) => h.trim());
  expect(headers).toEqual(FUND_HEADERS);
  expect(headers.join('|')).not.toMatch(
    /Kapitalertragsteuer|Solidarit|Kirchensteuer|Pauschalsteuer/,
  );

  await oneFundCase(page);
  await kstBox(page).check();
  // Hand: shares 9,3340859 (see 048 AC1), Einstand 9,3340859 x 40 = 373,36 EUR, Erlös 9,3340859 x 160,3041
  // = 1.496,29 EUR, Gewinn 1.496,29 - 373,36 = 1.122,93 EUR; flat rate 0 means no base, so the taxable
  // gain is the gain.
  const row = rowByHeader(table, '2028');
  const cell = (header: string) => cellByHeader(table, row, header);
  await expect(await cell('Anteile')).toHaveText('9,33');
  await expect(await cell('Einstand (Anteile × Kurs)')).toHaveText(euro('373,36'));
  await expect(await cell('Erlös brutto (Anteile × Hochrechnung)')).toHaveText(euro('1.496,29'));
  await expect(await cell('Gewinn (Erlös − Einstand)')).toHaveText(euro('1.122,93'));
  await expect(await cell('Steuerpflichtiger Gewinn (Gewinn − Basen)')).toHaveText(
    euro('1.122,93'),
  );
  // The same figures stand in the statement: purchase in the first row, proceeds in the maturity year.
  const read = await readStatement(page);
  expect(read.rows[0]?.cells['Kauf der Fonds']).toBe(-37336);
  expect(read.rows.find((r) => r.year === '2028')?.cells['Erlös aus Auflösung (brutto)']).toBe(
    149629,
  );

  // With a flat rate the bases of the whole holding are subtracted: taxable gain = gain - bases, as cells.
  await flatInput(page).fill('2,24');
  const bases = toCents(await (await cell('Summe der Vorabpauschalen-Basen')).innerText());
  const gain = toCents(await (await cell('Gewinn (Erlös − Einstand)')).innerText());
  const taxable = toCents(
    await (await cell('Steuerpflichtiger Gewinn (Gewinn − Basen)')).innerText(),
  );
  expect(bases).toBeGreaterThan(0);
  expect(taxable).toBe(Math.max(0, gain - bases));
});

test('048 AC5: the result block shows the depot split and a check line that equals the statement sums', async ({
  page,
}) => {
  // Tax-free hand case (024 AC2): Einstand 9.999,99 + reserve 0,01 = depot 10.000,00; the check line reads
  // 10.000,00 - 9.999,99 + 11.202,75 - 0,00 + 0,00 - 11.202,76 = 0,00.
  await amountInput(page).fill('10000,00');
  await expect(figure(page, 'Aufteilung des Depots')).toHaveText(
    /^Einstand aller Fonds 9\.999,99\s€ \+ Reserve für die Vorabpauschale 0,01\s€ = Depot 10\.000,00\s€$/,
  );
  await expect(result(page).getByText(/^Prüfung:/)).toHaveText(
    /^Prüfung: Depot 10\.000,00\s€ − Kauf 9\.999,99\s€ \+ Erlöse 11\.202,75\s€ − alle Steuern 0,00\s€ \+ Zinsen 0,00\s€ − Auszahlungen 11\.202,76\s€ = 0,00\s€\.$/,
  );

  // Full case: every figure of the line is the column sum read from the statement cells.
  await amountInput(page).fill('300000,00');
  await kstBox(page).check();
  await kistBox(page).check();
  await depositSwitch(page).check();
  const read = await readStatement(page);
  const sum = (header: string): number =>
    read.rows.reduce((total, row) => total + (row.cells[header] ?? 0), 0);
  const line = await result(page)
    .getByText(/^Prüfung:/)
    .innerText();
  const figures = toCentsAll(line);
  const [depot, purchase, proceeds, taxes, interest, payout, zero] = figures;
  const taxSum =
    sum('Vorabpauschale (Steuer)') +
    sum('Kapitalertragsteuer') +
    sum('Solidaritätszuschlag') +
    sum('Kirchensteuer') +
    sum('Steuer auf Zinsen');
  expect(depot).toBe(30000000);
  expect(purchase).toBe(-sum('Kauf der Fonds'));
  expect(proceeds).toBe(sum('Erlös aus Auflösung (brutto)'));
  expect(taxes).toBe(-taxSum);
  expect(interest).toBe(sum('Zinsen Tagesgeld'));
  expect(payout).toBe(-sum('Auszahlungen'));
  expect(zero).toBe(0);
  expect(
    (depot ?? 0) -
      (purchase ?? 0) +
      (proceeds ?? 0) -
      (taxes ?? 0) +
      (interest ?? 0) -
      (payout ?? 0),
  ).toBe(0);
  // The split adds up: Einstand + reserve = depot, with a reserve above 0 in the tax case.
  const split = toCentsAll(await figure(page, 'Aufteilung des Depots').innerText());
  expect(split[0]).toBe(purchase);
  expect((split[0] ?? 0) + (split[1] ?? 0)).toBe(split[2]);
  expect(split[1]).toBeGreaterThan(0);
});

test('048 AC6: with the tax boxes and the parking option off the payout and the depot are the values from before', async ({
  page,
}) => {
  // Hand: sum over the funding funds of 12 / rho (2034: 3 months) = 66,947896 for the example phase, so
  // 300.000 EUR give 4.481,10 EUR a month, and 4.000 EUR a month need 4.000 x 66,947896 = 267.791,58 EUR.
  await amountInput(page).fill('300000,00');
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('4.481,10'));
  await givenPayout(page, '4000,00');
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('267.791,58'));
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
  await expect(liveText()).resolves.toMatch(/^Maximale monatliche Auszahlung: 149,37\s€\.$/);

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
  await expect(liveText()).resolves.toMatch(/^Maximale monatliche Auszahlung: 179,24\s€\.$/);
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

  // The other direction, on the monthly target above 024's maximum.
  // Story 044: the radio names the whole rule, so the test names the radio by its copy.
  await page
    .getByRole('radio', { name: 'Die monatliche Auszahlung ist gegeben, gesucht wird das Depot' })
    .check();
  const target = page.getByLabel('Monatliche Auszahlung als Ziel (EUR)', { exact: true });
  await target.fill('12000,00');
  await expect(target).not.toHaveAttribute('aria-invalid');
  await expect(figure(page, 'Benötigtes Depot für die Phase')).toHaveText(euro('803.374,75'));
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
test('033 AC1, AC2: a phase outside the fund list keeps every fund, the short month form is accepted, and a partial month names no error', async ({
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

  // Story 048: no funding fund means no statement, only the callout; the fund table keeps every fund.
  await expect(statementRegion(page)).toHaveCount(0);
  expect(await resultText(page)).toContain(
    'Kein Ergebnis möglich: die Phase hat kein Jahr mit einem Fonds.',
  );
  await expect(fundTable(page).locator('tbody tr')).toHaveCount(9);
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

// Story 032 – the purchase side of the fund table: `shares = phase-year amount / projected payout per
// share`, `purchase = shares × NAV`. Hand oracles, recomputed by hand from the fixture copy as story 035
// extended it with the two boundary funds, using the same spans 024 uses (asOf 31.12.2026 → 31.12. of the
// fund year): the pre-tax factors are ρ = 1,0150000 (2027), 1,0404516 (2028), 1,0769573 (2029), 1,1255649
// (2030), 1,1878281 (2031), 1,2655355 (2032), 1,3612328 (2033), 1,4778504 (2034), 1,6195693 (2035).
// A fund row funds the phase year after its liquidation year (024 AC2), and `shares × NAV` cancels the
// NAV, so a row's purchase is its phase year's amount divided by that factor.

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
    await expect(await cellByHeader(table, row, 'Anteile'), `row ${year}`).toHaveText(shares);
    await expect(
      await cellByHeader(table, row, 'Einstand (Anteile × Kurs)'),
      `row ${year}`,
    ).toHaveText(euro(purchase));
  }

  // AC1, the other state of the same model: KSt alone is 26,375 % (Soli included, church tax off), so the
  // factor becomes ρ − 0,26375·(ρ − 1) = 1,0297879 for 2028 and the hand figures become 44,56 shares and
  // 1.693,44 € (F = 68,812020831, monthly 14.532,344610 Cent). The tax is the one the projection column
  // already uses (024 AC4, story 031).
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  const row2028 = rowByHeader(table, '2028');
  await expect(await cellByHeader(table, row2028, 'Anteile')).toHaveText('44,56');
  await expect(await cellByHeader(table, row2028, 'Einstand (Anteile × Kurs)')).toHaveText(
    euro('1.693,44'),
  );
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
    cellByHeader(table, rowByHeader(table, year), 'Anteile');
  const purchaseCell = (year: string): Promise<Locator> =>
    cellByHeader(table, rowByHeader(table, year), 'Einstand (Anteile × Kurs)');

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
  await expect(statementRegion(page)).toHaveCount(0);
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
// A 12-month phase year pays 143.658 Cent = 1.436,58 €; 2036 has three months and is funded by the fund
// that matures in 2035 (hak's second request).
test('035 AC1: 2028 names the 2027 fund as its funding fund, 2036 names the 2035 fund, and the amount of 2036 is the monthly payout times its three months', async ({
  page,
}) => {
  await phaseStartInput(page).fill('01.01.2028');
  await phaseEndInput(page).fill('31.03.2036');
  await amountInput(page).fill('10000,00');

  // Rows 2026 to 2036 (11); a 12-month year pays 1.436,58 EUR (143.658 Cent); the fund 2035 matures in
  // 2035 and its three months are 3 x 119,714597 = 359,14 EUR of proceeds; the last payout is that figure
  // plus the rounding residue of the purchases: 0,01 + 8 x 1.436,58 + 359,14 - 8 x 1.436,58 = 359,15.
  const read = await readStatement(page);
  expect(read.rows.map((row) => row.year)).toEqual([
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
    '2034',
    '2035',
    '2036',
  ]);
  const at = (year: string) => read.rows.find((row) => row.year === year)?.cells ?? {};
  expect(at('2028')['Auszahlungen']).toBe(-143658);
  expect(at('2035')['Erlös aus Auflösung (brutto)']).toBe(35914);
  // The residue is the Reserve of the result block, 10.000,00 - the rounded Einstand figures = 0,01 EUR.
  await expect(figure(page, 'Aufteilung des Depots')).toContainText(
    'Reserve für die Vorabpauschale 0,01',
  );
  expect(at('2036')['Auszahlungen']).toBe(-35915);
  expect(at('2036')['Kontostand am Ende']).toBe(0);
  await expect(figure(page, 'Maximale monatliche Auszahlung')).toHaveText(euro('119,71'));
});

// Story 036 – the fund row names the fund it is. The strings below are written by hand from the fixture
// copy (P16), then cross-checked against the same file the app is built with in e2e mode (story 025,
// ADR 0013), so the oracle is not the module under test.
test('036 AC1, AC2, AC3: the fund row shows the hand name and ISIN, the course column is named Kurs heute, and the row header stays the year', async ({
  page,
}) => {
  const table = fundTable(page);

  // AC1: the columns have one order for the whole table.
  const headers = await table.getByRole('columnheader').allInnerTexts();
  expect(headers.map((header) => header.trim())).toEqual(FUND_HEADERS);

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

  // Nothing is counted while the tax is off: no Vorabpauschale column in the statement. With the box on
  // and a result, the column is there (the figures are asserted in 048 AC2).
  await givenPayout(page, '100,01');
  const flatHeader = statementTable(page).getByRole('columnheader', {
    name: 'Vorabpauschale (Steuer)',
    exact: true,
  });
  await expect(flatHeader).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Kapitalertragsteuer (25 %)', exact: true }).check();
  await expect(flatHeader).toHaveCount(1);
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
  // With the rate 0 the statement shows no interest column; with the rate typed back it does (hand
  // figures of the interest are in 048 AC3).
  const interestHeader = statementTable(page).getByRole('columnheader', {
    name: 'Zinsen Tagesgeld',
    exact: true,
  });
  await expect(interestHeader).toHaveCount(0);
  await field.fill('2,50');
  await expect(interestHeader).toHaveCount(1);
  await field.fill('0');

  // P27: once the value is edited, an invalid one is announced with the label UX §2 gives the field, and the
  // field is marked without being disabled. The pair is the empty error before the first edit above.
  await field.fill('101,00');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(field).not.toBeDisabled();
  await expect(block.getByText(/Zinssatz in Prozent: /)).toHaveCount(1);
  await expect(liveRegion(page)).toHaveText('Kein Ergebnis: Zinssatz in Prozent ist ungültig.');
});
