import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import {
  createMockFullChainState,
  seedAuthStorage,
  setupMockAdminVideoListRoute,
  setupMockFullChainRoutes,
  setupMockPlayRoutes,
} from './helpers/mock-api';
import {
  createRealE2EUser,
  createVideoFromAdmin,
  registerAndLogin,
  reportProgressByStoredToken,
  resetRealDatabase,
  seedPlayableSource,
} from './helpers/real-fixture';

const isRealMode = process.env.E2E_REAL === 'true';

test.describe('Core end-to-end chains', () => {
  test('register -> login -> admin create -> play -> favorite/history', async ({ page, request }) => {
    if (isRealMode) {
      test.skip(!process.env.DATABASE_URL, 'E2E_REAL=true 需要 DATABASE_URL');
      await resetRealDatabase();
      await runRealFullChain(page, request);
      return;
    }

    await runMockFullChain(page);
  });

  test('admin video management page renders with mocked video list', async ({ page }) => {
    test.skip(isRealMode, '真实模式下仅运行真实全链路场景');

    await seedAuthStorage(page);
    await setupMockAdminVideoListRoute(page);

    await page.goto('/admin/videos');
    await expect(page.getByRole('heading', { name: '视频管理' })).toBeVisible();
    await expect(page.getByText('测试视频')).toBeVisible();
  });

  test('user watch flow reaches player page with mocked data', async ({ page }) => {
    test.skip(isRealMode, '真实模式下仅运行真实全链路场景');

    await setupMockPlayRoutes(page, 'video-1', '测试片');

    await page.goto('/video/video-1');
    await expect(page.getByRole('heading', { name: '测试片' })).toBeVisible();
    await page.getByRole('button', { name: /立\s*即\s*播\s*放/i }).click();
    await expect(page).toHaveURL(/\/play\/video-1/);
    await expect(page.locator('select').first()).toContainText('线路1');
  });

  test('unauthenticated user is redirected from protected routes', async ({ page }) => {
    test.skip(isRealMode, '真实模式下仅运行真实全链路场景');

    await page.goto('/admin/videos');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/me');
    await expect(page).toHaveURL(/\/login/);
  });

  test('favorite action fails without login in mock mode', async ({ page }) => {
    test.skip(isRealMode, '真实模式下仅运行真实全链路场景');

    const state = createMockFullChainState();
    await setupMockFullChainRoutes(page, state);

    await page.goto(`/video/${state.video.id}`);
    await expect(page.getByRole('heading', { name: state.video.title })).toBeVisible();
    await page.getByRole('button', { name: /收\s*藏/i }).first().click();
    await expect(page.getByText('收藏失败，请先登录')).toBeVisible();
  });
});

async function runRealFullChain(page: Page, request: APIRequestContext) {
  const user = createRealE2EUser();
  const title = `E2E_REAL_${Date.now().toString().slice(-8)}`;

  await registerAndLogin(page, user);

  const targetVideoId = await createVideoFromAdmin(page, title);

  await seedPlayableSource(targetVideoId);

  await page.goto(`/video/${targetVideoId}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: /收\s*藏/i }).first().click();
  await page.getByRole('button', { name: /立\s*即\s*播\s*放/i }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${targetVideoId}`));
  await expect(page.locator('select').first()).toContainText('线路1');

  await reportProgressByStoredToken(page, request, targetVideoId, 66);

  await page.goto('/me');
  await expect(page.getByRole('heading', { name: '用户中心' })).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
  await page.getByRole('tab', { name: '播放历史' }).click();
  await expect(page.getByText(/已看\s*66s/i)).toBeVisible();
}

async function runMockFullChain(page: Page) {
  const state = createMockFullChainState();
  await setupMockFullChainRoutes(page, state);

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: '奇点影视CMS 注册' })).toBeVisible();
  await page.getByPlaceholder('user@example.com').fill('e2e@example.com');
  await page.getByPlaceholder('请输入用户名').fill(state.username);
  await page.getByPlaceholder('至少8位，包含字母+数字').fill('abc12345');
  await page.locator('form').getByRole('button', { name: /注\s*册|register/i }).click();

  await expect(page.getByRole('heading', { name: '奇点影视CMS 登录' })).toBeVisible();
  await page.getByPlaceholder('admin@example.com').fill('e2e@example.com');
  await page.getByPlaceholder('请输入密码').fill('abc12345');
  await page.locator('form').getByRole('button', { name: /登\s*录|log\s*in/i }).click();

  await page.goto('/admin/videos/new');
  await page.getByPlaceholder('请输入视频标题').fill(state.video.title);
  await page.getByRole('button', { name: /创\s*建\s*视\s*频/i }).click();

  await page.goto(`/video/${state.video.id}`);
  await page.getByRole('button', { name: /立\s*即\s*播\s*放/i }).click();
  await expect(page).toHaveURL(new RegExp(`/play/${state.video.id}`));

  await page.goto(`/video/${state.video.id}`);
  await page.getByRole('button', { name: /收\s*藏/i }).first().click();

  await page.goto('/me');
  await expect(page.getByRole('heading', { name: '用户中心' })).toBeVisible();
  await expect(page.getByText(state.video.title).first()).toBeVisible();
}

