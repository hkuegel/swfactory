/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, signedInLocator, test } from './fixtures.ts';

type Outcome = 'success' | 'cancelled' | 'error';
type FakeWindow = Window & { __fakeGoogle?: { settleSignIn(outcome: Outcome): void } };

test('app loads and shows its content after sign-in', async ({
  page,
  appTitle,
  signedInContent,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: appTitle })).toBeVisible();

  // The app lives in the signed-in view only (stories 001, 005), so sign in via the e2e fake first.
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await page.evaluate(() => (window as FakeWindow).__fakeGoogle?.settleSignIn('success'));
  await expect(page.getByText('Signed in as')).toBeVisible();

  await expect(signedInLocator(page, signedInContent)).toBeVisible();
});
