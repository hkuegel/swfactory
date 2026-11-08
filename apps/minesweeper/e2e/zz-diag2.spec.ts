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
    const de = document.documentElement;
    const out: Record<string, unknown> = { scrollW: de.scrollWidth, cw: de.clientWidth };
    const culprits: unknown[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const h = el as HTMLElement;
      const prev = h.style.display;
      h.style.display = 'none';
      const w = de.scrollWidth;
      h.style.display = prev;
      if (w <= de.clientWidth) {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        culprits.push({
          tag: el.tagName,
          role: el.getAttribute('role'),
          text: (el.textContent ?? '').slice(0, 40),
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width),
          pos: s.position,
          overflowX: s.overflowX,
          display: s.display,
          whiteSpace: s.whiteSpace,
          parent: el.parentElement?.tagName + ':' + (el.parentElement?.getAttribute('role') ?? ''),
        });
      }
    }
    out.culprits = culprits.slice(0, 12);
    const labels = Array.from(document.querySelectorAll('label,legend,p,h1,h2,button')).map((e) => [
      e.tagName,
      (e.textContent ?? '').slice(0, 25),
      Math.round(e.getBoundingClientRect().width),
      Math.round(e.getBoundingClientRect().right),
    ]);
    out.widest = labels.filter((l) => Number(l[3]) > 150).slice(0, 12);
    return out;
  });
  console.log('DIAG layout-culprits ' + JSON.stringify(res));
});
