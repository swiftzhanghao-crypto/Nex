import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Bot, Trash2, MapPin, Plus, MessageSquare, RefreshCcw, Database, FileText, Search, ChevronDown, Mic, Paperclip, Bookmark } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import AIMessageBubble from './AIMessageBubble';
import ModalPortal from '../common/ModalPortal';
import {
  routeSkill,
  executeSkill,
  getSkillModule,
  getFilteredData,
  buildSkillContext,
  SKILL_LABELS,
  isAIConfigured,
  parsePageContext,
} from '../../services/aiAssistant';
import type { ChatMessage, SkillId, AppDataSnapshot, PageContext } from '../../services/aiAssistant';

interface AIAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

/* ── helpers ── */

let _msgCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

function makeWelcomeMessage(hasAI: boolean | null = null): ChatMessage {
  const modeNote = hasAI === false ? '\n\n⚠️ 后端未配置 GEMINI_API_KEY，当前运行在**本地分析模式**。' : '';
  return {
    id: 'welcome',
    role: 'assistant',
    content: `你好！我是 **AI 业务助手**，可以帮你：\n\n🔍 **风险管控** — 订单异常、价格/回款风险分析\n🔄 **续费分析** — 判断新购/续费/增购/升级\n📊 **AI 查询** — 客户、产品、订单即时调取\n📝 **AI 周日报** — 自动生成可编辑业务报告\n\n💡 直接输入**订单号/客户名/产品名**可即时调取卡片（例如「查询客户 华为」、「产品 WPS 云文档」、「S2604170000……」）。${modeNote}`,
    timestamp: Date.now(),
  };
}

function getQuickQuestions(pageCtx: PageContext): { text: string; icon: string }[] {
  switch (pageCtx.pageType) {
    case 'order_detail':
      return [{ text: '这个订单有风险吗？', icon: '⚠️' }, { text: '这是新购还是续费？', icon: '🔄' }, { text: '关联客户情况', icon: '👤' }, { text: '订单信息总结', icon: '📋' }];
    case 'order_list':
      return [{ text: '哪些订单有风险？', icon: '⚠️' }, { text: '订单数据总结', icon: '📊' }, { text: '回款情况分析', icon: '💰' }, { text: '续费订单有哪些？', icon: '🔄' }];
    case 'customer_detail':
      return [{ text: '这个客户整体情况？', icon: '👤' }, { text: '历史订单总结', icon: '📋' }, { text: '客户有续费吗？', icon: '🔄' }, { text: '客户风险分析', icon: '⚠️' }];
    case 'customer_list':
      return [{ text: '客户整体情况', icon: '👥' }, { text: '高价值客户分析', icon: '💎' }, { text: '客户数据总结', icon: '📊' }, { text: '有风险的客户？', icon: '⚠️' }];
    default:
      return [{ text: '本月业绩总结', icon: '📊' }, { text: '订单风险概览', icon: '⚠️' }, { text: '客户整体情况', icon: '👥' }, { text: '续费关系分析', icon: '🔄' }];
  }
}

/* ── AI Apps ── */
interface AIApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  desc: string;
  prompt: string;
}

const AI_APPS: AIApp[] = [
  {
    id: 'dataQuery',
    name: 'AI 查询',
    icon: <Database className="w-4 h-4" />,
    desc: '查询客户、产品、订单',
    prompt: '查询客户 ',
  },
  {
    id: 'weeklyReport',
    name: 'AI 周/日报',
    icon: <FileText className="w-4 h-4" />,
    desc: '自动生成业务周报/日报',
    prompt: '生成本周工作周报',
  },
  {
    id: 'renew',
    name: 'AI 续费分析',
    icon: <RefreshCcw className="w-4 h-4" />,
    desc: '智能判断续费/新购/增购',
    prompt: '请帮我分析当前订单的续费关系，判断哪些是新购、续费、增购或升级',
  },
];

/* ── Session type ── */
interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  activeSkill: SkillId | null;
  createdAt: number;
  updatedAt: number;
  appId?: string;
}

