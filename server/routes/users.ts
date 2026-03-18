import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware } from '../auth.ts';

const router = Router();
router.use(authMiddleware);

function toUser(row: any) {
  return {
    id: row.id, accountId: row.account_id, name: row.name,
    email: row.email, phone: row.phone, role: row.role,
    userType: row.user_type, status: row.status,
    avatar: row.avatar, departmentId: row.department_id,
    monthBadge: row.month_badge,
  };
}

router.get('/', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM users ORDER BY name').all();
  res.json(rows.map(toUser));
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json(toUser(row));
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, email, phone, role, userType, status, departmentId } = req.body;
  db.prepare(`
    UPDATE users SET name=?, email=?, phone=?, role=?, user_type=?, status=?, department_id=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, email, phone ?? null, role, userType ?? 'Internal', status ?? 'Active', departmentId ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(toUser(row));
});

// --- Departments ---
router.get('/meta/departments', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM departments').all() as any[];
  res.json(rows.map(r => ({ id: r.id, name: r.name, description: r.description, parentId: r.parent_id })));
});

// --- Roles ---
router.get('/meta/roles', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM roles').all() as any[];
  res.json(rows.map(r => ({
    id: r.id, name: r.name, description: r.description,
    permissions: JSON.parse(r.permissions), isSystem: !!r.is_system,
    rowPermissions: JSON.parse(r.row_permissions),
    columnPermissions: JSON.parse(r.column_permissions),
  })));
});

router.put('/meta/roles/:id', (req, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, columnPermissions } = req.body;
  db.prepare(`UPDATE roles SET name=?, description=?, permissions=?, row_permissions=?, column_permissions=? WHERE id=?`)
    .run(name, description, JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []), JSON.stringify(columnPermissions ?? []), req.params.id);
  res.json({ ok: true });
});

export default router;
