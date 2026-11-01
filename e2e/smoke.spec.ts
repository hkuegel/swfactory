import { expect, test } from '@playwright/test';

test('app loads and the counter works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Software Factory' })).toBeVisible();
  await page.getByRole('button', { name: 'Clicked 0 times' }).click();
  await expect(page.getByRole('button', { name: 'Clicked 1 time' })).toBeVisible();
});
