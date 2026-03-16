import React, { useState } from 'react';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

interface ProductCatalogProps {
  products: Product[];
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ products }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ON_SHELF' | 'OFF_SHELF'>('ON_SHELF');
  
  // Mock categories based on the image
  const categories = [
    'Win端',
    'WPS365公有云',
    'WPS365私有云',
    '其他软件',
    '私有云单品',
    '信创端'
  ];
  
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // Mock subcategories based on the image
  const subCategories = [
    'PDF for Win',
    'WPS for Win',
    'WPS+办公云平台',
    'WPS+云套装',
    '流版套 for Win'
  ];

  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategories[0]);

  // Filter products based on active tab
  // In a real app, we would filter by category and subcategory as well
  const displayProducts = products.filter(p => 
    activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf'
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1C1C1E] animate-fade-in">
      {/* Top Tabs */}
      <div className="flex items-center gap-8 px-8 border-b border-gray-100 dark:border-white/10 shrink-0">
        <button 
          onClick={() => setActiveTab('ON_SHELF')}
          className={`py-4 text-base font-bold relative transition-colors ${
            activeTab === 'ON_SHELF' 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          在架商品
          {activeTab === 'ON_SHELF' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071E3] dark:bg-[#0A84FF] rounded-t-full"></div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('OFF_SHELF')}
          className={`py-4 text-base font-bold relative transition-colors ${
            activeTab === 'OFF_SHELF' 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          退市商品
          {activeTab === 'OFF_SHELF' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071E3] dark:bg-[#0A84FF] rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Categories */}
        <div className="w-48 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors border-l-2 ${
                selectedCategory === cat
                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/50 dark:bg-blue-900/10'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Middle Sidebar - Subcategories */}
        <div className="w-56 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4">
          {subCategories.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubCategory(sub)}
              className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors ${
                selectedSubCategory === sub
                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] rounded-r-lg mx-2 w-[calc(100%-16px)]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 mx-2 w-[calc(100%-16px)] rounded-lg'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Right Content - Product List */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
          <div className="max-w-4xl space-y-4">
            {displayProducts.length > 0 ? (
              displayProducts.map(product => (
                <div key={product.id} className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10 p-6 hover: transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h3>
                    <div className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                      {product.category || '专业版 / 单机版'}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                    {product.description || `这是${product.name}的详细产品描述，包含了该版本的主要功能特性与适用场景。`}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="unified-button-primary bg-[#0071E3] hover:"
                    >
                      管理商品
                    </button>
                    <button 
                      onClick={() => navigate(`/catalog/${product.id}/preview`)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      预览详情 <span className="text-lg leading-none">&rsaquo;</span>
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
