import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny } from 'zod';

/**
 * 简单的请求体 zod 校验中间件。校验失败返回 400 + 详细字段路径。
 * 用法：router.post('/foo', validateBody(schema), handler)
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      res.status(400).json({ error: '请求参数校验失败', issues });
      return;
    }
    // 用经过 zod 解析后的对象覆盖（去除多余字段时也能保证下游拿到的是干净数据）
    req.body = result.data;
    next();
  };
}

// 通用片段
const idStr = z.string().min(1).max(64);
const optStr = (max = 256) => z.string().max(max).optional().nullable();

const jsonRecord = z.record(z.string(), z.unknown());
const contactSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().max(100).optional(),
  role: z.string().max(40).optional(),
}).passthrough();
const enterpriseSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().max(200).optional(),
}).passthrough();
const skuSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().max(200).optional(),
  price: z.number().optional(),
}).passthrough();
const compositionSchema = z.object({
  componentId: z.string().max(64).optional(),
  quantity: z.number().optional(),
}).passthrough();
const installPkgSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().max(200).optional(),
}).passthrough();
const rightSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().max(200).optional(),
}).passthrough();
const permNodeSchema = z.object({
  id: z.string().max(64).optional(),
  label: z.string().max(200).optional(),
}).passthrough();
const rowPermSchema = z.object({
  field: z.string().max(100).optional(),
  operator: z.string().max(40).optional(),
  value: z.unknown().optional(),
}).passthrough();

const subUnitSchema = z.object({
  id: z.string().max(64),
  unitName: z.string().min(1, '下级单位名称不能为空').max(200),
  enterpriseId: z.string().min(1, '企业ID不能为空').max(64),
  enterpriseName: z.string().max(200).optional(),
  authCount: z.union([z.string(), z.number()]),
  itContact: z.string().min(1, 'IT联系人不能为空').max(100),
  phone: z.string().min(1, '手机号不能为空').max(30),
  email: z.string().max(100).optional(),
  customerType: z.string().max(40).optional(),
  industryLine: z.string().max(40).optional(),
  sellerContact: z.string().max(100).optional(),
}).passthrough();

const orderItemSchema = z.object({
  productId: z.string().max(64).optional(),
  productName: z.string().max(200).optional(),
  skuId: z.string().max(64).optional(),
  quantity: z.number().int().positive().optional(),
  subUnitAuthMode: z.enum(['none', 'separate_auth_separate_eid', 'separate_auth_unified_eid', 'unified_auth_with_list']).optional(),
  subUnits: z.array(subUnitSchema).max(500).optional(),
}).passthrough();

export const orderCreateSchema = z.object({
  id: z.string().max(64).optional(),
  customerId: idStr,
  customerName: z.string().min(1).max(200),
  customerType: optStr(),
  customerLevel: optStr(),
  customerIndustry: optStr(),
  customerRegion: optStr(),
  date: z.string().optional(),
  status: z.string().max(40).optional(),
  total: z.number().nonnegative().optional(),
  items: z.array(orderItemSchema).max(500).optional(),
  source: z.string().max(40).optional(),
  buyerType: z.enum(['Customer', 'Channel', 'SelfDeal', 'Internal']).optional(),
  buyerName: optStr(),
  buyerId: optStr(64),
  shippingAddress: optStr(500),
  deliveryMethod: optStr(),
  paymentMethod: optStr(),
  paymentTerms: optStr(),
  approval: jsonRecord.optional(),
  approvalRecords: z.array(jsonRecord).optional(),
  salesRepId: optStr(64),
  salesRepName: optStr(),
  businessManagerId: optStr(64),
  businessManagerName: optStr(),
  invoiceInfo: jsonRecord.optional(),
  acceptanceInfo: jsonRecord.optional(),
  acceptanceConfig: jsonRecord.optional(),
  opportunityId: optStr(64),
  opportunityName: optStr(),
  originalOrderId: optStr(64),
  // 业务扩展字段（写入 extra），统一允许通过
}).passthrough();

export const customerCreateSchema = z.object({
  id: z.string().max(64).optional(),
  companyName: z.string().min(1).max(200),
  industry: z.string().min(1).max(80),
  customerType: z.string().min(1).max(40),
  level: z.string().min(1).max(40),
  region: z.string().min(1).max(80),
  address: z.string().max(500).optional(),
  shippingAddress: z.string().max(500).optional(),
  status: z.string().max(40).optional(),
  logo: optStr(500),
  contacts: z.array(contactSchema).max(200).optional(),
  billingInfo: jsonRecord.optional(),
  ownerId: optStr(64),
  ownerName: optStr(),
  enterprises: z.array(enterpriseSchema).max(200).optional(),
  nextFollowUpDate: optStr(40),
}).passthrough();

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  companyName: z.string().min(1).max(200),
});

// 订单更新使用宽松 partial（保留必填项 customerId / customerName）
export const orderUpdateSchema = orderCreateSchema.partial().extend({
  customerId: idStr,
  customerName: z.string().min(1).max(200),
}).passthrough();

// ============================================================
// Products
// ============================================================
export const productCreateSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1, '产品名称不能为空').max(300),
  category: z.string().min(1).max(80),
  subCategory: optStr(80),
  description: optStr(2000),
  status: z.enum(['OnShelf', 'OffShelf']).optional(),
  tags: z.array(z.string().max(40)).max(50).optional(),
  skus: z.array(skuSchema).max(200).optional(),
  composition: z.array(compositionSchema).max(200).optional(),
  installPkgs: z.array(installPkgSchema).max(50).optional(),
  rights: z.array(rightSchema).max(200).optional(),
  licenseTpl: z.unknown().optional(),
  productType: optStr(80),
  onlineDelivery: optStr(80),
  productClass: optStr(80),
  productClassification: optStr(80),
  productSeries: optStr(80),
  productLine: optStr(80),
  productCategory: optStr(80),
  productClassFinance: optStr(80),
  productLineFinance: optStr(80),
  productSeriesFinance: optStr(80),
  businessDeliveryName: optStr(200),
  salesOrgName: optStr(200),
  salesScope: z.array(z.unknown()).max(200).optional(),
  linkedServices: z.array(z.unknown()).max(100).optional(),
}).passthrough();

export const productUpdateSchema = productCreateSchema.partial().extend({
  name: z.string().min(1).max(300),
});

// ============================================================
// Channels
// ============================================================
export const channelCreateSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1, '渠道名称不能为空').max(200),
  type: z.string().min(1).max(40),
  level: z.string().min(1).max(40),
  contactName: z.string().min(1, '联系人不能为空').max(100),
  contactPhone: z.string().min(1, '联系电话不能为空').max(30),
  email: z.string().email('邮箱格式不正确').max(100),
  region: z.string().min(1).max(80),
  status: z.enum(['Active', 'Inactive']).optional(),
  agreementDate: z.string().min(1).max(20),
}).passthrough();

export const channelUpdateSchema = channelCreateSchema.partial().extend({
  name: z.string().min(1).max(200),
});

// ============================================================
// Opportunities
// ============================================================
export const opportunityCreateSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1, '商机名称不能为空').max(300),
  customerId: idStr,
  customerName: z.string().min(1).max(200),
  productType: optStr(80),
  products: optStr(1000),
  stage: z.string().max(40).optional(),
  probability: z.number().min(0).max(100).optional(),
  department: optStr(100),
  amount: z.number().nonnegative().optional().nullable(),
  expectedRevenue: z.number().nonnegative().optional(),
  finalUserRev: z.number().nonnegative().optional().nullable(),
  closeDate: z.string().min(1).max(20),
  ownerId: idStr,
  ownerName: z.string().min(1).max(100),
}).passthrough();

export const opportunityUpdateSchema = opportunityCreateSchema.partial().extend({
  name: z.string().min(1).max(300),
});

// ============================================================
// System: Auth Types / Sales Orgs
// ============================================================
export const authTypeSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1, '名称不能为空').max(100),
  period: z.string().min(1).max(40),
  nccBiz: z.string().max(100).optional(),
  nccIncome: z.string().max(100).optional(),
  hasUpgradeWarranty: z.boolean().optional(),
  purchaseUnit: optStr(40),
  auxPurchaseUnit: optStr(40),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const salesOrgSchema = z.object({
  id: z.string().min(1).max(64),
  no: z.number().int().nonnegative(),
  name: z.string().min(1, '组织名称不能为空').max(200),
  shortName: z.string().max(100).optional(),
  financeCode: z.string().max(20).optional(),
  orgType: z.enum(['金山', '数科']),
  status: z.enum(['正常', '待补充']).optional(),
});

// ============================================================
// Finance: Contracts / Remittances / Invoices
// ============================================================
export const contractCreateSchema = z.object({
  id: z.string().max(64).optional(),
  code: z.string().min(1).max(64),
  name: z.string().min(1, '合同名称不能为空').max(300),
  externalCode: optStr(64),
  contractType: z.string().min(1).max(40),
  partyA: optStr(200),
  partyB: optStr(200),
  verifyStatus: z.string().max(40).optional(),
  verifyRemark: optStr(500),
  amount: z.number().nonnegative().optional().nullable(),
  signDate: optStr(20),
  orderId: optStr(64),
  customerId: optStr(64),
}).passthrough();

export const remittanceCreateSchema = z.object({
  id: z.string().max(64).optional(),
  erpDocNo: optStr(64),
  bankTransactionNo: optStr(64),
  type: z.string().min(1).max(40),
  remitterName: z.string().min(1, '付款人不能为空').max(200),
  remitterAccount: optStr(64),
  paymentMethod: z.string().min(1).max(40),
  amount: z.number().positive('金额必须大于0'),
  receiverName: z.string().min(1, '收款人不能为空').max(200),
  receiverAccount: optStr(64),
  paymentTime: z.string().min(1).max(40),
}).passthrough();

export const invoiceCreateSchema = z.object({
  id: z.string().max(64).optional(),
  invoiceTitle: z.string().min(1, '发票抬头不能为空').max(200),
  amount: z.number().positive('金额必须大于0'),
  applyTime: z.string().min(1).max(40),
  applyType: z.string().min(1).max(40),
  status: z.string().max(40).optional(),
  orderId: optStr(64),
  taxId: optStr(64),
  remark: optStr(500),
}).passthrough();

/**
 * 校验订单行中下级单位的业务规则：
 * - authCount 之和必须等于行 quantity
 * - 必填字段不能为空
 * 返回 null 表示通过，否则返回错误信息。
 */
