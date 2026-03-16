
import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, Receipt, Calendar, SlidersHorizontal } from 'lucide-react';

export interface Invoice {
  id: string;
  invoiceTitle: string;
  amount: number;
  applyTime: string;
  applyType: '开票' | '红冲' | '换票';
  status: 'PENDING' | 'PROCESSING' | 'ISSUED' | 'CANCELLED' | 'REJECTED';
  orderId?: string;
  taxId?: string;
  remark?: string;
}

interface InvoiceManagerProps {
  invoices: Invoice[];
}

const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string; darkBg: string; darkText: string }> = {
  PENDING:    { label: '待开票', dot: 'bg-amber-400',  text: 'text-amber-600',  bg: 'bg-amber-50',  darkBg: 'dark:bg-amber-900/20',  darkText: 'dark:text-amber-400' },
  PROCESSING: { label: '开票中', dot: 'bg-blue-400',   text: 'text-blue-600',   bg: 'bg-blue-50',   darkBg: 'dark:bg-blue-900/20',   darkText: 'dark:text-blue-400' },
  ISSUED:     { label: '已开票', dot: 'bg-green-500',  text: 'text-green-600',  bg: 'bg-green-50',  darkBg: 'dark:bg-green-900/20',  darkText: 'dark:text-green-400' },
  CANCELLED:  { label: '已取消', dot: 'bg-gray-400',   text: 'text-gray-500',   bg: 'bg-gray-100',  darkBg: 'dark:bg-white/10',      darkText: 'dark:text-gray-400' },
  REJECTED:   { label: '已驳回', dot: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50',    darkBg: 'dark:bg-red-900/20',    darkText: 'dark:text-red-400' },
};

const applyTypeConfig: Record<string, { text: string; bg: string; darkBg: string; darkText: string }> = {
  '开票': { text: 'text-indigo-600', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20', darkText: 'dark:text-indigo-400' },
  '红冲': { text: 'text-red-600',    bg: 'bg-red-50',    darkBg: 'dark:bg-red-900/20',    darkText: 'dark:text-red-400' },
  '换票': { text: 'text-teal-600',   bg: 'bg-teal-50',   darkBg: 'dark:bg-teal-900/20',   darkText: 'dark:text-teal-400' },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ invoices }) => {
  const [searchText, setSearchText] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterApplyType, setFilterApplyType] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...invoices];
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(inv =>
        inv.id.toLowerCase().includes(q) ||
        inv.invoiceTitle.toLowerCase().includes(q) ||
        inv.amount.toString().includes(q) ||
        (inv.orderId || '').toLowerCase().includes(q)
      );
    }
    if (dateStart) result = result.filter(inv => inv.applyTime >= dateStart);
    if (dateEnd)   result = result.filter(inv => inv.applyTime.slice(0, 10) <= dateEnd);
    if (filterStatus.length > 0)    result = result.filter(inv => filterStatus.includes(inv.status));
    if (filterApplyType.length > 0) result = result.filter(inv => filterApplyType.includes(inv.applyType));
    return result;
  }, [invoices, searchText, dateStart, dateEnd, filterStatus, filterApplyType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const isAllSelected = paginated.length > 0 && paginated.every(inv => selectedIds.has(inv.id));
  const toggleAll = () => {
    if (isAllSelected) setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(inv => n.delete(inv.id)); return n; });
    else               setSelectedIds(prev => { const n = new Set(prev); paginated.forEach(inv => n.add(inv.id)); return n; });
  };

  const toggleFilter = <T extends string>(arr: T[], val: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    setCurrentPage(1);
  };

  const activeFilterCount = filterStatus.length + filterApplyType.length;

  const formatAmount = (n: number) => '¥ ' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatTime = (s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">发票管理</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">共 {filtered.length} 条申请记录</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="unified-card p-3 flex flex-wrap items-center gap-3">
        {/* Keyword */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">关键字</span>
          <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl h-9 w-[300px]">
            <div className="flex items-center flex-1 px-3 gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="申请明细编号 / 发票抬头 / 开票金额 / 订单号"
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
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">申请时间</span>
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 h-9">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateStart}
              onChange={e => { setDateStart(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="date"
              value={dateEnd}
              onChange={e => { setDateEnd(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Filter Button */}
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
            筛选
            {activeFilterCount > 0 && (
              <span className="bg-white/30 rounded-full px-1.5 text-xs font-bold">{activeFilterCount}</span>
            )}
          </button>

          {isFilterOpen && (
            <div className="unified-card absolute right-0 top-full mt-2 w-64 p-4 z-30 space-y-4 animate-modal-enter origin-top-right">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">筛选条件</span>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setFilterStatus([]); setFilterApplyType([]); setCurrentPage(1); }} className="text-xs text-[#0071E3] hover:underline">清除全部</button>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">发票状态</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button key={key}
                      onClick={() => toggleFilter(filterStatus, key, setFilterStatus)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                        filterStatus.includes(key)
                          ? 'bg-[#0071E3] text-white border-[#0071E3]'
                          : `${cfg.bg} ${cfg.darkBg} ${cfg.text} ${cfg.darkText} border-transparent`
                      }`}
                    >{cfg.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">申请类型</p>
                <div className="flex gap-1.5">
                  {(['开票', '红冲', '换票'] as const).map(t => (
                    <button key={t}
                      onClick={() => toggleFilter(filterApplyType, t, setFilterApplyType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                        filterApplyType.includes(t)
                          ? 'bg-[#0071E3] text-white border-[#0071E3]'
                          : `${applyTypeConfig[t].bg} ${applyTypeConfig[t].darkBg} ${applyTypeConfig[t].text} ${applyTypeConfig[t].darkText} border-transparent`
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterStatus.map(s => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/30">
              {statusConfig[s]?.label}
              <button onClick={() => setFilterStatus(prev => prev.filter(x => x !== s))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filterApplyType.map(t => (
            <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-white/10">
              {t}
              <button onClick={() => setFilterApplyType(prev => prev.filter(x => x !== t))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="unified-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="unified-table-header">
                <th className="px-4 py-3 w-10 text-center">
                  <input type="checkbox" checked={isAllSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer" />
                </th>
                <th className="px-4 py-3 text-left min-w-[140px]">申请明细编号</th>
                <th className="px-4 py-3 text-left min-w-[200px]">发票抬头</th>
                <th className="px-4 py-3 text-right min-w-[130px]">申请开票金额</th>
                <th className="px-4 py-3 text-left min-w-[160px]">申请时间</th>
                <th className="px-4 py-3 text-left min-w-[120px]">发票申请类型</th>
                <th className="px-4 py-3 text-left min-w-[110px]">发票状态</th>
                <th className="px-4 py-3 text-left min-w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Receipt className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">暂无发票申请记录</p>
                  </td>
                </tr>
              ) : (
                paginated.map(inv => {
                  const sCfg = statusConfig[inv.status];
                  const tCfg = applyTypeConfig[inv.applyType];
                  const isSelected = selectedIds.has(inv.id);
                  return (
                    <tr key={inv.id}
                      className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/3 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(inv.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer" />
                      </td>
                      {/* 申请明细编号 */}
                      <td className="px-4 py-3.5">
                        <span className="text-[#0071E3] dark:text-blue-400 font-mono text-xs font-medium">{inv.id}</span>
                      </td>
                      {/* 发票抬头 */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{inv.invoiceTitle}</span>
                        {inv.taxId && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{inv.taxId}</div>
                        )}
                      </td>
                      {/* 申请开票金额 */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-orange-500 dark:text-orange-400">{formatAmount(inv.amount)}</span>
                      </td>
                      {/* 申请时间 */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(inv.applyTime)}
                      </td>
                      {/* 发票申请类型 */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${tCfg.bg} ${tCfg.darkBg} ${tCfg.text} ${tCfg.darkText}`}>
                          {inv.applyType}
                        </span>
                      </td>
                      {/* 发票状态 */}
                      <td className="px-4 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sCfg.bg} ${sCfg.darkBg} ${sCfg.text} ${sCfg.darkText}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot} shrink-0`} />
                          {sCfg.label}
                        </div>
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3.5">
                        <button className="text-xs text-[#0071E3] dark:text-blue-400 hover:underline font-medium transition">
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>共 <strong className="text-gray-700 dark:text-gray-200">{filtered.length}</strong> 条</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer mr-1"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}条/页</option>)}
              </select>
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
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                      currentPage === page ? 'bg-[#0071E3] text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >{page}</button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceManager;
