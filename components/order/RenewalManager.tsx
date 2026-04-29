
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ChevronDown, ChevronRight, Filter, RefreshCcw, Download,
  Layers, CheckCircle, Clock, AlertTriangle, XCircle, Timer,
} from 'lucide-react';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import type { Subscription, SubscriptionLineProductSnapshot, SubscriptionStatus, PurchaseNature } from '../../types';
import StatusFilterCard from './StatusFilterCard';
import Pagination from '../common/Pagination';
import { SubscriptionOrderChain } from '../common/SubscriptionOrderChain';
import {
  subscriptionRollupEndDate,
  subscriptionRollupStartDate,
  subscriptionRollupStatus,
  subscriptionTotalOrderCount,
} from '../../utils/subscriptionRollup';
import {
  subscriptionDistinctProducts,
  subscriptionProductSnapshot,
  subscriptionMostUrgentProductSnapshot,
} from '../../utils/subscriptionLineProduct';

// ─── 常量 ───────────────────────────────────────────────────

type StatusFilter = 'All' | 'Active' | 'Expire7' | 'Expire15' | 'Expire30' | 'GracePeriod' | 'Expired';

type CustomerSegmentTab = '活跃客户' | '待跟进客户' | '已到期客户';

const CUSTOMER_SEGMENT_TABS: { id: CustomerSegmentTab; label: string }[] = [
  { id: '活跃客户', label: '活跃客户' },
  { id: '待跟进客户', label: '待跟进客户' },
  { id: '已到期客户', label: '已到期客户' },
];

const PRODUCT_LINE_TAB_ALL = '全部产品线' as const;
const PRODUCT_LINE_FIXED = ['WPS365公有云', 'WPS365私有云', '端'] as const;
type ProductLineFilter = typeof PRODUCT_LINE_TAB_ALL | (typeof PRODUCT_LINE_FIXED)[number];

