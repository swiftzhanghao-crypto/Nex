import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, requireRole, type AuthRequest } from '../auth.ts';

const router = Router();
router.use(authMiddleware);

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  'DRAFT':              ['PENDING_APPROVAL', 'CANCELLED'],
  'PENDING_APPROVAL':   ['APPROVED', 'REJECTED', 'CANCELLED'],
  'APPROVED':           ['PROCESSING', 'CANCELLED'],
  'REJECTED':           ['PENDING_APPROVAL', 'CANCELLED'],
  'PROCESSING':         ['SHIPPED', 'COMPLETED', 'CANCELLED'],
  'SHIPPED':            ['COMPLETED'],
  'COMPLETED':          ['REFUND_REQUESTED'],
  'REFUND_REQUESTED':   ['REFUNDING', 'COMPLETED'],
  'REFUNDING':          ['REFUNDED', 'COMPLETED'],
  'REFUNDED':           [],
  'CANCELLED':          [],
};

function validateStatusTransition(from: string, to: string): boolean {
  const allowed = ORDER_STATUS_TRANSITIONS[from];
  if (!allowed) return true;
  return allowed.includes(to);
}

function toOrder(row: any) {
  const extra = JSON.parse(row.extra || '{}');
  return {
    id: row.id, customerId: row.customer_id, customerName: row.customer_name,
    customerType: row.customer_type, customerLevel: row.customer_level,
    customerIndustry: row.customer_industry, customerRegion: row.customer_region,
    date: row.date, status: row.status, total: row.total,
    items: JSON.parse(row.items), source: row.source,
    buyerType: row.buyer_type, buyerName: row.buyer_name, buyerId: row.buyer_id,
    shippingAddress: row.shipping_address, deliveryMethod: row.delivery_method,
    isPaid: !!row.is_paid, paymentDate: row.payment_date,
    paymentMethod: row.payment_method, paymentTerms: row.payment_terms,
    paymentRecord: row.payment_record ? JSON.parse(row.payment_record) : undefined,
    approval: JSON.parse(row.approval), approvalRecords: JSON.parse(row.approval_records),
    salesRepId: row.sales_rep_id, salesRepName: row.sales_rep_name,
    businessManagerId: row.biz_manager_id, businessManagerName: row.biz_manager_name,
    invoiceInfo: row.invoice_info ? JSON.parse(row.invoice_info) : undefined,
    acceptanceInfo: row.acceptance_info ? JSON.parse(row.acceptance_info) : undefined,
    acceptanceConfig: row.acceptance_config ? JSON.parse(row.acceptance_config) : undefined,
    opportunityId: row.opportunity_id, opportunityName: row.opportunity_name,
    originalOrderId: row.original_order_id,
    refundReason: row.refund_reason, refundAmount: row.refund_amount,
    ...extra,
  };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { status, customerId, source, page = '1', size = '50' } = req.query as Record<string, string>;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (source) { sql += ' AND source = ?'; params.push(source); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  const limit = Math.min(parseInt(size), 200);
  const offset = (parseInt(page) - 1) * limit;
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows.map(toOrder), total, page: parseInt(page), size: limit });
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '订单不存在' }); return; }
  res.json(toOrder(row));
});

