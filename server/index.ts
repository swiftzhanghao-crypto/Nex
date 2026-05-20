import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import { createLogger } from './logger.ts';
import { initSchema, getDb, getDbPath } from './db.ts';
import { requestTimingMiddleware, csrfProtection, getMetrics } from './middleware.ts';
import { seedDatabase } from './seed.ts';
import authRoutes from './routes/auth.ts';
import wpsAuthRoutes from './routes/wps-auth.ts';
import userRoutes from './routes/users.ts';
import orderRoutes from './routes/orders.ts';
import customerRoutes from './routes/customers.ts';
import productRoutes from './routes/products.ts';
import financeRoutes from './routes/finance.ts';
import channelRoutes from './routes/channels.ts';
import opportunityRoutes from './routes/opportunities.ts';
import aiRoutes from './routes/ai.ts';
import spacesRoutes from './routes/spaces.ts';
import crmXsyRoutes from './routes/crm-xiaoshouyi.ts';
import systemRoutes from './routes/system.ts';
import auditRoutes from './routes/audit.ts';
import importRoutes from './routes/import.ts';
import notificationRoutes from './routes/notifications.ts';
import { openApiSpec } from './openapi.ts';

const log = createLogger('server');
const serverStartTime = Date.now();

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:4173', 'http://localhost:5173', 'http://127.0.0.1:4173', 'http://127.0.0.1:5173'];

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      log.warn('cors blocked origin', { origin });
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestTimingMiddleware);
app.use(csrfProtection(ALLOWED_ORIGINS));

const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过多，请 15 分钟后再试' },
  keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
});
app.use('/api/auth/login', authLimiter);

app.use((req, _res, next) => {
  log.debug(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  let dbOk = false;
  let dbSize: number | null = null;
  try {
    getDb().prepare('SELECT 1 AS ok').get();
    dbOk = true;
    const stat = fs.statSync(getDbPath());
    dbSize = stat.size;
  } catch (err) {
    log.error('health check db failed', { message: err instanceof Error ? err.message : String(err) });
  }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    time: new Date().toISOString(),
    db: { ok: dbOk, sizeBytes: dbSize },
    memoryUsage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
  });
});

app.get('/api/metrics', (_req, res) => {
  res.json({
    ...getMetrics(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
  });
});

app.post('/api/errors', (req, res) => {
  const errors = Array.isArray(req.body) ? req.body : [req.body];
  for (const e of errors) {
    log.warn('client error', { message: e?.message, source: e?.source, url: e?.url });
  }
  res.status(204).end();
});

app.post('/api/metrics/vitals', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  log.info('web vitals', {
    name: body.name,
    value: body.value,
    rating: body.rating,
    url: body.url,
    id: body.id,
  });
  res.status(204).end();
});

app.get('/api/docs', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/api/docs/ui', (_req, res) => {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '  <title>业务平台 API 文档</title>',
    '  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />',
    '</head>',
    '<body>',
    '  <div id="swagger-ui"></div>',
    '  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>',
    '  <script>',
    '    SwaggerUIBundle({',
    "      url: '/api/docs',",
    "      dom_id: '#swagger-ui',",
    '      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],',
    "      layout: 'BaseLayout',",
    '    });',
    '  </script>',
    '</body>',
    '</html>',
  ].join('\n');
  res.type('html').send(html);
});

app.use('/api/auth', wpsAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/crm/xsy', crmXsyRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/import', importRoutes);
app.use('/api/notifications', notificationRoutes);

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : undefined;
  const message = err instanceof Error ? err.message : undefined;
  log.error('unhandled error', { code, message });
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    res.status(400).json({ error: '关联数据不存在，请检查外键引用' });
    return;
  }
  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    res.status(400).json({ error: '数据重复，违反唯一约束' });
    return;
  }
  if (code?.startsWith('SQLITE_')) {
    res.status(400).json({ error: '数据库操作失败' });
    return;
  }
  res.status(500).json({ error: '服务器内部错误' });
};
app.use(errorHandler);

initSchema();
seedDatabase();

app.listen(PORT, () => {
  log.info(`API Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  if (process.env.NODE_ENV !== 'production') {
    log.info('Dev mode: any user email + password "123456"');
  }
});
