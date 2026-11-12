/// <reference lib="dom" />
// e2e/ is typed without the DOM lib; page.evaluate callbacks run in the browser.
import { expect, test } from '@playwright/test';
import {
  barRuns,
  barSignatures,
  colourOf,
  differingPixels,
  innerPixels,
  legend,
  NORMAL_PALETTE,
  open,
  SERIES_TOKENS,
  setScenario,
  swatchOf,
  type ChartScenario,
  type SeriesName,
} from './avd.helpers.ts';

// Story 017 – chart in solid colours. One test per AC (rebuild oracle); AC2 is the token test
// (src/tokens.test.ts, 017/AC2), AC5 the unchanged 013 to 016 specs. Scenarios: S1 reference
// unchecked, S2 42 % checked, S3 S2 with -1 % return (all five series over S1 to S3).
// Pixel noise: solid fills match their token exactly (measured 0 per channel); anti-aliased edges
// and 1 px separators are runs shorter than 3 px and are ignored.

const SCENARIOS: readonly ChartScenario[] = ['S1', 'S2', 'S3'];
const SERIES = Object.keys(SERIES_TOKENS) as SeriesName[];
/** Legend text of each series (order of the stack, also the legend order). */
const LEGEND_TEXT: Readonly<Record<SeriesName, string>> = {
  contributions: 'Eigene Beiträge',
  zulagen: 'Zulagen',
  reinvested: 'Reinvestierte Steuererstattung',
  returns: 'Erträge',
  loss: 'Verlust (negative Erträge)',
};

test.beforeEach(async ({ page }) => {
  await open(page);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`AC1: every segment is one uniform token colour in the ${scheme} scheme, with and without reinvestment and with a loss`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const seen = new Set<string>();
    for (const scenario of SCENARIOS) {
      await setScenario(page, scenario);
      // Segments up to 4 px high are only blends of their edges (measured: 3 px `other` runs).
      const bars = await barRuns(page, NORMAL_PALETTE, 5);
      expect(bars.length, `${scenario} bars`).toBeGreaterThan(1);
      for (const runs of bars) {
        for (const [index, run] of runs.entries()) {
          // A stripe, a gap, a pale or hollow fill would show as `surface` or `other`.
          expect(SERIES, `${scenario} run ${run.label} of ${run.length} px`).toContain(run.label);
          seen.add(run.label);
          if (index > 0)
            expect(run.label, `${scenario} neighbours`).not.toBe(runs[index - 1]?.label);
        }
      }
      // A dashed outline would be a pattern of the forced view leaking into the normal one.
      for (const signature of await barSignatures(page)) expect(signature).toMatch(/ \| none$/);
    }
    // Non-vacuous: all five series were seen on screen.
    expect([...seen].sort()).toEqual([...SERIES].sort());
  });
}

test('AC3: legend texts and order as before, and each swatch is the uniform colour of its series token', async ({
  page,
}) => {
  const expected: Record<ChartScenario, readonly SeriesName[]> = {
    S1: ['contributions', 'zulagen', 'returns'],
    S2: ['contributions', 'zulagen', 'reinvested', 'returns'],
    S3: SERIES,
  };
  for (const scenario of SCENARIOS) {
    await setScenario(page, scenario);
    const texts = (await legend(page).getByRole('listitem').allInnerTexts()).map((t) => t.trim());
    expect(texts, scenario).toEqual(expected[scenario].map((series) => LEGEND_TEXT[series]));
  }
  // S3 (still on screen) shows every legend entry; AC1 shows that the bars equal the tokens.
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const series of SERIES) {
      const swatch = await swatchOf(page, LEGEND_TEXT[series]);
      expect(swatch.dash, `${series} dash`).toBe('none');
      // Inset 3: the 1 px surface stroke blends into the pixel at inset 2 when the swatch sits on a
      // fractional offset (measured: 145,161,214 instead of the fill at inset 2).
      const pixels = await innerPixels(page, swatch.png, 3);
      expect(pixels.length).toBeGreaterThan(64);
      const token = await colourOf(page, SERIES_TOKENS[series]);
      for (const pixel of pixels) {
        expect(pixel, `${scheme} ${series} swatch pixel`).toEqual(token);
      }
    }
  }
});

test('AC4: in forced colours every series differs by pattern, border or outline, in bars and swatches', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const canvas = await colourOf(page, 'Canvas');
  const text = await colourOf(page, 'CanvasText');
  expect(canvas).not.toEqual(text);

  const all = new Set<string>();
  for (const scenario of ['S2', 'S3'] as const) {
    await setScenario(page, scenario);
    const distinct = new Set(await barSignatures(page));
    // Four series are drawn in S2 (no loss) and in S3 (returns are negative, so the loss replaces them).
    expect(distinct.size, `${scenario} distinct signatures`).toBe(4);
    for (const signature of distinct) {
      all.add(signature);
      const [fill, stroke] = signature.split(' | ');
      // Visible against the canvas: a fill that is neither Canvas nor none (CanvasText or a
      // pattern), or a CanvasText outline.
      const rgb = (c: readonly number[]) => `rgb(${c.join(', ')})`;
      const visible = (fill !== rgb(canvas) && fill !== 'none') || stroke === rgb(text);
      expect(visible, `${scenario} ${signature}`).toBe(true);
    }
  }
  expect(all.size, 'signatures over both states').toBe(5);

  // S3 shows all five legend entries: the swatches differ pairwise and carry CanvasText pixels.
  const names = SERIES.map((series) => LEGEND_TEXT[series]);
  const swatches = [];
  for (const name of names) swatches.push((await swatchOf(page, name)).png);
  for (const [index, png] of swatches.entries()) {
    const pixels = await innerPixels(page, png, 0);
    expect(
      pixels.filter((p) => p[0] === text[0] && p[1] === text[1] && p[2] === text[2]).length,
      names[index],
    ).toBeGreaterThan(10);
    for (const other of swatches.slice(index + 1)) {
      // Identical swatches differ in 0 pixels (measured); the closest pair (returns vs dashed loss)
      // differs by the dash gaps, tens of pixels. Default tolerance 2: measured raster noise <= 1/255.
      expect(await differingPixels(page, png, other)).toBeGreaterThan(20);
    }
  }

  // The last bar's centre column: solid, then stripes, ..., then a hollow (Canvas) top for the loss.
  const bars = await barRuns(page, { text: 'CanvasText', canvas: 'Canvas' });
  const runs = bars[bars.length - 1] ?? [];
  // A run of at most 4 px at the top edge is anti-aliasing of a bar top that falls between pixels
  // (measured: 3 px on Windows, none on Linux, where such runs are already dropped as < 3 px).
  // It is not a fill, so the fills below it are what this AC reads (story 021).
  const top = runs[runs.length - 1];
  const fills = top?.label === 'other' && top.length <= 4 ? runs.slice(0, -1) : runs;
  expect(fills[0]).toMatchObject({ label: 'text' });
  expect(fills[0]?.length).toBeGreaterThan(20);
  const middle = fills.slice(1, -1);
  const changes = middle.filter((run, i) => i > 0 && run.label !== middle[i - 1]?.label);
  expect(changes.length, 'stripe alternations').toBeGreaterThanOrEqual(4);
  expect(fills[fills.length - 1]).toMatchObject({ label: 'canvas' });
  expect(fills[fills.length - 1]?.length).toBeGreaterThan(5);
});
