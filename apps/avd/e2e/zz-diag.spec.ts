/// <reference lib="dom" />
import { test } from '@playwright/test';
import {
  chart,
  open,
  rateInput,
  reinvestBox,
  savingSnapshot,
  setReference,
} from './avd.helpers.ts';

const diff = (page: import('@playwright/test').Page, a: string, b: string) =>
  page.evaluate(
    async ([x, y]) => {
      const load = async (d: string) => {
        const i = new Image();
        i.src = `data:image/png;base64,${d}`;
        await i.decode();
        const c = document.createElement('canvas');
        c.width = i.width;
        c.height = i.height;
        const g = c.getContext('2d');
        if (!g) throw new Error('ctx');
        g.drawImage(i, 0, 0);
        return g.getImageData(0, 0, c.width, c.height);
      };
      const p = await load(String(x));
      const q = await load(String(y));
      let n = 0;
      let max = 0;
      for (let i = 0; i < p.data.length; i += 4) {
        let m = 0;
        for (let k = 0; k < 3; k++)
          m = Math.max(m, Math.abs((p.data[i + k] ?? 0) - (q.data[i + k] ?? 0)));
        if (m > 2) n++;
        max = Math.max(max, m);
      }
      return { n, max, h: p.height };
    },
    [a, b] as const,
  );

test('diag avd screenshot sources', async ({ page }) => {
  await page.clock.install({ time: new Date('2027-01-04T10:00:00Z') });
  await open(page);
  await page.clock.pauseAt(new Date('2027-01-04T10:01:00Z'));
  await setReference(page);
  await rateInput(page).fill('42');
  const html = () => chart(page).evaluate((e) => e.outerHTML);
  const shot = async () =>
    (await chart(page).screenshot({ animations: 'disabled' })).toString('base64');
  const info = () =>
    page.evaluate(() => ({
      y: window.scrollY,
      vh: window.innerHeight,
      ph: document.documentElement.scrollHeight,
    }));
  const r: Record<string, unknown> = {};
  const a = await shot();
  const htmlA = await html();
  r.infoA = await info();
  const b = await shot();
  r.AvsB_sameState = await diff(page, a, b);
  // round trip as in the test, via keyboard
  await rateInput(page).focus();
  await page.keyboard.press('Tab');
  await page.clock.runFor(900);
  await page.keyboard.press('Space');
  await reinvestBox(page).waitFor();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  r.infoAfter = await info();
  const c = await shot();
  const htmlC = await html();
  r.AvsC = await diff(page, a, c);
  r.BvsC = await diff(page, b, c);
  r.htmlEqual = htmlA === htmlC;
  if (htmlA !== htmlC) {
    let i = 0;
    while (htmlA[i] === htmlC[i]) i++;
    r.firstDiff = [
      htmlA.slice(Math.max(0, i - 80), i + 120),
      htmlC.slice(Math.max(0, i - 80), i + 120),
    ];
  }
  // round trip through the mouse instead, then re-shot twice
  const d = await shot();
  r.CvsD = await diff(page, c, d);
  await page.evaluate(() => window.scrollTo(0, 0));
  const e = await shot();
  r.AvsE_afterScrollTop = await diff(page, a, e);
  r.infoE = await info();
  console.log('DIAG2 ' + JSON.stringify(r));
});
