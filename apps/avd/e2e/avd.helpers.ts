/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, type Locator, type Page } from '@playwright/test';

// Helpers of the story 013 to 016 specs. Euro figures contain U+00A0 before the euro sign: matched with \s.

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
export const retirementInput = (page: Page) =>
  page.getByLabel('Steuersatz im Ruhestand', { exact: true });
export const allowanceBox = (page: Page) =>
  page.getByRole('checkbox', {
    name: 'Sparerpauschbetrag (1.000 €/Jahr) für dieses Depot nutzen',
    exact: true,
  });

/** The `dd` of a `dt` with exactly this text inside `scope`. */
const valueOf = (scope: Locator, label: string): Locator =>
  scope
    .locator('dt', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}$`) })
    .locator('xpath=following-sibling::dd');

/** The value belonging to a result label in "Ergebnis" (`dt` -> following `dd`), full label only. */
export const figure = (page: Page, label: string): Locator =>
  valueOf(page.getByRole('region', { name: 'Ergebnis', exact: true }), label);

/** The ETF comparison region (story 016). */
export const comparison = (page: Page) =>
  page.getByRole('region', { name: 'Vergleich mit einem ETF-Depot', exact: true });

/** The figure block of one depot in the comparison. */
export const depotBlock = (page: Page, depot: 'AVD' | 'ETF') =>
  comparison(page).getByRole('group', {
    name: depot === 'AVD' ? 'Altersvorsorgedepot (AVD)' : 'ETF-Depot',
    exact: true,
  });

/** A comparison figure of one depot by its exact label (never by position). */
export const compareFigure = (page: Page, depot: 'AVD' | 'ETF', label: string): Locator =>
  valueOf(depotBlock(page, depot), label);

/** The signed difference "AVD minus ETF", outside both blocks. */
export const compareDifference = (page: Page): Locator =>
  valueOf(comparison(page), 'Unterschied (AVD minus ETF)');

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
  const rgb = {
    contributions: await colourOf(page, SERIES_TOKENS.contributions),
    zulagen: await colourOf(page, SERIES_TOKENS.zulagen),
    reinvested: await colourOf(page, SERIES_TOKENS.reinvested),
    returns: await colourOf(page, SERIES_TOKENS.returns),
  };
  return page.evaluate(
    async ([data, colours]) => {
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
        contributions: count(colours.contributions),
        zulagen: count(colours.zulagen),
        reinvested: count(colours.reinvested),
        returns: count(colours.returns),
      };
    },
    [png, rgb] as const,
  );
}

/** Pixels whose channels differ by more than `tolerance` between two PNGs (base64); raster noise stays below it. */
// Measured noise of identical charts: <= 1/255 over 984 pixels on the Linux runner, and <= 3/255
// on Windows (2 pixels at tolerance 2; the worst is 248,247,245 -> 246,244,244). A re-render of an
// unchanged chart can reach that floor on Windows, never on Linux. A real change differs in
// 43.333 pixels, so the assertions compare against the floor of both platforms (story 022).
const RASTER_NOISE_FLOOR = 4;
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

/** The "Ergebnis" region. */
export const result = (page: Page) => page.getByRole('region', { name: 'Ergebnis', exact: true });

/**
 * Hides the chart's HTML text (axis labels, axis title, empty note) for a screenshot; layout stays.
 * Bug 019: on the Linux runner the same label text rasterises differently after a re-render
 * (2920 px, up to 85/255, only in glyphs; bars 1/255), so pixels compare the plot and the DOM
 * compares the labels.
 */
const CHART_TEXT_HIDDEN =
  '[aria-label^="Gestapeltes Säulendiagramm"] > :not(:has(svg)), ' +
  '[aria-label^="Gestapeltes Säulendiagramm"] p { visibility: hidden !important; }';

/**
 * Figures and notes of "Ergebnis", the year table and the chart, to compare before and after:
 * the chart as a screenshot without its text plus its markup (labels, positions, aria-label).
 */
export async function savingSnapshot(page: Page) {
  return {
    figures: (await result(page).locator('dl, p:not([aria-live])').allInnerTexts()).join('\n'),
    table: await page.getByRole('table').innerText(),
    chart: (
      await chart(page).screenshot({ animations: 'disabled', style: CHART_TEXT_HIDDEN })
    ).toString('base64'),
    chartHtml: await chart(page).evaluate((el) => el.outerHTML),
  };
}

/** Figures, table, chart pixels (within the raster noise floor) and chart markup equal `before`. */
export async function expectSavingUnchanged(
  page: Page,
  before: Awaited<ReturnType<typeof savingSnapshot>>,
) {
  const after = await savingSnapshot(page);
  expect(after.figures).toBe(before.figures);
  expect(after.table).toBe(before.table);
  expect(after.chartHtml).toBe(before.chartHtml);
  expect(await differingPixels(page, after.chart, before.chart)).toBeLessThanOrEqual(
    RASTER_NOISE_FLOOR,
  );
}

// ---- Story 017: chart colours -------------------------------------------------------------

/** The three scenarios of story 017: S1 reference unchecked, S2 42 % checked, S3 S2 with -1 % return. */
export type ChartScenario = 'S1' | 'S2' | 'S3';

/** The legend of the chart region, whose items are `li`. */
export const legend = (page: Page) =>
  page.getByRole('region', { name: 'Verlauf des Kontostands', exact: true }).getByRole('list');

/** Brings the page into a scenario of story 017 and waits until the legend shows its series. */
export async function setScenario(page: Page, scenario: ChartScenario) {
  await setReference(page);
  await rateInput(page).fill('42');
  const reinvested = legend(page).getByText('Reinvestierte Steuererstattung', { exact: true });
  const loss = legend(page).getByText('Verlust (negative Erträge)', { exact: true });
  if (scenario === 'S1') {
    await reinvestBox(page).uncheck();
    await expect(reinvested).toHaveCount(0);
    await expect(loss).toHaveCount(0);
    return;
  }
  await reinvestBox(page).check();
  await expect(reinvested).toBeVisible();
  if (scenario === 'S2') {
    await returnInput(page).fill('5');
    await expect(loss).toHaveCount(0);
  } else {
    await returnInput(page).fill('-1');
    await expect(loss).toBeVisible();
  }
}

/** The five series in the order of the stack (bottom to top) and their tokens. */
export const SERIES_TOKENS = {
  contributions: '--chart-contributions',
  zulagen: '--chart-zulagen',
  reinvested: '--chart-reinvested',
  returns: '--chart-returns',
  loss: '--chart-loss',
} as const;
export type SeriesName = keyof typeof SERIES_TOKENS;

export interface Run {
  /** Name of the palette colour the run matches, or `other` (blend, anti-aliasing, unknown colour). */
  readonly label: string;
  readonly length: number;
  /** The run's middle pixel as [r, g, b]. */
  readonly rgb: readonly number[];
}

/**
 * Scans the centre column of every bar (the `svg > rect` of the chart, structural, no class) from the
 * baseline to the bar top on the chart screenshot and returns its runs of equal colour, bottom to top.
 * `palette` maps a label to a CSS colour (a token `var(--x)` or a system colour such as `CanvasText`);
 * pixels are labelled by the nearest palette colour within `tolerance` per channel, else `other`.
 * Runs shorter than `minLength` px (1 px separators, anti-aliased edges) are dropped.
 * Measured noise: 0 per channel inside every segment of S1 to S3 in light and dark (tolerance 0 matched
 * all interior pixels); tolerance 1 only absorbs a rounding difference between engines.
 */
export async function barRuns(
  page: Page,
  palette: Readonly<Record<string, string>>,
  minLength = 3,
  tolerance = 1,
): Promise<Run[][]> {
  const png = (await chart(page).screenshot({ animations: 'disabled' })).toString('base64');
  const frame = await chart(page).boundingBox();
  if (frame === null) throw new Error('no chart');
  const boxes = await chart(page)
    .locator('svg > rect')
    .evaluateAll(
      (rects, origin) =>
        rects.map((rect) => {
          const r = rect.getBoundingClientRect();
          return { x: r.x - origin.x, y: r.y - origin.y, w: r.width, h: r.height };
        }),
      { x: frame.x, y: frame.y },
    );
  const colourList: (readonly [string, number[]])[] = [];
  for (const [label, css] of Object.entries(palette))
    colourList.push([label, await colourOf(page, css)]);
  return page.evaluate(
    async ([data, entries, rects, min, tol]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('no 2d context');
      ctx.drawImage(image, 0, 0);
      const pixel = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data;
      const labelOf = (p: Uint8ClampedArray) => {
        for (const [label, c] of entries) {
          if ([0, 1, 2].every((k) => Math.abs((p[k] ?? 0) - (c[k] ?? 0)) <= Number(tol)))
            return label;
        }
        return 'other';
      };
      // One bar = rects with the same x.
      const bars = new Map<number, { x: number; w: number; top: number; bottom: number }>();
      for (const r of rects as { x: number; y: number; w: number; h: number }[]) {
        const key = Math.round(r.x);
        const bar = bars.get(key);
        if (bar === undefined) bars.set(key, { x: r.x, w: r.w, top: r.y, bottom: r.y + r.h });
        else {
          bar.top = Math.min(bar.top, r.y);
          bar.bottom = Math.max(bar.bottom, r.y + r.h);
        }
      }
      return [...bars.values()]
        .sort((a, b) => a.x - b.x)
        .map((bar) => {
          const x = Math.round(bar.x + bar.w / 2);
          const raw: { label: string; ys: number[] }[] = [];
          for (let y = Math.ceil(bar.bottom) - 1; y >= Math.floor(bar.top); y -= 1) {
            const label = labelOf(pixel(x, y));
            const last = raw[raw.length - 1];
            if (last !== undefined && last.label === label) last.ys.push(y);
            else raw.push({ label, ys: [y] });
          }
          return raw
            .filter((run) => run.ys.length >= Number(min))
            .map((run) => ({
              label: run.label,
              length: run.ys.length,
              rgb: [...pixel(x, run.ys[Math.floor(run.ys.length / 2)] ?? 0).slice(0, 3)],
            }));
        });
    },
    [png, colourList, boxes, minLength, tolerance] as const,
  );
}

/** Palette of the normal view: the five series tokens and the surface (separator). */
export const NORMAL_PALETTE: Readonly<Record<string, string>> = {
  ...SERIES_TOKENS,
  surface: '--color-surface',
};

/** The legend swatch of an item (by its exact text) as one PNG (base64) and the computed stroke dash. */
export async function swatchOf(page: Page, text: string) {
  const item = legend(page)
    .getByRole('listitem')
    .filter({ hasText: new RegExp(`^${text.replace(/[()]/g, '\\$&')}$`) });
  const svg = item.locator('svg');
  const png = (await svg.screenshot({ animations: 'disabled' })).toString('base64');
  const dash = await svg
    .locator('rect')
    .evaluate((rect) => getComputedStyle(rect).getPropertyValue('stroke-dasharray'));
  return { png, dash };
}

/** Pixels of a base64 PNG inside an inset of `inset` px, as [r, g, b] triples. */
export async function innerPixels(page: Page, png: string, inset: number) {
  return page.evaluate(
    async ([data, margin]) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) throw new Error('no 2d context');
      ctx.drawImage(image, 0, 0);
      const out: number[][] = [];
      for (let y = Number(margin); y < image.height - Number(margin); y += 1) {
        for (let x = Number(margin); x < image.width - Number(margin); x += 1) {
          out.push([...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)]);
        }
      }
      return out;
    },
    [png, inset] as const,
  );
}

/** Computed paint signature of every bar rect of the plot (structural selector, no class). */
export async function barSignatures(page: Page): Promise<string[]> {
  return chart(page)
    .locator('svg > rect')
    .evaluateAll((rects) =>
      rects.map((rect) => {
        const style = getComputedStyle(rect);
        return [style.fill, style.stroke, style.strokeWidth, style.strokeDasharray].join(' | ');
      }),
    );
}

/** A system or token colour as [r, g, b] (resolved the way the browser paints it). */
export async function colourOf(page: Page, css: string): Promise<number[]> {
  return page.evaluate((value) => {
    const probe = document.createElement('span');
    probe.style.color = value.startsWith('--') ? `var(${value})` : value;
    document.body.append(probe);
    const m = /rgba?\((\d+), (\d+), (\d+)/.exec(getComputedStyle(probe).color);
    probe.remove();
    return [Number(m?.[1]), Number(m?.[2]), Number(m?.[3])];
  }, css);
}
