
import React, { useState, useMemo, useRef } from 'react';
import { Search, ChevronDown, X, Filter, ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';
import { DeliveryInfo } from '../types';

interface DeliveryInfoManagerProps {
  deliveryInfos: DeliveryInfo[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const DeliveryInfoManager: React.FC<DeliveryInfoManagerProps> = ({ deliveryInfos }) => {
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'id' | 'orderId' | 'customerName'>('id');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterAuthType, setFilterAuthType] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const searchFieldOptions = [
    { value: 'id' as const, label: '交付编号', placeholder: '请输入交付明细编号' },
    { value: 'orderId' as const, label: '订单编号', placeholder: '搜索订单编号…' },
    { value: 'customerName' as const, label: '客户名称', placeholder: '搜索客户名称…' },
  ];
  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const allDeliveryTypes = [...new Set(deliveryInfos.map(d => d.deliveryType))];
  const allAuthTypes = [...new Set(deliveryInfos.map(d => d.authType))];

  const filtered = useMemo(() => {
    let result = deliveryInfos;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(d => {
        if (searchField === 'id') return d.id.toLowerCase().includes(q);
        if (searchField === 'orderId') return d.orderId.toLowerCase().includes(q);
        return d.customerName.toLowerCase().includes(q) || d.customerId.toLowerCase().includes(q);
      });
    }
    if (filterType.length > 0) result = result.filter(d => filterType.includes(d.deliveryType));
    if (filterAuthType.length > 0) result = result.filter(d => filterAuthType.includes(d.authType));
    return result;
  }, [deliveryInfos, searchText, searchField, filterType, filterAuthType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paged.length > 0 && paged.every(d => selectedIds.has(d.id));

  const toggleAll = () => {
    if (allSelected) { const n = new Set(selectedIds); paged.forEach(d => n.delete(d.id)); setSelectedIds(n); }
    else { const n = new Set(selectedIds); paged.forEach(d => n.add(d.id)); setSelectedIds(n); }
  };
  const toggleOne = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const toggleFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    setCurrentPage(1);
  };
  const hasFilters = filterType.length > 0 || filterAuthType.length > 0;
  const clearFilters = () => { setFilterType([]); setFilterAuthType([]); setCurrentPage(1); };

  const formatPeriod = (start?: string, end?: string) => (
    <div className="space-y-0.5 text-xs leading-relaxed">
      <div>开始: <span className="text-gray-700 dark:text-gray-300">{start || '-'}</span></div>
      <div>结束: <span className="text-gray-700 dark:text-gray-300">{end || '-'}</span></div>
    </div>
  );

  const columns = [
    { id: 'id', label: '交付编号', width: 160 },
    { id: 'deliveryType', label: '交付类型', width: 85 },
    { id: 'orderId', label: '订单编号', width: 120 },
    { id: 'quantity', label: '购买数量', width: 85 },
    { id: 'authType', label: '授权类型', width: 95 },
    { id: 'licensee', label: '被授权方', width: 200 },
    { id: 'customer', label: '客户名称/编号', width: 210 },
    { id: 'authCode', label: '授权编号', width: 100 },
    { id: 'authDuration', label: '授权期限', width: 80 },
    { id: 'authPeriod', label: '授权期间', width: 185 },
    { id: 'servicePeriod', label: '服务期间', width: 185 },
  ];

  const tableColGroup = (
    <colgroup>
      <col style={{ width: 48 }} />
      {columns.map(c => <col key={c.id} style={{ width: c.width }} />)}
    </colgroup>
  );

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">交付列表</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Search */}
          <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsSearchFieldOpen(v => !v)}
                className="h-full flex items-center gap-1.5 pl-3 pr-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-l-lg border-r border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors select-none whitespace-nowrap"
              >
                {currentSearchOption.label}
                <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${isSearchFieldOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSearchFieldOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearchFieldOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-28 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                    {searchFieldOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSearchField(opt.value); setSearchText(''); setIsSearchFieldOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${searchField === opt.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder={currentSearchOption.placeholder}
                className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-9 flex items-center gap-1.5 px-3 rounded-lg border text-sm font-semibold transition shadow-apple ${
              hasFilters
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-[#0071E3]'
                : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            筛选
            {hasFilters && <span className="px-1.5 py-0.5 text-[10px] bg-[#0071E3] text-white rounded-full font-bold">{filterType.length + filterAuthType.length}</span>}
          </button>

          {/* Query / Clear */}
          <button
            onClick={() => setCurrentPage(1)}
            className="h-9 px-4 bg-[#0071E3] text-white text-sm font-bold rounded-lg hover:bg-[#0062CC] transition shadow-sm"
          >查询</button>
          <button
            onClick={() => { setSearchText(''); clearFilters(); }}
            className="h-9 px-4 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >清空</button>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="unified-card p-4 space-y-4 dark:bg-[#1C1C1E] animate-slide-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">筛选条件</span>
            {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 hover:underline font-bold">清空全部</button>}
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">交付类型</span>
              <div className="flex flex-wrap gap-2">
                {allDeliveryTypes.map(t => (
                  <button key={t} onClick={() => toggleFilter(filterType, t, setFilterType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${filterType.includes(t) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">授权类型</span>
              <div className="flex flex-wrap gap-2">
                {allAuthTypes.map(t => (
                  <button key={t} onClick={() => toggleFilter(filterAuthType, t, setFilterAuthType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${filterAuthType.includes(t) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="unified-card overflow-hidden">
        {/* Fixed Header */}
        <div
          ref={headerScrollRef}
          className="overflow-x-auto no-scrollbar"
          onScroll={e => { if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
            {tableColGroup}
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
              <tr>
                <th className="pl-5 pr-2 py-3 border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] sticky left-0 z-10 w-[48px]">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-[#0071E3]" />
                </th>
                {columns.map((col, ci) => (
                  <th key={col.id} className={`px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    ci === 0 ? 'sticky left-[48px] z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]' : ''
                  }`}>{col.label}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body */}
        <div
          ref={bodyScrollRef}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-330px)] custom-scrollbar"
          onScroll={e => { if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
            {tableColGroup}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-20 text-gray-400 dark:text-gray-600">
                    <PackageCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">暂无交付记录</p>
                  </td>
                </tr>
              ) : paged.map(d => {
                const isSelected = selectedIds.has(d.id);
                const stickyBg = isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-900/10'
                  : 'bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 dark:group-hover:bg-white/[0.03]';
                return (
                  <tr key={d.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${isSelected ? '!bg-blue-50/50 dark:!bg-blue-900/10' : ''}`}>
                    <td className={`pl-5 pr-2 py-3 sticky left-0 z-20 ${stickyBg} transition-colors`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(d.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-[#0071E3]" />
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold text-[#0071E3] dark:text-[#0A84FF] whitespace-nowrap sticky left-[48px] z-20 ${stickyBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors text-xs`}>
                      {d.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{d.deliveryType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0071E3] dark:text-[#0A84FF] font-bold">{d.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-bold text-right">{d.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{d.authType}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{d.licensee}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white leading-relaxed">{d.customerName}</div>
                      <div className="text-xs text-[#0071E3] dark:text-[#0A84FF] font-mono mt-0.5">{d.customerId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{d.authCode || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{d.authDuration || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatPeriod(d.authStartDate, d.authEndDate)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatPeriod(d.serviceStartDate, d.serviceEndDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            共 <span className="font-bold text-gray-700 dark:text-gray-200">{filtered.length}</span> 条 · 每页
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none">
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            条 · 第 {currentPage}/{totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition ${page === currentPage ? 'bg-[#0071E3] text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfoManager;
