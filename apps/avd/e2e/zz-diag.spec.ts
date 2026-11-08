/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import {
  chart,
  differingPixels,
  open,
  rateInput,
  reinvestBox,
  savingSnapshot,
  setReference,
} from './avd.helpers.ts';

const out = (n: string) => `test-results/zz-diag/${n}`;
const anims = (page: Page) => page.evaluate(() => document.getAnimations().length);

async function diffBox(page: Page, a: string, b: string) {
  return page.evaluate(
    async ([x, y]) => {
      const load = async (d: string) => {
        const i = new Image();
        i.src = `data:image/png;base64,${d}`;
        await i.decode();
        const c = document.createElement('canvas');
        c.width = i.width;
        c.height = i.height;
        const g = c.getContext('2d')!;
        g.drawImage(i, 0, 0);
        return g.getImageData(0, 0, c.width, c.height);
      };
      const p = await load(String(x));
      const q = await load(String(y));
      let n = 0,
        max = 0,
        x0 = 1e9,
        y0 = 1e9,
        x1 = -1,
        y1 = -1;
      const hist: Record<number, number> = {};
      for (let i = 0; i < p.data.length; i += 4) {
        let m = 0;
        for (let k = 0; k < 3; k++)
          m = Math.max(m, Math.abs((p.data[i + k] ?? 0) - (q.data[i + k] ?? 0)));
        if (m > 0) hist[m] = (hist[m] ?? 0) + 1;
        if (m > 2) {
          n++;
          const px = (i / 4) % p.width,
            py = Math.floor(i / 4 / p.width);
          x0 = Math.min(x0, px);
          y0 = Math.min(y0, py);
          x1 = Math.max(x1, px);
          y1 = Math.max(y1, py);
        }
        max = Math.max(max, m);
      }
      return { w: p.width, h: p.height, n, max, box: [x0, y0, x1, y1], hist };
    },
    [a, b] as const,
  );
}

test('diag avd AC1 chart noise', async ({ page }) => {
  fs.mkdirSync(out(''), { recursive: true });
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));
  await setReference(page);
  await rateInput(page).fill('42');
  const geo = () =>
    page.evaluate(() => {
      const c = document.querySelector('[role=img]')!;
      const r = c.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        top: r.top,
        left: r.left,
        h: r.height,
        w: r.width,
        dpr: window.devicePixelRatio,
      };
    });
  const before = await savingSnapshot(page);
  const geoBefore = await geo();
  const animsBefore = await anims(page);
  await rateInput(page).focus();
  await page.keyboard.press('Tab');
  await page.clock.runFor(900);
  await page.keyboard.press('Space');
  await expect(reinvestBox(page)).toBeChecked();
  await page.keyboard.press('Space');
  await expect(reinvestBox(page)).not.toBeChecked();
  const after = await savingSnapshot(page);
  const geoAfter = await geo();
  const animsAfter = await anims(page);
  await page.clock.runFor(800);
  const settled = await savingSnapshot(page);
  const r: Record<string, unknown> = { animsBefore, animsAfter, animsSettled: await anims(page) };
  r.geoBefore = geoBefore;
  r.geoAfter = geoAfter;
  r.afterVsBefore = await diffBox(page, after.chart, before.chart);
  r.settledVsBefore = await diffBox(page, settled.chart, before.chart);
  r.settledVsAfter = await diffBox(page, settled.chart, after.chart);
  // pure repeat noise: two shots of the same untouched chart
  const again = await savingSnapshot(page);
  r.repeat = await diffBox(page, again.chart, settled.chart);
  r.font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  fs.writeFileSync(out('result.json'), JSON.stringify(r, null, 1));
  for (const [k, v] of Object.entries({ before, after, settled }))
    fs.writeFileSync(out(`${k}.png`), Buffer.from(v.chart, 'base64'));
  console.log('DIAG ' + JSON.stringify(r));
  expect(await differingPixels(page, again.chart, settled.chart)).toBe(0);
});
