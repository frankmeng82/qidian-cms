import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/qidian_cms?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_secret_123456';
process.env.JWT_EXPIRES_IN = '7d';

const { prismaMock, enqueueCollectJobMock } = vi.hoisted(() => ({
  prismaMock: {
    video: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    collectRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    collectLog: {
      findMany: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
    },
    userFavorite: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userHistory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
  enqueueCollectJobMock: vi.fn().mockResolvedValue('job-1'),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../services/collect-queue.js', () => ({
  enqueueCollectJob: enqueueCollectJobMock,
}));

import { createApp } from '../app.js';
import { makeUser, makeVideo, resetFactorySeed } from '../test/factories.js';

describe('API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFactorySeed();
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);
    prismaMock.video.findFirst.mockResolvedValue(null);
    prismaMock.tag.findMany.mockResolvedValue([]);
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.collectRule.findMany.mockResolvedValue([]);
    prismaMock.collectLog.findMany.mockResolvedValue([]);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.count.mockResolvedValue(0);
  });

  it('returns video list', async () => {
    prismaMock.video.findMany.mockResolvedValueOnce([
      makeVideo({ id: 'v1', title: 'Demo' }),
    ]);
    prismaMock.video.count.mockResolvedValueOnce(1);
    const app = createApp();
    const response = await request(app).get('/api/v1/videos?page=1&pageSize=10');
    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
  });

  it('returns 404 when video detail not exists', async () => {
    prismaMock.video.findFirst.mockResolvedValueOnce(null);
    const app = createApp();
    const response = await request(app).get('/api/v1/videos/unknown-id');
    expect(response.status).toBe(404);
  });

  it('returns 400 when pagination parameters are invalid', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/videos?page=0&pageSize=10');
    expect(response.status).toBe(400);
  });

  it('supports concurrent list requests', async () => {
    prismaMock.video.findMany.mockResolvedValue([makeVideo()]);
    prismaMock.video.count.mockResolvedValue(1);
    const app = createApp();
    const responses = await Promise.all([
      request(app).get('/api/v1/videos?page=1&pageSize=10'),
      request(app).get('/api/v1/videos?page=2&pageSize=10'),
      request(app).get('/api/v1/videos?page=3&pageSize=10'),
      request(app).get('/api/v1/videos?page=4&pageSize=10'),
      request(app).get('/api/v1/videos?page=5&pageSize=10'),
    ]);
    responses.forEach((response) => expect(response.status).toBe(200));
  });

  it('blocks unauthenticated video create', async () => {
    const app = createApp();
    const response = await request(app).post('/api/v1/videos').send({ title: 'Demo' });
    expect(response.status).toBe(401);
  });

  it('registers user with valid payload', async () => {
    prismaMock.user.create.mockResolvedValueOnce({
      id: makeUser().id,
      email: 'demo@example.com',
      username: 'demo',
      role: 'ADMIN',
    });
    const app = createApp();
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'demo@example.com',
      username: 'demo',
      password: 'abc12345',
    });
    expect(response.status).toBe(201);
    expect(response.body.username).toBe('demo');
  });

  it('returns 400 for invalid register payload', async () => {
    const app = createApp();
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'invalid',
      username: 'demo',
      password: '12345678',
    });
    expect(response.status).toBe(400);
  });

  it('logs in and fetches profile', async () => {
    const hashed = await bcrypt.hash('abc12345', 10);
    prismaMock.user.findFirst
      .mockResolvedValueOnce({
        ...makeUser({ id: 'u1', email: 'demo@example.com', username: 'demo', role: 'USER' }),
        email: 'demo@example.com',
        username: 'demo',
        role: 'USER',
        password: hashed,
      })
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'demo@example.com',
        username: 'demo',
        role: 'USER',
        vipExpireAt: null,
        createdAt: new Date().toISOString(),
      });
    const app = createApp();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'demo@example.com',
      password: 'abc12345',
    });
    expect(login.status).toBe(200);
    const token = login.body.accessToken as string;

    const profile = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe('demo@example.com');
  });

  it('returns categories tree', async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([
      {
        id: 'c1',
        name: '电影',
        parentId: null,
        sortOrder: 0,
        videos: [{ id: 'v1' }],
      },
    ]);
    const app = createApp();
    const response = await request(app).get('/api/v1/categories');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('returns 403 for user accessing admin collect api', async () => {
    const hash = await bcrypt.hash('abc12345', 10);
    prismaMock.user.findFirst.mockResolvedValueOnce({
      ...makeUser({ id: 'u1', email: 'demo@example.com', username: 'demo', role: 'USER' }),
      password: hash,
    });
    const app = createApp();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'demo@example.com',
      password: 'abc12345',
    });
    const token = login.body.accessToken as string;
    const response = await request(app)
      .get('/api/v1/collect/rules')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });
});
