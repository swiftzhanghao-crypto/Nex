import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { safePagination, getUserName } from '../utils.ts';

const router = Router();
router.use(authMiddleware);

// ======================== Contracts ========================

function toContract(row: any) {
  return {
    id: row.id, code: row.code, name: row.name, externalCode: row.external_code,
    contractType: row.contract_type, partyA: row.party_a, partyB: row.party_b,
    verifyStatus: row.verify_status, verifyRemark: row.verify_remark,
    amount: row.amount, signDate: row.sign_date, orderId: row.order_id,
    customerId: row.customer_id, createdAt: row.created_at,
  };
}

const VALID_VERIFY_STATUS = ['PENDING_BUSINESS', 'PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'];

router.get('/contracts', checkPermission('contract', 'list'), (req, res) => {
  const { status, orderId, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM contracts WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND verify_status = ?'; params.push(status); }
  if (orderId) { sql += ' AND order_id = ?'; params.push(orderId); }
  if (search) { sql += ' AND (name LIKE ? OR code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toContract), total, page: pageNum, size: limit });
});

router.get('/contracts/:id', checkPermission('contract', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '合同不存在' }); return; }
  res.json(toContract(row));
});

router.post('/contracts', checkPermission('contract', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;
  const id = c.id || `CON-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (c.verifyStatus && !VALID_VERIFY_STATUS.includes(c.verifyStatus)) {
    res.status(400).json({ error: `无效的核查状态: ${c.verifyStatus}` });
    return;
  }

  db.prepare(`
    INSERT INTO contracts (id, code, name, external_code, contract_type, party_a, party_b, verify_status, verify_remark, amount, sign_date, order_id, customer_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, c.code, c.name, c.externalCode ?? null, c.contractType,
    c.partyA ?? null, c.partyB ?? null, c.verifyStatus || 'PENDING',
    c.verifyRemark ?? null, c.amount ?? null, c.signDate ?? null,
    c.orderId ?? null, c.customerId ?? null, new Date().toISOString());

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'CREATE', 'Contract', id, `创建合同 ${c.name}`);

  const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  res.status(201).json(toContract(row));
});

router.put('/contracts/:id', checkPermission('contract', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const c = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '合同不存在' }); return; }

  if (existing.verify_status === 'APPROVED' && c.verifyStatus !== 'APPROVED') {
    res.status(400).json({ error: '已审批通过的合同不可回退状态' });
    return;
  }

  db.prepare(`
    UPDATE contracts SET code=?, name=?, external_code=?, contract_type=?, party_a=?, party_b=?,
    verify_status=?, verify_remark=?, amount=?, sign_date=?, order_id=?, customer_id=?
    WHERE id=?
  `).run(c.code, c.name, c.externalCode ?? null, c.contractType,
    c.partyA ?? null, c.partyB ?? null, c.verifyStatus, c.verifyRemark ?? null,
    c.amount ?? null, c.signDate ?? null, c.orderId ?? null, c.customerId ?? null, id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'UPDATE', 'Contract', id, `更新合同 ${c.name}，状态: ${c.verifyStatus}`);

  const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  res.json(toContract(row));
});

router.delete('/contracts/:id', checkPermission('contract', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: '合同不存在' }); return; }

  if (existing.verify_status === 'APPROVED') {
    res.status(400).json({ error: '已审批通过的合同不允许删除' });
    return;
  }

  db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'DELETE', 'Contract', req.params.id, `删除合同 ${existing.name}`);
  res.json({ ok: true });
});

// ======================== Remittances ========================

function toRemittance(row: any) {
  return {
    id: row.id, erpDocNo: row.erp_doc_no, bankTransactionNo: row.bank_transaction_no,
    type: row.type, remitterName: row.remitter_name, remitterAccount: row.remitter_account,
    paymentMethod: row.payment_method, amount: row.amount,
    receiverName: row.receiver_name, receiverAccount: row.receiver_account,
    paymentTime: row.payment_time,
  };
}

