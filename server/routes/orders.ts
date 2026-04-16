import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';

const router = Router();
router.use(authMiddleware);

type OrderRowRule = {
  resource?: string;
  dimension?: string;
  values?: string[];
};

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

function getOrderRowRules(db: any, roleId: string): OrderRowRule[] {
  const role = db.prepare('SELECT row_permissions FROM roles WHERE id = ?').get(roleId) as any;
  const rules = safeJsonParse(role?.row_permissions, []);
  if (!Array.isArray(rules)) return [];
  return rules.filter((r: OrderRowRule) => r?.resource === 'Order' && Array.isArray(r.values) && r.values.length > 0);
}

function getDescendantDeptIds(db: any, deptId: string): string[] {
  const rows = db.prepare('SELECT id, parent_id FROM departments').all() as Array<{ id: string; parent_id: string | null }>;
  const childrenMap = new Map<string, string[]>();
  rows.forEach((row) => {
    const pid = row.parent_id || '__root__';
    const arr = childrenMap.get(pid) || [];
    arr.push(row.id);
    childrenMap.set(pid, arr);
  });

  const result = new Set<string>([deptId]);
  const queue: string[] = [deptId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const children = childrenMap.get(curr) || [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        queue.push(child);
      }
    }
  }
  return Array.from(result);
}

function evaluateOrderRowRule(
  rule: OrderRowRule,
  order: any,
  currentUserId: string,
  currentUserDeptId: string | null,
  currentUserDeptAndChildrenIds: string[],
  userDeptMap: Map<string, string | null>
): boolean {
  const vals = rule.values || [];
  if (vals.length === 0) return true;

  switch (rule.dimension) {
    case 'salesRep':
      return vals.some((v) => {
        if (v === 'self') return order.salesRepId === currentUserId;
        const salesDeptId = order.salesRepId ? userDeptMap.get(order.salesRepId) : null;
        if (v === 'department') return !!currentUserDeptId && salesDeptId === currentUserDeptId;
        if (v === 'departmentAndChildren') {
          return !!currentUserDeptId && !!salesDeptId && currentUserDeptAndChildrenIds.includes(salesDeptId);
        }
        return false;
      });
    case 'businessManager':
      return vals.some((v) => {
        if (v === 'self') return order.businessManagerId === currentUserId;
        const bmDeptId = order.businessManagerId ? userDeptMap.get(order.businessManagerId) : null;
        if (v === 'department') return !!currentUserDeptId && bmDeptId === currentUserDeptId;
        if (v === 'departmentAndChildren') {
          return !!currentUserDeptId && !!bmDeptId && currentUserDeptAndChildrenIds.includes(bmDeptId);
        }
        return false;
      });
    case 'creator':
      return vals.some((v) => {
        if (v === 'self') return order.creatorId === currentUserId;
        const creatorDeptId = order.creatorId ? userDeptMap.get(order.creatorId) : null;
        if (v === 'department') return !!currentUserDeptId && creatorDeptId === currentUserDeptId;
        if (v === 'departmentAndChildren') {
          return !!currentUserDeptId && !!creatorDeptId && currentUserDeptAndChildrenIds.includes(creatorDeptId);
        }
        return false;
      });
    case 'departmentId': {
      const salesDeptId = order.salesRepId ? userDeptMap.get(order.salesRepId) : null;
      return !!salesDeptId && vals.includes(salesDeptId);
    }
    case 'orderType':
    case 'buyerType':
      return vals.includes(order.buyerType || 'Customer');
    case 'orderSource':
      return !!order.source && vals.includes(order.source);
    case 'orderStatus':
      return !!order.status && vals.includes(order.status);
    case 'industryLine':
      return !!order.industryLine && vals.includes(order.industryLine);
    case 'province':
      return !!order.province && vals.includes(order.province);
    case 'customerIndustry':
      return !!order.customerIndustry && vals.includes(order.customerIndustry);
    case 'customerLevel':
      return !!order.customerLevel && vals.includes(order.customerLevel);
    case 'directChannelId':
    case 'channelId': {
      const directChannelId = order.buyerType === 'Channel' ? order.buyerId : undefined;
      return !!directChannelId && vals.includes(directChannelId);
    }
    default:
      return true;
  }
}

function filterOrdersByRowPermissions(db: any, user: { userId: string; role: string }, orders: any[]): any[] {
  const orderRules = getOrderRowRules(db, user.role);
  if (orderRules.length === 0) return orders;

  const userRows = db.prepare('SELECT id, department_id FROM users').all() as Array<{ id: string; department_id: string | null }>;
  const userDeptMap = new Map<string, string | null>();
  userRows.forEach((u) => userDeptMap.set(u.id, u.department_id || null));

  const currentUserDeptId = userDeptMap.get(user.userId) || null;
  const currentUserDeptAndChildrenIds = currentUserDeptId ? getDescendantDeptIds(db, currentUserDeptId) : [];

  return orders.filter((order) =>
    orderRules.every((rule) =>
      evaluateOrderRowRule(rule, order, user.userId, currentUserDeptId, currentUserDeptAndChildrenIds, userDeptMap)
    )
  );
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
    ...extra,
  };
}

