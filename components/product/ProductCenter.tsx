import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Eye, Layers, Package, Tag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface CategoryGroup {
  group: string;
  children: string[];
}

const categoryTree: CategoryGroup[] = [
  { group: '云服务产品', children: ['WPS365公有云', 'WPS365私有云', '混合云方案'] },
  { group: '端侧软件',   children: ['Win端', 'Mac端', '移动端', '信创端'] },
  { group: '单品授权',   children: ['私有云单品', 'Web Office', '文档中台', '协作版'] },
  { group: '组件示例',   children: ['其他软件'] },
];

const ProductCenter: React.FC = () => {
  const { products, currentUser, roles } = useAppContext();
  const navigate = useNavigate();
  const currentUserRole = roles.find(r => r.id === currentUser.role);
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);
  const [searchTerm, setSearchTerm]   = useState('');
  const [activeTab, setActiveTab]     = useState<'ON_SHELF' | 'OFF_SHELF' | 'ALL'>('ON_SHELF');
  const [selectedLeaf, setSelectedLeaf] = useState<string>(
    categoryTree[0]?.children[0] ?? ''
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([categoryTree[0]?.group ?? ''])
  );

  // 组件气泡
  const [compPopoverId, setCompPopoverId] = useState<string | null>(null);
  const [compPopoverPos, setCompPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const compPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compPopoverId) return;
    const handler = (e: MouseEvent) => {
      if (compPopoverRef.current && !compPopoverRef.current.contains(e.target as Node)) {
        setCompPopoverId(null);
        setCompPopoverPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [compPopoverId]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const isOnShelf = (p: Product) =>
    activeTab === 'ON_SHELF' ? p.status !== 'OffShelf'
    : activeTab === 'OFF_SHELF' ? p.status === 'OffShelf'
    : true;

  const isSearching = searchTerm.trim().length > 0;
  const q = searchTerm.toLowerCase();

  // 搜索状态下按关键词过滤，否则只按分类
  const displayProducts = products.filter(p =>
    isOnShelf(p) &&
    (isSearching
      ? p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      : p.category === selectedLeaf)
  );

  // 计数始终基于搜索词（搜索时只计命中产品，非搜索时全量）
  const getLeafCount = (leaf: string) =>
    products.filter(p =>
      isOnShelf(p) &&
      p.category === leaf &&
      (!isSearching || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    ).length;

  const getGroupCount = (children: string[]) =>
    children.reduce((sum, leaf) => sum + getLeafCount(leaf), 0);

  // 搜索时过滤掉无结果的分类层级
  const visibleTree = isSearching
    ? categoryTree
        .map(({ group, children }) => ({
          group,
          children: children.filter(leaf => getLeafCount(leaf) > 0),
        }))
        .filter(({ children }) => children.length > 0)
    : categoryTree;

  const getTagColor = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('IM'))   return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
    if (t.includes('AI'))   return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50';
    if (t.includes('生态')) return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50';
    return 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/5';
  };

  if (!hasPermission('product_display_view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 dark:text-gray-600 gap-4 animate-fade-in">
        <Layers className="w-14 h-14 opacity-20" />
        <p className="text-base font-semibold">无产品展示查看权限</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">请联系管理员分配 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-xs font-mono">product_display_view</code> 权限</p>
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 overflow-hidden animate-page-enter">

      {/* ── Top Bar: title + controls (OrderManager style) ─────── */}
      <div className="px-6 pt-6 pb-4 shrink-0 flex items-center justify-between gap-4">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">产品目录</h1>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="unified-card flex items-stretch h-9 border-gray-200 dark:border-white/10 dark:bg-[#1C1C1E] w-[280px] focus-within:-blue-400 dark:focus-within:-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]">
            <div className="relative flex-1 flex items-center min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索产品名称、编码..."
                className="w-full h-full pl-9 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              {isSearching && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="relative flex items-center bg-gray-100 dark:bg-white/5 rounded-full p-0.5 border border-gray-200/60 dark:border-white/10">
            {/* 滑动指示器 */}
            <div
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(33.333%-2px)] rounded-full bg-[#0071E3] dark:bg-[#0A84FF] shadow-sm transition-transform duration-300 ease-in-out ${
                activeTab === 'OFF_SHELF' ? 'translate-x-full' : activeTab === 'ALL' ? 'translate-x-[200%]' : 'translate-x-0'
              }`}
            />
            {(['ON_SHELF', 'OFF_SHELF', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'ON_SHELF' ? '在架产品' : tab === 'OFF_SHELF' ? '下架产品' : '全部产品'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="unified-card flex-1 flex mx-6 mb-6 border-gray-200/80 dark:border-white/10 dark:bg-[#1C1C1E]">

        {/* ── Left: Collapsible Tree Sidebar ─────────────────── */}
        <div className="unified-card w-[312px] shrink-0 -r border-gray-200/80 dark:border-white/10 overflow-y-auto dark:bg-[#1C1C1E]">
          <div className="px-4 pt-4 pb-1">
            <div className="text-sm font-bold text-gray-300 dark:text-gray-600 px-1 mb-3">产品分类</div>
          </div>
          {visibleTree.map(({ group, children }) => {
            // 搜索时强制展开所有可见分组
            const isExpanded = isSearching || expandedGroups.has(group);
            return (
              <div key={group}>
                {/* 一级分类 */}
                <button
                  onClick={() => !isSearching && toggleGroup(group)}
                  className="w-full flex items-center text-left pl-3 pr-3 py-2.5 text-base font-extrabold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 shrink-0 mr-1.5" />
                    : <ChevronRight className="w-4 h-4 shrink-0 mr-1.5" />}
                  <span className="flex-1 truncate text-left">{group}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 shrink-0 ml-1">
                    共计<span className="font-mono ml-0.5">{getGroupCount(children)}</span>
                  </span>
                </button>

                {/* 二级分类 */}
                {isExpanded && (
                  <div className="mb-1">
                    {children.map(leaf => {
                      const count = getLeafCount(leaf);
                      const isSelected = !isSearching && selectedLeaf === leaf;
                      return (
                        <button
                          key={leaf}
                          onClick={() => { setSelectedLeaf(leaf); setSearchTerm(''); }}
                          className={`w-full flex items-center text-left pr-3 py-2 text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF]'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                          style={{ paddingLeft: 'calc(0.75rem + 1rem + 0.375rem + 2em)' }}
                        >
                          <span className="flex-1 truncate text-left">{leaf}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ml-1 font-mono font-bold ${
                            isSelected
                              ? 'bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right: Product Table ────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">


          {/* Card Grid */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-black/20">
            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {displayProducts.map(product => (
                  <div
                    key={product.id}
                    className="unified-card group dark:bg-[#1C1C1E] border-gray-200/80 dark:border-white/10 p-5 hover: hover:-blue-200 dark:hover:-blue-800/50 relative flex flex-col gap-3"
                  >
                    {/* Card Top: icon + name + status */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-[#0071E3] dark:text-[#0A84FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug truncate">
                            {product.name}
                          </h3>
                          {product.status === 'OffShelf' ? (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10">
                              已下架
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                              在架
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                          {product.id}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-white/5" />

                    {/* Fields */}
                    <div className="flex flex-col gap-2">
                      {/* SKU */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium w-14 shrink-0">规格</span>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {product.skus.slice(0, 3).map(sku => (
                            <span key={sku.id} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] border border-blue-100 dark:border-blue-800/50">
                              {sku.name}
                            </span>
                          ))}
                          {product.skus.length > 3 && (
                            <span className="text-xs text-gray-400 self-center">+{product.skus.length - 3}</span>
                          )}
                        </div>
                      </div>
                      {/* 组件 */}
                      <div className="flex items-start gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium w-14 shrink-0 mt-1">组件</span>
                        {product.composition?.length ? (
                          <div className="flex flex-wrap gap-1 min-w-0">
                            {product.composition.slice(0, 6).map(c => (
                              <span
                                key={c.id}
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${
                                  c.type === 'Feature'
                                    ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50'
                                    : c.type === 'Service'
                                    ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                                }`}
                              >
                                {c.name}
                              </span>
                            ))}
                            {product.composition.length > 6 && (
                              <div ref={compPopoverId === product.id ? compPopoverRef : undefined}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (compPopoverId === product.id) {
                                      setCompPopoverId(null);
                                      setCompPopoverPos(null);
                                    } else {
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                      const popoverWidth = 280;
                                      const left = Math.max(4, rect.left - popoverWidth - 6);
                                      setCompPopoverPos({ top: rect.top - 8, left });
                                      setCompPopoverId(product.id);
                                    }
                                  }}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition"
                                >
                                  +{product.composition.length - 6} 更多
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs mt-1">—</span>
                        )}
                      </div>
                    </div>

                    {/* Tags + Action */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.map(tag => (
                          <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold border ${getTagColor(tag)}`}>
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate(`/catalog/${product.id}/preview`)}
                        className="unified-button-primary shrink-0 ml-3 inline- .5 bg-[#0071E3] hover: active:bg-blue-700 shadow-apple"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        查看详情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400 dark:text-gray-600">
                <Package className="w-12 h-12 mb-4 opacity-30" />
                <div className="text-base font-medium mb-1">
                  暂无{activeTab === 'ON_SHELF' ? '在架' : activeTab === 'OFF_SHELF' ? '下架' : ''}产品
                </div>
                <div className="text-sm opacity-70">
                  {isSearching ? `未找到与 "${searchTerm}" 匹配的产品` : `当前分类下暂无产品数据`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* 组件气泡弹窗 — fixed 定位，不受父级 overflow 裁剪 */}
    {compPopoverId && compPopoverPos && (() => {
      const p = products.find(x => x.id === compPopoverId);
      if (!p?.composition?.length) return null;
      return (
        <div
          ref={compPopoverRef}
          style={{ position: 'fixed', top: compPopoverPos.top, left: compPopoverPos.left, zIndex: 9999, width: 280 }}
          className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              全部组件（{p.composition.length}）
            </span>
            <button
              onClick={() => { setCompPopoverId(null); setCompPopoverPos(null); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
            {p.composition.map(c => (
              <span
                key={c.id}
                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${
                  c.type === 'Feature'
                    ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50'
                    : c.type === 'Service'
                    ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/50'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                }`}
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      );
    })()}
    </>
  );
};

export default ProductCenter;