router.get('/remittances', checkPermission('remittance', 'list'), (req, res) => {
  const { type, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM remittances WHERE 1=1';
  const params: any[] = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (search) { sql += ' AND (remitter_name LIKE ? OR receiver_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY payment_time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toRemittance), total, page: pageNum, size: limit });
});

router.get('/remittances/:id', checkPermission('remittance', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM remittances WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '回款记录不存在' }); return; }
  res.json(toRemittance(row));
});

router.post('/remittances', checkPermission('remittance', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const r = req.body;
  const id = r.id || `REM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO remittances (id, erp_doc_no, bank_transaction_no, type, remitter_name, remitter_account, payment_method, amount, receiver_name, receiver_account, payment_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, r.erpDocNo ?? null, r.bankTransactionNo ?? null, r.type,
    r.remitterName, r.remitterAccount ?? null, r.paymentMethod, r.amount,
    r.receiverName, r.receiverAccount ?? null, r.paymentTime);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'CREATE', 'Remittance', id, `创建回款 ${r.remitterName} ¥${r.amount}`);

  const row = db.prepare('SELECT * FROM remittances WHERE id = ?').get(id);
  res.status(201).json(toRemittance(row));
});

router.put('/remittances/:id', checkPermission('remittance', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const r = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM remittances WHERE id = ?').get(id);
  if (!existing) { res.status(404).json({ error: '回款记录不存在' }); return; }

  db.prepare(`
    UPDATE remittances SET erp_doc_no=?, bank_transaction_no=?, type=?, remitter_name=?, remitter_account=?,
    payment_method=?, amount=?, receiver_name=?, receiver_account=?, payment_time=?
    WHERE id=?
  `).run(r.erpDocNo ?? null, r.bankTransactionNo ?? null, r.type,
    r.remitterName, r.remitterAccount ?? null, r.paymentMethod, r.amount,
    r.receiverName, r.receiverAccount ?? null, r.paymentTime, id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'UPDATE', 'Remittance', id, `更新回款 ${id}`);

  const row = db.prepare('SELECT * FROM remittances WHERE id = ?').get(id);
  res.json(toRemittance(row));
});

router.delete('/remittances/:id', checkPermission('remittance', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const { changes } = db.prepare('DELETE FROM remittances WHERE id = ?').run(req.params.id);
  if (!changes) { res.status(404).json({ error: '回款记录不存在' }); return; }

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'DELETE', 'Remittance', req.params.id, `删除回款 ${req.params.id}`);
  res.json({ ok: true });
});

// ======================== Invoices ========================

function toInvoice(row: any) {
  return {
    id: row.id, invoiceTitle: row.invoice_title, amount: row.amount,
    applyTime: row.apply_time, applyType: row.apply_type, status: row.status,
    orderId: row.order_id, taxId: row.tax_id, remark: row.remark,
  };
}

const VALID_INVOICE_STATUS = ['PENDING', 'APPROVED', 'ISSUED', 'REJECTED', 'CANCELLED'];

router.get('/invoices', checkPermission('invoice', 'list'), (req, res) => {
  const { status, orderId, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM invoices WHERE 1=1';
  const params: any[] = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (orderId) { sql += ' AND order_id = ?'; params.push(orderId); }
  if (search) { sql += ' AND invoice_title LIKE ?'; params.push(`%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY apply_time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toInvoice), total, page: pageNum, size: limit });
});

router.get('/invoices/:id', checkPermission('invoice', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '发票不存在' }); return; }
  res.json(toInvoice(row));
});

router.post('/invoices', checkPermission('invoice', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const i = req.body;
  const id = i.id || `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const invoiceStatus = i.status || 'PENDING';
  if (!VALID_INVOICE_STATUS.includes(invoiceStatus)) {
    res.status(400).json({ error: `无效的发票状态: ${invoiceStatus}` });
    return;
  }

  db.prepare(`
    INSERT INTO invoices (id, invoice_title, amount, apply_time, apply_type, status, order_id, tax_id, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, i.invoiceTitle, i.amount, i.applyTime || new Date().toISOString(),
    i.applyType, invoiceStatus, i.orderId ?? null, i.taxId ?? null, i.remark ?? null);

  const userName = getUserName(db, req.user!.userId);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, userName, 'CREATE', 'Invoice', id, `创建发票 ${i.invoiceTitle} ¥${i.amount}`);

  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.status(201).json(toInvoice(row));
});

