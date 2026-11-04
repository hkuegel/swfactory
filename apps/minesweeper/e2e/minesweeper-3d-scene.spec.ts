/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 009 – Minesweeper 3D visual upgrade (AC1, AC2, AC4, AC5, AC6; AC3 is the frame-rate
// script scripts/measure-fps.mjs, run headed on the reference machine, not in CI).
//
// The scene renders on software WebGL here (SwiftShader), where wall-clock timing is unreliable,
// so every time-dependent check runs on the dev-only probe `window.__board3dProbe`: `pause()`
// freezes the scene clock, `advance(ms)` moves it and renders one frame synchronously,
// `project()` gives screen positions and `pixels()` reads the rendered canvas. No reference
// images are committed: the look is checked by sampling pixels and comparing frames.
// Fixed mine layouts: window.__minesweeperMines (0-based pairs for the hook, 1-based here).

type Pair = readonly [row: number, col: number];
type Rgb = [r: number, g: number, b: number];
type Probe = {
  pause(): void;
  holdSway(hold: boolean): void;
  advance(ms: number): void;
  project(
    index: number,
    offset?: readonly [dx: number, dy: number, dz: number],
  ): { x: number; y: number };
  pixels(points: readonly { x: number; y: number }[]): Rgb[];
  readonly frames: number;
};
type TestWindow = Window & { __minesweeperMines?: Pair[]; __board3dProbe?: Probe };

const SWAY_PERIOD_MS = 14_000; // UX §5.4: +/-2 degrees, sine, period 14 s (AC1: at least 10 s)
const UNAVAILABLE = '3D is not available in this browser.';
const FAILED = '3D could not be loaded. The board stays in 2D.';
const STOPPED = 'The 3D view stopped. Your game continues in 2D.';
const LOST = 'You lost. You revealed a mine.';

const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
// The grid's parent is the stage wrapper; the scroller is the ancestor with data-view.
const scroller = (page: Page) => grid(page).locator('xpath=ancestor::*[@data-view]');
const counter = (page: Page) => page.getByText('Mines left:');
const viewGroup = (page: Page) => page.getByRole('radiogroup', { name: 'View' });
const radio2d = (page: Page) => page.getByRole('radio', { name: '2D' });
const radio3d = (page: Page) => page.getByRole('radio', { name: '3D' });
// The game's live region (it carries the 3D announcements); the same text is also visible.
const announced = (page: Page, text: string) =>
  page.locator('p[aria-live="polite"]', { hasText: text });
// The visible notice or loading text, not the live region that repeats it (by design).
const visibleText = (page: Page, text: string) =>
  page.locator('p:not([aria-live])', { hasText: text });
const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });
const index = (cols: number, row: number, col: number) => (row - 1) * cols + (col - 1);

async function signInAsGuest(page: Page) {
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

async function openGame(page: Page) {
  await page.goto('/');
  await signInAsGuest(page);
}

/** Starts a board with the given 1-based mines. */
async function startFixed(page: Page, rows: number, cols: number, mines: readonly Pair[]) {
  await page.evaluate(
    (l) => {
      (window as TestWindow).__minesweeperMines = l.map(([r, c]) => [r - 1, c - 1]);
    },
    mines.map((p) => [...p] as Pair),
  );
  await page.getByLabel('Rows', { exact: true }).fill(String(rows));
  await page.getByLabel('Columns', { exact: true }).fill(String(cols));
  await page.getByLabel('Mines', { exact: true }).fill(String(mines.length));
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(grid(page)).toBeVisible();
}

/**
 * Chooses "3D", waits until the scene is ready, then freezes the scene clock (no sway loop,
 * nothing moves between two reads). Fails loudly when WebGL is missing.
 */
async function choose3d(page: Page) {
  await radio3d(page).check();
  await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).__board3dProbe !== undefined))
    .toBe(true);
  await page.evaluate(() => (window as TestWindow).__board3dProbe?.pause());
}

// --- probe wrappers ---------------------------------------------------------------------

const hold = (page: Page, on: boolean) =>
  page.evaluate((h) => (window as TestWindow).__board3dProbe?.holdSway(h), on);
const advance = (page: Page, ms: number) =>
  page.evaluate((m) => (window as TestWindow).__board3dProbe?.advance(m), ms);

/** Advances the scene clock and returns a hash of the whole rendered frame. */
const frameAfter = (page: Page, ms: number) =>
  page.evaluate((m) => {
    const probe = (window as TestWindow).__board3dProbe;
    const canvas = document.querySelector('canvas');
    if (!probe || !canvas) throw new Error('no probe or canvas');
    probe.advance(m);
    const url = canvas.toDataURL();
    let h = 2166136261;
    for (let i = 0; i < url.length; i++) h = Math.imul(h ^ url.charCodeAt(i), 16777619) >>> 0;
    return `${url.length}:${h}`;
  }, ms);

