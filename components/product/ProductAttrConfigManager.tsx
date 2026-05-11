import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Search, X, Pencil, Trash2, Copy, Power, PowerOff,
  Link2, ChevronUp, ChevronDown, Check, AlertCircle,
  Package, Shield, Wrench, Tag,
} from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';
import type { Product } from '../../types';

// ===================================================================
// 数据模型
// ===================================================================

/** 关联类型：必选 / 可选 */
type AssociationKind = 'required' | 'optional';

/** 数量约束：与主产品数量一致 / 至少 1 / 自由 */
type QuantityRule = 'equalToMain' | 'atLeastOne' | 'free';

/** 适用销售类型 */
type ChannelKind = 'Direct' | 'Channel';

/** 主产品匹配范围（多个非空字段做 AND；列表内做 OR） */
interface ProductScope {
  /** 精确产品 ID 列表（最高优先级，存在时其他维度仅作"额外限制"） */
  productIds: string[];
  /** 产品类别：通用产品 / 维保服务产品 等 */
  productKinds: string[];
  /** 产品分类（category） */
  productCategories: string[];
  /** 产品系列（productSeries） */
  productSeries: string[];
  /** 产品线（productLine） */
  productLines: string[];
}

/** 关联服务条目 */
interface ServiceLink {
  id: string;
  serviceProductId: string;
  serviceProductName: string;
  kind: AssociationKind;
  quantityRule: QuantityRule;
  unit: string;
  channels: ChannelKind[];
  remark?: string;
}

