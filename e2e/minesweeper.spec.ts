/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Locator, type Page } from '@playwright/test';

// Story 005 – Minesweeper. One test per AC (AC6 has a mouse and a touch test). The reducer
// rules, the validation matrix and the mine placement are unit-tested; these specs show the UI.
// Fixed mine layouts: window.__minesweeperMines, read by the dev server in mode `e2e`
// (1-based [row, column] pairs here, converted to the 0-based pairs the hook expects).

type Pair = readonly [row: number, col: number];
type MinesWindow = Window & { __minesweeperMines?: Pair[] };

const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
const counter = (page: Page) => page.getByText('Mines left:');
const WON = 'You won! Every safe cell is revealed.';
const LOST = 'You lost. You revealed a mine.';

// Exact label texts: `/mines/i` would also match cell names.
const rowsInput = (page: Page) => page.getByLabel('Rows', { exact: true });
const colsInput = (page: Page) => page.getByLabel('Columns', { exact: true });
const minesInput = (page: Page) => page.getByLabel('Mines', { exact: true });

/** A cell by 1-based position, whatever its state. */
const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });

async function expectCell(page: Page, row: number, col: number, state: string) {
  await expect(cell(page, row, col)).toHaveAccessibleName(`Row ${row}, column ${col}, ${state}`);
}

async function setMines(page: Page, layout: readonly Pair[]) {
  await page.evaluate(
    (l) => {
      (window as MinesWindow).__minesweeperMines = l.map(([r, c]) => [r - 1, c - 1]);
    },
    layout.map((p) => [...p] as Pair),
  );
}

async function setup(page: Page, rows: string, cols: string, mines: string) {
  await rowsInput(page).fill(rows);
  await colsInput(page).fill(cols);
  await minesInput(page).fill(mines);
}

/** 5 × 5 board with the given 1-based mines, started. Mines are fixed, so the test picks safe cells. */
async function startFixed5x5(page: Page, layout: readonly Pair[]) {
  await setMines(page, layout);
  await setup(page, '5', '5', String(layout.length));
  await startButton(page).click();
  await expect(grid(page)).toBeVisible();
}

/** Layout A: two mines in opposite corners. (1,2), (2,1), (2,2), (4,4), (4,5), (5,4) show 1. */
const CORNERS: readonly Pair[] = [
  [1, 1],
  [5, 5],
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
  // Story 008/AC4: the project `chromium-3d` replays the flows of AC6, AC8, AC9 and AC10 in 3D.
  if (test.info().project.name === 'chromium-3d') {
    await page.getByRole('radio', { name: '3D' }).check();
  }
});

test('AC1: the setup shows labelled inputs with ranges and defaults, Start, and no board', async ({
  page,
}) => {
  await expect(page.getByRole('heading', { level: 2, name: 'Minesweeper' })).toBeVisible();
  await expect(rowsInput(page)).toHaveValue('9');
  await expect(colsInput(page)).toHaveValue('9');
  await expect(minesInput(page)).toHaveValue('10');
  await expect(page.getByText('5 to 30', { exact: true })).toHaveCount(2);
  await expect(page.getByText('1 to 72', { exact: true })).toBeVisible();
  await expect(rowsInput(page)).toHaveAccessibleDescription('5 to 30');
  await expect(minesInput(page)).toHaveAccessibleDescription('1 to 72');
  await expect(startButton(page)).toBeVisible();
  await expect(grid(page)).toHaveCount(0);
  await expect(counter(page)).toHaveCount(0);
  await expect(
    page.getByText('Set the board size and the number of mines to begin.'),
  ).toBeVisible();
});