function createSession(title?: string, appId?: string): ChatSession {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: title || '新对话',
    messages: [makeWelcomeMessage()],
    activeSkill: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    appId,
  };
}

function sessionPreview(session: ChatSession): string {
  const userMsgs = session.messages.filter(m => m.role === 'user');
  if (userMsgs.length === 0) return '新对话';
  return userMsgs[userMsgs.length - 1].content.slice(0, 40);
}

/** 生成模拟日/周报 HTML 内容 */
function generateMockReport(isDaily: boolean): string {
  if (isDaily) {
    return `<h1>今日工作日报</h1>
<h2>1. 客户拜访</h2>
<ul>
<li>上午拜访 A 公司（已签约）：复盘交付排期，确认下周项目启动。</li>
<li>下午拜访 B 公司（商机推进）：重点介绍了新版价格方案，客户表示一周内给出反馈。</li>
</ul>
<h2>2. 成交与跟进</h2>
<ol>
<li>C 公司合同已完成盖章，进入系统建档阶段。</li>
<li>D 公司报价方案已提交，等待客户评估。</li>
</ol>
<h2>3. 待办事项</h2>
<p><strong>紧急</strong></p>
<ul>
<li>明早 9:00 前确认 E 公司技术演示方案</li>
</ul>
<p><strong>常规</strong></p>
<ul>
<li>整理本周商机清单，周五前同步至团队</li>
<li>完成客户满意度调研问卷设计</li>
</ul>
<blockquote>备注：本报告由 AI 根据所选数据源自动生成，内容可按需修改。</blockquote>`;
  }
  return `<h1>本周工作周报</h1>
<h2>1. 本周成果</h2>
<ul>
<li>新签合同 3 单，合同总额 ¥180 万，环比增长 22%。</li>
<li>推进商机 8 项，其中 2 项进入报价阶段。</li>
<li>完成客户拜访 12 家，覆盖北京、上海、深圳三地核心客户。</li>
</ul>
<h2>2. 关键进展</h2>
<ol>
<li><strong>A 公司</strong>：完成二轮商务谈判，预计下周签约。</li>
<li><strong>B 集团</strong>：技术方案已通过内部评审，进入采购流程。</li>
<li><strong>C 股份</strong>：续费方案已提交，客户反馈积极。</li>
</ol>
<h2>3. 下周计划</h2>
<p><strong>优先级 P0</strong></p>
<ul>
<li>完成 A 公司合同签订与首付款回收</li>
<li>组织 B 集团技术演示与答疑</li>
</ul>
<p><strong>优先级 P1</strong></p>
<ul>
<li>推进 D、E、F 三家客户的增购方案</li>
<li>完成月度业绩总结与团队复盘</li>
</ul>
<h2>4. 风险与支持</h2>
<ul>
<li>G 公司付款延迟超 15 天，需法务团队介入跟进。</li>
<li>建议优化报价审批流程，提升响应速度。</li>
</ul>
<blockquote>备注：本周报由 AI 根据订单、商机、客户拜访等数据自动生成，关键数据请核对后再提交。</blockquote>`;
}

