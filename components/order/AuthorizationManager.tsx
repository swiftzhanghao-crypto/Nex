
import React, { useState, useMemo, useRef } from 'react';
import { Search, X, ChevronDown, KeyRound, Filter } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const regions = ['全部', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '珠海'];

const searchFieldOptions = [
  { value: 'authCode' as const, label: '授权编号', placeholder: '请输入授权编号' },
  { value: 'orderId' as const, label: '订单编号', placeholder: '请输入订单编号' },
  { value: 'customerName' as const, label: '客户名称', placeholder: '请输入客户名称' },
  { value: 'productName' as const, label: '产品名称', placeholder: '请输入产品名称' },
];

const colWidthMap: Record<string, number> = {
  authCode: 230, orderId: 130, licensee: 200, customer: 220,
  product: 220, authPeriod: 180, servicePeriod: 180,
};

const AuthorizationManager: React.FC = () => {
  const { authorizations } = useAppContext();
  const [searchField, setSearchField] = useState<'authCode' | 'orderId' | 'customerName' | 'productName'>('authCode');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);

  const [regionFilter, setRegionFilter] = useState('全部');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const filtered = useMemo(() => {
    let result = authorizations;
    if (regionFilter !== '全部') {
      result = result.filter(a => a.licensee.includes(regionFilter));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a => {
        if (searchField === 'authCode') return a.authCode.toLowerCase().includes(q);
        if (searchField === 'orderId') return a.orderId.toLowerCase().includes(q);
        if (searchField === 'customerName') return a.customerName.toLowerCase().includes(q) || a.customerId.toLowerCase().includes(q);
        if (searchField === 'productName') return a.productName.toLowerCase().includes(q);
        return true;
      });
    }
    return result;
  }, [authorizations, regionFilter, searchTerm, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatPeriod = (start?: string, end?: string) => (
    <div className="space-y-0.5 text-xs">
      <div className="flex gap-1.5">
        <span className="text-gray-400 dark:text-gray-500 shrink-0">开始:</span>
        <span className="text-gray-700 dark:text-gray-300">{start || '-'}</span>
      </div>
      <div className="flex gap-1.5">
        <span className="text-gray-400 dark:text-gray-500 shrink-0">结束:</span>
        <span className="text-gray-700 dark:text-gray-300">{end || '-'}</span>
      </div>
    </div>
  );

  const allColumns = [
    { id: 'authCode', label: '授权编号' },
    { id: 'orderId', label: '订单编号' },
    { id: 'licensee', label: '被授权方' },
    { id: 'customer', label: '客户名称' },
    { id: 'product', label: '产品名称' },
    { id: 'authPeriod', label: '授权期间' },
    { id: 'servicePeriod', label: '服务期间' },
  ];

  const tableColGroup = (
    <colgroup>
      {allColumns.map(col => (
        <col key={col.id} style={{ width: colWidthMap[col.id] || 160 }} />
      ))}
    </colgroup>
  );

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">授权列表</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* Search bar */}
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
                        onClick={() => { setSearchField(opt.value); setSearchTerm(''); setIsSearchFieldOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${searchField === opt.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        {opt.label}
                      </button>
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
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className={`flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm font-semibold transition shadow-apple ${
              isFilterOpen || regionFilter !== '全部'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-[#0071E3] dark:text-[#0A84FF]'
                : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            筛选
            {regionFilter !== '全部' && (
              <span className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#0071E3] text-white text-[10px] font-bold">1</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {isFilterOpen && (
        <div className="unified-card dark:bg-[#1C1C1E] p-4 animate-fade-in">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">被授权方</span>
              <div className="relative">
                <button
                  onClick={() => setIsRegionOpen(!isRegionOpen)}
                  className="flex items-center gap-2 min-w-[140px] px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-white/20 transition"
                >
                  <span className="flex-1 text-left">{regionFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {isRegionOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsRegionOpen(false)} />
                    <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-40 py-1 max-h-52 overflow-y-auto">
                      {regions.map(r => (
                        <button
                          key={r}
                          onClick={() => { setRegionFilter(r); setIsRegionOpen(false); setCurrentPage(1); }}
                          className={`w-full text-left px-3 py-2 text-sm transition ${
                            regionFilter === r
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-bold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >{r}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => { setRegionFilter('全部'); setCurrentPage(1); }}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              重置
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="unified-card overflow-hidden">
        {/* Fixed header */}
        <div
          ref={headerScrollRef}
          className="overflow-x-auto no-scrollbar"
          onScroll={e => { if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: 1360 }}>
            {tableColGroup}
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
              <tr>
                {allColumns.map(col => (
                  <th key={col.id} className={`px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] ${
                    col.id === 'authCode' ? 'pl-6' : ''
                  }`}>{col.label}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div
          ref={bodyScrollRef}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar"
          onScroll={e => { if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: 1360 }}>
            {tableColGroup}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400 dark:text-gray-600">
                    <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">暂无授权记录</p>
                  </td>
                </tr>
              ) : paged.map(a => (
                <tr key={a.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0">
                  <td className="px-4 py-4 pl-6">
                    <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] break-all leading-relaxed">{a.authCode}</span>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{a.orderId}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white font-medium">{a.licensee}</td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">{a.customerName}</div>
                    <div className="text-xs text-[#0071E3] dark:text-[#0A84FF] font-mono mt-0.5">{a.customerId}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">{a.productName}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{a.productCode}</div>
                  </td>
                  <td className="px-4 py-4">{formatPeriod(a.authStartDate, a.authEndDate)}</td>
                  <td className="px-4 py-4">{formatPeriod(a.serviceStartDate, a.serviceEndDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
          <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filtered.length}</span> 条</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer hover:-[#0071E3]/50 transition"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
              >
                {[20, 50, 100].map(n => <option key={n} value={n}>{n} 条</option>)}
              </select>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">第 {currentPage} / {totalPages} 页</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorizationManager;
