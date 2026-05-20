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
  const { default: userRoutes } = await import('../server/routes/users.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  token = loginRes.body.token;
});

describe('Users API', () => {
  it('GET /api/users returns paginated list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/users with search filter', async () => {
    const res = await request(app)
      .get('/api/users?search=zhangwei&status=Active')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((u: { email: string }) => u.email === 'zhangwei@wps.cn')).toBe(true);
  });

  it('GET /api/users/meta/roles returns roles', async () => {
    const res = await request(app)
      .get('/api/users/meta/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  it('GET /api/users/meta/departments returns departments', async () => {
    const res = await request(app)
      .get('/api/users/meta/departments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  it('GET /api/users/:id returns user', async () => {
    const res = await request(app)
      .get('/api/users/u1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u1');
    expect(res.body.email).toBe('zhangwei@wps.cn');
  });

  it('GET /api/users/:id returns 404 for missing user', async () => {
    const res = await request(app)
      .get('/api/users/u-not-exist')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/users/order reorders users', async () => {
    const listRes = await request(app)
      .get('/api/users?size=5')
      .set('Authorization', `Bearer ${token}`);
    const ids = listRes.body.data.map((u: { id: string }) => u.id);
    const reversed = [...ids].reverse();

    const res = await request(app)
      .put('/api/users/order')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: reversed });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('PUT /api/users/order rejects invalid body', async () => {
    const res = await request(app)
      .put('/api/users/order')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: 'not-array' });
    expect(res.status).toBe(400);
  });

  it('PUT /api/users/:id updates user profile', async () => {
    const res = await request(app)
      .put('/api/users/u2')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '李娜', email: 'lina@wps.cn', roles: ['Sales'], userType: 'Internal', status: 'Active' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('李娜');
  });

  it('PUT /api/users/meta/roles-order reorders roles', async () => {
    const rolesRes = await request(app)
      .get('/api/users/meta/roles')
      .set('Authorization', `Bearer ${token}`);
    const ids = rolesRes.body.slice(0, 3).map((r: { id: string }) => r.id).reverse();

    const res = await request(app)
      .put('/api/users/meta/roles-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderedIds: ids });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/users/meta/roles creates role and DELETE removes it', async () => {
    const createRes = await request(app)
      .post('/api/users/meta/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '测试角色',
        description: '单元测试角色',
        permissions: ['dashboard_view'],
        rowPermissions: [],
        rowLogic: {},
        columnPermissions: [],
        appPermissions: {},
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('测试角色');
    const roleId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/api/users/meta/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ok).toBe(true);
  });
});
