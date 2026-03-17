
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, X, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Performance } from '../types';

interface PerformanceManagerProps {
  performances: Performance[];
}

const orderStatusConfig: Record<string, { label: string; cls: string }> = {
  '已失效': { label: '已失效', cls: 'unified-tag-gray' },
  '已完成': { label: '已完成', cls: 'unified-tag-green' },
  '执行中': { label: '执行中', cls: 'unified-tag-blue' },
  '已取消': { label: '已取消', cls: 'unified-tag-red' },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const PerformanceManager: React.FC<PerformanceManagerProps> = ({ performances }) => {
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'id' | 'orderId' | 'owner'>('id');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterService, setFilterService] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const searchFieldOptions = [
    { id: 'id', label: '业绩编号' },
    { id: 'orderId', label: '订单号' },
    { id: 'owner', label: '归属人' },
  ];

  const allStatuses = ['已失效', '已完成', '执行中', '已取消'];
  const allServices = ['授权', '订阅'];

  const filtered = useMemo(() => {
    let result = performances;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(p => {
        if (searchField === 'id') return p.id.toLowerCase().includes(q);
        if (searchField === 'orderId') return p.orderId.toLowerCase().includes(q);
        return p.owner.toLowerCase().includes(q);
      });
    }
    if (filterStatus.length > 0) {
      result = result.filter(p => filterStatus.includes(p.orderStatus));
    }
    if (filterService.length > 0) {
      result = result.filter(p => filterService.includes(p.serviceType));
    }
    return result;
  }, [performances, searchText, searchField, filterStatus, filterService]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paged.length > 0 && paged.every(p => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      paged.forEach(p => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paged.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleFilter = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    setCurrentPage(1);
  };

  const clearFilters = () => { setFilterStatus([]); setFilterService([]); setCurrentPage(1); };
  const hasFilters = filterStatus.length > 0 || filterService.length > 0;

  const fmt = (v: number) => `¥${v.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">业绩管理</h1>
        <span className="text-xs text-gray-400 dark:text-gray-500">共 {filtered.length} 条记录</span>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-0 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="relative">
            <button
              onClick={() => {
                const opts = searchFieldOptions;
                const idx = opts.findIndex(o => o.id === searchField);
                setSearchField(opts[(idx + 1) % opts.length].id as typeof searchField);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition border-r border-gray-100 dark:border-white/10 whitespace-nowrap"
            >
              {searchFieldOptions.find(o => o.id === searchField)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 flex items-center px-3 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
              placeholder="搜索业绩记录…"
              className="flex-1 py-2.5 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:text-white"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
            hasFilters
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-[#0071E3]'
              : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {hasFilters && (
            <span className="px-1.5 py-0.5 text-[10px] bg-[#0071E3] text-white rounded-full font-bold">
              {filterStatus.length + filterService.length}
            </span>
          )}
        </button>
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
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">订单状态</span>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleFilter(filterStatus, s, setFilterStatus)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      filterStatus.includes(s)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">订阅服务</span>
              <div className="flex flex-wrap gap-2">
                {allServices.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleFilter(filterService, s, setFilterService)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      filterService.includes(s)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-[#0071E3]'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="unified-card dark:bg-[#1C1C1E] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[1800px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 44 }} />
              <col style={{ width: 155 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 75 }} />
              <col style={{ width: 115 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 75 }} />
              <col style={{ width: 85 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 115 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 75 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead className="unified-table-header">
              <tr>
                <th className="px-3 py-3.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 dark:border-gray-600 accent-[#0071E3]" />
                </th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">业绩编号</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">订单号</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">验收明细编号</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">订单状态</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">明细金额小计</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">验收比例</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">递延比例</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">后补合同状态</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">优惠折扣</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">成本金额</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">营管业绩</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">营管称重业绩</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">项目称重系数</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">产品称重系数-订阅</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">产品称重系数-授权</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">订阅服务</th>
                <th className="px-3 py-3.5 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">业绩归属人</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-20 text-gray-400 dark:text-gray-600">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">暂无业绩记录</p>
                  </td>
                </tr>
              ) : paged.map(p => {
                const sCfg = orderStatusConfig[p.orderStatus] || { label: p.orderStatus, cls: 'unified-tag-gray' };
                return (
                  <tr key={p.id} className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} className="rounded border-gray-300 dark:border-gray-600 accent-[#0071E3]" />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#0A84FF]">{p.id}</span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{p.orderId}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{p.acceptanceDetailId}</td>
                    <td className="px-3 py-3">
                      <span className={`${sCfg.cls} !text-[10px] !px-2 !py-0.5`}>{sCfg.label}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">{fmt(p.detailAmountSubtotal)}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600 dark:text-gray-300">{p.acceptanceRatio}%</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600 dark:text-gray-300">{p.deferralRatio}%</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${p.postContractStatus === '已提供' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>{p.postContractStatus}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-500">{p.discount}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-gray-600 dark:text-gray-300">{fmt(p.costAmount)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold" style={{ color: p.salesPerformance < 0 ? '#EF4444' : '#10B981' }}>{fmt(p.salesPerformance)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold" style={{ color: p.weightedSalesPerformance < 0 ? '#EF4444' : '#10B981' }}>{fmt(p.weightedSalesPerformance)}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200">{p.projectWeightCoeff}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200">{p.productWeightCoeffSubscription}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200">{p.productWeightCoeffAuthorization}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.serviceType === '授权' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                      }`}>{p.serviceType}</span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>每页</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold outline-none">
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>条 · 第 {currentPage}/{totalPages} 页</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) { page = i + 1; }
              else if (currentPage <= 3) { page = i + 1; }
              else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
              else { page = currentPage - 2 + i; }
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

export default PerformanceManager;
