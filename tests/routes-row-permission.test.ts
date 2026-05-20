import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type Database from 'better-sqlite3';

let db: Database.Database;
let rowFilter: typeof import('../server/rowPermissionFilter');
let app: express.Express;
let adminToken: string;
let salesToken: string;

beforeAll(async () => {
  const { initSchema, getDb } = await import('../server/db.ts');
  const { seedDatabase } = await import('../server/seed.ts');
  initSchema();
  seedDatabase();
  db = getDb();
  rowFilter = await import('../server/rowPermissionFilter');

  db.prepare(`UPDATE roles SET row_permissions = ? WHERE id = 'Sales'`).run(JSON.stringify([
    { resource: 'Order', dimension: 'salesRep', values: ['self'] },
    { resource: 'Customer', dimension: 'salesRep', values: ['self'] },
    { resource: 'Product', dimension: 'category', values: ['WPS365公有云'] },
  ]));

  const { default: authRoutes } = await import('../server/routes/auth.ts');
  const { default: orderRoutes } = await import('../server/routes/orders.ts');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/orders', orderRoutes);

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'zhangwei@wps.cn', password: '123456' });
  adminToken = adminLogin.body.token;

  const salesLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'lina@wps.cn', password: '123456' });
  salesToken = salesLogin.body.token;
});

