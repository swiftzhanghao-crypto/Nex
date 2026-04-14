
import React, { useState, useMemo, useRef } from 'react';
import { Search, ChevronDown, X, Filter, ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Order, OrderStatus } from '../../types';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface AcceptanceRow {
  acceptanceNo: string;
  orderId: string;
  orderDate: string;
  orderStatus: OrderStatus;
  customerName: string;
  customerId: string;
  productName: string;
  lineNo: string;
  acceptanceType: string;
  acceptanceCondition: string;
  expectedTime: string;
  acceptanceRatio: string;
  acceptanceAmount: number;
  acceptanceStatus: string;
  contactName: string;
  contactPhone: string;
  contactMethod: string;
  salesRepName: string;
}

const statusLabelMap: Record<string, { label: string; color: string; bg: string; darkBg: string; darkColor: string }> = {
  'Pending':     { label: '待验收', color: 'text-amber-600', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', darkColor: 'dark:text-amber-400' },
  'In Progress': { label: '验收中', color: 'text-blue-600',  bg: 'bg-blue-50',  darkBg: 'dark:bg-blue-900/20',  darkColor: 'dark:text-blue-400' },
  'Completed':   { label: '已完成', color: 'text-green-600', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/20', darkColor: 'dark:text-green-400' },
  '未配置':      { label: '未配置', color: 'text-gray-400',  bg: 'bg-gray-50',  darkBg: 'dark:bg-gray-800/20',  darkColor: 'dark:text-gray-500' },
};

const AcceptanceManager: React.FC = () => {
  const { orders } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'acceptanceNo' | 'orderId' | 'customerName'>('acceptanceNo');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const searchFieldOptions = [
    { value: 'acceptanceNo' as const, label: '验收编号', placeholder: '请输入验收编号' },
    { value: 'orderId' as const, label: '订单编号', placeholder: '搜索订单编号…' },
    { value: 'customerName' as const, label: '客户名称', placeholder: '搜索客户名称…' },
  ];
  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const allRows: AcceptanceRow[] = useMemo(() => {
    const rows: AcceptanceRow[] = [];
    let seq = 0;
    orders.forEach((order: Order) => {
      order.items.forEach((item, idx) => {
        seq++;
        const lineNo = String(idx + 1).padStart(3, '0');
        const acceptanceNo = `YS${String(seq).padStart(6, '0')}`;
        const acType = order.acceptanceConfig?.type === 'Phased' ? '分期验收' : '一次性验收';
        const acStatus = order.acceptanceConfig?.status || '未配置';
        rows.push({
          acceptanceNo,
          orderId: order.id,
          orderDate: order.date,
          orderStatus: order.status,
          customerName: order.customerName,
          customerId: order.customerId,
          productName: item.productName,
          lineNo,
          acceptanceType: acType,
          acceptanceCondition: '视同验收',
          expectedTime: '发货后2日',
          acceptanceRatio: '100%',
          acceptanceAmount: item.priceAtPurchase * item.quantity,
          acceptanceStatus: acStatus,
          contactName: order.acceptanceInfo?.contactName || '-',
          contactPhone: order.acceptanceInfo?.contactPhone || '-',
          contactMethod: order.acceptanceInfo?.method === 'Remote' ? '远程' : order.acceptanceInfo?.method === 'OnSite' ? '现场' : '-',
          salesRepName: order.salesRepName || '-',
        });
      });
    });
    return rows;
  }, [orders]);

  const allStatuses = [...new Set(allRows.map(r => r.acceptanceStatus))];
  const allTypes = [...new Set(allRows.map(r => r.acceptanceType))];

  const filtered = useMemo(() => {
    let result = allRows;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(r => {
        if (searchField === 'acceptanceNo') return r.acceptanceNo.toLowerCase().includes(q);
        if (searchField === 'orderId') return r.orderId.toLowerCase().includes(q);
        return r.customerName.toLowerCase().includes(q);
      });
    }
    if (filterStatus.length > 0) result = result.filter(r => filterStatus.includes(r.acceptanceStatus));
    if (filterType.length > 0) result = result.filter(r => filterType.includes(r.acceptanceType));
    return result;
  }, [allRows, searchText, searchField, filterStatus, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paged.length > 0 && paged.every(r => selectedIds.has(r.acceptanceNo));

  const toggleAll = () => {
    if (allSelected) { const n = new Set(selectedIds); paged.forEach(r => n.delete(r.acceptanceNo)); setSelectedIds(n); }
    else { const n = new Set(selectedIds); paged.forEach(r => n.add(r.acceptanceNo)); setSelectedIds(n); }
  };
  const toggleOne = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n); };
  const toggleFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    setCurrentPage(1);
  };
  const hasFilters = filterStatus.length > 0 || filterType.length > 0;
  const clearFilters = () => { setFilterStatus([]); setFilterType([]); setCurrentPage(1); };

  const columns = [
    { id: 'acceptanceNo', label: '验收编号', width: 120 },
    { id: 'orderId', label: '订单编号', width: 200 },
    { id: 'customerName', label: '客户名称', width: 180 },
    { id: 'productName', label: '产品名称', width: 180 },
    { id: 'acceptanceType', label: '验收类型', width: 100 },
    { id: 'acceptanceCondition', label: '验收条件', width: 100 },
    { id: 'expectedTime', label: '预计验收时间', width: 120 },
    { id: 'acceptanceRatio', label: '验收比例', width: 90 },
    { id: 'acceptanceAmount', label: '验收金额', width: 120 },
    { id: 'acceptanceStatus', label: '验收状态', width: 100 },
    { id: 'contactName', label: '验收联系人', width: 110 },
    { id: 'contactPhone', label: '联系电话', width: 130 },
    { id: 'contactMethod', label: '验收方式', width: 90 },
    { id: 'salesRepName', label: '销售负责人', width: 110 },
  ];

  const totalMinWidth = 48 + columns.reduce((s, c) => s + c.width, 0);
  const tableColGroup = (
    <colgroup>
      <col style={{ width: 48 }} />
      {columns.map(c => <col key={c.id} style={{ width: c.width }} />)}
    </colgroup>
  );

  const getStatusStyle = (status: string) => statusLabelMap[status] || statusLabelMap['未配置'];

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">验收管理</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">共 {filtered.length} 条验收记录</span>
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
            {hasFilters && <span className="px-1.5 py-0.5 text-[10px] bg-[#0071E3] text-white rounded-full font-bold">{filterStatus.length + filterType.length}</span>}
          </button>

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
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">验收状态</span>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(s => (
                  <button key={s} onClick={() => toggleFilter(filterStatus, s, setFilterStatus)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${filterStatus.includes(s) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                  >{getStatusStyle(s).label}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">验收方式</span>
              <div className="flex flex-wrap gap-2">
                {allTypes.map(t => (
                  <button key={t} onClick={() => toggleFilter(filterType, t, setFilterType)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${filterType.includes(t) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
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
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: totalMinWidth }}>
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
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: totalMinWidth }}>
            {tableColGroup}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-20 text-gray-400 dark:text-gray-600">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">暂无验收记录</p>
                  </td>
                </tr>
              ) : paged.map(r => {
                const isSelected = selectedIds.has(r.acceptanceNo);
                const stickyBg = isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-900/10'
                  : 'bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 dark:group-hover:bg-white/[0.03]';
                const st = getStatusStyle(r.acceptanceStatus);
                return (
                  <tr key={r.acceptanceNo} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${isSelected ? '!bg-blue-50/50 dark:!bg-blue-900/10' : ''}`}>
                    <td className={`pl-5 pr-2 py-3 sticky left-0 z-20 ${stickyBg} transition-colors`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(r.acceptanceNo)} className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-[#0071E3]" />
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold text-[#0071E3] dark:text-[#0A84FF] whitespace-nowrap sticky left-[48px] z-20 ${stickyBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors text-xs`}>
                      {r.acceptanceNo}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0071E3] dark:text-[#0A84FF] font-bold whitespace-nowrap truncate">{r.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap truncate">{r.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap truncate">{r.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.acceptanceType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.acceptanceCondition}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.expectedTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{r.acceptanceRatio}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right whitespace-nowrap">¥{r.acceptanceAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${st.bg} ${st.darkBg} ${st.color} ${st.darkColor} border-current/20`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.contactName}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{r.contactPhone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.contactMethod}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.salesRepName}</td>
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

export default AcceptanceManager;
