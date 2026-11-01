/// <reference lib="dom" />
// e2e/ is typed by tsconfig.node.json (no DOM lib), but page.evaluate callbacks run in the browser.
import { expect, test, type Page } from '@playwright/test';

// Story 001 – Login with Google. The identity provider is the in-memory fake that the dev
// server exposes in mode `e2e` as window.__fakeGoogle (ADR 0003). Sign-in stays pending
// until a test settles it. Real Google is checked manually.

type Outcome = 'success' | 'cancelled' | 'error';
interface FakeAccount {
  sub: string;
  email: string;
  name?: string;
}
type FakeWindow = Window & {
  __fakeGoogle?: {
    setAccount(account: FakeAccount): void;
    settleSignIn(outcome: Outcome): void;
  };
};

const CANCELLED = 'Google sign-in was cancelled. You can try again.';
const FAILED = 'Google sign-in failed. Please try again.';
const PROGRESS = 'Signing in with Google…';

const signInButton = (page: Page) => page.getByRole('button', { name: 'Sign in with Google' });
const signOutButton = (page: Page) => page.getByRole('button', { name: 'Sign out' });

async function settle(page: Page, outcome: Outcome) {
  await page.evaluate((o) => (window as FakeWindow).__fakeGoogle?.settleSignIn(o), outcome);
}

async function setAccount(page: Page, account: FakeAccount) {
  await page.evaluate((a) => (window as FakeWindow).__fakeGoogle?.setAccount(a), account);
}

async function signInAs(page: Page) {
  await signInButton(page).click();
  await settle(page, 'success');
  await expect(page.getByText('Signed in as')).toBeVisible();
}

async function expectLoginView(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Software Factory' })).toBeVisible();
  await expect(signInButton(page)).toBeVisible();
  await expect(signInButton(page)).toBeEnabled();
  await expect(page.getByText('Signed in as')).toHaveCount(0);
  await expect(signOutButton(page)).toHaveCount(0);
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Clicked/ })).toHaveCount(0);
}

async function expectNoMessage(page: Page) {
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(CANCELLED)).toHaveCount(0);
  await expect(page.getByText(FAILED)).toHaveCount(0);
  await expect(page.getByText(PROGRESS)).toHaveCount(0);
}

async function hasHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // The fake must be present, otherwise the specs would silently run against real Google.
  await expect.poll(() => page.evaluate(() => !!(window as FakeWindow).__fakeGoogle)).toBe(true);
});

test.describe('login view', () => {
  test('AC1: opening the app shows the login screen with no signed-in state', async ({ page }) => {
    await expectLoginView(page);
    await expect(page.getByText('Use your Google account to sign in.')).toBeVisible();
    await expectNoMessage(page);
  });

  test('AC1: page load does not move focus into the page', async ({ page }) => {
    await expect(signInButton(page)).not.toBeFocused();
  });
});

