import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Box, Layers, Zap, Shield, Settings2 } from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  Component: <Box className="w-3 h-3" />,
  Feature: <Zap className="w-3 h-3" />,
  Service: <Settings2 className="w-3 h-3" />,
};

const TYPE_STYLE: Record<string, string> = {
  Component: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  Feature: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  Service: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
};

const ProductCatalog: React.FC<ProductCatalogProps> = ({ products }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ON_SHELF' | 'OFF_SHELF'>('ON_SHELF');

  const tabProducts = useMemo(() =>
    products.filter(p => activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf'),
    [products, activeTab]
  );

  const categories = useMemo(() => {
    const cats = new Set(tabProducts.map(p => p.category));
    return Array.from(cats).sort();
  }, [tabProducts]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const activeCat = categories.includes(selectedCategory) ? selectedCategory : (categories[0] ?? '');

  const subCategories = useMemo(() => {
    const subs = new Set(tabProducts.filter(p => p.category === activeCat).map(p => p.subCategory ?? ''));
    return Array.from(subs).sort();
  }, [tabProducts, activeCat]);

  const [selectedSub, setSelectedSub] = useState('');
  const activeSub = subCategories.includes(selectedSub) ? selectedSub : '';

  const displayProducts = useMemo(() => {
    let list = tabProducts.filter(p => p.category === activeCat);
    if (activeSub) list = list.filter(p => (p.subCategory ?? '') === activeSub);
    return list;
  }, [tabProducts, activeCat, activeSub]);

  const handleTabChange = (tab: 'ON_SHELF' | 'OFF_SHELF') => {
    setActiveTab(tab);
    setSelectedCategory('');
    setSelectedSub('');
  };

  const handleCatChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSub('');
  };

  const onShelfCount = products.filter(p => p.status !== 'OffShelf').length;
  const offShelfCount = products.filter(p => p.status === 'OffShelf').length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1C1C1E] animate-fade-in">
      {/* Top Tabs */}
      <div className="flex items-center gap-8 px-8 border-b border-gray-100 dark:border-white/10 shrink-0">
        <button
          onClick={() => handleTabChange('ON_SHELF')}
          className={`py-4 text-base font-bold relative transition-colors ${
            activeTab === 'ON_SHELF'
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          在架商品
          <span className="ml-1.5 text-xs font-normal text-gray-400">({onShelfCount})</span>
          {activeTab === 'ON_SHELF' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071E3] dark:bg-[#0A84FF] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => handleTabChange('OFF_SHELF')}
          className={`py-4 text-base font-bold relative transition-colors ${
            activeTab === 'OFF_SHELF'
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          退市商品
          <span className="ml-1.5 text-xs font-normal text-gray-400">({offShelfCount})</span>
          {activeTab === 'OFF_SHELF' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071E3] dark:bg-[#0A84FF] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Categories */}
        <div className="w-48 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4">
          {categories.map(cat => {
            const count = tabProducts.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => handleCatChange(cat)}
                className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-colors border-l-2 flex items-center justify-between ${
                  activeCat === cat
                  ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <span className="truncate">{cat}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1 shrink-0">{count}</span>
              </button>
            );
          })}
          {categories.length === 0 && (
            <div className="px-5 py-8 text-xs text-gray-400 dark:text-gray-500 text-center">暂无分类</div>
          )}
        </div>

        {/* Middle Sidebar - Subcategories */}
        <div className="w-56 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4">
          <button
            onClick={() => setSelectedSub('')}
            className={`w-[calc(100%-16px)] text-left px-4 py-3 text-sm font-medium transition-colors mx-2 rounded-lg ${
              !activeSub
              ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF]'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            全部 <span className="text-[10px] text-gray-400 dark:text-gray-500">({tabProducts.filter(p => p.category === activeCat).length})</span>
          </button>
          {subCategories.map(sub => {
            if (!sub) return null;
            const count = tabProducts.filter(p => p.category === activeCat && (p.subCategory ?? '') === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSub(sub)}
                className={`w-[calc(100%-16px)] text-left px-4 py-3 text-sm font-medium transition-colors mx-2 rounded-lg ${
                  activeSub === sub
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF]'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <span className="truncate block">{sub}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{count} 个产品</span>
              </button>
            );
          })}
        </div>

        {/* Right Content - Product Cards */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
          <div className="max-w-4xl space-y-4">
            {displayProducts.length > 0 ? (
              displayProducts.map(product => (
                <div key={product.id} className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 p-6 hover:shadow-apple-hover hover:-translate-y-[1px] transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={product.name}>{product.name}</h3>
                        {product.tags?.map(tag => (
                          <span key={tag} className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span className="font-mono">{product.id}</span>
                        {product.subCategory && <><span>·</span><span>{product.subCategory}</span></>}
                        <span>·</span>
                        <span>{product.skus?.length ?? 0} 个 SKU</span>
                      </div>
                    </div>
                    <div className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === 'OnShelf'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'OnShelf' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                      {product.status === 'OnShelf' ? '在架' : '已退市'}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                    {product.description || `${product.name}，${product.category} - ${product.subCategory || '标准版'}`}
                  </p>

                  {/* Components from pool */}
                  {product.composition && product.composition.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Layers className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">包含组件</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">({product.composition.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.composition.map(comp => (
                          <span
                            key={comp.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium ${TYPE_STYLE[comp.type] || TYPE_STYLE.Component}`}
                          >
                            {TYPE_ICON[comp.type] || TYPE_ICON.Component}
                            {comp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="unified-button-primary bg-[#0071E3] hover:bg-[#0062CC]"
                    >
                      管理商品
                    </button>
                    <button
                      onClick={() => navigate(`/catalog/${product.id}/preview`)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      查看详情 <span className="text-lg leading-none">&rsaquo;</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                暂无{activeTab === 'ON_SHELF' ? '在架' : '退市'}商品
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
