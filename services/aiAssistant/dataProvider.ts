/**
 * 数据提供层 — 按技能权限 + 页面上下文隔离数据访问
 * 只提取当前页面相关的数据，不传全量
 */
import type { SkillId, DataScope, PageContext } from './types';

import { orderRiskSkill } from './skills/orderRisk';
import { renewAnalysisSkill } from './skills/renewAnalysis';
import { customerQuerySkill } from './skills/customerQuery';
import { businessSummarySkill } from './skills/businessSummary';
import { fallbackSkill } from './skills/fallback';
import type { SkillModule } from './types';

/** 技能注册表 */
const SKILL_REGISTRY: Record<SkillId, SkillModule> = {
  order_risk: orderRiskSkill,
  renew_analysis: renewAnalysisSkill,
  customer_query: customerQuerySkill,
  business_summary: businessSummarySkill,
  fallback: fallbackSkill,
};

export function getSkillModule(skillId: SkillId): SkillModule {
  return SKILL_REGISTRY[skillId];
}

/** AppContext 中可供 AI 助手读取的数据快照 */
export interface AppDataSnapshot {
  orders?: unknown[];
  customers?: unknown[];
  opportunities?: unknown[];
  contracts?: unknown[];
  products?: unknown[];
  performances?: unknown[];
}

type Rec = Record<string, unknown>;

/**
 * 根据页面上下文 + 技能权限提取数据
 * 详情页 → 只取当前实体及关联数据
 * 列表页 → 取该列表数据（上限 20 条）
 * Dashboard → 取各域前 10 条做统计
 */
export function getFilteredData(
  skillId: SkillId,
  fullData: AppDataSnapshot,
  pageCtx?: PageContext,
): Record<string, unknown> {
  const skill = SKILL_REGISTRY[skillId];
  if (!skill) return {};

  const allowed: DataScope[] = skill.definition.allowedDataScopes;

  // 无页面上下文时回退到摘要模式（每域最多 10 条）
  if (!pageCtx || pageCtx.pageType === 'other') {
    return pickAllowed(allowed, fullData, 10);
  }

  const { pageType, entityId } = pageCtx;

  // ── 订单详情页：只取该订单 + 关联客户/合同/商机 ──
  if (pageType === 'order_detail' && entityId) {
    const order = findById(fullData.orders, entityId);
    if (!order) return pickAllowed(allowed, fullData, 5);

    const result: Record<string, unknown> = {};
    if (allowed.includes('orders')) result.orders = [order];

    const custId = (order as Rec).customerId as string | undefined;
    if (custId && allowed.includes('customers')) {
      const cust = findById(fullData.customers, custId);
      if (cust) result.customers = [cust];
    }

    const linkedContractIds = (order as Rec).linkedContractIds as string[] | undefined;
    if (linkedContractIds?.length && allowed.includes('contracts')) {
      result.contracts = (fullData.contracts || []).filter(
        c => linkedContractIds.includes((c as Rec).id as string),
      );
    }

    const oppId = (order as Rec).opportunityId as string | undefined;
    if (oppId && allowed.includes('opportunities')) {
      const opp = findById(fullData.opportunities, oppId);
      if (opp) result.opportunities = [opp];
    }

    // 续费分析还需要同客户的历史订单
    if (allowed.includes('orders') && custId) {
      const relatedOrders = (fullData.orders || []).filter(
        o => (o as Rec).customerId === custId,
      );
      result.orders = relatedOrders;
    }

    if (allowed.includes('products')) {
      result.products = fullData.products?.slice(0, 15);
    }

    return result;
  }

  // ── 客户详情页：只取该客户 + 关联订单/商机/合同 ──
  if (pageType === 'customer_detail' && entityId) {
    const customer = findById(fullData.customers, entityId);
    if (!customer) return pickAllowed(allowed, fullData, 5);

    const result: Record<string, unknown> = {};
    if (allowed.includes('customers')) result.customers = [customer];

    if (allowed.includes('orders')) {
      result.orders = (fullData.orders || []).filter(
        o => (o as Rec).customerId === entityId,
      );
    }
    if (allowed.includes('opportunities')) {
      result.opportunities = (fullData.opportunities || []).filter(
        o => (o as Rec).customerId === entityId,
      );
    }
    if (allowed.includes('contracts')) {
      result.contracts = (fullData.contracts || []).filter(
        c => (c as Rec).customerId === entityId,
      );
    }
    if (allowed.includes('performances')) {
      const orderIds = new Set(
        ((result.orders || []) as Rec[]).map(o => o.id as string),
      );
      result.performances = (fullData.performances || []).filter(
        p => orderIds.has((p as Rec).orderId as string),
      );
    }
    return result;
  }

  // ── 列表页（订单/客户/商机/合同）：取当前列表前 20 条 ──
  if (pageType === 'order_list') {
    return pickAllowed(allowed, fullData, 20);
  }
  if (pageType === 'customer_list') {
    return pickAllowed(allowed, fullData, 20);
  }
  if (pageType === 'opportunity_list') {
    return pickAllowed(allowed, fullData, 20);
  }
  if (pageType === 'contract_list') {
    return pickAllowed(allowed, fullData, 20);
  }

  // ── Dashboard：各域取前 10 条做概览统计 ──
  if (pageType === 'dashboard') {
    return pickAllowed(allowed, fullData, 10);
  }

  return pickAllowed(allowed, fullData, 10);
}