const searchFieldOptions = [
  { value: 'id' as const, label: '订阅编号', placeholder: '请输入订阅编号' },
  { value: 'customerName' as const, label: '客户名称', placeholder: '请输入客户名称' },
  { value: 'productName' as const, label: '产品名称', placeholder: '请输入产品名称' },
];

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; cls: string }> = {
  Active: { label: '活跃', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ExpiringSoon: { label: '即将到期', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  GracePeriod: { label: '宽限期', cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  Expired: { label: '已过期', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const NATURE_LABEL: Record<PurchaseNature, { text: string; cls: string }> = {
  New: { text: '新购', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  Renewal: { text: '续费', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  AddOn: { text: '增购', cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  Upgrade: { text: '升级', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const colWidthMap: Record<string, number> = {
  expand: 40, checkbox: 40, id: 140, customer: 210, product: 250,
  licenseType: 120, quantity: 80, orderCount: 90, period: 200,
  status: 100, countdown: 100, actions: 220,
};

// ─── 工具函数 ───────────────────────────────────────────────

function daysUntil(endDate: string): number {
  const end = new Date(endDate + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function matchStatusFilter(sub: Subscription, filter: StatusFilter): boolean {
  if (filter === 'All') return true;
  const st = subscriptionRollupStatus(sub);
  const days = daysUntil(subscriptionRollupEndDate(sub));
  switch (filter) {
    case 'Active': return st === 'Active';
    case 'Expire7': return st === 'ExpiringSoon' && days >= 0 && days <= 7;
    case 'Expire15': return st === 'ExpiringSoon' && days >= 0 && days <= 15;
    case 'Expire30': return st === 'ExpiringSoon' && days >= 0 && days <= 30;
    case 'GracePeriod': return st === 'GracePeriod';
    case 'Expired': return st === 'Expired';
    default: return true;
  }
}

function matchCustomerSegment(sub: Subscription, seg: CustomerSegmentTab): boolean {
  const st = subscriptionRollupStatus(sub);
  if (seg === '活跃客户') return st === 'Active';
  if (seg === '待跟进客户') return st === 'ExpiringSoon' || st === 'GracePeriod';
  return st === 'Expired';
}

function licenseTypesSummary(sub: Subscription): string {
  const u = [...new Set(sub.relatedOrders.map(r => r.licenseType).filter(Boolean))];
  if (u.length === 0) return '—';
  if (u.length <= 2) return u.join('、');
  return `${u.slice(0, 2).join('、')} 等`;
}

function quantitySum(sub: Subscription): number {
  return subscriptionDistinctProducts(sub).reduce((n, { productId }) => {
    const s = subscriptionProductSnapshot(sub, productId);
    return n + (s?.currentQuantity ?? 0);
  }, 0);
}

function distinctProductCount(sub: Subscription): number {
  return subscriptionDistinctProducts(sub).length;
}

// ─── 组件 ───────────────────────────────────────────────────

const RenewalManager: React.FC = () => {
  const { subscriptions } = useAppContext();
  useEnsureData(['orders']);
  const navigate = useNavigate();

  const [searchField, setSearchField] = useState<'id' | 'customerName' | 'productName'>('id');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);

  const [productLineTab, setProductLineTab] = useState<ProductLineFilter>(PRODUCT_LINE_TAB_ALL);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [segmentTab, setSegmentTab] = useState<CustomerSegmentTab>('活跃客户');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState('全部');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [hideExpired, setHideExpired] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const allRegions = useMemo(() => {
    const set = new Set(subscriptions.map(s => s.region).filter(Boolean) as string[]);
    return ['全部', ...Array.from(set).sort()];
  }, [subscriptions]);

  const productLineCounts = useMemo(() => {
    const byLine = (line: string) => subscriptions.filter(s => s.productLine === line).length;
    return {
      [PRODUCT_LINE_TAB_ALL]: subscriptions.length,
      'WPS365公有云': byLine('WPS365公有云'),
      'WPS365私有云': byLine('WPS365私有云'),
      端: byLine('端'),
    } as Record<ProductLineFilter, number>;
  }, [subscriptions]);

  // 按产品线预过滤
  const lineFiltered = useMemo(() => {
    if (productLineTab === PRODUCT_LINE_TAB_ALL) return subscriptions;
    return subscriptions.filter(s => s.productLine === productLineTab);
  }, [subscriptions, productLineTab]);

  /** 当前产品线 + 客户分段（活跃 / 待跟进 / 已到期） */
  const segmentBase = useMemo(
    () => lineFiltered.filter(s => matchCustomerSegment(s, segmentTab)),
    [lineFiltered, segmentTab],
  );

  // --- 统计（产品线 + 客户分段下，用于状态卡片） ---
  const stats = useMemo(() => {
    const all = segmentBase;
    const active = all.filter(s => subscriptionRollupStatus(s) === 'Active').length;
    const expire7 = all.filter(s => {
      const d = daysUntil(subscriptionRollupEndDate(s));
      return subscriptionRollupStatus(s) === 'ExpiringSoon' && d >= 0 && d <= 7;
    }).length;
    const expire15 = all.filter(s => {
      const d = daysUntil(subscriptionRollupEndDate(s));
      return subscriptionRollupStatus(s) === 'ExpiringSoon' && d >= 0 && d <= 15;
    }).length;
    const expire30 = all.filter(s => {
      const d = daysUntil(subscriptionRollupEndDate(s));
      return subscriptionRollupStatus(s) === 'ExpiringSoon' && d >= 0 && d <= 30;
    }).length;
    const grace = all.filter(s => subscriptionRollupStatus(s) === 'GracePeriod').length;
    const expired = all.filter(s => subscriptionRollupStatus(s) === 'Expired').length;
    return { all: all.length, active, expire7, expire15, expire30, grace, expired };
  }, [segmentBase]);

  const segmentCounts = useMemo(
    () => ({
      活跃客户: lineFiltered.filter(s => subscriptionRollupStatus(s) === 'Active').length,
      待跟进客户: lineFiltered.filter(s => {
        const st = subscriptionRollupStatus(s);
        return st === 'ExpiringSoon' || st === 'GracePeriod';
      }).length,
      已到期客户: lineFiltered.filter(s => subscriptionRollupStatus(s) === 'Expired').length,
    }),
    [lineFiltered],
  );

  // --- 数据过滤 ---
  const filtered = useMemo(() => {
    let result = [...segmentBase];
    if (hideExpired) result = result.filter(s => subscriptionRollupStatus(s) !== 'Expired');
    if (statusFilter !== 'All') result = result.filter(s => matchStatusFilter(s, statusFilter));
    if (regionFilter !== '全部') result = result.filter(s => s.region === regionFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s => {
        if (searchField === 'id') return s.id.toLowerCase().includes(q);
        if (searchField === 'customerName') return s.customerName.toLowerCase().includes(q);
        if (searchField === 'productName') {
          return s.relatedOrders.some(
            r => r.productName.toLowerCase().includes(q) || r.productId.toLowerCase().includes(q),
          );
        }
        return true;
      });
    }
    return result;
  }, [segmentBase, statusFilter, regionFilter, hideExpired, searchTerm, searchField]);

  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- 展开/折叠 ---
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // --- 全选 ---
  const isAllSelected = paged.length > 0 && paged.every(s => selectedIds.has(s.id));
  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllSelected) { paged.forEach(s => next.delete(s.id)); }
      else { paged.forEach(s => next.add(s.id)); }
      return next;
    });
  }, [paged, isAllSelected]);
  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /** 从订阅发起新建订单（续费 / 增购），由订单创建向导预填并锁定字段 */
  const goCreateFromSubscription = useCallback((sub: Subscription, lineProduct: SubscriptionLineProductSnapshot, mode: 'renew' | 'addon') => {
    navigate('/orders', { state: { initFromSubscription: true, subscription: sub, lineProduct, mode } });
  }, [navigate]);

  const handleBatchRenew = useCallback(() => {
    const selectedSubs = subscriptions.filter(s => selectedIds.has(s.id));
    if (selectedSubs.length === 0) return;
    const urgentSub = selectedSubs.reduce((a, b) =>
      (subscriptionRollupEndDate(a) < subscriptionRollupEndDate(b) ? a : b));
    const snap = subscriptionMostUrgentProductSnapshot(urgentSub);
    if (snap) goCreateFromSubscription(urgentSub, snap, 'renew');
  }, [subscriptions, selectedIds, goCreateFromSubscription]);

  // --- 倒计时 ---
  const renderCountdown = (endDate: string) => {
    const days = daysUntil(endDate);
    if (days < 0) return <span className="text-red-600 dark:text-red-400 font-bold text-xs">已过期 {Math.abs(days)} 天</span>;
    if (days <= 7) return <span className="text-red-600 dark:text-red-400 font-bold text-xs">{days} 天后到期</span>;
    if (days <= 30) return <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">{days} 天后到期</span>;
    return <span className="text-gray-500 dark:text-gray-400 text-xs">{days} 天</span>;
  };

  // --- 列定义 ---
  const allColumns = [
    { id: 'expand', label: '' },
    { id: 'checkbox', label: '' },
    { id: 'id', label: '订阅编号' },
    { id: 'customer', label: '客户名称' },
    { id: 'product', label: '产品线' },
    { id: 'licenseType', label: '授权类型' },
    { id: 'quantity', label: '数量合计' },
    { id: 'orderCount', label: '订阅历史订单' },
    { id: 'period', label: '开通/到期时间' },
    { id: 'status', label: '订阅状态' },
    { id: 'countdown', label: '倒计时' },
    { id: 'actions', label: '操作' },
  ];

  const tableColGroup = (
    <colgroup>
      {allColumns.map(col => (
        <col key={col.id} style={{ width: colWidthMap[col.id] || 160 }} />
      ))}
    </colgroup>
  );

  const activeFilters = (regionFilter !== '全部' ? 1 : 0) + (hideExpired ? 1 : 0);

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      {/* ── 页头 ── */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">续费管理</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">管理所有客户的订阅与续费</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* 搜索栏 */}
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

          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className={`flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm font-semibold transition shadow-apple ${
              isFilterOpen || activeFilters > 0
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-[#0071E3] dark:text-[#0A84FF]'
                : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            筛选
            {activeFilters > 0 && (
              <span className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#0071E3] text-white text-[10px] font-bold">{activeFilters}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── 筛选面板 ── */}
      {isFilterOpen && (
        <div className="unified-card dark:bg-[#1C1C1E] p-4 animate-fade-in">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">区域</span>
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
                      {allRegions.map(r => (
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

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideExpired}
                onChange={e => { setHideExpired(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3] dark:border-white/20 dark:bg-[#2C2C2E]"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">隐藏已过期资源</span>
            </label>

            <button
              onClick={() => { setRegionFilter('全部'); setHideExpired(false); setCurrentPage(1); }}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
            >
              重置
            </button>
          </div>
        </div>
      )}

      {/* ── 产品线 Tab（固定选项） ── */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => { setProductLineTab(PRODUCT_LINE_TAB_ALL); setStatusFilter('All'); setCurrentPage(1); setSelectedIds(new Set()); setExpandedIds(new Set()); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap border ${
            productLineTab === PRODUCT_LINE_TAB_ALL
              ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-lg shadow-blue-500/20'
              : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#0071E3]/40 dark:hover:border-blue-900'
          }`}
        >
          {PRODUCT_LINE_TAB_ALL}
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            productLineTab === PRODUCT_LINE_TAB_ALL
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
          }`}>{productLineCounts[PRODUCT_LINE_TAB_ALL]}</span>
        </button>
        {PRODUCT_LINE_FIXED.map(lineName => (
          <button
            key={lineName}
            onClick={() => { setProductLineTab(lineName); setStatusFilter('All'); setCurrentPage(1); setSelectedIds(new Set()); setExpandedIds(new Set()); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap border ${
              productLineTab === lineName
                ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#0071E3]/40 dark:hover:border-blue-900'
            }`}
          >
            {lineName}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              productLineTab === lineName
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
            }`}>{productLineCounts[lineName]}</span>
          </button>
        ))}
      </div>

      {/* ── 统计卡片 ── */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar no-scrollbar scroll-smooth snap-x snap-mandatory">
        <StatusFilterCard id="All" label="全部" icon={Layers} count={stats.all} isActive={statusFilter === 'All'} onClick={() => { setStatusFilter('All'); setCurrentPage(1); }} />
        <StatusFilterCard id="Active" label="活跃" icon={CheckCircle} count={stats.active} isActive={statusFilter === 'Active'} onClick={() => { setStatusFilter('Active'); setCurrentPage(1); }} />
        <StatusFilterCard id="Expire7" label="7天内到期" icon={Timer} count={stats.expire7} isActive={statusFilter === 'Expire7'} variant="danger" onClick={() => { setStatusFilter('Expire7'); setCurrentPage(1); }} />
        <StatusFilterCard id="Expire15" label="15天内到期" icon={Clock} count={stats.expire15} isActive={statusFilter === 'Expire15'} variant="danger" onClick={() => { setStatusFilter('Expire15'); setCurrentPage(1); }} />
        <StatusFilterCard id="Expire30" label="30天内到期" icon={AlertTriangle} count={stats.expire30} isActive={statusFilter === 'Expire30'} onClick={() => { setStatusFilter('Expire30'); setCurrentPage(1); }} />
        <StatusFilterCard id="GracePeriod" label="宽限期" icon={Clock} count={stats.grace} isActive={statusFilter === 'GracePeriod'} variant="muted" onClick={() => { setStatusFilter('GracePeriod'); setCurrentPage(1); }} />
        <StatusFilterCard id="Expired" label="已过期" icon={XCircle} count={stats.expired} isActive={statusFilter === 'Expired'} variant="muted" onClick={() => { setStatusFilter('Expired'); setCurrentPage(1); }} />
      </div>

      {/* ── 客户分段 Tab（活跃 / 待跟进 / 已到期） + 批量操作 ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 flex-wrap">
          {CUSTOMER_SEGMENT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setSegmentTab(tab.id); setStatusFilter('All'); setCurrentPage(1); setSelectedIds(new Set()); setExpandedIds(new Set()); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                segmentTab === tab.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] shadow-apple'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                segmentTab === tab.id
                  ? 'bg-blue-100 text-[#0071E3] dark:bg-blue-900/40 dark:text-blue-400'
                  : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400'
              }`}>
                {segmentCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchRenew}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0071E3] text-white text-sm font-semibold hover:bg-[#0062CC] transition shadow-apple shadow-blue-500/20"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              批量续费 ({selectedIds.size})
            </button>
          )}
          <button className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition shadow-apple">
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="unified-card overflow-hidden">
        {/* 固定表头 */}
        <div
          ref={headerScrollRef}
          className="overflow-x-auto no-scrollbar"
          onScroll={e => { if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: 1620 }}>
            {tableColGroup}
            <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
              <tr>
                <th className="px-2 py-3 border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]" />
                <th className="px-2 py-3 border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3] dark:border-white/20 dark:bg-[#2C2C2E]"
                  />
                </th>
                {allColumns.slice(2).map(col => (
                  <th key={col.id} className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">{col.label}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* 可滚动 body */}
        <div
          ref={bodyScrollRef}
          className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] custom-scrollbar"
          onScroll={e => { if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
        >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: 1620 }}>
            {tableColGroup}
            <tbody className="text-sm">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="text-center py-20 text-gray-400 dark:text-gray-600">
                    <RefreshCcw className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">暂无订阅记录</p>
                  </td>
                </tr>
              ) : paged.map(sub => {
                const rollupSt = subscriptionRollupStatus(sub);
                const badge = STATUS_BADGE[rollupSt];
                const isExpanded = expandedIds.has(sub.id);
                const rollupEnd = subscriptionRollupEndDate(sub);
                const rollupStart = subscriptionRollupStartDate(sub);
                return (
                  <React.Fragment key={sub.id}>
                    {/* 主行：一批订阅（客户 + 产品线） */}
                    <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5">
                      <td className="px-2 py-4 text-center">
                        <button onClick={() => toggleExpand(sub.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          }
                        </button>
                      </td>
                      <td className="px-2 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sub.id)}
                          onChange={() => toggleOne(sub.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3] dark:border-white/20 dark:bg-[#2C2C2E]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#0A84FF]">{sub.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">{sub.customerName}</div>
                        <div className="text-xs text-[#0071E3] dark:text-[#0A84FF] font-mono mt-0.5">{sub.customerId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">{sub.productLine}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {distinctProductCount(sub)} 个产品 · 同线续费/增购
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 leading-snug">{licenseTypesSummary(sub)}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white font-semibold">{quantitySum(sub)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleExpand(sub.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                        >
                          {subscriptionTotalOrderCount(sub)} 笔订单
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex gap-1.5">
                            <span className="text-gray-400 dark:text-gray-500 shrink-0">开通:</span>
                            <span className="text-gray-700 dark:text-gray-300">{rollupStart}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-gray-400 dark:text-gray-500 shrink-0">到期:</span>
                            <span className="text-gray-700 dark:text-gray-300">{rollupEnd}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">{renderCountdown(rollupEnd)}</td>
                      <td className="px-4 py-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        展开后按产品续费 / 增购
                      </td>
                    </tr>

                    {/* 展开：产品线订阅序列 + 按产品操作 */}
                    {isExpanded && (
                      <tr className="bg-blue-50/40 dark:bg-blue-900/10">
                        <td colSpan={allColumns.length} className="px-4 py-3">
                          <div className="ml-2 space-y-3">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              「{sub.productLine}」下多产品的新购、续费、增购按时间排列（节点标注产品）
                            </div>
                            <SubscriptionOrderChain relatedOrders={sub.relatedOrders} onOrderClick={id => navigate(`/orders/${id}`)} />
                            <div className="flex flex-wrap gap-2">
                              {subscriptionDistinctProducts(sub).map(({ productId }) => {
                                const snap = subscriptionProductSnapshot(sub, productId);
                                if (!snap) return null;
                                return (
                                  <div
                                    key={productId}
                                    className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-gray-200/80 bg-white/80 px-2.5 py-1.5 dark:border-white/10 dark:bg-[#1C1C1E]/90"
                                  >
                                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[10rem] truncate" title={snap.productName}>
                                      {snap.productName}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400">{snap.productCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => goCreateFromSubscription(sub, snap, 'renew')}
                                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0071E3] text-white hover:bg-[#0062CC]"
                                    >
                                      续费
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => goCreateFromSubscription(sub, snap, 'addon')}
                                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-700"
                                    >
                                      增购
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <table className="w-full text-left min-w-[640px]">
                                <thead>
                                  <tr className="bg-gray-50/80 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400">
                                    <th className="px-3 py-2.5 font-semibold min-w-[100px]">产品</th>
                                    <th className="px-4 py-2.5 font-semibold">订单编号</th>
                                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">授权起</th>
                                    <th className="px-4 py-2.5 font-semibold whitespace-nowrap">授权止</th>
                                    <th className="px-4 py-2.5 font-semibold w-[72px]">性质</th>
                                    <th className="px-4 py-2.5 font-semibold w-[72px] text-right">数量</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">金额</th>
                                    <th className="px-4 py-2.5 font-semibold w-[56px]"> </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                  {sub.relatedOrders.map((ref, idx) => {
                                    const natureInfo = NATURE_LABEL[ref.purchaseNature];
                                    const isAddOn = ref.purchaseNature === 'AddOn';
                                    return (
                                      <tr key={`${ref.orderId}-${ref.productId}-${idx}`} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${isAddOn ? 'bg-violet-50/40 dark:bg-violet-950/15' : ''}`}>
                                        <td className="px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200 max-w-[140px] truncate" title={ref.productName}>{ref.productName}</td>
                                        <td className={`px-4 py-2.5 font-mono text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] ${isAddOn ? 'border-l-2 border-violet-400 pl-3' : ''}`}>
                                          {ref.orderId}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs tabular-nums text-gray-700 dark:text-gray-300">{ref.licenseStartDate ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-xs tabular-nums text-gray-700 dark:text-gray-300">{ref.licenseEndDate ?? '—'}</td>
                                        <td className="px-4 py-2.5">
                                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${natureInfo.cls}`}>
                                            {natureInfo.text}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-900 dark:text-white font-semibold text-right">{ref.quantity}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-900 dark:text-white font-semibold text-right">¥{ref.amount.toLocaleString()}</td>
                                        <td className="px-4 py-2.5">
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/orders/${ref.orderId}`)}
                                            className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline font-medium"
                                          >
                                            查看
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <Pagination
          page={currentPage}
          size={pageSize}
          total={filtered.length}
          onPageChange={setCurrentPage}
          onSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          totalLabel="条订阅"
          selectedCount={selectedIds.size}
        />
      </div>
    </div>
  );
};

export default RenewalManager;
