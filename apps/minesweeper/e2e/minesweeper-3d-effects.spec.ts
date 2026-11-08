/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 010 – Minesweeper 3D end effects: the explosion on a loss (AC1), the confetti on a win
// (AC2), no replay when 3D is shown after the end (AC3) and reduced motion (AC4). AC5 (frame
// rate on the reference machine) is the script scripts/measure-fps.mjs, run headed on hak's
// Mac, not in CI.
//
// The scene renders on software WebGL (SwiftShader), so time is the scene clock of the dev-only
// probe (`pause()`, `holdSway(true)`, `advance(ms)`), never wall-clock. The probe's counters
// (`fxState`) prove the plan; the rendered pixels (token colours counted on the canvas) prove
// that something is really drawn. Nothing here asserts design values (sizes, exact colours or
// durations of single particles): only the limits of the ACs and what a player sees.
// Fixed mine layouts: window.__minesweeperMines (0-based pairs for the hook, 1-based here).

type Pair = readonly [row: number, col: number];
type Rect = { x: number; y: number; width: number; height: number };
type Fx = {
  running: boolean;
  animating: number;
  particles: number;
  shake: number;
  flash: number;
  minesPending: number;
};
type Probe = {
  pause(): void;
  holdSway(hold: boolean): void;
  advance(ms: number): void;
  project(
    index: number,
    offset?: readonly [dx: number, dy: number, dz: number],
  ): { x: number; y: number };
  readonly renderer: string;
  readonly fxState: Fx;
  luminance(rect?: Rect): number;
};
type TestWindow = Window & { __minesweeperMines?: Pair[]; __board3dProbe?: Probe };

/** Margin for one more frame on top of the frame gaps before the end. */
const FRAME_MARGIN_MS = 100;
/**
 * Safety cap of the watch window. Headless Chromium renders on software WebGL (SwiftShader) on every
 * machine: 2.5 s plus the longest frame gap measured on the GitHub runner, 6.6 s (rAF at 375 x 800,
 * Test report "Reproduction", story 019), about 10 s.
 */
const WATCH_MS = 10_000;

const UNAVAILABLE = '3D is not available in this browser.';
const LOST = 'You lost. You revealed a mine.';
const WON = 'You won! Every safe cell is revealed.';
// Hard limits of the ACs (the only numbers asserted).
const LOSS_LIMIT_MS = 2500;
const WIN_LIMIT_MS = 4000;
const SHAKE_LIMIT_MS = 400;
const FLASHES_PER_SECOND = 3;

const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
const counter = (page: Page) => page.getByText('Mines left:');
const timer = (page: Page) => page.getByText('Time:');
const viewGroup = (page: Page) => page.getByRole('radiogroup', { name: 'View' });
const radio2d = (page: Page) => page.getByRole('radio', { name: '2D' });
const radio3d = (page: Page) => page.getByRole('radio', { name: '3D' });
const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
const preset = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });
const index = (cols: number, row: number, col: number) => (row - 1) * cols + (col - 1);

// Layouts (1-based). LOSS: 10 mines like the Beginner preset (so "preset, then Start" keeps the
// fixed layout). Revealing (9,5) opens rows 5 to 9; the mine (4,2) is then clicked; the other nine
// are the chain, one of them correctly flagged and one safe cell wrongly flagged.
const LOSS: readonly Pair[] = [
  [4, 2],
  [4, 4],
  [4, 6],
  [4, 8],
  [2, 3],
  [2, 5],
  [2, 7],
  [1, 1],
  [1, 9],
  [3, 9],
];
const LOSS_CLICK: Pair = [4, 2];
// WIN: two mines; (9,9) opens everything except the safe cell (1,2), the last one.
const WIN: readonly Pair[] = [
  [1, 1],
  [1, 3],
];

async function openGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

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
  await startButton(page).click();
  await expect(grid(page)).toBeVisible();
}

/** Chooses "3D", waits until the scene is ready, freezes the scene clock. Fails without WebGL. */
async function choose3d(page: Page) {
  await radio3d(page).check();
  await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).__board3dProbe !== undefined))
    .toBe(true);
  await page.evaluate(() => (window as TestWindow).__board3dProbe?.pause());
}

// The effects are isolated (an exception in one is logged and the board stays static, UX §7), so a
// break would be silent: every test here fails on a console error or an uncaught exception.
const problems = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const list: string[] = [];
  problems.set(page, list);
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') list.push(m.text());
  });
});
test.afterEach(({ page }) => {
  expect(problems.get(page) ?? [], 'console errors and uncaught exceptions').toEqual([]);
});

// --- game scripts ---------------------------------------------------------------------------

