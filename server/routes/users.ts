import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';

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

router.post('/meta/roles', (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, columnPermissions } = req.body;
  const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)`)
    .run(id, name, description || '', JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []), JSON.stringify(columnPermissions ?? []));

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'CREATE', 'Role', id, `创建角色 ${name}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
  res.status(201).json({
    id: row.id, name: row.name, description: row.description,
    permissions: JSON.parse(row.permissions), isSystem: false,
    rowPermissions: JSON.parse(row.row_permissions),
    columnPermissions: JSON.parse(row.column_permissions),
  });
});

router.post('/meta/roles/:id/copy', (req: AuthRequest, res) => {
  const db = getDb();
  const source = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!source) { res.status(404).json({ error: '源角色不存在' }); return; }

  const newId = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newName = req.body.name || `${source.name} (副本)`;

  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)`)
    .run(newId, newName, source.description, source.permissions, source.row_permissions, source.column_permissions);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'COPY', 'Role', newId, `从 ${source.name} 复制角色 ${newName}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(newId) as any;
  res.status(201).json({
    id: row.id, name: row.name, description: row.description,
    permissions: JSON.parse(row.permissions), isSystem: false,
    rowPermissions: JSON.parse(row.row_permissions),
    columnPermissions: JSON.parse(row.column_permissions),
  });
});

router.delete('/meta/roles/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!role) { res.status(404).json({ error: '角色不存在' }); return; }
  if (role.is_system) { res.status(400).json({ error: '系统内置角色不可删除' }); return; }

  const userCount = db.prepare('SELECT COUNT(*) as n FROM users WHERE role = ?').get(req.params.id) as { n: number };
  if (userCount.n > 0) { res.status(400).json({ error: '该角色下仍有用户，无法删除' }); return; }

  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'DELETE', 'Role', req.params.id, `删除角色 ${role.name}`);
  res.json({ ok: true });
});

export default router;
