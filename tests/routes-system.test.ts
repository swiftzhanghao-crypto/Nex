import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;
let token: string;

beforeAll(async () => {
  const { initSchema } = await import('../server/db.ts');
  const { seedDatabase } = await import('../server/seed.ts');
  initSchema();
  seedDatabase();

  const { default: authRoutes } = await import('../server/routes/auth.ts');
  const { default: systemRoutes } = await import('../server/routes/system.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/system', systemRoutes);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  token = loginRes.body.token;
});

describe('System API — auth-types', () => {
  const authTypeId = 'AT-TEST-001';

  it('GET /api/system/auth-types returns list', async () => {
    const res = await request(app)
      .get('/api/system/auth-types')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/system/auth-types creates auth type', async () => {
    const res = await request(app)
      .post('/api/system/auth-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: authTypeId,
        name: '测试授权类型',
        period: '1年',
        nccBiz: 'BIZ-TEST',
        nccIncome: 'INC-TEST',
        hasUpgradeWarranty: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(authTypeId);
    expect(res.body.name).toBe('测试授权类型');
  });

  it('GET /api/system/auth-types/:id returns auth type', async () => {
    const res = await request(app)
      .get(`/api/system/auth-types/${authTypeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(authTypeId);
  });

  it('PUT /api/system/auth-types/:id updates auth type', async () => {
    const res = await request(app)
      .put(`/api/system/auth-types/${authTypeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '测试授权类型-更新',
        period: '2年',
        nccBiz: 'BIZ-UPD',
        nccIncome: 'INC-UPD',
        hasUpgradeWarranty: false,
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('测试授权类型-更新');
  });

  it('DELETE /api/system/auth-types/:id deletes auth type', async () => {
    const res = await request(app)
      .delete(`/api/system/auth-types/${authTypeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/system/auth-types/:id returns 404 after delete', async () => {
    const res = await request(app)
      .get(`/api/system/auth-types/${authTypeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('System API — sales-orgs', () => {
  it('GET /api/system/sales-orgs returns list', async () => {
    const res = await request(app)
      .get('/api/system/sales-orgs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/system/sales-orgs with filters', async () => {
    const res = await request(app)
      .get('/api/system/sales-orgs?orgType=金山&search=金山')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/system/sales-orgs/:id returns org', async () => {
    const listRes = await request(app)
      .get('/api/system/sales-orgs')
      .set('Authorization', `Bearer ${token}`);
    const firstId = listRes.body[0].id;

    const res = await request(app)
      .get(`/api/system/sales-orgs/${firstId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
  });

  it('GET /api/system/sales-orgs/:id returns 404 for missing', async () => {
    const res = await request(app)
      .get('/api/system/sales-orgs/SO-NOT-EXIST')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
