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

describe('Order creation validation', () => {
  it('POST /api/orders without customerId returns 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerName: '缺少 customerId' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('请求参数校验失败');
  });

  it('POST /api/orders with valid minimal body returns 201', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '单元测试客户',
        status: 'DRAFT',
      });
    expect(res.status).toBe(201);
    expect(res.body.customerId).toBe(customerId);
    expect(res.body.status).toBe('DRAFT');
  });
});

describe('Order status transitions', () => {
  it('allows valid transition DRAFT → PENDING_APPROVAL', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '状态流转测试',
        status: 'DRAFT',
      });
    const orderId = createRes.body.id;

    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '状态流转测试',
        status: 'PENDING_APPROVAL',
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_APPROVAL');
  });

  it('rejects illegal transition DRAFT → DELIVERED', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '非法流转测试',
        status: 'DRAFT',
      });
    const orderId = createRes.body.id;

    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        customerName: '非法流转测试',
        status: 'DELIVERED',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/状态流转不合法/);
  });
});