/** A 9 x 9 game up to the losing click: two flags (one wrong), (9,5) opened. Does not click the mine. */
async function prepareLoss(page: Page) {
  await startFixed(page, 9, 9, LOSS);
  await cell(page, 3, 3).click({ button: 'right' }); // wrong flag: no mine here
  await cell(page, 1, 1).click({ button: 'right' }); // right flag: stays a flag
  await cell(page, 9, 5).click();
  await page.mouse.move(0, 0);
}
const loseNow = (page: Page) => cell(page, ...LOSS_CLICK).click();

/** A 9 x 9 game up to the winning click on the last safe cell (1,2). */
async function prepareWin(page: Page) {
  await startFixed(page, 9, 9, WIN);
  await cell(page, 9, 9).click();
  await page.mouse.move(0, 0);
}
const winNow = (page: Page) => cell(page, 1, 2).click();

// --- probe wrappers -------------------------------------------------------------------------

const hold = (page: Page, on: boolean) =>
  page.evaluate((h) => (window as TestWindow).__board3dProbe?.holdSway(h), on);
const advance = (page: Page, ms: number) =>
  page.evaluate((m) => (window as TestWindow).__board3dProbe?.advance(m), ms);
const fxState = (page: Page) =>
  page.evaluate(() => {
    const probe = (window as TestWindow).__board3dProbe;
    if (!probe) throw new Error('no probe');
    return { ...probe.fxState };
  });

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

const IDLE: Fx = {
  running: false,
  animating: 0,
  particles: 0,
  shake: 0,
  flash: 0,
  minesPending: 0,
};

/** Advances by each step and records the effect counters after it (t = time since the call). */
const sampleFx = (page: Page, steps: readonly number[]) =>
  page.evaluate((list) => {
    const probe = (window as TestWindow).__board3dProbe;
    if (!probe) throw new Error('no probe');
    let t = 0;
    return list.map((dt) => {
      probe.advance(dt);
      t += dt;
      return { t, fx: { ...probe.fxState } };
    });
  }, steps);

/** `n` steps of `dt` ms. */
const every = (dt: number, total: number) =>
  Array.from({ length: Math.round(total / dt) }, () => dt);

/**
 * Advances by `ms`, then counts the canvas pixels within `tol` (per channel) of any of the colours
 * of the given CSS custom properties (read from :root at the time, so no colour literal here).
 * `share` is the fraction of all canvas pixels.
 */
const paint = (
  page: Page,
  tokens: readonly string[],
  ms: number,
  tol = 40,
  around: number | null = null,
) =>
  page.evaluate(
    async ([names, step, tolerance, cellIndex]) => {
      const probe = (window as TestWindow).__board3dProbe;
      const canvas = document.querySelector('canvas');
      if (!probe || !canvas) throw new Error('no probe or canvas');
      probe.advance(Number(step));
      const url = canvas.toDataURL(); // same task as the render: no preserveDrawingBuffer needed
      const styles = getComputedStyle(document.documentElement);
      const colours = (names as readonly string[]).map((name) => {
        const hex = styles.getPropertyValue(name).trim().replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`${name} is not a hex colour: ${hex}`);
        return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      });
      const img = new Image();
      img.src = url;
      await img.decode();
      const work = document.createElement('canvas');
      work.width = img.width;
      work.height = img.height;
      const ctx = work.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      // The whole canvas, or the box of one cell (the overlay cell) grown by a quarter.
      let x0 = 0;
      let y0 = 0;
      let w = work.width;
      let h = work.height;
      if (cellIndex !== null) {
        const el = document.querySelector(`[data-index="${cellIndex}"]`);
        if (!el) throw new Error('no cell');
        const box = el.getBoundingClientRect();
        const rect = canvas.getBoundingClientRect();
        const k = work.width / rect.width;
        x0 = Math.max(0, Math.round((box.left - rect.left - box.width / 4) * k));
        y0 = Math.max(0, Math.round((box.top - rect.top - box.height / 4) * k));
        w = Math.min(work.width - x0, Math.round(box.width * 1.5 * k));
        h = Math.min(work.height - y0, Math.round(box.height * 1.5 * k));
      }
      const data = ctx.getImageData(x0, y0, w, h).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        if (
          colours.some(
            (c) =>
              Math.abs(r - (c[0] ?? 0)) <= Number(tolerance) &&
              Math.abs(g - (c[1] ?? 0)) <= Number(tolerance) &&
              Math.abs(b - (c[2] ?? 0)) <= Number(tolerance),
          )
        )
          count++;
      }
      return { count, share: count / (data.length / 4) };
    },
    [tokens, ms, tol, around] as const,
  );

