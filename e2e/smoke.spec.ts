/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test } from '@playwright/test';

type Outcome = 'success' | 'cancelled' | 'error';
type FakeWindow = Window & { __fakeGoogle?: { settleSignIn(outcome: Outcome): void } };

test('app loads and the counter works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Factory' })).toBeVisible();

  // The counter lives in the signed-in view only (story 001), so sign in via the e2e fake first.
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await page.evaluate(() => (window as FakeWindow).__fakeGoogle?.settleSignIn('success'));
  await expect(page.getByText('Signed in as')).toBeVisible();

  await page.getByRole('button', { name: 'Clicked 0 times' }).click();
  await expect(page.getByRole('button', { name: 'Clicked 1 time' })).toBeVisible();
});
