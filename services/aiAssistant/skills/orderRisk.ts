/**
 * 技能：风险管控 (order_risk)
 * 分析订单异常、价格异常、回款风险、合同一致性
 */
import type { SkillModule } from '../types';

const systemPrompt = `你是一位企业级订单风控分析师，专注于 WPS 365 业务平台的订单风险管控。

## 你的职责
- 分析订单异常：订单状态异常、重复下单、异常取消等
- 价格异常检测：成交价与建议售价的偏差、异常折扣
- 回款风险评估：付款逾期、回款进度、分期计划执行情况
- 合同一致性校验：订单与合同金额/条款是否匹配
- 客户/商机一致性：订单中的客户信息与 CRM 记录是否一致

## 规则
- 严格基于提供的数据进行分析，绝不编造或推测不存在的数据
- 若数据不足以判断，明确说明"当前数据不足以判断"并建议补充哪些信息
- 输出结构化的风险评估：风险等级（高/中/低）、风险描述、建议措施
- 金额和百分比保留合理精度
- 使用简体中文回答`;

function buildContext(data: Record<string, unknown>): string {
  const parts: string[] = [];

  const orders = data.orders as Array<Record<string, unknown>> | undefined;
  if (orders?.length) {
    const summary = orders.slice(0, 50).map(o => ({
      id: o.id,
      customer: o.customerName,
      total: o.total,
      status: o.status,
      date: o.date,
      isPaid: o.isPaid,
      buyerType: o.buyerType,
      paymentTerms: o.paymentTerms,
      linkedContractIds: o.linkedContractIds,
      items: Array.isArray(o.items) ? (o.items as Array<Record<string, unknown>>).map(i => ({
        product: i.productName,
        qty: i.quantity,
        price: i.priceAtPurchase,
        purchaseNature: i.purchaseNature,
      })) : [],
    }));
    parts.push(`【订单数据（共${orders.length}条，展示前50条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const contracts = data.contracts as Array<Record<string, unknown>> | undefined;
  if (contracts?.length) {
    const summary = contracts.slice(0, 30).map(c => ({
      id: c.id, code: c.code, name: c.name, amount: c.amount,
      verifyStatus: c.verifyStatus, orderId: c.orderId, customerId: c.customerId,
    }));
    parts.push(`【合同数据（共${contracts.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const customers = data.customers as Array<Record<string, unknown>> | undefined;
  if (customers?.length) {
    const summary = customers.slice(0, 30).map(c => ({
      id: c.id, company: c.companyName, level: c.level, status: c.status, region: c.region,
    }));
    parts.push(`【客户数据（共${customers.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const opportunities = data.opportunities as Array<Record<string, unknown>> | undefined;
  if (opportunities?.length) {
    const summary = opportunities.slice(0, 30).map(o => ({
      id: o.id, name: o.name, customer: o.customerName,
      stage: o.stage, amount: o.amount, expectedRevenue: o.expectedRevenue,
    }));
    parts.push(`【商机数据（共${opportunities.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : '当前没有可用的业务数据。';
}

export const orderRiskSkill: SkillModule = {
  definition: {
    id: 'order_risk',
    name: '风险管控',
    description: '订单异常、价格异常、回款风险、合同一致性分析',
    systemPrompt,
    allowedDataScopes: ['orders', 'contracts', 'customers', 'opportunities'],
  },
  buildContext,
};