const FIRE = ['--scene-fx-fire-core', '--scene-fx-fire-mid', '--scene-fx-flash'] as const;
const DANGER = ['--color-danger-solid'] as const;
const CONFETTI = [1, 2, 3, 4, 5, 6].map((n) => `--scene-confetti-${n}`);

// --- flash counting (WCAG 2.3.1 style) ------------------------------------------------------
//
// Definition used here (stricter than WCAG's 0.1 absolute): an opposing change is a swing of the
// luminance between two turning points of at least 10 % of the brighter of the two values; a
// flash is a pair of consecutive opposing changes (rise then fall, or fall then rise); the rate
// is the largest number of flashes completed in any window of 1 s. Turning points are found with
// a 5 % hysteresis so that sampling noise does not split one swing into small ones.

type Sample = { t: number; v: number };
const SWING = 0.1;
const HYSTERESIS = 0.05;

function turningPoints(series: readonly Sample[]): Sample[] {
  const first = series[0];
  if (!first) return [];
  const points: Sample[] = [first];
  let extreme = first;
  let dir = 0; // 1 rising, -1 falling
  for (const s of series.slice(1)) {
    const scale = Math.max(extreme.v, s.v, 1e-9);
    if (dir >= 0 && s.v >= extreme.v) {
      extreme = s;
      if (dir === 0 && s.v > first.v) dir = 1;
    } else if (dir <= 0 && s.v <= extreme.v) {
      extreme = s;
      if (dir === 0 && s.v < first.v) dir = -1;
    } else if (Math.abs(s.v - extreme.v) >= HYSTERESIS * scale) {
      points.push(extreme);
      dir = dir >= 0 ? -1 : 1;
      extreme = s;
    }
  }
  points.push(extreme);
  return points;
}

/** Times at which a flash (two opposing changes of >= 10 % of the brighter value) completed. */
function flashTimes(series: readonly Sample[], swing = SWING): number[] {
  const points = turningPoints(series);
  const changes: { end: number; dir: number }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Sample;
    const b = points[i] as Sample;
    if (Math.abs(b.v - a.v) >= swing * Math.max(a.v, b.v))
      changes.push({ end: b.t, dir: Math.sign(b.v - a.v) });
  }
  const flashes: number[] = [];
  for (let i = 1; i < changes.length; i++) {
    const prev = changes[i - 1] as { end: number; dir: number };
    const now = changes[i] as { end: number; dir: number };
    if (prev.dir !== now.dir) flashes.push(now.end);
  }
  return flashes;
}

function maxPerSecond(times: readonly number[]): number {
  let best = 0;
  for (const t of times) best = Math.max(best, times.filter((u) => u >= t && u < t + 1000).length);
  return best;
}

/** The self-test of the counter: it must see flashes where there are some. */
test('the flash counter counts flashes (self-test of the rule used by the AC1/AC2 tests)', () => {
  const at = (values: readonly number[], dt: number): Sample[] =>
    values.map((v, i) => ({ t: i * dt, v }));
  const strobe = at([0.2, 0.5, 0.2, 0.5, 0.2, 0.5, 0.2, 0.5, 0.2, 0.5, 0.2], 100); // 5 pairs in 1 s
  expect(maxPerSecond(flashTimes(strobe))).toBeGreaterThan(FLASHES_PER_SECOND);
  const once = at([0.2, 0.2, 0.5, 0.3, 0.2, 0.2, 0.2], 100); // one pop
  expect(maxPerSecond(flashTimes(once))).toBe(1);
  const slow = at([0.6, 0.605, 0.61, 0.6, 0.595, 0.61, 0.6], 100); // 2 % wobble: no flash
  expect(flashTimes(slow)).toEqual([]);
  const fall = at([0.6, 0.6, 0.3, 0.6, 0.6], 100); // dark pulse counts as well
  expect(maxPerSecond(flashTimes(fall))).toBe(1);
});

// --- AC1 --------------------------------------------------------------------------------------

