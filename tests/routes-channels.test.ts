import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;
let token: string;

const sampleChannel = {
  name: '测试渠道',
  type: 'Distributor',
  level: 'Gold',
  contactName: '张三',
  contactPhone: '13800001111',
  email: 'channel-test@example.com',
  region: '华东',
  status: 'Active' as const,
  agreementDate: '2026-01-01',
};

beforeAll(async () => {
  const { initSchema } = await import('../server/db.ts');
  const { seedDatabase } = await import('../server/seed.ts');
  initSchema();
  seedDatabase();

  const { default: authRoutes } = await import('../server/routes/auth.ts');
  const { default: channelRoutes } = await import('../server/routes/channels.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/channels', channelRoutes);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  token = loginRes.body.token;
});

describe('Channels API', () => {
  let channelId: string;

  it('GET /api/channels returns paginated list', async () => {
    const res = await request(app)
      .get('/api/channels')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/channels with filters', async () => {
    const res = await request(app)
      .get('/api/channels?type=Distributor&status=Active&search=CH')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/channels creates channel', async () => {
    const res = await request(app)
      .post('/api/channels')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleChannel, id: 'CH-TEST-001' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe(sampleChannel.name);
    expect(res.body.id).toBe('CH-TEST-001');
    channelId = res.body.id;
  });

  it('GET /api/channels/:id returns channel', async () => {
    const res = await request(app)
      .get(`/api/channels/${channelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(channelId);
  });

  it('PUT /api/channels/:id updates channel', async () => {
    const res = await request(app)
      .put(`/api/channels/${channelId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleChannel, name: '测试渠道-已更新' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('测试渠道-已更新');
  });

  it('GET /api/channels/:id/users returns users', async () => {
    const res = await request(app)
      .get(`/api/channels/CH50004729/users`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/channels/:id returns 404 for missing', async () => {
    const res = await request(app)
      .get('/api/channels/CH-NOT-EXIST')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /api/channels/:id deletes channel', async () => {
    const res = await request(app)
      .delete(`/api/channels/${channelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const getRes = await request(app)
      .get(`/api/channels/${channelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/channels/:id returns 404 when already deleted', async () => {
    const res = await request(app)
      .delete(`/api/channels/${channelId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
