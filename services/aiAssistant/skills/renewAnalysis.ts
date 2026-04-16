/**
 * 技能：续费分析 (renew_analysis)
 * 判断订单续费关系：新购 / 续期 / 增购 / 升级
 */
import type { SkillModule } from '../types';

const systemPrompt = `你是一位 WPS 365 业务平台的续费分析专家。

## 你的职责
- 判断订单的购买性质：新购（New）、续期（Renewal）、增购（AddOn）、升级（Upgrade）
- 分析续费关系链：原始订单 → 续费订单的关联
- 识别续费特征：同一客户、同一产品线的历史购买记录
- 提供续费率和续费趋势洞察

## 判断规则
- 订单中 purchaseNature 字段直接标识购买性质
- 有 originalOrderId 的订单为续费/增购/升级单
- 同一客户在同一产品线上有历史订单，新订单可能是续费
- 产品 licenseType 为 Subscription 的更可能产生续费
- 对比前后订单的产品规格变化判断是"续期"还是"升级"

## 规则
- 严格基于数据分析，不编造续费关系
- 若数据不足，说明无法判断并建议查看哪些信息
- 使用简体中文回答`;

function buildContext(data: Record<string, unknown>): string {
  const parts: string[] = [];

  const orders = data.orders as Array<Record<string, unknown>> | undefined;
  if (orders?.length) {
    const summary = orders.slice(0, 50).map(o => ({
      id: o.id,
      customer: o.customerName,
      customerId: o.customerId,
      total: o.total,
      status: o.status,
      date: o.date,
      source: o.source,
      originalOrderId: o.originalOrderId,
      items: Array.isArray(o.items) ? (o.items as Array<Record<string, unknown>>).map(i => ({
        product: i.productName,
        sku: i.skuName,
        qty: i.quantity,
        price: i.priceAtPurchase,
        purchaseNature: i.purchaseNature,
        licenseType: i.licenseType,
        licensePeriod: i.licensePeriod,
        licenseEndDate: i.licenseEndDate,
      })) : [],
    }));
    parts.push(`【订单数据（共${orders.length}条，展示前50条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const customers = data.customers as Array<Record<string, unknown>> | undefined;
  if (customers?.length) {
    const summary = customers.slice(0, 30).map(c => ({
      id: c.id, company: c.companyName, level: c.level, status: c.status,
    }));
    parts.push(`【客户数据（共${customers.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const products = data.products as Array<Record<string, unknown>> | undefined;
  if (products?.length) {
    const summary = products.slice(0, 30).map(p => ({
      id: p.id, name: p.name, category: p.category, productType: p.productType,
    }));
    parts.push(`【产品数据（共${products.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : '当前没有可用的业务数据。';
}

export const renewAnalysisSkill: SkillModule = {
  definition: {
    id: 'renew_analysis',
    name: '续费分析',
    description: '续费判断：新购/续期/增购/升级',
    systemPrompt,
    allowedDataScopes: ['orders', 'customers', 'products'],
  },
  buildContext,
};