/** 将富文本 HTML 解析为结构化 sections（heading + bullets） */
function parseHtmlToSections(html: string): { heading: string; bullets: string[] }[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const sections: { heading: string; bullets: string[] }[] = [];
  let current: { heading: string; bullets: string[] } | null = null;

  for (const node of Array.from(div.childNodes)) {
    const el = node as HTMLElement;
    const tag = el.tagName?.toUpperCase();

    if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
      if (current) sections.push(current);
      current = { heading: (el.textContent || '').trim(), bullets: [] };
    } else if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(el.querySelectorAll('li')).map(li => (li.textContent || '').trim()).filter(Boolean);
      if (current) {
        current.bullets.push(...items);
      } else {
        current = { heading: '内容', bullets: items };
      }
    } else if (tag === 'P' || tag === 'BLOCKQUOTE') {
      const text = (el.textContent || '').trim();
      if (text) {
        if (current) {
          current.bullets.push(text);
        } else {
          current = { heading: '内容', bullets: [text] };
        }
      }
    }
  }
  if (current) sections.push(current);
  if (sections.length === 0) {
    sections.push({ heading: '内容', bullets: [div.textContent?.trim() || ''] });
  }
  return sections;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${Math.floor(diff / 86400_000)} 天前`;
}

/* ── Main Component ── */

const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ open, onClose, initialQuery }) => {
  const appCtx = useAppContext();
  const location = useLocation();

  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  useEffect(() => { isAIConfigured().then(setAiAvailable); }, []);
  // AI 助手抽屉打开时按需加载全量订单/客户
  useEffect(() => {
    if (!open) return;
    appCtx.loadAllOrders?.();
    appCtx.loadAllCustomers?.();
  }, [open, appCtx]);
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const activeSkill = activeSession?.activeSkill || null;

  const pageCtx: PageContext = useMemo(() => parsePageContext(location.pathname), [location.pathname]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(s => {
      if (s.title.toLowerCase().includes(q)) return true;
      return s.messages.some(m => m.content.toLowerCase().includes(q));
    });
  }, [sessions, sessionSearch]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ⌘/ 打开搜索
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setTimeout(() => inputRef.current?.focus(), 200);
      if (initialQuery) setInput(initialQuery);
    }
  }, [open, initialQuery]);

  const updateSession = useCallback((sessionId: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  }, []);

  const handleNewSession = useCallback((title?: string, appId?: string) => {
    setSessions(prev => {
      const current = prev.find(s => s.id === activeSessionId);
      const isCurrentEmpty = !current || current.messages.filter(m => m.role === 'user').length === 0;
      if (isCurrentEmpty && current && !title && !appId) {
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
        return prev;
      }
      const s = createSession(title, appId);
      setActiveSessionId(s.id);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
      return [s, ...prev];
    });
  }, [activeSessionId]);

  const handleSwitchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setInput('');
    setTimeout(() => { scrollToBottom(); inputRef.current?.focus(); }, 100);
  }, [scrollToBottom]);

  const handleAppClick = useCallback((app: AIApp) => {
    setSessions(prev => {
      const current = prev.find(s => s.id === activeSessionId);
      const isCurrentEmpty = !current || current.messages.filter(m => m.role === 'user').length === 0;
      if (isCurrentEmpty && current) {
        return prev.map(s => s.id === current.id ? { ...s, title: app.name, appId: app.id, updatedAt: Date.now() } : s);
      }
      const s = createSession(app.name, app.id);
      setActiveSessionId(s.id);
      return [s, ...prev];
    });
    setInput(app.prompt);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [activeSessionId]);

  const getAppData = useCallback((): AppDataSnapshot => ({
    orders: appCtx.filteredOrders as unknown[],
    customers: appCtx.filteredCustomers as unknown[],
    opportunities: appCtx.opportunities as unknown[],
    contracts: appCtx.contracts as unknown[],
    products: appCtx.filteredProducts as unknown[],
    performances: appCtx.performances as unknown[],
  }), [appCtx.filteredOrders, appCtx.filteredCustomers, appCtx.opportunities, appCtx.contracts, appCtx.filteredProducts, appCtx.performances]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;

    const sid = activeSessionId;
    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text, timestamp: Date.now() };
    updateSession(sid, s => ({
      ...s,
      messages: [...s.messages, userMsg],
      title: s.messages.filter(m => m.role === 'user').length === 0 ? text.slice(0, 30) : s.title,
      updatedAt: Date.now(),
    }));
    setInput('');
    setIsLoading(true);

    // ── 智能识别：订单号 → 直接返回订单卡片 ──
    const orderIdCandidates = Array.from(text.matchAll(/[A-Za-z]{1,3}\d{6,}/g)).map(m => m[0]);
    const matchedOrders = orderIdCandidates
      .map(cand => appCtx.filteredOrders.find(o => o.id.toLowerCase() === cand.toLowerCase()))
      .filter((o): o is NonNullable<typeof o> => Boolean(o));
    if (matchedOrders.length > 0) {
      const cardMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: matchedOrders.length === 1
          ? `找到订单 ${matchedOrders[0].id}，点击卡片查看详情：`
          : `找到 ${matchedOrders.length} 条订单：`,
        cards: matchedOrders.map(o => ({ type: 'order' as const, orderId: o.id })),
        timestamp: Date.now(),
      };
      updateSession(sid, s => ({ ...s, messages: [...s.messages, cardMsg], updatedAt: Date.now() }));
      setIsLoading(false);
      return;
    }

    // ── 智能识别：客户 / 产品 → 返回卡片（支持模糊匹配） ──
    const normalizedText = text.toLowerCase();
    const isCustomerOnly = /^(查询|查|搜|搜索)?\s*客户/.test(text) && !/产品|商品/.test(text);
    const isProductOnly = /^(查询|查|搜|搜索)?\s*(产品|商品)/.test(text) && !/客户/.test(text);

    const queryKeywords = text.replace(/^(查询|查|搜|搜索)?\s*(客户|产品|商品)\s*/u, '').trim().toLowerCase();

    const fuzzyMatch = (name: string, query: string): boolean => {
      const n = name.toLowerCase();
      const q = query.toLowerCase();
      if (n.includes(q) || q.includes(n)) return true;
      const chars = Array.from(q);
      let pos = 0;
      for (const ch of chars) {
        const idx = n.indexOf(ch, pos);
        if (idx === -1) return false;
        pos = idx + 1;
      }
      return true;
    };

    const scoreMatch = (name: string, query: string): number => {
      const n = name.toLowerCase();
      const q = query.toLowerCase();
      if (n === q) return 100;
      if (n.startsWith(q)) return 90;
      if (n.includes(q)) return 80;
      if (q.includes(n)) return 70;
      return 50;
    };

    const matchedCustomers = queryKeywords.length >= 1
      ? appCtx.filteredCustomers
          .filter(c => {
            if (!c.companyName || c.companyName.length < 2) return false;
            return fuzzyMatch(c.companyName, queryKeywords) || normalizedText.includes(c.id.toLowerCase());
          })
          .sort((a, b) => scoreMatch(b.companyName, queryKeywords) - scoreMatch(a.companyName, queryKeywords))
          .slice(0, 5)
      : appCtx.filteredCustomers.filter(c => {
          if (!c.companyName || c.companyName.length < 2) return false;
          return text.includes(c.companyName) || normalizedText.includes(c.id.toLowerCase());
        }).slice(0, 5);

    const matchedProducts = queryKeywords.length >= 1
      ? appCtx.filteredProducts
          .filter(p => {
            if (!p.name || p.name.length < 2) return false;
            return fuzzyMatch(p.name, queryKeywords) || normalizedText.includes(p.id.toLowerCase());
          })
          .sort((a, b) => scoreMatch(b.name, queryKeywords) - scoreMatch(a.name, queryKeywords))
          .slice(0, 5)
      : appCtx.filteredProducts.filter(p => {
          if (!p.name || p.name.length < 2) return false;
          return text.includes(p.name) || normalizedText.includes(p.id.toLowerCase());
        }).slice(0, 5);

    const showCustomers = !isProductOnly && matchedCustomers.length > 0;
    const showProducts = !isCustomerOnly && matchedProducts.length > 0;

    if (showCustomers || showProducts) {
      const cards: ChatMessage['cards'] = [];
      if (showCustomers) cards.push(...matchedCustomers.map(c => ({ type: 'customer' as const, customerId: c.id })));
      if (showProducts) cards.push(...matchedProducts.map(p => ({ type: 'product' as const, productId: p.id })));

      const parts: string[] = [];
      if (showCustomers) parts.push(`${matchedCustomers.length} 位客户`);
      if (showProducts) parts.push(`${matchedProducts.length} 个产品`);

      const cardMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: `为你找到 ${parts.join(' 和 ')}，点击卡片查看详情：`,
        cards,
        timestamp: Date.now(),
      };
      await new Promise(r => setTimeout(r, 400));
      updateSession(sid, s => ({ ...s, messages: [...s.messages, cardMsg], updatedAt: Date.now() }));
      setIsLoading(false);
      return;
    }

    // 意图明确但未匹配到实体
    if (isCustomerOnly || isProductOnly) {
      const entity = isCustomerOnly ? '客户' : '产品';
      const hintMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: `未找到匹配的${entity}。请尝试直接输入${entity}名称或 ID，例如：「查询客户 华为」或「产品 WPS 云文档」`,
        timestamp: Date.now(),
      };
      updateSession(sid, s => ({ ...s, messages: [...s.messages, hintMsg], updatedAt: Date.now() }));
      setIsLoading(false);
      return;
    }

    // ── 智能识别：周日报 → 返回可编辑报告卡片 ──
    const current = sessions.find(s => s.id === sid);
    const isReportIntent = current?.appId === 'weeklyReport' || /周报|日报|工作总结|业务总结|汇报/.test(text);
    if (isReportIntent) {
      const isDaily = /今日|日报|当日/.test(text) && !/周/.test(text);
      const reportTitle = isDaily ? '今日工作日报' : '本周工作周报';
      const reportContent = generateMockReport(isDaily);
      const reportMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: `已为您生成${reportTitle}，可直接编辑后提交 CRM：`,
        cards: [{ type: 'report', title: reportTitle, content: reportContent, generatedAt: Date.now() }],
        timestamp: Date.now(),
      };
      // 模拟思考延迟
      await new Promise(r => setTimeout(r, 600));
      updateSession(sid, s => ({ ...s, messages: [...s.messages, reportMsg], updatedAt: Date.now() }));
      setIsLoading(false);
      return;
    }

    try {
      const routeResult = await routeSkill(text);
      if (routeResult.needsClarification) {
        const clarifyMsg: ChatMessage = { id: nextId(), role: 'assistant', content: routeResult.clarificationQuestion || '请问您想了解哪方面的信息？', skillId: routeResult.skillId, timestamp: Date.now() };
        updateSession(sid, s => ({ ...s, messages: [...s.messages, clarifyMsg], updatedAt: Date.now() }));
        setIsLoading(false);
        return;
      }

      updateSession(sid, s => ({ ...s, activeSkill: routeResult.skillId }));
      const skillModule = getSkillModule(routeResult.skillId);
      const filteredData = getFilteredData(routeResult.skillId, getAppData(), pageCtx);
      const context = buildSkillContext(routeResult.skillId, filteredData, pageCtx);
      const answer = await executeSkill(text, skillModule.definition.systemPrompt, context);

      const assistantMsg: ChatMessage = { id: nextId(), role: 'assistant', content: answer, skillId: routeResult.skillId, timestamp: Date.now() };
      updateSession(sid, s => ({ ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }));
    } catch (error) {
      console.error('[AI助手] 处理失败:', error);
      const errorMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '抱歉，处理您的问题时出现了错误。请检查 API Key 配置后重试。', timestamp: Date.now() };
      updateSession(sid, s => ({ ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, getAppData, pageCtx, activeSessionId, updateSession, appCtx.filteredOrders, appCtx.filteredCustomers, appCtx.filteredProducts, sessions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    updateSession(activeSessionId, s => ({ ...s, messages: [makeWelcomeMessage()], activeSkill: null, updatedAt: Date.now() }));
  };

  const handleReportRegenerate = useCallback((messageId: string) => {
    const sid = activeSessionId;
    const session = sessions.find(s => s.id === sid);
    const msg = session?.messages.find(m => m.id === messageId);
    if (!msg || !msg.cards) return;
    const oldCard = msg.cards.find(c => c.type === 'report');
    if (!oldCard || oldCard.type !== 'report') return;
    const isDaily = oldCard.title.includes('日报');
    const newContent = generateMockReport(isDaily);
    updateSession(sid, s => ({
      ...s,
      messages: s.messages.map(m =>
        m.id === messageId
          ? { ...m, cards: m.cards?.map(c => c.type === 'report' ? { ...c, content: newContent, generatedAt: Date.now() } : c) }
          : m
      ),
      updatedAt: Date.now(),
    }));
  }, [activeSessionId, sessions, updateSession]);

  const handleReportSubmit = useCallback((messageId: string, html: string, plainText: string) => {
    const sid = activeSessionId;
    const session = sessions.find(s => s.id === sid);
    const msg = session?.messages.find(m => m.id === messageId);
    const card = msg?.cards?.find(c => c.type === 'report');
    const isDaily = card?.type === 'report' && card.title.includes('日报');
    const reportType: '周报' | '日报' = isDaily ? '日报' : '周报';

    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const sections = parseHtmlToSections(html);
    const summary = plainText.slice(0, 80).replace(/\n/g, ' ');

    let weekRange: string | undefined;
    if (reportType === '周报') {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(start.getDate() - (start.getDay() || 7) + 1);
      end.setDate(start.getDate() + 6);
      weekRange = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ~ ${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
    }

    const report: import('../../types').WorkReport = {
      id: `wr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: appCtx.currentUser.id,
      type: reportType,
      title: card?.type === 'report' ? card.title : `${dateStr} ${reportType}`,
      date: dateStr,
      weekRange,
      summary,
      htmlContent: html,
      sections,
      source: 'ai',
      createdAt: Date.now(),
    };

    appCtx.addWorkReport(report);
  }, [activeSessionId, sessions, appCtx]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = createSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) setActiveSessionId(next[0].id);
      return next;
    });
  }, [activeSessionId]);

  const handleClose = () => { setIsClosing(true); setTimeout(onClose, 280); };

  if (!open) return null;

  const isWelcomeOnly = messages.length <= 1;

  return (
    <ModalPortal>
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[500] ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleClose} />

      <div
        className={`fixed top-0 right-0 h-full z-[500] flex bg-white dark:bg-[#1C1C1E] shadow-2xl ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}
        style={{ width: 'calc(100vw - 248px)' }}
      >
        {/* ── Left Sidebar (Claude-style) ── */}
        <div className="w-[240px] shrink-0 flex flex-col bg-[#FAFAF7] dark:bg-[#161616]">

          {/* Top: New chat */}
          <div className="px-3 pt-3 shrink-0">
            <button
              onClick={() => handleNewSession()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium text-[#0071E3] dark:text-[#0A84FF] hover:bg-[#0071E3]/10 dark:hover:bg-[#0A84FF]/10 transition group"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span>新建对话</span>
            </button>
          </div>

          {/* AI Apps */}
          <div className="px-3 mt-1 shrink-0">
            {AI_APPS.map(app => (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition text-left"
                title={app.desc}
              >
                <span className="w-[18px] h-[18px] shrink-0 text-gray-500 dark:text-gray-400 flex items-center justify-center">{app.icon}</span>
                <span className="truncate">{app.name}</span>
              </button>
            ))}
          </div>

          {/* Search button */}
          <div className="px-3 mt-1 shrink-0">
            <button
              onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 80); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition text-left"
            >
              <Search className="w-[18px] h-[18px] shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="flex-1 truncate">搜索会话</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 border border-black/[0.06] dark:border-white/[0.08] text-[10px] text-gray-400 font-mono shrink-0">⌘/</kbd>
            </button>
          </div>

          {/* History Sessions */}
          <div className="flex-1 min-h-0 flex flex-col mt-4">
            <div className="text-[12px] font-medium text-gray-400 dark:text-gray-500 px-5 mb-1.5 shrink-0">
              历史会话
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3">
              {sessions.map(session => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 text-[#0071E3] dark:text-[#0A84FF]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-[14px] font-medium truncate flex-1">{session.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all shrink-0"
                      title="删除会话"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer hint */}
          <div className="shrink-0 px-4 py-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-[12px] text-gray-400 dark:text-gray-500">
              <div className="w-6 h-6 rounded-md bg-[#0071E3]/10 dark:bg-[#0A84FF]/15 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
              </div>
              <span>{pageCtx.pageLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Right Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1C1C1E]">

          {/* Header — minimal */}
          <div className="shrink-0">
            <div className="flex items-center justify-between px-6 h-12">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-[14px] font-medium text-gray-800 dark:text-gray-200 truncate">
                  {activeSession?.title || 'AI 业务助手'}
                </h3>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {activeSkill && (
                  <span className="ml-2 text-[11px] text-[#0071E3] dark:text-[#0A84FF] bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                    {SKILL_LABELS[activeSkill]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition" title="清空对话">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-[900px] mx-auto px-8 py-6">
              {messages.map(msg => (
                <AIMessageBubble
                key={msg.id}
                message={msg}
                onCardNavigate={handleClose}
                onReportRegenerate={handleReportRegenerate}
                onReportSubmit={handleReportSubmit}
              />
              ))}

              {isLoading && (
                <div className="mb-6 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF] animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF] animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF] animate-pulse" style={{ animationDelay: '400ms' }} />
                  <span className="text-[12px] text-gray-400 ml-1">思考中...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Welcome quick actions */}
          {isWelcomeOnly && (
            <div className="shrink-0 max-w-[900px] mx-auto w-full px-8 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {getQuickQuestions(pageCtx).map(q => (
                  <button
                    key={q.text}
                    onClick={() => handleSend(q.text)}
                    className="text-[12px] px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 bg-white dark:bg-white/[0.03] hover:bg-[#0071E3]/5 dark:hover:bg-[#0A84FF]/10 hover:border-[#0071E3]/40 dark:hover:border-[#0A84FF]/40 hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition flex items-center gap-1.5"
                  >
                    <span className="opacity-70">{q.icon}</span> {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input — Claude style, large pill */}
          <div className="shrink-0 max-w-[900px] mx-auto w-full px-8 pb-5">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#252527] shadow-sm hover:shadow-md focus-within:border-[#0071E3] dark:focus-within:border-[#0A84FF] focus-within:shadow-[0_0_0_3px_rgba(0,113,227,0.1)] transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply..."
                rows={1}
                className="w-full resize-none px-5 pt-4 pb-2 text-[15px] bg-transparent border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none max-h-[180px] custom-scrollbar"
                style={{ minHeight: 28 }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 180) + 'px';
                }}
              />
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition" title="附件">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                    <span>智能路由</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition" title="语音">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-1.5 rounded-md bg-[#0071E3] hover:bg-[#0062CC] disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
              {aiAvailable === false ? '本地模式 · 后端未配置 GEMINI_API_KEY' : 'AI 助手回答仅供参考，请核对关键信息'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Session Search Modal ── */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[600] flex items-start justify-center pt-[18vh] px-4"
          onClick={() => { setIsSearchOpen(false); setSessionSearch(''); }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[60vh]"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'searchIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Search Input */}
            <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-gray-100 dark:border-white/10">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={sessionSearch}
                onChange={e => setSessionSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setIsSearchOpen(false); setSessionSearch(''); }
                  if (e.key === 'Enter' && filteredSessions.length > 0) {
                    handleSwitchSession(filteredSessions[0].id);
                    setIsSearchOpen(false);
                    setSessionSearch('');
                  }
                }}
                placeholder="搜索历史会话标题或内容..."
                className="flex-1 bg-transparent text-[15px] outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                autoFocus
              />
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[11px] text-gray-400 font-mono shrink-0">ESC</kbd>
              <button
                onClick={() => { setIsSearchOpen(false); setSessionSearch(''); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
              {filteredSessions.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">
                  {sessionSearch ? '未找到匹配会话' : '输入关键词搜索历史会话'}
                </div>
              )}
              {filteredSessions.map(session => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => { handleSwitchSession(session.id); setIsSearchOpen(false); setSessionSearch(''); }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                      isActive
                        ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 text-[#0071E3] dark:text-[#0A84FF]'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-[14px] font-medium truncate">{session.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{formatRelativeTime(session.updatedAt)}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[11px] text-gray-400">
              <div className="flex items-center gap-3">
                <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-mono">↵</kbd> 打开</span>
                <span><kbd className="px-1 py-0.5 rounded bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-mono">ESC</kbd> 关闭</span>
              </div>
              <span>共 {filteredSessions.length} / {sessions.length} 条</span>
            </div>
          </div>
          <style>{`@keyframes searchIn { from { opacity: 0; transform: scale(0.96) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </ModalPortal>
  );
};

export default AIAssistantDrawer;
