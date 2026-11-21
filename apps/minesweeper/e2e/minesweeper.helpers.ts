/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, type Page } from '@playwright/test';

// Shared helpers of the cinematic spec (story 050): sign-in, fixed mine layouts, the view radios,
// and probe wrappers. Mine layouts are written 1-based here, 0-based for the dev-only hook
// window.__minesweeperMines.

export type Pair = readonly [row: number, col: number];
export type Rect = { x: number; y: number; width: number; height: number };
export type RigState = {
  cameraMove: 'none' | 'flyIn' | 'dive' | 'orbit';
  cameraMoveMs: number;
  pose: { yaw: number; tilt: number; dolly: number; panX: number; panY: number };
  shockwave: boolean;
  fireworks: { running: boolean; bursts: number; sparks: number };
  debris: number;
  bloom: boolean;
  flashesLastSecond: number;
};
export type Fx = {
  running: boolean;
  animating: number;
  particles: number;
  shake: number;
  flash: number;
  minesPending: number;
};
export type Probe = {
  pause(): void;
  holdSway(hold: boolean): void;
  advance(ms: number): void;
  project(
    index: number,
    offset?: readonly [dx: number, dy: number, dz: number],
  ): { x: number; y: number };
  readonly renderer: string;
  readonly fxState: Fx;
  readonly rigState: RigState | null;
  luminance(rect?: Rect): number;
};
export type TestWindow = Window & { __minesweeperMines?: Pair[]; __board3dProbe?: Probe };

export const UNAVAILABLE = '3D is not available in this browser.';
export const LOST = 'You lost. You revealed a mine.';
export const WON = 'You won! Every safe cell is revealed.';

export const grid = (page: Page) => page.getByRole('grid', { name: 'Minesweeper board' });
export const counter = (page: Page) => page.getByText('Mines left:');
export const viewGroup = (page: Page) => page.getByRole('radiogroup', { name: 'View' });
export const radio = (page: Page, name: '2D' | '3D' | 'Cinematic') =>
  page.getByRole('radio', { name, exact: true });
export const startButton = (page: Page) => page.getByRole('button', { name: 'Start' });
export const cell = (page: Page, row: number, col: number) =>
  page.getByRole('gridcell', { name: new RegExp(`^Row ${row}, column ${col},`) });
export const index = (cols: number, row: number, col: number) => (row - 1) * cols + (col - 1);

