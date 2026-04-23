import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { buildRowPermissionWhere, checkRowPermissionForSingle } from '../rowPermissionFilter.ts';

const router = Router();
router.use(authMiddleware);

function safeJsonParse(str: string | null | undefined, fallback: any = {}) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

function getUserName(db: any, userId: string): string {
  const row = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  return row?.name || '';
}

function toProduct(row: any) {
  return {
    id: row.id, name: row.name, category: row.category,
    subCategory: row.sub_category, description: row.description,
    status: row.status, tags: safeJsonParse(row.tags, []),
    skus: safeJsonParse(row.skus, []),
    composition: safeJsonParse(row.composition, []),
    installPackages: safeJsonParse(row.install_pkgs, []),
    licenseTemplate: row.license_tpl ? safeJsonParse(row.license_tpl) : undefined,
  };
}

function safePagination(page: string, size: string) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.min(Math.max(1, parseInt(size) || 50), 200);
  return { limit, offset: (pageNum - 1) * limit, pageNum };
}

router.get('/', checkPermission('product', 'list'), (req: AuthRequest, res) => {
  const { category, status, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  const conds: string[] = ['1=1'];
  const params: any[] = [];

  if (category) { conds.push('category = ?'); params.push(category); }
  if (status) { conds.push('status = ?'); params.push(status); }
  if (search && search.trim()) {
    conds.push('(name LIKE ? OR id LIKE ?)');
    const k = `%${search.trim()}%`;
    params.push(k, k);
  }

  const rowPerm = buildRowPermissionWhere(db, req.user!, 'Product');
  const whereSql = ' WHERE ' + conds.join(' AND ') + rowPerm.sql;
  const whereParams = [...params, ...rowPerm.params];

  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM products${whereSql}`).get(...whereParams) as { c: number };
  const total = totalRow?.c ?? 0;

  const { limit, offset, pageNum } = safePagination(page, size);
  const rows = db.prepare(`SELECT * FROM products${whereSql} ORDER BY name LIMIT ? OFFSET ?`)
    .all(...whereParams, limit, offset);

  res.json({ data: rows.map(toProduct), total, page: pageNum, size: limit });
});

router.get('/meta/channels', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM channels ORDER BY name').all() as any[];
  res.json(rows.map(r => ({
    id: r.id, name: r.name, type: r.type, level: r.level,
    contactName: r.contact_name, contactPhone: r.contact_phone,
    email: r.email, region: r.region, status: r.status,
    agreementDate: r.agreement_date,
  })));
});

router.get('/meta/opportunities', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM opportunities ORDER BY close_date DESC').all() as any[];
  res.json(rows.map(r => ({
    id: r.id, crmId: r.crm_id, name: r.name, customerId: r.customer_id,
    customerName: r.customer_name, productType: r.product_type,
    stage: r.stage, probability: r.probability, amount: r.amount,
    expectedRevenue: r.expected_revenue, finalUserRevenue: r.final_user_rev,
    closeDate: r.close_date, ownerId: r.owner_id, ownerName: r.owner_name,
    createdAt: r.created_at,
  })));
});

router.get('/:id', checkPermission('product', 'read'), (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '产品不存在' }); return; }
  const product = toProduct(row);
  if (!checkRowPermissionForSingle(db, req.user!, 'Product', product)) {
    res.status(403).json({ error: '无权查看此产品' });
    return;
  }
  res.json(product);
});

router.post('/', checkPermission('product', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const p = req.body;
  const id = p.id || `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO products (id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, license_tpl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, p.name, p.category, p.subCategory ?? null, p.description ?? null,
    p.status || 'OnShelf', JSON.stringify(p.tags || []), JSON.stringify(p.skus || []),
    JSON.stringify(p.composition || []), JSON.stringify(p.installPackages || []),
    p.licenseTemplate ? JSON.stringify(p.licenseTemplate) : null);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Product', id, `创建产品 ${p.name}`);

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(toProduct(row));
});

router.put('/:id', checkPermission('product', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const p = req.body;
  db.prepare(`
    UPDATE products SET name=?, category=?, sub_category=?, description=?, status=?,
    tags=?, skus=?, composition=?, install_pkgs=?, license_tpl=?
    WHERE id=?
  `).run(p.name, p.category, p.subCategory ?? null, p.description ?? null, p.status,
    JSON.stringify(p.tags || []), JSON.stringify(p.skus || []),
    JSON.stringify(p.composition || []), JSON.stringify(p.installPackages || []),
    p.licenseTemplate ? JSON.stringify(p.licenseTemplate) : null, req.params.id);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Product', req.params.id, `更新产品 ${p.name}`);

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

router.delete('/:id', checkPermission('product', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '产品不存在' }); return; }

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Product', req.params.id, `删除产品 ${req.params.id}`);
  res.json({ ok: true });
});

export default router;
