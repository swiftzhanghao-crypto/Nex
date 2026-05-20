
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../types';
import { Search, Plus, X, Filter, RotateCcw, ChevronDown, Trash2, CheckCircle, Cloud, Loader2, Upload } from 'lucide-react';
import DataImportModal from '../common/DataImportModal';
import ModalPortal from '../common/ModalPortal';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import Pagination from '../common/Pagination';
import { Badge } from '../ui';
import { crmXsyApi, buildCrmXsyOAuthLoginUrl, getToken, customerApi } from '../../services/api';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { buildCustomerListFilters, type CustomerListFilters } from '../../hooks/buildCustomerListParams';

// ── 筛选字段定义 ─────────────────────────────────────────────────
const customerFilterFields: { id: string; label: string; mode: '单选' | '多选' }[] = [
    { id: 'customerType', label: '客户类型', mode: '单选' },
    { id: 'industryLine',  label: '行业条线', mode: '单选' },
    { id: 'customerGrade', label: '客户级别', mode: '多选' },
    { id: 'province',      label: '所在省份', mode: '多选' },
    { id: 'customerAttribute', label: '客户属性', mode: '多选' },
];

interface CFilterCondition {
    id: string;
    fieldId: string;
    mode: '单选' | '多选';
    value: string[];
}

