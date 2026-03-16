
import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, Banknote, Calendar, Filter, SlidersHorizontal } from 'lucide-react';

export interface Remittance {
  id: string;
  erpDocNo?: string;
  bankTransactionNo?: string;
  type: '渠道' | '客户';
  remitterName: string;
  remitterAccount?: string;
  paymentMethod: string;
  amount: number;
  receiverName: string;
  receiverAccount?: string;
  paymentTime: string;
}

interface RemittanceManagerProps {
  remittances: Remittance[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const RemittanceManager: React.FC<RemittanceManagerProps> = ({ remittances }) => {
  const [searchText, setSearchText] = useState('');
  const [dateStart, setDateStart] = useState('2025-12-14');
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterMethod, setFilterMethod] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('默认视图');

  const filtered = useMemo(() => {
    let result = [...remittances];

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        (r.erpDocNo || '').toLowerCase().includes(q) ||
        (r.bankTransactionNo || '').toLowerCase().includes(q) ||
        r.remitterName.toLowerCase().includes(q) ||
        r.amount.toString().includes(q) ||
        r.receiverName.toLowerCase().includes(q)
      );
    }

    if (dateStart) {
      result = result.filter(r => r.paymentTime >= dateStart);
    }
    if (dateEnd) {
      result = result.filter(r => r.paymentTime.slice(0, 10) <= dateEnd);
    }
    if (filterType.length > 0) {
      result = result.filter(r => filterType.includes(r.type));
    }
    if (filterMethod.length > 0) {
      result = result.filter(r => filterMethod.includes(r.paymentMethod));
    }

    return result;
  }, [remittances, searchText, dateStart, dateEnd, filterType, filterMethod]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const isAllSelected = paginated.length > 0 && paginated.every(r => selectedIds.has(r.id));
  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => { const next = new Set(prev); paginated.forEach(r => next.delete(r.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); paginated.forEach(r => next.add(r.id)); return next; });
    }
  };

  const activeFilterCount = filterType.length + filterMethod.length;

  const formatAmount = (n: number) =>
    '¥ ' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatTime = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-page-enter">

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">汇款明细</h1>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="unified-card p-3 flex flex-wrap items-center gap-3">
        {/* Keyword Search */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">关键字</span>
          <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden h-9 w-[340px]">
            <div className="flex items-center flex-1 px-3 gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="汇款单号/汇款银行流水单号/汇款账户名称/付款金额/收款账户名称/单据号(ERP)"
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                className="w-full bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">支付时间</span>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 h-9">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateStart}
              onChange={e => { setDateStart(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            />
            <span className="text-gray-400 text-xs mx-1">-</span>
            <input
              type="date"
              value={dateEnd}
              onChange={e => { setDateEnd(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* View Mode */}
        <div className="relative">
          <button className="flex items-center gap-2 h-9 px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition">
            {viewMode}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition
              ${activeFilterCount > 0
                ? 'bg-[#0071E3] text-white border-[#0071E3]'
                : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && (
              <span className="bg-white/30 rounded-full px-1.5 text-xs font-bold">{activeFilterCount}</span>
            )}
          </button>

          {isFilterOpen && (
            <div className="unified-card absolute right-0 top-full mt-2 w-64 p-4 z-30 space-y-4 animate-modal-enter origin-top-right">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">筛选</span>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setFilterType([]); setFilterMethod([]); setCurrentPage(1); }} className="text-xs text-[#0071E3] hover:underline">清除</button>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">类型</p>
                <div className="flex gap-2">
                  {['渠道', '客户'].map(t => (
                    <button key={t} onClick={() => {
                      setFilterType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
                      setCurrentPage(1);
                    }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                        filterType.includes(t)
                          ? 'bg-[#0071E3] text-white border-[#0071E3]'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">付款方式</p>
                <div className="flex flex-wrap gap-2">
                  {['电汇', '网银', '支票', '现金'].map(m => (
                    <button key={m} onClick={() => {
                      setFilterMethod(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
                      setCurrentPage(1);
                    }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                        filterMethod.includes(m)
                          ? 'bg-[#0071E3] text-white border-[#0071E3]'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >{m}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {(filterType.length > 0 || filterMethod.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filterType.map(t => (
            <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/30">
              类型：{t}
              <button onClick={() => setFilterType(prev => prev.filter(x => x !== t))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filterMethod.map(m => (
            <span key={m} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-white/10">
              付款方式：{m}
              <button onClick={() => setFilterMethod(prev => prev.filter(x => x !== m))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="unified-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="unified-table-header">
                <th className="px-4 py-3 w-10 text-center sticky left-0 bg-gray-50/80 dark:bg-[#1C1C1E]/80 backdrop-blur-sm z-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left min-w-[110px] sticky left-10 bg-gray-50/80 dark:bg-[#1C1C1E]/80 backdrop-blur-sm z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">汇款单号</th>
                <th className="px-4 py-3 text-left min-w-[180px]">单据号(ERP)</th>
                <th className="px-4 py-3 text-left min-w-[140px]">汇款银行流水号</th>
                <th className="px-4 py-3 text-left min-w-[80px]">类型</th>
                <th className="px-4 py-3 text-left min-w-[160px]">汇款账户名称</th>
                <th className="px-4 py-3 text-left min-w-[160px]">汇款银行账号</th>
                <th className="px-4 py-3 text-left min-w-[90px]">付款方式</th>
                <th className="px-4 py-3 text-right min-w-[110px]">付款金额</th>
                <th className="px-4 py-3 text-left min-w-[170px]">收款账户名称</th>
                <th className="px-4 py-3 text-left min-w-[160px]">收银行账号</th>
                <th className="px-4 py-3 text-left min-w-[140px]">支付时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <Banknote className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">暂无汇款记录</p>
                  </td>
                </tr>
              ) : (
                paginated.map(r => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/3 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-center sticky left-0 bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(r.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer"
                        />
                      </td>
                      {/* 汇款单号 - sticky */}
                      <td className="px-4 py-3.5 sticky left-10 bg-white dark:bg-[#1C1C1E] z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <span className="text-[#0071E3] dark:text-blue-400 font-mono text-xs font-medium">{r.id}</span>
                      </td>
                      {/* 单据号ERP */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{r.erpDocNo || <span className="text-gray-300 dark:text-gray-600">-</span>}</span>
                      </td>
                      {/* 汇款银行流水号 */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {r.bankTransactionNo || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>
                      {/* 类型 */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${
                          r.type === '渠道'
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/30'
                            : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800/30'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      {/* 汇款账户名称 */}
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[160px]">
                        <div className="leading-snug">{r.remitterName}</div>
                      </td>
                      {/* 汇款银行账号 */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {r.remitterAccount || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>
                      {/* 付款方式 */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{r.paymentMethod}</span>
                      </td>
                      {/* 付款金额 */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-orange-500 dark:text-orange-400 whitespace-nowrap">{formatAmount(r.amount)}</span>
                      </td>
                      {/* 收款账户名称 */}
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 max-w-[170px]">
                        <div className="leading-snug">{r.receiverName}</div>
                      </td>
                      {/* 收银行账号 */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {r.receiverAccount || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>
                      {/* 支付时间 */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(r.paymentTime)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count + pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>共 <strong className="text-gray-700 dark:text-gray-200">{filtered.length}</strong> 条</span>
            {filtered.length > 0 && (
              <span className="text-xs text-gray-400">合计：<span className="text-orange-500 dark:text-orange-400 font-semibold">{formatAmount(totalAmount)}</span></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mr-2">
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}条/页</option>)}
              </select>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 7) {
                if (currentPage <= 4) page = i + 1;
                else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                else page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                    currentPage === page
                      ? 'bg-[#0071E3] text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >{page}</button>
              );
            })}
            {totalPages > 7 && currentPage < totalPages - 3 && <span className="text-gray-400 text-xs">...</span>}
            {totalPages > 7 && currentPage < totalPages - 3 && (
              <button onClick={() => setCurrentPage(totalPages)} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition">{totalPages}</button>
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemittanceManager;
