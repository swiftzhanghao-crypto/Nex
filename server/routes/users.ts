import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, requireSelfOrRole, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { parseRoles, getUserName, safePagination, safeJsonParse } from '../utils.ts';

// 重新导出 parseRoles 以兼容老的 import 路径（如 server/routes/auth.ts）
export { parseRoles };

const router = Router();
router.use(authMiddleware);

function toUser(row: any) {
  return {
    id: row.id, accountId: row.account_id, name: row.name,
    email: row.email, phone: row.phone, roles: parseRoles(row.role),
    userType: row.user_type, status: row.status,
    avatar: row.avatar, departmentId: row.department_id,
    monthBadge: row.month_badge,
  };
}

router.get('/', checkPermission('user', 'list'), (req, res) => {
  const { search, role, status, departmentId, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  const conds: string[] = ['1=1'];
  const params: any[] = [];

  if (role) { conds.push("(role = ? OR role LIKE '%\"' || ? || '\"%')"); params.push(role, role); }
  if (status) { conds.push('status = ?'); params.push(status); }
  if (departmentId) { conds.push('department_id = ?'); params.push(departmentId); }
  if (search && search.trim()) {
    conds.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR account_id LIKE ?)');
    const k = `%${search.trim()}%`;
    params.push(k, k, k, k);
  }

  const whereSql = ' WHERE ' + conds.join(' AND ');
  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM users${whereSql}`).get(...params) as { c: number };
  const total = totalRow?.c ?? 0;

  const { limit, offset, pageNum } = safePagination(page, size);
  const rows = db.prepare(`SELECT * FROM users${whereSql} ORDER BY sort_order ASC, rowid ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  res.json({ data: rows.map(toUser), total, page: pageNum, size: limit });
});

router.put('/order', checkPermission('user', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const { orderedIds } = req.body as { orderedIds?: unknown };
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
    res.status(400).json({ error: 'orderedIds 必须为字符串数组' });
    return;
  }
  const update = db.prepare('UPDATE users SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => update.run(idx, id));
  });
  try {
    tx(orderedIds as string[]);
    const userName = getUserName(db, req.user!.userId);
    db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(req.user!.userId, userName, 'REORDER', 'User', '-', `重排用户顺序`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: '保存用户顺序失败' });
  }
});

router.get('/meta/departments', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM departments').all() as any[];
  res.json(rows.map(r => ({ id: r.id, name: r.name, description: r.description, parentId: r.parent_id })));
});

router.get('/meta/roles', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM roles ORDER BY sort_order ASC, rowid ASC').all() as any[];
  res.json(rows.map(roleRowToClient));
});