const CustomerManager: React.FC = () => {
  const { customers, filteredCustomers: rowFilteredCustomers, users, apiMode, refreshCustomers } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'crmId' | 'companyName' | 'enterpriseId'>('crmId');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [appliedFilters, setAppliedFilters] = useState<CFilterCondition[]>([]);

  const customerNeedsClientDataset = useMemo(() => {
    if (!apiMode) return true;
    if (searchField === 'enterpriseId' && searchTerm.trim()) return true;
    return appliedFilters.some((f) => f.mode === '多选' && f.value.length > 0);
  }, [apiMode, searchField, searchTerm, appliedFilters]);

  useEnsureData(customerNeedsClientDataset ? ['customers'] : []);

  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const apiListFilters = useMemo(
    () => buildCustomerListFilters(appliedFilters, debouncedSearch, searchField),
    [appliedFilters, debouncedSearch, searchField],
  );

  const customerQuery = usePagedQuery<Customer, CustomerListFilters>({
    fetcher: (p) =>
      customerApi.list({
        page: p.page,
        size: p.size,
        search: p.search || undefined,
        type: p.type || undefined,
        level: p.level || undefined,
        region: p.region || undefined,
        industry: p.industry || undefined,
      }),
    initialFilters: apiListFilters,
    initialSize: itemsPerPage,
    autoFetch: apiMode && !customerNeedsClientDataset,
  });

  useEffect(() => {
    if (!apiMode || customerNeedsClientDataset) return;
    customerQuery.setFilters(apiListFilters, { resetPage: true });
  }, [apiMode, customerNeedsClientDataset, apiListFilters]);

  useEffect(() => {
    if (!apiMode || customerNeedsClientDataset) return;
    customerQuery.setSize(itemsPerPage);
  }, [apiMode, customerNeedsClientDataset, itemsPerPage]);

  const [crmStatus, setCrmStatus] = useState<{ enabled: boolean; bound: boolean } | null>(null);
  const [crmSyncing, setCrmSyncing] = useState(false);
  const [crmBanner, setCrmBanner] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadCrmStatus = useCallback(() => {
    if (!apiMode) {
      setCrmStatus(null);
      return;
    }
    crmXsyApi
      .status()
      .then(setCrmStatus)
      .catch(() => setCrmStatus({ enabled: false, bound: false }));
  }, [apiMode]);

  useEffect(() => {
    loadCrmStatus();
    if (!apiMode) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') loadCrmStatus();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [apiMode, loadCrmStatus]);

  const handleCrmAuthorize = () => {
    const url = buildCrmXsyOAuthLoginUrl('/customers');
    if (!url) {
      setCrmBanner('请先登录业务平台后再连接销售易');
      return;
    }
    window.location.href = url;
  };

  const handleCrmSync = async () => {
    setCrmSyncing(true);
    setCrmBanner(null);
    try {
      const r = await crmXsyApi.syncCustomers();
      if (apiMode && !customerNeedsClientDataset) {
        await customerQuery.refresh();
      } else {
        await refreshCustomers();
      }
      setCrmBanner(`已从销售易同步 ${r.synced} 条客户（共拉取 ${r.total} 条）`);
    } catch (e: unknown) {
      setCrmBanner(e instanceof Error ? e.message : '同步失败');
    } finally {
      setCrmSyncing(false);
    }
  };
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── 筛选状态 ──────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CFilterCondition[]>([]);
  const [activeValueDropdown, setActiveValueDropdown] = useState<{ filterId: string; top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeFilterDrawer = () => {
      setIsFilterClosing(true);
      setTimeout(() => { setIsFilterOpen(false); setIsFilterClosing(false); }, 280);
  };

  useEffect(() => {
      if (!activeValueDropdown) return;
      const handler = (e: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
              setActiveValueDropdown(null);
          }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
  }, [activeValueDropdown]);

  const getFieldOptions = (fieldId: string): string[] => {
      const unique = (arr: (string | undefined)[]) => [...new Set(arr.filter(Boolean))] as string[];
      switch (fieldId) {
          case 'customerType': return [
              '学校', '中央党政机关', '地方党政机关', '中央事业单位', '地方事业单位',
              '军队', '央企', '地方国企', '民企', '金融', '其他中央企业',
              '港澳台企业', '外资企业', '海外', '中央团体', '地方团体',
          ];
          case 'industryLine': return [
              '政务特种', '大客民企', '政务区域党政', '企业区域金融', '企业区域民企',
              '区域新闻出版传媒', '部委党政', '部委医疗', '部委新闻出版传媒', '其他',
              '大客央国企', '大客特种', '渠道和生态', '国内SaaS', '大客金融',
              '教育业务', '企业区域国企', '医疗行业',
          ];
          case 'customerGrade': return ['一级/中央级', '二级/省级', '三级/市级', '四级/县级', '四级以下/县级以下'];
          case 'province': return [
              '北京市', '天津市', '上海市', '重庆市',
              '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
              '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
              '河南省', '湖北省', '湖南省', '广东省', '海南省',
              '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
              '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
              '宁夏回族自治区', '新疆维吾尔自治区',
              '香港特别行政区', '澳门特别行政区',
          ];
          case 'customerAttribute': return ['2B', '2C', '2B&2C'];
          default: return [];
      }
  };

  const addFilterCondition = () => {
      const unused = customerFilterFields.find(f => !draftFilters.some(d => d.fieldId === f.id));
      if (unused) {
          setDraftFilters(prev => [...prev, { id: Math.random().toString(36).slice(2, 9), fieldId: unused.id, mode: unused.mode, value: [] }]);
      }
  };

  const removeFilterCondition = (id: string) => {
      setActiveValueDropdown(null);
      setDraftFilters(prev => prev.filter(f => f.id !== id));
  };

  const updateFieldId = (id: string, fieldId: string) => {
      setActiveValueDropdown(null);
      const fieldDef = customerFilterFields.find(f => f.id === fieldId);
      setDraftFilters(prev => prev.map(f => f.id === id ? { ...f, fieldId, mode: fieldDef?.mode || '多选', value: [] } : f));
  };

  const toggleValue = (filterId: string, val: string) => {
      setDraftFilters(prev => prev.map(f => {
          if (f.id !== filterId) return f;
          if (f.mode === '单选') {
              return { ...f, value: f.value[0] === val ? [] : [val] };
          }
          return { ...f, value: f.value.includes(val) ? f.value.filter(v => v !== val) : [...f.value, val] };
      }));
  };

  const applyFilters = () => {
      setAppliedFilters(draftFilters.filter(f => f.value.length > 0));
      closeFilterDrawer();
      setCurrentPage(1);
      if (apiMode && !customerNeedsClientDataset) {
        customerQuery.setPage(1);
      }
  };

  const resetFilters = () => {
      setDraftFilters([]);
      setAppliedFilters([]);
  };

  const openFilterDrawer = () => {
      if (!isFilterOpen && draftFilters.length === 0) {
          setDraftFilters(customerFilterFields.map((f, i) => ({ id: String(i + 1), fieldId: f.id, mode: f.mode, value: [] })));
      }
      setIsFilterOpen(true);
  };

  const searchFieldOptions: { value: typeof searchField; label: string; placeholder: string }[] = [
      { value: 'crmId',        label: '客户编号', placeholder: '搜索客户编号…' },
      { value: 'companyName',  label: '客户名称', placeholder: '搜索客户名称…' },
      { value: 'enterpriseId', label: '企业ID',   placeholder: '搜索关联企业ID…' },
  ];
  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const toggleValueDropdown = (e: React.MouseEvent, filterId: string) => {
      if (activeValueDropdown?.filterId === filterId) { setActiveValueDropdown(null); return; }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const width = Math.max(rect.width, 220);
      let top = rect.bottom + 4;
      if (rect.bottom + 280 > window.innerHeight - 8) top = Math.max(8, rect.top - 280);
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      setActiveValueDropdown({ filterId, top, left, width });
  };


  const clientFilteredCustomers = rowFilteredCustomers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
        searchField === 'crmId'        ? c.id.toLowerCase().includes(searchLower) :
        searchField === 'companyName'  ? c.companyName.toLowerCase().includes(searchLower) :
        (c.enterprises || []).some(ent => ent.id.toLowerCase().includes(searchLower))
    );

    const matchesFilters = appliedFilters.every(f => {
        if (f.value.length === 0) return true;
        switch (f.fieldId) {
            case 'customerType':      return f.value.includes(c.customerType ?? '');
            case 'industryLine':      return f.value.includes(c.industryLine ?? c.industry ?? '');
            case 'customerGrade':     return f.value.includes(c.customerGrade ?? c.level ?? '');
            case 'province':          return f.value.includes(c.province ?? c.region ?? '');
            case 'customerAttribute': return f.value.includes(c.customerAttribute ?? '');
            default: return true;
        }
    });

    return matchesSearch && matchesFilters;
  }).reverse();

  const useServerPaging = apiMode && !customerNeedsClientDataset;
  const filteredCustomers = useServerPaging ? customerQuery.data : clientFilteredCustomers;
  const listTotal = useServerPaging ? customerQuery.total : clientFilteredCustomers.length;
  const activePage = useServerPaging ? customerQuery.page : currentPage;
  const activePageSize = useServerPaging ? customerQuery.size : itemsPerPage;

  const getLevelBadgeColor = (level: string): 'indigo' | 'blue' | 'green' | 'gray' => {
      switch(level) {
          case '一级/中央级': return 'indigo';
          case '二级/省级': return 'blue';
          case '三级/市级': return 'green';
          case '四级/县级': return 'gray';
          default: return 'gray';
      }
  };

  // Pagination Logic
  const indexOfLastItem = activePage * activePageSize;
  const indexOfFirstItem = indexOfLastItem - activePageSize;
  const currentCustomers = useServerPaging
    ? filteredCustomers
    : clientFilteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const useVirtualScroll = !useServerPaging && clientFilteredCustomers.length > 50;
  const tableCustomers = useVirtualScroll ? clientFilteredCustomers : currentCustomers;

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: tableCustomers.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 68,
    overscan: 8,
    enabled: useVirtualScroll,
  });

  const handlePageChange = (pageNumber: number) => {
    if (useServerPaging) {
      customerQuery.setPage(pageNumber);
    } else {
      setCurrentPage(pageNumber);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    if (useServerPaging) {
      customerQuery.setSize(size);
    } else {
      setCurrentPage(1);
    }
  };

  const [enterprisePopover, setEnterprisePopover] = useState<{ customerId: string; top: number; left: number } | null>(null);
  const enterprisePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enterprisePopover) return;
    const handler = (e: MouseEvent) => {
      if (enterprisePopoverRef.current && !enterprisePopoverRef.current.contains(e.target as Node)) {
        setEnterprisePopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [enterprisePopover]);


  React.useEffect(() => {
    if (!useServerPaging) setCurrentPage(1);
  }, [searchTerm, useServerPaging]);

  return (
    <div className="page-container animate-page-enter h-full flex flex-col gap-4 min-w-0">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">客户信息</h1>
            {apiMode && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {crmStatus?.enabled && crmStatus.bound ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" /> 已连接销售易
                    </span>
                    <button
                      type="button"
                      disabled={crmSyncing}
                      onClick={handleCrmSync}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-white bg-[#0071E3] hover:bg-[#0062CC] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      {crmSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                      从销售易同步客户
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!crmStatus?.enabled) {
                        setCrmBanner('销售易 CRM 集成尚未启用，请联系管理员配置 CRM_XSY_CLIENT_ID / CRM_XSY_CLIENT_SECRET / CRM_XSY_REDIRECT_URI 环境变量');
                        return;
                      }
                      handleCrmAuthorize();
                    }}
                    disabled={!getToken()}
                    title={!getToken() ? '请先登录' : !crmStatus?.enabled ? '管理员尚未配置销售易集成' : '跳转销售易完成授权'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    连接销售易 CRM
                  </button>
                )}
              </div>
            )}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[360px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
                <div className="relative shrink-0 flex items-center">
                    <button
                        onClick={() => setIsSearchFieldOpen(!isSearchFieldOpen)}
                        className="flex items-center gap-1 h-full pl-3 pr-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border-r border-gray-200 dark:border-white/10 whitespace-nowrap"
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
            <button
                onClick={openFilterDrawer}
                className={`p-2 rounded-lg border transition shadow-apple relative ${isFilterOpen || appliedFilters.length > 0 ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                title="高级筛选"
            >
                <Filter className="w-4 h-4" />
                {appliedFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0071E3] rounded-full text-[10px] text-white flex items-center justify-center font-bold">{appliedFilters.length}</span>
                )}
            </button>
            <button
                onClick={() => { setSearchTerm(''); resetFilters(); }}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition shadow-apple"
                title="重置所有筛选"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            {apiMode && (
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-[#0071E3]/40 hover:text-[#0071E3] transition shadow-apple"
              >
                <Upload className="w-4 h-4" />
                导入
              </button>
            )}
        </div>
      </div>

      <DataImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        target="customers"
        onSuccess={async (n) => {
          await refreshCustomers();
          setCrmBanner(`成功导入 ${n} 条客户`);
        }}
      />

      {crmBanner && (
        <div
          className={`text-sm px-4 py-2 rounded-xl border ${
            crmBanner.includes('失败') || crmBanner.includes('请先')
              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50'
              : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-800/40'
          }`}
        >
          {crmBanner}
        </div>
      )}

      <div className="unified-card overflow-hidden flex-1 flex flex-col min-h-0">
        <div ref={tableScrollRef} className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E] sticky top-0 z-10">
              <tr>
                <th className="pl-6 pr-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">关联企业ID</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户类型</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">行业条线</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户级别</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">所在省份</th>
                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户属性</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {(() => {
                const renderRow = (customer: Customer) => {
                const enterprises = customer.enterprises || [];
                const visibleEnterprises = enterprises.slice(0, 2);
                const hiddenCount = enterprises.length - 2;
                return (
                  <tr
                      key={customer.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0"
                  >
                    <td className="pl-6 pr-4 py-3 max-w-[300px]">
                      <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-left group/name"
                      >
                        <div className="font-medium text-gray-900 dark:text-white leading-snug group-hover/name:text-[#0071E3] dark:group-hover/name:text-[#0A84FF] transition">
                          {customer.companyName}
                        </div>
                        <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                          {customer.id}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">
                      {enterprises.length === 0 ? (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {visibleEnterprises.map(ent => (
                            <span key={ent.id} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-md whitespace-nowrap">{ent.id}</span>
                          ))}
                          {hiddenCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (enterprisePopover?.customerId === customer.id) {
                                  setEnterprisePopover(null);
                                } else {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setEnterprisePopover({ customerId: customer.id, top: rect.bottom + 6, left: rect.left });
                                }
                              }}
                              className="flex items-center gap-0.5 bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF] px-1.5 py-0.5 rounded-md text-[11px] font-semibold hover:bg-[#0071E3]/20 transition whitespace-nowrap"
                            >
                              +{hiddenCount} 更多
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge color="gray" className="!rounded-lg">{customer.customerType || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {customer.industryLine || customer.industry || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {customer.customerGrade
                        ? <Badge color="blue" className="!rounded-lg">{customer.customerGrade}</Badge>
                        : <Badge color={getLevelBadgeColor(customer.level)} className="!rounded-lg">{customer.level}</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {customer.province || customer.region || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {customer.customerAttribute
                        ? <Badge color="gray" className="!rounded-lg">{customer.customerAttribute}</Badge>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                  </tr>
                );
                };

                if (tableCustomers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400">暂无客户数据</td>
                    </tr>
                  );
                }

                if (useVirtualScroll) {
                  const virtualRows = rowVirtualizer.getVirtualItems();
                  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
                  const paddingBottom = virtualRows.length > 0
                    ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
                    : 0;
                  return (
                    <>
                      {paddingTop > 0 && (
                        <tr aria-hidden="true">
                          <td colSpan={7} style={{ height: paddingTop, padding: 0, border: 'none' }} />
                        </tr>
                      )}
                      {virtualRows.map((vRow) => renderRow(tableCustomers[vRow.index]))}
                      {paddingBottom > 0 && (
                        <tr aria-hidden="true">
                          <td colSpan={7} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
                        </tr>
                      )}
                    </>
                  );
                }

                return tableCustomers.map((customer) => renderRow(customer));
              })()}
            </tbody>
          </table>
        </div>

        {useVirtualScroll ? (
          <div className="px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
            共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{listTotal}</span> 条
          </div>
        ) : (
          <Pagination
              page={activePage}
              size={activePageSize}
              total={listTotal}
              onPageChange={handlePageChange}
              onSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* ── 企业 ID 弹出层 ─────────────────────────────── */}
      {enterprisePopover && (() => {
        const customer = customers.find(c => c.id === enterprisePopover.customerId);
        if (!customer) return null;
        const allEnterprises = customer.enterprises || [];
        const popLeft = Math.min(enterprisePopover.left, window.innerWidth - 280);
        return (
          <ModalPortal>
            <div
              ref={enterprisePopoverRef}
              style={{ position: 'fixed', zIndex: 9999, top: enterprisePopover.top, left: popLeft, minWidth: 240, maxWidth: 320 }}
              className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            >
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">全部关联企业 ID</span>
                <span className="text-xs text-gray-400">共 {allEnterprises.length} 个</span>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {allEnterprises.map(ent => (
                  <span key={ent.id} className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-mono px-2 py-1 rounded-lg whitespace-nowrap">{ent.id}</span>
                ))}
              </div>
            </div>
          </ModalPortal>
        );
      })()}

      {/* ── 筛选抽屉 ────────────────────────────────────── */}
      {isFilterOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[500]">
          <div
            className={`absolute inset-0 pointer-events-auto ${isFilterClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'} bg-black/40 backdrop-blur-sm`}
            onClick={closeFilterDrawer}
          />
          <div className={`absolute right-0 inset-y-0 w-full max-w-[480px] pointer-events-auto bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-gray-200/50 dark:border-white/10 ${isFilterClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">设置筛选条件</h3>
                <button onClick={closeFilterDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                    <X className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4 mb-8">
                    {draftFilters.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                            <p className="text-sm text-gray-400">暂无筛选条件，点击下方按钮添加</p>
                        </div>
                    )}
                    {draftFilters.map(filter => {
                        const fieldLabel = customerFilterFields.find(f => f.id === filter.fieldId)?.label || '选择字段';
                        const opts = getFieldOptions(filter.fieldId);
                        const isValueOpen = activeValueDropdown?.filterId === filter.id;
                        return (
                        <div key={filter.id} className="flex items-start gap-2">
                            {/* 字段选择 */}
                            <div className="w-[120px] shrink-0">
                                <select
                                    value={filter.fieldId}
                                    onChange={e => updateFieldId(filter.id, e.target.value)}
                                    className="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none appearance-none"
                                >
                                    {customerFilterFields.map(f => (
                                        <option key={f.id} value={f.id} disabled={draftFilters.some(d => d.id !== filter.id && d.fieldId === f.id)}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* 模式 */}
                            <div className="w-[64px] shrink-0">
                                <div className="px-2 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-400 text-center select-none">{filter.mode}</div>
                            </div>
                            {/* 值选择 */}
                            <div className="flex-1 min-w-0">
                                <button
                                    onMouseDown={(e) => { e.stopPropagation(); toggleValueDropdown(e, filter.id); }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isValueOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                >
                                    <span className={`truncate ${filter.value.length === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {filter.value.length === 0 ? '点击选择…' : filter.value.join('、')}
                                    </span>
                                    <span className="flex items-center gap-1 shrink-0 ml-2">
                                        {filter.mode === '多选' && filter.value.length > 0 && (
                                            <span className="unified-button-primary text-[10px] bg-[#0071E3] w-5 h-5">{filter.value.length}</span>
                                        )}
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isValueOpen ? 'rotate-180' : ''}`} />
                                    </span>
                                </button>
                            </div>
                            {/* 删除 */}
                            <button onClick={() => removeFilterCondition(filter.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        );
                    })}
                </div>
                <button
                    onClick={addFilterCondition}
                    disabled={draftFilters.length >= customerFilterFields.length}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    添加筛选条件
                </button>
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
                <button onClick={() => { setDraftFilters([]); }} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all">重置</button>
                <div className="flex items-center gap-2">
                    <button onClick={closeFilterDrawer} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">取消</button>
                    <button onClick={applyFilters} className="unified-button-primary bg-[#0071E3] shadow-blue-500/25">查询</button>
                </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── 值下拉弹层（通过 Portal 渲染，避免被 Layout 堆叠上下文遮挡） ── */}
      {activeValueDropdown && (() => {
          const f = draftFilters.find(x => x.id === activeValueDropdown.filterId);
          if (!f) return null;
          const opts = getFieldOptions(f.fieldId);
          return (
              <ModalPortal>
              <div
                  ref={dropdownRef}
                  style={{ position: 'fixed', zIndex: 9999, top: activeValueDropdown.top, left: activeValueDropdown.left, width: activeValueDropdown.width }}
                  className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  onMouseDown={e => e.stopPropagation()}
              >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">{f.mode === '单选' ? '选择一个值' : '选择筛选值'}</span>
                      {f.value.length > 0 && (
                          <button onMouseDown={(e) => { e.stopPropagation(); setDraftFilters(prev => prev.map(x => x.id === f.id ? { ...x, value: [] } : x)); }} className="text-xs text-gray-400 hover:text-red-500 transition">清除</button>
                      )}
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {opts.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-400 text-center">暂无可选值</div>
                      )}
                      {opts.map(opt => {
                          const checked = f.value.includes(opt);
                          return (
                              <button key={opt} onMouseDown={(e) => { e.stopPropagation(); toggleValue(f.id, opt); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${checked ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                  {f.mode === '单选' ? (
                                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${checked ? 'border-[#0071E3]' : 'border-gray-300 dark:border-gray-500'}`}>
                                          {checked && <span className="w-2 h-2 rounded-full bg-[#0071E3]" />}
                                      </span>
                                  ) : (
                                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? 'bg-[#0071E3] border-[#0071E3]' : 'border-gray-300 dark:border-gray-500'}`}>
                                          {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                      </span>
                                  )}
                                  {opt}
                              </button>
                          );
                      })}
                  </div>
              </div>
              </ModalPortal>
          );
      })()}

    </div>
  );
};

export default CustomerManager;
