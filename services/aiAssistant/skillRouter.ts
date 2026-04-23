/**
 * 技能路由器
 * 优先通过后端代理调用 Gemini AI；后端未配置 API Key 时降级为本地关键词匹配
 * 注：API Key 不再放到前端，统一由后端 /api/ai/* 接口调用
 */
import type { SkillId, SkillRouteResult } from './types';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL || '/api';

let _aiAvailable: boolean | null = null;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function aiCall<T>(path: string, body: any): Promise<T | null> {
  if (_aiAvailable === false) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 503) {
      _aiAvailable = false;
      console.warn('[AI助手] 后端未配置 GEMINI_API_KEY，降级为本地分析');
      return null;
    }
    if (!res.ok) {
      console.error('[AI助手] 后端调用失败', res.status);
      return null;
    }
    _aiAvailable = true;
    return (await res.json()) as T;
  } catch (e) {
    console.error('[AI助手] 后端调用异常:', e);
    return null;
  }
}

/** 检查后端 AI 是否已配置（异步缓存结果） */
export async function isAIConfigured(): Promise<boolean> {
  if (_aiAvailable !== null) return _aiAvailable;
  try {
    const res = await fetch(`${API_BASE}/ai/status`, { headers: getAuthHeaders() });
    if (!res.ok) { _aiAvailable = false; return false; }
    const data = await res.json();
    _aiAvailable = !!data.configured;
    return _aiAvailable;
  } catch {
    _aiAvailable = false;
    return false;
  }
}

/* ────────────── 本地关键词路由（降级方案） ────────────── */

interface KeywordRule {
  skillId: SkillId;
  keywords: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    skillId: 'order_risk',
    keywords: ['风险', '异常', '回款', '逾期', '价格异常', '合同一致', '不一致', '风控', '预警'],
  },
  {
    skillId: 'renew_analysis',
    keywords: ['续费', '续期', '增购', '升级', '新购', '续约', '到期', '购买性质', 'renewal'],
  },
  {
    skillId: 'customer_query',
    keywords: ['客户', '画像', '档案', '客户情况', '客户信息', '历史订单', '客户详情', '生命周期', '联系人'],
  },
  {
    skillId: 'business_summary',
    keywords: ['总结', '简报', '业绩', '统计', '汇总', '趋势', '分析', '本月', '本季', '全年', '报告', '数据看板'],
  },
];

function localRoute(message: string): SkillRouteResult {
  const lowerMsg = message.toLowerCase();
  let bestMatch: { skillId: SkillId; hits: number } | null = null;

  for (const rule of KEYWORD_RULES) {
    const hits = rule.keywords.filter(kw => lowerMsg.includes(kw)).length;
    if (hits > 0 && (!bestMatch || hits > bestMatch.hits)) {
      bestMatch = { skillId: rule.skillId, hits };
    }
  }

  if (bestMatch && bestMatch.hits >= 2) {
    return {
      skillId: bestMatch.skillId,
      confidence: Math.min(0.6 + bestMatch.hits * 0.1, 0.95),
      reasoning: `本地关键词匹配: 命中 ${bestMatch.hits} 个关键词`,
      needsClarification: false,
    };
  }

  if (bestMatch && bestMatch.hits === 1) {
    return {
      skillId: bestMatch.skillId,
      confidence: 0.5,
      reasoning: `本地关键词匹配: 仅命中 1 个关键词，置信度不足`,
      needsClarification: true,
      clarificationQuestion: '请问您想了解哪方面的信息？\n1. 📊 订单风险分析（价格/回款/合同异常）\n2. 🔄 续费分析（新购/续费/增购/升级）\n3. 👤 客户信息查询（客户画像/历史订单）\n4. 📈 业务总结（业绩/简报/统计）\n\n请更具体地描述您的问题。',
    };
  }

  return {
    skillId: 'fallback',
    confidence: 1,
    reasoning: '未匹配到任何业务关键词',
    needsClarification: false,
  };
}

/* ────────────── Gemini 路由提示词 ────────────── */

const ROUTER_PROMPT = `你是一个业务意图分类器，用于 WPS 365 业务平台的 AI 助手系统。

根据用户的问题，判断应由以下哪个技能处理：

1. order_risk（风险管控）：
   - 订单异常、价格异常、回款风险、合同一致性
   - 典型问法：订单有没有风险？价格是否异常？回款是否有风险？订单和合同是否不一致？

2. renew_analysis（续费分析）：
   - 续费/续期/增购/升级判断
   - 典型问法：这个订单的续费关系是什么？是新购还是续费？是续期还是增购？

3. customer_query（客户360）：
   - 客户全貌画像、历史订单、客户档案、客户生命周期
   - 典型问法：这个客户整体情况？历史订单多少？客户档案？

4. business_summary（业务总结）：
   - 业绩汇总、业务简报、数据统计、趋势分析
   - 典型问法：总结本月业绩；帮我做个业务简报；整体订单数据总结

5. fallback（兜底）：
   - 非业务问题，或与上述四个技能都不相关的问题
   - 例如：闲聊、天气、技术问题、平台使用说明

## 分类规则
- 只基于用户问题的语义进行分类
- 如果问题涉及多个技能，选择最相关的那个
- 如果问题模糊不清，无法确定是哪个技能，confidence 设为较低值
- 非业务相关问题一律分类为 fallback

返回 JSON 格式的分类结果。`;

