/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';
import {
  LOSS,
  LOSS_CLICK,
  LOST,
  UNAVAILABLE,
  WIN,
  WON,
  advance,
  cell,
  chooseView,
  counter,
  cropDiff,
  differing,
  flashTimes,
  fxState,
  glyphContrast,
  grab,
  grid,
  hitsOwnCell,
  index,
  maxPerSecond,
  meanColour,
  openGame,
  palette,
  pause,
  radio,
  redIn,
  rig,
  spread,
  startButton,
  startFixed,
  viewGroup,
  type Pair,
  type RigState,
  type TestWindow,
} from './minesweeper.helpers.ts';

// Story 050 – the cinematic view. Time is the scene clock of the dev-only probe (`pause()`,
// `advance(ms)`), never wall-clock; the board renders on software WebGL on every machine. The
// probe's `rigState` and `fxState` prove the plan and the limits of the ACs, rendered pixels
// (frame differences, colour richness, glyph contrast) prove that something is really drawn.
// AC8 (frame rate on hak's Mac) is the script scripts/measure-fps.mjs with --view=cinematic, headed,
// not in CI. Probe: `window.__board3dProbe` exists only while a board of the chosen 3D view is
// attached, so the view is chosen first and Start follows.
//
// Measured noise (software WebGL, this machine, story 050 test run): two grabs of the same scene
// time differ in 0 pixels at tolerance 0; the tolerance 8 below only leaves room for the rounded
// edges that an unpaused re-render may change. Idle camera motion over 3 s changed 39 695 of
// 273 350 pixels (14 %), so "static" assertions use the same scene time or reduced motion.

const IDLE = {
  running: false,
  animating: 0,
  particles: 0,
  shake: 0,
  flash: 0,
  minesPending: 0,
};
const TOL = 8;
// Hard limits of the ACs (the only numbers asserted).
const FLY_IN_LIMIT_MS = 2000;
const ANIMATION_LIMIT_MS = 600;
const END_LIMIT_MS = 4000;
const FLASHES_PER_SECOND = 3;
const REST_POSE = { yaw: 0, dolly: 0, panX: 0, panY: 0 };

test.use({ viewport: { width: 1280, height: 1300 } });

const problems = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  test.setTimeout(120_000); // software WebGL: about 190 ms per rendered frame
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

/** Chooses "Cinematic" with no board yet: waits for the lazy chunk (the probe needs a board). */
async function chooseCinematicEarly(page: Page) {
  await radio(page, 'Cinematic').check();
  await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
}

/**
 * Start (with the chosen cinematic view): waits for the probe, freezes the scene clock at once. With the browser clock paused the fly-in cannot run before.
 */
async function startCinematic(page: Page, mines: readonly Pair[], expectFlyIn = true, size = 9) {
  await startFixed(page, size, size, mines);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const w = window as TestWindow;
        // A restart keeps the scene (and its probe); only the first Start creates one.
        return w.__board3dProbe !== undefined;
      }),
    )
    .toBe(true);
  await pause(page);
  // A restart on a scene whose clock was advanced by the probe starts the move at the page clock:
  // its time is negative by the advanced amount (probe offset, not visible to a player). Catch up.
  const offset = (await rig(page)).cameraMoveMs;
  if (offset < 0) await advance(page, -offset);
  if (expectFlyIn) expect((await rig(page)).cameraMove).toBe('flyIn');
  // Also a 30 x 30 board: scrolled into view, its flags must not leave an animation running (O1).
  await grid(page).scrollIntoViewIfNeeded();
}

const T0 = new Date('2026-01-01T10:00:00Z');
/** Install before the first goto; the browser clock then stands still (rAF and timers), so only the probe moves time. */
const installClock = (page: Page) => page.clock.install({ time: T0 });
const freezeClock = (page: Page) => page.clock.pauseAt(new Date(T0.getTime() + 60_000));

/** The fly-in is over and the pose is at rest. */
async function settle(page: Page) {
  await advance(page, FLY_IN_LIMIT_MS);
  expect((await rig(page)).cameraMove).toBe('none');
}

const hidden = (page: Page, row: number, col: number) =>
  expect(cell(page, row, col)).toHaveAccessibleName(
    new RegExp(`^Row ${row}, column ${col}, hidden`),
  );
const nameOf = (page: Page, row: number, col: number) =>
  cell(page, row, col).getAttribute('aria-label');

// --- AC1 -------------------------------------------------------------------------------------

