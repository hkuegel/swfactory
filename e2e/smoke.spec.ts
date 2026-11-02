/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test } from '@playwright/test';

type Outcome = 'success' | 'cancelled' | 'error';
type FakeWindow = Window & { __fakeGoogle?: { settleSignIn(outcome: Outcome): void } };

test('app loads and shows the game after sign-in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Factory' })).toBeVisible();

  // The game lives in the signed-in view only (stories 001, 005), so sign in via the e2e fake first.
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await page.evaluate(() => (window as FakeWindow).__fakeGoogle?.settleSignIn('success'));
  await expect(page.getByText('Signed in as')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Minesweeper' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});