// LOSS: 10 mines, 9 x 9. Revealing (9,5) opens rows 5 to 9; the mine (4,2) is then clicked.
export const LOSS: readonly Pair[] = [
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
export const LOSS_CLICK: Pair = [4, 2];
// WIN: two mines; (9,9) opens everything except the safe cell (1,2), the last one.
export const WIN: readonly Pair[] = [
  [1, 1],
  [1, 3],
];

export async function openGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

export async function startFixed(page: Page, rows: number, cols: number, mines: readonly Pair[]) {
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

/** Chooses a 3D view and waits until its scene is ready (the cinematic probe exists only while a board is attached). */
export async function chooseView(page: Page, name: '3D' | 'Cinematic') {
  await radio(page, name).check();
  await expect(viewGroup(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(UNAVAILABLE)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => (window as TestWindow).__board3dProbe !== undefined))
    .toBe(true);
}

export const pause = (page: Page) =>
  page.evaluate(() => (window as TestWindow).__board3dProbe?.pause());
export const advance = (page: Page, ms: number) =>
  page.evaluate((m) => (window as TestWindow).__board3dProbe?.advance(m), ms);
export const rig = (page: Page) =>
  page.evaluate(() => {
    const state = (window as TestWindow).__board3dProbe?.rigState;
    if (!state) throw new Error('no rigState (not a cinematic board)');
    return JSON.parse(JSON.stringify(state)) as RigState;
  });
export const fxState = (page: Page) =>
  page.evaluate(() => {
    const probe = (window as TestWindow).__board3dProbe;
    if (!probe) throw new Error('no probe');
    return { ...probe.fxState };
  });

/** Advances the scene clock by `ms` and returns the canvas as a data URL taken in the same task. */
export const grab = (page: Page, ms = 0) =>
  page.evaluate((m) => {
    const probe = (window as TestWindow).__board3dProbe;
    const canvas = document.querySelector('canvas');
    if (!probe || !canvas) throw new Error('no probe or canvas');
    probe.advance(m);
    return canvas.toDataURL();
  }, ms);

/** Pixels whose colour differs by more than `tol` (per channel of 255) between two grabs. */
export const differing = (page: Page, a: string, b: string, tol: number) =>
  page.evaluate(
    async ([x, y, t]) => {
      const load = async (url: string) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
      };
      const [p, q] = await Promise.all([load(String(x)), load(String(y))]);
      if (p.width !== q.width || p.height !== q.height) return { count: -1, total: 0 };
      let count = 0;
      for (let i = 0; i < p.data.length; i += 4) {
        const d = Math.max(
          Math.abs((p.data[i] ?? 0) - (q.data[i] ?? 0)),
          Math.abs((p.data[i + 1] ?? 0) - (q.data[i + 1] ?? 0)),
          Math.abs((p.data[i + 2] ?? 0) - (q.data[i + 2] ?? 0)),
        );
        if (d > Number(t)) count++;
      }
      return { count, total: p.width * p.height };
    },
    [a, b, tol] as const,
  );

/**
 * Luminance spread (standard deviation of 0..1 relative luminance) of a box of the current frame:
 * either a band of the canvas (fractions of its height) or the box of one overlay cell shrunk to
 * its inner 60 %. A flat colour has a spread of 0.
 */
export const spread = (
  page: Page,
  region: { band: readonly [number, number] } | { cell: number },
) =>
  page.evaluate(async (r) => {
    const canvas = document.querySelector('canvas');
    const probe = (window as TestWindow).__board3dProbe;
    if (!canvas || !probe) throw new Error('no canvas or probe');
    probe.advance(0); // renders a frame; the read must be in the same task (no preserveDrawingBuffer)
    const img = new Image();
    img.src = canvas.toDataURL();
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0);
    let x0 = 0;
    let y0: number;
    let w = c.width;
    let h: number;
    if ('band' in r) {
      y0 = Math.round(c.height * r.band[0]);
      h = Math.round(c.height * (r.band[1] - r.band[0]));
    } else {
      const el = document.querySelector(`[data-index="${r.cell}"]`);
      if (!el) throw new Error('no cell');
      const box = el.getBoundingClientRect();
      const rect = canvas.getBoundingClientRect();
      const k = c.width / rect.width;
      x0 = Math.round((box.left - rect.left + box.width * 0.2) * k);
      y0 = Math.round((box.top - rect.top + box.height * 0.2) * k);
      w = Math.round(box.width * 0.6 * k);
      h = Math.round(box.height * 0.6 * k);
    }
    const data = ctx.getImageData(x0, y0, w, h).data;
    const lin = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const values: number[] = [];
    for (let i = 0; i < data.length; i += 4)
      values.push(
        0.2126 * lin(data[i] ?? 0) +
          0.7152 * lin(data[i + 1] ?? 0) +
          0.0722 * lin(data[i + 2] ?? 0),
      );
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  }, region);

/**
 * Colour richness of the current frame: the number of distinct colours (4 bits per channel) and
 * the share of the most common one. A flat well with a few tile colours has few colours and a big
 * top share; a lit scene with a background has many and a small share.
 */