test.describe('loss (light)', () => {
  const T0 = new Date('2026-01-01T10:00:00Z');

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.clock.install({ time: T0 });
    await openGame(page);
    await choose3d(page);
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
  });

  test('AC1: a loss shows the message and a stopped timer at once, plays an explosion that is drawn, shakes for at most 0.4 s, reveals the mines one after another and ends within 2.5 s as a static board', async ({
    page,
  }) => {
    await prepareLoss(page);
    await hold(page, true);
    await page.clock.runFor(3000);
    await expect(timer(page)).toHaveText('Time: 3');
    await expect(counter(page)).toHaveText('Mines left: 8'); // 10 mines, 2 flags
    const fireBefore = await paint(page, FIRE, 0);

    await loseNow(page);

    // Message and timer are there with the scene clock still at the click: they do not wait.
    await expect(page.getByText(LOST)).toBeVisible();
    await expect(timer(page)).toHaveText('Time: 3');
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('Time: 3'); // stopped
    expect((await fxState(page)).running, 'the effect has not progressed yet').toBe(true);

    // It is drawn: fire-coloured pixels appear that the quiet board does not have.
    const bang = await paint(page, FIRE, 180); // fireball, ring and shards
    expect(bang.count, 'fire pixels at 180 ms').toBeGreaterThan(fireBefore.count + 150);
    const at180 = await fxState(page);
    expect(at180.particles, 'particles at 180 ms').toBeGreaterThan(0);
    expect(at180.shake, 'the camera shakes').toBeGreaterThan(0);

    // Shake: none from 0.4 s on. Chain: the pending mines never go up, are above 0 at the start,
    // end at 0 and take several distinct steps.
    const samples = (await sampleFx(page, [...every(20, 220), ...every(100, 2100)])).map((s) => ({
      t: s.t + 180, // scene time since the click
      fx: s.fx,
    }));
    expect(
      samples.filter((s) => s.t >= SHAKE_LIMIT_MS).every((s) => s.fx.shake === 0),
      'no shake from 0.4 s on',
    ).toBe(true);
    const pending = [at180, ...samples.map((s) => s.fx)].map((fx) => fx.minesPending);
    expect(pending[0], 'mines still to be revealed after the bang').toBeGreaterThan(0);
    for (let i = 1; i < pending.length; i++)
      expect(pending[i], `pending at sample ${i}`).toBeLessThanOrEqual(pending[i - 1] ?? 0);
    expect(pending.at(-1)).toBe(0);
    expect(new Set(pending).size, 'mines are revealed one after another').toBeGreaterThanOrEqual(3);

    // Over by 2.5 s: nothing left, the board is static (the frame does not change any more).
    expect(samples.at(-1)?.t).toBeLessThanOrEqual(LOSS_LIMIT_MS);
    expect(await fxState(page)).toEqual(IDLE);
    expect((await paint(page, FIRE, 0)).count, 'no fire left').toBeLessThan(fireBefore.count + 20);
    const end = await frameAfter(page, 0);
    expect(await frameAfter(page, 5000), 'the final board is static').toBe(end);
    await expect(page.getByText(LOST)).toBeVisible();
  });

  test('AC1: Start during the effect stops it at once; a preset alone changes nothing until Start', async ({
    page,
  }) => {
    await prepareLoss(page);
    await hold(page, true);
    await loseNow(page);
    await advance(page, 300);
    expect((await fxState(page)).running).toBe(true);

    // 006/AC2: a preset only fills the inputs; the board and its effect stay.
    await preset(page, 'Beginner').click();
    await expect(page.getByText(LOST)).toBeVisible();
    expect((await fxState(page)).running, 'a preset alone leaves the effect').toBe(true);
    await advance(page, 100);
    expect((await fxState(page)).particles).toBeGreaterThan(0);

    // Preset then Start: the new board is fresh and no effect state remains, no advance needed.
    await startButton(page).click();
    await expect(page.getByText(LOST)).toHaveCount(0);
    await expect(grid(page)).toBeVisible();
    expect(await fxState(page)).toEqual(IDLE);
    const fresh = await frameAfter(page, 0);
    expect(await frameAfter(page, 5000), 'no particle or shake is left in the new board').toBe(
      fresh,
    );

    // Start alone (a second effect, cancelled directly).
    await cell(page, 3, 3).click({ button: 'right' });
    await cell(page, 9, 5).click();
    await page.mouse.move(0, 0);
    await loseNow(page);
    await advance(page, 300);
    expect((await fxState(page)).running).toBe(true);
    await startButton(page).click();
    expect(await fxState(page)).toEqual(IDLE);
    const again = await frameAfter(page, 0);
    expect(await frameAfter(page, 5000)).toBe(again);
  });
});

// --- AC2 --------------------------------------------------------------------------------------

