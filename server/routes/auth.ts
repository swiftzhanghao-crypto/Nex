import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.ts';
import { signToken, authMiddleware, type AuthRequest } from '../auth.ts';

const router = Router();

function hash(pw: string) { return crypto.createHash('sha256').update(pw).digest('hex'); }

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: '请提供邮箱和密码' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || user.password_hash !== hash(password)) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id, accountId: user.account_id, name: user.name,
      email: user.email, phone: user.phone, role: user.role,
      userType: user.user_type, status: user.status,
      avatar: user.avatar, departmentId: user.department_id,
      monthBadge: user.month_badge,
    },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) { res.status(404).json({ error: '用户不存在' }); return; }

  res.json({
    id: user.id, accountId: user.account_id, name: user.name,
    email: user.email, phone: user.phone, role: user.role,
    userType: user.user_type, status: user.status,
    avatar: user.avatar, departmentId: user.department_id,
    monthBadge: user.month_badge,
  });
});

export default router;
