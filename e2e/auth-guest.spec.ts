/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 004 – Sign in as guest. One test per AC or group of related ACs. AC3 (Google not
// configured) is a provider unit test, AC12 (no guest in production) is `npm run check:dist`.

type FakeWindow = Window & {
  __fakeGoogle?: { settleSignIn(outcome: 'success' | 'cancelled' | 'error'): void };
};

const googleButton = (page: Page) => page.getByRole('button', { name: 'Sign in with Google' });
const guestButton = (page: Page) => page.getByRole('button', { name: 'Sign in as guest' });
const signOutButton = (page: Page) => page.getByRole('button', { name: 'Sign out' });

async function settle(page: Page, outcome: 'success' | 'cancelled' | 'error') {
  await page.evaluate((o) => (window as FakeWindow).__fakeGoogle?.settleSignIn(o), outcome);
}

async function expectLoginView(page: Page) {
  await expect(googleButton(page)).toBeVisible();
  await expect(guestButton(page)).toBeVisible();
  await expect(page.getByText('Signed in as')).toHaveCount(0);
  await expect(page.getByRole('banner')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!(window as FakeWindow).__fakeGoogle)).toBe(true);
});

test('AC1/AC11: the login screen shows both options and the unchanged intro text', async ({
  page,
}) => {
  await expectLoginView(page);
  await expect(googleButton(page)).toBeEnabled();
  await expect(guestButton(page)).toBeEnabled();
  await expect(
    page.getByText('Use your Google account to sign in.', { exact: true }),
  ).toBeVisible();
});

test('AC2/AC8: signing in as guest is immediate and reads "Signed in as Guest"', async ({
  page,
}) => {
  await guestButton(page).click();
  await expect(page.getByRole('banner')).toContainText('Signed in as Guest');
  await expect(page.getByText('Guest', { exact: true })).toBeVisible();
  await expect(signOutButton(page)).toBeVisible();
  await expect(googleButton(page)).toHaveCount(0);
  await expect(guestButton(page)).toHaveCount(0);
  await expect(page.getByText('Use your Google account to sign in.')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('#identity')).toBeFocused();
});

// Changed by story 005: the signed-in content is the Minesweeper game, no longer the counter.
test('AC7: a guest sees the same signed-in content as a Google user (the game)', async ({
  page,
}) => {
  await guestButton(page).click();
  await expect(page.getByRole('heading', { name: 'Minesweeper' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('grid', { name: 'Minesweeper board' })).toBeVisible();
  await expect(googleButton(page)).toHaveCount(0);
});

test('AC4/AC5: signing out shows both options again, and a reload keeps the login screen', async ({
  page,
}) => {
  await guestButton(page).click();
  await signOutButton(page).click();
  await expectLoginView(page);
  await expect(googleButton(page)).toBeFocused();
  await page.reload();
  await expectLoginView(page);
});

test('AC10: reloading while signed in as guest shows the login screen', async ({ page }) => {
  await guestButton(page).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
  await page.reload();
  await expectLoginView(page);
  const stored = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
  }));
  expect(stored).toEqual({ local: 0, session: 0, cookie: '' });
});

test('AC6: after a Google error, signing in as guest leaves no error message', async ({ page }) => {
  await googleButton(page).click();
  await settle(page, 'error');
  await expect(page.getByRole('alert')).toHaveText('Google sign-in failed. Please try again.');
  await guestButton(page).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Google sign-in failed. Please try again.')).toHaveCount(0);
});

test('AC6: after a Google cancel, signing in as guest leaves no cancelled message', async ({
  page,
}) => {
  await googleButton(page).click();
  await settle(page, 'cancelled');
  await expect(page.getByText('Google sign-in was cancelled. You can try again.')).toBeVisible();
  await guestButton(page).click();
  await expect(page.getByText('Signed in as')).toBeVisible();
  await expect(page.getByText('Google sign-in was cancelled. You can try again.')).toHaveCount(0);
});

test('AC9: the guest option is disabled while a Google attempt is pending and enabled after', async ({
  page,
}) => {
  await googleButton(page).click();
  await expect(guestButton(page)).toBeDisabled();
  await expect(googleButton(page)).toBeDisabled();
  await settle(page, 'cancelled');
  await expect(guestButton(page)).toBeEnabled();
  await googleButton(page).click();
  await expect(guestButton(page)).toBeDisabled();
  await settle(page, 'error');
  await expect(guestButton(page)).toBeEnabled();
});