test.describe('win (dark)', () => {
  const T0 = new Date('2026-01-01T10:00:00Z');

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.clock.install({ time: T0 });
    await openGame(page);
    await choose3d(page);
    await page.clock.pauseAt(new Date(T0.getTime() + 60_000));
  });

  test('AC2: a win shows the message and a stopped timer at once, plays confetti that is drawn and leaves the board readable, and ends within 4 s without a loop', async ({
    page,
  }) => {
    await prepareWin(page);
    await hold(page, true);
    await page.clock.runFor(2000);
    await expect(timer(page)).toHaveText('Time: 2');
    await advance(page, 2000); // the cascade of (9,9) has ended

    await winNow(page);

    await expect(page.getByText(WON)).toBeVisible();
    await expect(counter(page)).toHaveText('Mines left: 0');
    await expect(timer(page)).toHaveText('Time: 2');
    await page.clock.runFor(5000);
    await expect(timer(page)).toHaveText('Time: 2'); // stopped
    expect((await fxState(page)).running, 'the celebration has not progressed yet').toBe(true);

    // Confetti is drawn, and covers only a small part of the board (it stays readable).
    const seen: { count: number; share: number }[] = [];
    let previous = 0;
    for (const t of [150, 400, 700, 1000, 1400, 2000, 3000]) {
      seen.push(await paint(page, CONFETTI, t - previous));
      previous = t;
      if (t === 700) {
        expect((await fxState(page)).particles).toBeGreaterThan(0);
        expect((await fxState(page)).shake, 'no camera shake on a win').toBe(0);
      }
    }

    // Over by 4 s; the frame never changes again (no loop).
    await advance(page, WIN_LIMIT_MS - previous);
    expect(await fxState(page)).toEqual(IDLE);
    const final = await paint(page, CONFETTI, 0); // the flags of the final board are red as well
    expect(
      Math.max(...seen.map((s) => s.count)),
      'confetti-coloured pixels beyond those of the final board',
    ).toBeGreaterThan(final.count + 150);
    expect(
      Math.max(...seen.map((s) => s.share)) - final.share,
      'share of the canvas covered by confetti at the busiest frame',
    ).toBeLessThan(0.15);
    const end = await frameAfter(page, 0);
    expect(await frameAfter(page, 5000), 'static, no second round').toBe(end);
    expect(await fxState(page)).toEqual(IDLE);
  });

  test('AC2: during the celebration the presets, the view control and Start work; Start stops it at once', async ({
    page,
  }) => {
    await prepareWin(page);
    await hold(page, true);
    await winNow(page);
    await advance(page, 700);
    expect((await fxState(page)).running).toBe(true);

    // A preset works (inputs only) and the celebration goes on.
    await preset(page, 'Intermediate').click();
    await expect(page.getByLabel('Rows', { exact: true })).toHaveValue('16');
    await expect(page.getByText(WON)).toBeVisible();
    expect((await fxState(page)).running).toBe(true);

    // The view control works: 2D shows the board without a canvas, 3D again shows it static.
    await radio2d(page).check();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(grid(page)).toBeVisible();
    await choose3d(page);
    expect(await fxState(page), 'no replay after the switch').toEqual(IDLE);

    // Start during a (new) celebration.
    await page.getByLabel('Rows', { exact: true }).fill('9');
    await page.getByLabel('Columns', { exact: true }).fill('9');
    await page.getByLabel('Mines', { exact: true }).fill(String(WIN.length));
    await startButton(page).click();
    await hold(page, true);
    await cell(page, 9, 9).click();
    await page.mouse.move(0, 0);
    await winNow(page);
    await advance(page, 700);
    expect((await fxState(page)).running).toBe(true);
    await startButton(page).click();
    await expect(page.getByText(WON)).toHaveCount(0);
    expect(await fxState(page)).toEqual(IDLE);
    const fresh = await frameAfter(page, 0);
    expect(await frameAfter(page, 5000), 'no confetti is left in the new board').toBe(fresh);
  });
});

// --- AC1 + AC2: nothing flashes more than three times in any second ----------------------------