/**
 * Pixels around one cell, on a grid of `step` canvas pixels around the centre of its overlay box:
 * fx and fy are fractions of the cell width (fy negative is up on screen). `cx`/`cy` are the
 * projected centre of the cell's top face.
 * The grid is anchored to whole canvas pixels, so the same call gives the same samples after
 * the page or the board was scrolled by a fractional amount (otherwise edge pixels differ).
 */
const cellPixels = (
  page: Page,
  idx: number,
  area = { fx0: -0.6, fx1: 0.6, fy0: -0.9, fy1: 0.7, step: 2 },
) =>
  page.evaluate(
    ([i, a]) => {
      const probe = (window as TestWindow).__board3dProbe;
      const canvas = document.querySelector('canvas');
      if (!probe || !canvas) throw new Error('no probe or canvas');
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / canvas.width; // CSS px per canvas px
      const c = probe.project(Number(i), [0, 0, 0]);
      // Anchor on the overlay cell (the DOM box does not depend on the cell's state; the top
      // face does), so a hidden cell and the same cell revealed are sampled at the same pixels.
      const el = document.querySelector(`[data-index="${i}"]`);
      if (!el) throw new Error('no cell');
      const box = el.getBoundingClientRect();
      const w = box.width / scale; // cell width in canvas px
      const ox = Math.round((box.x + box.width / 2 - rect.left) / scale);
      const oy = Math.round((box.y + box.height / 2 - rect.top) / scale);
      const area2 = a as { fx0: number; fx1: number; fy0: number; fy1: number; step: number };
      const points: { x: number; y: number }[] = [];
      for (let y = Math.round(area2.fy0 * w); y <= area2.fy1 * w; y += area2.step)
        for (let x = Math.round(area2.fx0 * w); x <= area2.fx1 * w; x += area2.step)
          points.push({
            x: rect.left + (ox + x + 0.5) * scale,
            y: rect.top + (oy + y + 0.5) * scale,
          });
      return { rgb: probe.pixels(points), points, cx: c.x, cy: c.y, w };
    },
    [idx, area] as const,
  );

/** Pixels at points given in cell units relative to a cell's top face (probe.project). */
const spots = (page: Page, specs: readonly (readonly [number, number, number, number])[]) =>
  page.evaluate((list) => {
    const probe = (window as TestWindow).__board3dProbe;
    if (!probe) throw new Error('no probe');
    const points = list.map(([i, dx, dy, dz]) => probe.project(i, [dx, dy, dz]));
    return probe.pixels(points);
  }, specs);

// --- colour maths (WCAG relative luminance of 8-bit sRGB) -----------------------------------

const linear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};
/** The pixel of a set with the highest contrast against `reference` (a glyph's core pixel). */
const strongest = (pixels: readonly Rgb[], reference: Rgb) =>
  pixels.reduce((best, p) => (contrast(p, reference) > contrast(best, reference) ? p : best));
/** Cloth pixels: the flag colour is the only red thing on a tile (light #b3261e, dark #f28b82). */
const isRed = ([r, g, b]: Rgb) => r - Math.max(g, b) >= 40;
const differing = (a: readonly Rgb[], b: readonly Rgb[]) =>
  a.filter((p, i) => p.some((v, k) => Math.abs(v - (b[i]?.[k] ?? 0)) > 2)).length;

/**
 * The camera angles read from the overlay's computed matrix3d(perspective(P) rotateY(sway)
 * rotateX(tilt)): m11 = cos(sway), m33 = cos(sway) cos(tilt), m31 = -sin(sway).
 */
async function cameraAngles(page: Page) {
  const m = await grid(page).evaluate((el) => getComputedStyle(el).transform);
  const parts = /^matrix3d\((.*)\)$/.exec(m)?.[1]?.split(',').map(Number);
  if (!parts) throw new Error(`overlay transform is not a matrix3d: ${m}`);
  const deg = (r: number) => (r * 180) / Math.PI;
  return {
    sway: -deg(Math.asin(parts[2] ?? NaN)),
    tilt: deg(Math.acos(parts[10] ?? NaN)),
  };
}