/** 从全量数据按白名单提取，每域限制条数 */
function pickAllowed(
  allowed: DataScope[],
  fullData: AppDataSnapshot,
  limit: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const scope of allowed) {
    const arr = fullData[scope];
    if (arr) result[scope] = arr.slice(0, limit);
  }
  return result;
}

function findById(list: unknown[] | undefined, id: string): unknown | undefined {
  if (!list) return undefined;
  return list.find(item => (item as Rec).id === id);
}

/**
 * 使用技能模块的 buildContext 将过滤后的数据格式化为 prompt 上下文
 */
export function buildSkillContext(
  skillId: SkillId,
  filteredData: Record<string, unknown>,
  pageCtx?: PageContext,
): string {
  const skill = SKILL_REGISTRY[skillId];
  const dataStr = skill.buildContext(filteredData);

  if (!pageCtx) return dataStr;

  const ctxHeader = `【当前页面】${pageCtx.pageLabel}${pageCtx.entityId ? `（ID: ${pageCtx.entityId}）` : ''}\n\n`;
  return ctxHeader + dataStr;
}

/**
 * 从 URL pathname 解析当前页面上下文
 */
export function parsePageContext(pathname: string): PageContext {
  const orderDetail = pathname.match(/^\/orders\/([^/]+)$/);
  if (orderDetail) {
    return { pageType: 'order_detail', entityId: orderDetail[1], pageLabel: `订单详情 ${orderDetail[1]}` };
  }
  if (pathname === '/orders') {
    return { pageType: 'order_list', pageLabel: '订单列表' };
  }

  const customerDetail = pathname.match(/^\/customers\/([^/]+)$/);
  if (customerDetail) {
    return { pageType: 'customer_detail', entityId: customerDetail[1], pageLabel: `客户详情 ${customerDetail[1]}` };
  }
  if (pathname === '/customers') {
    return { pageType: 'customer_list', pageLabel: '客户列表' };
  }

  if (pathname === '/opportunities') {
    return { pageType: 'opportunity_list', pageLabel: '商机列表' };
  }
  if (pathname === '/contracts') {
    return { pageType: 'contract_list', pageLabel: '合同列表' };
  }

  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    return { pageType: 'dashboard', pageLabel: '数据看板' };
  }

  return { pageType: 'other', pageLabel: '其他页面' };
}