export const palette = (page: Page) =>
  page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const probe = (window as TestWindow).__board3dProbe;
    if (!canvas || !probe) throw new Error('no canvas or probe');
    probe.advance(0);
    const img = new Image();
    img.src = canvas.toDataURL();
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const buckets = new Map<number, number>();
    for (let i = 0; i < data.length; i += 4) {
      const key =
        ((data[i] ?? 0) >> 4) * 256 + ((data[i + 1] ?? 0) >> 4) * 16 + ((data[i + 2] ?? 0) >> 4);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return { colours: buckets.size, topShare: Math.max(...buckets.values()) / (data.length / 4) };
  });

// --- flash counting (WCAG 2.3.1 style) ------------------------------------------------------
//
// Definition used here (stricter than WCAG's 0.1 absolute): an opposing change is a swing of the
// luminance between two turning points of at least 10 % of the brighter of the two values; a
// flash is a pair of consecutive opposing changes (rise then fall, or fall then rise); the rate
// is the largest number of flashes completed in any window of 1 s. Turning points are found with
// a 5 % hysteresis so that sampling noise does not split one swing into small ones.

export type Sample = { t: number; v: number };
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
export function flashTimes(series: readonly Sample[], swing = SWING): number[] {
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

export function maxPerSecond(times: readonly number[]): number {
  let best = 0;
  for (const t of times) best = Math.max(best, times.filter((u) => u >= t && u < t + 1000).length);
  return best;
}

/**
 * Glyph contrast of one overlay cell in the current frame: the inner 60 % of the cell box is read and
 * the contrast ratio (WCAG formula) of its 90th against its 10th percentile of relative luminance is
 * returned. A glyph (a number, a flag, a mine) that is light or dark against its tile gives a high
 * ratio however much of the box it fills; a flat tile gives about 1.
 */
export const glyphContrast = (page: Page, cellIndex: number) =>
  page.evaluate(async (idx) => {
    const canvas = document.querySelector('canvas');
    const probe = (window as TestWindow).__board3dProbe;
    const el = document.querySelector(`[data-index="${idx}"]`);
    if (!canvas || !probe || !el) throw new Error('no canvas, probe or cell');
    probe.advance(0);
    const img = new Image();
    img.src = canvas.toDataURL();
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0);
    const box = el.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    const k = c.width / rect.width;
    const data = ctx.getImageData(
      Math.round((box.left - rect.left + box.width * 0.2) * k),
      Math.round((box.top - rect.top + box.height * 0.2) * k),
      Math.round(box.width * 0.6 * k),
      Math.round(box.height * 0.6 * k),
    ).data;
    const lin = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const lum: number[] = [];
    for (let i = 0; i < data.length; i += 4)
      lum.push(
        0.2126 * lin(data[i] ?? 0) +
          0.7152 * lin(data[i + 1] ?? 0) +
          0.0722 * lin(data[i + 2] ?? 0),
      );
    const sorted = [...lum].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
    const high = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
    return (high + 0.05) / (low + 0.05);
  }, cellIndex);

/** Mean sRGB colour (0..255 per channel) of the inner 60 % of one overlay cell in the current frame. */
export const meanColour = (page: Page, cellIndex: number) =>
  page.evaluate(async (idx) => {
    const canvas = document.querySelector('canvas');
    const probe = (window as TestWindow).__board3dProbe;
    const el = document.querySelector(`[data-index="${idx}"]`);
    if (!canvas || !probe || !el) throw new Error('no canvas, probe or cell');
    probe.advance(0);
    const img = new Image();
    img.src = canvas.toDataURL();
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0);
    const box = el.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    const k = c.width / rect.width;
    const data = ctx.getImageData(
      Math.round((box.left - rect.left + box.width * 0.2) * k),
      Math.round((box.top - rect.top + box.height * 0.2) * k),
      Math.round(box.width * 0.6 * k),
      Math.round(box.height * 0.6 * k),
    ).data;
    const sum = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      sum[0] = (sum[0] ?? 0) + (data[i] ?? 0);
      sum[1] = (sum[1] ?? 0) + (data[i + 1] ?? 0);
      sum[2] = (sum[2] ?? 0) + (data[i + 2] ?? 0);
    }
    const n = data.length / 4;
    return { r: (sum[0] ?? 0) / n, g: (sum[1] ?? 0) / n, b: (sum[2] ?? 0) / n };
  }, cellIndex);

