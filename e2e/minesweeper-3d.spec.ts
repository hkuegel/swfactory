/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 008 – Minesweeper 3D mode: the View control (AC1), state across switches (AC2), the
// accessible structure and focus ring (AC5) and "not remembered" (AC8). AC4 (the 005/006 flows
// in 3D) is the Playwright project `chromium-3d`, which re-runs AC6, AC8, AC9 and AC10 of
// minesweeper.spec.ts. The look, the motion and the fallbacks of 008 (AC3, AC6, AC7) were
// replaced by story 009 and live in minesweeper-3d-scene.spec.ts.
// Fixed mine layouts: window.__minesweeperMines (1-based pairs here, 0-based for the hook).

type Pair = readonly [row: number, col: number];
type TestWindow = Window & {
  __minesweeperMines?: Pair[];
  __board3dProbe?: { pause(): void };
};

const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
// The grid's parent is the stage wrapper (story 009); the scroller is the ancestor with data-view.
const scroller = (page: Page) => grid(page).locator('xpath=ancestor::*[@data-view]');
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

/**
 * Chooses "3D" and waits until the scene is ready (story 009/AC6: it loads asynchronously), then
 * freezes the scene clock with the probe: no sway loop, so cells are stable for Playwright's
 * click/scroll actions and nothing animates between two reads.
 */
async function choose3d(page: Page) {
  await radio3d(page).check();
  await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0); // fail loudly if WebGL is missing
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).__board3dProbe !== undefined))
    .toBe(true);
  await page.evaluate(() => (window as TestWindow).__board3dProbe?.pause());
}

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
    await choose3d(page);
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
    await choose3d(page);
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
      await choose3d(page);
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
      // 009 UX §6.1: the pixels under the ring change with light and shadow, so the ring is
      // sandwiched between two halo lines (outside and inside) that keep its 3:1 contrast.
      const haloColour = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--scene-focus-halo)';
        document.body.append(probe);
        const colour = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return colour;
      });
      const halo = await target.evaluate((el) => getComputedStyle(el).boxShadow);
      expect(halo.split(haloColour).length - 1, 'outer and inner halo line').toBe(2);
      expect(halo).toContain('inset');
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

test.describe('not remembered', () => {
  test('AC8: after a reload and after sign-out and sign-in the view is 2D again', async ({
    page,
  }) => {
    await openGame(page);
    await choose3d(page);
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
