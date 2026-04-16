import { expect, test } from '@playwright/test';

import { createMockFullChainState, setupMockFullChainRoutes } from './helpers/mock-api';
import { AuthPage } from './pages/auth.page';

test.describe('Auth flow', () => {
  test('register page renders and links to login', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoRegister();
    await expect(page.getByRole('heading', { name: '奇点影视CMS 注册' })).toBeVisible();
    await page.getByRole('link', { name: '去登录' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login form validation blocks empty submit', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByText('请输入邮箱')).toBeVisible();
    await expect(page.getByText('请输入密码')).toBeVisible();
  });

  test('login succeeds and redirects to home', async ({ page }) => {
    const state = createMockFullChainState();
    await setupMockFullChainRoutes(page, state);

    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await page.getByPlaceholder('admin@example.com').fill('e2e@example.com');
    await page.getByPlaceholder('请输入密码').fill('abc12345');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: '奇点影视' })).toBeVisible();
  });
});
