/// <reference lib="dom" />
import { expect, test } from '@playwright/test';

test('diag layout offenders at 160 px', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
  await page.setViewportSize({ width: 160, height: 900 });
  await page.getByLabel('Rows', { exact: true }).fill('9');
  await page.getByLabel('Columns', { exact: true }).fill('9');
  await page.getByLabel('Mines', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(81);
  const res = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const clipped = (e: Element) => {
      for (let p = e.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o !== 'visible') return true;
      }
      return false;
    };
    const bad = Array.from(document.body.querySelectorAll('*'))
      .filter((e) => !clipped(e) && e.getBoundingClientRect().right > cw + 0.5)
      .map((e) => {
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return {
          tag: e.tagName,
          text: (e.textContent ?? '').slice(0, 30),
          role: e.getAttribute('role'),
          right: Math.round(r.right),
          w: Math.round(r.width),
          display: s.display,
          minW: s.minWidth,
          font: s.fontSize,
        };
      });
    const widths = ['Beginner', 'Intermediate', 'Expert', 'Start'].map((t) => {
      const b = Array.from(document.querySelectorAll('button')).find((x) =>
        x.textContent?.includes(t),
      );
      return [t, Math.round(b?.getBoundingClientRect().width ?? -1)];
    });
    return { scrollW: document.documentElement.scrollWidth, cw, bad: bad.slice(0, 10), widths };
  });
  console.log('DIAG layout-offenders ' + JSON.stringify(res));
});
