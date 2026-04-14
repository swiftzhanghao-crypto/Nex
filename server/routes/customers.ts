import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';

const router = Router();
router.use(authMiddleware);

function safeJsonParse(str: string | null | undefined, fallback: any = {}) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

function safePagination(page: string, size: string) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.min(Math.max(1, parseInt(size) || 50), 200);
  return { limit, offset: (pageNum - 1) * limit, pageNum };
}

function getUserName(db: any, userId: string): string {
  const row = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  return row?.name || '';
}

function toCustomer(row: any) {
  return {
    id: row.id, companyName: row.company_name, industry: row.industry,
    customerType: row.customer_type, level: row.level, region: row.region,
    address: row.address, shippingAddress: row.shipping_address,
    status: row.status, logo: row.logo,
    contacts: safeJsonParse(row.contacts, []),
    billingInfo: row.billing_info ? safeJsonParse(row.billing_info) : undefined,
    ownerId: row.owner_id, ownerName: row.owner_name,
    enterprises: safeJsonParse(row.enterprises, []),
    nextFollowUpDate: row.next_follow_up,
  };
}

router.get('/', checkPermission('customer', 'list'), (req, res) => {
  const { type, level, status, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM customers WHERE 1=1';
  const params: any[] = [];

  if (type) { sql += ' AND customer_type = ?'; params.push(type); }
  if (level) { sql += ' AND level = ?'; params.push(level); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND company_name LIKE ?'; params.push(`%${search}%`); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY company_name LIMIT ? OFFSET ?';
  params.push(limit, offset);

  res.json({ data: db.prepare(sql).all(...params).map(toCustomer), total, page: pageNum, size: limit });
});

router.get('/:id', checkPermission('customer', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '客户不存在' }); return; }
  res.json(toCustomer(row));
});

router.post('/', checkPermission('customer', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;
  const id = c.id || `C${Date.now().toString().slice(-8)}`;

  db.prepare(`
    INSERT INTO customers (id, company_name, industry, customer_type, level, region, address, shipping_address, status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, c.companyName, c.industry, c.customerType, c.level, c.region,
    c.address || '', c.shippingAddress || '', c.status || 'Active', c.logo ?? null,
    JSON.stringify(c.contacts || []), c.billingInfo ? JSON.stringify(c.billingInfo) : null,
    c.ownerId ?? null, c.ownerName ?? null, JSON.stringify(c.enterprises || []),
    c.nextFollowUpDate ?? null);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Customer', id, `创建客户 ${c.companyName}`);

  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  res.status(201).json(toCustomer(row));
});

router.put('/:id', checkPermission('customer', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;

  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: '客户不存在' }); return; }

  db.prepare(`
    UPDATE customers SET company_name=?, industry=?, customer_type=?, level=?, region=?, address=?, shipping_address=?, status=?, logo=?, contacts=?, billing_info=?, owner_id=?, owner_name=?, enterprises=?, next_follow_up=?, updated_at=datetime('now')
    WHERE id=?
  `).run(c.companyName, c.industry, c.customerType, c.level, c.region,
    c.address || '', c.shippingAddress || '', c.status, c.logo ?? null,
    JSON.stringify(c.contacts || []), c.billingInfo ? JSON.stringify(c.billingInfo) : null,
    c.ownerId ?? null, c.ownerName ?? null, JSON.stringify(c.enterprises || []),
    c.nextFollowUpDate ?? null, req.params.id);

  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(toCustomer(row));
});

router.delete('/:id', checkPermission('customer', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '客户不存在' }); return; }
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Customer', req.params.id, `删除客户 ${req.params.id}`);
  res.json({ ok: true });
});

export default router;
