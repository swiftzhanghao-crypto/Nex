import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware } from '../auth.ts';

const router = Router();
router.use(authMiddleware);

// --- Contracts ---
router.get('/contracts', (req, res) => {
  const { status, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM contracts WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND verify_status = ?'; params.push(status); }
  if (search) { sql += ' AND (name LIKE ? OR code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const limit = Math.min(parseInt(size), 200);
  params.push(limit, (parseInt(page) - 1) * limit);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({
    data: rows.map(r => ({
      id: r.id, code: r.code, name: r.name, externalCode: r.external_code,
      contractType: r.contract_type, partyA: r.party_a, partyB: r.party_b,
      verifyStatus: r.verify_status, verifyRemark: r.verify_remark,
      amount: r.amount, signDate: r.sign_date, orderId: r.order_id, createdAt: r.created_at,
    })), total, page: parseInt(page), size: limit,
  });
});

// --- Remittances ---
router.get('/remittances', (req, res) => {
  const { search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM remittances WHERE 1=1';
  const params: any[] = [];
  if (search) { sql += ' AND remitter_name LIKE ?'; params.push(`%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  sql += ' ORDER BY payment_time DESC LIMIT ? OFFSET ?';
  const limit = Math.min(parseInt(size), 200);
  params.push(limit, (parseInt(page) - 1) * limit);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({
    data: rows.map(r => ({
      id: r.id, erpDocNo: r.erp_doc_no, bankTransactionNo: r.bank_transaction_no,
      type: r.type, remitterName: r.remitter_name, remitterAccount: r.remitter_account,
      paymentMethod: r.payment_method, amount: r.amount,
      receiverName: r.receiver_name, receiverAccount: r.receiver_account,
      paymentTime: r.payment_time,
    })), total, page: parseInt(page), size: limit,
  });
});

// --- Invoices ---
router.get('/invoices', (req, res) => {
  const { status, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM invoices WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  sql += ' ORDER BY apply_time DESC LIMIT ? OFFSET ?';
  const limit = Math.min(parseInt(size), 200);
  params.push(limit, (parseInt(page) - 1) * limit);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({
    data: rows.map(r => ({
      id: r.id, invoiceTitle: r.invoice_title, amount: r.amount,
      applyTime: r.apply_time, applyType: r.apply_type, status: r.status,
      orderId: r.order_id, taxId: r.tax_id, remark: r.remark,
    })), total, page: parseInt(page), size: limit,
  });
});

export default router;