test('AC2: Start creates a hidden board of the chosen size, editing alone changes nothing, restart needs no confirmation', async ({
  page,
}) => {
  // Non-square, via Enter in a field (the setup is a real form).
  await setup(page, '6', '9', '10');
  await minesInput(page).press('Enter');
  await expect(grid(page)).toHaveAttribute('aria-rowcount', '6');
  await expect(grid(page)).toHaveAttribute('aria-colcount', '9');
  await expect(page.getByRole('gridcell')).toHaveCount(54);
  await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(54);
  await expect(counter(page)).toHaveText('Mines left: 10');
  await expect(page.getByText(WON)).toHaveCount(0);
  await expect(page.getByText(LOST)).toHaveCount(0);
  await expect(rowsInput(page)).toBeVisible();

  // Play a bit, edit the setup without Start: board and counter stay.
  await cell(page, 1, 1).click({ button: 'right' });
  await expect(counter(page)).toHaveText('Mines left: 9');
  await setup(page, '12', '12', '20');
  await expect(page.getByRole('gridcell')).toHaveCount(54);
  await expect(counter(page)).toHaveText('Mines left: 9');
  await expectCell(page, 1, 1, 'flagged');

  // Restart during the game: fresh board with the values in the fields, no dialog.
  page.on('dialog', () => {
    throw new Error('Start must not ask for confirmation');
  });
  await startButton(page).click();
  await expect(page.getByRole('gridcell')).toHaveCount(144);
  await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(144);
  await expect(counter(page)).toHaveText('Mines left: 20');
  await expect(startButton(page)).toBeFocused(); // Start does not steal focus

  // Restart after a lost game: the message is gone.
  await startFixed5x5(page, CORNERS);
  await cell(page, 1, 1).click();
  await expect(page.getByText(LOST)).toBeVisible();
  await startButton(page).click();
  await expect(page.getByText(LOST)).toHaveCount(0);
  await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(25);
  await expect(counter(page)).toHaveText('Mines left: 2');
});

