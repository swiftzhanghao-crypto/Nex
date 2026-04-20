/**
 * AI 业务助手 —— 类型定义
 * 所有技能路由、对话消息、技能定义的公共类型
 */

export type SkillId =
  | 'order_risk'
  | 'renew_analysis'
  | 'customer_query'
  | 'business_summary'
  | 'fallback';

/** 技能路由器返回的分类结果 */
export interface SkillRouteResult {
  skillId: SkillId;
  confidence: number;
  reasoning: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

/** AI 卡片载荷（用于在对话气泡内嵌入结构化卡片） */
export type ChatCard =
  | { type: 'order'; orderId: string }
  | { type: 'customer'; customerId: string }
  | { type: 'product'; productId: string }
  | { type: 'report'; title: string; content: string; generatedAt: number };

/** 对话消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  skillId?: SkillId;
  timestamp: number;
  /** 可选：附带在消息中的结构化卡片 */
  cards?: ChatCard[];
}

/** 技能注册描述 */
export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  systemPrompt: string;
  /** 允许访问的数据域白名单 */
  allowedDataScopes: DataScope[];
}

/** 数据域枚举，dataProvider 按此控制权限 */
export type DataScope =
  | 'orders'
  | 'customers'
  | 'opportunities'
  | 'contracts'
  | 'products'
  | 'performances';

/** 技能模块统一接口 */
export interface SkillModule {
  definition: SkillDefinition;
  buildContext: (data: Record<string, unknown>) => string;
}

/** 技能名称映射（用于 UI 展示） */
export const SKILL_LABELS: Record<SkillId, string> = {
  order_risk: '风险管控',
  renew_analysis: '续费分析',
  customer_query: '客户360',
  business_summary: '业务总结',
  fallback: '通用助手',
};

/** 当前页面上下文，用于限定 AI 助手的数据范围 */
export type PageType =
  | 'order_detail'
  | 'order_list'
  | 'customer_detail'
  | 'customer_list'
  | 'opportunity_list'
  | 'contract_list'
  | 'dashboard'
  | 'other';

export interface PageContext {
  pageType: PageType;
  /** 详情页时的实体 ID */
  entityId?: string;
  /** 页面中文名称 */
  pageLabel: string;
}