/** 产品-服务关联规则 */
interface ProductServiceLinkRule {
  id: string;
  name: string;
  scope: ProductScope;
  services: ServiceLink[];
  status: 'enabled' | 'disabled';
  priority: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// ===================================================================
// 常量与默认值
// ===================================================================

const KIND_OPTIONS = ['通用产品/非维保服务产品', '维保服务产品'] as const;
const QUANTITY_RULE_LABEL: Record<QuantityRule, string> = {
  equalToMain: '与主产品数量一致',
  atLeastOne: '至少 1 个',
  free: '不限制',
};
const UNIT_OPTIONS = ['套', '年', '个', '次', '人月', '人天', '客户', '用户'];
const CHANNEL_OPTIONS: { value: ChannelKind; label: string }[] = [
  { value: 'Direct', label: '直销' },
  { value: 'Channel', label: '渠道' },
];

const emptyScope: ProductScope = {
  productIds: [],
  productKinds: [],
  productCategories: [],
  productSeries: [],
  productLines: [],
};

/** 服务产品识别：含"服务"二字、运维保障类、productKind=维保服务产品 */
const isServiceLikeProduct = (p: Product): boolean => {
  if (p.productKind === '维保服务产品') return true;
  const text = `${p.name || ''} ${p.subCategory || ''} ${p.productType || ''} ${p.productLineFinance || ''}`;
  return /服务|运维|保障|实施/.test(text);
};

// ===================================================================
// 初始演示数据
// ===================================================================

const SAMPLE_RULES = (products: Product[]): ProductServiceLinkRule[] => {
  const findId = (kw: RegExp) => products.find(p => kw.test(p.name))?.id || '';
  const wpsAi = findId(/政务AI平台V3\.0/);
  const wpsAiSvc = findId(/政务AI平台运维保障服务/);
  const ofd = findId(/电子公文资源库系统V1\.0/);
  const ofdSvc = findId(/电子公文资源库系统运维保障服务/);
  const docCenterV7 = findId(/文档中心系统技术服务/);

  return [
    {
      id: 'rule-001',
      name: '私有云核心产品-必选运维保障',
      scope: {
        ...emptyScope,
        productCategories: ['私有云单品', 'WPS365私有云'],
        productKinds: ['通用产品/非维保服务产品'],
      },
      services: [
        wpsAiSvc && {
          id: 'svc-1', serviceProductId: wpsAiSvc,
          serviceProductName: products.find(p => p.id === wpsAiSvc)?.name || '',
          kind: 'required', quantityRule: 'equalToMain', unit: '套',
          channels: ['Direct', 'Channel'],
          remark: '首次购买必选 1 年运维保障',
        },
        ofdSvc && {
          id: 'svc-2', serviceProductId: ofdSvc,
          serviceProductName: products.find(p => p.id === ofdSvc)?.name || '',
          kind: 'required', quantityRule: 'equalToMain', unit: '套',
          channels: ['Direct', 'Channel'],
        },
      ].filter(Boolean) as ServiceLink[],
      status: 'enabled', priority: 10,
      remark: '私有云核心产品下单必须捆绑运维保障服务',
      createdAt: '2025-12-08 10:30',
      updatedAt: '2026-04-22 14:12',
    },
    {
      id: 'rule-002',
      name: 'AI 平台-可选二次开发服务',
      scope: {
        ...emptyScope,
        productIds: [wpsAi, ofd].filter(Boolean),
      },
      services: [
        docCenterV7 && {
          id: 'svc-3', serviceProductId: docCenterV7,
          serviceProductName: products.find(p => p.id === docCenterV7)?.name || '',
          kind: 'optional', quantityRule: 'free', unit: '人月',
          channels: ['Direct'],
          remark: '客户可按需购买，不强制',
        },
      ].filter(Boolean) as ServiceLink[],
      status: 'enabled', priority: 5,
      remark: '直销订单允许加购二次开发服务',
      createdAt: '2025-11-15 09:20',
      updatedAt: '2026-04-10 09:48',
    },
    {
      id: 'rule-003',
      name: '维保服务产品-禁用关联',
      scope: { ...emptyScope, productKinds: ['维保服务产品'] },
      services: [],
      status: 'disabled', priority: 1,
      remark: '维保服务产品自身无需再关联其他服务',
      createdAt: '2025-10-02 16:08',
      updatedAt: '2025-10-02 16:08',
    },
  ];
};

// ===================================================================
// 组件
// ===================================================================

const ProductAttrConfigManager: React.FC = () => {
  const { products } = useAppContext();
  const [rules, setRules] = useState<ProductServiceLinkRule[]>(() => SAMPLE_RULES(products));
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [editingRule, setEditingRule] = useState<ProductServiceLinkRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scopeDetail, setScopeDetail] = useState<ProductServiceLinkRule | null>(null);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  // ---- 派生：过滤 + 分页 ----
  const filteredRules = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return rules.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!k) return true;
      const haystack = [
        r.name, r.remark || '',
        ...r.services.map(s => s.serviceProductName),
        ...r.scope.productCategories, ...r.scope.productSeries, ...r.scope.productLines,
        ...r.scope.productIds,
      ].join(' ').toLowerCase();
      return haystack.includes(k);
    });
  }, [rules, keyword, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pagedRules = useMemo(
    () => filteredRules.slice((page - 1) * pageSize, page * pageSize),
    [filteredRules, page]
  );

  // ---- 派生：匹配数预览 ----
  const matchCount = useCallback((scope: ProductScope): number => {
    return products.filter(p => {
      if (scope.productIds.length && !scope.productIds.includes(p.id)) return false;
      if (scope.productKinds.length && !scope.productKinds.includes(p.productKind || '')) return false;
      if (scope.productCategories.length && !scope.productCategories.includes(p.category)) return false;
      if (scope.productSeries.length && !scope.productSeries.includes(p.productSeries || '')) return false;
      if (scope.productLines.length && !scope.productLines.includes(p.productLine || '')) return false;
      // 至少有一个维度被使用
      const anyDimension = scope.productIds.length + scope.productKinds.length + scope.productCategories.length + scope.productSeries.length + scope.productLines.length;
      return anyDimension > 0;
    }).length;
  }, [products]);

  // ---- 操作 ----
  const openAdd = () => {
    const now = new Date().toLocaleString('sv').slice(0, 16);
    setEditingRule({
      id: '',
      name: '',
      scope: { ...emptyScope },
      services: [],
      status: 'enabled',
      priority: 5,
      remark: '',
      createdAt: now,
      updatedAt: now,
    });
    setIsModalOpen(true);
  };

  const openEdit = (rule: ProductServiceLinkRule) => {
    setEditingRule(JSON.parse(JSON.stringify(rule)));
    setIsModalOpen(true);
  };

  const duplicateRule = (rule: ProductServiceLinkRule) => {
    const now = new Date().toLocaleString('sv').slice(0, 16);
    const copy: ProductServiceLinkRule = {
      ...JSON.parse(JSON.stringify(rule)),
      id: `rule-${Date.now()}`,
      name: rule.name + '（副本）',
      createdAt: now,
      updatedAt: now,
    };
    setRules(prev => [copy, ...prev]);
    showToast('已复制规则');
  };

  const toggleStatus = (id: string) => {
    setRules(prev => prev.map(r => r.id === id
      ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled', updatedAt: new Date().toLocaleString('sv').slice(0, 16) }
      : r));
    showToast('状态已更新');
  };

  const removeRule = (id: string) => {
    if (!confirm('确定删除该关联规则？删除后该范围内产品下单时将不再带出关联服务。')) return;
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('已删除');
  };

  const saveRule = () => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) { showToast('请填写规则名称'); return; }
    const anyDim = editingRule.scope.productIds.length + editingRule.scope.productKinds.length
      + editingRule.scope.productCategories.length + editingRule.scope.productSeries.length + editingRule.scope.productLines.length;
    if (anyDim === 0) { showToast('请至少指定一个适用产品维度'); return; }
    if (editingRule.services.length === 0) { showToast('请至少添加一个关联服务'); return; }
    if (editingRule.services.some(s => !s.serviceProductId)) { showToast('存在未选择服务产品的条目'); return; }

    const now = new Date().toLocaleString('sv').slice(0, 16);
    if (editingRule.id) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...editingRule, updatedAt: now } : r));
      showToast('已保存修改');
    } else {
      setRules(prev => [{ ...editingRule, id: `rule-${Date.now()}`, createdAt: now, updatedAt: now }, ...prev]);
      showToast('已新增规则');
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // ===================================================================
  // 渲染
  // ===================================================================

  return (
    <div className="p-3 lg:p-4 max-w-[2400px] w-full mx-auto animate-page-enter">
      {/* 页头 */}
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#0071E3] dark:text-[#0A84FF]" /> 属性配置 · 产品-服务关联
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            通用配置：当主产品下单时，自动带出"必选"或"可选"的服务产品。规则按优先级匹配，相同维度内规则叠加。
          </p>
        </div>
        <button onClick={openAdd} className="unified-button-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> 新增关联规则
        </button>
      </div>

      {/* 工具栏 */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 px-5 py-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            placeholder="搜索规则名称 / 服务产品 / 适用范围"
            className="w-full h-9 pl-9 pr-9 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black focus:border-blue-400 outline-none"
          />
          {keyword && (
            <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
          {([['all', '全部'], ['enabled', '启用'], ['disabled', '停用']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setStatusFilter(v); setPage(1); }}
              className={`px-3 h-7 text-xs font-medium rounded-md transition ${
                statusFilter === v
                  ? 'bg-white dark:bg-[#0A0A0B] text-[#0071E3] dark:text-[#0A84FF] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>共 <span className="font-bold text-gray-700 dark:text-gray-200">{filteredRules.length}</span> 条规则</span>
          <span className="text-gray-300 dark:text-white/10">|</span>
          <span>启用 <span className="font-bold text-emerald-600 dark:text-emerald-400">{rules.filter(r => r.status === 'enabled').length}</span></span>
          <span>停用 <span className="font-bold text-gray-500">{rules.filter(r => r.status === 'disabled').length}</span></span>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
        {pagedRules.length === 0 ? (
          <div className="py-20 text-center text-gray-400 dark:text-gray-500">
            <Link2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <div className="text-sm">{keyword || statusFilter !== 'all' ? '无匹配的规则，换个筛选条件试试' : '暂无规则，点击右上角"新增关联规则"创建'}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3 w-[60px]">优先级</th>
                  <th className="px-5 py-3 min-w-[220px]">规则名称</th>
                  <th className="px-5 py-3 min-w-[260px]">适用产品范围</th>
                  <th className="px-5 py-3 min-w-[260px]">关联服务</th>
                  <th className="px-5 py-3 w-[90px]">状态</th>
                  <th className="px-5 py-3 w-[140px]">最近更新</th>
                  <th className="px-5 py-3 w-[200px] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {pagedRules.map(rule => {
                  const matched = matchCount(rule.scope);
                  const requiredCount = rule.services.filter(s => s.kind === 'required').length;
                  const optionalCount = rule.services.length - requiredCount;
                  return (
                    <tr key={rule.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                          {rule.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{rule.name}</div>
                        {rule.remark && (
                          <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{rule.remark}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <ScopePreview scope={rule.scope} matchedCount={matched} onShowDetail={() => setScopeDetail(rule)} />
                      </td>
                      <td className="px-5 py-3.5">
                        <ServiceSummary requiredCount={requiredCount} optionalCount={optionalCount} services={rule.services} />
                      </td>
                      <td className="px-5 py-3.5">
                        {rule.status === 'enabled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 启用
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> 停用
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{rule.updatedAt}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(rule)} title="编辑" className="p-1.5 text-gray-500 hover:text-[#0071E3] dark:hover:text-[#0A84FF] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => duplicateRule(rule)} title="复制" className="p-1.5 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toggleStatus(rule.id)} title={rule.status === 'enabled' ? '停用' : '启用'} className="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition">
                            {rule.status === 'enabled' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => removeRule(rule.id)} title="删除" className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {filteredRules.length > pageSize && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>共 {filteredRules.length} 条 · 第 {page} / {totalPages} 页</span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5">上一页</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 dark:border-white/10 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 新增 / 编辑 Modal */}
      {isModalOpen && editingRule && (
        <RuleEditModal
          rule={editingRule}
          products={products}
          matchedCount={matchCount(editingRule.scope)}
          onChange={setEditingRule}
          onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
          onSave={saveRule}
        />
      )}

      {/* 适用范围明细弹窗 */}
      {scopeDetail && (
        <ScopeDetailModal
          rule={scopeDetail}
          products={products}
          onClose={() => setScopeDetail(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[700] px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// 子组件：适用范围摘要
// ===================================================================
const ScopePreview: React.FC<{ scope: ProductScope; matchedCount: number; onShowDetail: () => void }> = ({ scope, matchedCount, onShowDetail }) => {
  const chips: { label: string; value: string; tone: string }[] = [];
  if (scope.productIds.length) chips.push({ label: '指定产品', value: `${scope.productIds.length} 个`, tone: 'blue' });
  if (scope.productKinds.length) chips.push({ label: '产品类别', value: scope.productKinds.join('、'), tone: 'purple' });
  if (scope.productCategories.length) chips.push({ label: '分类', value: scope.productCategories.join('、'), tone: 'emerald' });
  if (scope.productSeries.length) chips.push({ label: '系列', value: scope.productSeries.join('、'), tone: 'amber' });
  if (scope.productLines.length) chips.push({ label: '产品线', value: scope.productLines.join('、'), tone: 'rose' });

  const toneClass = (t: string) => ({
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  }[t] || 'bg-gray-100 text-gray-600');

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {chips.length === 0
          ? <span className="text-xs text-gray-400">未指定范围</span>
          : chips.slice(0, 3).map((c, i) => (
            <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${toneClass(c.tone)} max-w-[180px]`}>
              <span className="font-bold mr-0.5">{c.label}:</span>
              <span className="truncate">{c.value}</span>
            </span>
          ))}
        {chips.length > 3 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500">
            +{chips.length - 3}
          </span>
        )}
      </div>
      <button
        onClick={onShowDetail}
        className="mt-1.5 text-[11px] text-[#0071E3] dark:text-[#0A84FF] hover:underline"
      >
        匹配 <span className="font-bold">{matchedCount}</span> 个产品 · 查看明细
      </button>
    </div>
  );
};

