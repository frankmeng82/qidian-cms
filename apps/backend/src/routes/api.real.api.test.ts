import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const enabled = process.env.REAL_API_TESTS === 'true';
const testSuite = enabled ? describe : describe.skip;

testSuite('API real integration (postgres + redis)', () => {
  const app = createApp();
  let adminToken = '';
  let userToken = '';
  let videoId = '';

  beforeAll(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedUsersAndTokens();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('supports full video CRUD with soft delete', async () => {
    const created = await request(app)
      .post('/api/v1/videos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '真实集成测试视频',
        description: 'integration',
        year: 2026,
      });
    expect(created.status).toBe(201);
    videoId = created.body.id as string;

    const list = await request(app).get('/api/v1/videos?page=1&pageSize=10');
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: { id: string }) => item.id === videoId)).toBe(true);

    const updated = await request(app)
      .put(`/api/v1/videos/${videoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '真实集成测试视频-更新' });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toContain('更新');

    const removed = await request(app)
      .delete(`/api/v1/videos/${videoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(removed.status).toBe(204);

    const deletedRow = await prisma.video.findUnique({ where: { id: videoId } });
    expect(deletedRow?.status).toBe(0);
  });

  it('supports favorites and history after login', async () => {
    const created = await request(app)
      .post('/api/v1/videos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '用户行为视频',
        year: 2025,
      });
    expect(created.status).toBe(201);
    const targetVideoId = created.body.id as string;

    const favorite = await request(app)
      .post('/api/v1/user/favorites')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ videoId: targetVideoId });
    expect(favorite.status).toBe(201);

    const favorites = await request(app)
      .get('/api/v1/user/favorites')
      .set('Authorization', `Bearer ${userToken}`);
    expect(favorites.status).toBe(200);
    expect(favorites.body.length).toBeGreaterThan(0);

    const progress = await request(app)
      .post(`/api/v1/videos/${targetVideoId}/progress`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ progressSecond: 90 });
    expect(progress.status).toBe(204);

    const history = await request(app)
      .get('/api/v1/user/history')
      .set('Authorization', `Bearer ${userToken}`);
    expect(history.status).toBe(200);
    expect(history.body.length).toBeGreaterThan(0);
  });

  it('supports collect rules CRUD-like flow', async () => {
    const createRule = await request(app)
      .post('/api/v1/collect/rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'rule-real-test',
        sourceUrl: 'https://example.com/feed.json',
        sourceType: 'json',
        maxItems: 10,
        minIntervalMs: 300000,
      });
    expect(createRule.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/collect/rules')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((item: { name: string }) => item.name === 'rule-real-test')).toBe(true);
  });

  async function seedUsersAndTokens() {
    const registerAdmin = await request(app).post('/api/v1/auth/register').send({
      email: 'admin-real@example.com',
      username: 'admin-real',
      password: 'abc12345',
    });
    expect(registerAdmin.status).toBe(201);

    const registerUser = await request(app).post('/api/v1/auth/register').send({
      email: 'user-real@example.com',
      username: 'user-real',
      password: 'abc12345',
    });
    expect(registerUser.status).toBe(201);

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin-real@example.com',
      password: 'abc12345',
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken as string;

    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'user-real@example.com',
      password: 'abc12345',
    });
    expect(userLogin.status).toBe(200);
    userToken = userLogin.body.accessToken as string;
  }
});

async function resetDatabase() {
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
}