export function validateSubUnits(items: z.infer<typeof orderItemSchema>[] | undefined): string | null {
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const mode = item.subUnitAuthMode;
    if (!mode || mode === 'none') continue;
    const subs = item.subUnits;
    if (!subs || subs.length === 0) continue;

    const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity ?? ''), 10);
    if (!qty || qty <= 0) continue;

    let authTotal = 0;
    for (let j = 0; j < subs.length; j++) {
      const u = subs[j];
      const count = typeof u.authCount === 'number' ? u.authCount : parseInt(u.authCount);
      if (isNaN(count) || count <= 0) {
        return `第 ${i + 1} 行产品"${item.productName || ''}"的第 ${j + 1} 个下级单位授权数量无效`;
      }
      if (!u.unitName || !u.unitName.trim()) {
        return `第 ${i + 1} 行产品的第 ${j + 1} 个下级单位名称不能为空`;
      }
      if (!u.enterpriseId || !u.enterpriseId.trim()) {
        return `第 ${i + 1} 行产品"${item.productName || ''}"的第 ${j + 1} 个下级单位企业ID不能为空`;
      }
      authTotal += count;
    }
    if (authTotal !== qty) {
      return `产品"${item.productName || ''}"的下级单位授权数量合计 (${authTotal}) 与明细数量 (${qty}) 不一致`;
    }
  }
  return null;
}