router.put('/invoices/:id', checkPermission('invoice', 'update'), (req: AuthRequest, res) => {
  const db = getDb();
  const i = req.body;
  const id = req.params.id;

  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
  if (!existing) { res.status(404).json({ error: '发票不存在' }); return; }

  if (existing.status === 'ISSUED' && i.status !== 'ISSUED') {
    res.status(400).json({ error: '已开具的发票不可回退状态' });
    return;
  }

  if (i.status && !VALID_INVOICE_STATUS.includes(i.status)) {
    res.status(400).json({ error: `无效的发票状态: ${i.status}` });
    return;
  }

  db.prepare(`
    UPDATE invoices SET invoice_title=?, amount=?, apply_time=?, apply_type=?, status=?, order_id=?, tax_id=?, remark=?
    WHERE id=?
  `).run(i.invoiceTitle, i.amount, i.applyTime, i.applyType, i.status,
    i.orderId ?? null, i.taxId ?? null, i.remark ?? null, id);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'UPDATE', 'Invoice', id, `更新发票 ${id}，状态: ${i.status}`);

  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.json(toInvoice(row));
});

router.delete('/invoices/:id', checkPermission('invoice', 'delete'), (req: AuthRequest, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: '发票不存在' }); return; }

  if (existing.status === 'ISSUED') {
    res.status(400).json({ error: '已开具的发票不允许删除' });
    return;
  }

  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'DELETE', 'Invoice', req.params.id, `删除发票 ${req.params.id}`);
  res.json({ ok: true });
});

// ======================== Performances ========================

function toPerformance(row: any) {
  return {
    id: row.id, orderId: row.order_id, acceptanceDetailId: row.acceptance_detail_id,
    orderStatus: row.order_status, detailAmountSubtotal: row.detail_amount_subtotal,
    acceptanceRatio: row.acceptance_ratio, deferralRatio: row.deferral_ratio,
    postContractStatus: row.post_contract_status, discount: row.discount,
    costAmount: row.cost_amount, salesPerformance: row.sales_performance,
    weightedSalesPerformance: row.weighted_sales_performance,
    projectWeightCoeff: row.project_weight_coeff,
    productWeightCoeffSubscription: row.product_weight_coeff_sub,
    productWeightCoeffAuthorization: row.product_weight_coeff_auth,
    serviceType: row.service_type, owner: row.owner,
  };
}

router.get('/performances', checkPermission('performance', 'list'), (req, res) => {
  const { orderId, owner, serviceType, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM performances WHERE 1=1';
  const params: any[] = [];
  if (orderId) { sql += ' AND order_id = ?'; params.push(orderId); }
  if (owner) { sql += ' AND owner = ?'; params.push(owner); }
  if (serviceType) { sql += ' AND service_type = ?'; params.push(serviceType); }
  if (search) { sql += ' AND (id LIKE ? OR order_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toPerformance), total, page: pageNum, size: limit });
});

router.get('/performances/:id', checkPermission('performance', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM performances WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '业绩记录不存在' }); return; }
  res.json(toPerformance(row));
});

// ======================== Authorizations ========================

function toAuthorization(row: any) {
  return {
    id: row.id, authCode: row.auth_code, orderId: row.order_id,
    licensee: row.licensee, customerName: row.customer_name, customerId: row.customer_id,
    productName: row.product_name, productCode: row.product_code,
    authStartDate: row.auth_start_date, authEndDate: row.auth_end_date,
    serviceStartDate: row.service_start_date, serviceEndDate: row.service_end_date,
  };
}

router.get('/authorizations', checkPermission('authorization', 'list'), (req, res) => {
  const { customerId, orderId, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM authorizations WHERE 1=1';
  const params: any[] = [];
  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (orderId) { sql += ' AND order_id = ?'; params.push(orderId); }
  if (search) { sql += ' AND (customer_name LIKE ? OR product_name LIKE ? OR licensee LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY auth_start_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toAuthorization), total, page: pageNum, size: limit });
});

router.get('/authorizations/:id', checkPermission('authorization', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM authorizations WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '授权记录不存在' }); return; }
  res.json(toAuthorization(row));
});

