import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware } from '../auth.ts';

const router = Router();
router.use(authMiddleware);

function toProduct(row: any) {
  return {
    id: row.id, name: row.name, category: row.category,
    subCategory: row.sub_category, description: row.description,
    status: row.status, tags: JSON.parse(row.tags || '[]'),
    skus: JSON.parse(row.skus || '[]'),
    composition: JSON.parse(row.composition || '[]'),
    installPackages: JSON.parse(row.install_pkgs || '[]'),
    packageId: row.package_id, rights: JSON.parse(row.rights || '[]'),
    licenseTemplate: row.license_tpl ? JSON.parse(row.license_tpl) : undefined,
  };
}

router.get('/', (req, res) => {
  const { category, status, search } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

  sql += ' ORDER BY name';
  res.json(db.prepare(sql).all(...params).map(toProduct));
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '产品不存在' }); return; }
  res.json(toProduct(row));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const p = req.body;
  db.prepare(`
    UPDATE products SET name=?, category=?, sub_category=?, description=?, status=?,
    tags=?, skus=?, composition=?, install_pkgs=?, package_id=?, rights=?, license_tpl=?
    WHERE id=?
  `).run(p.name, p.category, p.subCategory ?? null, p.description ?? null, p.status,
    JSON.stringify(p.tags || []), JSON.stringify(p.skus || []),
    JSON.stringify(p.composition || []), JSON.stringify(p.installPackages || []),
    p.packageId ?? null, JSON.stringify(p.rights || []),
    p.licenseTemplate ? JSON.stringify(p.licenseTemplate) : null, req.params.id);

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(toProduct(row));
});

// --- Channels ---
router.get('/meta/channels', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM channels ORDER BY name').all() as any[];
  res.json(rows.map(r => ({
    id: r.id, name: r.name, type: r.type, level: r.level,
    contactName: r.contact_name, contactPhone: r.contact_phone,
    email: r.email, region: r.region, status: r.status,
    agreementDate: r.agreement_date,
  })));
});

// --- Opportunities ---
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

export default router;