router.get('/', checkPermission('order', 'list'), (req: AuthRequest, res) => {
  const db = getDb();
  const { status, customerId, source, page = '1', size = '50' } = req.query as Record<string, string>;
  const statusFilter = status ? normalizeOrderStatus(status) : null;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (source) { sql += ' AND source = ?'; params.push(source); }

  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY date DESC';
  const rows = db.prepare(sql).all(...params);
  const allOrders = rows.map(toOrder);
  const statusFilteredOrders = statusFilter ? allOrders.filter((order) => order.status === statusFilter) : allOrders;
  const visibleOrders = filterOrdersByRowPermissions(db, req.user!, statusFilteredOrders);
  const total = visibleOrders.length;
  const paged = visibleOrders.slice(offset, offset + limit);
  res.json({ data: paged, total, page: pageNum, size: limit });
});

router.get('/:id', checkPermission('order', 'read'), (req: AuthRequest, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '订单不存在' }); return; }
  const order = toOrder(row);
  const readable = filterOrdersByRowPermissions(db, req.user!, [order]).length > 0;
  if (!readable) {
    res.status(403).json({ error: '无权查看此订单' });
    return;
  }
  res.json(order);
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

  const nextStatus = normalizeOrderStatus(o.status || 'PENDING_APPROVAL');

  db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_method, payment_terms, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config, opportunity_id, opportunity_name, original_order_id, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, o.customerId, o.customerName, o.customerType ?? null,
    o.customerLevel ?? null, o.customerIndustry ?? null, o.customerRegion ?? null,
    o.date || new Date().toISOString(), nextStatus, o.total || 0,
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
  const existingOrder = toOrder(existing);

  const isAdmin = req.user!.role === 'Admin';
  const isOwner = existing.sales_rep_id === req.user!.userId;
  const isManager = ['Business', 'Finance', 'Commerce'].includes(req.user!.role);
  if (!isAdmin && !isOwner && !isManager) {
    res.status(403).json({ error: '无权修改此订单' });
    return;
  }

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
    creatorId: merged.creatorId, creatorName: merged.creatorName, creatorPhone: merged.creatorPhone,
    industryLine: merged.industryLine, province: merged.province, city: merged.city, district: merged.district,
    isAuthConfirmed: merged.isAuthConfirmed, authConfirmedDate: merged.authConfirmedDate,
    isPackageConfirmed: merged.isPackageConfirmed, packageConfirmedDate: merged.packageConfirmedDate,
    isShippingConfirmed: merged.isShippingConfirmed, shippingConfirmedDate: merged.shippingConfirmedDate,
    isCDBurned: merged.isCDBurned, cdBurnedDate: merged.cdBurnedDate,
    shippedDate: merged.shippedDate, carrier: merged.carrier, trackingNumber: merged.trackingNumber,
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
    merged.customerId, merged.customerName, merged.status, merged.total, JSON.stringify(merged.items || []),
    merged.source, merged.buyerType, merged.shippingAddress ?? null, merged.deliveryMethod ?? null,
    merged.isPaid ? 1 : 0, merged.paymentDate ?? null, merged.paymentMethod ?? null, merged.paymentTerms ?? null,
    merged.paymentRecord ? JSON.stringify(merged.paymentRecord) : null,
    JSON.stringify(existingOrder.approval || {}), JSON.stringify(existingOrder.approvalRecords || []),
    merged.salesRepId ?? null, merged.salesRepName ?? null,
    merged.businessManagerId ?? null, merged.businessManagerName ?? null,
    merged.invoiceInfo ? JSON.stringify(merged.invoiceInfo) : null,
    merged.acceptanceInfo ? JSON.stringify(merged.acceptanceInfo) : null,
    merged.acceptanceConfig ? JSON.stringify(merged.acceptanceConfig) : null,
    merged.refundReason ?? null, merged.refundAmount ?? null, extra, id
  );

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'UPDATE', 'Order', id, `更新订单 ${id}，状态: ${merged.status}`);

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

  const currentStatus = normalizeOrderStatus(existing.status);
  if (currentStatus !== 'PENDING_APPROVAL') {
    res.status(400).json({ error: `当前状态 ${currentStatus} 不允许审批操作` });
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
router.get('/:id/logs', checkPermission('order', 'read'), (req: AuthRequest, res) => {
  const db = getDb();
  const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!orderRow) { res.status(404).json({ error: '订单不存在' }); return; }
  const readable = filterOrdersByRowPermissions(db, req.user!, [toOrder(orderRow)]).length > 0;
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
