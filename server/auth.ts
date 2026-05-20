import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from './db.ts';
import { createLogger } from './logger.ts';

const log = createLogger('auth');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (IS_PRODUCTION) {
    log.error('生产环境必须设置长度 ≥16 的 JWT_SECRET 环境变量');
    process.exit(1);
  }
  const random = crypto.randomBytes(48).toString('hex');
  log.warn('JWT_SECRET 未配置，已生成本次进程临时密钥（仅开发可用，重启后旧 token 失效）');
  return random;
})();

const TOKEN_EXPIRY: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'] | undefined) || '24h';

const REFRESH_TOKEN_EXPIRY: SignOptions['expiresIn'] = '7d';

const tokenBlacklist = new Set<string>();

// ── JWT ──────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  roles: string[];
  jti?: string;
  type?: 'access' | 'refresh';
}

interface JwtClaims extends JwtPayload {
  jti: string;
  type: 'access' | 'refresh';
}

function stripClaims(claims: JwtClaims): JwtPayload {
  return { userId: claims.userId, roles: claims.roles };
}

export function revokeToken(jti: string): void {
  tokenBlacklist.add(jti);
}

export function isTokenRevoked(jti: string): boolean {
  return tokenBlacklist.has(jti);
}

export function signToken(payload: JwtPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti, type: 'access' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

export function signRefreshToken(payload: JwtPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

export function verifyToken(token: string): JwtPayload {
  const claims = jwt.verify(token, JWT_SECRET) as JwtClaims;
  if (claims.type === 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }
  if (claims.jti && isTokenRevoked(claims.jti)) {
    throw new jwt.JsonWebTokenError('Token revoked');
  }
  return stripClaims(claims);
}

export function verifyRefreshToken(token: string): JwtPayload {
  const claims = jwt.verify(token, JWT_SECRET) as JwtClaims;
  if (claims.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }
  if (claims.jti && isTokenRevoked(claims.jti)) {
    throw new jwt.JsonWebTokenError('Token revoked');
  }
  return stripClaims(claims);
}

// ── Password hashing ─────────────────────────────────────────────────────────

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

// ── SSO Session (Cookie + sid) ───────────────────────────────────────────────

export const SSO_COOKIE_NAME = process.env.COOKIE_NAME || 'itab-sid';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
function parseSameSite(raw: string | undefined): 'lax' | 'strict' | 'none' {
  if (raw === 'strict' || raw === 'none' || raw === 'lax') return raw;
  return 'lax';
}
const COOKIE_SAMESITE = parseSameSite(process.env.COOKIE_SAMESITE);

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  const result: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

interface CreateSessionOpts {
  wpsUserId?: string;
  wpsAccessToken?: string;
  wpsRefreshToken?: string;
  wpsTokenExpiresAt?: string;
}

export function createSsoSession(userId: string, opts: CreateSessionOpts = {}): string {
  const db = getDb();
  const sid = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  db.prepare(
    `INSERT INTO sso_sessions (sid, user_id, wps_user_id, wps_access_token, wps_refresh_token, wps_token_expires_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    sid, userId,
    opts.wpsUserId ?? null,
    opts.wpsAccessToken ?? null,
    opts.wpsRefreshToken ?? null,
    opts.wpsTokenExpiresAt ?? null,
    expiresAt,
  );
  return sid;
}

export function getSsoSession(sid: string): { userId: string; wpsUserId?: string } | null {
  const db = getDb();
  const row = db.prepare(
    `SELECT user_id, wps_user_id FROM sso_sessions WHERE sid = ? AND expires_at > datetime('now')`,
  ).get(sid) as { user_id: string; wps_user_id: string | null } | undefined;
  if (!row) return null;
  return { userId: row.user_id, wpsUserId: row.wps_user_id ?? undefined };
}

export function deleteSsoSession(sid: string): void {
  getDb().prepare('DELETE FROM sso_sessions WHERE sid = ?').run(sid);
}

export function deleteSsoSessionsByUser(userId: string): void {
  getDb().prepare('DELETE FROM sso_sessions WHERE user_id = ?').run(userId);
}

export function cleanupExpiredSessions(): void {
  getDb().prepare("DELETE FROM sso_sessions WHERE expires_at <= datetime('now')").run();
}

export function setSsoCookie(res: Response, sid: string): void {
  const parts = [
    `${SSO_COOKIE_NAME}=${encodeURIComponent(sid)}`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    `SameSite=${COOKIE_SAMESITE}`,
  ];
  if (COOKIE_SECURE) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSsoCookie(res: Response): void {
  const parts = [
    `${SSO_COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=0`,
    `SameSite=${COOKIE_SAMESITE}`,
  ];
  if (COOKIE_SECURE) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// ── Auth Middleware (dual-mode: JWT Bearer + SSO Cookie) ─────────────────────

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

function parseRolesField(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === 'string') : [raw];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // 1) Try JWT Bearer token first
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
      next();
      return;
    } catch { /* fall through to cookie */ }
  }

  // 2) Try SSO session cookie
  const cookies = parseCookies(req);
  const sid = cookies[SSO_COOKIE_NAME];
  if (sid) {
    const session = getSsoSession(sid);
    if (session) {
      const db = getDb();
      const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(session.userId) as { id: string; role: string } | undefined;
      if (user) {
        req.user = { userId: user.id, roles: parseRolesField(user.role) };
        next();
        return;
      }
    }
  }

  res.status(401).json({ error: '未提供认证令牌' });
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
