import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, Settings } from 'lucide-react';
import { mockCustomers, type CustomerRow } from './sabData';
import Pagination from '../common/Pagination';

type QuickToolbar = 'deal' | 'auth' | 'renew' | null;

type ColumnKey =
  | 'name'
  | 'level'
  | 'industry'
  | 'group'
  | 'province'
  | 'top100'
  | 'dealStatus'
  | 'authStatus'
  | 'orderAmount'
  | 'opptyAmount'
  | 'mau'
  | 'owner'
  | 'followDate'
  | 'products';

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name: '客户名称',
  level: '客户分层',
  industry: '行业推广类',
  group: '所属集团',
  province: '省份',
  top100: '是否百强',
  dealStatus: '成交状态',
  authStatus: '授权覆盖状态',
  orderAmount: '累计订单金额',
  opptyAmount: '进行中商机金额',
  mau: '上月活跃',
  owner: '客户所有人',
  followDate: '最近一次跟进时间',
  products: '已采购产品条线',
};

const PROVINCES = [
  '北京市',
  '上海市',
  '广东省',
  '浙江省',
  '江苏省',
  '山东省',
  '湖南省',
  '福建省',
  '四川省',
  '重庆市',
];

const PRESET_FILTERS: Record<string, (c: CustomerRow) => boolean> = {
  group: (c) => c.group !== '-',
  deal: (c) => c.dealStatus.includes('成交') && !c.dealStatus.includes('未成交'),
  auth: (c) => c.authStatus === '已覆盖',
  top100: (c) => c.top100 !== '--',
  listed: (c) => c.tags.some((t) => t.label === '上市公司'),
  renew: (c) => c.followDate >= '2026-03-01',
  oppty: (c) => {
    const n = parseFloat(c.opptyAmount.replace(/,/g, '').replace(/万/g, '').trim());
    return Number.isFinite(n) && n >= 800;
  },
  all: () => true,
};

