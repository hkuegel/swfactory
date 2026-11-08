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
  const sizes = await chart(page).evaluate((e) => {
    const b = e.getBoundingClientRect();
    return { top: b.top + window.scrollY, h: b.height, w: b.width };
  });
  r.sizes = sizes;
  const at = async (y: number) => {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    const info = await chart(page).evaluate((e) => ({
      vtop: e.getBoundingClientRect().top,
      sy: window.scrollY,
    }));
    return { info, png: await shot() };
  };
  const base = await at(2000);
  const same = await at(2000);
  r.repeatSameScroll = await diff(page, base.png, same.png);
  for (const y of [2001, 2010, 2100, 1900]) {
    const o = await at(y);
    r[`scroll${y}`] = { info: o.info, ...(await diff(page, base.png, o.png)) };
  }
  // reach the same scroll after keyboard round trip
  await rateInput(page).focus();
  await page.keyboard.press('Tab');
  await page.clock.runFor(900);
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  const back = await at(2000);
  r.afterRoundTripSameScroll = { info: back.info, ...(await diff(page, base.png, back.png)) };
  // only a focus change
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const blurred = await at(2000);
  r.afterBlur = await diff(page, base.png, blurred.png);
  console.log('DIAG2 ' + JSON.stringify(r));
});
