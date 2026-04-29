import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { safeJsonParse, getUserName } from '../utils.ts';

const router = Router();
router.use(authMiddleware);

/** 全局 Admin 或该应用的 is_admin=1 成员可以管理应用配置 */
function requireSpaceAdmin(spaceId: string, userId: string, userRoles: string[]): boolean {
  if (userRoles.includes('Admin')) return true;
  const db = getDb();
  const row = db.prepare('SELECT is_admin FROM space_members WHERE space_id = ? AND user_id = ?')
    .get(spaceId, userId) as any;
  return row && row.is_admin === 1;
}

function toSpace(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    permTree: safeJsonParse(row.perm_tree, [] as any[]),
    resourceConfig: safeJsonParse(row.resource_config, [] as any[]),
    columnConfig: safeJsonParse(row.column_config, [] as any[]),
    sortOrder: row.sort_order,
  };
}

function toSpaceRole(row: any) {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    description: row.description,
    permissions: safeJsonParse(row.permissions, [] as string[]),
    rowPermissions: safeJsonParse(row.row_permissions, [] as any[]),
    rowLogic: safeJsonParse(row.row_logic, {} as any),
    columnPermissions: safeJsonParse(row.column_permissions, [] as any[]),
    sortOrder: row.sort_order,
  };
}

// ===== Spaces =====

router.get('/', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM spaces ORDER BY sort_order ASC, rowid ASC').all() as any[];
  res.json(rows.map(toSpace));
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM spaces WHERE id = ?').get(req.params.id) as any;
  if (!row) { res.status(404).json({ error: '应用不存在' }); return; }
  res.json(toSpace(row));
});

router.post('/', (req: AuthRequest, res) => {
  if (!req.user!.roles.includes('Admin')) {
    res.status(403).json({ error: '只有全局管理员可以创建应用' });
    return;
  }
  const db = getDb();
  const { name, description, icon, permTree, resourceConfig, columnConfig, adminUserId } = req.body;
  if (!name) { res.status(400).json({ error: '应用名称必填' }); return; }
  const targetAdminId = adminUserId || req.user!.userId;
  const adminExists = db.prepare('SELECT id FROM users WHERE id = ?').get(targetAdminId) as any;
  if (!adminExists) { res.status(400).json({ error: '指定的应用管理员用户不存在' }); return; }

  const id = `space_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  db.prepare(`
    INSERT INTO spaces (id, name, description, icon, perm_tree, resource_config, column_config, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', icon || 'Box',
    JSON.stringify(permTree ?? []),
    JSON.stringify(resourceConfig ?? []),
    JSON.stringify(columnConfig ?? []),
    0);

  const adminRoleId = genId('sr');
  db.prepare(`
    INSERT INTO space_roles (id, space_id, name, description, permissions, row_permissions, row_logic, column_permissions, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminRoleId, id, '应用管理员', '拥有该应用内所有权限，可管理角色、成员与配置', '[]', '[]', '{}', '[]', 0);

  const memberId = genId('sm');
  db.prepare(`
    INSERT INTO space_members (id, space_id, user_id, role_id, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).run(memberId, id, targetAdminId, adminRoleId, 1);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Space', id, `创建应用 ${name}`);
  const row = db.prepare('SELECT * FROM spaces WHERE id = ?').get(id) as any;
  res.status(201).json(toSpace(row));
});

router.put('/:id', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权管理该应用' });
    return;
  }
  const db = getDb();
  const current = db.prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId) as any;
  if (!current) { res.status(404).json({ error: '应用不存在' }); return; }
  const { name, description, icon, permTree, resourceConfig, columnConfig } = req.body;
  db.prepare(`
    UPDATE spaces
    SET name=?, description=?, icon=?, perm_tree=?, resource_config=?, column_config=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    name ?? current.name,
    description ?? current.description,
    icon ?? current.icon,
    permTree !== undefined ? JSON.stringify(permTree) : current.perm_tree,
    resourceConfig !== undefined ? JSON.stringify(resourceConfig) : current.resource_config,
    columnConfig !== undefined ? JSON.stringify(columnConfig) : current.column_config,
    spaceId,
  );
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Space', spaceId, `更新应用 ${name ?? current.name}`);
  const row = db.prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId) as any;
  res.json(toSpace(row));
});

router.delete('/:id', (req: AuthRequest, res) => {
  if (!req.user!.roles.includes('Admin')) {
    res.status(403).json({ error: '只有全局管理员可以删除应用' });
    return;
  }
  const db = getDb();
  const row = db.prepare('SELECT name FROM spaces WHERE id = ?').get(req.params.id) as any;
  if (!row) { res.status(404).json({ error: '应用不存在' }); return; }
  db.prepare('DELETE FROM spaces WHERE id = ?').run(req.params.id);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Space', req.params.id, `删除应用 ${row.name}`);
  res.json({ ok: true });
});

// ===== Space Roles =====

router.get('/:id/roles', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM space_roles WHERE space_id = ? ORDER BY sort_order ASC, rowid ASC')
    .all(req.params.id) as any[];
  res.json(rows.map(toSpaceRole));
});

router.post('/:id/roles', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权在该应用创建角色' });
    return;
  }
  const db = getDb();
  const { name, description, permissions, rowPermissions, rowLogic, columnPermissions } = req.body;
  if (!name) { res.status(400).json({ error: '角色名称必填' }); return; }
  const id = `srole_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO space_roles (id, space_id, name, description, permissions, row_permissions, row_logic, column_permissions, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, spaceId, name, description || '',
    JSON.stringify(permissions ?? []),
    JSON.stringify(rowPermissions ?? []),
    JSON.stringify(rowLogic ?? {}),
    JSON.stringify(columnPermissions ?? []),
    999,
  );
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'SpaceRole', id, `应用 ${spaceId} 创建角色 ${name}`);
  const row = db.prepare('SELECT * FROM space_roles WHERE id = ?').get(id) as any;
  res.status(201).json(toSpaceRole(row));
});

