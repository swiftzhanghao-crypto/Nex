
import React, { useState, useMemo } from 'react';
import { Search, FileText, Filter, ChevronDown, X, CheckCircle, Clock, AlertCircle, Circle, RotateCcw } from 'lucide-react';

export interface Contract {
  id: string;
  code: string;
  name: string;
  externalCode?: string;
  contractType: string;
  partyA?: string;
  partyB?: string;
  verifyStatus: 'PENDING_BUSINESS' | 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED';
  verifyRemark?: string;
  amount?: number;
  signDate?: string;
  createdAt: string;
  orderId?: string;
}

interface ContractManagerProps {
  contracts: Contract[];
}

const contractTypeLabelMap: Record<string, string> = {
  '渠道最终用户合同': '渠道最终用户合同',
  '直销合同': '直销合同',
  '框架合同': '框架合同',
  '服务合同': '服务合同',
  '补充协议': '补充协议',
};

const verifyStatusConfig: Record<string, { label: string; color: string; bg: string; darkBg: string; darkColor: string; dot: string; icon: React.ElementType }> = {
  PENDING_BUSINESS: { label: '待商务核查', color: 'text-amber-600', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', darkColor: 'dark:text-amber-400', dot: 'bg-amber-400', icon: Clock },
  PENDING:          { label: '待核查',     color: 'text-blue-600',  bg: 'bg-blue-50',  darkBg: 'dark:bg-blue-900/20',  darkColor: 'dark:text-blue-400',  dot: 'bg-blue-400',  icon: Circle },
  VERIFIED:         { label: '核查中',     color: 'text-indigo-600', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-900/20', darkColor: 'dark:text-indigo-400', dot: 'bg-indigo-400', icon: RotateCcw },
  APPROVED:         { label: '核查通过',   color: 'text-green-600', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/20', darkColor: 'dark:text-green-400', dot: 'bg-green-500', icon: CheckCircle },
  REJECTED:         { label: '核查不通过', color: 'text-red-600',   bg: 'bg-red-50',   darkBg: 'dark:bg-red-900/20',   darkColor: 'dark:text-red-400',   dot: 'bg-red-500',   icon: AlertCircle },
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const ContractManager: React.FC<ContractManagerProps> = ({ contracts }) => {
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'name' | 'code' | 'partyA'>('name');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const searchFieldOptions = [
    { id: 'name', label: '合同名称' },
    { id: 'code', label: '合同编码' },
    { id: 'partyA', label: '甲方名称' },
  ];

  const allTypes = Object.keys(contractTypeLabelMap);
  const allStatuses = Object.keys(verifyStatusConfig);

  const filtered = useMemo(() => {
    let result = [...contracts];
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(c => {
        if (searchField === 'name') return c.name.toLowerCase().includes(q);
        if (searchField === 'code') return c.code.toLowerCase().includes(q);
        if (searchField === 'partyA') return (c.partyA || '').toLowerCase().includes(q);
        return true;
      });
    }
    if (filterStatus.length > 0) result = result.filter(c => filterStatus.includes(c.verifyStatus));
    if (filterType.length > 0) result = result.filter(c => filterType.includes(c.contractType));
    return result;
  }, [contracts, searchText, searchField, filterStatus, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected = paginated.length > 0 && paginated.every(c => selectedIds.has(c.id));
  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginated.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginated.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleFilterStatus = (s: string) => {
    setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setCurrentPage(1);
  };
  const toggleFilterType = (t: string) => {
    setFilterType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setCurrentPage(1);
  };

  const activeFilterCount = filterStatus.length + filterType.length;

  return (
    <div className="p-4 lg:p-6 space-y-4 animate-page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">合同信息</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">共 {filtered.length} 份合同</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-apple h-9">
            <div className="relative">
              <button
                onClick={() => {}}
                className="flex items-center gap-1 px-3 h-9 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition whitespace-nowrap"
              >
                {searchFieldOptions.find(o => o.id === searchField)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              <select
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={searchField}
                onChange={e => setSearchField(e.target.value as 'name' | 'code' | 'partyA')}
              >
                {searchFieldOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center flex-1 min-w-[180px] px-2 gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
                className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 h-9 rounded-xl border text-sm font-medium transition shadow-apple
                ${activeFilterCount > 0
                  ? 'bg-[#0071E3] text-white border-[#0071E3]'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
            >
              <Filter className="w-3.5 h-3.5" />
              筛选
              {activeFilterCount > 0 && (
                <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-xs font-bold">{activeFilterCount}</span>
              )}
            </button>

            {isFilterOpen && (
              <div className="unified-card absolute right-0 top-full mt-2 w-72 p-4 z-30 space-y-4 animate-modal-enter origin-top-right">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">筛选条件</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setFilterStatus([]); setFilterType([]); setCurrentPage(1); }}
                      className="text-xs text-[#0071E3] hover:underline"
                    >清除全部</button>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">核查状态</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allStatuses.map(s => {
                      const cfg = verifyStatusConfig[s];
                      const active = filterStatus.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleFilterStatus(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                            active
                              ? 'bg-[#0071E3] text-white border-[#0071E3]'
                              : `${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor} border-transparent`
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">合同类型</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTypes.map(t => {
                      const active = filterType.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleFilterType(t)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                            active
                              ? 'bg-[#0071E3] text-white border-[#0071E3]'
                              : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterStatus.map(s => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-800/30">
              {verifyStatusConfig[s]?.label}
              <button onClick={() => toggleFilterStatus(s)} className="hover:text-blue-800 dark:hover:text-blue-200 transition"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filterType.map(t => (
            <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-white/10">
              {t}
              <button onClick={() => toggleFilterType(t)} className="hover:text-gray-800 dark:hover:text-gray-100 transition"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="unified-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Table Header */}
            <thead>
              <tr className="unified-table-header">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left min-w-[200px]">合同名称/编码</th>
                <th className="px-4 py-3 text-left min-w-[140px]">外部合同编码</th>
                <th className="px-4 py-3 text-left min-w-[140px]">合同类型</th>
                <th className="px-4 py-3 text-left min-w-[160px]">甲方（买方）</th>
                <th className="px-4 py-3 text-left min-w-[160px]">乙方（卖方）</th>
                <th className="px-4 py-3 text-left min-w-[120px]">核查状态</th>
                <th className="px-4 py-3 text-left min-w-[120px]">核查备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <FileText className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">暂无合同数据</p>
                  </td>
                </tr>
              ) : (
                paginated.map(contract => {
                  const statusCfg = verifyStatusConfig[contract.verifyStatus];
                  const isSelected = selectedIds.has(contract.id);
                  return (
                    <tr
                      key={contract.id}
                      className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-white/3 ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(contract.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-[#0071E3] cursor-pointer"
                        />
                      </td>

                      {/* 合同名称/编码 */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 text-sm leading-snug mb-0.5 max-w-[200px] truncate" title={contract.name}>
                          {contract.name}
                        </div>
                        <div className="text-xs text-[#0071E3] dark:text-blue-400 font-mono cursor-pointer hover:underline">
                          {contract.code}
                        </div>
                      </td>

                      {/* 外部合同编码 */}
                      <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {contract.externalCode || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>

                      {/* 合同类型 */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {contract.contractType}
                        </span>
                      </td>

                      {/* 甲方 */}
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {contract.partyA || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>

                      {/* 乙方 */}
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {contract.partyB || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>

                      {/* 核查状态 */}
                      <td className="px-4 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusCfg.bg} ${statusCfg.darkBg} ${statusCfg.color} ${statusCfg.darkColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
                          {statusCfg.label}
                        </div>
                      </td>

                      {/* 核查备注 */}
                      <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate" title={contract.verifyRemark}>
                        {contract.verifyRemark || <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} 条</option>)}
              </select>
              <span>共 <strong className="text-gray-700 dark:text-gray-200">{filtered.length}</strong> 条</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >上一页</button>
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
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                      currentPage === page
                        ? 'bg-[#0071E3] text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >{page}</button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManager;
