import { expect, test } from '@playwright/test';

// Bug 020 / AC1: the minified production build (`_site/minesweeper/`, served by the Pages smoke
// test server) must load the 3D view. Run by `npm run test:pages`, not by the dev-server e2e
// config (see the Test report of story 020 for the config wiring). No dev-only probe exists in a
// production build, so "ready" is the app's own signal: the scroller switches to data-view="3d"
// with a canvas, and the load-failure message never shows.

// Same software WebGL as the app's e2e config (ADR 0005); headless CI has no GPU.
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const LOAD_FAILED = '3D could not be loaded. The board stays in 2D.';

test('AC1: minesweeper production build loads the 3D view', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('minesweeper/');
  await page.getByRole('button', { name: 'Sign in as guest' }).click();
  await expect(page.getByText('Signed in as')).toBeVisible();

  await page.getByRole('button', { name: 'Start' }).click();
  const grid = page.getByRole('grid', { name: 'Minesweeper board' });
  await expect(grid).toBeVisible();

  const view3d = page.getByRole('radio', { name: '3D' });
  await view3d.check();

  // The load is asynchronous: wait until it ended, then the failure message must not be there.
  const viewGroup = page.getByRole('radiogroup', { name: 'View' });
  await expect(viewGroup).not.toHaveAttribute('aria-busy', 'true', { timeout: 15_000 });
  await expect(page.getByText(LOAD_FAILED)).toHaveCount(0);

  const scroller = grid.locator('xpath=ancestor::*[@data-view]');
  // Ready = the 3D scene is mounted (canvas in the stage); a failed load stays in 2D.
  await expect(scroller.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  await expect(scroller).toHaveAttribute('data-view', '3d');
  await expect(view3d).toBeChecked();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
