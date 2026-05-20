import { Router } from 'express';
import { getDb } from '../db.ts';
import { authMiddleware, type AuthRequest } from '../auth.ts';
import { checkPermission } from '../rbac.ts';
import { validateBody, customerImportBatchSchema, productImportBatchSchema } from '../validate.ts';
import { getUserName } from '../utils.ts';
import type { z } from 'zod';

type CustomerImportItem = z.infer<typeof customerImportBatchSchema>['items'][number];
type ProductImportItem = z.infer<typeof productImportBatchSchema>['items'][number];

const router = Router();
router.use(authMiddleware);

router.post('/customers', checkPermission('customer', 'create'), validateBody(customerImportBatchSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const { items } = req.body as { items: CustomerImportItem[] };
  const userName = getUserName(db, req.user!.userId);

  const insert = db.prepare(`
    INSERT INTO customers (id, company_name, industry, customer_type, level, region, address, shipping_address, status, logo, contacts, billing_info, owner_id, owner_name, enterprises, next_follow_up)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAudit = db.prepare(
    `INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    const ids: string[] = [];
    for (const c of items) {
      const id = c.id || `C${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      insert.run(
        id, c.companyName, c.industry, c.customerType, c.level, c.region,
        c.address || '', c.shippingAddress || '', c.status || 'Active', c.logo ?? null,
        JSON.stringify(c.contacts || []), c.billingInfo ? JSON.stringify(c.billingInfo) : null,
        c.ownerId ?? null, c.ownerName ?? null, JSON.stringify(c.enterprises || []),
        c.nextFollowUpDate ?? null,
      );
      insertAudit.run(req.user!.userId, userName, 'IMPORT', 'Customer', id, `批量导入客户 ${c.companyName}`);
      ids.push(id);
    }
    return ids;
  });

  const ids = tx();
  res.status(201).json({ imported: ids.length, ids });
});

router.post('/products', checkPermission('product', 'create'), validateBody(productImportBatchSchema), (req: AuthRequest, res) => {
  const db = getDb();
  const { items } = req.body as { items: ProductImportItem[] };
  const userName = getUserName(db, req.user!.userId);

  const insert = db.prepare(`
    INSERT INTO products (id, name, category, sub_category, description, status, tags, skus, composition, install_pkgs, license_tpl,
      product_type, online_delivery, product_class, product_classification, product_series, product_line,
      product_category, product_class_finance, product_line_finance, product_series_finance,
      business_delivery_name, sales_org_name, sales_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAudit = db.prepare(
    `INSERT INTO audit_logs (user_id, user_name, action, resource, resource_id, detail) VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    const ids: string[] = [];
    for (const p of items) {
      const id = p.id || `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      insert.run(
        id, p.name, p.category, p.subCategory ?? null, p.description ?? null,
        p.status || 'OnShelf', JSON.stringify(p.tags || []), JSON.stringify(p.skus || []),
        JSON.stringify(p.composition || []), JSON.stringify(p.installPkgs || []),
        p.licenseTpl ? JSON.stringify(p.licenseTpl) : null,
        p.productType ?? null, p.onlineDelivery ?? null, p.productClass ?? null,
        p.productClassification ?? null, p.productSeries ?? null, p.productLine ?? null,
        p.productCategory ?? null, p.productClassFinance ?? null, p.productLineFinance ?? null,
        p.productSeriesFinance ?? null, p.businessDeliveryName ?? null, p.salesOrgName ?? null,
        JSON.stringify(p.salesScope || []),
      );
      insertAudit.run(req.user!.userId, userName, 'IMPORT', 'Product', id, `批量导入产品 ${p.name}`);
      ids.push(id);
    }
    return ids;
  });

  const ids = tx();
  res.status(201).json({ imported: ids.length, ids });
});

export default router;
