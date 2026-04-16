import type { Page } from '@playwright/test';

type MockVideo = {
  id: string;
  title: string;
  year: number;
  description: string;
};

export type MockFullChainState = {
  token: string;
  username: string;
  userId: string;
  video: MockVideo;
  historySeconds: number;
  favorites: boolean;
};

export function createMockFullChainState(): MockFullChainState {
  return {
    token: '',
    username: 'e2e-user',
    userId: 'user-1',
    video: {
      id: 'video-e2e-1',
      title: '全链路测试片',
      year: 2026,
      description: 'e2e',
    },
    historySeconds: 0,
    favorites: false,
  };
}

export async function setupMockFullChainRoutes(page: Page, state: MockFullChainState) {
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const auth = route.request().headers().authorization;
    const hasAuth = Boolean(auth && auth.startsWith('Bearer '));

    if (url.includes('/api/v1/auth/register') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: state.userId, username: state.username }),
      });
      return;
    }

    if (url.includes('/api/v1/auth/login') && method === 'POST') {
      state.token = 'token-e2e';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: state.token,
          refreshToken: 'refresh-e2e',
          user: { id: state.userId, username: state.username, role: 'ADMIN' },
        }),
      });
      return;
    }

    if (url.match(/\/api\/v1\/videos\?.*/) && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: state.video.id,
              title: state.video.title,
              year: state.video.year,
              status: 1,
              category: { id: 'cat-1', name: '电影' },
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        }),
      });
      return;
    }

    if (url.endsWith('/api/v1/videos') && method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: state.video.id,
          title: state.video.title,
          year: state.video.year,
          status: 1,
        }),
      });
      return;
    }

    if (url.endsWith(`/api/v1/videos/${state.video.id}`) && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: state.video.id,
          title: state.video.title,
          description: state.video.description,
          year: state.video.year,
          category: { id: 'cat-1', name: '电影' },
        }),
      });
      return;
    }

    if (url.endsWith(`/api/v1/videos/${state.video.id}/play`) && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: state.video.id,
          title: state.video.title,
          lines: [
            {
              id: 'line-1',
              name: '线路1',
              type: 'mp4',
              episodes: [
                {
                  id: 'ep-1',
                  title: '第1集 1080P',
                  episodeNo: 1,
                  url: 'https://example.com/e2e.mp4',
                  quality: '1080P',
                  sourceType: 'mp4',
                },
              ],
            },
          ],
        }),
      });
      return;
    }

    if (url.endsWith(`/api/v1/videos/${state.video.id}/progress`) && method === 'POST') {
      const body = route.request().postDataJSON() as { progressSecond?: number };
      state.historySeconds = body.progressSecond ?? 0;
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (url.endsWith('/api/v1/user/favorites') && method === 'POST') {
      if (!hasAuth) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: '未登录' }) });
        return;
      }
      state.favorites = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'fav-1', videoId: state.video.id }),
      });
      return;
    }

    if (url.endsWith('/api/v1/user/profile') && method === 'GET') {
      if (!hasAuth) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: '未登录' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: state.userId, username: state.username, email: 'e2e@example.com' }),
      });
      return;
    }

    if (url.endsWith('/api/v1/user/favorites') && method === 'GET') {
      if (!hasAuth) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: '未登录' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          state.favorites ? [{ id: 'fav-1', video: { id: state.video.id, title: state.video.title } }] : [],
        ),
      });
      return;
    }

    if (url.endsWith('/api/v1/user/history') && method === 'GET') {
      if (!hasAuth) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: '未登录' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          state.historySeconds > 0
            ? [
                {
                  id: 'hist-1',
                  progressSecond: state.historySeconds,
                  video: { id: state.video.id, title: state.video.title },
                },
              ]
            : [],
        ),
      });
      return;
    }

    await route.continue();
  });
}

export async function setupMockAdminVideoListRoute(page: Page) {
  await page.route('**/api/v1/videos**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'video-1',
              title: '测试视频',
              year: 2026,
              status: 1,
              category: { id: 'cat-1', name: '电影' },
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        }),
      });
      return;
    }
    await route.continue();
  });
}

export async function setupMockCategoryRoutes(page: Page) {
  await page.route('**/api/v1/categories**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cat-1',
            name: '电影',
            sortOrder: 1,
            videoCount: 1,
            children: [],
          },
        ]),
      });
      return;
    }
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cat-new',
          name: '新分类',
          sortOrder: 0,
          videoCount: 0,
          children: [],
        }),
      });
      return;
    }
    if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.continue();
  });
}

export async function setupMockCollectRoutes(page: Page) {
  await page.route('**/api/v1/collect/rules**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'rule-1',
            name: '默认采集规则',
            sourceUrl: 'https://example.com/feed.xml',
            sourceType: 'xml',
            cronExpr: null,
            maxItems: 100,
            minIntervalMs: 300000,
            status: 1,
          },
        ]),
      });
      return;
    }
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'rule-new',
          name: '新规则',
          sourceUrl: 'https://example.com/new-feed.xml',
          sourceType: 'xml',
          cronExpr: null,
          maxItems: 100,
          minIntervalMs: 300000,
          status: 1,
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/collect/logs**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'log-1',
            status: 'success',
            message: '采集成功',
            createdAt: new Date().toISOString(),
            rule: { id: 'rule-1', name: '默认采集规则' },
            created: 1,
            skipped: 0,
            failed: 0,
          },
        ]),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/collect/execute**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.continue();
  });
}

export async function setupMockPlayRoutes(page: Page, videoId = 'video-1', title = '测试片') {
  await page.route(`**/api/v1/videos/${videoId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: videoId,
        title,
        subtitle: null,
        description: 'desc',
        year: 2026,
        coverImage: null,
        category: { id: 'cat-1', name: '电影' },
      }),
    });
  });

  await page.route(`**/api/v1/videos/${videoId}/play`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: videoId,
        title,
        lines: [
          {
            id: 'line-1',
            name: '线路1',
            type: 'mp4',
            episodes: [
              {
                id: 'ep-1',
                title: '第1集 1080P',
                episodeNo: 1,
                url: 'https://example.com/demo.mp4',
                quality: '1080P',
                sourceType: 'mp4',
              },
            ],
          },
        ],
      }),
    });
  });
}

export async function seedAuthStorage(page: Page, token = 'fake-token', username = 'admin') {
  await page.addInitScript(
    ({ accessToken, accountName }) => {
      localStorage.setItem('qidian_access_token', accessToken);
      localStorage.setItem('qidian_username', accountName);
    },
    { accessToken: token, accountName: username },
  );
}
