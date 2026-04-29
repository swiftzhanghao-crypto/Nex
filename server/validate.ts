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
  approval: z.record(z.string(), z.any()).optional(),
  approvalRecords: z.array(z.any()).optional(),
  salesRepId: optStr(64),
  salesRepName: optStr(),
  businessManagerId: optStr(64),
  businessManagerName: optStr(),
  invoiceInfo: z.record(z.string(), z.any()).optional(),
  acceptanceInfo: z.record(z.string(), z.any()).optional(),
  acceptanceConfig: z.record(z.string(), z.any()).optional(),
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
  contacts: z.array(z.any()).max(200).optional(),
  billingInfo: z.record(z.string(), z.any()).optional(),
  ownerId: optStr(64),
  ownerName: optStr(),
  enterprises: z.array(z.any()).max(200).optional(),
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

/**
 * 校验订单行中下级单位的业务规则：
 * - authCount 之和必须等于行 quantity
 * - 必填字段不能为空
 * 返回 null 表示通过，否则返回错误信息。
 */
export function validateSubUnits(items: any[] | undefined): string | null {
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const mode = item.subUnitAuthMode;
    if (!mode || mode === 'none') continue;
    const subs: any[] = item.subUnits;
    if (!subs || subs.length === 0) continue;

    const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity);
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
