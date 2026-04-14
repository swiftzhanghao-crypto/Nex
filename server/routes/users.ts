import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, requireSelfOrRole, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';

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

function getUserName(db: any, userId: string): string {
  const row = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  return row?.name || '';
}

router.get('/', checkPermission('user', 'list'), (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM users ORDER BY name').all();
  res.json(rows.map(toUser));
});

router.get('/meta/departments', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM departments').all() as any[];
  res.json(rows.map(r => ({ id: r.id, name: r.name, description: r.description, parentId: r.parent_id })));
});

router.get('/meta/roles', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM roles').all() as any[];
  res.json(rows.map(r => ({
    id: r.id, name: r.name, description: r.description,
    permissions: safeJsonParse(r.permissions, []), isSystem: !!r.is_system,
    rowPermissions: safeJsonParse(r.row_permissions, []),
    columnPermissions: safeJsonParse(r.column_permissions, []),
  })));
});

router.get('/:id', checkPermission('user', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json(toUser(row));
});

router.put('/:id', requireSelfOrRole('Admin'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, email, phone, role, userType, status, departmentId } = req.body;

  const isSelf = req.user!.userId === req.params.id;
  const isAdmin = req.user!.role === 'Admin';

  if (isSelf && !isAdmin) {
    if (role || userType || status || departmentId) {
      res.status(403).json({ error: '非管理员不能修改角色、类型、状态或部门' });
      return;
    }
    db.prepare(`UPDATE users SET name=?, phone=?, updated_at=datetime('now') WHERE id=?`)
      .run(name, phone ?? null, req.params.id);
  } else {
    db.prepare(`
      UPDATE users SET name=?, email=?, phone=?, role=?, user_type=?, status=?, department_id=?, updated_at=datetime('now')
      WHERE id=?
    `).run(name, email, phone ?? null, role, userType ?? 'Internal', status ?? 'Active', departmentId ?? null, req.params.id);
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(toUser(row));
});

// --- Roles ---
function safeJsonParse(str: string | null | undefined, fallback: any = {}) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

router.put('/meta/roles/:id', checkPermission('role', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, columnPermissions } = req.body;
  db.prepare(`UPDATE roles SET name=?, description=?, permissions=?, row_permissions=?, column_permissions=? WHERE id=?`)
    .run(name, description, JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []), JSON.stringify(columnPermissions ?? []), req.params.id);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Role', req.params.id, `更新角色 ${name}`);

  res.json({ ok: true });
});

router.post('/meta/roles', checkPermission('role', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, columnPermissions } = req.body;
  const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)`)
    .run(id, name, description || '', JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []), JSON.stringify(columnPermissions ?? []));

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Role', id, `创建角色 ${name}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
  res.status(201).json({
    id: row.id, name: row.name, description: row.description,
    permissions: safeJsonParse(row.permissions, []), isSystem: false,
    rowPermissions: safeJsonParse(row.row_permissions, []),
    columnPermissions: safeJsonParse(row.column_permissions, []),
  });
});

router.post('/meta/roles/:id/copy', checkPermission('role', 'copy'), (req: AuthRequest, res) => {
  const db = getDb();
  const source = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!source) { res.status(404).json({ error: '源角色不存在' }); return; }

  const newId = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newName = req.body.name || `${source.name} (副本)`;

  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, 0, ?, ?)`)
    .run(newId, newName, source.description, source.permissions, source.row_permissions, source.column_permissions);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'COPY', 'Role', newId, `从 ${source.name} 复制角色 ${newName}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(newId) as any;
  res.status(201).json({
    id: row.id, name: row.name, description: row.description,
    permissions: safeJsonParse(row.permissions, []), isSystem: false,
    rowPermissions: safeJsonParse(row.row_permissions, []),
    columnPermissions: safeJsonParse(row.column_permissions, []),
  });
});

router.delete('/meta/roles/:id', checkPermission('role', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!role) { res.status(404).json({ error: '角色不存在' }); return; }
  if (role.is_system) { res.status(400).json({ error: '系统内置角色不可删除' }); return; }

  const userCount = db.prepare('SELECT COUNT(*) as n FROM users WHERE role = ?').get(req.params.id) as { n: number };
  if (userCount.n > 0) { res.status(400).json({ error: '该角色下仍有用户，无法删除' }); return; }

  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Role', req.params.id, `删除角色 ${role.name}`);
  res.json({ ok: true });
});

export default router;