router.put('/:id/roles/:roleId', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权修改该应用的角色' });
    return;
  }
  const db = getDb();
  const current = db.prepare('SELECT * FROM space_roles WHERE id = ? AND space_id = ?')
    .get(req.params.roleId, spaceId) as any;
  if (!current) { res.status(404).json({ error: '角色不存在' }); return; }
  const { name, description, permissions, rowPermissions, rowLogic, columnPermissions } = req.body;
  db.prepare(`
    UPDATE space_roles
    SET name=?, description=?, permissions=?, row_permissions=?, row_logic=?, column_permissions=?
    WHERE id=? AND space_id=?
  `).run(
    name ?? current.name,
    description ?? current.description,
    permissions !== undefined ? JSON.stringify(permissions) : current.permissions,
    rowPermissions !== undefined ? JSON.stringify(rowPermissions) : current.row_permissions,
    rowLogic !== undefined ? JSON.stringify(rowLogic) : current.row_logic,
    columnPermissions !== undefined ? JSON.stringify(columnPermissions) : current.column_permissions,
    req.params.roleId, spaceId,
  );
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'SpaceRole', req.params.roleId, `更新应用角色 ${name ?? current.name}`);
  const row = db.prepare('SELECT * FROM space_roles WHERE id = ?').get(req.params.roleId) as any;
  res.json(toSpaceRole(row));
});

router.delete('/:id/roles/:roleId', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权删除该应用的角色' });
    return;
  }
  const db = getDb();
  const roleRow = db.prepare('SELECT * FROM space_roles WHERE id = ? AND space_id = ?')
    .get(req.params.roleId, spaceId) as any;
  if (!roleRow) {
    res.status(404).json({ error: '角色不存在' });
    return;
  }
  if (roleRow.sort_order === 0 && roleRow.name === '应用管理员') {
    res.status(400).json({ error: '应用管理员角色不可删除' });
    return;
  }
  const memberCount = db.prepare('SELECT COUNT(*) AS n FROM space_members WHERE role_id = ?')
    .get(req.params.roleId) as { n: number };
  if (memberCount.n > 0) {
    res.status(400).json({ error: '该角色仍有成员使用，无法删除' });
    return;
  }
  db.prepare('DELETE FROM space_roles WHERE id = ? AND space_id = ?')
    .run(req.params.roleId, spaceId);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'SpaceRole', req.params.roleId, `删除应用角色`);
  res.json({ ok: true });
});

// ===== Space Members =====

router.get('/:id/members', (req, res) => {
  const rows = getDb().prepare(`
    SELECT sm.id, sm.space_id, sm.user_id, sm.role_id, sm.is_admin,
           u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar, u.department_id,
           sr.name AS role_name
    FROM space_members sm
    LEFT JOIN users u ON u.id = sm.user_id
    LEFT JOIN space_roles sr ON sr.id = sm.role_id
    WHERE sm.space_id = ?
    ORDER BY sm.is_admin DESC, u.name ASC
  `).all(req.params.id) as any[];
  res.json(rows.map(r => ({
    id: r.id,
    spaceId: r.space_id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    userAvatar: r.user_avatar,
    departmentId: r.department_id,
    roleId: r.role_id,
    roleName: r.role_name,
    isAdmin: r.is_admin === 1,
  })));
});

router.post('/:id/members', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权管理该应用成员' });
    return;
  }
  const db = getDb();
  const { userId, roleId, isAdmin } = req.body as { userId?: string; roleId?: string; isAdmin?: boolean };
  if (!userId || !roleId) { res.status(400).json({ error: 'userId 与 roleId 必填' }); return; }
  const existing = db.prepare('SELECT id FROM space_members WHERE space_id = ? AND user_id = ?')
    .get(spaceId, userId) as any;
  if (existing) { res.status(400).json({ error: '该用户已是应用成员' }); return; }
  const id = `sm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO space_members (id, space_id, user_id, role_id, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, spaceId, userId, roleId, isAdmin ? 1 : 0);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'SpaceMember', id, `应用 ${spaceId} 添加成员 ${userId}`);
  res.status(201).json({ id, spaceId, userId, roleId, isAdmin: !!isAdmin });
});

router.put('/:id/members/:memberId', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权管理该应用成员' });
    return;
  }
  const db = getDb();
  const current = db.prepare('SELECT * FROM space_members WHERE id = ? AND space_id = ?')
    .get(req.params.memberId, spaceId) as any;
  if (!current) { res.status(404).json({ error: '成员不存在' }); return; }
  const { roleId, isAdmin } = req.body as { roleId?: string; isAdmin?: boolean };
  db.prepare(`UPDATE space_members SET role_id=?, is_admin=? WHERE id=? AND space_id=?`)
    .run(roleId ?? current.role_id, isAdmin === undefined ? current.is_admin : (isAdmin ? 1 : 0),
      req.params.memberId, spaceId);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'SpaceMember', req.params.memberId, `更新应用成员`);
  res.json({ ok: true });
});

router.delete('/:id/members/:memberId', (req: AuthRequest, res) => {
  const spaceId = String(req.params.id);
  if (!requireSpaceAdmin(spaceId, req.user!.userId, req.user!.roles)) {
    res.status(403).json({ error: '无权管理该应用成员' });
    return;
  }
  const db = getDb();
  db.prepare('DELETE FROM space_members WHERE id = ? AND space_id = ?')
    .run(req.params.memberId, spaceId);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'SpaceMember', req.params.memberId, `移除应用成员`);
  res.json({ ok: true });
});

export default router;