test.describe('sign in', () => {
  test('AC2: a successful sign-in shows the name and hides the login screen', async ({ page }) => {
    await signInButton(page).click();
    await settle(page, 'success');
    await expect(page.getByRole('banner')).toContainText('Signed in as Ada Lovelace');
    await expect(page.getByText('Ada Lovelace', { exact: true })).toBeVisible();
    await expect(signInButton(page)).toHaveCount(0);
    await expect(page.getByText('Use your Google account to sign in.')).toHaveCount(0);
    await expect(signOutButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clicked 0 times' })).toBeVisible();
    await expectNoMessage(page);
  });

  test('AC2: focus moves to the identity after a successful sign-in', async ({ page }) => {
    await signInButton(page).click();
    await settle(page, 'success');
    await expect(page.locator('#identity')).toBeFocused();
  });

  test('AC3: while the attempt is pending, progress is shown and the button is disabled', async ({
    page,
  }) => {
    await signInButton(page).click();
    await expect(signInButton(page)).toBeDisabled();
    await expect(page.getByText(PROGRESS)).toBeVisible();
    await expect(signInButton(page)).toHaveText('Sign in with Google');
    // Still pending a moment later: nothing settles by itself.
    await page.waitForTimeout(300);
    await expect(signInButton(page)).toBeDisabled();
    await expect(page.getByText(PROGRESS)).toBeVisible();
    await expect(page.getByText('Signed in as')).toHaveCount(0);

    await settle(page, 'cancelled');
    await expect(signInButton(page)).toBeEnabled();
    await expect(page.getByText(PROGRESS)).toHaveCount(0);
  });

  test('AC4: cancelling shows the cancelled message, stays on login and re-enables the button', async ({
    page,
  }) => {
    await signInButton(page).click();
    await settle(page, 'cancelled');
    await expect(page.getByText(CANCELLED)).toBeVisible();
    await expectLoginView(page);
    await expect(page.getByText(PROGRESS)).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(signInButton(page)).toBeFocused();
  });

  test('AC5: an error shows the failure alert, stays on login and re-enables the button', async ({
    page,
  }) => {
    await signInButton(page).click();
    await settle(page, 'error');
    await expect(page.getByRole('alert')).toHaveText(FAILED);
    await expectLoginView(page);
    await expect(page.getByText(PROGRESS)).toHaveCount(0);
    await expect(page.getByText(CANCELLED)).toHaveCount(0);
    await expect(signInButton(page)).toBeFocused();
  });

  test('AC6: retrying after an error clears the message at once and success leaves none', async ({
    page,
  }) => {
    await signInButton(page).click();
    await settle(page, 'error');
    await expect(page.getByRole('alert')).toBeVisible();

    await signInButton(page).click();
    await expect(page.getByText(PROGRESS)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(FAILED)).toHaveCount(0);

    await settle(page, 'success');
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expectNoMessage(page);
  });

  test('AC6: retrying after a cancel clears the message at once and success leaves none', async ({
    page,
  }) => {
    await signInButton(page).click();
    await settle(page, 'cancelled');
    await expect(page.getByText(CANCELLED)).toBeVisible();

    await signInButton(page).click();
    await expect(page.getByText(CANCELLED)).toHaveCount(0);
    await expect(page.getByText(PROGRESS)).toBeVisible();

    await settle(page, 'success');
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expectNoMessage(page);
  });

  test('AC6: an error after a cancel replaces the cancelled message', async ({ page }) => {
    await signInButton(page).click();
    await settle(page, 'cancelled');
    await signInButton(page).click();
    await settle(page, 'error');
    await expect(page.getByRole('alert')).toHaveText(FAILED);
    await expect(page.getByText(CANCELLED)).toHaveCount(0);
  });

  test('AC11: an account without a name shows the email address instead', async ({ page }) => {
    await setAccount(page, { sub: 'no-name', email: 'noname@example.com' });
    await signInAs(page);
    await expect(page.getByRole('banner')).toContainText('Signed in as noname@example.com');
    await expect(page.getByText('noname@example.com', { exact: true })).toBeVisible();
  });

  test('AC11: a whitespace-only name counts as no name', async ({ page }) => {
    await setAccount(page, { sub: 'blank', email: 'blank@example.com', name: '   ' });
    await signInAs(page);
    await expect(page.getByRole('banner')).toContainText('Signed in as blank@example.com');
  });
});

test.describe('sign out', () => {
  test('AC9: signing out shows the login screen with no signed-in state', async ({ page }) => {
    await signInAs(page);
    await signOutButton(page).click();
    await expectLoginView(page);
    await expectNoMessage(page);
    await expect(signInButton(page)).toBeFocused();
  });

  test('AC9: after signing out, signing in again works (also as another account)', async ({
    page,
  }) => {
    await signInAs(page);
    await signOutButton(page).click();
    await setAccount(page, { sub: 'grace', email: 'grace@example.com', name: 'Grace Hopper' });
    await signInAs(page);
    await expect(page.getByRole('banner')).toContainText('Signed in as Grace Hopper');
    await expect(page.getByRole('banner')).not.toContainText('Ada Lovelace');
  });

  test('AC10: after signing out, a reload still shows the login screen', async ({ page }) => {
    await signInAs(page);
    await signOutButton(page).click();
    await page.reload();
    await expectLoginView(page);
    await expectNoMessage(page);
  });

  test('AC10: reloading while signed in also shows the login screen (no session restore)', async ({
    page,
  }) => {
    await signInAs(page);
    await page.reload();
    await expectLoginView(page);
    await expectNoMessage(page);
  });

  test('AC10: the app writes no user data to browser storage', async ({ page }) => {
    await signInAs(page);
    const stored = await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
    }));
    expect(stored).toEqual({ local: 0, session: 0, cookie: '' });
  });
});

