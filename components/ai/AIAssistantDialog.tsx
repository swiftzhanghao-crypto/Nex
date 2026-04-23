import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, Bot, Trash2, Sparkles, MapPin } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import AIMessageBubble from './AIMessageBubble';
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

interface AIAssistantDialogProps {
  open: boolean;
  onClose: () => void;
}

let _msgCounter = 0;
function nextId(): string {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

function makeWelcomeMessage(hasAI: boolean | null): ChatMessage {
  const modeNote = hasAI === false
    ? '\n\n⚠️ 后端未配置 GEMINI_API_KEY，当前运行在**本地分析模式**。可查看数据摘要，如需 AI 深度分析请联系管理员在服务端配置。'
    : '';

  return {
    id: 'welcome',
    role: 'assistant',
    content: `你好！我是 AI 业务助手，可以帮你进行：\n\n• **风险管控** — 订单异常、价格/回款风险分析\n• **续费分析** — 判断新购/续费/增购/升级\n• **客户360** — 客户全貌画像与历史查询\n• **业务总结** — 业绩汇总与业务简报\n\n请描述你的问题，我会自动匹配最合适的专业技能为你解答。${modeNote}`,
    timestamp: Date.now(),
  };
}

/** 根据页面类型生成上下文相关的快捷提问 */
function getQuickQuestions(pageCtx: PageContext): string[] {
  switch (pageCtx.pageType) {
    case 'order_detail':
      return ['这个订单有风险吗？', '这是新购还是续费？', '关联客户情况', '订单信息总结'];
    case 'order_list':
      return ['哪些订单有风险？', '订单数据总结', '回款情况分析', '续费订单有哪些？'];
    case 'customer_detail':
      return ['这个客户整体情况？', '历史订单总结', '客户有续费吗？', '客户风险分析'];
    case 'customer_list':
      return ['客户整体情况', '高价值客户分析', '客户数据总结', '有风险的客户？'];
    case 'opportunity_list':
      return ['商机转化分析', '商机数据总结', '哪些商机有风险？', '预期收入汇总'];
    case 'dashboard':
      return ['本月业绩总结', '订单风险概览', '客户整体情况', '业务简报'];
    default:
      return ['订单有没有风险？', '这个月业绩总结', '客户整体情况', '续费关系分析'];
  }
}

const AIAssistantDialog: React.FC<AIAssistantDialogProps> = ({ open, onClose }) => {
  const appCtx = useAppContext();
  const location = useLocation();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [makeWelcomeMessage(null)]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    isAIConfigured().then((ok) => {
      setAiAvailable(ok);
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'welcome') {
          return [makeWelcomeMessage(ok)];
        }
        return prev;
      });
    });
  }, []);

  // AI 助手往往要根据全量订单/客户作答，dialog 打开时按需懒加载
  useEffect(() => {
    if (!open) return;
    appCtx.loadAllOrders?.();
    appCtx.loadAllCustomers?.();
  }, [open, appCtx]);

  // 根据当前 URL 解析页面上下文
  const pageCtx: PageContext = useMemo(
    () => parsePageContext(location.pathname),
    [location.pathname],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const getAppData = useCallback((): AppDataSnapshot => ({
    orders: appCtx.filteredOrders as unknown[],
    customers: appCtx.filteredCustomers as unknown[],
    opportunities: appCtx.opportunities as unknown[],
    contracts: appCtx.contracts as unknown[],
    products: appCtx.filteredProducts as unknown[],
    performances: appCtx.performances as unknown[],
  }), [appCtx.filteredOrders, appCtx.filteredCustomers, appCtx.opportunities, appCtx.contracts, appCtx.filteredProducts, appCtx.performances]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const routeResult = await routeSkill(text);

      if (routeResult.needsClarification) {
        const clarifyMsg: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: routeResult.clarificationQuestion || '请问您想了解哪方面的信息？',
          skillId: routeResult.skillId,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, clarifyMsg]);
        setActiveSkill(null);
        setIsLoading(false);
        return;
      }

      setActiveSkill(routeResult.skillId);

      const skillModule = getSkillModule(routeResult.skillId);
      const filteredData = getFilteredData(routeResult.skillId, getAppData(), pageCtx);
      const context = buildSkillContext(routeResult.skillId, filteredData, pageCtx);

      const answer = await executeSkill(
        text,
        skillModule.definition.systemPrompt,
        context,
      );

      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: answer,
        skillId: routeResult.skillId,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('[AI助手] 处理失败:', error);
      const errorMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: '抱歉，处理您的问题时出现了错误。请检查 API Key 配置后重试。',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, getAppData, pageCtx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([makeWelcomeMessage(aiAvailable)]);
    setActiveSkill(null);
  };

  if (!open) return null;

  const portalRoot = document.getElementById('modal-root');

  const dialog = (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[70]"
        onClick={onClose}
      />

      {/* 对话框面板 */}
      <div className="fixed bottom-[60px] right-[16px] z-[71] w-[440px] h-[600px] max-h-[85vh] flex flex-col bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl shadow-black/20 border border-gray-200/60 dark:border-white/10 overflow-hidden animate-feedback-enter">

        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/10 shrink-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                AI 业务助手
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              </h3>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {pageCtx.pageLabel}
                {activeSkill && <span className="text-purple-500 dark:text-purple-400 ml-1">· {SKILL_LABELS[activeSkill]}</span>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
              title="清空对话"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          {messages.map(msg => (
            <AIMessageBubble key={msg.id} message={msg} />
          ))}

          {/* 加载动画 */}
          {isLoading && (
            <div className="flex gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快捷提问（根据当前页面动态生成） */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {getQuickQuestions(pageCtx).map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的业务问题..."
              rows={1}
              className="flex-1 resize-none px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-500 transition max-h-[100px] custom-scrollbar"
              style={{ minHeight: '40px' }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
            {aiAvailable === false
              ? '本地模式 · 后端未配置 GEMINI_API_KEY'
              : 'AI 助手基于 Gemini，回答仅供参考'}
          </p>
        </div>
      </div>
    </>
  );

  return portalRoot ? ReactDOM.createPortal(dialog, portalRoot) : dialog;
};

export default AIAssistantDialog;
