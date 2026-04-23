import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { buildRowPermissionWhere, checkRowPermissionForSingle } from '../rowPermissionFilter.ts';
import { validateBody, orderCreateSchema, orderUpdateSchema } from '../validate.ts';

const router = Router();
router.use(authMiddleware);

const STATUS_ALIASES: Record<string, string> = {
  APPROVED: 'PENDING_CONFIRM',
  PROCESSING: 'PROCESSING_PROD',
  COMPLETED: 'DELIVERED',
  REFUND_REQUESTED: 'REFUND_PENDING',
  REFUNDING: 'REFUND_PENDING',
  REJECTED: 'DRAFT',
};

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'CANCELLED'],
  PENDING_APPROVAL: ['PENDING_CONFIRM', 'DRAFT', 'CANCELLED'],
  PENDING_CONFIRM: ['PROCESSING_PROD', 'CANCELLED'],
  PROCESSING_PROD: ['PENDING_PAYMENT', 'SHIPPED', 'DELIVERED', 'PENDING_APPROVAL', 'CANCELLED'],
  PENDING_PAYMENT: ['PENDING_APPROVAL', 'PROCESSING_PROD', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'REFUND_PENDING', 'CANCELLED'],
  DELIVERED: ['REFUND_PENDING', 'REFUNDED', 'CANCELLED'],
  REFUND_PENDING: ['REFUNDED', 'DELIVERED', 'CANCELLED'],
  REFUNDED: [],
  CANCELLED: [],
};

function normalizeOrderStatus(status: string | null | undefined): string {
  if (!status) return 'DRAFT';
  return STATUS_ALIASES[status] || status;
}

function validateStatusTransition(from: string, to: string): boolean {
  const fromStatus = normalizeOrderStatus(from);
  const toStatus = normalizeOrderStatus(to);
  const allowed = ORDER_STATUS_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
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
    date: row.date, status: normalizeOrderStatus(row.status), total: row.total ?? 0,
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
    orderRemark: row.order_remark ?? undefined,
    ...extra,
  };
}

/**
 * 列表查询：行权限下推到 SQL（buildRowPermissionWhere），SQL 真分页 + COUNT(*)
 * 支持过滤参数：status / customerId / source / keyword（按 customer_name / id 模糊匹配）
 */
