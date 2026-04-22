import express from 'express';
import cors from 'cors';
import { initSchema } from './db.ts';
import { seedDatabase } from './seed.ts';
import authRoutes from './routes/auth.ts';
import userRoutes from './routes/users.ts';
import orderRoutes from './routes/orders.ts';
import customerRoutes from './routes/customers.ts';
import productRoutes from './routes/products.ts';
import financeRoutes from './routes/finance.ts';
import channelRoutes from './routes/channels.ts';
import opportunityRoutes from './routes/opportunities.ts';
import aiRoutes from './routes/ai.ts';
import spacesRoutes from './routes/spaces.ts';

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:4173', 'http://localhost:5173', 'http://127.0.0.1:4173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[cors] blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

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

app.use(((err: any, _req: any, res: any, _next: any) => {
  // 详细错误仅写入服务端日志，不外泄给客户端
  console.error(`[error] ${err?.code || ''} ${err?.message}`);
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    res.status(400).json({ error: '关联数据不存在，请检查外键引用' });
    return;
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    res.status(400).json({ error: '数据重复，违反唯一约束' });
    return;
  }
  if (err.code?.startsWith?.('SQLITE_')) {
    res.status(400).json({ error: '数据库操作失败' });
    return;
  }
  res.status(500).json({ error: '服务器内部错误' });
}) as any);

initSchema();
seedDatabase();

app.listen(PORT, () => {
  console.log(`\n  API Server running at http://localhost:${PORT}`);
  console.log(`  Endpoints:`);
  console.log(`     POST   /api/auth/login`);
  console.log(`     GET    /api/auth/me`);
  console.log(`     CRUD   /api/users`);
  console.log(`     CRUD   /api/orders          + POST /:id/approve, POST /:id/submit`);
  console.log(`     CRUD   /api/customers`);
  console.log(`     CRUD   /api/products`);
  console.log(`     CRUD   /api/channels`);
  console.log(`     CRUD   /api/opportunities`);
  console.log(`     CRUD   /api/finance/contracts`);
  console.log(`     CRUD   /api/finance/remittances`);
  console.log(`     CRUD   /api/finance/invoices`);
  console.log(`     GET    /api/finance/performances`);
  console.log(`     GET    /api/finance/authorizations`);
  console.log(`     GET    /api/finance/delivery-infos`);
  console.log(`     GET    /api/finance/audit-logs`);
  console.log(`     POST   /api/ai/generate, /api/ai/category-suggest, /api/ai/generate-json`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n  [dev] Default login: any user email + password "123456"\n`);
  } else {
    console.log('');
  }
});
