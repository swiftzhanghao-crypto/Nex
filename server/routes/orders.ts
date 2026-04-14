import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';

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
  if (!allowed) return false;
  return allowed.includes(to);
}

function safeJsonParse(str: string | null | undefined, fallback: any = {}) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

function safePagination(page: string, size: string): { limit: number; offset: number; pageNum: number } {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.min(Math.max(1, parseInt(size) || 50), 200);
  return { limit, offset: (pageNum - 1) * limit, pageNum };
}

function getUserName(db: any, userId: string): string {
  const row = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
  return row?.name || '';
}

function toOrder(row: any) {
  const extra = safeJsonParse(row.extra, {});
  return {
    id: row.id, customerId: row.customer_id, customerName: row.customer_name,
    customerType: row.customer_type, customerLevel: row.customer_level,
    customerIndustry: row.customer_industry, customerRegion: row.customer_region,
    date: row.date, status: row.status, total: row.total ?? 0,
    items: safeJsonParse(row.items, []), source: row.source,
    buyerType: row.buyer_type, buyerName: row.buyer_name, buyerId: row.buyer_id,
    shippingAddress: row.shipping_address, deliveryMethod: row.delivery_method,
    isPaid: !!row.is_paid, paymentDate: row.payment_date,
    paymentMethod: row.payment_method, paymentTerms: row.payment_terms,
    paymentRecord: row.payment_record ? safeJsonParse(row.payment_record) : undefined,
    approval: safeJsonParse(row.approval, {}), approvalRecords: safeJsonParse(row.approval_records, []),
    salesRepId: row.sales_rep_id, salesRepName: row.sales_rep_name,
    businessManagerId: row.biz_manager_id, businessManagerName: row.biz_manager_name,
    invoiceInfo: row.invoice_info ? safeJsonParse(row.invoice_info) : undefined,
    acceptanceInfo: row.acceptance_info ? safeJsonParse(row.acceptance_info) : undefined,
    acceptanceConfig: row.acceptance_config ? safeJsonParse(row.acceptance_config) : undefined,
    opportunityId: row.opportunity_id, opportunityName: row.opportunity_name,
    originalOrderId: row.original_order_id,
    refundReason: row.refund_reason, refundAmount: row.refund_amount,
    ...extra,
  };
}

router.get('/', checkPermission('order', 'list'), (req, res) => {
  const db = getDb();
  const { status, customerId, source, page = '1', size = '50' } = req.query as Record<string, string>;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (source) { sql += ' AND source = ?'; params.push(source); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows.map(toOrder), total, page: pageNum, size: limit });
});

router.get('/:id', checkPermission('order', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '订单不存在' }); return; }
  res.json(toOrder(row));
});

router.post('/', checkPermission('order', 'create'), (req: AuthRequest, res) => {
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

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Order', id, `创建订单 ${id}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(toOrder(row));
});

router.put('/:id', checkPermission('order', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  const isAdmin = req.user!.role === 'Admin';
  const isOwner = existing.sales_rep_id === req.user!.userId;
  const isManager = ['Business', 'Finance', 'Commerce'].includes(req.user!.role);
  if (!isAdmin && !isOwner && !isManager) {
    res.status(403).json({ error: '无权修改此订单' });
    return;
  }

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

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Order', id, `更新订单 ${id}，状态: ${o.status}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

// --- Order approval (approverRole derived from JWT, not request body) ---
router.post('/:id/approve', checkPermission('order', 'approve'), (req: AuthRequest, res) => {
  const db = getDb();
  const id = req.params.id;
  const { action, remark } = req.body as { action: 'approve' | 'reject'; remark?: string };

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  if (existing.status !== 'PENDING_APPROVAL') {
    res.status(400).json({ error: `当前状态 ${existing.status} 不允许审批操作` });
    return;
  }

  const approval = safeJsonParse(existing.approval, {});
  const records = safeJsonParse(existing.approval_records, []);

  const roleKey = req.user!.role;
  const approvalFieldMap: Record<string, string> = {
    'Sales': 'salesApproved',
    'Business': 'businessApproved',
    'Commerce': 'businessApproved',
    'Finance': 'financeApproved',
    'Admin': 'financeApproved',
  };
  const field = approvalFieldMap[roleKey];
  if (!field) {
    res.status(403).json({ error: '当前角色无审批字段映射' });
    return;
  }

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

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, action === 'approve' ? 'APPROVE' : 'REJECT', 'Order', id,
      `${action === 'approve' ? '审批通过' : '驳回'}订单 ${id}${remark ? '，备注: ' + remark : ''}`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

// --- Submit order for approval ---
router.post('/:id/submit', checkPermission('order', 'submit'), (req: AuthRequest, res) => {
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

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'SUBMIT', 'Order', id, `提交订单 ${id} 至审批`);

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(toOrder(row));
});

router.delete('/:id', checkPermission('order', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }

  const isAdmin = req.user!.role === 'Admin';
  const isOwner = existing.sales_rep_id === req.user!.userId;
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: '只有管理员或订单归属销售可以删除订单' });
    return;
  }

  if (!['DRAFT', 'CANCELLED'].includes(existing.status) && !isAdmin) {
    res.status(400).json({ error: '只有草稿或已取消的订单可以被删除' });
    return;
  }

  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'DELETE', 'Order', req.params.id, `删除订单 ${req.params.id}`);
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