test.describe('view choice', () => {
  test('AC1: "View" offers 2D, 3D and Cinematic, switching keeps the game, a reload shows 2D', async ({
    page,
  }) => {
    await openGame(page);
    await expect(viewGroup(page).getByRole('radio')).toHaveCount(3);
    for (const name of ['2D', '3D', 'Cinematic'] as const)
      await expect(radio(page, name)).toBeVisible();
    await expect(radio(page, '2D')).toBeChecked();
    await startFixed(page, 9, 9, LOSS);
    await cell(page, 9, 5).click();
    await cell(page, 3, 3).click({ button: 'right' });
    await cell(page, 6, 6).focus();
    const names = await grid(page).ariaSnapshot();
    const mines = await counter(page).textContent();
    expect(names).toContain('Row 3, column 3, flagged');
    expect(names).toContain('Row 9, column 5, empty');

    const rigOf = () =>
      page.evaluate(() => {
        const probe = (window as TestWindow).__board3dProbe;
        return probe ? probe.rigState !== null : null;
      });
    await chooseView(page, '3D');
    expect(await rigOf(), 'the 3D scene has no cinematic state').toBe(false);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await grid(page).ariaSnapshot(), 'same game in 3D').toBe(names);
    await chooseView(page, 'Cinematic');
    await expect.poll(rigOf, { message: 'the cinematic scene is attached' }).toBe(true);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await grid(page).ariaSnapshot(), 'same game in Cinematic').toBe(names);
    expect(await counter(page).textContent()).toBe(mines);
    await radio(page, '2D').check();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await grid(page).ariaSnapshot(), 'same game back in 2D').toBe(names);

    await radio(page, 'Cinematic').check();
    await expect(radio(page, 'Cinematic')).toBeChecked();
    await page.reload();
    await page.getByRole('button', { name: 'Sign in as guest' }).click();
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expect(radio(page, '2D')).toBeChecked();
    await expect(radio(page, 'Cinematic')).not.toBeChecked();
  });

  test('AC1: without WebGL2 "Cinematic" is unavailable with the notice of "3D" and 2D plays', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, 'WebGL2RenderingContext');
    });
    await openGame(page);
    for (const name of ['3D', 'Cinematic'] as const) {
      await expect(radio(page, name)).toBeDisabled();
      await expect(radio(page, name)).toHaveAccessibleDescription(UNAVAILABLE);
    }
    await expect(page.getByText(UNAVAILABLE, { exact: true })).toHaveCount(1);
    await expect(radio(page, '2D')).toBeChecked();
    await startFixed(page, 9, 9, LOSS);
    await cell(page, 9, 5).click();
    await expect(cell(page, 9, 5)).toHaveAccessibleName('Row 9, column 5, empty');
  });
});

// --- AC2 -------------------------------------------------------------------------------------

