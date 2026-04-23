import { getDb, initSchema } from './db.ts';
import {
  initialProducts, initialMerchandises, initialAtomicCapabilities,
  initialAuthTypes,
  initialDepartments, initialRoles, initialUsers, initialChannels,
  initialStandaloneEnterprises,
} from '../data/staticData.ts';
import { initialSpaces, initialSpaceRoles } from '../data/spaceSeedData.ts';
import {
  generateCustomers, generateOpportunities, generateOrders,
  generateContracts, generateRemittances, generateInvoices,
  generatePerformances, generateAuthorizations, generateDeliveryInfos,
  generateSubscriptionChainOrders,
} from '../data/generators.ts';
import { hashPassword } from './auth.ts';

function hash(password: string): string {
  return hashPassword(password);
}

function ensureSpaceSeedData(db: any) {
  const insertSpace = db.prepare(`
    INSERT OR IGNORE INTO spaces (id, name, description, icon, perm_tree, resource_config, column_config, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of initialSpaces) {
    insertSpace.run(
      s.id,
      s.name,
      s.description,
      s.icon,
      JSON.stringify(s.permTree),
      JSON.stringify(s.resourceConfig),
      JSON.stringify(s.columnConfig),
      s.sortOrder ?? 0,
    );
  }

  const insertSpaceRole = db.prepare(`
    INSERT OR IGNORE INTO space_roles (id, space_id, name, description, permissions, row_permissions, row_logic, column_permissions, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of initialSpaceRoles) {
    insertSpaceRole.run(
      r.id,
      r.spaceId,
      r.name,
      r.description,
      JSON.stringify(r.permissions),
      JSON.stringify(r.rowPermissions ?? []),
      JSON.stringify(r.rowLogic ?? {}),
      JSON.stringify(r.columnPermissions ?? []),
      r.sortOrder ?? 0,
    );
  }

  // 默认把一个 Admin 加为 SAB 应用管理员（幂等）
  const sabSpace = initialSpaces.find(s => s.id === 'space_sab_insight') || initialSpaces[0];
  const sabAdminRole = initialSpaceRoles.find(r => r.spaceId === sabSpace?.id && r.id === 'sr_sab_admin');
  if (sabSpace && sabAdminRole) {
    const adminUser = db.prepare(`SELECT id FROM users WHERE role = 'Admin' ORDER BY rowid ASC LIMIT 1`).get() as { id?: string } | undefined;
    if (adminUser?.id) {
      const existing = db.prepare(`SELECT id FROM space_members WHERE space_id = ? AND user_id = ?`).get(sabSpace.id, adminUser.id) as { id?: string } | undefined;
      if (!existing) {
        db.prepare(`
          INSERT INTO space_members (id, space_id, user_id, role_id, is_admin)
          VALUES (?, ?, ?, ?, ?)
        `).run(`sm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, sabSpace.id, adminUser.id, sabAdminRole.id, 1);
      }
    }
  }
}

function migrateRolesToArray(db: any) {
  const rows = db.prepare("SELECT id, role FROM users WHERE role NOT LIKE '[%'").all() as Array<{ id: string; role: string }>;
  if (rows.length === 0) return;
  console.log(`[seed] Migrating ${rows.length} user(s) from single role to roles array...`);
  const update = db.prepare('UPDATE users SET role = ? WHERE id = ?');
  for (const row of rows) {
    update.run(JSON.stringify([row.role]), row.id);
  }
}

function migrateSpaceTextToApp(db: any) {
  let total = 0;
  // 角色名称：空间管理员 → 应用管理员
  const r1 = db.prepare("UPDATE space_roles SET name = REPLACE(name, '空间', '应用') WHERE name LIKE '%空间%'").run();
  total += r1.changes || 0;
  // 角色描述
  const r2 = db.prepare("UPDATE space_roles SET description = REPLACE(description, '空间', '应用') WHERE description LIKE '%空间%'").run();
  total += r2.changes || 0;
  // 应用描述（resourceConfig 里的 JSON 字段）
  const spaces = db.prepare("SELECT id, resource_config FROM spaces WHERE resource_config LIKE '%空间%'").all() as any[];
  if (spaces.length > 0) {
    const updRC = db.prepare('UPDATE spaces SET resource_config = ? WHERE id = ?');
    for (const s of spaces) {
      updRC.run(s.resource_config.replace(/空间/g, '应用'), s.id);
    }
    total += spaces.length;
  }
  if (total > 0) {
    console.log(`[seed] Migrated "空间" → "应用" text in ${total} record(s).`);
  }
}

function ensureSubscriptionChainOrders(db: any) {
  const existing = db.prepare(
    "SELECT COUNT(*) as n FROM orders WHERE order_remark = '【订阅链】与续费管理订阅同源，勿删'"
  ).get() as { n: number };
  if (existing.n > 0) return;

  // 需要客户和产品数据从 DB 读取（Seed 阶段 static data 已入库）
  const customers = (db.prepare('SELECT * FROM customers').all() as any[]).map((r: any) => ({
    id: r.id, companyName: r.company_name, industry: r.industry,
    customerType: r.customer_type, level: r.level, region: r.region,
  }));
  const products = (db.prepare('SELECT * FROM products').all() as any[]).map((r: any) => ({
    id: r.id, name: r.name, category: r.category, subCategory: r.sub_category,
    skus: JSON.parse(r.skus || '[]'),
  }));
  const users = (db.prepare('SELECT * FROM users').all() as any[]).map((r: any) => ({
    id: r.id, name: r.name, roles: (() => {
      try { return JSON.parse(r.role); } catch { return [r.role]; }
    })(),
  }));

  const subOrders = generateSubscriptionChainOrders({
    customers: customers as any, products: products as any, users: users as any,
  });

  if (subOrders.length === 0) return;

  const ins = db.prepare(`
    INSERT OR IGNORE INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_date, payment_method, payment_terms, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, order_remark, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const o of subOrders) {
      const extra = JSON.stringify({
        directChannel: o.directChannel, terminalChannel: o.terminalChannel,
        orderType: o.orderType, creatorId: o.creatorId, creatorName: o.creatorName,
      });
      ins.run(
        o.id, o.customerId, o.customerName, o.customerType ?? null,
        o.customerLevel ?? null, o.customerIndustry ?? null, o.customerRegion ?? null,
        o.date, o.status, o.total, JSON.stringify(o.items), o.source, o.buyerType,
        o.buyerName ?? null, o.buyerId ?? null, o.shippingAddress ?? null,
        o.deliveryMethod ?? null, o.isPaid ? 1 : 0, o.paymentDate ?? null,
        o.paymentMethod ?? null, o.paymentTerms ?? null,
        JSON.stringify(o.approval), JSON.stringify(o.approvalRecords),
        o.salesRepId ?? null, o.salesRepName ?? null,
        o.businessManagerId ?? null, o.businessManagerName ?? null,
        (o as any).orderRemark ?? null, extra,
      );
    }
  });
  tx();
  console.log(`[seed] Inserted ${subOrders.length} subscription chain order(s) for 续费管理.`);
}

export function seedDatabase() {
  const db = getDb();
  initSchema();

  const count = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number };
  if (count.n > 0) {
    ensureSpaceSeedData(db);
    migrateRolesToArray(db);
    migrateSpaceTextToApp(db);
    ensureSubscriptionChainOrders(db);
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
    const rolesJson = JSON.stringify(u.roles ?? []);
    insertUser.run(u.id, u.accountId, u.name, u.email, u.phone ?? null, defaultPassword,
      rolesJson, u.userType, u.status, u.avatar ?? null, u.departmentId ?? null, u.monthBadge ?? null);
  }

  // --- Departments ---
  const insertDept = db.prepare(`INSERT INTO departments (id, name, description, parent_id) VALUES (?, ?, ?, ?)`);
  for (const d of initialDepartments) {
    insertDept.run(d.id, d.name, d.description ?? null, d.parentId ?? null);
  }

  // --- Roles ---
  const insertRole = db.prepare(`INSERT INTO roles (id, name, description, permissions, is_system, row_permissions, row_logic, column_permissions, app_permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of initialRoles) {
    insertRole.run(
      r.id, r.name, r.description, JSON.stringify(r.permissions), r.isSystem ? 1 : 0,
      JSON.stringify(r.rowPermissions ?? []), JSON.stringify((r as any).rowLogic ?? {}),
      JSON.stringify(r.columnPermissions ?? []), JSON.stringify((r as any).appPermissions ?? {}),
    );
  }

  // --- Products ---
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, license_tpl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of initialProducts) {
    insertProduct.run(p.id, p.name, p.category, p.subCategory ?? null, p.description ?? null,
      p.status, JSON.stringify(p.tags ?? []), JSON.stringify(p.skus),
      JSON.stringify(p.composition ?? []), JSON.stringify(p.installPackages ?? []),
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

  // --- Contracts (generated, needed by orders) ---
  const contracts = generateContracts(customers);

  // --- Orders (generated) ---
  const orders = generateOrders({
    customers, products: initialProducts, users: initialUsers,
    merchandises: initialMerchandises, opportunities, channels: initialChannels,
    contracts,
  });
  // 同时生成订阅链演示订单
  const subscriptionOrders = generateSubscriptionChainOrders({
    customers, products: initialProducts, users: initialUsers,
  });
  const allOrders = [...orders, ...subscriptionOrders];

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, customer_name, customer_type, customer_level, customer_industry, customer_region, date, status, total, items, source, buyer_type, buyer_name, buyer_id, shipping_address, delivery_method, is_paid, payment_date, payment_method, payment_terms, payment_record, approval, approval_records, sales_rep_id, sales_rep_name, biz_manager_id, biz_manager_name, invoice_info, acceptance_info, acceptance_config, opportunity_id, opportunity_name, original_order_id, refund_reason, refund_amount, order_remark, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const o of allOrders) {
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
      o.refundReason ?? null, o.refundAmount ?? null,
      (o as any).orderRemark ?? null, extra);
  }

  // --- Contracts (insert) ---
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

  // --- Performances ---
  const performances = generatePerformances();
  const insertPerf = db.prepare(`
    INSERT INTO performances (id, order_id, acceptance_detail_id, order_status, detail_amount_subtotal, acceptance_ratio, deferral_ratio, post_contract_status, discount, cost_amount, sales_performance, weighted_sales_performance, project_weight_coeff, product_weight_coeff_sub, product_weight_coeff_auth, service_type, owner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of performances) {
    insertPerf.run(p.id, p.orderId, p.acceptanceDetailId, p.orderStatus,
      p.detailAmountSubtotal, p.acceptanceRatio, p.deferralRatio,
      p.postContractStatus, p.discount, p.costAmount,
      p.salesPerformance, p.weightedSalesPerformance,
      p.projectWeightCoeff, p.productWeightCoeffSubscription,
      p.productWeightCoeffAuthorization, p.serviceType, p.owner);
  }

  // --- Authorizations ---
  const authorizations = generateAuthorizations();
  const insertAuth = db.prepare(`
    INSERT INTO authorizations (id, auth_code, order_id, licensee, customer_name, customer_id, product_name, product_code, auth_start_date, auth_end_date, service_start_date, service_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of authorizations) {
    insertAuth.run(a.id, a.authCode, a.orderId, a.licensee, a.customerName, a.customerId,
      a.productName, a.productCode, a.authStartDate, a.authEndDate,
      a.serviceStartDate ?? null, a.serviceEndDate ?? null);
  }

  // --- DeliveryInfos ---
  const deliveryInfos = generateDeliveryInfos();
  const insertDI = db.prepare(`
    INSERT INTO delivery_infos (id, delivery_type, order_id, quantity, auth_type, licensee, customer_name, customer_id, auth_code, auth_duration, auth_start_date, auth_end_date, service_start_date, service_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const d of deliveryInfos) {
    insertDI.run(d.id, d.deliveryType, d.orderId, d.quantity, d.authType,
      d.licensee, d.customerName, d.customerId,
      d.authCode ?? null, d.authDuration ?? null,
      d.authStartDate ?? null, d.authEndDate ?? null,
      d.serviceStartDate ?? null, d.serviceEndDate ?? null);
  }

  // --- Spaces ---
  ensureSpaceSeedData(db);

  console.log(`[seed] Done. Users: ${initialUsers.length}, Customers: ${customers.length}, Orders: ${orders.length}, Products: ${initialProducts.length}, Performances: ${performances.length}, Authorizations: ${authorizations.length}, DeliveryInfos: ${deliveryInfos.length}, Spaces: ${initialSpaces.length}`);
}