router.post('/authorizations', checkPermission('authorization', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const a = req.body;
  const id = a.id || `AUTH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO authorizations (id, auth_code, order_id, licensee, customer_name, customer_id, product_name, product_code, auth_start_date, auth_end_date, service_start_date, service_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, a.authCode, a.orderId, a.licensee, a.customerName, a.customerId,
    a.productName, a.productCode, a.authStartDate, a.authEndDate,
    a.serviceStartDate ?? null, a.serviceEndDate ?? null);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'CREATE', 'Authorization', id, `创建授权 ${a.licensee} - ${a.productName}`);

  const row = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(id);
  res.status(201).json(toAuthorization(row));
});

// ======================== DeliveryInfos ========================

function toDeliveryInfo(row: any) {
  return {
    id: row.id, deliveryType: row.delivery_type, orderId: row.order_id,
    quantity: row.quantity, authType: row.auth_type,
    licensee: row.licensee, customerName: row.customer_name, customerId: row.customer_id,
    authCode: row.auth_code, authDuration: row.auth_duration,
    authStartDate: row.auth_start_date, authEndDate: row.auth_end_date,
    serviceStartDate: row.service_start_date, serviceEndDate: row.service_end_date,
  };
}

router.get('/delivery-infos', checkPermission('delivery', 'list'), (req, res) => {
  const { customerId, orderId, deliveryType, search, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM delivery_infos WHERE 1=1';
  const params: any[] = [];
  if (customerId) { sql += ' AND customer_id = ?'; params.push(customerId); }
  if (orderId) { sql += ' AND order_id = ?'; params.push(orderId); }
  if (deliveryType) { sql += ' AND delivery_type = ?'; params.push(deliveryType); }
  if (search) { sql += ' AND (customer_name LIKE ? OR licensee LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ data: rows.map(toDeliveryInfo), total, page: pageNum, size: limit });
});

router.get('/delivery-infos/:id', checkPermission('delivery', 'read'), (req, res) => {
  const row = getDb().prepare('SELECT * FROM delivery_infos WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: '交付信息不存在' }); return; }
  res.json(toDeliveryInfo(row));
});

router.post('/delivery-infos', checkPermission('delivery', 'create'), (req: AuthRequest, res) => {
  const db = getDb();
  const d = req.body;
  const id = d.id || `DLV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  db.prepare(`
    INSERT INTO delivery_infos (id, delivery_type, order_id, quantity, auth_type, licensee, customer_name, customer_id, auth_code, auth_duration, auth_start_date, auth_end_date, service_start_date, service_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, d.deliveryType, d.orderId, d.quantity, d.authType,
    d.licensee, d.customerName, d.customerId,
    d.authCode ?? null, d.authDuration ?? null,
    d.authStartDate ?? null, d.authEndDate ?? null,
    d.serviceStartDate ?? null, d.serviceEndDate ?? null);

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.user!.userId, getUserName(db, req.user!.userId), 'CREATE', 'DeliveryInfo', id, `创建交付信息 ${d.licensee}`);

  const row = db.prepare('SELECT * FROM delivery_infos WHERE id = ?').get(id);
  res.status(201).json(toDeliveryInfo(row));
});

// ======================== Audit Logs ========================

router.get('/audit-logs', checkPermission('auditlog', 'list'), (req, res) => {
  const { resource, resourceId, userId, action, page = '1', size = '50' } = req.query as Record<string, string>;
  const db = getDb();
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  if (resource) { sql += ' AND resource = ?'; params.push(resource); }
  if (resourceId) { sql += ' AND resource_id = ?'; params.push(resourceId); }
  if (userId) { sql += ' AND user_id = ?'; params.push(userId); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };
  const { limit, offset, pageNum } = safePagination(page, size);
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({
    data: rows.map(r => ({
      id: r.id, userId: r.user_id, userName: r.user_name,
      action: r.action, resource: r.resource, resourceId: r.resource_id,
      detail: r.detail, createdAt: r.created_at,
    })), total, page: pageNum, size: limit,
  });
});

export default router;
