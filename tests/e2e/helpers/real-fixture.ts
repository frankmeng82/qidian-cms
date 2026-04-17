import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

type TestUser = {
  email: string;
  username: string;
  password: string;
};

export async function resetRealDatabase() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.collectLog.deleteMany();
    await prisma.collectRule.deleteMany();
    await prisma.userHistory.deleteMany();
    await prisma.userFavorite.deleteMany();
    await prisma.videoTag.deleteMany();
    await prisma.videoEpisode.deleteMany();
    await prisma.videoSource.deleteMany();
    await prisma.video.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedPlayableSource(videoId: string) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.videoSource.create({
      data: {
        videoId,
        name: '线路1',
        sourceType: 'mp4',
        sortOrder: 1,
        episodes: {
          create: [
            {
              title: '第1集 1080P',
              episodeNo: 1,
              playUrl: 'https://example.com/e2e.mp4',
            },
          ],
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export function createRealE2EUser(): TestUser {
  const suffix = Date.now().toString().slice(-8);
  return {
    email: `e2e-real-${suffix}@example.com`,
    username: `e2e_real_${suffix}`,
    password: 'abc12345',
  };
}

export async function registerAndLogin(page: Page, user: TestUser) {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: '奇点影视CMS 注册' })).toBeVisible();
  await page.getByPlaceholder('user@example.com').fill(user.email);
  await page.getByPlaceholder('请输入用户名').fill(user.username);
  await page.getByPlaceholder('至少8位，包含字母+数字').fill(user.password);
  await page.locator('form').getByRole('button', { name: /注\s*册|register/i }).click();

  await promoteUserToAdmin(user.email);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: '奇点影视CMS 登录' })).toBeVisible();
  await page.getByPlaceholder('admin@example.com').fill(user.email);
  await page.getByPlaceholder('请输入密码').fill(user.password);
  await page.locator('form').getByRole('button', { name: /登\s*录|log\s*in/i }).click();
}

async function promoteUserToAdmin(email: string) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function createVideoFromAdmin(page: Page, title: string): Promise<string> {
  await page.goto('/admin/videos/new');
  await page.getByPlaceholder('请输入视频标题').fill(title);
  await page.getByRole('button', { name: '创建视频' }).click();
  await expect(page).toHaveURL('/admin/videos');
  await expect(page.getByText(title)).toBeVisible();

  const detailRow = page.locator('tr', { hasText: title }).first();
  await detailRow.getByRole('button', { name: '详情' }).click();
  await expect(page).toHaveURL(/\/admin\/videos\/.+/);

  const match = page.url().match(/\/admin\/videos\/([^/]+)/);
  expect(match?.[1]).toBeTruthy();
  return match![1];
}

export async function reportProgressByStoredToken(
  page: Page,
  request: APIRequestContext,
  videoId: string,
  progressSecond: number,
) {
  const token = await page.evaluate(() => localStorage.getItem('qidian_access_token'));
  expect(token).toBeTruthy();

  const response = await request.post(`/api/v1/videos/${videoId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { progressSecond },
  });
  expect(response.status()).toBe(204);
}
