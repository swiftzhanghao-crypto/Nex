import { Router } from 'express';
import { getDb } from '../db.ts';
import { signToken, verifyPassword, hashPassword, authMiddleware, type AuthRequest } from '../auth.ts';
import { parseRoles } from './users.ts';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: '请提供邮箱和密码' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  // Upgrade legacy SHA-256 hash to scrypt on successful login
  if (!user.password_hash.includes(':')) {
    const upgraded = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgraded, user.id);
  }

  const roles = parseRoles(user.role);
  const token = signToken({ userId: user.id, roles });
  res.json({
    token,
    user: {
      id: user.id, accountId: user.account_id, name: user.name,
      email: user.email, phone: user.phone, roles,
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
    email: user.email, phone: user.phone, roles: parseRoles(user.role),
    userType: user.user_type, status: user.status,
    avatar: user.avatar, departmentId: user.department_id,
    monthBadge: user.month_badge,
  });
});

export default router;