router.post('/', (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = o.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const extra = JSON.stringify({
    receivingParty: o.receivingParty, receivingCompany: o.receivingCompany,
    receivingMethod: o.receivingMethod, directChannel: o.directChannel,
    terminalChannel: o.terminalChannel, orderType: o.orderType,
    creatorId: o.creatorId, creatorName: o.creatorName, creatorPhone: o.creatorPhone,
    industryLine: o.industryLine, province: o.province, city: o.city, district: o.district,
  });

  db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_method, payment_terms, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config, opportunity_id, opportunity_name, original_order_id, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, o.customerId, o.customerName, o.customerType ?? null,
    o.customerLevel ?? null, o.customerIndustry ?? null, o.customerRegion ?? null,
    o.date || new Date().toISOString(), o.status || 'PENDING_APPROVAL', o.total || 0,
    JSON.stringify(o.items || []), o.source || 'Sales', o.buyerType || 'Customer',
    o.buyerName ?? null, o.buyerId ?? null, o.shippingAddress ?? null,
    o.deliveryMethod ?? null, 0, o.paymentMethod ?? null, o.paymentTerms ?? null,
    JSON.stringify(o.approval || { salesApproved: false, businessApproved: false, financeApproved: false }),
    JSON.stringify(o.approvalRecords || []),
    o.salesRepId ?? null, o.salesRepName ?? null,
    o.businessManagerId ?? null, o.businessManagerName ?? null,
    o.invoiceInfo ? JSON.stringify(o.invoiceInfo) : null,
    o.acceptanceInfo ? JSON.stringify(o.acceptanceInfo) : null,
    o.acceptanceConfig ? JSON.stringify(o.acceptanceConfig) : null,
    o.opportunityId ?? null, o.opportunityName ?? null, o.originalOrderId ?? null, extra
  );

  // Audit log
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'CREATE', 'Order', id, `创建订单 ${id}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(toOrder(row));
});

router.put('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  if (o.status && o.status !== existing.status) {
    if (!validateStatusTransition(existing.status, o.status)) {
      res.status(400).json({ error: `状态流转不合法: ${existing.status} → ${o.status}` });
      return;
    }
  }

  const extra = JSON.stringify({
    receivingParty: o.receivingParty, receivingCompany: o.receivingCompany,
    receivingMethod: o.receivingMethod, directChannel: o.directChannel,
    terminalChannel: o.terminalChannel, orderType: o.orderType,
    creatorId: o.creatorId, creatorName: o.creatorName, creatorPhone: o.creatorPhone,
    industryLine: o.industryLine, province: o.province, city: o.city, district: o.district,
    isAuthConfirmed: o.isAuthConfirmed, authConfirmedDate: o.authConfirmedDate,
    isPackageConfirmed: o.isPackageConfirmed, packageConfirmedDate: o.packageConfirmedDate,
    isShippingConfirmed: o.isShippingConfirmed, shippingConfirmedDate: o.shippingConfirmedDate,
    isCDBurned: o.isCDBurned, cdBurnedDate: o.cdBurnedDate,
    shippedDate: o.shippedDate, carrier: o.carrier, trackingNumber: o.trackingNumber,
  });

  db.prepare(`
    UPDATE orders SET customer_id=?, customer_name=?, status=?, total=?, items=?,
    source=?, buyer_type=?, shipping_address=?, delivery_method=?,
    is_paid=?, payment_date=?, payment_method=?, payment_terms=?, payment_record=?,
    approval=?, approval_records=?, sales_rep_id=?, sales_rep_name=?,
    biz_manager_id=?, biz_manager_name=?, invoice_info=?, acceptance_info=?,
    acceptance_config=?, refund_reason=?, refund_amount=?, extra=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    o.customerId, o.customerName, o.status, o.total, JSON.stringify(o.items || []),
    o.source, o.buyerType, o.shippingAddress ?? null, o.deliveryMethod ?? null,
    o.isPaid ? 1 : 0, o.paymentDate ?? null, o.paymentMethod ?? null, o.paymentTerms ?? null,
    o.paymentRecord ? JSON.stringify(o.paymentRecord) : null,
    JSON.stringify(o.approval || {}), JSON.stringify(o.approvalRecords || []),
    o.salesRepId ?? null, o.salesRepName ?? null,
    o.businessManagerId ?? null, o.businessManagerName ?? null,
    o.invoiceInfo ? JSON.stringify(o.invoiceInfo) : null,
    o.acceptanceInfo ? JSON.stringify(o.acceptanceInfo) : null,
    o.acceptanceConfig ? JSON.stringify(o.acceptanceConfig) : null,
    o.refundReason ?? null, o.refundAmount ?? null, extra, id
  );

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'UPDATE', 'Order', id, `更新订单 ${id}，状态: ${o.status}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

// --- Order approval ---
router.post('/:id/approve', requireRole('Admin', 'BusinessManager', 'Finance'), (req: AuthRequest, res) => {
  const db = getDb();
  const id = req.params.id;
  const { action, remark, role: approverRole } = req.body as { action: 'approve' | 'reject'; remark?: string; role?: string };

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  if (action === 'approve' && existing.status !== 'PENDING_APPROVAL') {
    res.status(400).json({ error: `当前状态 ${existing.status} 不允许审批` });
    return;
  }
  if (action === 'reject' && existing.status !== 'PENDING_APPROVAL') {
    res.status(400).json({ error: `当前状态 ${existing.status} 不允许驳回` });
    return;
  }

  const approval = JSON.parse(existing.approval || '{}');
  const records = JSON.parse(existing.approval_records || '[]');

  const roleKey = approverRole || req.user!.role;
  const approvalFieldMap: Record<string, string> = {
    'Sales': 'salesApproved',
    'BusinessManager': 'businessApproved',
    'Finance': 'financeApproved',
    'Admin': 'financeApproved',
  };
  const field = approvalFieldMap[roleKey] || 'salesApproved';

  if (action === 'approve') {
    approval[field] = true;
  }

  records.push({
    userId: req.user!.userId,
    role: roleKey,
    action,
    remark: remark || '',
    timestamp: new Date().toISOString(),
  });

  const newStatus = action === 'reject'
    ? 'REJECTED'
    : (approval.salesApproved && approval.businessApproved && approval.financeApproved)
      ? 'APPROVED'
      : 'PENDING_APPROVAL';

  db.prepare(`UPDATE orders SET status=?, approval=?, approval_records=?, updated_at=datetime('now') WHERE id=?`)
    .run(newStatus, JSON.stringify(approval), JSON.stringify(records), id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', action === 'approve' ? 'APPROVE' : 'REJECT', 'Order', id,
      `${action === 'approve' ? '审批通过' : '驳回'}订单 ${id}${remark ? '，备注: ' + remark : ''}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

// --- Submit order for approval ---
router.post('/:id/submit', (req: AuthRequest, res) => {
  const db = getDb();
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
    res.status(400).json({ error: `当前状态 ${existing.status} 不允许提交审批` });
    return;
  }

  const approval = JSON.stringify({ salesApproved: false, businessApproved: false, financeApproved: false });
  db.prepare(`UPDATE orders SET status='PENDING_APPROVAL', approval=?, updated_at=datetime('now') WHERE id=?`)
    .run(approval, id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'SUBMIT', 'Order', id, `提交订单 ${id} 至审批`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

router.delete('/:id', (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '订单不存在' }); return; }
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, '', 'DELETE', 'Order', req.params.id, `删除订单 ${req.params.id}`);
  res.json({ ok: true });
});

// --- Order audit log ---
router.get('/:id/logs', (req, res) => {
  const rows = getDb().prepare(`SELECT * FROM audit_logs WHERE resource='Order' AND resource_id=? ORDER BY created_at DESC`).all(req.params.id) as any[];
  res.json(rows.map(r => ({
    id: r.id, userId: r.user_id, userName: r.user_name,
    action: r.action, detail: r.detail, createdAt: r.created_at,
  })));
});

export default router;
