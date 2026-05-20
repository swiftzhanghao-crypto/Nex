import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { safePagination } from '../utils.ts';

type SqlParam = string | number;

interface AuditLogRow {
  id: number;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id: string;
  detail: string | null;
  created_at: string;
}

const router = Router();
router.use(authMiddleware);

router.get('/', checkPermission('audit', 'list'), (req, res) => {
  const { resource, action, userId, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: SqlParam[] = [];

  if (resource) { sql += ' AND resource = ?'; params.push(resource); }
  if (userId) { sql += ' AND user_id = ?'; params.push(userId); }
  if (action) { sql += ' AND action = ?'; params.push(action); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params) as AuditLogRow[];
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      resource: r.resource,
      resourceId: r.resource_id,
      detail: r.detail,
      createdAt: r.created_at,
    })),
    total,
    page: pageNum,
    size: limit,
  });
});

export default router;
