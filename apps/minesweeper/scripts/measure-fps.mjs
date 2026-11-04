// Story 009, AC3 and story 010, AC5: frame rate and input latency of the 3D board on the
// reference machine (hak's Mac), during a cascade, the loss explosion and the win confetti.
// Headed Chromium on the real GPU; not part of `verify` or CI. Run: `npm run measure:fps`.
//
// It starts its own dev server in mode `e2e` (guest sign-in and fixed mine layouts exist only
// there; React runs its development build, so the numbers are conservative) and reads the
// dev-only scene probe for frame counts.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const PORT = 5175;
const URL = `http://localhost:${PORT}/`;
const SERVER_TIMEOUT_MS = 30_000;
const READY_TIMEOUT_MS = 15_000;
const WINDOW_MS = 500;
const SAMPLE_MS = 100;
const CASCADE_MS = 1200;
const AFTER_MS = 2000;
const LOSS_MS = 2500; // story 010 AC1 limit
const WIN_MS = 4000; // story 010 AC2 limit
const EFFECT_AFTER_MS = 1000;
/** Story 010: the probe must show an effect or cell animation this long after the click. */
const ALIVE_CHECK_MS = 150;
const INPUT_TIMEOUT_MS = 5000;
const FLOORS = { a: 50, b: 30, latency: 100 };
// `--headless` only checks that the script works (software WebGL; the renderer row then fails).
const HEADLESS = process.argv.includes('--headless');

/** 0-based [row, col] pairs. */
const A_ISOLATED = [8, 27]; // the safe cell the cascade cannot open (story 010: the win click)
const A_MINE = [10, 25]; // a hidden mine after the cascade (the loss click)
function layoutA() {
  // 16 × 30, 99 mines: columns 24–29 full except the isolated safe cell (8, 27), whose eight
  // neighbours are all mines, plus four in column 23. (0, 0) opens every other safe cell, so the
  // game keeps running (story 010 finding: 009's layout won on the first click).
  const mines = [];
  for (let row = 0; row < 16; row++) {
    for (let col = 24; col < 30; col++) {
      if (row !== A_ISOLATED[0] || col !== A_ISOLATED[1]) mines.push([row, col]);
    }
  }
  mines.push([0, 23], [1, 23], [2, 23], [3, 23]);
  return mines;
}

const B_MINE = [15, 25];
const B_SAFE_COLUMN = 29; // rows 0–11 stay safe and hidden after the cascade
function layoutB() {
  // 30 × 30, 180 mines: columns 24–28 full, column 29 from row 12 and column 23 from row 18.
  // Column 29 rows 0–11 stay safe and hidden after the cascade (every one is a number): the
  // reveal targets of the latency test.
  const mines = [];
  for (let row = 0; row < 30; row++) for (let col = 24; col < 29; col++) mines.push([row, col]);
  for (let row = 12; row < 30; row++) mines.push([row, 29]);
  for (let row = 18; row < 30; row++) mines.push([row, 23]);
  return mines;
}

/** Cells the cascade from (0, 0) reveals (Minesweeper flood fill), for the layout self-check. */
function cascadeFrom(rows, cols, mines) {
  const mine = new Set(mines.map(([r, c]) => r * cols + c));
  const count = (r, c) => {
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (
          mine.has((r + dr) * cols + c + dc) &&
          r + dr >= 0 &&
          r + dr < rows &&
          c + dc >= 0 &&
          c + dc < cols
        )
          n++;
    return n;
  };
  const open = new Set();
  const stack = [[0, 0]];
  while (stack.length > 0) {
    const [r, c] = stack.pop();
    const i = r * cols + c;
    if (r < 0 || r >= rows || c < 0 || c >= cols || open.has(i) || mine.has(i)) continue;
    open.add(i);
    if (count(r, c) === 0)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) stack.push([r + dr, c + dc]);
  }
  return { revealed: open.size, hiddenSafe: rows * cols - mines.length - open.size };
}

