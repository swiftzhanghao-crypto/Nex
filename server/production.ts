import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const log = createLogger('production');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverStartTime = Date.now();
const PORT = parseInt(process.env.PORT || '4567');
const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
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
app.use(express.json({ limit: '2mb' }));
app.use(requestTimingMiddleware);
app.use(csrfProtection(ALLOWED_ORIGINS));

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    log.debug(`${req.method} ${req.path}`);
  }
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

app.get('/api/docs', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/api/docs/ui', (_req, res) => {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN"><head><meta charset="UTF-8" />',
    '<title>业务平台 API 文档</title>',
    '<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />',
    '</head><body><div id="swagger-ui"></div>',
    '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>',
    '<script>SwaggerUIBundle({ url: "/api/docs", dom_id: "#swagger-ui" });</script>',
    '</body></html>',
  ].join('');
  res.type('html').send(html);
});
app.use('/api/audit', auditRoutes);
app.use('/api/import', importRoutes);
app.use('/api/notifications', notificationRoutes);

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : undefined;
  const message = err instanceof Error ? err.message : undefined;
  log.error('unhandled error', { code, message });
  if (code?.startsWith('SQLITE_')) {
    const msg = code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ? '关联数据不存在，请检查外键引用'
      : code === 'SQLITE_CONSTRAINT_UNIQUE' ? '数据重复，违反唯一约束'
      : `数据库错误: ${message ?? '未知错误'}`;
    res.status(400).json({ error: msg });
    return;
  }
  res.status(500).json({ error: '服务器内部错误' });
};
app.use(errorHandler);

const distDir = path.resolve(__dirname, '..', 'dist');

app.get('/permission-board', (_req, res) => {
  res.sendFile(path.join(distDir, 'permission-board-4.html'));
});
app.get('/permission-board-4.html', (_req, res) => {
  res.redirect(301, '/permission-board');
});

app.use(express.static(distDir));
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

initSchema();
seedDatabase();

app.listen(PORT, '0.0.0.0', () => {
  log.info(`Production server running on port ${PORT}`, { port: PORT, distDir });
});
