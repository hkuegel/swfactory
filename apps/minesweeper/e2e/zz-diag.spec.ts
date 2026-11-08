/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';

type Probe = { pause(): void; holdSway(h: boolean): void; advance(ms: number): void };
type W = Window & { __board3dProbe?: Probe };
const log = (k: string, v: unknown) => {
  fs.mkdirSync('test-results/zz-diag', { recursive: true });
  fs.appendFileSync('test-results/zz-diag/result.txt', `${k} ${JSON.stringify(v)}\n`);
  console.log(`DIAG ${k} ${JSON.stringify(v)}`);
};
async function guest(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
}

test('diag 3D timing', async ({ page }) => {
  test.setTimeout(120_000);
  for (const [w, h, rows, cols] of [
    [1280, 720, 9, 9],
    [375, 800, 9, 9],
    [1280, 720, 30, 30],
  ] as const) {
    await page.setViewportSize({ width: w, height: h });
    await guest(page);
    await page.getByLabel('Rows', { exact: true }).fill(String(rows));
    await page.getByLabel('Columns', { exact: true }).fill(String(cols));
    await page.getByLabel('Mines', { exact: true }).fill('10');
    await page.getByRole('button', { name: 'Start' }).click();
    const t0 = Date.now();
    await page.getByRole('radio', { name: '3D' }).check();
    await expect(page.getByRole('radiogroup', { name: 'View' })).not.toHaveAttribute(
      'aria-busy',
      'true',
      { timeout: 60_000 },
    );
    const tBusy = Date.now() - t0;
    await expect
      .poll(() => page.evaluate(() => (window as W).__board3dProbe !== undefined))
      .toBe(true);
    // real loop frame rate, 3 s
    const fps = await page.evaluate(
      () =>
        new Promise<{ frames: number; maxGap: number }>((resolve) => {
          let frames = 0,
            last = performance.now(),
            maxGap = 0;
          const end = last + 3000;
          const f = () => {
            const n = performance.now();
            maxGap = Math.max(maxGap, n - last);
            last = n;
            frames++;
            if (n < end) requestAnimationFrame(f);
            else resolve({ frames, maxGap });
          };
          requestAnimationFrame(f);
        }),
    );
    const frameCost = await page.evaluate(() => {
      const p = (window as W).__board3dProbe!;
      p.pause();
      const c = document.querySelector('canvas')!;
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const s = performance.now();
        p.advance(16);
        c.toDataURL();
        times.push(performance.now() - s);
      }
      return {
        canvas: [c.width, c.height],
        median: times.sort((a, b) => a - b)[5],
        max: Math.max(...times),
      };
    });
    log(`3d ${w}x${h} board ${rows}x${cols}`, { openMs: tBusy, fps3s: fps, frameCost });
  }
});

test('diag fonts and layout', async ({ page }) => {
  await guest(page);
  const fams = await page.evaluate(() => {
    const hasText = (el: Element) =>
      Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    const m: Record<string, string[]> = {};
    for (const el of document.body.querySelectorAll('*'))
      if (hasText(el) || el.matches('button,input'))
        (m[getComputedStyle(el).fontFamily] ??= []).push(
          el.tagName + ':' + (el.textContent ?? '').slice(0, 20),
        );
    return m;
  });
  log('signed-in font families', fams);
  // accent colour of Start, read repeatedly after a click (hover transition)
  const start = page.getByRole('button', { name: 'Start' });
  const accent = await page.evaluate(() => {
    const p = document.createElement('div');
    p.style.backgroundColor = 'var(--color-accent)';
    document.body.append(p);
    const c = getComputedStyle(p).backgroundColor;
    p.remove();
    return c;
  });
  await start.click();
  const series: string[] = [];
  for (let i = 0; i < 8; i++) {
    series.push(
      await start.evaluate(
        (e) => `${getComputedStyle(e).backgroundColor} anims=${document.getAnimations().length}`,
      ),
    );
    await page.waitForTimeout(40);
  }
  log('start bg after click (hovered)', { accent, series });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  log('start bg after leaving', await start.evaluate((e) => getComputedStyle(e).backgroundColor));
  // layout at 160 px
  await page.setViewportSize({ width: 160, height: 900 });
  await page.getByLabel('Rows', { exact: true }).fill('9');
  await page.getByLabel('Columns', { exact: true }).fill('9');
  await page.getByLabel('Mines', { exact: true }).fill('10');
  await start.click();
  await expect(page.getByRole('gridcell')).toHaveCount(81);
  const lay = await page.evaluate(() => {
    const de = document.documentElement;
    const cw = de.clientWidth;
    const wide = Array.from(document.body.querySelectorAll('*'))
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          tag: e.tagName,
          text: (e.textContent ?? '').slice(0, 25),
          right: Math.round(r.right),
          w: Math.round(r.width),
          font: getComputedStyle(e).fontFamily.slice(0, 40),
          overflowX: getComputedStyle(e.parentElement!).overflowX,
        };
      })
      .filter((x) => x.right > cw && x.overflowX === 'visible')
      .slice(0, 8);
    return {
      scrollW: de.scrollWidth,
      clientW: cw,
      bodyFont: getComputedStyle(document.body).fontFamily,
      wide,
    };
  });
  log('layout 160px 9x9', lay);
});