function parseWan(s: string): number {
  const n = parseFloat(s.replace(/,/g, '').replace(/万/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export const SABCustomerList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const preset = searchParams.get('preset') || '';

  const [quickToolbar, setQuickToolbar] = useState<QuickToolbar>(null);
  const [groupOnly, setGroupOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>(() => {
    const all: Record<ColumnKey, boolean> = {} as Record<ColumnKey, boolean>;
    (Object.keys(COLUMN_LABELS) as ColumnKey[]).forEach((k) => {
      all[k] = true;
    });
    return all;
  });

  const [adv, setAdv] = useState({
    customerType: '',
    level: '',
    reportTag: '',
    customerTag: '',
    groupInput: '',
    province: '',
    dealStatus: '',
    authStatus: '',
    renewOnly: false,
    orderMin: '',
    orderMax: '',
    opptyMin: '',
    opptyMax: '',
    mauActive: '',
  });

  const [appliedAdv, setAppliedAdv] = useState(adv);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!columnMenuRef.current?.contains(e.target as Node)) setColumnMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    let list = [...mockCustomers];

    if (preset && PRESET_FILTERS[preset]) {
      list = list.filter(PRESET_FILTERS[preset]);
    } else {
      if (quickToolbar === 'deal') {
        list = list.filter((c) => c.dealStatus.includes('成交') && !c.dealStatus.includes('未成交'));
      } else if (quickToolbar === 'auth') {
        list = list.filter((c) => c.authStatus === '已覆盖');
      } else if (quickToolbar === 'renew') {
        list = list.filter((c) => c.followDate >= '2026-03-01');
      }
    }

    if (groupOnly) {
      list = list.filter((c) => c.group !== '-');
    }

    const a = appliedAdv;
    if (a.groupInput.trim()) {
      const g = a.groupInput.trim().toLowerCase();
      list = list.filter((c) => c.group.toLowerCase().includes(g));
    }
    if (a.province) {
      list = list.filter((c) => c.province === a.province);
    }
    if (a.dealStatus) {
      list = list.filter((c) => c.dealStatus === a.dealStatus);
    }
    if (a.authStatus) {
      list = list.filter((c) => c.authStatus === a.authStatus);
    }
    if (a.renewOnly) {
      list = list.filter((c) => c.followDate >= '2026-03-01');
    }
    if (a.level) {
      list = list.filter((c) => c.level.includes(a.level));
    }
    if (a.customerType) {
      list = list.filter((c) => c.level.includes(a.customerType) || c.industry.includes(a.customerType));
    }
    if (a.orderMin) {
      const min = parseWan(a.orderMin);
      list = list.filter((c) => parseWan(c.orderAmount) >= min);
    }
    if (a.orderMax) {
      const max = parseWan(a.orderMax);
      list = list.filter((c) => parseWan(c.orderAmount) <= max);
    }
    if (a.opptyMin) {
      const min = parseWan(a.opptyMin);
      list = list.filter((c) => parseWan(c.opptyAmount) >= min);
    }
    if (a.opptyMax) {
      const max = parseWan(a.opptyMax);
      list = list.filter((c) => parseWan(c.opptyAmount) <= max);
    }
    if (a.mauActive === 'yes') {
      list = list.filter((c) => parseFloat(c.mau.replace(/,/g, '')) >= 10000);
    }
    if (a.mauActive === 'no') {
      list = list.filter((c) => parseFloat(c.mau.replace(/,/g, '')) < 10000);
    }
    if (a.reportTag.trim()) {
      const t = a.reportTag.trim();
      list = list.filter(
        (c) => c.tags.some((x) => x.label.includes(t)) || c.level.includes(t) || c.industry.includes(t)
      );
    }
    if (a.customerTag.trim()) {
      const t = a.customerTag.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(t) ||
          c.shortName.toLowerCase().includes(t) ||
          c.tags.some((x) => x.label.toLowerCase().includes(t))
      );
    }

    return list;
  }, [preset, quickToolbar, groupOnly, appliedAdv]);

  const toggleQuickToolbar = useCallback(
    (next: QuickToolbar) => {
      setQuickToolbar((prev) => {
        if (prev === next) return null;
        if (prev === null && preset === next) return null;
        return next;
      });
      setSearchParams({});
    },
    [preset, setSearchParams]
  );

  const pageSize = 20;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [filtered.length, quickToolbar, groupOnly, preset]);

  const quickToolbarVisual = useMemo((): QuickToolbar => {
    if (quickToolbar) return quickToolbar;
    if (preset === 'deal' || preset === 'auth' || preset === 'renew') return preset;
    return null;
  }, [quickToolbar, preset]);

  const pageClamped = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pageSlice = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageClamped]);

  const toggleCol = useCallback((k: ColumnKey) => {
    setVisibleCols((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const applyAdvanced = useCallback(() => {
    setAppliedAdv({ ...adv });
    setDrawerOpen(false);
  }, [adv]);

  const resetAdvanced = useCallback(() => {
    const empty = {
      customerType: '',
      level: '',
      reportTag: '',
      customerTag: '',
      groupInput: '',
      province: '',
      dealStatus: '',
      authStatus: '',
      renewOnly: false,
      orderMin: '',
      orderMax: '',
      opptyMin: '',
      opptyMax: '',
      mauActive: '',
    };
    setAdv(empty);
    setAppliedAdv(empty);
  }, []);

  const renderCell = (c: CustomerRow, key: ColumnKey): React.ReactNode => {
    switch (key) {
      case 'name':
        return (
          <Link
            to={`/sab-insight/customer/${c.id}`}
            className="font-semibold text-[#0071E3] dark:text-[#0A84FF] hover:underline"
          >
            {c.name}
          </Link>
        );
      case 'level':
        return <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${c.levelColor}`}>{c.level}</span>;
      case 'industry':
        return c.industry;
      case 'group':
        return c.group;
      case 'province':
        return c.province;
      case 'top100':
        return c.top100;
      case 'dealStatus':
        return <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${c.dealColor}`}>{c.dealStatus}</span>;
      case 'authStatus':
        return <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${c.authColor}`}>{c.authStatus}</span>;
      case 'orderAmount':
        return c.orderAmount;
      case 'opptyAmount':
        return c.opptyAmount;
      case 'mau':
        return c.mau;
      case 'owner':
        return c.owner;
      case 'followDate':
        return c.followDate;
      case 'products':
        return <span className="text-xs leading-snug line-clamp-2">{c.products}</span>;
      default:
        return null;
    }
  };

  const visibleKeys = (Object.keys(COLUMN_LABELS) as ColumnKey[]).filter((k) => visibleCols[k]);

  return (
    <>
      <style>{`
        @keyframes sab-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes sab-slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .sab-drawer-panel {
          animation: sab-slideInRight 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .sab-drawer-backdrop {
          animation: sab-fadeIn 0.28s ease-out forwards;
        }
        .sab-col-menu {
          animation: sab-fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="min-h-full bg-[#F5F5F7] dark:bg-black pb-10">
        <div className="mx-auto max-w-[2400px] px-4 sm:px-6 pt-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">客户列表</h1>
            <p className="text-sm text-[#86868B] mt-1">管理与筛选 SAB 企业客户，支持列配置与高级筛选。</p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#86868B] mr-1">快捷</span>
              <button
                type="button"
                onClick={() => toggleQuickToolbar('deal')}
                className={`h-9 px-3 rounded-xl text-sm font-medium border transition shadow-sm ${
                  quickToolbarVisual === 'deal'
                    ? 'bg-[#0071E3]/10 border-[#0071E3]/40 text-[#0071E3] dark:bg-[#0A84FF]/15 dark:border-[#0A84FF]/40 dark:text-[#0A84FF]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/10 text-[#1D1D1F] dark:text-white/90'
                }`}
              >
                成交客户
              </button>
              <button
                type="button"
                onClick={() => toggleQuickToolbar('auth')}
                className={`h-9 px-3 rounded-xl text-sm font-medium border transition shadow-sm ${
                  quickToolbarVisual === 'auth'
                    ? 'bg-[#0071E3]/10 border-[#0071E3]/40 text-[#0071E3] dark:bg-[#0A84FF]/15 dark:border-[#0A84FF]/40 dark:text-[#0A84FF]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/10 text-[#1D1D1F] dark:text-white/90'
                }`}
              >
                授权覆盖客户
              </button>
              <button
                type="button"
                onClick={() => toggleQuickToolbar('renew')}
                className={`h-9 px-3 rounded-xl text-sm font-medium border transition shadow-sm ${
                  quickToolbarVisual === 'renew'
                    ? 'bg-[#0071E3]/10 border-[#0071E3]/40 text-[#0071E3] dark:bg-[#0A84FF]/15 dark:border-[#0A84FF]/40 dark:text-[#0A84FF]'
                    : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/10 text-[#1D1D1F] dark:text-white/90'
                }`}
              >
                本年应续约客户
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <label className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-[#1D1D1F] dark:text-white/90 cursor-pointer select-none shadow-sm">
                <input
                  type="checkbox"
                  checked={groupOnly}
                  onChange={(e) => setGroupOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]/40"
                />
                仅集团客户
              </label>

              <div className="relative" ref={columnMenuRef}>
                <button
                  type="button"
                  onClick={() => setColumnMenuOpen((o) => !o)}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-xl border transition shadow-sm ${
                    columnMenuOpen
                      ? 'border-[#0071E3]/40 bg-[#0071E3]/10 text-[#0071E3] dark:border-[#0A84FF]/40 dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
                      : 'border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-[#86868B]'
                  }`}
                  aria-label="列配置"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {columnMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple py-2 z-30 sab-col-menu">
                    <div className="px-3 py-2 text-xs font-semibold text-[#86868B] uppercase tracking-wide">显示列</div>
                    <div className="max-h-64 overflow-y-auto">
                      {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((k) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1D1D1F] dark:text-white/90 hover:bg-black/[0.03] dark:hover:bg-white/[0.06] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleCols[k]}
                            onChange={() => toggleCol(k)}
                            className="rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]/40"
                          />
                          {COLUMN_LABELS[k]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm font-medium text-[#1D1D1F] dark:text-white/90 shadow-sm hover:border-[#0071E3]/35 dark:hover:border-[#0A84FF]/35"
              >
                <Filter className="w-4 h-4 text-[#0071E3] dark:text-[#0A84FF]" />
                高级筛选
                <ChevronDown className="w-3.5 h-3.5 text-[#86868B]" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.04] dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="overflow-auto flex-1">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <tr>
                    {visibleKeys.map((k) => (
                      <th key={k} className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">
                        {COLUMN_LABELS[k]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                  {pageSlice.map((c, idx) => (
                    <tr
                      key={c.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                      style={{ animation: `sab-fadeIn 0.25s ease-out ${idx * 0.03}s both` }}
                    >
                      {visibleKeys.map((k) => (
                        <td key={k} className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-200 align-middle">
                          {k === 'products' || k === 'name' ? (
                            <div className="max-w-[240px]">{renderCell(c, k)}</div>
                          ) : (
                            renderCell(c, k)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pageClamped}
              size={pageSize}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 dark:bg-black/60 backdrop-blur-sm sab-drawer-backdrop"
            aria-label="关闭筛选"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="relative h-full w-[380px] max-w-[100vw] bg-white dark:bg-[#1C1C1E] border-l border-black/[0.06] dark:border-white/10 shadow-[-8px_0_40px_-12px_rgba(0,0,0,0.15)] flex flex-col sab-drawer-panel"
          >
            <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1D1D1F] dark:text-white">高级筛选</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-sm text-[#86868B] hover:text-[#0071E3] dark:hover:text-[#0A84FF]"
              >
                关闭
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#86868B] mb-3">客户属性</h3>
                <div className="space-y-3">
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    客户类型
                    <select
                      value={adv.customerType}
                      onChange={(e) => setAdv((s) => ({ ...s, customerType: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30 dark:focus:ring-[#0A84FF]/30"
                    >
                      <option value="">全部</option>
                      <option value="战略">战略客户</option>
                      <option value="核心">核心客户</option>
                      <option value="标准">标准客户</option>
                    </select>
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    客户分层
                    <select
                      value={adv.level}
                      onChange={(e) => setAdv((s) => ({ ...s, level: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    >
                      <option value="">全部</option>
                      <option value="S0">S0</option>
                      <option value="S ">S 行业</option>
                      <option value="A ">A 行业</option>
                      <option value="B ">B 行业</option>
                    </select>
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    报备标签
                    <input
                      value={adv.reportTag}
                      onChange={(e) => setAdv((s) => ({ ...s, reportTag: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      placeholder="如 KA、GA"
                    />
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    客户标签
                    <input
                      value={adv.customerTag}
                      onChange={(e) => setAdv((s) => ({ ...s, customerTag: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      placeholder="关键词"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#86868B] mb-3">集团与区域</h3>
                <label className="block text-sm text-[#1D1D1F] dark:text-white/90 mb-3">
                  所属集团
                  <input
                    value={adv.groupInput}
                    onChange={(e) => setAdv((s) => ({ ...s, groupInput: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    placeholder="搜索集团名称"
                  />
                </label>
                <p className="text-xs text-[#86868B] mb-2">省份</p>
                <div className="grid grid-cols-3 gap-2">
                  {PROVINCES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAdv((s) => ({ ...s, province: s.province === p ? '' : p }))}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${
                        adv.province === p
                          ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3] dark:border-[#0A84FF] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
                          : 'border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 text-[#1D1D1F] dark:text-white/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#86868B] mb-3">成交与授权</h3>
                <div className="space-y-3">
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    成交状态
                    <select
                      value={adv.dealStatus}
                      onChange={(e) => setAdv((s) => ({ ...s, dealStatus: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    >
                      <option value="">全部</option>
                      <option value="成交客户">成交客户</option>
                      <option value="历史成交客户">历史成交客户</option>
                      <option value="未成交客户">未成交客户</option>
                    </select>
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    授权覆盖状态
                    <select
                      value={adv.authStatus}
                      onChange={(e) => setAdv((s) => ({ ...s, authStatus: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                    >
                      <option value="">全部</option>
                      <option value="已覆盖">已覆盖</option>
                      <option value="未覆盖">未覆盖</option>
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[#1D1D1F] dark:text-white/90 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={adv.renewOnly}
                      onChange={(e) => setAdv((s) => ({ ...s, renewOnly: e.target.checked }))}
                      className="rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]/40"
                    />
                    本年应续约客户
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#86868B] mb-3">经营指标</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    累计订单金额 ≥（万）
                    <input
                      value={adv.orderMin}
                      onChange={(e) => setAdv((s) => ({ ...s, orderMin: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    累计订单金额 ≤（万）
                    <input
                      value={adv.orderMax}
                      onChange={(e) => setAdv((s) => ({ ...s, orderMax: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    进行中商机金额 ≥（万）
                    <input
                      value={adv.opptyMin}
                      onChange={(e) => setAdv((s) => ({ ...s, opptyMin: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      inputMode="decimal"
                    />
                  </label>
                  <label className="block text-sm text-[#1D1D1F] dark:text-white/90">
                    进行中商机金额 ≤（万）
                    <input
                      value={adv.opptyMax}
                      onChange={(e) => setAdv((s) => ({ ...s, opptyMax: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                      inputMode="decimal"
                    />
                  </label>
                </div>
                <label className="block text-sm text-[#1D1D1F] dark:text-white/90 mt-3">
                  上月活跃
                  <select
                    value={adv.mauActive}
                    onChange={(e) => setAdv((s) => ({ ...s, mauActive: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/10 bg-[#F5F5F7] dark:bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                  >
                    <option value="">不限</option>
                    <option value="yes">高活跃（≥1万）</option>
                    <option value="no">低活跃</option>
                  </select>
                </label>
              </section>
            </div>
            <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/10 flex gap-2">
              <button
                type="button"
                onClick={resetAdvanced}
                className="flex-1 h-11 rounded-xl border border-black/[0.08] dark:border-white/10 text-sm font-semibold text-[#1D1D1F] dark:text-white/90"
              >
                重置
              </button>
              <button
                type="button"
                onClick={applyAdvanced}
                className="flex-1 h-11 rounded-xl bg-[#0071E3] dark:bg-[#0A84FF] text-white text-sm font-semibold shadow-sm hover:opacity-95"
              >
                应用筛选
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default SABCustomerList;
