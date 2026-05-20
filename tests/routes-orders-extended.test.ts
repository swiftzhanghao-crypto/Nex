import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;
let token: string;
let customerId: string;

beforeAll(async () => {
  const { initSchema } = await import('../server/db.ts');
  const { seedDatabase } = await import('../server/seed.ts');
  initSchema();
  seedDatabase();

  const { default: authRoutes } = await import('../server/routes/auth.ts');
  const { default: orderRoutes } = await import('../server/routes/orders.ts');
  const { default: customerRoutes } = await import('../server/routes/customers.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/customers', customerRoutes);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  token = loginRes.body.token;

  const customersRes = await request(app)
    .get('/api/customers')
    .set('Authorization', `Bearer ${token}`);
  customerId = customersRes.body.data[0].id;
});

describe('Orders extended API', () => {
  let orderId: string;

  it('GET /api/orders with status filter', async () => {
    const res = await request(app)
      .get('/api/orders?status=DRAFT&search=ORD')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/orders creates order for extended tests', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '扩展测试客户',
        status: 'DRAFT',
        salesRepId: 'u1',
        salesRepName: '张伟',
      });
    expect(res.status).toBe(201);
    orderId = res.body.id;
  });

  it('GET /api/orders/:id returns order detail', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
  });

  it('GET /api/orders/:id/logs returns audit logs', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}/logs`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/orders/:id/submit submits draft order', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_APPROVAL');
  });

  it('POST /api/orders/:id/approve approves order', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approved: true, comment: '单元测试通过' });
    expect(res.status).toBe(200);
    expect(['PENDING_CONFIRM', 'APPROVED', 'PENDING_APPROVAL']).toContain(res.body.status);
  });

  it('GET /api/orders/sub-units/list returns sub-unit rows', async () => {
    const res = await request(app)
      .get('/api/orders/sub-units/list')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('DELETE /api/orders/:id deletes order', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId, customerName: '待删除订单', status: 'DRAFT' });
    const deleteId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/orders/${deleteId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
