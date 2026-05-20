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
  const { default: customerRoutes } = await import('../server/routes/customers.ts');
  const { default: productRoutes } = await import('../server/routes/products.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/products', productRoutes);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  token = loginRes.body.token;
});

describe('Customers CRUD', () => {
  const customerId = 'C-TEST-9001';
  const payload = {
    id: customerId,
    companyName: '测试客户公司',
    industry: '软件',
    customerType: 'Enterprise',
    level: 'A',
    region: '北京',
    address: '朝阳区',
    contacts: [],
    enterprises: [],
  };

  it('GET /api/customers with search filter', async () => {
    const res = await request(app)
      .get('/api/customers?search=科技')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/customers creates customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.companyName).toBe(payload.companyName);
  });

  it('GET /api/customers/:id returns customer', async () => {
    const res = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(customerId);
  });

  it('PUT /api/customers/:id updates customer', async () => {
    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, companyName: '测试客户公司-更新', status: 'Active' });
    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe('测试客户公司-更新');
  });

  it('DELETE /api/customers/:id deletes customer', async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Products API', () => {
  it('GET /api/products with category filter', async () => {
    const res = await request(app)
      .get('/api/products?category=WPS365公有云&status=OnShelf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/products/:id returns product', async () => {
    const listRes = await request(app)
      .get('/api/products?size=1')
      .set('Authorization', `Bearer ${token}`);
    const id = listRes.body.data[0].id;

    const res = await request(app)
      .get(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('GET /api/products/:id returns 404 for missing', async () => {
    const res = await request(app)
      .get('/api/products/PROD-NOT-EXIST')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/products creates product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'AB-TEST-UNIT',
        name: '单元测试产品',
        category: 'WPS365公有云',
        subCategory: '测试',
        status: 'OnShelf',
        tags: [],
        skus: [],
        composition: [],
        installPackages: [],
        salesScope: [],
        linkedServices: [],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('单元测试产品');
  });

  it('PUT /api/products/:id updates product', async () => {
    const res = await request(app)
      .put('/api/products/AB-TEST-UNIT')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '单元测试产品-更新',
        category: 'WPS365公有云',
        status: 'OnShelf',
        tags: [],
        skus: [],
        composition: [],
        installPackages: [],
        salesScope: [],
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('单元测试产品-更新');
  });

  it('DELETE /api/products/:id deletes product', async () => {
    const res = await request(app)
      .delete('/api/products/AB-TEST-UNIT')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