for (const colorScheme of ['light', 'dark'] as const) {
  for (const end of ['loss', 'win'] as const) {
    test(`AC${end === 'loss' ? 1 : 2}: nothing flashes more than ${FLASHES_PER_SECOND} times in any second of the ${end} effect (${colorScheme})`, async ({
      page,
    }) => {
      test.setTimeout(120_000); // about 200 software-rendered frames
      await page.emulateMedia({ colorScheme });
      await openGame(page);
      await choose3d(page);
      if (end === 'loss') {
        await prepareLoss(page);
        await hold(page, true);
        await loseNow(page);
      } else {
        await prepareWin(page);
        await hold(page, true);
        await winNow(page);
      }
      const limit = end === 'loss' ? LOSS_LIMIT_MS : WIN_LIMIT_MS;
      const centre = end === 'loss' ? index(9, ...LOSS_CLICK) : index(9, 5, 5); // the mine / the board middle

      // Every 33 ms in the first second (the bang), every 100 ms after; mean luminance of the
      // whole canvas, of a 341 x 256 px window (the WCAG area) and of 150 px around the origin.
      const steps = [0, ...every(33, 990), ...every(100, limit - 990 + 100)];
      const series = await page.evaluate(
        ([list, middle]) => {
          const probe = (window as TestWindow).__board3dProbe;
          if (!probe) throw new Error('no probe');
          const around = (w: number, h: number): Rect => {
            const p = probe.project(Number(middle));
            return { x: p.x - w / 2, y: p.y - h / 2, width: w, height: h };
          };
          let t = 0;
          return (list as readonly number[]).map((dt) => {
            probe.advance(dt);
            t += dt;
            return {
              t,
              whole: probe.luminance(),
              wcag: probe.luminance(around(341, 256)),
              local: probe.luminance(around(150, 150)),
            };
          });
        },
        [steps, centre] as const,
      );
      for (const area of ['whole', 'wcag', 'local'] as const) {
        const s = series.map((p) => ({ t: p.t, v: p[area] }));
        expect(
          s.every((p) => Number.isFinite(p.v)),
          `${area}: luminance is readable`,
        ).toBe(true);
        const rate = maxPerSecond(flashTimes(s));
        expect(rate, `flashes per second, ${area} area`).toBeLessThanOrEqual(FLASHES_PER_SECOND);
      }
      if (end === 'loss') {
        // Non-vacuity: the explosion is visible in the luminance around the mine (the bloom).
        const local = series.map((p) => p.local);
        const quiet = local[0] ?? 0;
        expect(
          Math.max(...local.map((v) => Math.abs(v - quiet) / Math.max(v, quiet))),
          `the bang changes the luminance around the mine (${colorScheme})`,
        ).toBeGreaterThan(0.1);
      }
    });
  }
}

// --- AC3 --------------------------------------------------------------------------------------

test.describe('no replay', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await choose3d(page);
  });

  for (const end of ['loss', 'win'] as const) {
    test(`AC3: switching to 3D after a ${end} shows the static final board without an effect, whether the game ended in 3D or in 2D`, async ({
      page,
    }) => {
      const prepare = end === 'loss' ? prepareLoss : prepareWin;
      const finish = end === 'loss' ? loseNow : winNow;
      const limit = end === 'loss' ? LOSS_LIMIT_MS : WIN_LIMIT_MS;

      // Ended in 3D: the end-of-effect frame is the reference.
      await prepare(page);
      await hold(page, true);
      await finish(page);
      await advance(page, 300);
      expect((await fxState(page)).running, 'the effect plays in 3D').toBe(true);
      await advance(page, limit - 300);
      const reference = await frameAfter(page, 0);
      expect(await fxState(page)).toEqual(IDLE);

      // 3D -> 2D -> 3D: nothing plays, the board is the same picture.
      await radio2d(page).check();
      await choose3d(page);
      await hold(page, true);
      expect(await fxState(page), 'no replay after 2D -> 3D').toEqual(IDLE);
      expect(await frameAfter(page, 0)).toBe(reference);
      expect(await frameAfter(page, limit)).toBe(reference);

      // Ended in 2D: the same moves in the 2D view, then 3D.
      await radio2d(page).check();
      await prepare(page);
      await finish(page);
      await expect(page.getByText(end === 'loss' ? LOST : WON)).toBeVisible();
      await choose3d(page);
      await hold(page, true);
      expect(await fxState(page), 'no effect for a game that ended in 2D').toEqual(IDLE);
      expect(await frameAfter(page, 0), 'the static final board').toBe(reference);
      expect(await frameAfter(page, limit)).toBe(reference);
    });
  }
});

// --- the real loop (no probe pause): slow frames, a blocked main thread, a hidden tab ---------

