/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Locator, type Page } from '@playwright/test';

// Story 008 – Minesweeper 3D mode. AC4 (the 005/006 flows in 3D) is the Playwright project
// `chromium-3d`, which re-runs AC6, AC8, AC9 and AC10 of minesweeper.spec.ts; the 3D tokens
// (tilt at most 35 degrees, compensation margins) are unit-tested in src/app/tokens.test.ts.
// Fixed mine layouts: window.__minesweeperMines (1-based pairs here, 0-based for the hook).

type Pair = readonly [row: number, col: number];
type TestWindow = Window & { __minesweeperMines?: Pair[] };

const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
const scroller = (page: Page) => grid(page).locator('..');
const counter = (page: Page) => page.getByText('Mines left:');
const timer = (page: Page) => page.getByText('Time:');
const rowsInput = (page: Page) => page.getByLabel('Rows', { exact: true });
const colsInput = (page: Page) => page.getByLabel('Columns', { exact: true });
const minesInput = (page: Page) => page.getByLabel('Mines', { exact: true });
const viewGroup = (page: Page) => page.getByRole('radiogroup', { name: 'View' });
const radio2d = (page: Page) => page.getByRole('radio', { name: '2D' });
const radio3d = (page: Page) => page.getByRole('radio', { name: '3D' });
const UNAVAILABLE = '3D is not available in this browser.';
const LOST = 'You lost. You revealed a mine.';

const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });

async function signInAsGuest(page: Page) {
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

async function openGame(page: Page) {
  await page.goto('/');
  await signInAsGuest(page);
}

async function startGame(page: Page, rows: number, cols: number, mines: number) {
  await rowsInput(page).fill(String(rows));
  await colsInput(page).fill(String(cols));
  await minesInput(page).fill(String(mines));
  await startButton(page).click();
  await expect(grid(page)).toBeVisible();
}

/** 5 x 5 board with the given 1-based mines, started. */
async function startFixed5x5(page: Page, layout: readonly Pair[]) {
  await page.evaluate(
    (l) => {
      (window as TestWindow).__minesweeperMines = l.map(([r, c]) => [r - 1, c - 1]);
    },
    layout.map((p) => [...p] as Pair),
  );
  await startGame(page, 5, 5, layout.length);
}

/** (1,2), (2,1), (2,2), (4,4), (4,5), (5,4) show 1. */
const CORNERS: readonly Pair[] = [
  [1, 1],
  [5, 5],
];

/** Column 3 is a wall of mines: revealing (3,1) opens columns 1 and 2 only. */
const WALL: readonly Pair[] = [
  [1, 3],
  [2, 3],
  [3, 3],
  [4, 3],
  [5, 3],
];

const settled = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);

