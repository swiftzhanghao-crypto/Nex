/**
 * 技能：业务总结 (business_summary)
 * 按客户/时间段/订单/商机做数据汇总、经营统计、趋势分析、业务简报
 */
import type { SkillModule } from '../types';

const systemPrompt = `你是一位 WPS 365 业务平台的数据分析师，擅长生成业务总结与简报。

## 你的职责
- 业绩汇总：按人/部门/时间段统计销售额、订单量、成交率
- 客户分析：客户分布、新增客户、活跃客户统计
- 商机统计：商机漏斗、各阶段转化率、预期收入
- 趋势分析：月度/季度趋势对比
- 业务简报：简洁的要点式汇报，适合向上汇报

## 规则
- 严格基于提供的数据进行统计，不编造数据
- 金额使用人民币（¥），保留两位小数
- 百分比保留一位小数
- 输出结构化的统计报告或简报
- 若用户请求特定时间段的数据但数据中没有，说明"当前数据中未找到该时间段的记录"
- 使用简体中文回答`;

function buildContext(data: Record<string, unknown>): string {
  const parts: string[] = [];

  const orders = data.orders as Array<Record<string, unknown>> | undefined;
  if (orders?.length) {
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const statusDist: Record<string, number> = {};
    orders.forEach(o => {
      const st = String(o.status || 'UNKNOWN');
      statusDist[st] = (statusDist[st] || 0) + 1;
    });

    parts.push(`【订单统计概览】
- 总订单数：${orders.length}
- 总收入：¥${totalRevenue.toFixed(2)}
- 状态分布：${JSON.stringify(statusDist)}`);

    const recent = orders.slice(0, 30).map(o => ({
      id: o.id, customer: o.customerName, total: o.total,
      status: o.status, date: o.date, salesRep: o.salesRepName,
    }));
    parts.push(`【近期订单明细（前30条）】\n${JSON.stringify(recent, null, 2)}`);
  }

  const customers = data.customers as Array<Record<string, unknown>> | undefined;
  if (customers?.length) {
    const typeDist: Record<string, number> = {};
    const levelDist: Record<string, number> = {};
    customers.forEach(c => {
      typeDist[String(c.customerType || '未知')] = (typeDist[String(c.customerType || '未知')] || 0) + 1;
      levelDist[String(c.level || '未知')] = (levelDist[String(c.level || '未知')] || 0) + 1;
    });
    parts.push(`【客户统计概览】
- 总客户数：${customers.length}
- 类型分布：${JSON.stringify(typeDist)}
- 等级分布：${JSON.stringify(levelDist)}`);
  }

  const opportunities = data.opportunities as Array<Record<string, unknown>> | undefined;
  if (opportunities?.length) {
    const stageDist: Record<string, number> = {};
    let totalExpected = 0;
    opportunities.forEach(o => {
      stageDist[String(o.stage || '未知')] = (stageDist[String(o.stage || '未知')] || 0) + 1;
      totalExpected += Number(o.expectedRevenue) || 0;
    });
    parts.push(`【商机统计概览】
- 总商机数：${opportunities.length}
- 预期总收入：¥${totalExpected.toFixed(2)}
- 阶段分布：${JSON.stringify(stageDist)}`);
  }

  const performances = data.performances as Array<Record<string, unknown>> | undefined;
  if (performances?.length) {
    const totalPerf = performances.reduce((s, p) => s + (Number(p.salesPerformance) || 0), 0);
    parts.push(`【业绩统计概览】
- 总业绩记录数：${performances.length}
- 总销售业绩：¥${totalPerf.toFixed(2)}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : '当前没有可用的业务数据。';
}

export const businessSummarySkill: SkillModule = {
  definition: {
    id: 'business_summary',
    name: '业务总结',
    description: '数据汇总、经营统计、趋势分析、业务简报',
    systemPrompt,
    allowedDataScopes: ['orders', 'customers', 'opportunities', 'performances'],
  },
  buildContext,
};
