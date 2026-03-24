import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, requireRole, type AuthRequest } from '../auth.ts';

const router = Router();
router.use(authMiddleware);

function toChannel(row: any) {
  return {
    id: row.id, name: row.name, type: row.type, level: row.level,
    contactName: row.contact_name, contactPhone: row.contact_phone,
    email: row.email, region: row.region, status: row.status,
    agreementDate: row.agreement_date,
  };
}

router.get('/', (req, res) => {
  const { type, level, status, region, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM channels WHERE 1=1';
  const params: any[] = [];

  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (level) { sql += ' AND level = ?'; params.push(level); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (region) { sql += ' AND region = ?'; params.push(region); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  sql += ' ORDER BY name LIMIT ? OFFSET ?';
  const limit = Math.min(parseInt(size), 200);
  params.push(limit, (parseInt(page) - 1) * limit);

  res.json({ data: db.prepare(sql).all(...params).map(toChannel), total, page: parseInt(page), size: limit });
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '渠道不存在' }); return; }
  res.json(toChannel(row));
});

router.post('/', requireRole('Admin', 'ChannelManager'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;
  const id = c.id || `CH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO channels (id, name, type, level, contact_name, contact_phone, email, region, status, agreement_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, c.name, c.type, c.level, c.contactName, c.contactPhone, c.email, c.region, c.status || 'Active', c.agreementDate);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'CREATE', 'Channel', id, `创建渠道 ${c.name}`);

  const row = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  res.status(201).json(toChannel(row));
});

router.put('/:id', requireRole('Admin', 'ChannelManager'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  if (!existing) { res.status(404).json({ error: '渠道不存在' }); return; }

  db.prepare(`
    UPDATE channels SET name=?, type=?, level=?, contact_name=?, contact_phone=?, email=?, region=?, status=?, agreement_date=?
    WHERE id=?
  `).run(c.name, c.type, c.level, c.contactName, c.contactPhone, c.email, c.region, c.status, c.agreementDate, id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'UPDATE', 'Channel', id, `更新渠道 ${c.name}`);

  const row = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  res.json(toChannel(row));
});

router.delete('/:id', requireRole('Admin', 'ChannelManager'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM channels WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '渠道不存在' }); return; }

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'DELETE', 'Channel', req.params.id, `删除渠道 ${req.params.id}`);
  res.json({ ok: true });
});

export default router;