/**
 * Number of pixels whose colour differs by more than `tolerance` (per channel, of 255) between
 * two PNG screenshots of the same size. Switching 3D -> 2D leaves anti-aliasing noise of at most
 * 2/255 on a few rounded cell edges (the raster of the grid after a transform), which is not a
 * visible difference; a real difference of the look is far above the tolerance.
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

const tilt = (page: Page) => grid(page).evaluate((el) => getComputedStyle(el).transform);

test.describe('View control', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  test('AC1: the View control is there before Start, during a game and after a loss, and works by mouse, keyboard and touch', async ({
    page,
  }) => {
    // Before the first Start: both options, "2D" current, nothing is disabled.
    await expect(viewGroup(page)).toBeVisible();
    await expect(radio2d(page)).toBeChecked();
    await expect(radio3d(page)).not.toBeChecked();
    await expect(radio3d(page)).toBeEnabled();
    await expect(grid(page)).toHaveCount(0);

    // Mouse (the whole segment is the target), also before Start.
    await radio3d(page).check();
    await expect(radio3d(page)).toBeChecked();
    await expect(radio2d(page)).not.toBeChecked();
    await radio2d(page).check();
    await expect(radio2d(page)).toBeChecked();

    // During a game, and with the board in 3D: the choice is applied to the first board.
    await radio3d(page).check();
    await startFixed5x5(page, CORNERS);
    await expect(viewGroup(page)).toBeVisible();
    await expect(radio3d(page)).toBeChecked();
    expect(await tilt(page)).not.toBe('none');

    // Keyboard: one tab stop (the checked radio), arrows move and select.
    await radio3d(page).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeFocused();
    expect(await tilt(page)).toBe('none');
    await page.keyboard.press('ArrowRight');
    await expect(radio3d(page)).toBeChecked();
    expect(await tilt(page)).not.toBe('none');
    // Tab reaches the checked radio only: Shift+Tab from the board comes back to it.
    await cell(page, 1, 1).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(radio3d(page)).toBeFocused();

    // After a loss the control is unchanged and operable.
    await cell(page, 1, 1).click();
    await expect(page.getByText(LOST)).toBeVisible();
    await expect(viewGroup(page)).toBeVisible();
    await expect(radio2d(page)).toBeEnabled();
    await radio2d(page).check();
    await expect(radio2d(page)).toBeChecked();
    expect(await tilt(page)).toBe('none');
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true });

    test('AC1: a tap on a segment selects it', async ({ page }) => {
      await radio3d(page).tap();
      await expect(radio3d(page)).toBeChecked();
      await radio2d(page).tap();
      await expect(radio2d(page)).toBeChecked();
    });
  });
});

// Timer on Playwright's fake clock (as in 006): installed before goto, paused after sign-in.
test.describe('state across switches', () => {
  const T0 = new Date('2026-01-01T10:00:00Z');

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: T0 });
    await page.goto('/');
    await signInAsGuest(page);
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
  });

  test('AC2: switching keeps the board, flags, counter, timer and result; no new board is created', async ({
    page,
  }) => {
    // (a) Not started yet: no board appears, and the first board follows the choice.
    await radio3d(page).check();
    await expect(grid(page)).toHaveCount(0);
    await radio2d(page).check();
    await expect(grid(page)).toHaveCount(0);

    // (b) A running game.
    await startFixed5x5(page, CORNERS);
    const gridHandle = await grid(page).elementHandle();
    await cell(page, 1, 2).click();
    await cell(page, 3, 3).click({ button: 'right' });
    await page.clock.runFor(3000);
    const state = async () => ({
      cells: await grid(page).ariaSnapshot(),
      counter: await counter(page).textContent(),
      timer: await timer(page).textContent(),
    });
    const before = await state();
    expect(before.timer).toBe('Time: 3');
    expect(before.counter).toBe('Mines left: 1');
    expect(before.cells).toContain('1 mine nearby');
    expect(before.cells).toContain('flagged');

    await radio3d(page).check();
    expect(await state()).toEqual(before);
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('Time: 5'); // no reset, no jump
    await radio2d(page).check();
    const back = await state();
    expect(back.cells).toBe(before.cells);
    expect(back.counter).toBe(before.counter);
    await expect(timer(page)).toHaveText('Time: 5');

    // (c) The same grid element: nothing was remounted.
    expect(await gridHandle?.evaluate((el) => el.isConnected)).toBe(true);
    expect(await grid(page).evaluate((el, h) => el === h, gridHandle)).toBe(true);

    // (d) A lost game: result and frozen timer survive a switch.
    await cell(page, 1, 1).click();
    await expect(page.getByText(LOST)).toBeVisible();
    const lost = await state();
    await radio3d(page).check();
    await expect(page.getByText(LOST)).toBeVisible();
    await page.clock.runFor(4000);
    expect(await state()).toEqual(lost);
    await radio2d(page).check();
    await page.clock.runFor(4000);
    expect(await state()).toEqual(lost);
    await expect(grid(page)).toHaveAttribute('aria-readonly', 'true');
  });
});

test.describe('3D look', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  test('AC3: the 3D board is tilted and has relief, and 2D afterwards is unchanged', async ({
    page,
  }) => {
    await startFixed5x5(page, WALL);
    await cell(page, 3, 3).click({ button: 'right' }); // a flagged mine cell
    await cell(page, 3, 1).click(); // opens columns 1 and 2
    await cell(page, 1, 5).click({ button: 'right' }); // flagged, safe
    // Mouse and focus away from the board, so no hover or focus ring differs between shots.
    await page.mouse.move(0, 0);
    await radio2d(page).focus();
    const hiddenShadow = () => cell(page, 5, 5).evaluate((el) => getComputedStyle(el).boxShadow);
    const emptyShadow = () => cell(page, 1, 1).evaluate((el) => getComputedStyle(el).boxShadow);
    const shoot = async () => {
      await settled(page);
      return scroller(page).screenshot();
    };

    const a = await shoot();
    expect(await tilt(page)).toBe('none');
    const hidden2d = await hiddenShadow();
    const empty2d = await emptyShadow();

    await radio3d(page).check();
    await page.mouse.move(0, 0);
    // Tilted about the x axis with perspective: a matrix3d (the angle limit is in tokens.test.ts).
    const m = (await tilt(page)).match(/^matrix3d\((.*)\)$/);
    expect(m, 'transform is a 3D matrix').not.toBeNull();
    const cos = Number((m?.[1] ?? '').split(',')[5]);
    expect(cos).toBeLessThan(0.99); // visibly tilted
    // Relief: raised tiles get a thicker lip, lowered cells an inner shade. Cells fade their
    // shadow for 120 ms after a switch: read the computed value only after that settled.
    await settled(page);
    expect(await hiddenShadow()).not.toBe(hidden2d);
    expect(await emptyShadow()).not.toBe(empty2d);

    await radio2d(page).check();
    await page.mouse.move(0, 0);
    const c = await shoot();
    expect(await differingPixels(page, a, c), '2D after 3D equals 2D before').toBe(0);
    expect(await tilt(page)).toBe('none');
  });

  test('AC3: a fitting 3D board has no scrollbars and no spill-over', async ({ page }) => {
    await radio3d(page).check();
    await startGame(page, 9, 9, 10);
    const overflow = await scroller(page).evaluate((el) => ({
      w: el.scrollWidth - el.clientWidth,
      h: el.scrollHeight - el.clientHeight,
    }));
    expect(overflow.w).toBeLessThanOrEqual(1);
    expect(overflow.h).toBeLessThanOrEqual(1);
  });

  test.describe('phone width', () => {
    test.use({ viewport: { width: 320, height: 800 } });

    test('AC3: at 320 px the far row is at least 24 px wide, the last cell of 30 x 30 is reachable, a 9 x 9 board needs no sideways scroll', async ({
      page,
    }) => {
      await radio3d(page).check();

      // The default board fits the well at 320 px and (below) at 375 px.
      await startGame(page, 9, 9, 10);
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

      // The largest board: far row at least 24 px wide, near row wider, last cell reachable.
      await startGame(page, 30, 30, 99);
      const far = await cell(page, 1, 1).boundingBox();
      const near = await cell(page, 30, 1).boundingBox();
      expect(far?.width ?? 0).toBeGreaterThanOrEqual(24);
      expect(near?.width ?? 0).toBeGreaterThan(far?.width ?? 0);
      const last = cell(page, 30, 30);
      await last.scrollIntoViewIfNeeded();
      const inside = async (target: Locator) => {
        const box = await target.boundingBox();
        const well = await scroller(page).boundingBox();
        if (!box || !well) throw new Error('no box');
        return {
          left: box.x - well.x,
          top: box.y - well.y,
          right: well.x + well.width - (box.x + box.width),
          bottom: well.y + well.height - (box.y + box.height),
        };
      };
      for (const edge of Object.values(await inside(last))) {
        expect(edge).toBeGreaterThanOrEqual(-0.5);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  });
});

test.describe('accessibility in 3D', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`AC5: 3D has the same grid structure and names as 2D, and a visible, unclipped focus ring (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await startFixed5x5(page, WALL);
      await cell(page, 3, 3).click({ button: 'right' });
      await cell(page, 3, 1).click();
      const names = await grid(page).ariaSnapshot();
      expect(names).toContain('Row 1, column 1, empty');
      expect(names).toContain('flagged');
      await radio3d(page).check();
      expect(await grid(page).ariaSnapshot()).toBe(names);
      await expect(grid(page)).toHaveAttribute('aria-rowcount', '5');
      await expect(grid(page)).toHaveAttribute('aria-colcount', '5');
      await expect(page.getByRole('row')).toHaveCount(5);

      // Keyboard to the near corner (5,5), whose row sticks out most; the ring is drawn inside the cell.
      const focusColour = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--color-focus)';
        document.body.append(probe);
        const colour = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return colour;
      });
      await cell(page, 1, 1).focus();
      for (const move of ['ArrowRight', 'ArrowDown']) {
        for (let i = 0; i < 4; i++) await page.keyboard.press(move);
      }
      const target = cell(page, 5, 5);
      await expect(target).toBeFocused();
      const ring = await target.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          style: s.outlineStyle,
          width: parseFloat(s.outlineWidth),
          colour: s.outlineColor,
          visible: el.matches(':focus-visible'),
        };
      });
      expect(ring.visible).toBe(true);
      expect(ring.style).not.toBe('none');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(ring.colour).toBe(focusColour);
      const box = await target.boundingBox();
      const well = await scroller(page).boundingBox();
      if (!box || !well) throw new Error('no box');
      expect(box.x).toBeGreaterThanOrEqual(well.x);
      expect(box.y).toBeGreaterThanOrEqual(well.y);
      expect(box.x + box.width).toBeLessThanOrEqual(well.x + well.width + 0.5);
      expect(box.y + box.height).toBeLessThanOrEqual(well.y + well.height + 0.5);
    });
  }
});

test.describe('motion', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await startFixed5x5(page, WALL);
    await cell(page, 3, 1).click(); // revealed cells: their shadows change with the view
    await cell(page, 1, 5).click({ button: 'right' });
    await page.mouse.move(0, 0);
    await settled(page);
  });

  const motion = (page: Page) =>
    page.evaluate(() => {
      const animations = document.getAnimations().map((a) => {
        const t = a.effect?.getTiming();
        return { iterations: Number(t?.iterations), duration: Number(t?.duration) };
      });
      const durations = ['.grid', '[role="gridcell"]'].map((sel) => {
        const el =
          sel === '.grid' ? document.querySelector('[role="grid"]') : document.querySelector(sel);
        return el ? getComputedStyle(el).transitionDuration : '';
      });
      return { animations, durations };
    });

  test('AC6: with reduced motion the switch is immediate and nothing moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await radio3d(page).check();
    const on = await motion(page);
    expect(on.animations).toEqual([]);
    for (const d of on.durations) expect(parseFloat(d)).toBe(0);
    await radio2d(page).check();
    expect((await motion(page)).animations).toEqual([]);
  });

  test('AC6: with normal motion a switch animates for at most 300 ms and nothing loops', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await radio3d(page).check();
    const on = await motion(page);
    for (const a of on.animations) {
      expect(a.iterations).toBe(1);
      expect(a.duration).toBeLessThanOrEqual(300);
    }
    await settled(page);
    await page.waitForTimeout(500);
    await settled(page); // still nothing running: no loops, no self-moving 3D view
    await radio2d(page).check();
    for (const a of (await motion(page)).animations) {
      expect(a.iterations).toBe(1);
      expect(a.duration).toBeLessThanOrEqual(300);
    }
    await settled(page);
  });
});

test.describe('capability fallback', () => {
  test('AC7: without 3D support "3D" is shown as unavailable and 2D works without errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.addInitScript(() => {
      CSS.supports = () => false;
    });
    await openGame(page);

    await expect(radio3d(page)).toBeDisabled();
    await expect(radio3d(page)).toHaveAccessibleDescription(UNAVAILABLE);
    await expect(page.getByText(UNAVAILABLE, { exact: true })).toBeVisible();
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeEnabled();

    await startFixed5x5(page, CORNERS);
    await cell(page, 1, 2).click();
    await expect(cell(page, 1, 2)).toHaveAccessibleName('Row 1, column 2, 1 mine nearby');
    await radio2d(page).focus();
    await page.keyboard.press('ArrowRight'); // the disabled option is skipped
    await expect(radio2d(page)).toBeChecked();
    await expect(radio2d(page)).toBeFocused();
    expect(await tilt(page)).toBe('none');
    await radio2d(page).check();
    await expect(radio2d(page)).toBeChecked();
    await expect(counter(page)).toHaveText('Mines left: 2');
    expect(errors).toEqual([]);
  });
});

test.describe('not remembered', () => {
  test('AC8: after a reload and after sign-out and sign-in the view is 2D again', async ({
    page,
  }) => {
    await openGame(page);
    await radio3d(page).check();
    await startFixed5x5(page, CORNERS);
    expect(await tilt(page)).not.toBe('none');

    await page.reload();
    await signInAsGuest(page);
    await expect(radio2d(page)).toBeChecked();
    await expect(radio3d(page)).not.toBeChecked();

    await radio3d(page).check();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await signInAsGuest(page);
    await expect(radio2d(page)).toBeChecked();
    await startFixed5x5(page, CORNERS);
    expect(await tilt(page)).toBe('none');
  });
});
