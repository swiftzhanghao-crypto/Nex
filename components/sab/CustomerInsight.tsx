import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Search, Sparkles, X } from 'lucide-react';
import { mockCustomers, type CustomerRow } from './sabData';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatch(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, 'gi');
  const parts = text.split(re);
  const qLower = q.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === qLower ? (
      <mark
        key={i}
        className="bg-transparent text-[#0071E3] dark:text-[#0A84FF] font-semibold"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function matchesCustomer(c: CustomerRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  return (
    c.name.toLowerCase().includes(s) ||
    c.shortName.toLowerCase().includes(s) ||
    c.id.toLowerCase().includes(s) ||
    c.group.toLowerCase().includes(s)
  );
}

const QUICK_ENTRIES: { title: string; count: string; preset: string }[] = [
  { title: '集团客户', count: '364', preset: 'group' },
  { title: '成交客户', count: '1,247', preset: 'deal' },
  { title: '授权覆盖客户', count: '986', preset: 'auth' },
  { title: '百强客户', count: '89', preset: 'top100' },
  { title: '上市公司', count: '312', preset: 'listed' },
  { title: '本年应续约客户', count: '128', preset: 'renew' },
  { title: '进行中商机客户', count: '276', preset: 'oppty' },
  { title: '全部客户', count: '12,486', preset: 'all' },
];

export const CustomerInsight: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return [];
    return mockCustomers.filter((c) => matchesCustomer(c, inputValue)).slice(0, 8);
  }, [inputValue]);

  const resultCustomers = useMemo(() => {
    if (!activeQuery.trim()) return [];
    return mockCustomers.filter((c) => matchesCustomer(c, activeQuery));
  }, [activeQuery]);

  const showingResults = activeQuery.trim().length > 0;

  const runSearch = useCallback(() => {
    const q = inputValue.trim();
    setActiveQuery(q);
    setDropdownOpen(false);
  }, [inputValue]);

  const clearSearch = useCallback(() => {
    setInputValue('');
    setActiveQuery('');
    setDropdownOpen(false);
  }, []);

  const goCustomer = useCallback(
    (id: string) => {
      navigate(`/sab-insight/customer/${id}`);
    },
    [navigate]
  );

  const goList = useCallback(
    (preset: string) => {
      navigate(`/sab-insight/customer-list?preset=${encodeURIComponent(preset)}`);
    },
    [navigate]
  );

  return (
    <div className="min-h-full bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-white/95 pb-16">
      <div className="mx-auto max-w-4xl px-5 pt-14 sm:pt-20">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/5 px-3 py-1 text-xs font-medium text-[#86868B] border border-black/5 dark:border-white/10 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
            SAB 客户洞察
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
            智能查客户
          </h1>
          <p className="text-lg text-[#86868B] max-w-xl mx-auto leading-relaxed">
            输入客户名称、简称、客户编号或所属集团，即时匹配企业客户档案。
          </p>
        </div>

        <div className="relative max-w-2xl mx-auto mb-12">
          <div
            className="flex items-stretch rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden focus-within:ring-2 focus-within:ring-[#0071E3]/25 dark:focus-within:ring-[#0A84FF]/25 transition-shadow"
          >
            <div className="pl-4 flex items-center text-[#86868B]">
              <Search className="w-5 h-5" strokeWidth={2} />
            </div>
            <input
              type="search"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setDropdownOpen(false), 180);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
              placeholder="搜索客户名称、简称、编号或集团…"
              className="flex-1 min-w-0 bg-transparent py-4 px-3 text-[15px] text-[#1D1D1F] dark:text-white placeholder:text-[#86868B]/80 outline-none"
              aria-autocomplete="list"
              aria-expanded={dropdownOpen && suggestions.length > 0}
            />
            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
                aria-label="清除"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={runSearch}
              className="shrink-0 m-1.5 px-6 rounded-xl text-[15px] font-semibold text-white bg-[#0071E3] dark:bg-[#0A84FF] hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#0A84FF]/40 focus:ring-offset-2 dark:focus:ring-offset-[#1C1C1E]"
            >
              搜索
            </button>
          </div>

          {dropdownOpen && inputValue.trim() && suggestions.length > 0 && !showingResults && (
            <div
              className="absolute z-20 left-0 right-0 top-full mt-2 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden animate-[fadeIn_0.2s_ease-out]"
              role="listbox"
            >
              <ul className="max-h-72 overflow-y-auto py-1">
                {suggestions.map((c) => (
                  <li key={c.id} role="option">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goCustomer(c.id)}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-semibold shrink-0 ${c.avatarClass}`}
                      >
                        {c.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-medium text-[#1D1D1F] dark:text-white truncate">
                          {highlightMatch(c.name, inputValue)}
                        </div>
                        <div className="text-xs text-[#86868B] truncate">
                          {highlightMatch(c.shortName, inputValue)} ·{' '}
                          {highlightMatch(c.group, inputValue) || '—'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#86868B] shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {showingResults && (
          <div className="space-y-4 mb-8 animate-[fadeIn_0.35s_ease-out]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#86868B]">
                找到 <span className="font-semibold text-[#1D1D1F] dark:text-white">{resultCustomers.length}</span>{' '}
                位与「<span className="text-[#1D1D1F] dark:text-white font-medium">{activeQuery}</span>」相关的客户
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline"
              >
                返回入口
              </button>
            </div>
            {resultCustomers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white/60 dark:bg-[#1C1C1E]/60 px-6 py-12 text-center text-[#86868B] shadow-apple">
                暂无匹配客户，请尝试其他关键词。
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {resultCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => goCustomer(c.id)}
                    className="text-left rounded-2xl border border-black/[0.04] dark:border-white/10 bg-white dark:bg-[#1C1C1E] p-4 shadow-apple hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)] transition-shadow group"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-base font-semibold shrink-0 ${c.avatarClass}`}
                      >
                        {c.initial}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-semibold text-[#1D1D1F] dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors line-clamp-2">
                          {highlightMatch(c.name, activeQuery)}
                        </div>
                        <div className="text-xs text-[#86868B] flex flex-wrap gap-x-2 gap-y-1">
                          <span>{highlightMatch(c.shortName, activeQuery)}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {highlightMatch(c.group, activeQuery)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {c.tags.slice(0, 3).map((t) => (
                            <span
                              key={t.label}
                              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${t.color}`}
                            >
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#86868B] shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showingResults && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {QUICK_ENTRIES.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goList(item.preset)}
                className="rounded-2xl border border-black/[0.04] dark:border-white/10 bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-apple text-left hover:border-[#0071E3]/30 dark:hover:border-[#0A84FF]/30 transition-colors group"
              >
                <div className="text-xs font-medium text-[#86868B] mb-2 group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">
                  {item.title}
                </div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white tabular-nums">
                  {item.count}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInsight;
