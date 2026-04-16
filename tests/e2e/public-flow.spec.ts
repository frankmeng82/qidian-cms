import { expect, test } from '@playwright/test';

import { createMockFullChainState, setupMockFullChainRoutes } from './helpers/mock-api';
import { PublicPage } from './pages/public.page';

test.describe('Public pages', () => {
  test('home page renders and supports search navigation', async ({ page }) => {
    const state = createMockFullChainState();
    await setupMockFullChainRoutes(page, state);

    const publicPage = new PublicPage(page);
    await publicPage.gotoHome();
    await expect(page.getByRole('heading', { name: '奇点影视' })).toBeVisible();
    await expect(page.getByText(state.video.title)).toBeVisible();
    await page.getByPlaceholder('搜索视频').fill('demo');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/search\?keyword=demo/);
  });

  test('protected page redirects to login', async ({ page }) => {
    await page.goto('/me');
    await expect(page).toHaveURL(/\/login/);
  });
});
