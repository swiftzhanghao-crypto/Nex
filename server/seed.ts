import { getDb, initSchema } from './db.ts';
import {
  initialProducts, initialMerchandises, initialAtomicCapabilities,
  initialProductRights, initialRightPackages, initialLicenseDefs,
  initialDepartments, initialRoles, initialUsers, initialChannels,
  initialStandaloneEnterprises,
} from '../data/staticData.ts';
import {
  generateCustomers, generateOpportunities, generateOrders,
  generateContracts, generateRemittances, generateInvoices,
  generatePerformances, generateAuthorizations, generateDeliveryInfos,
} from '../data/generators.ts';
import crypto from 'crypto';

function hash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDatabase() {
  const db = getDb();
  initSchema();

  const count = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number };
  if (count.n > 0) {
    console.log('[seed] Database already has data, skipping seed.');
    return;
  }

  console.log('[seed] Seeding database...');
  const defaultPassword = hash('123456');

  // --- Users ---
  const insertUser = db.prepare(`
    INSERT INTO users (id, account_id, name, email, phone, password_hash, role, user_type, status, avatar, department_id, month_badge)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of initialUsers) {
    insertUser.run(u.id, u.accountId, u.name, u.email, u.phone ?? null, defaultPassword,
      u.role, u.userType, u.status, u.avatar ?? null, u.departmentId ?? null, u.monthBadge ?? null);
  }

  // --- Departments ---
  const insertDept = db.prepare(`INSERT INTO departments (id, name, description, parent_id) VALUES (?, ?, ?, ?)`);
  for (const d of initialDepartments) {
    insertDept.run(d.id, d.name, d.description ?? null, d.parentId ?? null);
  }

  // --- Roles ---
  const insertRole = db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, column_permissions) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const r of initialRoles) {
    insertRole.run(r.id, r.name, r.description, JSON.stringify(r.permissions), r.isSystem ? 1 : 0,
      JSON.stringify(r.rowPermissions ?? []), JSON.stringify(r.columnPermissions ?? []));
  }

  // --- Products ---
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, package_id, rights, license_tpl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of initialProducts) {
    insertProduct.run(p.id, p.name, p.category, p.subCategory ?? null, p.description ?? null,
      p.status, JSON.stringify(p.tags ?? []), JSON.stringify(p.skus),
      JSON.stringify(p.composition ?? []), JSON.stringify(p.installPackages ?? []),
      p.packageId ?? null, JSON.stringify(p.rights ?? []),
      p.licenseTemplate ? JSON.stringify(p.licenseTemplate) : null);
  }

  // --- Channels ---
  const insertChannel = db.prepare(`
    INSERT INTO channels (id, name, type, level, contact_name, contact_phone, email, region, status, agreement_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of initialChannels) {
    insertChannel.run(c.id, c.name, c.type, c.level, c.contactName, c.contactPhone, c.email, c.region, c.status, c.agreementDate);
  }

  // --- Customers (generated) ---
  const customers = generateCustomers(initialUsers);
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, company_name, industry, customer_type, level, region, address, shipping_address, status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of customers) {
    insertCustomer.run(c.id, c.companyName, c.industry, c.customerType, c.level,
      c.region, c.address, c.shippingAddress, c.status, c.logo ?? null,
      JSON.stringify(c.contacts), c.billingInfo ? JSON.stringify(c.billingInfo) : null,
      c.ownerId ?? null, c.ownerName ?? null, JSON.stringify(c.enterprises ?? []),
      c.nextFollowUpDate ?? null);
  }

  // --- Opportunities (generated) ---
  const opportunities = generateOpportunities(customers);
  const insertOpp = db.prepare(`
    INSERT INTO opportunities (id, crm_id, name, customer_id, customer_name, product_type, stage, probability, department, amount, expected_revenue, final_user_rev, close_date, owner_id, owner_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const o of opportunities) {
    insertOpp.run(o.id, o.crmId ?? null, o.name, o.customerId, o.customerName,
      o.productType ?? null, o.stage, o.probability, o.department ?? null, o.amount ?? null,
      o.expectedRevenue, o.finalUserRevenue ?? null, o.closeDate, o.ownerId, o.ownerName, o.createdAt);
  }

  // --- Orders (generated) ---
  const orders = generateOrders({
    customers, products: initialProducts, users: initialUsers,
    merchandises: initialMerchandises, opportunities, channels: initialChannels,
  });
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_date, payment_method, payment_terms, payment_record, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config, opportunity_id, opportunity_name, original_order_id, refund_reason, refund_amount, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const o of orders) {
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
    insertOrder.run(o.id, o.customerId, o.customerName, o.customerType ?? null,
      o.customerLevel ?? null, o.customerIndustry ?? null, o.customerRegion ?? null,
      o.date, o.status, o.total, JSON.stringify(o.items), o.source, o.buyerType,
      o.buyerName ?? null, o.buyerId ?? null, o.shippingAddress ?? null,
      o.deliveryMethod ?? null, o.isPaid ? 1 : 0, o.paymentDate ?? null,
      o.paymentMethod ?? null, o.paymentTerms ?? null,
      o.paymentRecord ? JSON.stringify(o.paymentRecord) : null,
      JSON.stringify(o.approval), JSON.stringify(o.approvalRecords),
      o.salesRepId ?? null, o.salesRepName ?? null, o.businessManagerId ?? null,
      o.businessManagerName ?? null, o.invoiceInfo ? JSON.stringify(o.invoiceInfo) : null,
      o.acceptanceInfo ? JSON.stringify(o.acceptanceInfo) : null,
      o.acceptanceConfig ? JSON.stringify(o.acceptanceConfig) : null,
      o.opportunityId ?? null, o.opportunityName ?? null, o.originalOrderId ?? null,
      o.refundReason ?? null, o.refundAmount ?? null, extra);
  }

  // --- Contracts ---
  const contracts = generateContracts(customers);
  const insertContract = db.prepare(`INSERT INTO contracts (id, code, name, external_code, contract_type, party_a, party_b, verify_status, verify_remark, amount, sign_date, order_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const c of contracts) {
    insertContract.run(c.id, c.code, c.name, c.externalCode ?? null, c.contractType, c.partyA ?? null, c.partyB ?? null, c.verifyStatus, c.verifyRemark ?? null, c.amount ?? null, c.signDate ?? null, c.orderId ?? null, c.createdAt);
  }

  // --- Remittances ---
  const remittances = generateRemittances();
  const insertRem = db.prepare(`INSERT INTO remittances (id, erp_doc_no, bank_transaction_no, type, remitter_name, remitter_account, payment_method, amount, receiver_name, receiver_account, payment_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of remittances) {
    insertRem.run(r.id, r.erpDocNo ?? null, r.bankTransactionNo ?? null, r.type, r.remitterName, r.remitterAccount ?? null, r.paymentMethod, r.amount, r.receiverName, r.receiverAccount ?? null, r.paymentTime);
  }

  // --- Invoices ---
  const invoices = generateInvoices();
  const insertInv = db.prepare(`INSERT INTO invoices (id, invoice_title, amount, apply_time, apply_type, status, order_id, tax_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const i of invoices) {
    insertInv.run(i.id, i.invoiceTitle, i.amount, i.applyTime, i.applyType, i.status, i.orderId ?? null, i.taxId ?? null, i.remark ?? null);
  }

  console.log(`[seed] Done. Users: ${initialUsers.length}, Customers: ${customers.length}, Orders: ${orders.length}, Products: ${initialProducts.length}`);
}
