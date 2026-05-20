import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: number;
  created_at: string;
}

const router = Router();
router.use(authMiddleware);

function toNotification(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

router.get('/', (req: AuthRequest, res) => {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
  ).all(req.user!.userId) as NotificationRow[];

  const unread = db.prepare(
    `SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0`,
  ).get(req.user!.userId) as { c: number };

  res.json({
    data: rows.map(toNotification),
    unreadCount: unread?.c ?? 0,
  });
});

router.put('/read-all', (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`)
    .run(req.user!.userId);
  res.json({ ok: true });
});

router.put('/:id/read', (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare(
    `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
  ).run(req.params.id, req.user!.userId);
  if (!changes) {
    res.status(404).json({ error: '通知不存在' });
    return;
  }
  res.json({ ok: true });
});

export default router;
