/**
 * WPS 365 企业自建应用 OAuth2（Cookie+sid 方案）
 *
 * 遵循 itab-wps365-auth skill 设计：
 * - 凭证零下放：access_token / refresh_token 永不出后端
 * - 登录态通过 HttpOnly Cookie `itab-sid` 维持
 * - 回调成功后直接 302 到前端目标页（不在 URL 传递 JWT）
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.ts';
import {
  hashPassword,
  createSsoSession,
  setSsoCookie,
  clearSsoCookie,
  deleteSsoSession,
  parseCookies,
  SSO_COOKIE_NAME,
  getSsoSession,
  cleanupExpiredSessions,
  type AuthRequest,
} from '../auth.ts';
import { parseRoles } from '../utils.ts';

const router = Router();

const WPS_BASE = (process.env.WPS_OPENAPI_BASE || 'https://openapi.wps.cn').replace(/\/$/, '');
const WPS_APP_ID = process.env.WPS_APP_ID || '';
const WPS_APP_SECRET = process.env.WPS_APP_SECRET || '';
const WPS_REDIRECT_URI = process.env.WPS_REDIRECT_URI || '';
const WPS_SCOPES = (process.env.WPS_SCOPES || 'kso.user_base.read')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const FRONTEND_URL = (process.env.WPS_SSO_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function wpsSsoEnabled(): boolean {
  return !!(WPS_APP_ID && WPS_APP_SECRET && WPS_REDIRECT_URI);
}

// --- OAuth state 防 CSRF（内存 Map，与 skill 的 preauth cookie 同层作用） ---
type StateEntry = { redirect: string; exp: number };
const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupStates() {
  const now = Date.now();
  for (const [k, v] of stateStore) {
    if (v.exp < now) stateStore.delete(k);
  }
}

function redirectToFrontendError(res: Response, error: string) {
  const q = new URLSearchParams({ error }).toString();
  res.redirect(302, `${FRONTEND_URL}/#/sso-callback?${q}`);
}

// --- 轻量探活：前端 LoginModal 用它判断 SSO 是否可用 ---
router.get('/wps/status', (_req, res) => {
  res.json({ enabled: wpsSsoEnabled() });
});

// --- 发起登录：302 跳 WPS 授权页 ---
router.get('/wps/login', (req, res) => {
  if (!wpsSsoEnabled()) {
    res.status(503).json({ error: 'WPS SSO 未配置（需 WPS_APP_ID / WPS_APP_SECRET / WPS_REDIRECT_URI）' });
    return;
  }
  cleanupStates();
  let redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/';
  if (!redirect.startsWith('/') || redirect.startsWith('//')) redirect = '/';
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { redirect, exp: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    client_id: WPS_APP_ID,
    response_type: 'code',
    redirect_uri: WPS_REDIRECT_URI,
    scope: WPS_SCOPES.join(','),
    state,
  });
  res.redirect(302, `${WPS_BASE}/oauth2/auth?${params.toString()}`);
});

// --- WPS Token 交换 ---
interface WpsTokenJson {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function exchangeCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: WPS_APP_ID,
    client_secret: WPS_APP_SECRET,
    code,
    redirect_uri: WPS_REDIRECT_URI,
  });
  const r = await fetch(`${WPS_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const j = (await r.json()) as WpsTokenJson;
  if (!r.ok || j.error || !j.access_token) {
    throw new Error(j.error_description || j.error || `token HTTP ${r.status}`);
  }
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_in: typeof j.expires_in === 'number' ? j.expires_in : 7200,
  };
}

// --- 获取 WPS 用户信息 ---
interface WpsUserData {
  id: string;
  user_name: string;
  avatar?: string;
  company_id?: string;
  email?: string;
  phone?: string;
  department_name?: string;
}

async function fetchWpsCurrentUser(accessToken: string): Promise<WpsUserData> {
  const r = await fetch(`${WPS_BASE}/v7/users/current`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = (await r.json()) as { code?: number; msg?: string; data?: any };
  if (!r.ok || j.code !== 0 || !j.data?.id) {
    throw new Error(j.msg || '获取 WPS 用户信息失败');
  }
  const d = j.data;
  return {
    id: d.id,
    user_name: d.user_name || d.name || d.nick_name || '',
    avatar: d.avatar || d.avatar_url,
    company_id: d.company_id,
    email: d.email,
    phone: d.phone || d.mobile,
    department_name: d.department_name || d.dept_name,
  };
}

// --- 本地用户查找/创建 ---
function safeEmailLocal(wpsUserId: string): string {
  return wpsUserId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'user';
}

function findOrCreateLocalUser(wpsUser: WpsUserData): { id: string; role: string; isNew: boolean } {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE wps_user_id = ?').get(wpsUser.id) as any;
  if (existing) {
    // 每次 SSO 登录都同步最新信息
    const updates: string[] = [];
    const params: any[] = [];

    if (wpsUser.user_name && wpsUser.user_name !== existing.name) {
      updates.push('name = ?');
      params.push(wpsUser.user_name);
    }
    if (wpsUser.avatar) {
      updates.push('avatar = ?');
      params.push(wpsUser.avatar);
    }
    if (wpsUser.phone && !existing.phone) {
      updates.push('phone = ?');
      params.push(wpsUser.phone);
    }
    if (wpsUser.email && existing.email?.endsWith('@sso.wps365.local')) {
      updates.push('email = ?');
      params.push(wpsUser.email);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(existing.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    return { id: existing.id, role: existing.role, isNew: false };
  }

  // 自动注册新用户
  const id = `u_wps_${wpsUser.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`;
  const email = wpsUser.email || `${safeEmailLocal(wpsUser.id)}@sso.wps365.local`;
  const accountId = String(10000000 + (Date.now() % 89999999)).padStart(8, '0');
  const roleJson = JSON.stringify(['Sales']);
  const passwordPlaceholder = hashPassword(crypto.randomBytes(24).toString('hex'));
  const displayName = wpsUser.user_name || 'WPS用户';

  db.prepare(
    `INSERT INTO users (id, account_id, name, email, phone, password_hash, role, user_type, status, avatar, department_id, month_badge, wps_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Internal', 'Active', ?, NULL, NULL, ?)`,
  ).run(id, accountId, displayName, email, wpsUser.phone ?? null, passwordPlaceholder, roleJson, wpsUser.avatar ?? null, wpsUser.id);

  console.log(`[wps-auth] 自动注册 SSO 用户: ${displayName} (${email}), wps_id=${wpsUser.id}`);
  return { id, role: roleJson, isNew: true };
}

// --- OAuth 回调：换票 → 建 session → 写 cookie → 302 回前端 ---
router.get('/wps/callback', async (req, res) => {
  if (!wpsSsoEnabled()) {
    redirectToFrontendError(res, 'WPS SSO 未配置');
    return;
  }

  const err = typeof req.query.error === 'string' ? req.query.error : '';
  if (err) {
    redirectToFrontendError(res, err);
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!code || !state) {
    redirectToFrontendError(res, '缺少 code 或 state');
    return;
  }

  cleanupStates();
  const entry = stateStore.get(state);
  stateStore.delete(state);
  if (!entry || entry.exp < Date.now()) {
    redirectToFrontendError(res, 'state 无效或已过期，请重新登录');
    return;
  }

  try {
    const tokenData = await exchangeCode(code);
    const wpsUser = await fetchWpsCurrentUser(tokenData.access_token);
    const { id: userId } = findOrCreateLocalUser(wpsUser);

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : undefined;

    const sid = createSsoSession(userId, {
      wpsUserId: wpsUser.id,
      wpsAccessToken: tokenData.access_token,
      wpsRefreshToken: tokenData.refresh_token,
      wpsTokenExpiresAt: expiresAt,
    });

    setSsoCookie(res, sid);

    // 直接 302 到前端目标路径，不再通过 sso-callback 中转传 JWT
    res.redirect(302, `${FRONTEND_URL}/#${entry.redirect}`);
  } catch (e: any) {
    console.error('[wps-auth/callback]', e?.message || e);
    redirectToFrontendError(res, e?.message || 'WPS 登录失败');
  }
});

// --- 登出：清 session + cookie ---
router.post('/wps/logout', (req: AuthRequest, res) => {
  const cookies = parseCookies(req);
  const sid = cookies[SSO_COOKIE_NAME];
  if (sid) {
    deleteSsoSession(sid);
  }
  clearSsoCookie(res);
  res.json({ code: 0, msg: '已退出' });
});

// --- 定时清理过期 session（每小时一次） ---
setInterval(() => {
  try { cleanupExpiredSessions(); } catch { /* noop */ }
}, 60 * 60 * 1000);

export default router;
