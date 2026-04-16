import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/qidian_cms?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_secret_123456';
process.env.JWT_EXPIRES_IN = '7d';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    video: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({
        id: 'u1',
        email: 'xss@example.com',
        username: 'xss',
        role: 'USER',
      }),
    },
  },
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock,
}));

import { createApp } from '../app.js';

describe('security smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.video.findMany.mockResolvedValue([]);
    prismaMock.video.count.mockResolvedValue(0);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'xss@example.com',
      username: 'xss',
      role: 'USER',
    });
  });

  it('rejects unauthorized profile access', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/user/profile');
    expect(response.status).toBe(401);
  });

  it('handles SQL-like payload without 500', async () => {
    const app = createApp();
    const payload = "' OR 1=1 --";
    const response = await request(app).get(`/api/v1/search?keyword=${encodeURIComponent(payload)}`);
    expect(response.status).toBe(200);
  });

  it('handles XSS-like payload without 500', async () => {
    const app = createApp();
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'xss@example.com',
      username: '<script>alert(1)</script>',
      password: 'abc12345',
    });
    expect(response.status).toBe(201);
  });
});
