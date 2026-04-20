import React, { useState, useMemo } from 'react';
import { Search, Package, Tag, X, ChevronRight, Eye, Layers } from 'lucide-react';
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

interface MobileProductCenterProps {
  onViewDetail?: (productId: string) => void;
}

const MobileProductCenter: React.FC<MobileProductCenterProps> = ({ onViewDetail }) => {
  const { filteredProducts: products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ON_SHELF' | 'OFF_SHELF'>('ON_SHELF');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const isOnShelf = (p: Product) =>
    activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf';

  const q = searchTerm.toLowerCase();
  const isSearching = searchTerm.trim().length > 0;

  const displayProducts = useMemo(() => {
    return products.filter(p =>
      isOnShelf(p) &&
      (isSearching
        ? p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        : !selectedCategory || p.category === selectedCategory)
    );
  }, [products, activeTab, searchTerm, selectedCategory]);

  const getCategoryCount = (leaf: string) =>
    products.filter(p => isOnShelf(p) && p.category === leaf).length;

  const getTagColor = (tag: string) => {
    const t = tag.toUpperCase();
    if (t.includes('IM'))   return 'bg-blue-50 text-blue-600 border-blue-100';
    if (t.includes('AI'))   return 'bg-purple-50 text-purple-600 border-purple-100';
    if (t.includes('生态')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black">
      {/* Navigation Bar */}
      <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08]">
        <div className="flex items-center justify-between px-4 h-11">
          <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">产品中心</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5"
          >
            <Search className="w-[18px] h-[18px] text-[#007AFF]" />
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl px-3 h-9">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索产品名称、编码..."
                className="flex-1 bg-transparent text-[15px] outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Segmented Control */}
        <div className="px-4 pb-2">
          <div className="flex bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg p-0.5">
            {(['ON_SHELF', 'OFF_SHELF'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab === 'ON_SHELF' ? '在架产品' : '下架产品'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body: Category Chips + Products */}
      <div className="flex-1 overflow-y-auto">
        {/* Category Chips */}
        {!isSearching && (
          <div className="px-4 pt-3 pb-1">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  全部 <span className="ml-0.5 text-[11px] opacity-70">{products.filter(p => isOnShelf(p)).length}</span>
                </button>
                {categoryTree.map(({ group, children }) =>
                  children.map(leaf => {
                    const count = getCategoryCount(leaf);
                    if (count === 0) return null;
                    return (
                      <button
                        key={leaf}
                        onClick={() => setSelectedCategory(leaf)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                          selectedCategory === leaf
                            ? 'bg-[#007AFF] text-white shadow-sm'
                            : 'bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {leaf} <span className="ml-0.5 text-[11px] opacity-70">{count}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product List */}
        <div className="px-4 pb-6 space-y-3 pt-2">
          {displayProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                  共 {displayProducts.length} 个产品
                </span>
              </div>

              {displayProducts.map((product, idx) => (
                <div
                  key={product.id}
                  onClick={() => onViewDetail?.(product.id)}
                  className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                  style={{ animation: `mobileSlideUp 0.3s ease-out ${idx * 0.04}s both` }}
                >
                  <div className="p-4 space-y-3">
                    {/* Header: Icon + Name + Status */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-[#007AFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                            {product.name}
                          </h3>
                          {product.status === 'OffShelf' ? (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-400">
                              已下架
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                              在架
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{product.id}</p>
                      </div>
                    </div>

                    {/* SKU Chips */}
                    {product.skus && product.skus.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-400 font-medium shrink-0">规格</span>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {product.skus.slice(0, 3).map(sku => (
                            <span key={sku.id} className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-[#007AFF] border border-blue-100">
                              {sku.name}
                            </span>
                          ))}
                          {product.skus.length > 3 && (
                            <span className="text-[11px] text-gray-400 self-center">+{product.skus.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Components */}
                    {product.composition && product.composition.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <span className="text-[11px] text-gray-400 font-medium shrink-0 mt-0.5">组件</span>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {product.composition.slice(0, 4).map(c => (
                            <span
                              key={c.id}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${
                                c.type === 'Feature'
                                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                                  : c.type === 'Service'
                                  ? 'bg-sky-50 text-sky-600 border-sky-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}
                            >
                              {c.name}
                            </span>
                          ))}
                          {product.composition.length > 4 && (
                            <span className="text-[11px] text-gray-400 self-center">+{product.composition.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags + Arrow */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/5">
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.map(tag => (
                          <span key={tag} className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getTagColor(tag)}`}>
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Layers className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-[15px] font-medium">暂无产品</p>
              <p className="text-[13px] mt-1 opacity-60">
                {isSearching ? `未找到"${searchTerm}"相关产品` : '当前分类下暂无产品'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mobileSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default MobileProductCenter;
