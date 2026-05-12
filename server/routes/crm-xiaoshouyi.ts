/**
 * 销售易 CRM OAuth2 授权 + XOQL 数据查询
 *
 * 流程：浏览器 → GET /login → 302 到销售易授权页 → 用户同意 → 销售易 302 回 GET /callback
 *       → 后端用 code 换 token 并持久化 → 302 回前端 /#/crm-callback?status=ok
 *
 * 数据查询：GET /customers → XOQL 查 account 表 → 返回 JSON
 */
import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.ts';
import { authMiddleware, verifyToken, type AuthRequest, type JwtPayload } from '../auth.ts';

const router = Router();

const CRM_CLIENT_ID = process.env.CRM_XSY_CLIENT_ID || '';
const CRM_CLIENT_SECRET = process.env.CRM_XSY_CLIENT_SECRET || '';
const CRM_REDIRECT_URI = process.env.CRM_XSY_REDIRECT_URI || '';
const CRM_SCOPE = process.env.CRM_XSY_SCOPE || 'all';
const CRM_OAUTH_BASE = (process.env.CRM_XSY_OAUTH_BASE || 'https://login-sandbox.xiaoshouyi.com').replace(/\/$/, '');
const CRM_API_BASE = (process.env.CRM_XSY_API_BASE || 'https://api-sandbox.xiaoshouyi.com').replace(/\/$/, '');
const FRONTEND_URL = (process.env.WPS_SSO_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function crmEnabled(): boolean {
  return !!(CRM_CLIENT_ID && CRM_CLIENT_SECRET && CRM_REDIRECT_URI);
}

type StateEntry = { redirect: string; userId: string; exp: number };
const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanupStates() {
  const now = Date.now();
  for (const [k, v] of stateStore) {
    if (v.exp < now) stateStore.delete(k);
  }
}

// ---------- status: 检查是否配置 + 当前用户是否已绑定 ----------

router.get('/status', authMiddleware, (req: AuthRequest, res) => {
  const enabled = crmEnabled();
  let bound = false;
  if (enabled && req.user) {
    const row = getDb()
      .prepare('SELECT id, expires_at FROM crm_xsy_tokens WHERE user_id = ?')
      .get(req.user.userId) as any;
    if (row) {
      bound = new Date(row.expires_at + 'Z') > new Date();
    }
  }
  res.json({ enabled, bound });
});

// ---------- login: 跳转销售易 OAuth 授权页（浏览器跳转，通过 query token 认证） ----------

router.get('/login', (req, res) => {
  if (!crmEnabled()) {
    res.status(503).json({ error: '销售易 CRM 未配置' });
    return;
  }

  const jwtToken = typeof req.query.token === 'string' ? req.query.token
    : req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7)
    : '';
  let user: JwtPayload;
  try {
    user = verifyToken(jwtToken);
  } catch {
    res.status(401).json({ error: '认证失败，请重新登录' });
    return;
  }

  cleanupStates();
  let redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '/customers';
  if (!redirect.startsWith('/') || redirect.startsWith('//')) redirect = '/customers';

  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { redirect, userId: user.userId, exp: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CRM_CLIENT_ID,
    redirect_uri: CRM_REDIRECT_URI,
    scope: CRM_SCOPE,
    state,
  });
  res.redirect(302, `${CRM_OAUTH_BASE}/auc/oauth2/authorize?${params.toString()}`);
});

// ---------- callback: 用 code 换 token 并存库 ----------

interface XsyTokenJson {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  tenant_id?: string;
  instance_uri?: string;
  client_id?: string;
  error?: string;
  error_description?: string;
}

async function exchangeCode(code: string): Promise<XsyTokenJson> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CRM_CLIENT_ID,
    client_secret: CRM_CLIENT_SECRET,
    redirect_uri: CRM_REDIRECT_URI,
    code,
  });
  const r = await fetch(`${CRM_OAUTH_BASE}/auc/oauth2/token?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const j = (await r.json()) as XsyTokenJson;
  if (!r.ok || j.error || !j.access_token) {
    throw new Error(j.error_description || j.error || `token exchange HTTP ${r.status}`);
  }
  return j;
}

function saveToken(userId: string, tok: XsyTokenJson) {
  const db = getDb();
  const expiresIn = tok.expires_in ?? 7200;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(`
    INSERT INTO crm_xsy_tokens (user_id, access_token, token_type, expires_in, expires_at, scope, tenant_id, instance_uri, client_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      access_token = excluded.access_token,
      token_type   = excluded.token_type,
      expires_in   = excluded.expires_in,
      expires_at   = excluded.expires_at,
      scope        = excluded.scope,
      tenant_id    = excluded.tenant_id,
      instance_uri = excluded.instance_uri,
      client_id    = excluded.client_id,
      updated_at   = datetime('now')
  `).run(
    userId,
    tok.access_token!,
    tok.token_type || 'Bearer',
    expiresIn,
    expiresAt,
    tok.scope ?? null,
    tok.tenant_id ?? null,
    tok.instance_uri ?? null,
    tok.client_id ?? null,
  );
}

router.get('/callback', async (req, res) => {
  if (!crmEnabled()) {
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?status=fail&error=${encodeURIComponent('CRM 未配置')}`);
    return;
  }

  const errStr = typeof req.query.error === 'string' ? req.query.error : '';
  if (errStr) {
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?status=fail&error=${encodeURIComponent(errStr)}`);
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!code || !state) {
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?status=fail&error=${encodeURIComponent('缺少 code 或 state')}`);
    return;
  }

  cleanupStates();
  const entry = stateStore.get(state);
  stateStore.delete(state);
  if (!entry || entry.exp < Date.now()) {
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?status=fail&error=${encodeURIComponent('state 无效或已过期')}`);
    return;
  }

  try {
    const tok = await exchangeCode(code);
    saveToken(entry.userId, tok);
    const q = new URLSearchParams({ status: 'ok', redirect: entry.redirect });
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?${q.toString()}`);
  } catch (e: any) {
    console.error('[crm-xsy/callback]', e?.message || e);
    res.redirect(302, `${FRONTEND_URL}/#/crm-callback?status=fail&error=${encodeURIComponent(e?.message || 'CRM 授权失败')}`);
  }
});

