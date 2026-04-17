import { expect, test } from '@playwright/test';

import {
  seedAuthStorage,
  setupMockAdminVideoListRoute,
  setupMockCategoryRoutes,
  setupMockCollectRoutes,
} from './helpers/mock-api';

test.describe('Admin basic flow', () => {
  test('admin pages require authentication', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/videos');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/categories');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/collect');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated admin pages render core content', async ({ page }) => {
    await seedAuthStorage(page);
    await setupMockAdminVideoListRoute(page);
    await setupMockCategoryRoutes(page);
    await setupMockCollectRoutes(page);

    await page.goto('/admin/videos');
    await expect(page.getByRole('heading', { name: '视频管理' })).toBeVisible();
    await expect(page.getByText('测试视频')).toBeVisible();

    await page.goto('/admin/videos/new');
    await expect(page.getByPlaceholder('请输入视频标题')).toBeVisible();
    await expect(page.getByRole('button', { name: '创建视频' })).toBeVisible();

    await page.goto('/admin/categories');
    await expect(page.getByText('分类列表')).toBeVisible();
    await expect(page.getByText('电影')).toBeVisible();

    await page.goto('/admin/collect');
    await expect(page.getByText('规则列表')).toBeVisible();
    await expect(page.getByText('采集日志')).toBeVisible();
  });
});
