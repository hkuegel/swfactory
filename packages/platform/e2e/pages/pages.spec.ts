import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { listSiteApps, SITE_DIR } from '../../config/pages.ts';

// Story 018 AC1/AC2 on the real deploy build (`_site/`, guest-only, served under the subpath by a
// strict static server without SPA fallback, like GitHub Pages). One test per discovered app;
// `listSiteApps()` throws on an empty `_site`, so this can't pass vacuously.

function pageTitle(app: string): string {
  const html = readFileSync(`${SITE_DIR}/${app}/index.html`, 'utf8');
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1]?.trim();
  if (!title) throw new Error(`no <title> in _site/${app}/index.html`);
  return title;
}

for (const app of listSiteApps()) {
  test(`AC1/AC2: ${app} under the subpath offers only guest sign-in`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL ?? '').origin;
    const requests: string[] = [];
    const bad: string[] = [];
    const kinds = new Set<string>();
    page.on('request', (request) => requests.push(request.url()));
    page.on('response', (response) => {
      const type = response.request().resourceType();
      if (['document', 'script', 'stylesheet'].includes(type)) {
        kinds.add(type);
        if (response.status() >= 400) bad.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto(`${app}/`);
    const guest = page.getByRole('button', { name: 'Sign in as guest' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageTitle(app));
    await expect(guest).toBeVisible();

    // AC2: only the guest option, no text offering Google.
    await expect(page.getByRole('button')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Google/ })).toHaveCount(0);
    await expect(page.getByText(/Google/)).toHaveCount(0);

    // AC1/AC2: every asset came from the site itself and none failed.
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
    expect(bad).toEqual([]);
    expect([...kinds].sort()).toEqual(['document', 'script', 'stylesheet']);

    // 004/AC2, AC8: guest sign-in is immediate and error-free.
    await guest.click();
    await expect(page.getByRole('banner')).toContainText('Signed in as Guest');
    await expect(page.getByRole('alert')).toHaveCount(0);

    // 004/AC10: nothing is stored, a reload shows the login screen.
    await page.reload();
    await expect(guest).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);

    // 004/AC4: after sign-out the login screen is back and focus is on the guest button.
    await guest.click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(guest).toBeVisible();
    await expect(guest).toBeFocused();
    expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
  });
}

// Story 021 AC1/AC3/AC5/AC7: the site root (the factory page) on the real deploy build. The app links
// must be exactly the apps of `_site/` (the platform names no app), and each one must open its login.
test('021 AC3/AC5/AC7: the site root links every published app', async ({ page, baseURL }) => {
  const base = new URL(baseURL ?? '');
  const requests: string[] = [];
  const responses: { status: number; url: string; type: string }[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('response', (response) =>
    responses.push({
      status: response.status(),
      url: response.url(),
      type: response.request().resourceType(),
    }),
  );

  const document = await page.goto('');
  expect(document?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

  // AC5: no sign-in, only the page's own origin, nothing failing, scripts and styles really loaded.
  await expect(page.getByRole('button', { name: /sign in/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /sign in/i })).toHaveCount(0);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((url) => new URL(url).origin !== base.origin)).toEqual([]);
  expect(responses.filter((response) => response.status >= 400)).toEqual([]);
  expect(new Set(responses.map((response) => response.type))).toContain('script');
  expect(new Set(responses.map((response) => response.type))).toContain('stylesheet');

  // AC3: the repository, and one link per published app (same tab), as a set.
  await expect(
    page.locator('a[href="https://github.com/hkuegel/swfactory"]').first(),
  ).toBeVisible();
  const links = page.locator(`main a[href^="${base.pathname}"]`);
  const hrefs = await links.evaluateAll((anchors) =>
    anchors.map((a) => [a.getAttribute('href'), a.getAttribute('target')]),
  );
  expect(hrefs.map(([href]) => href).sort()).toEqual(
    listSiteApps().map((app) => `${base.pathname}${app}/`),
  );
  expect(hrefs.filter(([, target]) => target !== null)).toEqual([]);

  // AC3/AC7: following each link reaches that app's login screen.
  for (const app of listSiteApps()) {
    await page.locator(`main a[href="${base.pathname}${app}/"]`).click();
    await expect(page).toHaveURL(`${base.origin}${base.pathname}${app}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(pageTitle(app));
    await expect(page.getByRole('button', { name: 'Sign in as guest' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/software factory/i);
  }
});
