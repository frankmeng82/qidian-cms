import { expect, test } from '@playwright/test';

test.describe('User center flow', () => {
  test('user center redirects to login if unauthenticated', async ({ page }) => {
    await page.goto('/me');
    await expect(page).toHaveURL(/\/login/);
  });

  test('public navigation contains user center entry', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('menuitem', { name: '用户中心' })).toBeVisible();
  });
});
