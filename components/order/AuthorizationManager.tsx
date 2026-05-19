
import React, { useState, useMemo, useRef } from 'react';
import { Search, X, ChevronDown, KeyRound, Filter, Award, ShieldCheck, Printer } from 'lucide-react';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import Pagination from '../common/Pagination';
import ModalPortal from '../common/ModalPortal';
import type { Authorization } from '../../types';

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
  useEnsureData(['authorizations']);
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

  // Certificate drawer state
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null);
  const [certView, setCertView] = useState<'paper' | 'structured'>('paper');
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  const handleOpenCert = (auth: Authorization) => {
    setSelectedAuth(auth);
    setCertView('paper');
    setIsDrawerClosing(false);
  };

  const handleCloseCert = () => {
    setIsDrawerClosing(true);
    setTimeout(() => { setSelectedAuth(null); setIsDrawerClosing(false); }, 300);
  };

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

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('zh-CN'); } catch { return d; }
  };

  return (
    <div className="page-container h-full flex flex-col gap-2.5 animate-page-enter min-w-0">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
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
        <div className="unified-card dark:bg-[#1C1C1E] p-4 animate-fade-in shrink-0">
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
      <div className="unified-card overflow-hidden flex-1 min-h-0 flex flex-col">
        {/* Fixed header */}
        <div
          ref={headerScrollRef}
          className="overflow-x-auto no-scrollbar shrink-0"
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
          className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar"
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
                    <button
                      onClick={() => handleOpenCert(a)}
                      className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] break-all leading-relaxed hover:underline cursor-pointer text-left"
                    >
                      {a.authCode}
                    </button>
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

        <Pagination
          page={currentPage}
          size={pageSize}
          total={filtered.length}
          onPageChange={setCurrentPage}
          onSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
        />
      </div>

      {/* ── Authorization Certificate Drawer ── */}
      {selectedAuth && (
        <ModalPortal>
        <div className="fixed inset-0 z-[500] flex justify-end">
          <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseCert} />
          <div className={`relative w-full max-w-4xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>

            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center print:hidden bg-white dark:bg-white/5">
              <div className="flex items-center gap-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" /> 软件授权证书
                </h3>
                <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                  <button
                    onClick={() => setCertView('paper')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'paper' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    电子授权书
                  </button>
                  <button
                    onClick={() => setCertView('structured')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'structured' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    纸质授权书
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition">
                  <Printer className="w-4 h-4" /> 打印证书
                </button>
                <button onClick={handleCloseCert} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-black/50 flex justify-center">
              {certView === 'paper' ? (
                /* ── 电子授权书 (结构化展示) ── */
                <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-5xl flex flex-col">
                  <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAuth.productName} 电子授权信息</h2>
                      {(() => {
                        const now = new Date();
                        const start = new Date(selectedAuth.authStartDate);
                        const end = new Date(selectedAuth.authEndDate);
                        if (now < start) return <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">未生效</span>;
                        if (now > end) return <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">已过期</span>;
                        return <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">生效中</span>;
                      })()}
                    </div>
                  </div>

                  <div className="p-10 space-y-12">
                    <section className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">授权信息</h3>
                      <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">被授权方:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedAuth.licensee}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权类型:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium">随机数量授权</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">客户名称:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedAuth.customerName}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">客户编号:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedAuth.customerId}</span>
                        </div>
                        <div className="flex items-start gap-4 col-span-2">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权范围:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium leading-relaxed">
                            中华人民共和国范围内（香港及澳门特别行政区、台湾地区除外）
                          </span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权开始:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{formatDate(selectedAuth.authStartDate)}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权结束:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{formatDate(selectedAuth.authEndDate)}</span>
                        </div>
                        <div className="flex items-start gap-4 col-span-2">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权说明:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium">
                            授权编号一致的电子授权或纸版授权（如有）为同一授权，不重复累加。
                          </span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权编号:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedAuth.authCode}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">订单编号:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedAuth.orderId}</span>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">产品信息</h3>
                      <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">授权产品:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedAuth.productName}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">产品编码:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedAuth.productCode}</span>
                        </div>
                      </div>
                    </section>

                    {(selectedAuth.serviceStartDate || selectedAuth.serviceEndDate) && (
                    <section className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">服务信息</h3>
                      <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">服务开始时间:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{formatDate(selectedAuth.serviceStartDate)}</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="text-gray-400 text-sm min-w-[100px]">服务结束时间:</span>
                          <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{formatDate(selectedAuth.serviceEndDate)}</span>
                        </div>
                      </div>
                    </section>
                    )}
                  </div>
                </div>
              ) : (
                /* ── 纸质授权书 (A4 证书排版) ── */
                <div id="cert-content" className="relative bg-white text-gray-900 border-[12px] border-white shadow-2xl w-[800px] h-[1100px] p-16 flex flex-col justify-between overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                    <ShieldCheck className="w-[600px] h-[600px]" />
                  </div>

                  <div className="relative z-10 text-center space-y-12 mt-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="unified-button-primary w-20 h-20 rounded-3xl text-3xl font-black italic shadow-xl flex items-center justify-center">W</div>
                      <div className="text-sm font-bold tracking-[0.4em] text-blue-600 uppercase">WPS Enterprise Systems</div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-5xl font-serif text-gray-900 font-medium tracking-wide">软件产品授权证书</h2>
                      <div className="text-xs text-gray-400 uppercase tracking-[0.3em]">Certificate of Software License</div>
                    </div>

                    <div className="text-left text-lg leading-loose text-gray-700 space-y-10 pt-10 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">授权用户 (Licensee)</p>
                        <h3 className="text-3xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500/30 decoration-4">{selectedAuth.licensee}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-left bg-gray-50 p-8 rounded-3xl border border-gray-100">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">产品名称 (Product)</div>
                          <div className="text-xl font-bold text-gray-900">{selectedAuth.productName}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">产品编码 (Code)</div>
                          <div className="text-lg font-medium text-gray-900 font-mono">{selectedAuth.productCode}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">授权期间 (Period)</div>
                          <div className="text-base font-mono font-medium text-gray-900">
                            {formatDate(selectedAuth.authStartDate)} ~ {formatDate(selectedAuth.authEndDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">订单编号 (Order)</div>
                          <div className="text-lg font-mono font-medium text-gray-900">{selectedAuth.orderId}</div>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-gray-200/50">
                          <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">授权许可码 (License Key)</div>
                          <div className="font-mono text-base text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-100 break-all shadow-apple">
                            {selectedAuth.authCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pb-8 relative z-10">
                    <div className="space-y-1 text-left">
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Authorized Signature</div>
                      <div className="h-16 w-48 border-b border-gray-300 relative flex items-end pb-2">
                        <span className="text-4xl font-serif italic text-blue-900 opacity-90 rotate-[-5deg]">WPS Inc.</span>
                      </div>
                      <div className="text-sm font-bold mt-2">WPS Systems Ltd.</div>
                    </div>
                    <div className="text-right">
                      <div className="w-32 h-32 border-4 border-blue-600 rounded-full flex items-center justify-center relative rotate-[-12deg] opacity-80 mask-stamp">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute top-4">Official Seal</div>
                        <ShieldCheck className="w-12 h-12 text-blue-600" />
                        <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute bottom-4">Verified</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default AuthorizationManager;