/** Pixels that differ by more than `tol` between two grabs inside the box of one overlay cell (grown by a quarter). */
export const cropDiff = (page: Page, a: string, b: string, cellIndex: number, tol: number) =>
  page.evaluate(
    async ([x, y, idx, t]) => {
      const el = document.querySelector(`[data-index="${Number(idx)}"]`);
      const canvas = document.querySelector('canvas');
      if (!el || !canvas) throw new Error('no cell or canvas');
      const load = async (url: string) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        ctx.drawImage(img, 0, 0);
        return { ctx, w: img.width, h: img.height };
      };
      const [p, q] = await Promise.all([load(String(x)), load(String(y))]);
      const box = el.getBoundingClientRect();
      const rect = canvas.getBoundingClientRect();
      const k = p.w / rect.width;
      const x0 = Math.max(0, Math.round((box.left - rect.left - box.width / 4) * k));
      const y0 = Math.max(0, Math.round((box.top - rect.top - box.height / 4) * k));
      const w = Math.min(p.w - x0, Math.round(box.width * 1.5 * k));
      const h = Math.min(p.h - y0, Math.round(box.height * 1.5 * k));
      const dp = p.ctx.getImageData(x0, y0, w, h).data;
      const dq = q.ctx.getImageData(x0, y0, w, h).data;
      let count = 0;
      for (let i = 0; i < dp.length; i += 4) {
        const d = Math.max(
          Math.abs((dp[i] ?? 0) - (dq[i] ?? 0)),
          Math.abs((dp[i + 1] ?? 0) - (dq[i + 1] ?? 0)),
          Math.abs((dp[i + 2] ?? 0) - (dq[i + 2] ?? 0)),
        );
        if (d > Number(t)) count++;
      }
      return count;
    },
    [a, b, cellIndex, tol] as const,
  );

/** Whether `document.elementFromPoint` at the cell's centre on the overlay plane is that very cell. */
export const hitsOwnCell = (page: Page, cellIndex: number) =>
  page.evaluate((idx) => {
    const probe = (window as TestWindow).__board3dProbe;
    if (!probe) throw new Error('no probe');
    const p = probe.project(idx, [0, 0, -0.15]);
    const hit = document.elementFromPoint(p.x, p.y);
    return hit?.closest('[data-index]')?.getAttribute('data-index') === String(idx);
  }, cellIndex);

/** Red-dominant pixels (red 60 above green and blue) in the box of one overlay cell, grown by a quarter, of a grab. */
export const redIn = (page: Page, grabbed: string, cellIndex: number) =>
  page.evaluate(
    async ([url, idx]) => {
      const el = document.querySelector(`[data-index="${Number(idx)}"]`);
      const canvas = document.querySelector('canvas');
      if (!el || !canvas) throw new Error('no cell or canvas');
      const img = new Image();
      img.src = String(url);
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(img, 0, 0);
      const box = el.getBoundingClientRect();
      const rect = canvas.getBoundingClientRect();
      const k = c.width / rect.width;
      const x0 = Math.max(0, Math.round((box.left - rect.left - box.width / 4) * k));
      const y0 = Math.max(0, Math.round((box.top - rect.top - box.height / 4) * k));
      const data = ctx.getImageData(
        x0,
        y0,
        Math.min(c.width - x0, Math.round(box.width * 1.5 * k)),
        Math.min(c.height - y0, Math.round(box.height * 1.5 * k)),
      ).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 4)
        if ((data[i] ?? 0) > (data[i + 1] ?? 0) + 60 && (data[i] ?? 0) > (data[i + 2] ?? 0) + 60)
          count++;
      return count;
    },
    [grabbed, cellIndex] as const,
  );