/* ────────────── 公共 API ────────────── */

/**
 * 对用户消息进行技能路由分类
 * 优先 Gemini，无 API Key 时自动降级到本地关键词匹配
 */
export async function routeSkill(userMessage: string): Promise<SkillRouteResult> {
  const result = await aiCall<{ json: any | null }>('/ai/generate-json', {
    prompt: `${ROUTER_PROMPT}\n\n用户问题：「${userMessage}」`,
    schema: {
      type: 'OBJECT',
      properties: {
        skillId: {
          type: 'STRING',
          enum: ['order_risk', 'renew_analysis', 'customer_query', 'business_summary', 'fallback'],
        },
        confidence: { type: 'NUMBER' },
        reasoning: { type: 'STRING' },
      },
      required: ['skillId', 'confidence', 'reasoning'],
    },
  });

  if (!result || !result.json) {
    return localRoute(userMessage);
  }

  const parsed = result.json as { skillId: SkillId; confidence: number; reasoning: string };
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  if (confidence < 0.6) {
    const clarification = await generateClarification(userMessage, parsed.reasoning);
    return {
      skillId: parsed.skillId,
      confidence,
      reasoning: parsed.reasoning,
      needsClarification: true,
      clarificationQuestion: clarification,
    };
  }

  return {
    skillId: parsed.skillId,
    confidence,
    reasoning: parsed.reasoning,
    needsClarification: false,
  };
}

async function generateClarification(userMessage: string, reasoning: string): Promise<string> {
  const fallback = '请问您想了解哪方面的信息？订单风险、续费分析、客户信息，还是业务总结？';
  const data = await aiCall<{ text: string }>('/ai/generate', {
    prompt: `用户在 WPS 365 业务平台提问了：「${userMessage}」
分类器的分析：${reasoning}
但置信度较低，请生成一个简短的中文反问，帮助用户明确他的需求属于以下哪个方向：
1. 订单风险分析（价格/回款/合同异常）
2. 续费分析（新购/续费/增购/升级）
3. 客户信息查询（客户画像/历史订单）
4. 业务总结（业绩/简报/统计）

只返回反问文本，不要返回其他内容。`,
  });
  return (data && data.text) || fallback;
}

/**
 * 使用指定技能的提示词和上下文调用 Gemini 生成回答
 * 无 API Key 时自动使用本地数据分析
 */
export async function executeSkill(
  userMessage: string,
  systemPrompt: string,
  dataContext: string,
): Promise<string> {
  const fullPrompt = `${systemPrompt}\n\n## 当前业务数据\n${dataContext}\n\n## 用户问题\n${userMessage}`;
  const data = await aiCall<{ text: string }>('/ai/generate', { prompt: fullPrompt });
  if (!data) {
    return generateLocalResponse(userMessage, dataContext);
  }
  return data.text || '抱歉，未能生成回答，请稍后重试。';
}

/* ────────────── 本地数据分析（无 API Key 时降级） ────────────── */

function generateLocalResponse(userMessage: string, dataContext: string): string {
  if (dataContext === '（通用助手模式，无业务数据注入）' || dataContext === '当前没有可用的业务数据。') {
    return '我是 WPS 365 业务平台的 AI 助手（本地模式）。\n\n当前未配置 Gemini API Key，正在使用本地分析模式。本地模式下我可以帮您查看和汇总系统中的业务数据。\n\n如需更智能的分析，请在 `.env` 文件中配置：\n```\nVITE_GEMINI_API_KEY=你的密钥\n```\n获取方式：https://aistudio.google.com/apikey';
  }

  // 本地模式：直接展示数据摘要
  const lines = dataContext.split('\n');
  const summaryLines = lines.filter(l =>
    l.startsWith('【') ||
    l.startsWith('- 总') ||
    l.startsWith('- 状态') ||
    l.startsWith('- 类型') ||
    l.startsWith('- 等级') ||
    l.startsWith('- 预期') ||
    l.startsWith('- 阶段')
  );

  if (summaryLines.length > 0) {
    return `📊 **本地数据分析结果**（基于系统当前数据）\n\n${summaryLines.join('\n')}\n\n---\n*本地分析模式：展示数据摘要。如需 AI 深度分析，请配置 Gemini API Key。*`;
  }

  return `📋 **数据概览**\n\n${dataContext.slice(0, 2000)}\n\n---\n*当前为本地分析模式，已为您展示原始数据摘要。*`;
}
