import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
import spacesRoutes from './routes/spaces.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '4567');
const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
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
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
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
app.use('/api/spaces', spacesRoutes);

app.use(((err: any, _req: any, res: any, _next: any) => {
  console.error(`[error] ${err.message}`);
  if (err.code?.startsWith('SQLITE_')) {
    const msg = err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ? '关联数据不存在，请检查外键引用'
      : err.code === 'SQLITE_CONSTRAINT_UNIQUE' ? '数据重复，违反唯一约束'
      : `数据库错误: ${err.message}`;
    res.status(400).json({ error: msg });
    return;
  }
  res.status(500).json({ error: '服务器内部错误' });
}) as any);

const distDir = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

initSchema();
seedDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Nex Production Server running at http://0.0.0.0:${PORT}`);
  console.log(`  Serving static files from: ${distDir}`);
  console.log(`  API endpoints at /api/*\n`);
});