// ===================================================================
// 子组件：服务摘要
// ===================================================================
const ServiceSummary: React.FC<{ requiredCount: number; optionalCount: number; services: ServiceLink[] }> = ({ requiredCount, optionalCount, services }) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {requiredCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <Shield className="w-2.5 h-2.5" /> 必选 {requiredCount}
          </span>
        )}
        {optionalCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Wrench className="w-2.5 h-2.5" /> 可选 {optionalCount}
          </span>
        )}
        {services.length === 0 && (
          <span className="text-xs text-gray-400">未关联服务</span>
        )}
      </div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
        {services.slice(0, 3).map(s => s.serviceProductName).join('、') || '—'}
        {services.length > 3 && ` 等 ${services.length} 项`}
      </div>
    </div>
  );
};

// ===================================================================
// 子组件：编辑 Modal
// ===================================================================
interface RuleEditModalProps {
  rule: ProductServiceLinkRule;
  products: Product[];
  matchedCount: number;
  onChange: (r: ProductServiceLinkRule) => void;
  onClose: () => void;
  onSave: () => void;
}

const RuleEditModal: React.FC<RuleEditModalProps> = ({ rule, products, matchedCount, onChange, onClose, onSave }) => {
  const inputClass = 'w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition';
  const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

  // 维度候选项（去重）
  const allCategories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort(), [products]);
  const allSeries = useMemo(() => Array.from(new Set(products.map(p => p.productSeries || '').filter(Boolean))).sort(), [products]);
  const allLines = useMemo(() => Array.from(new Set(products.map(p => p.productLine || '').filter(Boolean))).sort(), [products]);

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [editingServiceIdx, setEditingServiceIdx] = useState<number>(-1);

  const updateScope = <K extends keyof ProductScope>(key: K, val: ProductScope[K]) => {
    onChange({ ...rule, scope: { ...rule.scope, [key]: val } });
  };
  const toggleScopeArr = (key: 'productKinds' | 'productCategories' | 'productSeries' | 'productLines', v: string) => {
    const arr = rule.scope[key];
    const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    updateScope(key, next);
  };

  const addServiceRow = () => {
    onChange({
      ...rule,
      services: [...rule.services, {
        id: `svc-${Date.now()}`,
        serviceProductId: '', serviceProductName: '',
        kind: 'required', quantityRule: 'equalToMain',
        unit: '套', channels: ['Direct', 'Channel'],
        remark: '',
      }],
    });
  };
  const updateService = (idx: number, patch: Partial<ServiceLink>) => {
    onChange({ ...rule, services: rule.services.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  };
  const removeService = (idx: number) => {
    onChange({ ...rule, services: rule.services.filter((_, i) => i !== idx) });
  };

  const selectedProductsName = useMemo(
    () => rule.scope.productIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean) as string[],
    [rule.scope.productIds, products]
  );

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {rule.id ? '编辑关联规则' : '新增关联规则'}
            </h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
            {/* Section 1: 基本信息 */}
            <section>
              <SectionHeader icon={<Tag className="w-4 h-4" />} title="基本信息" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>规则名称 <span className="text-red-500">*</span></label>
                  <input
                    value={rule.name}
                    onChange={e => onChange({ ...rule, name: e.target.value })}
                    className={inputClass}
                    placeholder="例如：私有云核心产品-必选运维保障"
                  />
                </div>
                <div>
                  <label className={labelClass}>优先级</label>
                  <input
                    type="number" min={1} max={100}
                    value={rule.priority}
                    onChange={e => onChange({ ...rule, priority: Number(e.target.value) || 1 })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>状态</label>
                  <div className="flex gap-2">
                    {(['enabled', 'disabled'] as const).map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => onChange({ ...rule, status: s })}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition ${
                          rule.status === s
                            ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {s === 'enabled' ? '启用' : '停用'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>备注</label>
                  <input
                    value={rule.remark || ''}
                    onChange={e => onChange({ ...rule, remark: e.target.value })}
                    className={inputClass}
                    placeholder="规则用途说明（可选）"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: 适用产品 */}
            <section>
              <SectionHeader
                icon={<Package className="w-4 h-4" />}
                title="适用主产品范围"
                desc="多个维度按 AND 组合；同一维度内多个值按 OR 组合。至少需要指定一个维度。"
                extra={
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                    匹配 {matchedCount} 个产品
                  </span>
                }
              />
              {/* 精确产品 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass + ' mb-0'}>精确指定产品</label>
                  <button type="button" onClick={() => setProductPickerOpen(true)} className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 选择产品
                  </button>
                </div>
                <div className="min-h-[42px] border border-dashed border-gray-200 dark:border-white/10 rounded-lg p-2 flex flex-wrap gap-1.5">
                  {selectedProductsName.length === 0 ? (
                    <span className="text-xs text-gray-400 px-1 py-1">未选择，留空则按下方维度匹配</span>
                  ) : selectedProductsName.map((n, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                      <span className="max-w-[200px] truncate">{n}</span>
                      <button onClick={() => updateScope('productIds', rule.scope.productIds.filter(id => id !== rule.scope.productIds[i]))} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 维度多选 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DimensionMultiSelect
                  label="产品类别"
                  options={KIND_OPTIONS as unknown as string[]}
                  selected={rule.scope.productKinds}
                  onToggle={v => toggleScopeArr('productKinds', v)}
                />
                <DimensionMultiSelect
                  label="产品分类"
                  options={allCategories}
                  selected={rule.scope.productCategories}
                  onToggle={v => toggleScopeArr('productCategories', v)}
                  searchable
                />
                <DimensionMultiSelect
                  label="产品系列"
                  options={allSeries}
                  selected={rule.scope.productSeries}
                  onToggle={v => toggleScopeArr('productSeries', v)}
                  searchable
                />
                <DimensionMultiSelect
                  label="产品线"
                  options={allLines}
                  selected={rule.scope.productLines}
                  onToggle={v => toggleScopeArr('productLines', v)}
                  searchable
                />
              </div>
            </section>

            {/* Section 3: 关联服务 */}
            <section>
              <SectionHeader
                icon={<Wrench className="w-4 h-4" />}
                title="关联服务产品"
                desc="必选服务在下单时自动添加并不可移除；可选服务展示供购买方加购。"
                extra={
                  <button type="button" onClick={addServiceRow} className="text-xs px-2.5 py-1 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white hover:opacity-90 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 新增一行
                  </button>
                }
              />
              {rule.services.length === 0 ? (
                <div className="border border-dashed border-gray-200 dark:border-white/10 rounded-lg py-8 text-center text-xs text-gray-400">
                  暂未添加，点击右上角「新增一行」开始配置
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-lg">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-gray-50 dark:bg-white/[0.02]">
                      <tr className="text-xs text-gray-500 dark:text-gray-400">
                        <th className="px-3 py-2 min-w-[260px]">服务产品 <span className="text-red-500">*</span></th>
                        <th className="px-3 py-2 w-[100px]">关联类型</th>
                        <th className="px-3 py-2 w-[150px]">数量约束</th>
                        <th className="px-3 py-2 w-[80px]">单位</th>
                        <th className="px-3 py-2 w-[140px]">销售类型</th>
                        <th className="px-3 py-2">备注</th>
                        <th className="px-3 py-2 w-[50px]" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {rule.services.map((svc, idx) => (
                        <tr key={svc.id} className="text-sm">
                          <td className="px-3 py-2">
                            {svc.serviceProductId ? (
                              <button
                                type="button"
                                onClick={() => { setEditingServiceIdx(idx); setServicePickerOpen(true); }}
                                className="w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 border border-gray-200 dark:border-white/10 rounded hover:border-blue-300 transition"
                              >
                                <span className="truncate">{svc.serviceProductName}</span>
                                <Pencil className="w-3 h-3 text-gray-400 shrink-0" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setEditingServiceIdx(idx); setServicePickerOpen(true); }}
                                className="w-full px-2 py-1.5 border border-dashed border-gray-300 dark:border-white/10 rounded text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                              >
                                + 选择服务产品
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {(['required', 'optional'] as const).map(k => (
                                <button
                                  key={k} type="button"
                                  onClick={() => updateService(idx, { kind: k })}
                                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition ${
                                    svc.kind === k
                                      ? k === 'required'
                                        ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-900/20'
                                        : 'border-blue-300 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-white/10 text-gray-500'
                                  }`}
                                >
                                  {k === 'required' ? '必选' : '可选'}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={svc.quantityRule}
                              onChange={e => updateService(idx, { quantityRule: e.target.value as QuantityRule })}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-black"
                            >
                              {(Object.keys(QUANTITY_RULE_LABEL) as QuantityRule[]).map(q => (
                                <option key={q} value={q}>{QUANTITY_RULE_LABEL[q]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={svc.unit}
                              onChange={e => updateService(idx, { unit: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-black"
                            >
                              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {CHANNEL_OPTIONS.map(c => {
                                const active = svc.channels.includes(c.value);
                                return (
                                  <button
                                    key={c.value} type="button"
                                    onClick={() => updateService(idx, {
                                      channels: active
                                        ? svc.channels.filter(x => x !== c.value)
                                        : [...svc.channels, c.value],
                                    })}
                                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded border transition ${
                                      active
                                        ? 'border-[#0071E3] bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-[#0A84FF]'
                                        : 'border-gray-200 dark:border-white/10 text-gray-400'
                                    }`}
                                  >
                                    {c.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={svc.remark || ''}
                              onChange={e => updateService(idx, { remark: e.target.value })}
                              placeholder="可选"
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-black"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeService(idx)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rule.services.some(s => s.kind === 'required') && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    包含必选服务后，匹配范围内产品在下单时将自动捆绑并不可移除，请确认范围与服务的对应关系。
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-2 bg-gray-50/50 dark:bg-white/[0.02]">
            <button onClick={onClose} className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition">
              取消
            </button>
            <button onClick={onSave} className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition">
              保存规则
            </button>
          </div>
        </div>
      </div>

      {/* 主产品 picker */}
      {productPickerOpen && (
        <ProductPickerModal
          title="选择适用产品"
          products={products.filter(p => !isServiceLikeProduct(p))}
          selectedIds={rule.scope.productIds}
          onClose={() => setProductPickerOpen(false)}
          onConfirm={ids => {
            updateScope('productIds', ids);
            setProductPickerOpen(false);
          }}
        />
      )}

      {/* 服务产品 picker */}
      {servicePickerOpen && editingServiceIdx >= 0 && (
        <ProductPickerModal
          title="选择服务产品"
          singleSelect
          products={products.filter(isServiceLikeProduct)}
          selectedIds={rule.services[editingServiceIdx]?.serviceProductId ? [rule.services[editingServiceIdx].serviceProductId] : []}
          onClose={() => { setServicePickerOpen(false); setEditingServiceIdx(-1); }}
          onConfirm={ids => {
            const id = ids[0];
            if (id) {
              const p = products.find(x => x.id === id);
              if (p) updateService(editingServiceIdx, { serviceProductId: p.id, serviceProductName: p.name });
            }
            setServicePickerOpen(false);
            setEditingServiceIdx(-1);
          }}
        />
      )}
    </ModalPortal>
  );
};

// ===================================================================
// 子组件：通用产品选择 Modal
// ===================================================================
interface ProductPickerModalProps {
  title: string;
  products: Product[];
  selectedIds: string[];
  singleSelect?: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

const ProductPickerModal: React.FC<ProductPickerModalProps> = ({ title, products, selectedIds, singleSelect, onClose, onConfirm }) => {
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const list = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return products;
    return products.filter(p => p.id.toLowerCase().includes(k) || p.name.toLowerCase().includes(k) || (p.category || '').toLowerCase().includes(k));
  }, [keyword, products]);

  const toggle = (id: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (singleSelect) {
        next.clear();
        next.add(id);
      } else {
        next.has(id) ? next.delete(id) : next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[700] p-4">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="按产品编号 / 名称 / 分类搜索"
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black focus:border-blue-400 outline-none"
            />
          </div>
          {!singleSelect && list.length > 0 && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>共 {list.length} 个，已选 <span className="font-bold text-[#0071E3]">{picked.size}</span> 个</span>
              <div className="flex gap-2">
                <button onClick={() => setPicked(new Set([...picked, ...list.map(p => p.id)]))} className="hover:underline text-[#0071E3]">全选当前</button>
                <button onClick={() => { const next = new Set(picked); list.forEach(p => next.delete(p.id)); setPicked(next); }} className="hover:underline text-gray-500">清除当前</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
          {list.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">无匹配产品</div>
          ) : list.map(p => {
            const checked = picked.has(p.id);
            return (
              <label
                key={p.id}
                className={`px-3 py-2 mx-1 my-0.5 flex items-center gap-3 rounded-lg cursor-pointer transition ${
                  checked ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <input
                  type={singleSelect ? 'radio' : 'checkbox'}
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4 accent-[#0071E3]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{p.id}</span>
                    {p.category && <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5">{p.category}</span>}
                    {p.productKind && <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">{p.productKind}</span>}
                  </div>
                </div>
                {checked && <Check className="w-4 h-4 text-[#0071E3] dark:text-[#0A84FF]" />}
              </label>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
          <span className="text-xs text-gray-500 dark:text-gray-400">已选 <span className="font-bold text-[#0071E3]">{picked.size}</span> 项</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-white/10">取消</button>
            <button
              disabled={picked.size === 0}
              onClick={() => onConfirm(Array.from(picked))}
              className="px-3 py-1.5 text-xs text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded hover:opacity-90 disabled:opacity-40"
            >
              确认 ({picked.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// 子组件：维度多选
// ===================================================================
interface DimensionMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  searchable?: boolean;
}

const DimensionMultiSelect: React.FC<DimensionMultiSelectProps> = ({ label, options, selected, onToggle, searchable }) => {
  const [expanded, setExpanded] = useState(false);
  const [keyword, setKeyword] = useState('');
  const filtered = useMemo(() => {
    if (!searchable || !keyword.trim()) return options;
    return options.filter(o => o.toLowerCase().includes(keyword.toLowerCase()));
  }, [options, keyword, searchable]);
  const visible = expanded ? filtered : filtered.slice(0, 12);

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 bg-gray-50/30 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
          {label}
          {selected.length > 0 && (
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
              已选 {selected.length}
            </span>
          )}
        </span>
        {searchable && (
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索"
            className="w-32 h-6 px-2 text-[11px] border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-black focus:border-blue-400 outline-none"
          />
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="text-[11px] text-gray-400 py-2">无匹配选项</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.map(opt => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt} type="button"
                onClick={() => onToggle(opt)}
                className={`px-2 py-1 text-xs rounded border transition max-w-[180px] truncate ${
                  active
                    ? 'border-[#0071E3] bg-blue-50 text-[#0071E3] dark:bg-blue-900/20 dark:text-[#0A84FF]'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 bg-white dark:bg-black'
                }`}
                title={opt}
              >
                {opt}
              </button>
            );
          })}
          {filtered.length > 12 && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="px-2 py-1 text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline flex items-center gap-0.5"
            >
              {expanded ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展开全部 ({filtered.length}) <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// 子组件：Section 标题
// ===================================================================
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; desc?: string; extra?: React.ReactNode }> = ({ icon, title, desc, extra }) => (
  <div className="mb-3 flex items-start justify-between gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#0071E3] dark:text-[#0A84FF]">{icon}</div>
      <div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">{title}</div>
        {desc && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
      </div>
    </div>
    {extra}
  </div>
);

// ===================================================================
// 子组件：适用范围明细 Modal
// ===================================================================
const ScopeDetailModal: React.FC<{ rule: ProductServiceLinkRule; products: Product[]; onClose: () => void }> = ({ rule, products, onClose }) => {
  const matched = useMemo(() => products.filter(p => {
    const s = rule.scope;
    if (s.productIds.length && !s.productIds.includes(p.id)) return false;
    if (s.productKinds.length && !s.productKinds.includes(p.productKind || '')) return false;
    if (s.productCategories.length && !s.productCategories.includes(p.category)) return false;
    if (s.productSeries.length && !s.productSeries.includes(p.productSeries || '')) return false;
    if (s.productLines.length && !s.productLines.includes(p.productLine || '')) return false;
    const anyDimension = s.productIds.length + s.productKinds.length + s.productCategories.length + s.productSeries.length + s.productLines.length;
    return anyDimension > 0;
  }), [rule, products]);

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh]">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              规则「{rule.name}」匹配的产品 · 共 {matched.length} 个
            </h4>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {matched.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">当前范围未匹配到任何产品</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">产品编号</th>
                    <th className="px-4 py-2.5">产品名称</th>
                    <th className="px-4 py-2.5">分类</th>
                    <th className="px-4 py-2.5">系列</th>
                    <th className="px-4 py-2.5">产品类别</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {matched.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">{p.id}</td>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{p.category}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{p.productSeries || '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{p.productKind || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ProductAttrConfigManager;