// Layouts (1-based). Row 4 has mines in columns 2, 4, 6 and 8: revealing (9,5) opens rows 5 to 9
// (row 5 shows 1s and 2s), row 4 stays hidden above them, so hidden tiles have revealed
// neighbours on their near side (front faces) and revealed cells have hidden far neighbours.
const ROW4: readonly Pair[] = [
  [4, 2],
  [4, 4],
  [4, 6],
  [4, 8],
];
const WALL_COLUMN_26: readonly Pair[] = Array.from({ length: 30 }, (_, i) => [i + 1, 26] as Pair);

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`look (${colorScheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await openGame(page);
      await choose3d(page);
    });

    test(`AC1: the scene is lit with thick raised tiles, sunk revealed tiles, 3D flags and soft shadows, and digits keep their contrast at every sway (${colorScheme})`, async ({
      page,
    }) => {
      await startFixed(page, 9, 9, ROW4);
      await cell(page, 2, 2).click({ button: 'right' }); // flag on a hidden tile
      await cell(page, 9, 5).click(); // opens rows 5 to 9
      await page.mouse.move(0, 0);
      await hold(page, true);
      await advance(page, 2000); // every animation has ended
      const hiddenAbove = index(9, 4, 5); // hidden, its near neighbour (5,5) is revealed
      const number = index(9, 5, 6); // shows 1; hidden far neighbour (4,6)
      const flagged = index(9, 2, 2);

      // Thickness: the front face of a raised tile is at least 15 % darker than its top.
      const [top, front] = await spots(page, [
        [hiddenAbove, 0, 0, 0],
        [hiddenAbove, 0, -0.5, -0.18],
      ]);
      expect(luminance(front as Rgb)).toBeLessThanOrEqual(luminance(top as Rgb) * 0.85);

      // Soft shadow: the floor right below a raised far neighbour is at least 10 % darker than
      // the lit floor farther away (sampled beside the digit, which sits in the middle).
      const [shadowed, lit] = await spots(page, [
        [number, 0.35, 0.42, 0],
        [number, 0.35, -0.2, 0],
      ]);
      expect(luminance(shadowed as Rgb)).toBeLessThanOrEqual(luminance(lit as Rgb) * 0.9);

      // Depth: raised and sunk tiles are different surfaces: the revealed top is not the
      // hidden top colour, and the wall between them (front face) is neither of them.
      expect(contrast(top as Rgb, lit as Rgb)).toBeGreaterThan(1.02);
      expect(contrast(front as Rgb, top as Rgb)).toBeGreaterThan(1.3);

      // The flag is a 3D object standing on its tile: glyph pixels above the tile's top
      // centre, in the flag colour (red pixels exist and reach above the tile centre; the contrast
      // against the rendered tile is the separate cloth test below).
      const flagArea = await cellPixels(page, flagged, {
        fx0: -0.6,
        fx1: 0.6,
        fy0: -0.9,
        fy1: 0.7,
        step: 1,
      });
      const cloth = flagArea.rgb
        .map((rgb, i) => ({ rgb, p: flagArea.points[i] ?? { x: 0, y: 0 } }))
        .filter(({ rgb }) => isRed(rgb));
      expect(cloth.length, 'cloth pixels').toBeGreaterThan(10);
      expect(
        cloth.filter(({ p }) => p.y < flagArea.cy - 2).length,
        'cloth pixels rise above the tile plane',
      ).toBeGreaterThan(5);

      // Digit contrast at the sway extremes (+2 and -2 degrees), none above 35 degrees.
      await hold(page, false); // the sway restarts at phase 0
      for (const [ms, sign] of [
        [SWAY_PERIOD_MS / 4, 1],
        [SWAY_PERIOD_MS / 2, -1],
      ] as const) {
        await advance(page, ms);
        const angles = await cameraAngles(page);
        expect(angles.sway * sign, 'the sway reaches its extreme').toBeGreaterThan(1.5);
        expect(Math.abs(angles.sway)).toBeLessThanOrEqual(3);
        expect(angles.tilt).toBeLessThanOrEqual(35);
        const floor = (await spots(page, [[number, 0.35, -0.2, 0]]))[0] as Rgb;
        const digit = strongest((await cellPixels(page, number)).rgb, floor);
        expect(contrast(digit, floor), `digit at sway ${sign * 2} degrees`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    });

    test(`AC1: the flag cloth keeps 3:1 against the rendered hidden tile it stands on, at every sway (${colorScheme})`, async ({
      page,
    }) => {
      await startFixed(page, 9, 9, ROW4);
      await cell(page, 2, 2).click({ button: 'right' });
      await page.mouse.move(0, 0);
      await hold(page, true);
      await advance(page, 2000);
      const flagged = index(9, 2, 2);
      await hold(page, false); // the sway restarts at phase 0
      for (const ms of [0, SWAY_PERIOD_MS / 4, SWAY_PERIOD_MS / 2]) {
        await advance(page, ms);
        // The tile's own lit top beside the flag: the reflection differs across the board.
        const tileTop = (await spots(page, [[flagged, -0.3, 0.3, 0]]))[0] as Rgb;
        const cloth = (await cellPixels(page, flagged)).rgb.filter(isRed);
        expect(cloth.length, 'cloth pixels').toBeGreaterThan(10);
        expect(
          contrast(strongest(cloth, tileTop), tileTop),
          `cloth against the tile top ${tileTop.join(',')} (007/AC3: flag glyphs 3:1)`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    test(`AC1: mines are 3D objects that keep their contrast on the lost board (${colorScheme})`, async ({
      page,
    }) => {
      await startFixed(page, 9, 9, ROW4);
      await cell(page, 9, 5).click();
      await cell(page, 4, 2).click(); // loses: every mine is shown
      await expect(page.getByText(LOST)).toBeVisible();
      await page.mouse.move(0, 0);
      await hold(page, true);
      await advance(page, 2600); // past the loss effect of story 010 (at most 2.5 s)
      const mine = index(9, 4, 4); // revealed mine, not the exploded one
      const floor = (await spots(page, [[index(9, 7, 5), 0.3, 0.2, 0]]))[0] as Rgb;
      await hold(page, false);
      for (const ms of [SWAY_PERIOD_MS / 4, SWAY_PERIOD_MS / 2]) {
        await advance(page, ms);
        const area = await cellPixels(page, mine, {
          fx0: -0.45,
          fx1: 0.45,
          fy0: -0.7,
          fy1: 0.35,
          step: 1,
        });
        const glyph = strongest(area.rgb, floor);
        expect(contrast(glyph, floor)).toBeGreaterThanOrEqual(3);
        // The mine stands on the floor: its pixels reach above the tile top centre.
        const raised = area.points.filter(
          (p, i) => p.y < area.cy - 4 && contrast(area.rgb[i] as Rgb, floor) >= 3,
        );
        expect(raised.length, 'mine pixels rise above the tile plane').toBeGreaterThan(5);
      }
    });
  });
}

test.describe('camera', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await choose3d(page);
    await startFixed(page, 9, 9, ROW4);
    await cell(page, 9, 5).click();
    await page.mouse.move(0, 0);
    await advance(page, 2000);
  });

  test('AC1: the camera tilts at most 35 degrees and sways by at most 3 degrees with a period of at least 10 s; two frames 3 s apart differ', async ({
    page,
  }) => {
    await hold(page, true);
    await hold(page, false); // the sway restarts at phase 0 at this moment
    // Few samples are enough: the peak (+), after 5 s (still on the same side, so the period is
    // above 10 s) and the opposite peak (-). The limits themselves are unit-tested too.
    let t = 0;
    for (const [at, expectation] of [
      [SWAY_PERIOD_MS / 4, 'peak'],
      [5000, 'same side'],
      [(3 * SWAY_PERIOD_MS) / 4, 'opposite peak'],
    ] as const) {
      await advance(page, at - t);
      t = at;
      const a = await cameraAngles(page);
      expect(a.tilt, `tilt at ${at} ms`).toBeLessThanOrEqual(35);
      expect(Math.abs(a.sway), `sway at ${at} ms`).toBeLessThanOrEqual(3);
      if (expectation === 'peak') expect(a.sway).toBeGreaterThan(1.5);
      if (expectation === 'same side') expect(a.sway, 'half period above 5 s').toBeGreaterThan(0);
      if (expectation === 'opposite peak') expect(a.sway).toBeLessThan(-1.5);
    }

    // Two frames 3 s apart differ (tile bevels and the tray edge slide). Restart at phase 0:
    // the sine is symmetric around its peak, so two arbitrary times can show the same angle.
    await hold(page, true);
    await hold(page, false);
    const board = await grid(page).boundingBox();
    if (!board) throw new Error('no board box');
    const points = Array.from({ length: 1600 }, (_, i) => ({
      x: board.x - 20 + ((i % 40) * (board.width + 40)) / 40,
      y: board.y - 20 + (Math.floor(i / 40) * (board.height + 40)) / 40,
    }));
    const frame = () =>
      page.evaluate((pts) => (window as TestWindow).__board3dProbe?.pixels(pts) ?? [], points);
    const first = await frame();
    await advance(page, 3000);
    const second = await frame();
    expect(differing(first, second), 'pixels that moved').toBeGreaterThan(10);
  });
});

test.describe('size', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await choose3d(page);
  });

  test('AC1: a fitting 3D board has no scrollbars and no spill-over', async ({ page }) => {
    await startFixed(page, 5, 5, [[3, 3]]);
    const overflow = await scroller(page).evaluate((el) => ({
      w: el.scrollWidth - el.clientWidth,
      h: el.scrollHeight - el.clientHeight,
    }));
    expect(overflow.w).toBeLessThanOrEqual(1);
    expect(overflow.h).toBeLessThanOrEqual(1);
  });

  test.describe('phone width', () => {
    test.use({ viewport: { width: 320, height: 800 } });

    test('AC1: at 320 px the far row is at least 24 px wide, the last cell of 30 x 30 is reachable, a 9 x 9 board needs no sideways scroll', async ({
      page,
    }) => {
      test.setTimeout(90_000); // software WebGL renders a 30 x 30 frame in 100 to 200 ms
      await startFixed(page, 9, 9, ROW4);
      const fit = () =>
        scroller(page).evaluate((el) => ({
          scrollbar: el.scrollWidth - el.clientWidth,
          page: document.documentElement.scrollWidth - window.innerWidth,
        }));
      expect((await fit()).scrollbar).toBeLessThanOrEqual(1);
      expect((await fit()).page).toBeLessThanOrEqual(0);
      await page.setViewportSize({ width: 375, height: 800 });
      expect((await fit()).scrollbar).toBeLessThanOrEqual(1);
      await page.setViewportSize({ width: 320, height: 800 });

      // The largest board: far row at least 24 px wide (also across the sway), near row
      // wider, last cell reachable.
      await startFixed(page, 30, 30, WALL_COLUMN_26);
      const farWidth = async () => (await cell(page, 1, 1).boundingBox())?.width ?? 0;
      expect(await farWidth()).toBeGreaterThanOrEqual(24);
      await hold(page, false);
      for (const ms of [SWAY_PERIOD_MS / 4, SWAY_PERIOD_MS / 2]) {
        await advance(page, ms);
        expect(await farWidth(), 'far row at a sway extreme').toBeGreaterThanOrEqual(24);
      }
      const near = await cell(page, 30, 1).boundingBox();
      expect(near?.width ?? 0).toBeGreaterThan(await farWidth());
      const last = cell(page, 30, 30);
      await last.scrollIntoViewIfNeeded();
      const box = await last.boundingBox();
      const well = await scroller(page).boundingBox();
      if (!box || !well) throw new Error('no box');
      for (const edge of [
        box.x - well.x,
        box.y - well.y,
        well.x + well.width - (box.x + box.width),
        well.y + well.height - (box.y + box.height),
      ]) {
        expect(edge).toBeGreaterThanOrEqual(-0.5);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  });
});

test.describe('animations', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await choose3d(page);
  });

  test('AC2: a reveal flips within 150 to 400 ms, the name is immediate; a flag is planted within 300 ms and removed within 300 ms', async ({
    page,
  }) => {
    await startFixed(page, 9, 9, ROW4);
    await hold(page, true);
    const number = index(9, 5, 5);

    // Reveal: names first (no advance yet), then the frames.
    await advance(page, 0);
    await cell(page, 5, 5).click();
    await expect(cell(page, 5, 5)).toHaveAccessibleName('Row 5, column 5, 2 mines nearby');
    const during = (await cellPixels(page, number)).rgb;
    await advance(page, 140);
    const at140 = (await cellPixels(page, number)).rgb;
    await advance(page, 260);
    const at400 = (await cellPixels(page, number)).rgb;
    await advance(page, 1600);
    const final = (await cellPixels(page, number)).rgb;
    expect(differing(during, final), 'the first frame is not the final state').toBeGreaterThan(0);
    expect(differing(at140, final), 'still moving at +140 ms').toBeGreaterThan(0);
    expect(differing(at400, final), 'finished at +400 ms').toBe(0);

    // Plant with F on a hidden cell: the counter and name change at once.
    const target = index(9, 3, 3);
    await cell(page, 3, 3).focus();
    await page.keyboard.press('f');
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, flagged');
    await expect(counter(page)).toHaveText('Mines left: 3');
    await advance(page, 40);
    const planting = (await cellPixels(page, target)).rgb;
    await advance(page, 260);
    const planted300 = (await cellPixels(page, target)).rgb;
    await advance(page, 700);
    const planted = (await cellPixels(page, target)).rgb;
    expect(differing(planting, planted), 'plant animation at +40 ms').toBeGreaterThan(0);
    expect(differing(planted300, planted), 'plant finished at +300 ms').toBe(0);

    // Removal.
    await page.keyboard.press('f');
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, hidden');
    await expect(counter(page)).toHaveText('Mines left: 4');
    await advance(page, 90);
    const removing = (await cellPixels(page, target)).rgb;
    await advance(page, 210);
    const removed300 = (await cellPixels(page, target)).rgb;
    await advance(page, 700);
    const removed = (await cellPixels(page, target)).rgb;
    expect(differing(removing, removed), 'removal animation at +90 ms').toBeGreaterThan(0);
    expect(differing(removed300, removed), 'removal finished at +300 ms').toBe(0);
    expect(differing(planted, removed), 'the flag is gone').toBeGreaterThan(0);
  });

  test('AC2: a cascade is a wave from the clicked cell, finished within 1.2 s on 30 x 30, and input during it takes effect at once', async ({
    page,
  }) => {
    test.setTimeout(90_000); // software WebGL renders a 30 x 30 frame in 100 to 200 ms
    await startFixed(page, 30, 30, WALL_COLUMN_26);
    await hold(page, true);
    const origin = index(30, 1, 1);
    const far = index(30, 30, 24);
    await scroller(page).evaluate((el) => (el.scrollTop = 0));
    const before = {
      origin: (await cellPixels(page, origin)).rgb,
      far: (await cellPixels(page, far)).rgb,
    };
    await cell(page, 1, 1).click();
    await expect(cell(page, 1, 1)).toHaveAccessibleName('Row 1, column 1, empty');
    await expect(cell(page, 30, 24)).toHaveAccessibleName('Row 30, column 24, empty'); // at once
    await advance(page, 60);
    const early = {
      origin: (await cellPixels(page, origin)).rgb,
      far: (await cellPixels(page, far)).rgb,
    };
    expect(
      differing(before.origin, early.origin),
      'the wave has started at the click',
    ).toBeGreaterThan(0);
    expect(differing(before.far, early.far), 'the far cell has not started yet').toBe(0);

    // (d) Input during the wave (the scene clock stays at +60 ms): flag by right-click and
    // reveal by keyboard take effect at once.
    await cell(page, 1, 29).click({ button: 'right' });
    await expect(cell(page, 1, 29)).toHaveAccessibleName('Row 1, column 29, flagged');
    await expect(counter(page)).toHaveText('Mines left: 29');
    await cell(page, 5, 27).focus();
    await page.keyboard.press('Enter');
    await expect(cell(page, 5, 27)).toHaveAccessibleName('Row 5, column 27, 3 mines nearby');

    // The final state is shown at the latest 1.2 s after the click.
    await advance(page, 1140);
    const at1200 = await frameAfter(page, 0);
    const at3000 = await frameAfter(page, 1800);
    expect(at1200).toBe(at3000);
  });
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openGame(page);
  });

  test('AC4: the switch is immediate, nothing sways, changes show as a static picture, a lost board is static', async ({
    page,
  }) => {
    // The module is loaded by a first switch; the second one must be immediate.
    await choose3d(page);
    await radio2d(page).check();
    await radio3d(page).check();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await startFixed(page, 9, 9, ROW4);
    expect(await page.evaluate(() => document.querySelector('canvas') !== null)).toBe(true);
    expect((await cameraAngles(page)).sway).toBeCloseTo(0, 5);

    // Static after a cascade and a flag: the frame right after the input is the final frame.
    await cell(page, 9, 5).click();
    await cell(page, 3, 3).click({ button: 'right' });
    await page.mouse.move(0, 0);
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, flagged');
    const right = await frameAfter(page, 0);
    const later = await frameAfter(page, 3000);
    expect(right, 'no flip, wave or plant animation').toBe(later);

    // No sway: neither the camera nor the picture moves when the scene clock runs on.
    const a = await cellPixels(page, index(9, 5, 5));
    await advance(page, SWAY_PERIOD_MS / 4);
    expect((await cameraAngles(page)).sway).toBeCloseTo(0, 5);
    const b = await cellPixels(page, index(9, 5, 5));
    expect(differing(a.rgb, b.rgb), 'no sway under reduced motion').toBe(0);

    // A lost board is static and its names are as in 005/AC9.
    await cell(page, 4, 2).click();
    await expect(page.getByText(LOST)).toBeVisible();
    const names = await grid(page).ariaSnapshot();
    expect(names).toContain('exploded mine');
    expect(names).toContain('Row 4, column 4, mine');
    const lostNow = await frameAfter(page, 0);
    expect(await frameAfter(page, 3000)).toBe(lostNow);
  });
});

test.describe('alignment and parity', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  test('AC5: the overlay lies on the drawn tiles on 30 x 30, scrolled, at both sway extremes, and a click at a projected point reveals exactly that cell', async ({
    page,
  }) => {
    test.setTimeout(90_000); // software WebGL renders a 30 x 30 frame in 100 to 200 ms
    await choose3d(page);
    // Mines on every cell with odd row and odd column: every other cell shows a number, so a
    // reveal opens exactly one cell.
    const mines: Pair[] = [];
    for (let r = 1; r <= 30; r += 2) for (let c = 1; c <= 30; c += 2) mines.push([r, c]);
    await startFixed(page, 30, 30, mines);
    await hold(page, false);
    const targets: Pair[] = [
      [2, 2],
      [16, 16],
      [30, 30],
    ];
    const swayTimes = [SWAY_PERIOD_MS / 4, SWAY_PERIOD_MS / 2];
    let revealed = 0;
    for (const ms of swayTimes) {
      await advance(page, ms);
      for (const [row, col] of targets) {
        await cell(page, row, col).scrollIntoViewIfNeeded();
        const idx = index(30, row, col);
        // The overlay plane (z = 0) lies under a hidden tile's top (+0.15) and above a revealed
        // one (-0.15). The DOM box and the projection are read in the same task (no scrolling
        // in between).
        const dz = ms === swayTimes[0] ? -0.15 : 0.15;
        const { point, box } = await page.evaluate(
          ([i, offset]) => {
            const probe = (window as TestWindow).__board3dProbe;
            const el = document.querySelector(`[data-index="${i}"]`);
            if (!probe || !el) throw new Error('no probe or cell');
            const r = el.getBoundingClientRect();
            return {
              point: probe.project(Number(i), [0, 0, Number(offset)]),
              box: { x: r.x, y: r.y, width: r.width, height: r.height },
            };
          },
          [idx, dz] as const,
        );
        expect(Math.abs(point.x - (box.x + box.width / 2)), `x of (${row}, ${col})`).toBeLessThan(
          2,
        );
        expect(Math.abs(point.y - (box.y + box.height / 2)), `y of (${row}, ${col})`).toBeLessThan(
          2,
        );
        if (ms === swayTimes[0]) {
          await page.mouse.click(point.x, point.y);
          revealed++;
          await expect(cell(page, row, col)).not.toHaveAccessibleName(/hidden$/);
          await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(
            900 - revealed,
          ); // exactly that cell was revealed
        }
      }
    }
  });

  test('AC5: after a round trip through 3D the 2D board is pixel-identical and has no leftovers', async ({
    page,
  }) => {
    await startFixed(page, 5, 5, [
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
    ]);
    await cell(page, 3, 3).click({ button: 'right' });
    await cell(page, 3, 1).click();
    await page.mouse.move(0, 0);
    await radio2d(page).focus();
    const shoot = async () => {
      await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
      return scroller(page).screenshot();
    };
    const a = await shoot();
    await choose3d(page);
    await page.mouse.move(0, 0);
    expect((await cameraAngles(page)).tilt).toBeGreaterThan(20);
    await radio2d(page).check();
    await page.mouse.move(0, 0);
    const c = await shoot();
    expect(await differingPixels(page, a, c), '2D after 3D equals 2D before').toBe(0);
    expect(await grid(page).evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    expect(await grid(page).evaluate((el) => el.getAttribute('style') ?? '')).not.toContain(
      'transform',
    );
  });
});

test.describe('forced colours', () => {
  test('AC5: in forced colours every 3D board keeps its static tilt and its first row stays reachable', async ({
    page,
  }) => {
    // Regression (review round 1): a board attached after the first one lost its transform but
    // kept the negative margins of the 3D layout, so the first row was clipped above the scroller.
    await page.emulateMedia({ forcedColors: 'active' });
    await openGame(page);
    const check = async (label: string) => {
      const transform = await grid(page).evaluate((el) => getComputedStyle(el).transform);
      expect(transform, `${label}: static tilt`).toMatch(/^matrix3d\(/);
      const first = await cell(page, 1, 1).boundingBox();
      const well = await scroller(page).boundingBox();
      if (!first || !well) throw new Error('no box');
      expect(first.y, `${label}: first row inside the scroller`).toBeGreaterThanOrEqual(
        well.y - 0.5,
      );
      expect(first.x, `${label}: first column inside the scroller`).toBeGreaterThanOrEqual(
        well.x - 0.5,
      );
    };
    await startFixed(page, 30, 30, WALL_COLUMN_26);
    await choose3d(page); // over a running board: fine even before the fix
    await check('3D chosen over a running board');
    await startFixed(page, 30, 30, WALL_COLUMN_26); // Start again: a new board is attached
    await check('after Start');
    await radio2d(page).check();
    await radio3d(page).check();
    await check('after 2D and back');
  });
});

/** Held route for the lazily loaded scene chunk (dev server URL). */
const SCENE_CHUNK = '**/scene3d/createBoardScene.ts*';

test.describe('loading and fallback', () => {
  test('AC6: a slow load shows a loading indication while 2D stays usable, then the 3D board replaces it', async ({
    page,
  }) => {
    let release: () => void = () => undefined;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(SCENE_CHUNK, async (route) => {
      await released;
      await route.continue();
    });
    await openGame(page);
    await startFixed(page, 9, 9, ROW4);
    await radio3d(page).check();
    await expect(viewGroup(page)).toHaveAttribute('aria-busy', 'true');
    await expect(visibleText(page, 'Loading 3D…')).toBeVisible();
    await expect(announced(page, 'Loading 3D…')).toHaveCount(1);
    // 2D stays usable.
    await cell(page, 9, 5).click();
    await expect(cell(page, 9, 5)).toHaveAccessibleName('Row 9, column 5, empty');
    expect(await page.evaluate(() => document.querySelector('canvas'))).toBeNull();
    release();
    await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
    await expect(visibleText(page, 'Loading 3D…')).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(announced(page, '3D view ready.')).toHaveCount(1);
    await expect(radio3d(page)).toBeChecked();
    expect((await cameraAngles(page)).tilt).toBeGreaterThan(20);
    // The game is unchanged: the cascade done in 2D is on the 3D board.
    await expect(cell(page, 9, 5)).toHaveAccessibleName('Row 9, column 5, empty');
  });

  test('AC6: a failing load shows a message, 2D stays current and the game is unchanged', async ({
    page,
  }) => {
    await page.route(SCENE_CHUNK, (route) => route.abort());
    await openGame(page);
    await startFixed(page, 9, 9, ROW4);
    await cell(page, 9, 5).click();
    const before = await grid(page).ariaSnapshot();
    await radio3d(page).check();
    await expect(visibleText(page, FAILED)).toBeVisible();
    await expect(announced(page, FAILED)).toHaveCount(1);
    await expect(radio2d(page)).toBeChecked();
    await expect(radio3d(page)).toBeEnabled();
    await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true');
    expect(await grid(page).ariaSnapshot()).toBe(before);
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('AC6: a load that takes longer than 10 s fails with the same message', async ({ page }) => {
    const T0 = new Date('2026-01-01T10:00:00Z');
    await page.route(SCENE_CHUNK, () => new Promise<void>(() => undefined)); // never answered
    await page.clock.install({ time: T0 });
    await page.goto('/');
    await signInAsGuest(page);
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
    await startFixed(page, 9, 9, ROW4);
    await radio3d(page).check();
    await expect(viewGroup(page)).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(9_900);
    await expect(viewGroup(page)).toHaveAttribute('aria-busy', 'true'); // not yet
    await page.clock.runFor(200);
    await expect(visibleText(page, FAILED)).toBeVisible();
    await expect(radio2d(page)).toBeChecked();
    await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true');
    await expect(grid(page)).toBeVisible();
  });

  test('AC6: without WebGL2 "3D" is unavailable with a text and 2D plays without errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, 'WebGL2RenderingContext');
    });
    await openGame(page);
    await expect(radio3d(page)).toBeDisabled();
    await expect(radio3d(page)).toHaveAccessibleDescription(UNAVAILABLE);
    await expect(page.getByText(UNAVAILABLE, { exact: true })).toBeVisible();
    await expect(radio2d(page)).toBeChecked();
    await startFixed(page, 9, 9, ROW4);
    await cell(page, 9, 5).click();
    await expect(cell(page, 9, 5)).toHaveAccessibleName('Row 9, column 5, empty');
    await radio2d(page).focus();
    await page.keyboard.press('ArrowRight'); // the disabled option is skipped
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('AC6: when no WebGL2 context can be created, "3D" becomes unavailable with the notice and focus moves to "2D"', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string) {
        if (kind === 'webgl2') return null;
        // eslint-disable-next-line prefer-rest-params -- the stub forwards every other call
        return Reflect.apply(original, this, arguments) as RenderingContext | null;
      } as typeof original;
    });
    await openGame(page);
    await expect(radio3d(page)).toBeEnabled();
    await radio2d(page).focus();
    await page.keyboard.press('ArrowRight'); // selects "3D" by keyboard
    await expect(radio3d(page)).toBeDisabled();
    await expect(page.getByText(UNAVAILABLE, { exact: true })).toBeVisible();
    await expect(visibleText(page, FAILED)).toBeVisible();
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('AC6: a lost rendering context returns to 2D with a notice, the game is kept and 3D can be chosen again', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await openGame(page);
    await choose3d(page);
    await startFixed(page, 9, 9, ROW4);
    await cell(page, 9, 5).click();
    await cell(page, 2, 2).click({ button: 'right' });
    await cell(page, 5, 5).focus();
    const names = await grid(page).ariaSnapshot();
    const mines = await counter(page).textContent();
    await page.evaluate(() => {
      const gl = document.querySelector('canvas')?.getContext('webgl2');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(visibleText(page, STOPPED)).toBeVisible();
    await expect(announced(page, STOPPED)).toHaveCount(1);
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeEnabled();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await grid(page).ariaSnapshot()).toBe(names);
    expect(await counter(page).textContent()).toBe(mines);
    await expect(cell(page, 5, 5)).toBeFocused(); // the board swapped in place
    // 2D still plays, and "3D" works again without a notice.
    await cell(page, 3, 3).click({ button: 'right' });
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, flagged');
    await choose3d(page);
    await expect(visibleText(page, STOPPED)).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await grid(page).ariaSnapshot()).toContain('Row 3, column 3, flagged');
    expect(errors).toEqual([]);
  });
});

/**
 * Number of pixels whose colour differs by more than `tolerance` (per channel, of 255) between
 * two PNG screenshots of the same size. Switching 3D -> 2D leaves anti-aliasing noise of at most
 * 2/255 on a few rounded cell edges, which is not a visible difference; a real difference of the
 * look is far above the tolerance.
 */
async function differingPixels(page: Page, a: Buffer, b: Buffer, tolerance = 8): Promise<number> {
  return page.evaluate(
    async ([x, y, tol]) => {
      const load = (data: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('cannot decode screenshot'));
          img.src = `data:image/png;base64,${data}`;
        });
      const pixels = (img: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
      };
      const [imgX, imgY] = await Promise.all([load(x), load(y)]);
      if (imgX.width !== imgY.width || imgX.height !== imgY.height) return Number.MAX_SAFE_INTEGER;
      const px = pixels(imgX).data;
      const py = pixels(imgY).data;
      let count = 0;
      for (let i = 0; i < px.length; i += 4) {
        const d = Math.max(
          Math.abs((px[i] ?? 0) - (py[i] ?? 0)),
          Math.abs((px[i + 1] ?? 0) - (py[i + 1] ?? 0)),
          Math.abs((px[i + 2] ?? 0) - (py[i + 2] ?? 0)),
        );
        if (d > Number(tol)) count++;
      }
      return count;
    },
    [a.toString('base64'), b.toString('base64'), String(tolerance)] as const,
  );
}
