// Story 009, AC3: frame rate and input latency of the 3D board on the reference machine (hak's
// Mac). Headed Chromium on the real GPU; not part of `verify` or CI. Run: `npm run measure:fps`.
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
const INPUT_TIMEOUT_MS = 5000;
const FLOORS = { a: 50, b: 30, latency: 100 };
// `--headless` only checks that the script works (software WebGL; the renderer row then fails).
const HEADLESS = process.argv.includes('--headless');

/** 0-based [row, col] pairs. */
function layoutA() {
  // 16 × 30, 99 mines: columns 24–29 full (96) plus three in column 23; (0, 0) opens the rest.
  const mines = [];
  for (let row = 0; row < 16; row++) for (let col = 24; col < 30; col++) mines.push([row, col]);
  mines.push([0, 23], [1, 23], [2, 23]);
  return mines;
}

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

/** Scene fps per 500 ms window from the click until 2 s after the cascade. */
async function measureCascade(page) {
  const samples = await page.evaluate(
    async ({ total, every }) => {
      const probe = window.__board3dProbe;
      const cellEl = document.querySelector('[data-index="0"]');
      const result = [];
      cellEl.click();
      const start = performance.now();
      while (performance.now() - start < total) {
        result.push([performance.now() - start, probe.frames]);
        await new Promise((resolve) => setTimeout(resolve, every));
      }
      result.push([performance.now() - start, probe.frames]);
      return result;
    },
    { total: CASCADE_MS + AFTER_MS, every: SAMPLE_MS },
  );
  // fps per window from the first and last sample inside it (slow frames can leave a window
  // with fewer samples; one with less than two is skipped).
  const windows = [];
  for (let from = 0; from + WINDOW_MS <= CASCADE_MS + AFTER_MS; from += WINDOW_MS) {
    const inside = samples.filter(([t]) => t >= from && t <= from + WINDOW_MS);
    const first = inside[0];
    const last = inside[inside.length - 1];
    if (inside.length >= 2 && last[0] > first[0]) {
      windows.push(((last[1] - first[1]) * 1000) / (last[0] - first[0]));
    }
  }
  if (windows.length === 0) return { median: NaN, min: NaN };
  return { median: median(windows), min: Math.min(...windows) };
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
      'A 16 × 30 fps median / min',
      `${a.median.toFixed(1)} / ${a.min.toFixed(1)}`,
      a.median >= FLOORS.a ? 'ok' : `FAIL (< ${FLOORS.a})`,
    ],
    [
      'B 30 × 30 fps median / min',
      `${b.median.toFixed(1)} / ${b.min.toFixed(1)}`,
      b.median >= FLOORS.b ? 'ok' : `FAIL (< ${FLOORS.b})`,
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