// ============================================================
// Spaces
// ============================================================
export const spaceCreateSchema = z.object({
  name: z.string().min(1, '应用名称不能为空').max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(40).optional(),
  permTree: z.array(permNodeSchema).optional(),
  resourceConfig: z.array(z.unknown()).optional(),
  columnConfig: z.array(z.unknown()).optional(),
  adminUserId: z.string().max(64).optional(),
});

export const spaceUpdateSchema = spaceCreateSchema.partial();

export const spaceRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().max(100)).max(500).optional(),
  rowPermissions: z.array(rowPermSchema).max(200).optional(),
  rowLogic: jsonRecord.optional(),
  columnPermissions: z.array(permNodeSchema).max(200).optional(),
});

export const spaceMemberSchema = z.object({
  userId: z.string().min(1).max(64),
  roleId: z.string().min(1).max(64),
  isAdmin: z.boolean().optional(),
});

// ============================================================
// Users
// ============================================================
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(100).optional(),
  phone: z.string().max(30).optional().nullable(),
  roles: z.array(z.string().max(40)).max(20).optional(),
  role: z.union([z.string().max(40), z.array(z.string().max(40))]).optional(),
  userType: z.enum(['Internal', 'External']).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  departmentId: z.string().max(64).optional().nullable(),
  channelId: z.string().max(64).optional().nullable(),
});

export const roleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().max(100)).max(1000).optional(),
  rowPermissions: z.array(rowPermSchema).max(200).optional(),
  rowLogic: jsonRecord.optional(),
  columnPermissions: z.array(permNodeSchema).max(200).optional(),
  appPermissions: jsonRecord.optional(),
});

// ============================================================
// AI
// ============================================================
export const aiGenerateSchema = z.object({
  prompt: z.string().min(1, '提示词不能为空').max(10000),
  context: z.string().max(50000).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
}).passthrough(); // 保留 generate-json 所需的 schema、model 等扩展字段

export const aiCategorySuggestSchema = z.object({
  productName: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
});

// ============================================================
// Auth
// ============================================================
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1),
});

// ============================================================
// CRM 销售易
// ============================================================
export const crmXsySyncSchema = z.object({
  limit: z.number().int().positive().max(500).optional(),
});

// ============================================================
// Bulk Import
// ============================================================
export const customerImportBatchSchema = z.object({
  items: z.array(customerCreateSchema).min(1).max(500),
});

export const productImportBatchSchema = z.object({
  items: z.array(productCreateSchema).min(1).max(500),
});
