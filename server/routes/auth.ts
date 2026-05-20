import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.ts';
import {
  signToken, signRefreshToken, verifyRefreshToken, verifyPassword, hashPassword,
  authMiddleware, parseCookies, SSO_COOKIE_NAME,
  deleteSsoSession, clearSsoCookie, revokeToken,
  type AuthRequest,
} from '../auth.ts';
import { validateBody, loginSchema, refreshTokenBodySchema } from '../validate.ts';
import { parseRoles } from './users.ts';

const router = Router();

router.post('/login', validateBody(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: '邮箱或密码错误' });
    return;
  }

  if (!user.password_hash.includes(':')) {
    const upgraded = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgraded, user.id);
  }

  const roles = parseRoles(user.role);
  const payload = { userId: user.id, roles };
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);
  res.json({
    token,
    refreshToken,
    user: {
      id: user.id, accountId: user.account_id, name: user.name,
      email: user.email, phone: user.phone, roles,
      userType: user.user_type, status: user.status,
      avatar: user.avatar, departmentId: user.department_id,
      monthBadge: user.month_badge,
    },
  });
});

router.post('/refresh', validateBody(refreshTokenBodySchema), (req, res) => {
  try {
    const payload = verifyRefreshToken(req.body.refreshToken);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    const roles = parseRoles(user.role);
    const token = signToken({ userId: user.id, roles });
    res.json({ token });
  } catch {
    res.status(401).json({ error: '无效的 refresh token' });
  }
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

router.post('/logout', (req: AuthRequest, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const decoded = jwt.decode(header.slice(7)) as { jti?: string } | null;
    if (decoded?.jti) revokeToken(decoded.jti);
  }

  const cookies = parseCookies(req);
  const sid = cookies[SSO_COOKIE_NAME];
  if (sid) {
    deleteSsoSession(sid);
    clearSsoCookie(res);
  }
  res.json({ code: 0, msg: '已退出' });
});

export default router;
