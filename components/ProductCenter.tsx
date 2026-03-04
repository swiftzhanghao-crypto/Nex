import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface ProductCenterProps {
  products: Product[];
}

const ProductCenter: React.FC<ProductCenterProps> = ({ products }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ON_SHELF' | 'OFF_SHELF'>('ON_SHELF');

    const categories = [
        'WPS365公有云',
        'WPS365私有云',
        '私有云单品',
        'Win端',
        '其他软件'
    ];
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);

    const subCategoryMap: Record<string, string[]> = {
        'WPS365公有云': [
            'WPS365标准版（政府）（服务）',
            'WPS365高级版',
            'WPS365旗舰版（政府）（服务）',
            'WPS365应用版（医疗）'
        ],
        'WPS365私有云': [
            'WPS365高级版（私有云）',
            'WPS365旗舰版（私有云）',
            'WPS365私有云增值服务包'
        ],
        '私有云单品': [
            'Web Office',
            'WPS365协作版（私有云）',
            '文档中台V7',
            '文档中心V7'
        ],
        'Win端': [
            'Win2019',
            'Win2019教育',
            'Win2023'
        ],
        '其他软件': [
            'WPS for Mac',
            'WPS for 鸿蒙',
            '第三方软件',
            '第三方实施服务及其他',
            '移动端'
        ]
    };

    const subCategories = subCategoryMap[selectedCategory] || [];
    const [selectedSubCategory, setSelectedSubCategory] = useState(subCategories[0]);

    // Reset subcategory when category changes
    React.useEffect(() => {
        const newSubs = subCategoryMap[selectedCategory] || [];
        setSelectedSubCategory(newSubs[0]);
    }, [selectedCategory]);

    const getCategoryCount = (category: string) => {
        return products.filter(p => 
            (activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf') &&
            p.category === category
        ).length;
    };

    const getSubCategoryCount = (category: string, subCategory: string) => {
        return products.filter(p => 
            (activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf') &&
            p.category === category &&
            p.subCategory === subCategory
        ).length;
    };

    const isSearching = searchTerm.trim().length > 0;

    const displayProducts = products.filter(p => 
        (activeTab === 'ON_SHELF' ? p.status !== 'OffShelf' : p.status === 'OffShelf') &&
        (isSearching 
            ? p.name.toLowerCase().includes(searchTerm.toLowerCase())
            : (p.category === selectedCategory && p.subCategory === selectedSubCategory)
        )
    );

    const getTagColor = (tag: string) => {
        const t = tag.toUpperCase();
        if (t.includes('IM')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
        if (t.includes('AI')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
        if (t.includes('生态')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-400 dark:border-white/5';
    };

    const getLicenseDisplay = (product: Product) => {
        const licenses = new Set<string>();
        // According to user request: one product has one spec, one spec has multiple license types
        const mainSku = product.skus[0];
        if (mainSku) {
            if (mainSku.pricingOptions && mainSku.pricingOptions.length > 0) {
                mainSku.pricingOptions.forEach(opt => {
                    licenses.add(opt.title);
                });
            } else if (mainSku.license) {
                // Fallback to basic license if no pricing options
                const { type, periodUnit } = mainSku.license;
                if (type === 'Subscription') {
                    if (periodUnit === 'Year') licenses.add('年授权');
                    else if (periodUnit === 'Month') licenses.add('月授权');
                    else licenses.add('用户订阅许可');
                } else if (type === 'PerUser') {
                    licenses.add('数量授权');
                } else if (type === 'Perpetual') {
                    licenses.add('永久授权');
                } else if (type === 'FlatRate') {
                    licenses.add('固定价授权');
                }
            }
        }
        return Array.from(licenses).join(' / ') || '标准授权';
    };

    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1C1C1E] overflow-hidden animate-fade-in relative" onMouseMove={handleMouseMove}>
            {/* Custom Tooltip */}
            {hoveredItem && (
                <div 
                    className="fixed z-[100] bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-lg font-medium pointer-events-none border border-white/20 backdrop-blur-md animate-in fade-in zoom-in duration-150"
                    style={{ 
                        left: mousePos.x + 15, 
                        top: mousePos.y + 15 
                    }}
                >
                    {hoveredItem}
                </div>
            )}

            {/* Header Section */}
            <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-white/10 py-4 px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6 flex-1">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">商品展示</h1>
                    <div className="relative flex-1 max-w-2xl">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索WPS商品关键词" 
                            className="w-full pl-10 pr-10 py-2 rounded-xl text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        {isSearching && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-4 ml-4">
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
                        <button 
                            onClick={() => setActiveTab('ON_SHELF')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                                activeTab === 'ON_SHELF' 
                                ? 'bg-white dark:bg-white/10 text-[#0071E3] dark:text-blue-400 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            在架商品
                        </button>
                        <button 
                            onClick={() => setActiveTab('OFF_SHELF')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                                activeTab === 'OFF_SHELF' 
                                ? 'bg-white dark:bg-white/10 text-[#0071E3] dark:text-blue-400 shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            退市商品
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Categories */}
                <div className="w-48 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4 bg-white dark:bg-[#1C1C1E]">
                {categories.map(cat => (
                    <button
                    key={cat}
                    onClick={() => {
                        setSelectedCategory(cat);
                        setSearchTerm(''); // Clear search when selecting category
                    }}
                    onMouseEnter={() => setHoveredItem(cat)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors border-l-2 flex items-center justify-between ${
                        !isSearching && selectedCategory === cat
                        ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                    >
                    <span className="truncate pr-2">{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        !isSearching && selectedCategory === cat 
                        ? 'bg-[#0071E3] text-white' 
                        : 'bg-gray-100 text-gray-400 dark:bg-white/5'
                    }`}>
                        {getCategoryCount(cat)}
                    </span>
                    </button>
                ))}
                </div>

                {/* Middle Sidebar - Subcategories */}
                <div className="w-56 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto py-4 bg-white dark:bg-[#1C1C1E]">
                {subCategories.map(sub => (
                    <button
                    key={sub}
                    onClick={() => {
                        setSelectedSubCategory(sub);
                        setSearchTerm(''); // Clear search when selecting sub-category
                    }}
                    onMouseEnter={() => setHoveredItem(sub)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors flex items-center justify-between ${
                        !isSearching && selectedSubCategory === sub
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] rounded-r-lg mx-2 w-[calc(100%-16px)]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 mx-2 w-[calc(100%-16px)] rounded-lg'
                    }`}
                    >
                    <span className="truncate pr-2">{sub}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        !isSearching && selectedSubCategory === sub 
                        ? 'bg-[#0071E3]/10 text-[#0071E3]' 
                        : 'bg-gray-50 text-gray-400 dark:bg-white/5'
                    }`}>
                        {getSubCategoryCount(selectedCategory, sub)}
                    </span>
                    </button>
                ))}
                </div>

                {/* Right Content - Product List */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black/20">
                <div className="max-w-4xl space-y-4">
                    {isSearching && (
                        <div className="mb-6 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                找到 <span className="font-bold text-[#0071E3]">{displayProducts.length}</span> 个与“<span className="font-bold text-gray-900 dark:text-white">{searchTerm}</span>”相关的商品
                            </div>
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="text-xs text-[#0071E3] hover:underline"
                            >
                                清除搜索
                            </button>
                        </div>
                    )}
                    {displayProducts.length > 0 ? (
                    displayProducts.map(product => (
                        <div key={product.id} className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{product.name}</h3>
                                    <div className="text-[10px] text-gray-400 font-mono">{product.id}</div>
                                </div>
                                <div className="flex gap-2">
                                    {product.tags?.map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${getTagColor(tag)}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-x-8 gap-y-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">规格:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {product.skus.slice(0, 1).map(sku => (
                                            <span key={sku.id} className="bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                                                {sku.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">授权:</span>
                                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                        {getLicenseDisplay(product)}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => navigate(`/catalog/${product.id}/preview`)}
                                className="absolute bottom-4 right-5 bg-[#0071E3] hover:bg-blue-600 text-white px-5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm opacity-90 hover:opacity-100"
                            >
                                预览详情
                            </button>
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

export default ProductCenter;
