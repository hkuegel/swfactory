/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, type Locator, type Page } from '@playwright/test';

// Helpers of the story 013, 014 and 015 specs. Euro figures contain U+00A0 before the euro sign: matched with \s.

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
export const reinvestBox = (page: Page) =>
  page.getByRole('checkbox', { name: 'Steuererstattung wieder anlegen', exact: true });

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

/** Cents of a displayed amount such as "-4.478,79 €" (parses the page text, not the model). */
export function cents(text: string | null): number {
  const match = /^(-?)([\d.]+),(\d{2})\s€/.exec((text ?? '').trim());
  if (match === null) throw new Error(`not an amount: ${String(text)}`);
  const value = Number((match[2] ?? '').replace(/\./g, '')) * 100 + Number(match[3]);
  return match[1] === '-' ? -value : value;
}

/** Counts chart pixels within a small tolerance of each series token colour (013, 015). */
export async function chartSeriesPixels(page: Page) {
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
      reinvested: count(rgb('--chart-reinvested')),
      returns: count(rgb('--chart-returns')),
    };
  }, png);
}

/** Pixels whose channels differ by more than `tolerance` between two PNGs (base64); raster noise stays below it. */
// Measured noise of identical charts: <= 1/255 over 984 pixels; a real change differs in 43.333 pixels.
export async function differingPixels(page: Page, a: string, b: string, tolerance = 2) {
  return page.evaluate(
    async ([x, y, tol]) => {
      const load = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (ctx === null) throw new Error('no 2d context');
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      const p = await load(String(x));
      const q = await load(String(y));
      if (p.width !== q.width || p.height !== q.height) return Number.POSITIVE_INFINITY;
      let n = 0;
      for (let i = 0; i < p.data.length; i += 4) {
        for (let k = 0; k < 3; k += 1) {
          if (Math.abs((p.data[i + k] ?? 0) - (q.data[i + k] ?? 0)) > Number(tol)) {
            n += 1;
            break;
          }
        }
      }
      return n;
    },
    [a, b, tolerance] as const,
  );
}
