import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { safePagination, getUserName } from '../utils.ts';

const router = Router();
router.use(authMiddleware);

function toOpportunity(row: any) {
  let products;
  try { products = row.products ? JSON.parse(row.products) : undefined; } catch { products = undefined; }
  return {
    id: row.id, crmId: row.crm_id, name: row.name, customerId: row.customer_id,
    customerName: row.customer_name, productType: row.product_type,
    products,
    stage: row.stage, probability: row.probability, department: row.department,
    amount: row.amount, expectedRevenue: row.expected_revenue,
    finalUserRevenue: row.final_user_rev, closeDate: row.close_date,
    ownerId: row.owner_id, ownerName: row.owner_name, createdAt: row.created_at,
  };
}

const VALID_STAGES = ['需求判断', '方案报价', '商务谈判', '赢单', '输单'];

router.get('/', checkPermission('opportunity', 'list'), (req, res) => {
  const { customerId, stage, ownerId, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM opportunities WHERE 1=1';
  const params: any[] = [];

  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (stage) { sql += ' AND stage = ?'; params.push(stage); }
  if (ownerId) { sql += ' AND owner_id = ?'; params.push(ownerId); }
  if (search) { sql += ' AND (name LIKE ? OR customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY close_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  res.json({ data: db.prepare(sql).all(...params).map(toOpportunity), total, page: pageNum, size: limit });
});

router.get('/:id', checkPermission('opportunity', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '商机不存在' }); return; }
  res.json(toOpportunity(row));
});

router.post('/', checkPermission('opportunity', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = o.id || `OPP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (o.stage && !VALID_STAGES.includes(o.stage)) {
    res.status(400).json({ error: `无效的商机阶段: ${o.stage}，有效值: ${VALID_STAGES.join(', ')}` });
    return;
  }

  db.prepare(`
    INSERT INTO opportunities (id, crm_id, name, customer_id, customer_name, product_type, products, stage, probability, department, amount, expected_revenue, final_user_rev, close_date, owner_id, owner_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, o.crmId ?? null, o.name, o.customerId, o.customerName,
    o.productType ?? null, o.products ? JSON.stringify(o.products) : null,
    o.stage || '需求判断', o.probability ?? 0, o.department ?? null,
    o.amount ?? null, o.expectedRevenue ?? 0, o.finalUserRevenue ?? null,
    o.closeDate, o.ownerId, o.ownerName, new Date().toISOString());

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Opportunity', id, `创建商机 ${o.name}`);

  const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
  res.status(201).json(toOpportunity(row));
});

router.put('/:id', checkPermission('opportunity', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '商机不存在' }); return; }

  if (o.stage && !VALID_STAGES.includes(o.stage)) {
    res.status(400).json({ error: `无效的商机阶段: ${o.stage}` });
    return;
  }

  db.prepare(`
    UPDATE opportunities SET crm_id=?, name=?, customer_id=?, customer_name=?, product_type=?, products=?, stage=?, probability=?, department=?, amount=?, expected_revenue=?, final_user_rev=?, close_date=?, owner_id=?, owner_name=?
    WHERE id=?
  `).run(o.crmId ?? null, o.name, o.customerId, o.customerName,
    o.productType ?? null, o.products ? JSON.stringify(o.products) : null,
    o.stage, o.probability, o.department ?? null,
    o.amount ?? null, o.expectedRevenue ?? 0, o.finalUserRevenue ?? null,
    o.closeDate, o.ownerId, o.ownerName, id);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Opportunity', id, `更新商机 ${o.name}，阶段: ${o.stage}`);

  const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
  res.json(toOpportunity(row));
});

router.delete('/:id', checkPermission('opportunity', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: '商机不存在' }); return; }

  if (existing.stage === '赢单') {
    res.status(400).json({ error: '已赢单的商机不允许删除' });
    return;
  }

  db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Opportunity', req.params.id, `删除商机 ${existing.name}`);
  res.json({ ok: true });
});

export default router;