/** Aborts when a layout would end the game on the first click or reveal too little. */
function checkLayout(name, rows, cols, mines, minRevealed) {
  const { revealed, hiddenSafe } = cascadeFrom(rows, cols, mines);
  if (hiddenSafe === 0) throw new Error(`layout ${name} would end the game on the first click`);
  if (revealed < minRevealed) throw new Error(`layout ${name} reveals only ${revealed} cells`);
  return { revealed, hiddenSafe };
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < SERVER_TIMEOUT_MS) {
    try {
      if ((await fetch(URL)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`dev server did not start on ${URL}`);
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function startBoard(page, rows, cols, mines) {
  await page.evaluate((layout) => {
    window.__minesweeperMines = layout;
  }, mines);
  await page.getByLabel('Rows', { exact: true }).fill(String(rows));
  await page.getByLabel('Columns', { exact: true }).fill(String(cols));
  await page.getByLabel('Mines', { exact: true }).fill(String(mines.length));
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('grid', { name: 'Minesweeper board' }).waitFor();
}

/**
 * Scene fps per 500 ms window from a click on `index` for `total` ms, the longest frame and
 * (story 010) whether anything animated ALIVE_CHECK_MS after the click.
 */
async function measureClick(page, index, total) {
  const { samples, alive, longest } = await page.evaluate(
    async ({ index, total, every, aliveMs }) => {
      const probe = window.__board3dProbe;
      const cellEl = document.querySelector(`[data-index="${index}"]`);
      const result = [];
      let alive = null;
      let longest = 0;
      let last = null;
      let measuring = true;
      const onFrame = (ts) => {
        if (last !== null) longest = Math.max(longest, ts - last);
        last = ts;
        if (measuring) requestAnimationFrame(onFrame);
      };
      requestAnimationFrame(onFrame);
      cellEl.click();
      const start = performance.now();
      while (performance.now() - start < total) {
        const t = performance.now() - start;
        result.push([t, probe.frames]);
        if (alive === null && t >= aliveMs) {
          const fx = probe.fxState;
          alive = fx.running || fx.animating > 0;
        }
        await new Promise((resolve) => setTimeout(resolve, every));
      }
      result.push([performance.now() - start, probe.frames]);
      measuring = false;
      return { samples: result, alive, longest };
    },
    { index, total, every: SAMPLE_MS, aliveMs: ALIVE_CHECK_MS },
  );
  // fps per window from the first and last sample inside it (slow frames can leave a window
  // with fewer samples; one with less than two is skipped).
  const windows = [];
  for (let from = 0; from + WINDOW_MS <= total; from += WINDOW_MS) {
    const inside = samples.filter(([t]) => t >= from && t <= from + WINDOW_MS);
    const first = inside[0];
    const last = inside[inside.length - 1];
    if (inside.length >= 2 && last[0] > first[0]) {
      windows.push(((last[1] - first[1]) * 1000) / (last[0] - first[0]));
    }
  }
  const level = await page.evaluate(() => window.__board3dProbe.level);
  if (windows.length === 0) return { median: NaN, min: NaN, alive, longest, level };
  return {
    median: median(windows),
    min: Math.min(...windows),
    alive: alive === true,
    longest,
    level,
  };
}

const measureCascade = (page) => measureClick(page, 0, CASCADE_MS + AFTER_MS);

/** Clicks a cell in the page (no actionability wait: a swaying cell is never stable). */
const clickCell = (page, index) =>
  page.evaluate((i) => document.querySelector(`[data-index="${i}"]`).click(), index);

/** Restarts the same layout and opens the cascade; the sway loop settles before measuring. */
async function restartWithCascade(page, rows, cols, mines) {
  await startBoard(page, rows, cols, mines);
  await clickCell(page, 0);
  await page.waitForTimeout(CASCADE_MS + 800);
}

/** Pointerdown → first scene frame after the cell's accessible name changed, per input. */
async function measureLatency(page, inputs) {
  const latencies = [];
  for (const { row, col, button } of inputs) {
    // Playwright's actionability waits for a stable element, and a swaying cell never is:
    // scroll and measure in the page, click by coordinates.
    const box = await page.evaluate(
      (index) => {
        const el = document.querySelector(`[data-index="${index}"]`);
        el.scrollIntoView({ block: 'center', inline: 'center' });
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
      },
      row * 30 + col,
    );
    // Listeners first (one round trip), then the click, then wait for the result.
    await page.evaluate(
      ({ index, timeout }) => {
        const probe = window.__board3dProbe;
        const el = document.querySelector(`[data-index="${index}"]`);
        window.__latency = new Promise((resolve) => {
          let down = NaN;
          window.addEventListener('pointerdown', (event) => (down = event.timeStamp), {
            capture: true,
            once: true,
          });
          const observer = new MutationObserver(() => {
            observer.disconnect();
            const frames = probe.frames;
            const check = () => {
              if (probe.frames > frames) resolve(performance.now() - down);
              else requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
          });
          observer.observe(el, { attributes: true, attributeFilter: ['aria-label'] });
          setTimeout(() => {
            observer.disconnect();
            resolve(Infinity); // the name never changed: counts as a miss
          }, timeout);
        });
      },
      { index: row * 30 + col, timeout: INPUT_TIMEOUT_MS },
    );
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button });
    const pending = page.evaluate(() => window.__latency);
    latencies.push(await pending);
    await page.waitForTimeout(150);
  }
  return { median: median(latencies), max: Math.max(...latencies) };
}

const server = spawn('npx', ['vite', '--mode', 'e2e', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
});
let failed = false;
try {
  await waitForServer();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Sign in as guest' }).click();

  const checkA = checkLayout('A', 16, 30, layoutA(), 300);
  const checkB = checkLayout('B', 30, 30, layoutB(), 600);

  // Scenario A: 16 × 30 with a large cascade.
  await startBoard(page, 16, 30, layoutA());
  await page.getByRole('radio', { name: '3D' }).check();
  await page.waitForFunction(
    () => window.__board3dProbe !== undefined && !document.querySelector('[aria-busy="true"]'),
    null,
    {
      timeout: READY_TIMEOUT_MS,
    },
  );
  await page.waitForTimeout(1000); // let the sway loop settle
  const a = await measureCascade(page);
  const levelA = await page.evaluate(() => window.__board3dProbe.level);
  // Story 010: the explosion and the confetti on 16 × 30.
  await page.waitForTimeout(500);
  const aLoss = await measureClick(page, A_MINE[0] * 30 + A_MINE[1], LOSS_MS + EFFECT_AFTER_MS);
  await restartWithCascade(page, 16, 30, layoutA());
  const aWin = await measureClick(
    page,
    A_ISOLATED[0] * 30 + A_ISOLATED[1],
    WIN_MS + EFFECT_AFTER_MS,
  );

  // Scenario B: 30 × 30 with a cascade, then 20 inputs.
  await startBoard(page, 30, 30, layoutB());
  await page.waitForTimeout(1000);
  const b = await measureCascade(page);
  const inputs = [];
  for (let k = 0; k < 10; k++) {
    inputs.push({ row: 20 + k, col: 25, button: 'right' }); // flag a hidden mine
    inputs.push({ row: k, col: 29, button: 'left' }); // reveal a hidden safe cell
  }
  const latency = await measureLatency(page, inputs);
  // Story 010: the explosion and the confetti on 30 × 30 (the win from the last safe cell).
  const bLoss = await measureClick(page, B_MINE[0] * 30 + B_MINE[1], LOSS_MS + EFFECT_AFTER_MS);
  await restartWithCascade(page, 30, 30, layoutB());
  for (let row = 0; row < 11; row++) await clickCell(page, row * 30 + B_SAFE_COLUMN);
  await page.waitForTimeout(1500);
  const bWin = await measureClick(page, 11 * 30 + B_SAFE_COLUMN, WIN_MS + EFFECT_AFTER_MS);
  const result = await page.evaluate(() => document.body.innerText.includes('You won!'));
  if (!result) throw new Error('B win scenario did not win the game');
  const info = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      renderer: window.__board3dProbe.renderer,
      level: window.__board3dProbe.level,
      dpr: canvas ? canvas.width / canvas.getBoundingClientRect().width : NaN,
    };
  });
  await browser.close();

  const softwareGl = /swiftshader|llvmpipe|software/i.test(info.renderer);
  const rows = [
    ['renderer', info.renderer, softwareGl ? 'FAIL (software, not a GPU)' : 'ok'],
    ['canvas DPR (30 × 30)', info.dpr.toFixed(2), ''],
    ['quality level reached (A / B)', `${levelA} / ${info.level}`, ''],
    [
      'A 16 × 30 cascade fps median / min',
      `${a.median.toFixed(1)} / ${a.min.toFixed(1)}`,
      !a.alive ? 'FAIL (nothing animated)' : a.median >= FLOORS.a ? 'ok' : `FAIL (< ${FLOORS.a})`,
    ],
    [
      'B 30 × 30 cascade fps median / min',
      `${b.median.toFixed(1)} / ${b.min.toFixed(1)}`,
      !b.alive ? 'FAIL (nothing animated)' : b.median >= FLOORS.b ? 'ok' : `FAIL (< ${FLOORS.b})`,
    ],
    ...[
      ['A 16 × 30 loss effect', aLoss, FLOORS.a],
      ['A 16 × 30 win effect', aWin, FLOORS.a],
      ['B 30 × 30 loss effect', bLoss, FLOORS.b],
      ['B 30 × 30 win effect', bWin, FLOORS.b],
    ].map(([name, m, floor]) => [
      `${name} fps median / min, longest frame (ms), level`,
      `${m.median.toFixed(1)} / ${m.min.toFixed(1)}, ${m.longest.toFixed(0)}, ${m.level}`,
      !m.alive ? 'FAIL (nothing animated)' : m.median >= floor ? 'ok' : `FAIL (< ${floor})`,
    ]),
    [
      'layout self-check A / B (revealed, hidden safe)',
      `${checkA.revealed}, ${checkA.hiddenSafe} / ${checkB.revealed}, ${checkB.hiddenSafe}`,
      'ok',
    ],
    [
      'B input latency median / max (ms)',
      `${latency.median.toFixed(1)} / ${latency.max.toFixed(1)}`,
      latency.max <= FLOORS.latency ? 'ok' : `FAIL (> ${FLOORS.latency})`,
    ],
  ];
  console.log('\n| Measure | Value | Result |\n| --- | --- | --- |');
  for (const [name, value, result] of rows) console.log(`| ${name} | ${value} | ${result} |`);
  failed = rows.some(([, , result]) => result.startsWith('FAIL'));
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