router.get('/', checkPermission('order', 'list'), (req: AuthRequest, res) => {
  const db = getDb();
  const { status, customerId, source, keyword, page = '1', size = '50' } = req.query as Record<string, string>;
  const statusFilter = status ? normalizeOrderStatus(status) : null;

  const conds: string[] = ['1=1'];
  const params: any[] = [];

  if (customerId) { conds.push('customer_id = ?'); params.push(customerId); }
  if (source) { conds.push('source = ?'); params.push(source); }
  if (statusFilter) { conds.push('status = ?'); params.push(statusFilter); }
  if (keyword && keyword.trim()) {
    conds.push('(customer_name LIKE ? OR id LIKE ?)');
    const k = `%${keyword.trim()}%`;
    params.push(k, k);
  }

  const rowPerm = buildRowPermissionWhere(db, req.user!, 'Order');
  const whereSql = ' WHERE ' + conds.join(' AND ') + rowPerm.sql;
  const whereParams = [...params, ...rowPerm.params];

  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM orders${whereSql}`).get(...whereParams) as { c: number };
  const total = totalRow?.c ?? 0;

  const { limit, offset, pageNum } = safePagination(page, size);
  const rows = db.prepare(`SELECT * FROM orders${whereSql} ORDER BY date DESC, rowid DESC LIMIT ? OFFSET ?`)
    .all(...whereParams, limit, offset);

  res.json({ data: rows.map(toOrder), total, page: pageNum, size: limit });
});

router.get('/:id', checkPermission('order', 'read'), (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '订单不存在' }); return; }
  const order = toOrder(row);
  const readable = checkRowPermissionForSingle(db, req.user!, 'Order', order);
  if (!readable) {
    res.status(403).json({ error: '无权查看此订单' });
    return;
  }
  res.json(order);
});

router.post('/', checkPermission('order', 'create'), validateBody(orderCreateSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = o.id || `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ---- 服务端绑定身份字段，避免客户端冒充他人创建订单 ----
  const userRoles = Array.isArray(req.user!.roles) ? req.user!.roles : [];
  const isAdminOrManager = userRoles.some(r => ['Admin', 'Business', 'Commerce'].includes(r));
  const currentUserName = getUserName(db, req.user!.userId);

  // 销售代表：普通 Sales 必须为自己；管理员/商务可以为他人指定
  let salesRepId: string | null = o.salesRepId ?? null;
  let salesRepName: string | null = o.salesRepName ?? null;
  if (!isAdminOrManager) {
    if (salesRepId && salesRepId !== req.user!.userId) {
      res.status(403).json({ error: '无权将订单的销售归属指定为他人' });
      return;
    }
    salesRepId = req.user!.userId;
    salesRepName = currentUserName;
  } else if (!salesRepId) {
    salesRepId = req.user!.userId;
    salesRepName = currentUserName;
  }

  // 制单人：始终强制为当前登录人
  const creatorId = req.user!.userId;
  const creatorName = currentUserName;

  const extra = JSON.stringify({
    receivingParty: o.receivingParty, receivingCompany: o.receivingCompany,
    receivingMethod: o.receivingMethod, directChannel: o.directChannel,
    terminalChannel: o.terminalChannel, orderType: o.orderType,
    creatorId, creatorName, creatorPhone: o.creatorPhone,
    industryLine: o.industryLine, province: o.province, city: o.city, district: o.district,
  });

  const nextStatus = normalizeOrderStatus(o.status || 'PENDING_APPROVAL');

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_method, payment_terms, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config, opportunity_id, opportunity_name, original_order_id, order_remark, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAudit = db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`);

  const tx = db.transaction(() => {
    insertOrder.run(
      id, o.customerId, o.customerName, o.customerType ?? null,
      o.customerLevel ?? null, o.customerIndustry ?? null, o.customerRegion ?? null,
      o.date || new Date().toISOString(), nextStatus, o.total || 0,
      JSON.stringify(o.items || []), o.source || 'Sales', o.buyerType || 'Customer',
      o.buyerName ?? null, o.buyerId ?? null, o.shippingAddress ?? null,
      o.deliveryMethod ?? null, 0, o.paymentMethod ?? null, o.paymentTerms ?? null,
      JSON.stringify(o.approval || { salesApproved: false, businessApproved: false, financeApproved: false }),
      JSON.stringify(o.approvalRecords || []),
      salesRepId, salesRepName,
      o.businessManagerId ?? null, o.businessManagerName ?? null,
      o.invoiceInfo ? JSON.stringify(o.invoiceInfo) : null,
      o.acceptanceInfo ? JSON.stringify(o.acceptanceInfo) : null,
      o.acceptanceConfig ? JSON.stringify(o.acceptanceConfig) : null,
      o.opportunityId ?? null, o.opportunityName ?? null, o.originalOrderId ?? null,
      o.orderRemark ?? null, extra
    );
    insertAudit.run(req.user!.userId, currentUserName, 'CREATE', 'Order', id, `创建订单 ${id}`);
  });
  tx();

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.status(201).json(toOrder(row));
});

router.put('/:id', checkPermission('order', 'update'), validateBody(orderUpdateSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const o = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '订单不存在' }); return; }
  const existingOrder = toOrder(existing);

  if (!checkRowPermissionForSingle(db, req.user!, 'Order', existingOrder)) {
    res.status(403).json({ error: '行权限限制，无权修改此订单' });
    return;
  }

  const updRoles = Array.isArray(req.user!.roles) ? req.user!.roles : [];
  const isAdmin = updRoles.includes('Admin');
  const isOwner = existing.sales_rep_id === req.user!.userId;
  const isManager = updRoles.some(r => ['Business', 'Commerce'].includes(r));
  if (!isAdmin && !isOwner && !isManager) {
    res.status(403).json({ error: '无权修改此订单' });
    return;
  }

  // 防止非管理员把订单"转给别人"绕过行权限
  const isAdminOrManager = isAdmin || isManager;
  if (!isAdminOrManager && o.salesRepId && o.salesRepId !== existing.sales_rep_id) {
    res.status(403).json({ error: '无权变更订单的销售归属' });
    return;
  }
  // creatorId 始终保持原值，禁止前端覆盖
  const existingExtra = safeJsonParse(existing.extra, {});
  const lockedCreatorId = existingExtra.creatorId || existing.created_by_user || null;
  const lockedCreatorName = existingExtra.creatorName || null;

  const existingStatus = normalizeOrderStatus(existingOrder.status);
  const targetStatus = normalizeOrderStatus(o.status ?? existingStatus);
  if (targetStatus !== existingStatus) {
    if (!validateStatusTransition(existingStatus, targetStatus)) {
      res.status(400).json({ error: `状态流转不合法: ${existingStatus} → ${targetStatus}` });
      return;
    }
  }

  const merged = {
    ...existingOrder,
    ...o,
    status: targetStatus,
    approval: existingOrder.approval || {},
    approvalRecords: existingOrder.approvalRecords || [],
  };

  const extra = JSON.stringify({
    receivingParty: merged.receivingParty, receivingCompany: merged.receivingCompany,
    receivingMethod: merged.receivingMethod, directChannel: merged.directChannel,
    terminalChannel: merged.terminalChannel, orderType: merged.orderType,
    creatorId: lockedCreatorId, creatorName: lockedCreatorName, creatorPhone: merged.creatorPhone,
    industryLine: merged.industryLine, province: merged.province, city: merged.city, district: merged.district,
    isAuthConfirmed: merged.isAuthConfirmed, authConfirmedDate: merged.authConfirmedDate,
    isPackageConfirmed: merged.isPackageConfirmed, packageConfirmedDate: merged.packageConfirmedDate,
    isShippingConfirmed: merged.isShippingConfirmed, shippingConfirmedDate: merged.shippingConfirmedDate,
    isCDBurned: merged.isCDBurned, cdBurnedDate: merged.cdBurnedDate,
    shippedDate: merged.shippedDate, carrier: merged.carrier, trackingNumber: merged.trackingNumber,
  });

  const updateOrder = db.prepare(`
    UPDATE orders SET customer_id=?, customer_name=?, status=?, total=?, items=?,
    source=?, buyer_type=?, shipping_address=?, delivery_method=?,
    is_paid=?, payment_date=?, payment_method=?, payment_terms=?, payment_record=?,
    approval=?, approval_records=?, sales_rep_id=?, sales_rep_name=?,
    biz_manager_id=?, biz_manager_name=?, invoice_info=?, acceptance_info=?,
    acceptance_config=?, refund_reason=?, refund_amount=?, extra=?, updated_at=datetime('now')
    WHERE id=?
  `);
  const insertAudit = db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`);
  const userName = getUserName(db, req.user!.userId);

  // salesRepId 校验后已经处理；非管理员场景下保留原值
  const finalSalesRepId = isAdminOrManager ? (merged.salesRepId ?? null) : existing.sales_rep_id;
  const finalSalesRepName = isAdminOrManager ? (merged.salesRepName ?? null) : existing.sales_rep_name;

  const tx = db.transaction(() => {
    updateOrder.run(
      merged.customerId, merged.customerName, merged.status, merged.total, JSON.stringify(merged.items || []),
      merged.source, merged.buyerType, merged.shippingAddress ?? null, merged.deliveryMethod ?? null,
      merged.isPaid ? 1 : 0, merged.paymentDate ?? null, merged.paymentMethod ?? null, merged.paymentTerms ?? null,
      merged.paymentRecord ? JSON.stringify(merged.paymentRecord) : null,
      JSON.stringify(existingOrder.approval || {}), JSON.stringify(existingOrder.approvalRecords || []),
      finalSalesRepId, finalSalesRepName,
      merged.businessManagerId ?? null, merged.businessManagerName ?? null,
      merged.invoiceInfo ? JSON.stringify(merged.invoiceInfo) : null,
      merged.acceptanceInfo ? JSON.stringify(merged.acceptanceInfo) : null,
      merged.acceptanceConfig ? JSON.stringify(merged.acceptanceConfig) : null,
      merged.refundReason ?? null, merged.refundAmount ?? null, extra, id
    );
    insertAudit.run(req.user!.userId, userName, 'UPDATE', 'Order', id, `更新订单 ${id}，状态: ${merged.status}`);
  });
  tx();

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

  if (!checkRowPermissionForSingle(db, req.user!, 'Order', toOrder(existing))) {
    res.status(403).json({ error: '行权限限制，无权审批此订单' });
    return;
  }

  const currentStatus = normalizeOrderStatus(existing.status);
  if (currentStatus !== 'PENDING_APPROVAL') {
    res.status(400).json({ error: `当前状态 ${currentStatus} 不允许审批操作` });
    return;
  }

  const approval = safeJsonParse(existing.approval, {});
  const records = safeJsonParse(existing.approval_records, []);

  const approvalFieldMap: Record<string, string> = {
    'Sales': 'salesApproved',
    'Business': 'businessApproved',
    'Commerce': 'businessApproved',
    'Finance': 'financeApproved',
    'Admin': 'financeApproved',
  };
  const field = req.user!.roles.map(r => approvalFieldMap[r]).find(Boolean);
  if (!field) {
    res.status(403).json({ error: '当前角色无审批字段映射' });
    return;
  }

  if (action === 'approve') {
    approval[field] = true;
  }

  records.push({
    userId: req.user!.userId,
    role: req.user!.roles.join(','),
    action,
    remark: remark || '',
    timestamp: new Date().toISOString(),
  });

  const newStatus = action === 'reject'
    ? 'DRAFT'
    : (approval.salesApproved && approval.businessApproved && approval.financeApproved)
      ? 'PENDING_CONFIRM'
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

  if (!checkRowPermissionForSingle(db, req.user!, 'Order', toOrder(existing))) {
    res.status(403).json({ error: '行权限限制，无权提交此订单' });
    return;
  }

  const currentStatus = normalizeOrderStatus(existing.status);
  if (currentStatus !== 'DRAFT') {
    res.status(400).json({ error: `当前状态 ${currentStatus} 不允许提交审批` });
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

  if (!checkRowPermissionForSingle(db, req.user!, 'Order', toOrder(existing))) {
    res.status(403).json({ error: '行权限限制，无权删除此订单' });
    return;
  }

  const isAdmin = req.user!.roles.includes('Admin');
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
router.get('/:id/logs', checkPermission('order', 'read'), (req: AuthRequest, res) => {
  const db = getDb();
  const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!orderRow) { res.status(404).json({ error: '订单不存在' }); return; }
  const readable = checkRowPermissionForSingle(db, req.user!, 'Order', toOrder(orderRow));
  if (!readable) {
    res.status(403).json({ error: '无权查看此订单日志' });
    return;
  }
  const rows = db.prepare(`SELECT * FROM audit_logs WHERE resource='Order' AND resource_id=? ORDER BY created_at DESC`).all(req.params.id) as any[];
  res.json(rows.map(r => ({
    id: r.id, userId: r.user_id, userName: r.user_name,
    action: r.action, detail: r.detail, createdAt: r.created_at,
  })));
});

export default router;