for (const colorScheme of ['light', 'dark'] as const) {
  test(`AC2: the cinematic board has a lit background scene and richer colours than the 3D board, glyphs stay readable (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openGame(page);
    const stats: Record<string, { colours: number; topShare: number }> = {};
    for (const view of ['3D', 'Cinematic'] as const) {
      await radio(page, view).check();
      await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
      await startFixed(page, 9, 9, LOSS);
      await expect
        .poll(() =>
          page.evaluate(() => (window as TestWindow).__board3dProbe?.rigState !== undefined),
        )
        .toBe(true);
      await pause(page);
      if (view === '3D')
        await page.evaluate(() => (window as TestWindow).__board3dProbe?.holdSway(true));
      await advance(page, 2500);
      await cell(page, 9, 5).click({ force: true });
      await cell(page, 3, 3).click({ button: 'right', force: true });
      await advance(page, 3000);
      stats[view] = await palette(page);
    }
    const flat = stats['3D'];
    const lit = stats['Cinematic'];
    if (!flat || !lit) throw new Error('no stats');
    // Measured (light / dark): 3D 113 / 88 colours, top share 0.29 / 0.27; Cinematic 466 / 539, 0.17 / 0.12.
    expect(lit.colours, 'distinct colours: cinematic vs 3D').toBeGreaterThan(flat.colours * 2);
    expect(lit.colours).toBeGreaterThan(250);
    expect(lit.topShare, 'no flat colour dominates the cinematic frame').toBeLessThan(0.2);
    expect(lit.topShare).toBeLessThan(flat.topShare);
    // The top of the frame is the painted sky with hills, sun or moon, not a flat colour (round 3
    // measured 0.10 in light and in dark; the bokeh wall of round 2 0.13).
    expect(await spread(page, { band: [0.02, 0.12] }), 'background scene').toBeGreaterThan(0.05);

    const grass = await meanColour(page, index(9, 3, 1));
    const earth = await meanColour(page, index(9, 7, 4));
    // The diorama (round 3): covered cells are grass (green leads), dug cells are earth (red leads).
    // Measured mean colours (light / dark): grass 103,119,19 / 47,97,72; earth 104,52,13 / 72,42,40.
    expect(grass.g, `grass: green over red (${colorScheme})`).toBeGreaterThan(grass.r * 1.1);
    expect(grass.g, `grass: green over blue (${colorScheme})`).toBeGreaterThan(grass.b * 1.1);
    expect(earth.r, `earth: red over green (${colorScheme})`).toBeGreaterThan(earth.g * 1.1);
    expect(earth.r, `earth: red over blue (${colorScheme})`).toBeGreaterThan(earth.b * 1.1);

    // Numbers, a flag and (after the loss) the mines read against their tile: contrast >= 3, and the
    // empty open cell is the control that has no glyph (non-vacuity of the measure).
    const empty = await glyphContrast(page, index(9, 7, 4));
    for (const [what, row, col] of [
      ['number 1', 5, 1],
      ['number 2', 5, 3],
      ['flag', 3, 3],
    ] as const) {
      const c = await glyphContrast(page, index(9, row, col));
      expect(c, `${what} contrast (${colorScheme})`).toBeGreaterThanOrEqual(3);
      expect(c, `${what} stands out from an empty cell`).toBeGreaterThan(empty * 1.5);
    }
    await cell(page, ...LOSS_CLICK).click({ force: true });
    await advance(page, 5000);
    await expect(page.getByText(LOST)).toBeVisible();
    for (const [what, row, col] of [
      ['exploded mine', ...LOSS_CLICK],
      ['mine', 4, 4],
      ['mine', 2, 7],
    ] as const) {
      expect(
        await glyphContrast(page, index(9, row, col)),
        `${what} contrast (${colorScheme})`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
}

// --- AC3 -------------------------------------------------------------------------------------

test.describe('camera', () => {
  test('AC3: the camera flies in on Start, stands still during play, dives to the exploded mine and circles on a win; every move ends and the cells stay hittable', async ({
    page,
  }) => {
    await installClock(page);
    await openGame(page);
    await chooseCinematicEarly(page);
    await freezeClock(page);
    await startCinematic(page, LOSS);

    // Fly-in: starts at once, differs from the rest picture, ends within 2 s.
    const start = await rig(page);
    expect(start.cameraMoveMs).toBeLessThan(500);
    const first = await grab(page, 0);
    expect(
      (await differing(page, first, await grab(page, 0), 0)).count,
      'same scene time, same frame',
    ).toBe(0);
    await advance(page, 300);
    const mid = await rig(page);
    const flying = await grab(page, 0);
    expect(mid.cameraMove).toBe('flyIn');
    expect(mid.pose, 'the camera is off its rest pose').not.toMatchObject(REST_POSE);
    // Hit test during the fly-in: the centre of each cell on the overlay plane is that cell.
    for (const [r, c] of [
      [1, 1],
      [1, 9],
      [5, 5],
      [9, 1],
      [9, 9],
    ] as const)
      expect(await hitsOwnCell(page, index(9, r, c)), `cell ${r},${c} mid fly-in`).toBe(true);
    // A click during the fly-in reveals the cell under the pointer, and no neighbour.
    const p = await page.evaluate(
      (i) => {
        const probe = (window as TestWindow).__board3dProbe;
        if (!probe) throw new Error('no probe');
        return probe.project(i, [0, 0, -0.15]);
      },
      index(9, 4, 5),
    );
    await page.mouse.click(p.x, p.y);
    await expect(cell(page, 4, 5)).not.toHaveAccessibleName(/hidden/);
    for (const [r, c] of [
      [4, 4],
      [4, 6],
      [3, 5],
      [5, 5],
    ] as const)
      await hidden(page, r, c);
    // The reveal moves no camera (round 3): the fly-in runs on and ends by itself; the pose is rest.
    expect((await rig(page)).cameraMove).toBe('flyIn');
    await advance(page, FLY_IN_LIMIT_MS);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
    const rest = await grab(page, 0);
    // The fly-in blends in from rest over its first 160 ms, so the picture 300 ms in is the far one.
    expect(
      (await differing(page, flying, rest, TOL)).count,
      'fly-in picture vs rest picture',
    ).toBeGreaterThan(5000);

    // A fresh game: the fly-in is still running after 1 s and ends on its own within 2 s.
    await startCinematic(page, LOSS);
    await advance(page, 1000);
    expect((await rig(page)).cameraMove).toBe('flyIn');
    await advance(page, FLY_IN_LIMIT_MS - 1000);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });

    // During play the camera stands still: a reveal, a flag and an unflag move nothing, at any time
    // after the click (round 3: hak found the follow move annoying).
    await cell(page, 9, 5).click({ force: true });
    for (const t of [0, 100, 300, 600, 1200]) {
      await advance(page, t === 0 ? 0 : t);
      expect(await rig(page), `still ${t} ms after a reveal`).toMatchObject({
        cameraMove: 'none',
        pose: REST_POSE,
      });
    }
    const standing = await rig(page);
    await cell(page, 3, 3).click({ button: 'right', force: true });
    await advance(page, 300);
    await cell(page, 3, 3).click({ button: 'right', force: true });
    await advance(page, 300);
    expect((await rig(page)).pose, 'a flag moves no camera').toEqual(standing.pose);
    expect(await hitsOwnCell(page, index(9, 3, 3))).toBe(true);
    // Keyboard acts on the focused cell.
    await cell(page, 2, 2).focus();
    await page.keyboard.press('Enter');
    await expect(cell(page, 2, 2)).not.toHaveAccessibleName(/hidden/);
    await cell(page, 2, 4).focus();
    await page.keyboard.press('f');
    await expect(cell(page, 2, 4)).toHaveAccessibleName('Row 2, column 4, flagged');
    await advance(page, FLY_IN_LIMIT_MS);
    expect((await rig(page)).cameraMove).toBe('none');

    // Loss: the camera moves towards the exploded mine (its distance from the canvas centre
    // shrinks although the dolly also zooms in), samples are hittable, the dive ends.
    const distance = (at = index(9, ...LOSS_CLICK)) =>
      page.evaluate((i) => {
        const probe = (window as TestWindow).__board3dProbe;
        const canvas = document.querySelector('canvas');
        if (!probe || !canvas) throw new Error('no probe or canvas');
        const q = probe.project(i, [0, 0, -0.15]);
        const r = canvas.getBoundingClientRect();
        return Math.hypot(q.x - (r.left + r.width / 2), q.y - (r.top + r.height / 2));
      }, at);
    const before = await distance();
    // A cell that keeps its height through the loss (the mine's own top moves when it is dug up).
    const steady = index(9, 9, 5);
    const steadyBefore = await distance(steady);
    const quiet = await grab(page, 0);
    await cell(page, ...LOSS_CLICK).click({ force: true });
    expect((await rig(page)).cameraMove).toBe('dive');
    await advance(page, 1200);
    expect(await distance(), 'towards the exploded mine (px from the centre)').toBeLessThan(
      before - 5,
    );
    for (const [r, c] of [
      [1, 1],
      [9, 9],
      [5, 5],
    ] as const)
      expect(await hitsOwnCell(page, index(9, r, c)), `cell ${r},${c} during the dive`).toBe(true);
    const dive = await grab(page, 0);
    expect((await differing(page, quiet, dive, TOL)).count, 'dive picture').toBeGreaterThan(5000);
    await advance(page, 1300);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
    expect(Math.abs((await distance(steady)) - steadyBefore), 'back at rest').toBeLessThan(2);

    // Win: it circles (a total yaw sweep of 90 degrees or more), samples are hittable, the orbit ends.
    await startCinematic(page, WIN);
    await settle(page);
    await cell(page, 9, 9).click({ force: true });
    await advance(page, FLY_IN_LIMIT_MS);
    await cell(page, 1, 2).click({ force: true });
    await expect(page.getByText(WON)).toBeVisible();
    expect((await rig(page)).cameraMove).toBe('orbit');
    const yaws: number[] = [];
    for (let t = 0; t < 3000; t += 250) {
      await advance(page, 250);
      yaws.push((await rig(page)).pose.yaw);
      if (t % 1000 === 0)
        expect(await hitsOwnCell(page, index(9, 5, 5)), `centre cell in the orbit at ${t} ms`).toBe(
          true,
        );
    }
    // O2 (orchestrator, 2026-11-21): the orbit sweeps at least 90 degrees of yaw in total.
    const sweep = yaws.reduce((sum, yaw, i) => sum + Math.abs(yaw - (yaws[i - 1] ?? 0)), 0);
    expect(sweep, 'total yaw sweep of the orbit').toBeGreaterThanOrEqual(90);
    await advance(page, 1500);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
  });
});

// --- AC4 -------------------------------------------------------------------------------------

test.describe('tile and flag animations', () => {
  test('AC4: reveal flips tiles in a wave, a flag is planted and removed, each within 600 ms, the final state is there at once', async ({
    page,
  }) => {
    await installClock(page);
    await openGame(page);
    await chooseCinematicEarly(page);
    await freezeClock(page);
    await startCinematic(page, LOSS);
    await settle(page);

    // Reveal: the final state is in the DOM at once (before any scene time passes).
    const before = await grab(page, 0);
    await cell(page, 9, 5).click({ force: true });
    await expect(cell(page, 9, 5)).toHaveAccessibleName('Row 9, column 5, empty');
    await expect(cell(page, 5, 1)).toHaveAccessibleName(/^Row 5, column 1, 1 mine nearby/);
    await expect(counter(page)).toHaveText('Mines left: 10');
    // The wave: tiles are animating, the count falls in several steps, and none is left at 600 ms.
    const frames = [await grab(page, 0)];
    const counts: number[] = [(await fxState(page)).animating];
    const near = index(9, 9, 4); // next to the click
    const far = index(9, 5, 9); // four rows and four columns away
    let early: string | undefined;
    for (let t = 20; t <= ANIMATION_LIMIT_MS + 100; t += 20) {
      const f = await grab(page, 20);
      if (t === 120) early = f;
      counts.push((await fxState(page)).animating);
      if (t % 100 === 0) frames.push(f);
    }
    expect(counts[0], 'tiles animate right after the click').toBeGreaterThan(0);
    const lastBusy = counts.findLastIndex((n) => n > 0) * 20 + 20;
    expect(lastBusy, 'the reveal ends within 600 ms').toBeLessThanOrEqual(ANIMATION_LIMIT_MS);
    expect(new Set(counts).size, 'tiles finish one after another').toBeGreaterThanOrEqual(3);
    // Frames: the click picture differs from the middle of the wave and from the end.
    const end = frames.at(-1) ?? '';
    expect((await differing(page, before, frames[0] ?? '', TOL)).count).toBeLessThan(50);
    expect(
      (await differing(page, frames[0] ?? '', end, TOL)).count,
      'start vs end',
    ).toBeGreaterThan(5000);
    expect(
      (await differing(page, frames[3] ?? '', end, TOL)).count,
      'mid-wave vs end',
    ).toBeGreaterThan(1000);
    // Outward: 120 ms in, the tile next to the click has changed much more than the far one.
    const first = frames[0] ?? '';
    const nearChange = await cropDiff(page, first, early ?? '', near, TOL);
    const farChange = await cropDiff(page, first, early ?? '', far, TOL);
    expect(nearChange, 'the near tile moved at 120 ms').toBeGreaterThan(farChange + 100);

    // Flag: planted within 600 ms, a red-ish flag appears in its cell; unflag: the flag goes.
    await advance(page, 1500);
    const bare = await grab(page, 0);
    await cell(page, 3, 3).click({ button: 'right', force: true });
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, flagged');
    await expect(counter(page)).toHaveText('Mines left: 9');
    expect((await fxState(page)).animating, 'the flag animates').toBeGreaterThan(0);
    const planted: string[] = [];
    let busyUntil = 0;
    for (let t = 20; t <= ANIMATION_LIMIT_MS + 100; t += 20) {
      planted.push(await grab(page, 20));
      if ((await fxState(page)).animating > 0) busyUntil = t + 20;
    }
    expect(busyUntil, 'the flag settles within 600 ms').toBeLessThanOrEqual(ANIMATION_LIMIT_MS);
    const flagged = planted.at(-1) ?? '';
    expect(
      await cropDiff(page, bare, flagged, index(9, 3, 3), TOL),
      'a flag is drawn',
    ).toBeGreaterThan(100);
    await cell(page, 3, 3).click({ button: 'right', force: true });
    await expect(cell(page, 3, 3)).toHaveAccessibleName('Row 3, column 3, hidden');
    expect((await fxState(page)).animating, 'the removed flag animates').toBeGreaterThan(0);
    let gone = 0;
    for (let t = 20; t <= ANIMATION_LIMIT_MS + 100; t += 20) {
      await advance(page, 20);
      if ((await fxState(page)).animating > 0) gone = t + 20;
    }
    expect(gone, 'the flag is gone within 600 ms').toBeLessThanOrEqual(ANIMATION_LIMIT_MS);
    const removed = await grab(page, 0);
    expect(
      await cropDiff(page, flagged, removed, index(9, 3, 3), TOL),
      'the flag disappeared from the picture',
    ).toBeGreaterThan(100);
    // The flag has a red-dominant picture that is there when planted and gone when removed.
    const flagCell = index(9, 3, 3);
    expect(await redIn(page, bare, flagCell), 'no red on the bare tile').toBeLessThan(5);
    expect(await redIn(page, flagged, flagCell), 'a red flag').toBeGreaterThan(30);
    expect(await redIn(page, removed, flagCell), 'the flag is gone').toBeLessThan(5);
  });
});

test.describe('reveal wave on a large board', () => {
  test('AC4: the reveal wave of a 30 x 30 board opened from a corner still ends within 600 ms', async ({
    page,
  }) => {
    await installClock(page);
    await openGame(page);
    await chooseCinematicEarly(page);
    await freezeClock(page);
    // One mine in the far corner: revealing the opposite corner opens nearly the whole board, so the
    // wave has its longest distance (the step per cell, not the 9 x 9 cap, then sets the duration).
    await startCinematic(page, [[1, 1]], true, 30);
    await settle(page);
    await cell(page, 30, 30).click({ force: true });
    const counts: number[] = [(await fxState(page)).animating];
    for (let t = 50; t <= ANIMATION_LIMIT_MS + 150; t += 50) {
      await advance(page, 50);
      counts.push((await fxState(page)).animating);
    }
    expect(counts[0], 'hundreds of tiles animate').toBeGreaterThan(300);
    const lastBusy = counts.findLastIndex((n) => n > 0) * 50 + 50;
    expect(lastBusy, 'the wave ends within 600 ms').toBeLessThanOrEqual(ANIMATION_LIMIT_MS);
  });
});

// --- AC5 -------------------------------------------------------------------------------------

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`end effects (${colorScheme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await installClock(page);
      await openGame(page);
      await chooseCinematicEarly(page);
      await freezeClock(page);
    });

    test(`AC5: a loss shows message and stopped timer at once, plays shockwave, debris and a chain of mines that is drawn, flashes at most 3 times a second, ends within 4 s without looping, and Start stops it (${colorScheme})`, async ({
      page,
    }) => {
      await startCinematic(page, LOSS);
      await settle(page);
      await cell(page, 3, 3).click({ button: 'right', force: true }); // a wrong flag
      await cell(page, 9, 5).click({ force: true });
      await advance(page, 2000);
      await page.clock.runFor(3000);
      await expect(page.getByText('Time:')).toHaveText('Time: 3');
      const quiet = await grab(page, 0);

      await cell(page, ...LOSS_CLICK).click({ force: true });
      // Message and timer are there with the scene clock at the click.
      await expect(page.getByText(LOST)).toBeVisible();
      await page.clock.runFor(5000);
      await expect(page.getByText('Time:')).toHaveText('Time: 3'); // stopped
      expect((await fxState(page)).running, 'the effect has not progressed yet').toBe(true);

      // Sample every 33 ms in the first second, every 100 ms after: counters, luminance.
      const steps = [
        ...Array.from({ length: 30 }, () => 33),
        ...Array.from({ length: 30 }, () => 100),
      ];
      const samples = await page.evaluate((list) => {
        const probe = (window as TestWindow).__board3dProbe;
        if (!probe) throw new Error('no probe');
        const centre = probe.project(4 * 9 + 1, [0, 0, 0]);
        const around = { x: centre.x - 75, y: centre.y - 75, width: 150, height: 150 };
        let t = 0;
        return list.map((dt) => {
          probe.advance(dt);
          t += dt;
          const r = probe.rigState;
          return {
            t,
            fx: { ...probe.fxState },
            rig: r && {
              shockwave: r.shockwave,
              debris: r.debris,
              flashes: r.flashesLastSecond,
              move: r.cameraMove,
            },
            whole: probe.luminance(),
            local: probe.luminance(around),
          };
        });
      }, steps);
      const rigs = samples.map((s) => s.rig);
      expect(
        rigs.some((r) => r?.shockwave),
        'a shockwave ring',
      ).toBe(true);
      expect(Math.max(...rigs.map((r) => r?.debris ?? 0)), 'debris').toBeGreaterThan(5);
      expect(
        Math.max(...samples.map((s) => s.fx.particles)),
        'smoke and fire particles',
      ).toBeGreaterThan(20);
      const pending = samples.map((s) => s.fx.minesPending);
      for (let i = 1; i < pending.length; i++)
        expect(pending[i], `pending at sample ${i}`).toBeLessThanOrEqual(pending[i - 1] ?? 0);
      expect(pending.at(-1)).toBe(0);
      expect(
        new Set(pending).size,
        'the other mines go off one after another',
      ).toBeGreaterThanOrEqual(3);
      const total = samples.at(-1)?.t ?? 0;
      expect(total).toBeLessThanOrEqual(END_LIMIT_MS);
      const end = samples.find((s) => !s.fx.running && s.rig?.move === 'none');
      expect(end?.t, 'the effect and the camera dive are over within 4 s').toBeDefined();
      expect(samples.at(-1)?.fx).toEqual(IDLE);
      expect(samples.at(-1)?.rig).toMatchObject({ shockwave: false, debris: 0 });
      // Flash rate: the probe's own count and the luminance of the frame (whole and around the mine).
      expect(Math.max(...samples.map((s) => s.rig?.flashes ?? 0))).toBeGreaterThanOrEqual(1);
      expect(Math.max(...samples.map((s) => s.rig?.flashes ?? 0))).toBeLessThanOrEqual(
        FLASHES_PER_SECOND,
      );
      for (const area of ['whole', 'local'] as const) {
        const series = samples.map((s) => ({ t: s.t, v: s[area] }));
        expect(series.every((s) => Number.isFinite(s.v))).toBe(true);
        expect(maxPerSecond(flashTimes(series)), `flashes per second, ${area}`).toBeLessThanOrEqual(
          FLASHES_PER_SECOND,
        );
      }
      const local = samples.map((s) => s.local);
      expect(
        Math.max(...local.map((v) => Math.abs(v - (local[0] ?? 0)) / Math.max(v, local[0] ?? 1))),
        'the bang is visible in the luminance around the mine',
      ).toBeGreaterThan(0.1);
      // It is drawn: the frame 180 ms in differs from the quiet board much more than the idle sway does.
      // (Re-run from the start in the next test of the second part below.)
      expect(quiet.length).toBeGreaterThan(0);
      // No loop: nothing starts again.
      await advance(page, 4000);
      expect(await fxState(page)).toEqual(IDLE);
      expect(await rig(page)).toMatchObject({ shockwave: false, debris: 0, cameraMove: 'none' });
    });

    test(`AC5: the loss picture shows the explosion, and Start or a preset behave as specified (${colorScheme})`, async ({
      page,
    }) => {
      await startCinematic(page, LOSS);
      await settle(page);
      await cell(page, 9, 5).click({ force: true });
      await advance(page, 2000);
      const quiet = await grab(page, 0);
      await cell(page, ...LOSS_CLICK).click({ force: true });
      await advance(page, 200);
      const bang = await grab(page, 0);
      expect(
        (await differing(page, quiet, bang, TOL)).count,
        'the explosion changes the picture',
      ).toBeGreaterThan(8000);
      // 006/AC2: a preset only fills the fields; the effect keeps playing.
      await page.getByRole('button', { name: 'Beginner', exact: true }).click();
      await expect(page.getByText(LOST)).toBeVisible();
      expect((await fxState(page)).running, 'a preset alone leaves the effect').toBe(true);
      expect((await rig(page)).debris).toBeGreaterThan(0);
      // Start stops everything at once: no advance needed.
      await startButton(page).click();
      await expect(page.getByText(LOST)).toHaveCount(0);
      await expect.poll(async () => (await rig(page).catch(() => null))?.cameraMove).toBe('flyIn');
      expect(await fxState(page)).toEqual(IDLE);
      expect(await rig(page)).toMatchObject({ shockwave: false, debris: 0 });
      expect((await rig(page)).fireworks).toMatchObject({ running: false, sparks: 0 });
    });

    test(`AC5: a win plays fireworks over the board, ends within 4 s without looping, flashes at most 3 times a second, and Start stops it (${colorScheme})`, async ({
      page,
    }) => {
      await startCinematic(page, WIN);
      await settle(page);
      await cell(page, 9, 9).click({ force: true });
      await advance(page, 2000);
      await page.clock.runFor(2000);
      const quiet = await grab(page, 0);
      await cell(page, 1, 2).click({ force: true });
      await expect(page.getByText(WON)).toBeVisible();
      await page.clock.runFor(5000);
      await expect(page.getByText('Time:')).toHaveText('Time: 2'); // stopped
      const steps = [
        ...Array.from({ length: 30 }, () => 33),
        ...Array.from({ length: 30 }, () => 100),
      ];
      const samples = await page.evaluate((list) => {
        const probe = (window as TestWindow).__board3dProbe;
        if (!probe) throw new Error('no probe');
        let t = 0;
        return list.map((dt) => {
          probe.advance(dt);
          t += dt;
          const r = probe.rigState as RigState;
          return {
            t,
            fireworks: { ...r.fireworks },
            flashes: r.flashesLastSecond,
            running: probe.fxState.running,
            move: r.cameraMove,
          };
        });
      }, steps);
      expect(samples.some((s) => s.fireworks.running)).toBe(true);
      expect(
        Math.max(...samples.map((s) => s.fireworks.bursts)),
        'several bursts',
      ).toBeGreaterThanOrEqual(3);
      expect(
        Math.max(...samples.map((s) => s.fireworks.sparks)),
        'sparks are drawn',
      ).toBeGreaterThan(50);
      expect(Math.max(...samples.map((s) => s.flashes))).toBeGreaterThanOrEqual(1);
      expect(Math.max(...samples.map((s) => s.flashes))).toBeLessThanOrEqual(FLASHES_PER_SECOND);
      const last = samples.at(-1);
      expect(last?.t).toBeLessThanOrEqual(END_LIMIT_MS);
      expect(last).toMatchObject({ running: false, move: 'none' });
      expect(last?.fireworks).toMatchObject({ running: false, sparks: 0 });
      expect(await grab(page, 0)).not.toBe(quiet);
      await advance(page, 4000);
      expect((await rig(page)).fireworks).toMatchObject({ running: false, sparks: 0 });

      // Start during the fireworks: a second win, cancelled directly.
      await startCinematic(page, WIN);
      await settle(page);
      await cell(page, 9, 9).click({ force: true });
      await advance(page, 2000);
      await cell(page, 1, 2).click({ force: true });
      await advance(page, 1500);
      expect((await rig(page)).fireworks.running).toBe(true);
      expect((await rig(page)).fireworks.sparks).toBeGreaterThan(0);
      await startButton(page).click();
      await expect.poll(async () => (await rig(page).catch(() => null))?.cameraMove).toBe('flyIn');
      expect((await rig(page)).fireworks).toMatchObject({ running: false, sparks: 0 });
      expect(await fxState(page)).toEqual(IDLE);
    });
  });
}

