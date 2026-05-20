import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

let app: express.Express;

beforeAll(async () => {
  const { initSchema } = await import('../server/db.ts');
  const { seedDatabase } = await import('../server/seed.ts');

  initSchema();
  seedDatabase();

  const { default: authRoutes } = await import('../server/routes/auth.ts');
  const { default: userRoutes } = await import('../server/routes/users.ts');
  const { default: orderRoutes } = await import('../server/routes/orders.ts');
  const { default: productRoutes } = await import('../server/routes/products.ts');
  const { default: customerRoutes } = await import('../server/routes/customers.ts');
  const { default: channelRoutes } = await import('../server/routes/channels.ts');
  const { default: systemRoutes } = await import('../server/routes/system.ts');

  app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/channels', channelRoutes);
  app.use('/api/system', systemRoutes);
});

function getToken(res: request.Response): string {
  return res.body.token;
}

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  let refreshToken: string;

  it('POST /api/auth/login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('zhangwei@wps.cn');
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me with valid token returns user', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    const token = getToken(loginRes);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('zhangwei@wps.cn');
  });

  it('POST /api/auth/refresh returns new token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/refresh with invalid token returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
  });
});

describe('Users', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    token = getToken(res);
  });

  it('GET /api/users returns paginated list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Products', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    token = getToken(res);
  });

  it('GET /api/products returns paginated list', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/products/:id returns product', async () => {
    const listRes = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    const firstId = listRes.body.data[0].id;

    const res = await request(app)
      .get(`/api/products/${firstId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
  });
});

describe('Customers', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    token = getToken(res);
  });

  it('GET /api/customers returns paginated list', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

describe('Orders', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    token = getToken(res);
  });

  it('GET /api/orders returns paginated list', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

describe('System (auth-types & sales-orgs)', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'zhangwei@wps.cn', password: '123456' });
    token = getToken(res);
  });

  it('GET /api/system/auth-types returns list', async () => {
    const res = await request(app)
      .get('/api/system/auth-types')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/system/sales-orgs returns list', async () => {
    const res = await request(app)
      .get('/api/system/sales-orgs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