test.describe('probing beyond the ACs', () => {
  test('a double click on the button starts one attempt and ends in a single signed-in state', async ({
    page,
  }) => {
    await signInButton(page).dblclick();
    await expect(signInButton(page)).toBeDisabled();
    await settle(page, 'success');
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expectNoMessage(page);
  });

  test('rapid repeated failed attempts never leave the button disabled or stack messages', async ({
    page,
  }) => {
    const outcomes: Outcome[] = ['error', 'cancelled', 'error', 'cancelled', 'error'];
    for (const outcome of outcomes) {
      await signInButton(page).click();
      await expect(signInButton(page)).toBeDisabled();
      await settle(page, outcome);
      await expect(signInButton(page)).toBeEnabled();
      await expect(page.getByRole('alert')).toHaveCount(outcome === 'error' ? 1 : 0);
      await expect(page.getByText(CANCELLED)).toHaveCount(outcome === 'cancelled' ? 1 : 0);
    }
    await signInButton(page).click();
    await settle(page, 'success');
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expectNoMessage(page);
  });

  test('settling twice does not break the state', async ({ page }) => {
    await signInButton(page).click();
    await settle(page, 'success');
    await settle(page, 'error');
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expectNoMessage(page);
  });

  test('reloading during a pending attempt returns to an idle login screen', async ({ page }) => {
    await signInButton(page).click();
    await expect(signInButton(page)).toBeDisabled();
    await page.reload();
    await expectLoginView(page);
    await expectNoMessage(page);
  });

  test('keyboard only: sign in, sign out and sign in again with Enter and Space', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');
    await expect(signInButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(signInButton(page)).toBeDisabled();
    await expect(page.getByText(PROGRESS)).toBeVisible();
    await settle(page, 'cancelled');
    await expect(page.getByText(CANCELLED)).toBeVisible();
    await expect(signInButton(page)).toBeFocused();

    await page.keyboard.press('Space');
    await settle(page, 'success');
    await expect(page.locator('#identity')).toBeFocused();

    // #identity is not a tab stop: the next stop is "Sign out", then the counter.
    await page.keyboard.press('Tab');
    await expect(signOutButton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Clicked 0 times' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(signInButton(page)).toBeFocused();
    await expectLoginView(page);
  });

  test('keyboard only: the login screen has exactly one tab stop', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(signInButton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(signInButton(page)).not.toBeFocused();
    // Focus left the page content: no other tab stop exists on the login screen.
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  test('the focus ring is visible on the sign-in button', async ({ page }) => {
    await page.keyboard.press('Tab');
    const outline = await signInButton(page).evaluate((el) => {
      const style = getComputedStyle(el);
      return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
    });
    expect(outline).toBe('solid 2px rgb(11, 87, 208)');
  });

  test('name and email are rendered as text, not as markup', async ({ page }) => {
    const name = '<img src=x onerror="window.__xss=1"> & "Quote" <b>bold</b>';
    await setAccount(page, { sub: 'xss', email: 'x@example.com', name });
    await signInAs(page);
    await expect(page.locator('#identity span')).toHaveText(name);
    await expect(page.locator('#identity img, #identity b')).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
  });

  test('a very long email wraps without horizontal scrolling on a wide viewport', async ({
    page,
  }) => {
    const email = `${'a'.repeat(120)}@example.com`;
    await setAccount(page, { sub: 'long', email });
    await signInAs(page);
    await expect(page.locator('#identity span')).toHaveText(email);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe('narrow viewport (below 600 px)', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('AC1: the sign-in button is full width and there is no horizontal scrolling', async ({
    page,
  }) => {
    await expectLoginView(page);
    const box = await signInButton(page).boundingBox();
    const main = await page.getByRole('main').boundingBox();
    expect(box).not.toBeNull();
    expect(main).not.toBeNull();
    // Full width of the content column, 40 px high.
    expect(Math.round(box?.width ?? 0)).toBe(Math.round((main?.width ?? 0) - 32));
    expect(Math.round(box?.height ?? 0)).toBe(40);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('AC3: progress and message stay inside the viewport', async ({ page }) => {
    await signInButton(page).click();
    await expect(page.getByText(PROGRESS)).toBeVisible();
    await settle(page, 'error');
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('AC2/AC9/AC11: the signed-in header stacks identity above Sign out and a long email wraps', async ({
    page,
  }) => {
    const email = `${'b'.repeat(80)}@example.com`;
    await setAccount(page, { sub: 'long', email });
    await signInAs(page);
    const identity = await page.locator('#identity').boundingBox();
    const signOut = await signOutButton(page).boundingBox();
    expect(identity).not.toBeNull();
    expect(signOut).not.toBeNull();
    // Stacked: the button starts below the identity, and the identity wraps to several lines.
    expect(signOut?.y ?? 0).toBeGreaterThanOrEqual((identity?.y ?? 0) + (identity?.height ?? 0));
    expect(identity?.height ?? 0).toBeGreaterThan(40);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await signOutButton(page).click();
    await expectLoginView(page);
  });

  test('the signed-in view fits at 320 px without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await signInAs(page);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe('wide viewport (600 px and above)', () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test('the signed-in header shows identity and Sign out on one row', async ({ page }) => {
    await signInAs(page);
    const identity = await page.locator('#identity').boundingBox();
    const signOut = await signOutButton(page).boundingBox();
    expect(identity).not.toBeNull();
    expect(signOut).not.toBeNull();
    expect(signOut?.x ?? 0).toBeGreaterThan((identity?.x ?? 0) + 1);
    expect(signOut?.y ?? 0).toBeLessThan((identity?.y ?? 0) + (identity?.height ?? 0));
  });

  test('the sign-in button is not stretched to full width', async ({ page }) => {
    const box = await signInButton(page).boundingBox();
    expect(box?.width ?? 0).toBeLessThan(300);
  });
});