// The probe tests above stand still on purpose; they cannot show that an effect survives the real
// loop. On software WebGL the first effect frame takes several hundred ms, and a rule that cut an
// effect after a frame gap once made it vanish after ~570 ms. These tests run on the real clock.
test.describe('real loop', () => {
  // Wall-clock timing on software WebGL: under the load of the other workers a frame can stall for
  // seconds. A real regression (an effect cut short) fails every attempt.
  test.describe.configure({ retries: 2 });

  /** Chooses "3D" and leaves the scene running on the real clock (the sway loop is on). */
  async function choose3dLive(page: Page) {
    await radio3d(page).check();
    await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
    await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => (window as TestWindow).__board3dProbe !== undefined))
      .toBe(true);
  }

  /** The sway moves the cells, so Playwright clicks never see them stable: use the keyboard. */
  async function press(page: Page, row: number, col: number) {
    await cell(page, row, col).focus();
    await page.keyboard.press('Enter');
  }

  /**
   * Starts the loss layout, opens (9,5), reveals the mine and returns the page time at which the
   * message appeared. A mutation observer takes it in the commit that also starts the effect, so
   * the effect is at least this old at any later time (the test machine can stall for a second
   * between the key press and anything Playwright sees).
   */
  async function loseTimed(page: Page) {
    await startFixed(page, 9, 9, LOSS);
    await press(page, 9, 5);
    await page.evaluate(() => (window as TestWindow).__board3dProbe?.holdSway(true));
    await page.evaluate(() => {
      const w = window as Window & { __lostAt?: number };
      delete w.__lostAt;
      const observer = new MutationObserver(() => {
        if (document.body.textContent?.includes('You lost.')) {
          w.__lostAt = performance.now();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    await press(page, ...LOSS_CLICK);
    await expect(page.getByText(LOST)).toBeVisible();
    return page.evaluate(() => {
      const at = (window as Window & { __lostAt?: number }).__lostAt;
      if (at === undefined) throw new Error('the message was not observed');
      return at;
    });
  }

  const sinceClick = (page: Page, t0: number) => page.evaluate((t) => performance.now() - t, t0);
  const running = async (page: Page) => (await fxState(page)).running;

  /** The first end of a game pays one-time costs (slow frames): play one and let it finish. */
  async function warmUp(page: Page) {
    await loseTimed(page);
    await expect.poll(() => running(page), { timeout: 10_000 }).toBe(false);
  }

  test('AC1: on the real clock the explosion survives the slow first frames, is drawn, and ends by itself', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 }); // smaller canvas: faster software frames
    await page.emulateMedia({ colorScheme: 'dark' });
    await openGame(page);
    await choose3dLive(page);
    test.setTimeout(90_000);
    await warmUp(page);
    const t0 = await loseTimed(page);

    // Watch the effect state on the real clock until it ends (5 s at the latest, more on software WebGL). One luminance read of the mine's
    // surroundings (1.2 cells around it) is taken at the first frame after 0.4 s, while it runs:
    // the marker is settled by then, so smoke and the rest of the effect are what differs from
    // the final board. (A read renders a frame, which is slow on software WebGL: only one.)
    const seen = await page.evaluate(
      async ([start, mineIndex, limit]) => {
        const probe = (window as TestWindow).__board3dProbe;
        if (!probe) throw new Error('no probe');
        const states: { t: number; running: boolean; particles: number }[] = [];
        let during: { t: number; lum: number } | null = null;
        const area = (): Rect => {
          const el = document.querySelector(`[data-index="${mineIndex}"]`);
          if (!el) throw new Error('no cell');
          const r = el.getBoundingClientRect().width * 1.2;
          const c = probe.project(Number(mineIndex));
          return { x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r };
        };
        for (;;) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const t = performance.now() - Number(start);
          if (t > Number(limit)) break;
          const fx = probe.fxState;
          states.push({ t, running: fx.running, particles: fx.particles });
          if (!fx.running && t > 800) break;
          if (during === null && t >= 400 && fx.running)
            during = { t, lum: probe.luminance(area()) };
        }
        return { states, during, final: probe.luminance(area()) };
      },
      [t0, index(9, ...LOSS_CLICK), WATCH_MS] as const,
    );
    const last = seen.states.at(-1);
    expect(last?.running, 'ends by itself').toBe(false);
    expect(last?.particles).toBe(0);
    // The end can be hidden by at most the frame that first saw `running === false` (the gap before
    // it) plus one frame, because `fxState.running` can be one frame stale (the gap before that):
    // the first idle frame is at most the AC's 2.5 s plus those two gaps plus a margin. Gaps earlier
    // in the run (e.g. the first one, which includes the evaluate round trip) do not count.
    // (Runner: single gaps up to 6.6 s.)
    const idleAt = seen.states.findIndex((s) => !s.running);
    const gapBefore = (i: number) =>
      (seen.states[i]?.t ?? 0) - (i > 0 ? (seen.states[i - 1]?.t ?? 0) : 0);
    expect(
      seen.states[idleAt]?.t,
      'and not later than the AC limit plus the two frame gaps before the end',
    ).toBeLessThanOrEqual(
      LOSS_LIMIT_MS +
        gapBefore(idleAt) +
        (idleAt > 0 ? gapBefore(idleAt - 1) : 0) +
        FRAME_MARGIN_MS,
    );
    // Not cut short: the first frame that sees it ended is at or after its own end (2.2 s; the
    // bug this guards against ended it after ~0.57 s), and it was seen running before.
    const firstIdle = seen.states.find((s) => !s.running);
    expect(seen.states[0]?.running, 'running at the first frame').toBe(true);
    expect(
      firstIdle?.t ?? 0,
      'the explosion is not cut short by slow first frames (it lasts 2.2 s)',
    ).toBeGreaterThanOrEqual(2000);
    expect(seen.during, 'a frame was read while it ran').not.toBeNull();
    expect(
      seen.during?.lum ?? 0,
      'the effect changes what is drawn around the mine',
    ).toBeGreaterThan(seen.final * 1.1);
  });

  test('AC1: on the real clock a blocked main thread does not end the explosion, a hidden tab and a scheme change end it at once', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 375, height: 800 });
    await openGame(page);
    await choose3dLive(page);
    await warmUp(page);
    const limit = 2000; // the explosion lasts 2.2 s: any check later than this proves nothing

    // 1. A main-thread block of 400 ms in the middle of the effect: it goes on (a frame gap is not a
    // reason to end it: effects are closed-form in the scene time).
    let t0 = await loseTimed(page);
    expect(await running(page)).toBe(true);
    const afterBlock = await page.evaluate(async () => {
      const probe = (window as TestWindow).__board3dProbe;
      if (!probe) throw new Error('no probe');
      const until = performance.now() + 400;
      while (performance.now() < until); // block
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return probe.fxState.running;
    });
    expect(await sinceClick(page, t0), 'still inside the effect after the block').toBeLessThan(
      limit,
    );
    expect(afterBlock, 'the explosion survives a 400 ms main-thread block').toBe(true);
    await expect.poll(() => running(page), { timeout: 10_000 }).toBe(false); // and ends by itself

    // 2. A hidden tab ends it at once (so it never replays on return): visibilitychange with
    // document.hidden true.
    t0 = await loseTimed(page);
    expect(await running(page)).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const hidden = await fxState(page);
    expect(await sinceClick(page, t0), 'still inside the effect when hidden').toBeLessThan(limit);
    expect(hidden, 'a hidden tab ends the effect at once').toMatchObject({
      running: false,
      particles: 0,
      animating: 0,
    });
    await page.evaluate(() => Reflect.deleteProperty(document, 'hidden'));

    // 3. A colour-scheme change ends it at once, and the board is static in the new scheme.
    t0 = await loseTimed(page);
    expect(await running(page)).toBe(true);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => running(page), { timeout: 1500 }).toBe(false);
    expect(await sinceClick(page, t0), 'ended before its own end').toBeLessThan(limit);
    expect(await fxState(page)).toMatchObject({ particles: 0, animating: 0 });
  });
});

