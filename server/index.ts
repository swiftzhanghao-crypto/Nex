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

const PORT = parseInt(process.env.PORT || '3001');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/finance', financeRoutes);

// Initialize database and seed data
initSchema();
seedDatabase();

app.listen(PORT, () => {
  console.log(`\n  🚀 API Server running at http://localhost:${PORT}`);
  console.log(`  📖 Endpoints:`);
  console.log(`     POST   /api/auth/login`);
  console.log(`     GET    /api/auth/me`);
  console.log(`     GET    /api/users`);
  console.log(`     GET    /api/orders`);
  console.log(`     POST   /api/orders`);
  console.log(`     GET    /api/customers`);
  console.log(`     POST   /api/customers`);
  console.log(`     GET    /api/products`);
  console.log(`     GET    /api/finance/contracts`);
  console.log(`     GET    /api/finance/remittances`);
  console.log(`     GET    /api/finance/invoices`);
  console.log(`\n  Default login: any user email + password "123456"\n`);
});
