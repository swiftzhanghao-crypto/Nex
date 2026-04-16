/**
 * 技能：客户360 (customer_query)
 * 查询客户全貌画像、历史订单、客户生命周期
 */
import type { SkillModule } from '../types';

const systemPrompt = `你是一位 WPS 365 业务平台的客户分析专家，擅长提供 360° 客户全景画像。

## 你的职责
- 客户档案展示：公司名称、行业、类型、等级、区域、状态
- 历史订单分析：购买次数、总金额、产品偏好、最近购买时间
- 商机管理：关联商机状态、预期收入、赢单率
- 合同管理：合同签订情况、金额、验证状态
- 客户生命周期：从首次购买到最近互动的时间线
- 联系人信息：主要联系人、角色分布

## 规则
- 严格基于提供的数据回答，不编造客户信息
- 若查询特定客户但未在数据中找到，明确告知"未找到该客户"
- 统计数据保留合理精度
- 使用简体中文回答
- 以结构化方式呈现客户画像`;

function buildContext(data: Record<string, unknown>): string {
  const parts: string[] = [];

  const customers = data.customers as Array<Record<string, unknown>> | undefined;
  if (customers?.length) {
    const summary = customers.slice(0, 40).map(c => ({
      id: c.id,
      company: c.companyName,
      industry: c.industry,
      type: c.customerType,
      level: c.level,
      region: c.region,
      status: c.status,
      owner: c.ownerName,
      contactCount: Array.isArray(c.contacts) ? (c.contacts as unknown[]).length : 0,
      createdAt: c.createdAt,
    }));
    parts.push(`【客户数据（共${customers.length}条，展示前40条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const orders = data.orders as Array<Record<string, unknown>> | undefined;
  if (orders?.length) {
    const summary = orders.slice(0, 50).map(o => ({
      id: o.id,
      customerId: o.customerId,
      customer: o.customerName,
      total: o.total,
      status: o.status,
      date: o.date,
      itemCount: Array.isArray(o.items) ? (o.items as unknown[]).length : 0,
    }));
    parts.push(`【订单数据（共${orders.length}条，展示前50条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const opportunities = data.opportunities as Array<Record<string, unknown>> | undefined;
  if (opportunities?.length) {
    const summary = opportunities.slice(0, 30).map(o => ({
      id: o.id, name: o.name, customerId: o.customerId,
      customer: o.customerName, stage: o.stage,
      expectedRevenue: o.expectedRevenue, closeDate: o.closeDate,
    }));
    parts.push(`【商机数据（共${opportunities.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  const contracts = data.contracts as Array<Record<string, unknown>> | undefined;
  if (contracts?.length) {
    const summary = contracts.slice(0, 20).map(c => ({
      id: c.id, code: c.code, name: c.name, amount: c.amount,
      verifyStatus: c.verifyStatus, customerId: c.customerId,
    }));
    parts.push(`【合同数据（共${contracts.length}条）】\n${JSON.stringify(summary, null, 2)}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : '当前没有可用的业务数据。';
}

export const customerQuerySkill: SkillModule = {
  definition: {
    id: 'customer_query',
    name: '客户360',
    description: '查询客户全貌画像、历史订单、客户生命周期',
    systemPrompt,
    allowedDataScopes: ['customers', 'orders', 'opportunities', 'contracts'],
  },
  buildContext,
};
