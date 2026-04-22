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
  items: z.array(z.any()).max(500).optional(),
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
