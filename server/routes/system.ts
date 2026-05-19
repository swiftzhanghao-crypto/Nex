import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { getUserName } from '../utils.ts';
import { validateBody, authTypeSchema, salesOrgSchema } from '../validate.ts';

const router = Router();
router.use(authMiddleware);

// ============================================================
// 授权类型 /api/system/auth-types
// ============================================================

function toAuthType(row: any) {
  return {
    id: row.id,
    name: row.name,
    period: row.period,
    nccBiz: row.ncc_biz,
    nccIncome: row.ncc_income,
    hasUpgradeWarranty: row.has_upgrade_warranty === 1,
    purchaseUnit: row.purchase_unit ?? undefined,
    auxPurchaseUnit: row.aux_purchase_unit ?? undefined,
    sortOrder: row.sort_order,
  };
}

router.get('/auth-types', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM auth_types ORDER BY sort_order ASC, rowid ASC').all();
  res.json(rows.map(toAuthType));
});

router.get('/auth-types/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM auth_types WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '授权类型不存在' }); return; }
  res.json(toAuthType(row));
});

router.post('/auth-types', checkPermission('system', 'manage'), validateBody(authTypeSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const b = req.body;
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM auth_types').get() as any)?.m ?? -1;
  db.prepare(`
    INSERT INTO auth_types (id, name, period, ncc_biz, ncc_income, has_upgrade_warranty, purchase_unit, aux_purchase_unit, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(b.id, b.name, b.period, b.nccBiz ?? '', b.nccIncome ?? '',
    b.hasUpgradeWarranty ? 1 : 0, b.purchaseUnit ?? null, b.auxPurchaseUnit ?? null,
    b.sortOrder ?? maxOrder + 1);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'AuthType', b.id, `创建授权类型 ${b.name}`);

  res.status(201).json(toAuthType(db.prepare('SELECT * FROM auth_types WHERE id = ?').get(b.id)));
});

router.put('/auth-types/:id', checkPermission('system', 'manage'), validateBody(authTypeSchema.partial().extend({ name: authTypeSchema.shape.name })), (req: AuthRequest, res) => {
  const db = getDb();
  const b = req.body;
  const id = req.params.id;
  if (!db.prepare('SELECT id FROM auth_types WHERE id = ?').get(id)) {
    res.status(404).json({ error: '授权类型不存在' }); return;
  }
  db.prepare(`
    UPDATE auth_types SET name=?, period=?, ncc_biz=?, ncc_income=?,
      has_upgrade_warranty=?, purchase_unit=?, aux_purchase_unit=?, sort_order=?
    WHERE id=?
  `).run(b.name, b.period, b.nccBiz ?? '', b.nccIncome ?? '',
    b.hasUpgradeWarranty ? 1 : 0, b.purchaseUnit ?? null, b.auxPurchaseUnit ?? null,
    b.sortOrder ?? 0, id);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'AuthType', id, `更新授权类型 ${b.name}`);

  res.json(toAuthType(db.prepare('SELECT * FROM auth_types WHERE id = ?').get(id)));
});

router.delete('/auth-types/:id', checkPermission('system', 'manage'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM auth_types WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '授权类型不存在' }); return; }

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'AuthType', req.params.id, `删除授权类型 ${req.params.id}`);
  res.json({ ok: true });
});

// ============================================================
// 销售组织 /api/system/sales-orgs
// ============================================================

function toSalesOrg(row: any) {
  return {
    id: row.id,
    no: row.no,
    name: row.name,
    shortName: row.short_name,
    financeCode: row.finance_code,
    orgType: row.org_type as '金山' | '数科',
    status: row.status as '正常' | '待补充',
  };
}

router.get('/sales-orgs', (req, res) => {
  const { orgType, status, search } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM sales_orgs WHERE 1=1';
  const params: any[] = [];
  if (orgType) { sql += ' AND org_type = ?'; params.push(orgType); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR short_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY no ASC';
  res.json(db.prepare(sql).all(...params).map(toSalesOrg));
});

router.get('/sales-orgs/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM sales_orgs WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '销售组织不存在' }); return; }
  res.json(toSalesOrg(row));
});

router.post('/sales-orgs', checkPermission('system', 'manage'), validateBody(salesOrgSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const b = req.body;
  db.prepare(`
    INSERT INTO sales_orgs (id, no, name, short_name, finance_code, org_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(b.id, b.no, b.name, b.shortName ?? '', b.financeCode ?? '', b.orgType, b.status ?? '待补充');

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'SalesOrg', b.id, `创建销售组织 ${b.name}`);

  res.status(201).json(toSalesOrg(db.prepare('SELECT * FROM sales_orgs WHERE id = ?').get(b.id)));
});

router.put('/sales-orgs/:id', checkPermission('system', 'manage'), validateBody(salesOrgSchema.partial().extend({ name: salesOrgSchema.shape.name })), (req: AuthRequest, res) => {
  const db = getDb();
  const b = req.body;
  const id = req.params.id;
  if (!db.prepare('SELECT id FROM sales_orgs WHERE id = ?').get(id)) {
    res.status(404).json({ error: '销售组织不存在' }); return;
  }
  db.prepare(`
    UPDATE sales_orgs SET no=?, name=?, short_name=?, finance_code=?, org_type=?, status=?
    WHERE id=?
  `).run(b.no, b.name, b.shortName ?? '', b.financeCode ?? '', b.orgType, b.status, id);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'SalesOrg', id, `更新销售组织 ${b.name}`);

  res.json(toSalesOrg(db.prepare('SELECT * FROM sales_orgs WHERE id = ?').get(id)));
});

router.delete('/sales-orgs/:id', checkPermission('system', 'manage'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM sales_orgs WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '销售组织不存在' }); return; }

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'SalesOrg', req.params.id, `删除销售组织 ${req.params.id}`);
  res.json({ ok: true });
});

export default router;