// ---------- XOQL 查询辅助 ----------

function getValidToken(userId: string): string | null {
  const row = getDb()
    .prepare('SELECT access_token, expires_at FROM crm_xsy_tokens WHERE user_id = ?')
    .get(userId) as any;
  if (!row) return null;
  if (new Date(row.expires_at + 'Z') <= new Date()) return null;
  return row.access_token;
}

interface XoqlResponse {
  code: string;
  msg?: string;
  errorInfo?: string;
  data?: {
    totalSize: number;
    count: number;
    records: Record<string, any>[];
  };
}

async function queryXoql(accessToken: string, xoql: string): Promise<XoqlResponse> {
  const r = await fetch(`${CRM_API_BASE}/rest/data/v2.0/query/xoql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: accessToken,
    },
    body: new URLSearchParams({ xoql }).toString(),
  });
  return (await r.json()) as XoqlResponse;
}

// ---------- customers: 从销售易查客户数据 ----------

router.get('/customers', authMiddleware, async (req: AuthRequest, res) => {
  if (!crmEnabled()) {
    res.status(503).json({ error: '销售易 CRM 未配置' });
    return;
  }
  const token = getValidToken(req.user!.userId);
  if (!token) {
    res.status(401).json({ error: 'CRM 未授权或 token 已过期，请重新授权', code: 'CRM_NO_TOKEN' });
    return;
  }

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(parseInt((req.query.limit as string) || '200', 10), 2000);

  let xoql = `select id, accountName, phone, industry, address, ownerId, ownerId.name, createdDate from account`;
  if (search) {
    const escaped = search.replace(/'/g, "\\'");
    xoql += ` where accountName like '%${escaped}%'`;
  }
  xoql += ` limit ${limit}`;

  try {
    const result = await queryXoql(token, xoql);
    if (result.code !== '200') {
      res.status(502).json({ error: result.msg || result.errorInfo || 'XOQL 查询失败', detail: result });
      return;
    }
    res.json({
      total: result.data?.totalSize ?? 0,
      count: result.data?.count ?? 0,
      records: result.data?.records ?? [],
    });
  } catch (e: any) {
    console.error('[crm-xsy/customers]', e?.message || e);
    res.status(502).json({ error: '销售易 CRM 请求失败' });
  }
});

// ---------- sync: 将销售易客户同步到本地 customers 表 ----------

router.post('/sync-customers', authMiddleware, async (req: AuthRequest, res) => {
  if (!crmEnabled()) {
    res.status(503).json({ error: '销售易 CRM 未配置' });
    return;
  }
  const token = getValidToken(req.user!.userId);
  if (!token) {
    res.status(401).json({ error: 'CRM 未授权或 token 已过期', code: 'CRM_NO_TOKEN' });
    return;
  }

  try {
    const xoql = `select id, accountName, phone, industry, address, ownerId, ownerId.name, createdDate from account limit 2000`;
    const result = await queryXoql(token, xoql);
    if (result.code !== '200' || !result.data?.records) {
      res.status(502).json({ error: result.msg || 'XOQL 查询失败' });
      return;
    }

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO customers (id, company_name, industry, customer_type, level, region, address, status, owner_name, created_at, updated_at)
      VALUES (?, ?, ?, 'Enterprise', 'Normal', '', ?, 'Active', ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        company_name = excluded.company_name,
        industry     = CASE WHEN excluded.industry != '' THEN excluded.industry ELSE customers.industry END,
        address      = CASE WHEN excluded.address != '' THEN excluded.address ELSE customers.address END,
        owner_name   = CASE WHEN excluded.owner_name IS NOT NULL THEN excluded.owner_name ELSE customers.owner_name END,
        updated_at   = datetime('now')
    `);

    const tx = db.transaction(() => {
      let synced = 0;
      for (const r of result.data!.records) {
        const crmId = String(r.id || '');
        if (!crmId) continue;
        const localId = `crm_${crmId}`;
        upsert.run(
          localId,
          r.accountName || '未命名客户',
          r.industry || '',
          r.address || '',
          r['ownerId.name'] || null,
        );
        synced++;
      }
      return synced;
    });

    const synced = tx();
    res.json({ synced, total: result.data.records.length });
  } catch (e: any) {
    console.error('[crm-xsy/sync]', e?.message || e);
    res.status(502).json({ error: '同步失败：' + (e?.message || '') });
  }
});

// ---------- unbind: 解除 CRM 绑定 ----------

router.post('/unbind', authMiddleware, (req: AuthRequest, res) => {
  getDb().prepare('DELETE FROM crm_xsy_tokens WHERE user_id = ?').run(req.user!.userId);
  res.json({ ok: true });
});

export default router;