// The probe's own count (bursts and flashes started in the last second) is a plan, not a picture: the
// frame's luminance is what a viewer sees. Same rule and areas as story 010 (whole canvas, the
// 341 x 256 px window of WCAG 2.3.1, 150 px around the origin).
// The fireworks are seeded by the game and the last cell, so a second layout (mines in the bottom
// row, last cell (9,2)) shows another picture. Round 2: dark, 150 px window, 4 in one second.
const FLASH_LAYOUTS = [
  { name: '', mines: WIN, first: [9, 9] as Pair, last: [1, 2] as Pair },
  {
    name: ' (mines in the bottom row)',
    mines: [
      [9, 1],
      [9, 3],
    ] as Pair[],
    first: [1, 9] as Pair,
    last: [9, 2] as Pair,
  },
];
for (const colorScheme of ['light', 'dark'] as const)
  for (const layout of FLASH_LAYOUTS) {
    test(`AC5: the fireworks of a win flash at most 3 times in any second of the picture (${colorScheme})${layout.name}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await installClock(page);
      await openGame(page);
      await chooseCinematicEarly(page);
      await freezeClock(page);
      await startCinematic(page, layout.mines);
      await settle(page);
      await cell(page, layout.first[0], layout.first[1]).click({ force: true });
      await advance(page, 2000);
      await cell(page, layout.last[0], layout.last[1]).click({ force: true });
      await expect(page.getByText(WON)).toBeVisible();
      const steps = [
        ...Array.from({ length: 30 }, () => 33),
        ...Array.from({ length: 30 }, () => 100),
      ];
      const series = await page.evaluate(
        ([list, middle]) => {
          const probe = (window as TestWindow).__board3dProbe;
          if (!probe) throw new Error('no probe');
          const c = probe.project(Number(middle), [0, 0, 0]);
          const around = (w: number, h: number) => ({
            x: c.x - w / 2,
            y: c.y - h / 2,
            width: w,
            height: h,
          });
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
        [steps, index(9, 5, 5)] as const,
      );
      // Non-vacuity: the fireworks are visible in the luminance (a burst lifts the 150 px window).
      const local = series.map((s) => s.local);
      expect(
        Math.max(...local) / Math.min(...local),
        'the fireworks change the luminance around the board middle',
      ).toBeGreaterThan(1.05); // measured 1.09 in light, far more in dark
      for (const area of ['whole', 'wcag', 'local'] as const) {
        const s = series.map((p) => ({ t: p.t, v: p[area] }));
        expect(s.every((p) => Number.isFinite(p.v))).toBe(true);
        expect(maxPerSecond(flashTimes(s)), `flashes per second, ${area} area`).toBeLessThanOrEqual(
          FLASHES_PER_SECOND,
        );
      }
    });
  }

test.describe('ended in another view', () => {
  test('AC5: a game that ended in 2D shows the static final board in Cinematic without the effect', async ({
    page,
  }) => {
    await openGame(page);
    await chooseCinematicEarly(page);
    await radio(page, '2D').check();
    await startFixed(page, 9, 9, LOSS);
    await cell(page, 9, 5).click();
    await cell(page, ...LOSS_CLICK).click();
    await expect(page.getByText(LOST)).toBeVisible();
    await radio(page, 'Cinematic').check();
    await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
    await expect.poll(async () => (await rig(page).catch(() => null))?.cameraMove).toBeDefined();
    await pause(page);
    expect(await fxState(page)).toEqual(IDLE);
    expect(await rig(page)).toMatchObject({
      cameraMove: 'none',
      shockwave: false,
      debris: 0,
      pose: REST_POSE,
    });
    expect(await nameOf(page, ...LOSS_CLICK)).toContain('exploded mine');
    expect(
      await glyphContrast(page, index(9, ...LOSS_CLICK)),
      'the exploded mine is drawn',
    ).toBeGreaterThanOrEqual(3);
    // Nothing plays later either (the scene would show debris or fire if it did).
    await advance(page, 300);
    expect(await fxState(page)).toEqual(IDLE);
    expect((await rig(page)).debris).toBe(0);
  });
});

// --- AC6 -------------------------------------------------------------------------------------

test.describe('input and screen reader', () => {
  test('AC6: mouse, keyboard and the accessibility tree behave as in 2D, and every focused cell has a visible focus ring', async ({
    page,
  }) => {
    await installClock(page);
    await openGame(page);
    await chooseCinematicEarly(page);
    await freezeClock(page);
    const play = async () => {
      await cell(page, 9, 5).click({ force: true });
      await cell(page, 3, 3).click({ button: 'right', force: true });
      await cell(page, 2, 2).focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(cell(page, 2, 4)).toBeFocused();
      await page.keyboard.press('f');
      await page.keyboard.press('ArrowDown');
      await expect(cell(page, 3, 4)).toBeFocused();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press(' ');
      return {
        names: await grid(page).ariaSnapshot(),
        mines: await counter(page).textContent(),
        grid: await grid(page).getAttribute('aria-label'),
        focused: await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
      };
    };
    await radio(page, '2D').check();
    await startFixed(page, 9, 9, LOSS);
    const two = await play();
    expect(two.names).toContain('Row 2, column 4, flagged');
    expect(two.names).toContain('Row 9, column 5, empty');

    await radio(page, 'Cinematic').check();
    await startCinematic(page, LOSS);
    await settle(page);
    const cinematic = await play();
    expect(cinematic, 'same names, counter and focus as 2D').toEqual(two);
    expect(await grid(page).getAttribute('role')).toBe('grid');
    expect(await page.getByRole('gridcell').count()).toBe(81);

    // A visible focus on a hidden, a revealed and a flagged cell.
    for (const [row, col] of [
      [1, 1],
      [9, 5],
      [2, 4],
    ] as const) {
      await cell(page, row, col).focus();
      const ring = await cell(page, row, col).evaluate((el) => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), colour: s.outlineColor };
      });
      expect(ring.style, `outline of ${row},${col}`).not.toBe('none');
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(ring.colour).not.toBe('rgba(0, 0, 0, 0)');
    }

    // The messages: a loss is announced as in 2D.
    await cell(page, ...LOSS_CLICK).click({ force: true });
    await expect(page.getByText(LOST)).toBeVisible();
    expect(await grid(page).ariaSnapshot()).toContain('exploded mine');
  });
});

// --- AC7 -------------------------------------------------------------------------------------

test.describe('reduced motion', () => {
  test('AC7: with reduced motion there is no camera move, animation or idle motion, every change is static at once, and the look is the same', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installClock(page);
    await openGame(page);
    await chooseCinematicEarly(page);
    await freezeClock(page);
    await startCinematic(page, LOSS, false);
    await expect.poll(async () => (await rig(page).catch(() => null))?.cameraMove).toBe('none');
    // No fly-in: at rest from the first frame, and no idle motion over 3 s.
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
    const a = await grab(page, 0);
    expect(
      (await differing(page, a, await grab(page, 3000), 0)).count,
      'no idle motion (tolerance 0)',
    ).toBe(0);
    // Reveal and flag: the picture is final right after the click, nothing animates.
    await cell(page, 9, 5).click({ force: true });
    await cell(page, 3, 3).click({ button: 'right', force: true });
    expect(await fxState(page)).toEqual(IDLE);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
    const shown = await grab(page, 0);
    expect((await differing(page, a, shown, TOL)).count, 'the change is drawn').toBeGreaterThan(
      5000,
    );
    expect(
      (await differing(page, shown, await grab(page, 3000), 0)).count,
      'static after a reveal',
    ).toBe(0);
    expect(await glyphContrast(page, index(9, 3, 3)), 'the flag is drawn').toBeGreaterThanOrEqual(
      3,
    );
    // The look of AC2 is still there.
    expect((await palette(page)).colours, 'the realistic look').toBeGreaterThan(250);
    // Loss: no effect, no dive, the exploded mine is on the picture at once.
    await cell(page, ...LOSS_CLICK).click({ force: true });
    await expect(page.getByText(LOST)).toBeVisible();
    expect(await fxState(page)).toEqual(IDLE);
    expect(await rig(page)).toMatchObject({
      cameraMove: 'none',
      shockwave: false,
      debris: 0,
      pose: REST_POSE,
    });
    const lost = await grab(page, 0);
    expect(
      (await differing(page, lost, await grab(page, 5000), 0)).count,
      'static after a loss',
    ).toBe(0);
    expect(await glyphContrast(page, index(9, ...LOSS_CLICK))).toBeGreaterThanOrEqual(3);
    // Win: no fireworks, no orbit.
    await startCinematic(page, WIN, false);
    await cell(page, 9, 9).click({ force: true });
    await cell(page, 1, 2).click({ force: true });
    await expect(page.getByText(WON)).toBeVisible();
    expect(await fxState(page)).toEqual(IDLE);
    expect(await rig(page)).toMatchObject({ cameraMove: 'none', pose: REST_POSE });
    expect((await rig(page)).fireworks).toMatchObject({ running: false, sparks: 0 });
    const won = await grab(page, 0);
    expect(
      (await differing(page, won, await grab(page, 5000), 0)).count,
      'static after a win',
    ).toBe(0);

    // Control (non-vacuity): with normal motion the camera still stands (round 3) and only the cloth
    // of a flag waves, so the same idle read moves a few pixels only when a flag stands.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await startCinematic(page, LOSS);
    await settle(page);
    const c = await grab(page, 0);
    expect(
      (await differing(page, c, await grab(page, 3000), TOL)).count,
      'no idle camera motion with normal motion',
    ).toBe(0);
    await cell(page, 3, 3).click({ button: 'right', force: true });
    await advance(page, 700);
    const d = await grab(page, 0);
    expect(
      (await differing(page, d, await grab(page, 600), TOL)).count,
      'the cloth of a planted flag waves with normal motion',
    ).toBeGreaterThan(20);
  });
});