test('AC3: an invalid value shows a message naming the field, creates no board and keeps a running game', async ({
  page,
}) => {
  // No game yet: no board is created.
  await rowsInput(page).fill('31');
  await startButton(page).click();
  await expect(page.getByText('Rows must be a whole number from 5 to 30.')).toBeVisible();
  await expect(rowsInput(page)).toBeFocused();
  await expect(rowsInput(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(rowsInput(page)).toHaveAccessibleDescription(
    '5 to 30 Rows must be a whole number from 5 to 30.',
  );
  await expect(grid(page)).toHaveCount(0);

  // A running game stays unchanged.
  await startFixed5x5(page, CORNERS);
  await cell(page, 1, 2).click();
  await expectCell(page, 1, 2, '1 mine nearby');
  await minesInput(page).fill('17'); // 5 × 5 − 9 = 16 is the maximum
  await colsInput(page).fill('');
  await startButton(page).click();
  await expect(page.getByText('Columns must be a whole number from 5 to 30.')).toBeVisible();
  await expect(rowsInput(page)).not.toHaveAttribute('aria-invalid', 'true');
  await expect(colsInput(page)).toBeFocused();
  await expect(page.getByRole('gridcell')).toHaveCount(25);
  await expectCell(page, 1, 2, '1 mine nearby');
  await expect(counter(page)).toHaveText('Mines left: 2');

  // Mines above the limit of the valid size: the message states the limit.
  await colsInput(page).fill('5');
  await startButton(page).click();
  await expect(page.getByText('Mines must be a whole number from 1 to 16.')).toBeVisible();
  await expect(minesInput(page)).toBeFocused();
  await expect(page.getByRole('gridcell')).toHaveCount(25);
  await expectCell(page, 1, 2, '1 mine nearby');
});

test('AC4: a safe cell with neighbouring mines shows its number, revealing it again changes nothing', async ({
  page,
}) => {
  await startFixed5x5(page, CORNERS);
  await cell(page, 1, 2).click();
  await expectCell(page, 1, 2, '1 mine nearby');
  await expect(cell(page, 1, 2)).toHaveText('1');
  // Only that cell opened.
  await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(24);
  await cell(page, 1, 2).click();
  await expectCell(page, 1, 2, '1 mine nearby');
  await expect(page.getByRole('gridcell', { name: /, hidden$/ })).toHaveCount(24);
  await expect(page.getByText(WON)).toHaveCount(0);
  await expect(page.getByText(LOST)).toHaveCount(0);
});

test('AC5: an empty cell opens its area, flags block the opening, the first reveal is always safe', async ({
  page,
}) => {
  // Random placement, maximum density: only the 3 × 3 zone around the first cell is mine-free.
  await setup(page, '5', '5', '16');
  await startButton(page).click();
  await cell(page, 3, 3).click();
  await expectCell(page, 3, 3, 'empty');
  for (const [r, c] of [
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [3, 4],
    [4, 2],
    [4, 3],
    [4, 4],
  ] as const) {
    await expect(cell(page, r, c)).toHaveAccessibleName(
      new RegExp(`^Row ${r}, column ${c}, \\d mines? nearby$`),
    );
  }
  await expect(page.getByText(WON)).toBeVisible(); // all 9 safe cells are open

  // Fixed layout: the flood fill skips a flagged cell.
  await startFixed5x5(page, CORNERS);
  await cell(page, 3, 4).click({ button: 'right' });
  await cell(page, 3, 3).click();
  await expectCell(page, 3, 3, 'empty');
  await expectCell(page, 1, 5, 'empty');
  await expectCell(page, 1, 2, '1 mine nearby');
  await expectCell(page, 3, 4, 'flagged');
  await expectCell(page, 1, 1, 'hidden');
  await expect(page.getByText(WON)).toHaveCount(0);
});

test('AC6: right-click flags and unflags, a flagged cell cannot be revealed, a revealed one cannot be flagged', async ({
  page,
}) => {
  await startFixed5x5(page, CORNERS);
  await cell(page, 3, 3).click({ button: 'right' });
  await expectCell(page, 3, 3, 'flagged');
  await cell(page, 3, 3).click();
  await expectCell(page, 3, 3, 'flagged');
  await expect(page.getByRole('gridcell', { name: /, empty$/ })).toHaveCount(0);
  await cell(page, 3, 3).click({ button: 'right' });
  await expectCell(page, 3, 3, 'hidden');

  await cell(page, 1, 2).click();
  await cell(page, 1, 2).click({ button: 'right' });
  await expectCell(page, 1, 2, '1 mine nearby');

  // The browser context menu is suppressed on the board (it would swallow the second click).
  const prevented = await grid(page).evaluate((el) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    el.querySelector('[role="gridcell"]')?.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('AC6: a long press flags and unflags without revealing, a short tap reveals', async ({
    page,
  }) => {
    await startFixed5x5(page, CORNERS);
    const client = await page.context().newCDPSession(page);
    const press = async (target: Locator, holdMs: number) => {
      // CDP touch events use viewport coordinates: the cell must be on screen.
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      if (!box) throw new Error('cell has no box');
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await page.waitForTimeout(holdMs);
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };

    await press(cell(page, 3, 3), 700);
    await expectCell(page, 3, 3, 'flagged');
    await expect(counter(page)).toHaveText('Mines left: 1');
    // Settled: not revealed by the lifted finger, not toggled again by a late contextmenu.
    await page.waitForTimeout(300);
    await expectCell(page, 3, 3, 'flagged');

    await press(cell(page, 3, 3), 700);
    await expectCell(page, 3, 3, 'hidden');
    await expect(counter(page)).toHaveText('Mines left: 2');

    await cell(page, 1, 2).tap();
    await expectCell(page, 1, 2, '1 mine nearby');
    await expectCell(page, 1, 1, 'hidden');
  });
});

test('AC7: the counter is mines minus flags, and goes negative', async ({ page }) => {
  await startFixed5x5(page, CORNERS);
  await expect(counter(page)).toHaveText('Mines left: 2');
  await cell(page, 2, 3).click({ button: 'right' });
  await expect(counter(page)).toHaveText('Mines left: 1');
  await cell(page, 3, 3).click({ button: 'right' });
  await cell(page, 4, 3).click({ button: 'right' });
  await expect(counter(page)).toHaveText('Mines left: -1');
  await cell(page, 3, 3).click({ button: 'right' });
  await expect(counter(page)).toHaveText('Mines left: 0');
});

test('AC8: the board is played with the keyboard only', async ({ page }) => {
  await startFixed5x5(page, CORNERS);
  const focused = page.locator(':focus');
  // Tab from Start until the board is reached: the number of stops in between (View control, ...)
  // is not this test's business, but the board must be reachable and one tab stop.
  await startButton(page).focus();
  for (let i = 0; i < 12 && (await grid(page).locator(':focus').count()) === 0; i++) {
    await page.keyboard.press('Tab');
  }
  await expect(focused).toHaveAccessibleName('Row 1, column 1, hidden');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await expect(focused).toHaveAccessibleName('Row 1, column 1, hidden');
  await page.keyboard.press('ArrowRight');
  await expect(focused).toHaveAccessibleName('Row 1, column 2, hidden');
  await page.keyboard.press('Enter');
  await expectCell(page, 1, 2, '1 mine nearby');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expectCell(page, 2, 2, '1 mine nearby');

  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await expect(focused).toHaveAccessibleName('Row 5, column 5, hidden'); // clamped at the edges

  await page.keyboard.press('f');
  await expect(focused).toHaveAccessibleName('Row 5, column 5, flagged');
  await expect(counter(page)).toHaveText('Mines left: 1');
  await page.keyboard.press('Enter');
  await expect(focused).toHaveAccessibleName('Row 5, column 5, flagged');
  await page.keyboard.press('Shift+F');
  await expect(focused).toHaveAccessibleName('Row 5, column 5, hidden');

  // Enter on an empty cell opens its area; the focus stays on the cell.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expectCell(page, 1, 5, 'empty');
  await expect(focused).toHaveAccessibleName('Row 3, column 3, empty');

  // Exactly one tab stop, and Tab leaves the board.
  await expect(page.locator('[role="gridcell"][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(grid(page).locator(':focus')).toHaveCount(0);
});

test('AC9: revealing a mine loses: all mines shown, the exploded one highlighted, flags judged, board frozen', async ({
  page,
}) => {
  const layout: readonly Pair[] = [...CORNERS, [1, 5]];
  await startFixed5x5(page, layout);
  await cell(page, 1, 1).click({ button: 'right' }); // correct flag
  await cell(page, 3, 3).click({ button: 'right' }); // wrong flag
  await cell(page, 5, 5).click(); // the mine
  await expect(page.getByText(LOST)).toBeVisible();
  await expect(page.getByText(WON)).toHaveCount(0);
  await expectCell(page, 5, 5, 'exploded mine');
  await expectCell(page, 1, 5, 'mine');
  await expectCell(page, 1, 1, 'flagged');
  await expectCell(page, 3, 3, 'wrong flag, no mine here');
  await expect(counter(page)).toHaveText('Mines left: 1');
  await expect(grid(page)).toHaveAttribute('aria-readonly', 'true');

  // Frozen: click, right-click and the keyboard change nothing.
  await cell(page, 2, 2).click();
  await cell(page, 2, 3).click({ button: 'right' });
  await cell(page, 1, 1).click({ button: 'right' });
  await cell(page, 2, 4).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('f');
  await expectCell(page, 2, 2, 'hidden');
  await expectCell(page, 2, 3, 'hidden');
  await expectCell(page, 2, 4, 'hidden');
  await expectCell(page, 1, 1, 'flagged');
  await expect(counter(page)).toHaveText('Mines left: 1');
  // Arrow keys still move the focus to inspect the board.
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(':focus')).toHaveAccessibleName('Row 2, column 5, hidden');
});

test('AC10: revealing every safe cell wins: all mines flagged, counter 0, board frozen', async ({
  page,
}) => {
  // Mines at (1,2) and (2,1) wall off the corner (1,1): the first reveal does not finish the game.
  await startFixed5x5(page, [
    [1, 2],
    [2, 1],
  ]);
  await cell(page, 4, 4).click();
  await expectCell(page, 3, 3, 'empty');
  await expectCell(page, 1, 1, 'hidden');
  await expect(page.getByText(WON)).toHaveCount(0);
  await expect(counter(page)).toHaveText('Mines left: 2');

  await cell(page, 1, 1).click();
  await expectCell(page, 1, 1, '2 mines nearby');
  await expect(page.getByText(WON)).toBeVisible();
  await expect(page.getByText(LOST)).toHaveCount(0);
  await expectCell(page, 1, 2, 'flagged');
  await expectCell(page, 2, 1, 'flagged');
  await expect(counter(page)).toHaveText('Mines left: 0');
  await expect(grid(page)).toHaveAttribute('aria-readonly', 'true');

  // Frozen.
  await cell(page, 1, 2).click({ button: 'right' });
  await cell(page, 2, 1).click();
  await cell(page, 3, 3).focus();
  await page.keyboard.press('f');
  await expectCell(page, 1, 2, 'flagged');
  await expectCell(page, 3, 3, 'empty');
  await expect(counter(page)).toHaveText('Mines left: 0');
  await expect(page.getByText(WON)).toBeVisible();
});

// Story 006 – presets and timer. The timer runs on Playwright's fake clock (page.clock): installed
// before goto, paused after sign-in, so time moves only with runFor and the seconds are exact.
test.describe('006 presets and timer', () => {
  const T0 = new Date('2026-01-01T10:00:00Z');
  const preset = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
  const timer = (page: Page) => page.getByText('Time:');

  test.beforeEach(async ({ page }) => {
    // The outer beforeEach already signed in on the real clock; reload under the fake one.
    await page.clock.install({ time: T0 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in as guest' }).click();
    await expect(page.getByText('Signed in as')).toBeVisible();
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
  });

  test('AC3: the timer shows 0 until the first reveal, then whole seconds, with no cap', async ({
    page,
  }) => {
    await startFixed5x5(page, CORNERS);
    await expect(timer(page)).toHaveText('Time: 0');
    await cell(page, 3, 3).click({ button: 'right' }); // a flag does not start it
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('Time: 0');

    await cell(page, 1, 2).click(); // first reveal, shows 1: the game goes on
    await page.clock.runFor(999);
    await expect(timer(page)).toHaveText('Time: 0');
    await page.clock.runFor(1);
    await expect(timer(page)).toHaveText('Time: 1');
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('Time: 3');
    await page.clock.fastForward(1_000_000); // one jump: the value comes from timestamps
    await expect(timer(page)).toHaveText('Time: 1003'); // no 999 cap
  });

  test('AC1: exactly three presets, next to the free inputs', async ({ page }) => {
    const difficulty = page.getByRole('group', { name: 'Difficulty' });
    await expect(difficulty.getByRole('button')).toHaveText([
      /^Beginner/,
      /^Intermediate/,
      /^Expert/,
    ]);
    await expect(preset(page, 'Beginner')).toBeVisible();
    await expect(preset(page, 'Intermediate')).toBeVisible();
    await expect(preset(page, 'Expert')).toBeVisible();
    await expect(rowsInput(page)).toBeVisible();
    await expect(colsInput(page)).toBeVisible();
    await expect(minesInput(page)).toBeVisible();
    await expect(startButton(page)).toBeVisible();
  });

  test('AC2: a preset fills the inputs, they stay editable, and a board changes only with Start', async ({
    page,
  }) => {
    for (const [name, rows, cols, mines] of [
      ['Intermediate', '16', '16', '40'],
      ['Expert', '16', '30', '99'],
      ['Beginner', '9', '9', '10'],
    ] as const) {
      await preset(page, name).click();
      await expect(rowsInput(page)).toHaveValue(rows);
      await expect(colsInput(page)).toHaveValue(cols);
      await expect(minesInput(page)).toHaveValue(mines);
    }
    await expect(preset(page, 'Beginner')).toBeFocused(); // focus stays on the pressed button
    await expect(grid(page)).toHaveCount(0); // a preset never starts a game

    // Still editable, and an invalid message is cleared by a preset.
    await preset(page, 'Expert').click();
    await minesInput(page).fill('5');
    await expect(minesInput(page)).toHaveValue('5');
    await rowsInput(page).fill('99');
    await startButton(page).click();
    await expect(page.getByText('Rows must be a whole number from 5 to 30.')).toBeVisible();
    await preset(page, 'Beginner').click();
    await expect(page.getByText('Rows must be a whole number from 5 to 30.')).toHaveCount(0);
    await expect(rowsInput(page)).not.toHaveAttribute('aria-invalid', 'true');

    // A board in progress stays unchanged until Start.
    await startFixed5x5(page, CORNERS);
    await cell(page, 1, 2).click();
    await cell(page, 3, 3).click({ button: 'right' });
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('Time: 2');
    await preset(page, 'Intermediate').click();
    await expect(rowsInput(page)).toHaveValue('16');
    await expect(page.getByRole('gridcell')).toHaveCount(25);
    await expectCell(page, 1, 2, '1 mine nearby');
    await expectCell(page, 3, 3, 'flagged');
    await expect(counter(page)).toHaveText('Mines left: 1');
    await expect(timer(page)).toHaveText('Time: 2');
    await page.clock.runFor(1000);
    await expect(timer(page)).toHaveText('Time: 3'); // the timer keeps running
    // The fixed layout has 2 mines: drop it, or the reducer rejects 40 mines.
    await page.evaluate(() => {
      delete (window as MinesWindow).__minesweeperMines;
    });
    await startButton(page).click();
    await expect(page.getByRole('gridcell')).toHaveCount(256);
    await expect(counter(page)).toHaveText('Mines left: 40');
  });

  test('AC4: a lost game freezes the timer on its value', async ({ page }) => {
    await startFixed5x5(page, CORNERS);
    await cell(page, 1, 2).click();
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('Time: 2');
    await cell(page, 1, 1).click(); // the mine
    await expect(page.getByText(LOST)).toBeVisible();
    await expect(page.getByText('Finished in 2 seconds.')).toBeAttached();
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('Time: 2');
  });

  test('AC4: a won game freezes the timer on its value', async ({ page }) => {
    await startFixed5x5(page, [
      [1, 2],
      [2, 1],
    ]);
    await cell(page, 4, 4).click();
    await page.clock.runFor(1000);
    await expect(timer(page)).toHaveText('Time: 1');
    await cell(page, 1, 1).click(); // last safe cell
    await expect(page.getByText(WON)).toBeVisible();
    await expect(page.getByText('Finished in 1 second.')).toBeAttached();
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('Time: 1');
  });

  test('AC5: Start resets the timer, which stays 0 until the first reveal of the new game', async ({
    page,
  }) => {
    await startFixed5x5(page, CORNERS);
    await cell(page, 1, 2).click();
    await page.clock.runFor(4000);
    await expect(timer(page)).toHaveText('Time: 4');

    // While running.
    await startFixed5x5(page, CORNERS);
    await expect(timer(page)).toHaveText('Time: 0');
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText('Time: 0');

    // After a finished game.
    await cell(page, 1, 2).click();
    await page.clock.runFor(2000);
    await cell(page, 1, 1).click(); // lose
    await expect(page.getByText(LOST)).toBeVisible();
    await expect(timer(page)).toHaveText('Time: 2');
    await startFixed5x5(page, CORNERS);
    await expect(timer(page)).toHaveText('Time: 0');
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText('Time: 0');
    await cell(page, 1, 2).click();
    await page.clock.runFor(1000);
    await expect(timer(page)).toHaveText('Time: 1');
  });

  // UX §7: at 375 px the three presets share one row (about 104 px each).
  test.describe('phone width', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test('UX7: at 375 px the three presets share one row without horizontal scrolling', async ({
      page,
    }) => {
      const boxes = await Promise.all(
        ['Beginner', 'Intermediate', 'Expert'].map((name) => preset(page, name).boundingBox()),
      );
      const ys = boxes.map((box) => Math.round(box?.y ?? -1));
      expect(new Set(ys).size).toBe(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    });
  });
});
