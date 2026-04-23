import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (IS_PRODUCTION) {
    console.error('[FATAL] 生产环境必须设置长度 ≥16 的 JWT_SECRET 环境变量');
    process.exit(1);
  }
  // 开发环境：每次启动生成临时强随机密钥（这样旧 token 启动后即失效，更安全也更明显）
  const random = crypto.randomBytes(48).toString('hex');
  console.warn('[auth] JWT_SECRET 未配置，已生成本次进程临时密钥（仅开发可用，重启后旧 token 失效）');
  return random;
})();

// 默认 24h；可通过 JWT_EXPIRES_IN 覆盖。建议生产环境配 refresh token 后再缩短。
const TOKEN_EXPIRY = (process.env.JWT_EXPIRES_IN as any) || '24h';

export interface JwtPayload {
  userId: string;
  roles: string[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// --- Password hashing (scrypt + salt, no external dependency) ---
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) {
    if (!stored) return false;
    const legacy = crypto.createHash('sha256').update(password).digest('hex');
    return stored === legacy;
  }
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const derivedBuf = Buffer.from(derived, 'hex');
    if (hashBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, derivedBuf);
  } catch {
    return false;
  }
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: '令牌无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.some(r => roles.includes(r))) {
      res.status(403).json({ error: '权限不足' });
      return;
    }
    next();
  };
}

export function requireSelfOrRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) { res.status(401).json({ error: '未认证' }); return; }
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const targetId = req.params.id;
    if (req.user.userId === targetId || userRoles.some(r => roles.includes(r))) {
      next();
      return;
    }
    res.status(403).json({ error: '只能修改本人信息，或需要管理员权限' });
  };
}
