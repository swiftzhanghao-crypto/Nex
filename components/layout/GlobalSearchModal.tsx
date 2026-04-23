import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Sparkles, ArrowRight, Loader2, X, ShoppingCart, Users as UsersIcon, Package, FileBarChart, Bot, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';
import {
  routeSkill,
  executeSkill,
  getSkillModule,
  getFilteredData,
  buildSkillContext,
  parsePageContext,
  SKILL_LABELS,
} from '../../services/aiAssistant';
import type { AppDataSnapshot } from '../../services/aiAssistant';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onOpenAIDrawer: (query?: string) => void;
}

interface QuickMatch {
  type: 'order' | 'customer' | 'product';
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

interface AIResult {
  content: string;
  skillLabel: string;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose, onOpenAIDrawer }) => {
  const appCtx = useAppContext();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [quickMatches, setQuickMatches] = useState<QuickMatch[]>([]);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  useEffect(() => {
    if (open) {
      setQuery('');
      setQuickMatches([]);
      setAiResult(null);
      setIsSearching(false);
      setSelectedIdx(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
      // 全局搜索需要订单/客户全量数据 → 第一次打开时按需懒加载
      appCtx.loadAllOrders?.();
      appCtx.loadAllCustomers?.();
    }
  }, [open, appCtx]);

  const fuzzyMatch = (name: string, q: string): boolean => {
    const n = name.toLowerCase();
    const ql = q.toLowerCase();
    if (n.includes(ql) || ql.includes(n)) return true;
    let pos = 0;
    for (const ch of Array.from(ql)) {
      const idx = n.indexOf(ch, pos);
      if (idx === -1) return false;
      pos = idx + 1;
    }
    return true;
  };

  const scoreMatch = (name: string, q: string): number => {
    const n = name.toLowerCase();
    const ql = q.toLowerCase();
    if (n === ql) return 100;
    if (n.startsWith(ql)) return 90;
    if (n.includes(ql)) return 80;
    if (ql.includes(n)) return 70;
    return 50;
  };

  const doQuickSearch = useCallback((text: string) => {
    if (!text.trim()) {
      setQuickMatches([]);
      return;
    }
    const t = text.trim().toLowerCase();
    const results: QuickMatch[] = [];

    const orderMatches = appCtx.filteredOrders
      .filter(o => {
        const firstProduct = o.items?.[0]?.productName || '';
        return o.id.toLowerCase().includes(t) || (o.customerName || '').toLowerCase().includes(t) || firstProduct.toLowerCase().includes(t);
      })
      .slice(0, 3);
    for (const o of orderMatches) {
      const firstProduct = o.items?.[0]?.productName || '未知产品';
      results.push({
        type: 'order',
        id: o.id,
        title: `${o.id}`,
        subtitle: `${o.customerName || '未知客户'} · ${firstProduct}`,
        path: `/orders/${o.id}`,
      });
    }

    const customerMatches = appCtx.filteredCustomers
      .filter(c => c.companyName && c.companyName.length >= 2 && (fuzzyMatch(c.companyName, t) || c.id.toLowerCase().includes(t)))
      .sort((a, b) => scoreMatch(b.companyName, t) - scoreMatch(a.companyName, t))
      .slice(0, 3);
    for (const c of customerMatches) {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.companyName,
        subtitle: `${c.id} · ${(c as any).industry || '企业客户'}`,
        path: `/customers/${c.id}`,
      });
    }

    const productMatches = appCtx.filteredProducts
      .filter(p => p.name && p.name.length >= 2 && (fuzzyMatch(p.name, t) || p.id.toLowerCase().includes(t)))
      .sort((a, b) => scoreMatch(b.name, t) - scoreMatch(a.name, t))
      .slice(0, 3);
    for (const p of productMatches) {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `${p.id} · ${(p as any).category || '产品'}`,
        path: `/products/${p.id}`,
      });
    }

    setQuickMatches(results);
    setSelectedIdx(-1);
  }, [appCtx.filteredOrders, appCtx.filteredCustomers, appCtx.filteredProducts]);

  useEffect(() => {
    doQuickSearch(query);
  }, [query, doQuickSearch]);

  const getAppData = useCallback((): AppDataSnapshot => ({
    orders: appCtx.filteredOrders as unknown[],
    customers: appCtx.filteredCustomers as unknown[],
    opportunities: appCtx.opportunities as unknown[],
    contracts: appCtx.contracts as unknown[],
    products: appCtx.filteredProducts as unknown[],
    performances: appCtx.performances as unknown[],
  }), [appCtx.filteredOrders, appCtx.filteredCustomers, appCtx.opportunities, appCtx.contracts, appCtx.filteredProducts, appCtx.performances]);

  const handleAISearch = useCallback(async () => {
    const text = query.trim();
    if (!text || isSearching) return;
    setIsSearching(true);
    setAiResult(null);

    try {
      const routeResult = await routeSkill(text);
      const skillModule = getSkillModule(routeResult.skillId);
      const pageCtx = parsePageContext(window.location.pathname);
      const filteredData = getFilteredData(routeResult.skillId, getAppData(), pageCtx);
      const context = buildSkillContext(routeResult.skillId, filteredData, pageCtx);
      const answer = await executeSkill(text, skillModule.definition.systemPrompt, context);

      setAiResult({
        content: answer,
        skillLabel: SKILL_LABELS[routeResult.skillId] || '通用助手',
      });
    } catch (err) {
      console.error('[全局搜索] AI 搜索失败:', err);
      setAiResult({
        content: '抱歉，AI 搜索时出现了错误。请稍后重试或打开 AI 助手进行对话。',
        skillLabel: '错误',
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, getAppData]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = quickMatches.length + (aiResult ? 0 : 1);

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      e.preventDefault();

      if (selectedIdx >= 0 && selectedIdx < quickMatches.length) {
        handleNavigate(quickMatches[selectedIdx].path);
        return;
      }

      if (query.trim()) {
        handleAISearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, -1));
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4" />;
      case 'customer': return <UsersIcon className="w-4 h-4" />;
      case 'product': return <Package className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'order': return '订单';
      case 'customer': return '客户';
      case 'product': return '产品';
      default: return '';
    }
  };

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

        <div
          className="relative w-full max-w-[640px] mx-4 animate-[searchSlideIn_200ms_ease-out]"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="bg-white dark:bg-[#2a2a2d] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/5">
              {isSearching
                ? <Loader2 className="w-5 h-5 text-[#0071E3] dark:text-[#0A84FF] animate-spin shrink-0" />
                : <Sparkles className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" />}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索订单、客户、产品，或向 AI 提问..."
                className="flex-1 text-base text-gray-900 dark:text-white bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setAiResult(null); inputRef.current?.focus(); }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 border border-gray-200/80 dark:border-white/10 text-[10px] text-gray-400 font-mono shrink-0">ESC</kbd>
            </div>

            {/* Results Area */}
            {(quickMatches.length > 0 || isSearching || aiResult) && (
              <div className="max-h-[420px] overflow-y-auto">
                {/* Quick Matches */}
                {quickMatches.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="px-2 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">快速跳转</div>
                    {quickMatches.map((m, idx) => (
                      <button
                        key={`${m.type}-${m.id}`}
                        onClick={() => handleNavigate(m.path)}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${
                          idx === selectedIdx
                            ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/15'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className={`shrink-0 p-1.5 rounded-lg ${
                          idx === selectedIdx
                            ? 'bg-[#0071E3]/15 text-[#0071E3] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                        }`}>
                          {typeIcon(m.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.subtitle}</div>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10">{typeLabel(m.type)}</span>
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition ${idx === selectedIdx ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-300 dark:text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider */}
                {quickMatches.length > 0 && (isSearching || aiResult) && (
                  <div className="mx-5 border-t border-gray-100 dark:border-white/5" />
                )}

                {/* AI Loading */}
                {isSearching && (
                  <div className="px-5 py-6 flex items-center gap-3">
                    <div className="relative">
                      <Sparkles className="w-5 h-5 text-[#0071E3] dark:text-[#0A84FF]" />
                      <div className="absolute inset-0 animate-ping">
                        <Sparkles className="w-5 h-5 text-[#0071E3]/40 dark:text-[#0A84FF]/40" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-300">AI 正在分析您的问题...</div>
                      <div className="mt-1.5 flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0071E3]/40 dark:bg-[#0A84FF]/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Result */}
                {aiResult && !isSearching && (
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-4 h-4 text-[#0071E3] dark:text-[#0A84FF]" />
                      <span className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF]">AI {aiResult.skillLabel}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-h-[240px] overflow-y-auto pr-1">
                      {aiResult.content.length > 600 ? aiResult.content.slice(0, 600) + '...' : aiResult.content}
                    </div>
                    {aiResult.content.length > 600 && (
                      <button
                        onClick={() => { onOpenAIDrawer(query); onClose(); }}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline"
                      >
                        在 AI 助手中查看完整回答 <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> AI 搜索
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-px rounded bg-gray-200/80 dark:bg-white/10 text-[10px] font-mono">↑↓</kbd> 导航
                </span>
              </div>
              <button
                onClick={() => { onOpenAIDrawer(query); onClose(); }}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition"
              >
                <Bot className="w-3.5 h-3.5" />
                打开 AI 助手
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ModalPortal>
  );
};

export default GlobalSearchModal;