router.put('/meta/roles-order', checkPermission('role', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const { orderedIds } = req.body as { orderedIds?: unknown };
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
    res.status(400).json({ error: 'orderedIds 必须为字符串数组' });
    return;
  }
  const update = db.prepare('UPDATE roles SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => update.run(idx, id));
  });
  try {
    tx(orderedIds as string[]);
    const userName = getUserName(db, req.user!.userId);
    db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(req.user!.userId, userName, 'REORDER', 'Role', '-', `重排角色顺序: ${(orderedIds as string[]).join(',')}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: '保存角色顺序失败' });
  }
});

router.get('/:id', checkPermission('user', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json(toUser(row));
});

router.put('/:id', requireSelfOrRole('Admin'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, email, phone, roles, role, userType, status, departmentId } = req.body;
  // 兼容前端新旧版本：优先 roles（数组），其次 role（旧单值）
  const rolesVal = roles ? JSON.stringify(Array.isArray(roles) ? roles : [roles])
    : role ? JSON.stringify(Array.isArray(role) ? role : [role])
    : undefined;

  const isSelf = req.user!.userId === req.params.id;
  const isAdmin = req.user!.roles.includes('Admin');

  if (isSelf && !isAdmin) {
    if (rolesVal || userType || status || departmentId) {
      res.status(403).json({ error: '非管理员不能修改角色、类型、状态或部门' });
      return;
    }
    db.prepare(`UPDATE users SET name=?, phone=?, updated_at=datetime('now') WHERE id=?`)
      .run(name, phone ?? null, req.params.id);
  } else {
    db.prepare(`
      UPDATE users SET name=?, email=?, phone=?, role=?, user_type=?, status=?, department_id=?, updated_at=datetime('now')
      WHERE id=?
    `).run(name, email, phone ?? null, rolesVal ?? '["Sales"]', userType ?? 'Internal', status ?? 'Active', departmentId ?? null, req.params.id);
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json(toUser(row));
});

// --- Roles ---
function roleRowToClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: safeJsonParse<string[]>(row.permissions, []),
    isSystem: !!row.is_system,
    rowPermissions: safeJsonParse<unknown[]>(row.row_permissions, []),
    rowLogic: safeJsonParse<Record<string, unknown>>(row.row_logic, {}),
    columnPermissions: safeJsonParse<unknown[]>(row.column_permissions, []),
    appPermissions: safeJsonParse<Record<string, unknown>>(row.app_permissions, {}),
  };
}

router.put('/meta/roles/:id', checkPermission('role', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, rowLogic, columnPermissions, appPermissions } = req.body;
  const result = db.prepare(`UPDATE roles SET name=?, description=?, permissions=?, row_permissions=?, row_logic=?, column_permissions=?, app_permissions=? WHERE id=?`)
    .run(
      name,
      description,
      JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []),
      JSON.stringify(rowLogic ?? {}),
      JSON.stringify(columnPermissions ?? []),
      JSON.stringify(appPermissions ?? {}),
      req.params.id,
    );
  if (result.changes === 0) {
    res.status(404).json({ error: '角色不存在' });
    return;
  }

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Role', req.params.id, `更新角色 ${name}`);

  // 与 POST/COPY 及空间角色 PUT 一致：返回服务端规范化后的完整对象，方便客户端直接同步
  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  res.json(roleRowToClient(row));
});

router.post('/meta/roles', checkPermission('role', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const { name, description, permissions, rowPermissions, rowLogic, columnPermissions, appPermissions } = req.body;
  const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, row_logic, column_permissions, app_permissions) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`)
    .run(
      id, name, description || '', JSON.stringify(permissions ?? []),
      JSON.stringify(rowPermissions ?? []), JSON.stringify(rowLogic ?? {}),
      JSON.stringify(columnPermissions ?? []), JSON.stringify(appPermissions ?? {}),
    );

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Role', id, `创建角色 ${name}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as any;
  res.status(201).json({ ...roleRowToClient(row), isSystem: false });
});

router.post('/meta/roles/:id/copy', checkPermission('role', 'copy'), (req: AuthRequest, res) => {
  const db = getDb();
  const source = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!source) { res.status(404).json({ error: '源角色不存在' }); return; }

  const newId = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newName = req.body.name || `${source.name} (副本)`;

  const rl = source.row_logic != null ? source.row_logic : '{}';
  const ap = source.app_permissions != null ? source.app_permissions : '{}';
  db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, row_logic, column_permissions, app_permissions) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`)
    .run(newId, newName, source.description, source.permissions, source.row_permissions, rl, source.column_permissions, ap);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'COPY', 'Role', newId, `从 ${source.name} 复制角色 ${newName}`);

  const row = db.prepare('SELECT * FROM roles WHERE id = ?').get(newId) as any;
  res.status(201).json({ ...roleRowToClient(row), isSystem: false });
});

router.delete('/meta/roles/:id', checkPermission('role', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id) as any;
  if (!role) { res.status(404).json({ error: '角色不存在' }); return; }
  if (req.params.id === 'Admin') { res.status(400).json({ error: '管理员角色不可删除' }); return; }

  const userCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = ? OR role LIKE '%\"' || ? || '\"%'").get(req.params.id, req.params.id) as { n: number };
  if (userCount.n > 0) { res.status(400).json({ error: '该角色下仍有用户，无法删除' }); return; }

  db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Role', req.params.id, `删除角色 ${role.name}`);
  res.json({ ok: true });
});

export default router;