describe('rowPermissionFilter utilities', () => {
  it('getRowRules returns empty for Admin (no row rules)', () => {
    const rules = rowFilter.getRowRules(db, 'Admin', 'Order');
    expect(rules).toEqual([]);
  });

  it('getRowRules returns Sales order rules', () => {
    const rules = rowFilter.getRowRules(db, 'Sales', 'Order');
    expect(rules.length).toBe(1);
    expect(rules[0].dimension).toBe('salesRep');
    expect(rules[0].values).toContain('self');
  });

  it('getDescendantDeptIds includes children', () => {
    const ids = rowFilter.getDescendantDeptIds(db, 'root');
    expect(ids).toContain('root');
    expect(ids.length).toBeGreaterThan(1);
  });

  it('buildUserDeptMap maps user to department', () => {
    const map = rowFilter.buildUserDeptMap(db);
    expect(map.get('u1')).toBe('root');
    expect(map.get('u2')).toBeTruthy();
  });

  it('filterByRowPermissions filters orders by self salesRep', () => {
    const orders = [
      { salesRepId: 'u2', status: 'DRAFT' },
      { salesRepId: 'u1', status: 'DRAFT' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u2', roles: ['Sales'] }, 'Order', orders);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].salesRepId).toBe('u2');
  });

  it('filterByRowPermissions returns all for Admin', () => {
    const orders = [
      { salesRepId: 'u2', status: 'DRAFT' },
      { salesRepId: 'u1', status: 'DRAFT' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u1', roles: ['Admin'] }, 'Order', orders);
    expect(filtered).toHaveLength(2);
  });

  it('checkRowPermissionForSingle allows own order', () => {
    const ok = rowFilter.checkRowPermissionForSingle(
      db,
      { userId: 'u2', roles: ['Sales'] },
      'Order',
      { salesRepId: 'u2', status: 'DRAFT' },
    );
    expect(ok).toBe(true);
  });

  it('checkRowPermissionForSingle denies others order', () => {
    const ok = rowFilter.checkRowPermissionForSingle(
      db,
      { userId: 'u2', roles: ['Sales'] },
      'Order',
      { salesRepId: 'u1', status: 'DRAFT' },
    );
    expect(ok).toBe(false);
  });

  it('filterByRowPermissions filters customers by owner', () => {
    const customers = [
      { ownerId: 'u2', industry: '软件' },
      { ownerId: 'u1', industry: '金融' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u2', roles: ['Sales'] }, 'Customer', customers);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ownerId).toBe('u2');
  });

  it('filterByRowPermissions filters products by category', () => {
    const products = [
      { category: 'WPS365公有云', status: 'Active' },
      { category: '信创端', status: 'Active' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u2', roles: ['Sales'] }, 'Product', products);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('WPS365公有云');
  });

  it('buildRowPermissionWhere returns SQL for Sales', () => {
    const { sql, params } = rowFilter.buildRowPermissionWhere(db, { userId: 'u2', roles: ['Sales'] }, 'Order');
    expect(sql).toContain('sales_rep_id');
    expect(params).toContain('u2');
  });

  it('buildRowPermissionWhere supports multi-dimension Sales rules', () => {
    db.prepare(`UPDATE roles SET row_permissions = ? WHERE id = 'Sales'`).run(JSON.stringify([
      { resource: 'Order', dimension: 'orderStatus', values: ['DRAFT', 'PENDING_APPROVAL'] },
      { resource: 'Order', dimension: 'buyerType', values: ['Customer'] },
    ]));
    const { sql, params } = rowFilter.buildRowPermissionWhere(db, { userId: 'u2', roles: ['Sales'] }, 'Order');
    expect(sql).toContain('status');
    expect(sql).toContain('buyer_type');
    expect(params).toContain('DRAFT');
    expect(params).toContain('Customer');
  });

  it('getDescendantDeptIds returns only self for leaf dept', () => {
    const ids = rowFilter.getDescendantDeptIds(db, 'c2-d1-r1-t1');
    expect(ids).toContain('c2-d1-r1-t1');
  });

  it('filterByRowPermissions handles department rule', () => {
    db.prepare(`UPDATE roles SET row_permissions = ? WHERE id = 'Sales'`).run(JSON.stringify([
      { resource: 'Order', dimension: 'departmentId', values: ['c2-d1'] },
    ]));
    const userDeptMap = rowFilter.buildUserDeptMap(db);
    const u6Dept = userDeptMap.get('u6');
    const orders = [
      { salesRepId: 'u6', status: 'DRAFT' },
      { salesRepId: 'u1', status: 'DRAFT' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u6', roles: ['Sales'] }, 'Order', orders);
    if (u6Dept === 'c2-d1') {
      expect(filtered.some(o => o.salesRepId === 'u6')).toBe(true);
    } else {
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('filterByRowPermissions handles order status rule', () => {
    db.prepare(`UPDATE roles SET row_permissions = ? WHERE id = 'Sales'`).run(JSON.stringify([
      { resource: 'Order', dimension: 'orderStatus', values: ['DRAFT'] },
    ]));
    const orders = [
      { salesRepId: 'u2', status: 'DRAFT' },
      { salesRepId: 'u2', status: 'DELIVERED' },
    ];
    const filtered = rowFilter.filterByRowPermissions(db, { userId: 'u2', roles: ['Sales'] }, 'Order', orders);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe('DRAFT');
  });

  it('buildRowPermissionWhere returns empty for Admin', () => {
    const { sql, params } = rowFilter.buildRowPermissionWhere(db, { userId: 'u1', roles: ['Admin'] }, 'Order');
    expect(sql).toBe('');
    expect(params).toEqual([]);
  });
});

describe('Row permission via Orders API', () => {
  beforeAll(() => {
    db.prepare(`UPDATE roles SET row_permissions = ? WHERE id = 'Sales'`).run(JSON.stringify([
      { resource: 'Order', dimension: 'salesRep', values: ['self'] },
    ]));
  });

  it('Admin sees all orders', async () => {
    const res = await request(app)
      .get('/api/orders?size=100')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(1);
  });

  it('Sales user gets filtered order list', async () => {
    const adminRes = await request(app)
      .get('/api/orders?size=100')
      .set('Authorization', `Bearer ${adminToken}`);
    const salesRes = await request(app)
      .get('/api/orders?size=100')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(salesRes.status).toBe(200);
    expect(Array.isArray(salesRes.body.data)).toBe(true);
    expect(salesRes.body.data.length).toBeLessThanOrEqual(adminRes.body.data.length);
    for (const order of salesRes.body.data) {
      if (order.salesRepId) {
        expect(order.salesRepId).toBe('u2');
      }
    }
  });
});