// --- AC4 --------------------------------------------------------------------------------------

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openGame(page);
    await choose3d(page);
  });

  test('AC4: with reduced motion a loss and a win show the static final board at once, and the two are clearly different', async ({
    page,
  }) => {
    // Lost: no effect state at all, the picture right after the click is the final one.
    await prepareLoss(page);
    await loseNow(page);
    await expect(page.getByText(LOST)).toBeVisible();
    expect(await fxState(page), 'no effect under reduced motion').toEqual(IDLE);
    const lost = await frameAfter(page, 0);
    expect(await frameAfter(page, 3000), 'static right after the click').toBe(lost);
    expect(
      (await paint(page, DANGER, 0, 24, index(9, ...LOSS_CLICK))).count,
      'the red disc of the exploded mine',
    ).toBeGreaterThan(200);
    const lostNames = await grid(page).ariaSnapshot();
    expect(lostNames).toContain('exploded mine');
    expect(lostNames).toContain('Row 4, column 4, mine');
    expect(lostNames).toContain('wrong flag, no mine here');
    expect(await cell(page, 1, 1).getAttribute('aria-label')).toContain('flagged'); // a right flag stays

    // Won: all mines flagged, counter 0.
    await startFixed(page, 9, 9, WIN);
    await cell(page, 9, 9).click();
    await page.mouse.move(0, 0);
    await winNow(page);
    await expect(page.getByText(WON)).toBeVisible();
    await expect(counter(page)).toHaveText('Mines left: 0');
    expect(await fxState(page), 'no celebration under reduced motion').toEqual(IDLE);
    const won = await frameAfter(page, 0);
    expect(await frameAfter(page, 4500), 'static right after the click').toBe(won);
    await expect(cell(page, 1, 1)).toHaveAccessibleName('Row 1, column 1, flagged');
    await expect(cell(page, 1, 3)).toHaveAccessibleName('Row 1, column 3, flagged');
    expect(await grid(page).ariaSnapshot()).not.toContain('exploded mine');

    // Distinguishable at a glance: the lost board has the red marker disc at the exploded cell
    // (the danger colour), the won board has nothing like it at that cell.
    const exploded = index(9, ...LOSS_CLICK);
    expect(
      (await paint(page, DANGER, 0, 24, exploded)).count,
      'danger-coloured pixels at the won board cell',
    ).toBeLessThan(10);
  });
});
