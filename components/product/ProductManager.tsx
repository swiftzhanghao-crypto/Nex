
import React, { useState, useMemo, useCallback } from 'react';
import { Product, ProductSku } from '../../types';
import { Plus, Search, Sparkles, Loader2, X, Key, Package as PackageIcon, RotateCcw, Filter, ChevronDown, Copy, Check } from 'lucide-react';
import { generateProductDescription, suggestCategory } from '../../services/geminiService';
import { useNavigate } from 'react-router-dom';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

const tabPermissionMap: Record<string, string> = {
  SPU: 'product_tab_spu',
  SKU: 'product_tab_sku',
};

const ProductManager: React.FC = () => {
  const {
    products, setProducts,
    authTypes,
    currentUser, roles,
  } = useAppContext();
  const navigate = useNavigate();

  const currentUserRole = roles.find(r => r.id === currentUser.role);
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  const allTabs = ['SPU', 'SKU'] as const;
  const visibleTabs = allTabs.filter(t => hasPermission(tabPermissionMap[t]));

  const [activeTab, setActiveTab] = useState<'SPU' | 'SKU'>(() =>
    (visibleTabs[0] as typeof allTabs[number]) || 'SPU'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  // SPU State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<'All' | 'OnShelf' | 'OffShelf'>('All');
  const [tableCopied, setTableCopied] = useState(false);
  
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempStock, setTempStock] = useState<number>(0);
  const [tempTag, setTempTag] = useState('');
  const [selectedAuthTypeId, setSelectedAuthTypeId] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    description: '',
    status: 'OffShelf',
    skus: [],
    installPackages: [],
    tags: []
  });


  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestingCat, setSuggestingCat] = useState(false);

  // --- SPU Handlers ---
  const handleOpenModal = () => {
    setFormData({ name: '', category: '', description: '', status: 'OffShelf', skus: [], installPackages: [], tags: [] });
    setTempPrice(0);
    setTempStock(0);
    setSelectedAuthTypeId('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    const maxId = products.reduce((max, p) => {
        const numStr = p.id.startsWith('PROD') ? p.id.substring(5) : (p.id.startsWith('P') ? p.id.substring(1) : p.id.substring(3));
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `PROD-${(maxId + 1).toString().padStart(4, '0')}`;

    const newSkuCode = `SPEC-${Date.now().toString().slice(-4)}`;

    const selectedAuthType = authTypes.find(a => a.id === selectedAuthTypeId);
    const isPeriodic = selectedAuthType?.period === '周期性';
    const defaultLicense = selectedAuthType ? {
        type: (isPeriodic ? 'Subscription' : 'Perpetual') as 'Subscription' | 'Perpetual',
        period: 1,
        periodUnit: (isPeriodic ? 'Year' : 'Forever') as 'Year' | 'Forever',
        scope: selectedAuthType.name.includes('用户') ? '1 User' : selectedAuthType.name.includes('服务器') ? 'Platform' : selectedAuthType.name.includes('场地') ? '100 Devices' : 'Standard'
    } : { type: 'Perpetual' as const, period: 1, periodUnit: 'Forever' as const, scope: 'Standard' };

    const initialSku: ProductSku = {
        id: `spec-${Date.now()}`,
        code: newSkuCode,
        name: '标准版',
        price: tempPrice,
        stock: tempStock,
        description: selectedAuthType ? '默认创建的基础规格' : '基础规格',
        status: 'Active',
        license: defaultLicense,
        pricingOptions: selectedAuthType ? [{
            id: `opt-${Date.now()}`,
            title: selectedAuthType.name,
            price: tempPrice,
            license: defaultLicense
        }] : []
    };

    const newProduct: Product = {
      id: newId,
      ...formData as Product,
      skus: [initialSku],
    };

    setProducts(prev => [...prev, newProduct]);
    setIsModalOpen(false);
  };

  const handleAddTag = () => {
      if(tempTag && !formData.tags?.includes(tempTag)) {
          setFormData(prev => ({...prev, tags: [...(prev.tags || []), tempTag]}));
          setTempTag('');
      }
  };

  const removeTag = (tag: string) => {
      setFormData(prev => ({...prev, tags: prev.tags?.filter(t => t !== tag)}));
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个产品吗？')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'OnShelf' ? 'OffShelf' : 'OnShelf';
    const actionName = newStatus === 'OnShelf' ? '上架' : '下架';
    if (confirm(`确定要${actionName} "${product.name}" 吗？`)) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.name) return alert("请先输入产品名称。");
    setGeneratingAI(true);

    const descriptionPromise = generateProductDescription(
        formData.name || '', 
        formData.category || '通用', 
        '高效, 专业, 智能'
    );

    if (!formData.category) {
        setSuggestingCat(true);
        const cat = await suggestCategory(formData.name);
        setFormData(prev => ({...prev, category: cat}));
        setSuggestingCat(false);
    }

    const desc = await descriptionPromise;
    setFormData(prev => ({ ...prev, description: desc }));
    setGeneratingAI(false);
  };

  const filteredItems = useMemo(() => {
      if (activeTab === 'SPU') {
          return products.filter(p => {
              const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
              const matchStatus = statusFilter === 'All' || p.status === statusFilter;
              return matchSearch && matchStatus;
          });
      }
      if (activeTab === 'SKU') {
          const allSkus = products.flatMap(p => p.skus.map(s => ({ ...s, parentName: p.name, parentId: p.id })));
          return allSkus.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return [];
  }, [activeTab, products, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(() => {
      const end = safePage * itemsPerPage;
      return filteredItems.slice(end - itemsPerPage, end);
  }, [filteredItems, safePage, itemsPerPage]);

  React.useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, activeTab, statusFilter]);

  const handleCopyTable = useCallback(() => {
      const headers = ['产品编号', '产品名称', '产品系统', '产品类型', '产品规格', '线上发货对接', '状态', '产品类', '产品分类', '产品系列'];
      const rows = (pageItems as Product[]).map(p => [
          p.id, p.name, p.category, p.productType || '', p.skus.map(s => s.name).join('、'),
          p.onlineDelivery || '', p.status === 'OnShelf' ? '已上架' : '已下架',
          p.productClass || '', p.productClassification || '', p.productSeries || ''
      ].join('\t'));
      navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n')).then(() => {
          setTableCopied(true);
          setTimeout(() => setTableCopied(false), 2000);
      });
  }, [pageItems]);

  if (!hasPermission('product_view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 dark:text-gray-600 gap-4 animate-fade-in">
        <PackageIcon className="w-14 h-14 opacity-20" />
        <p className="text-base font-semibold">无产品列表查看权限</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">请联系管理员分配 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-xs font-mono">product_view</code> 权限</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2 relative">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Left: title + tabs */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">产品管理</h1>
            <div className="flex bg-gray-100 dark:bg-white/10 p-0.5 rounded-lg overflow-x-auto">
                {visibleTabs.map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as typeof activeTab)}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-[#1C1C1E] shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                    >
                        {tab === 'SPU' ? '产品列表' : '规格列表'}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Search bar — matches OrderManager style */}
            <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
                <div className="relative flex-1 flex items-center min-w-0">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
                    <input
                        type="text"
                        placeholder={activeTab === 'SPU' ? '搜索产品编号、名称、分类…' : '搜索规格编码、名称…'}
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

            {/* Status filter */}
            {activeTab === 'SPU' && (
                <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] shadow-apple overflow-hidden">
                    {([['All', '全部'], ['OnShelf', '已上架'], ['OffShelf', '已下架']] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setStatusFilter(val)}
                            className={`px-3 text-xs font-semibold transition-colors whitespace-nowrap ${statusFilter === val ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'} ${val !== 'All' ? 'border-l border-gray-200 dark:border-white/10' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Reset */}
            <button
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition shadow-apple"
                title="重置筛选"
            >
                <RotateCcw className="w-4 h-4" />
            </button>

            {activeTab === 'SPU' && (
                <>
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>
                    <button onClick={handleOpenModal} className="unified-button-primary">
                        <Plus className="w-4 h-4" /> 新增产品
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="space-y-4">

          {/* SPU (Product) List */}
          {activeTab === 'SPU' && (
              <div className="unified-card overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[1400px]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: 140 }} />
                        <col style={{ width: 220 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 140 }} />
                        <col style={{ width: 160 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 100 }} />
                    </colgroup>
                    <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
                    <tr>
                        <th className="px-4 py-3 whitespace-nowrap sticky left-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]">产品编号</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品名称</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品系统</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品类型</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品规格</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">线上发货对接</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">状态</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品类</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品分类</th>
                        <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">产品系列</th>
                        <th className="px-4 py-3 whitespace-nowrap text-right sticky right-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.3)]">操作</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {(pageItems as Product[]).length === 0 ? (
                        <tr><td colSpan={11} className="py-20 text-center text-gray-400 dark:text-gray-500 text-sm">暂无匹配的产品数据</td></tr>
                    ) : (pageItems as Product[]).map((product) => {
                        const stickyBg = 'bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 dark:group-hover:bg-white/[0.03]';
                        return (
                        <tr key={product.id} className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${product.status === 'OffShelf' ? 'opacity-60' : ''}`}>
                        <td className={`px-4 py-3 whitespace-nowrap sticky left-0 z-20 ${stickyBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors`}>
                            <span onClick={() => navigate(`/products/${product.id}`)} className="text-[#0071E3] dark:text-[#FF2D55] hover:underline font-mono font-bold cursor-pointer">{product.id}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                            <span onClick={() => navigate(`/products/${product.id}`)} className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer truncate block" title={product.name}>{product.name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{product.category || '—'}</td>
                        <td className="px-4 py-3 max-w-[140px]">
                            <span className="text-gray-600 dark:text-gray-400 truncate block" title={product.productType || undefined}>{product.productType || '—'}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                            <span className="text-gray-500 dark:text-gray-400 truncate block" title={product.skus.map(s => s.name).join('、') || undefined}>{product.skus.map(s => s.name).join('、') || '—'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{product.onlineDelivery || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            {product.status === 'OnShelf'
                                ? <span className="unified-tag-green !rounded-full">已上架</span>
                                : <span className="unified-tag-gray !rounded-full">已下架</span>
                            }
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{product.productClass || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{product.productClassification || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap" title={product.productSeries || undefined}>{product.productSeries || '—'}</td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap sticky right-0 z-20 ${stickyBg} shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors`}>
                            <div className="flex justify-end gap-1.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(product); }}
                                className="px-1 py-0.5 text-[#0071E3] dark:text-[#0A84FF] hover:text-[#0060C0] dark:hover:text-[#007AEB] text-xs font-medium whitespace-nowrap transition"
                            >
                                {product.status === 'OnShelf' ? '下架' : '上架'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newId = `PROD-${Date.now().toString().slice(-6)}`;
                                    const cloned: Product = JSON.parse(JSON.stringify(product));
                                    cloned.id = newId;
                                    cloned.name = `${product.name} (副本)`;
                                    cloned.status = 'OffShelf';
                                    cloned.skus = cloned.skus.map(s => ({...s, id: `${s.id}-copy`}));
                                    setProducts(prev => [...prev, cloned]);
                                }}
                                className="px-1 py-0.5 text-gray-500 dark:text-gray-400 hover:text-[#0071E3] dark:hover:text-[#0A84FF] text-xs font-medium whitespace-nowrap transition"
                            >
                                复制
                            </button>
                            </div>
                        </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
                {/* Pagination — matches OrderManager */}
                <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredItems.length}</span> 条</span>
                        <button
                            onClick={handleCopyTable}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
                                tableCopied
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                    : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                            title="复制当前页表格数据（可粘贴到 Excel）"
                        >
                            {tableCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {tableCopied ? '已复制' : '复制表格'}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
                            <select
                                value={itemsPerPage}
                                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer transition"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                            >
                                {[20, 50, 100].map(n => <option key={n} value={n}>{n} 条</option>)}
                            </select>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">第 {safePage} / {totalPages} 页</span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
                        </div>
                    </div>
                </div>
              </div>
          )}

          {/* SKU (Specification) List */}
          {activeTab === 'SKU' && (
              <div className="unified-card overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
                  <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                          <col style={{ width: 160 }} />
                          <col style={{ width: 200 }} />
                          <col style={{ width: 240 }} />
                          <col style={{ width: 120 }} />
                          <col style={{ width: 140 }} />
                          <col style={{ width: 100 }} />
                      </colgroup>
                      <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
                          <tr>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">规格编码</th>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">规格名称</th>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">所属产品</th>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">授权类型数</th>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">基准价格</th>
                              <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10">库存</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {(pageItems as (ProductSku & { parentName: string; parentId: string })[]).length === 0 ? (
                              <tr><td colSpan={6} className="py-20 text-center text-gray-400 dark:text-gray-500 text-sm">暂无匹配的规格数据</td></tr>
                          ) : (pageItems as (ProductSku & { parentName: string; parentId: string })[]).map(sku => (
                              <tr key={sku.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0">
                                  <td className="px-4 py-3 font-mono font-bold text-gray-500 dark:text-gray-400">{sku.code}</td>
                                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{sku.name}</td>
                                  <td className="px-4 py-3">
                                      <span className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer" onClick={() => navigate(`/products/${sku.parentId}`)} title={sku.parentName}>{sku.parentName}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                      <span className="unified-tag-gray !rounded-full">
                                          {sku.pricingOptions?.length || 0} 种定价
                                      </span>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400 font-mono">¥{sku.price.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sku.stock}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  </div>
                  {/* Pagination — matches OrderManager */}
                  <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredItems.length}</span> 条</span>
                      <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
                              <select
                                  value={itemsPerPage}
                                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                  className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer transition"
                                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                              >
                                  {[20, 50, 100].map(n => <option key={n} value={n}>{n} 条</option>)}
                              </select>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">第 {safePage} / {totalPages} 页</span>
                          <div className="flex items-center gap-1.5">
                              <button onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
                              <button onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

      </div>

      {/* SPU Modal */}
      {isModalOpen && (

        <ModalPortal>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
          <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh] animate-modal-enter border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">新增产品</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">产品名称</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="例如：WPS 365 商业版"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类别</label>
                    <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder={suggestingCat ? "AI 正在推测..." : "例如：公网套餐"}
                    />
                </div>
              </div>

              {/* Tags Input */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">产品标签</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags?.map(tag => (
                          <span key={tag} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg flex items-center gap-1">
                              {tag} <button onClick={()=>removeTag(tag)} className="hover:text-indigo-900"><X className="w-3 h-3"/></button>
                          </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input 
                          value={tempTag}
                          onChange={e => setTempTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                          placeholder="输入标签后回车 (如: 公有云, 信创)"
                          className="flex-1 border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-sm dark:text-white"
                      />
                      <button onClick={handleAddTag} className="px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm">添加</button>
                  </div>
              </div>

              {/* Default Spec Config */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20 space-y-3">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <Key className="w-4 h-4"/> 默认规格配置 (Default Spec)
                  </h4>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">选择授权类型 <span className="text-[10px] text-gray-400">（来自系统配置）</span></label>
                      <select 
                          className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-sm dark:text-white"
                          value={selectedAuthTypeId}
                          onChange={e => setSelectedAuthTypeId(e.target.value)}
                      >
                          <option value="">-- 选择授权类型 --</option>
                          {authTypes.map(at => (
                              <option key={at.id} value={at.id}>{at.name}（{at.period}）</option>
                          ))}
                      </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">初始价格 (¥)</label>
                        <input 
                            type="number" 
                            value={tempPrice} 
                            onChange={(e) => setTempPrice(parseFloat(e.target.value))}
                            className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-sm dark:text-white"
                        />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">初始库存</label>
                      <input 
                        type="number" 
                        value={tempStock} 
                        onChange={(e) => setTempStock(parseInt(e.target.value))}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-2 bg-white dark:bg-black text-sm dark:text-white"
                      />
                    </div>
                  </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">产品描述</label>
                    <button 
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={generatingAI || !formData.name}
                        className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium disabled:opacity-50 transition"
                    >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {generatingAI ? '生成中...' : 'AI 自动填充'}
                    </button>
                </div>
                <textarea 
                    rows={3}
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                    placeholder="输入产品描述..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition font-medium">取消</button>
              <button onClick={handleSave} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover: shadow-apple">创建产品</button>
            </div>
          </div>
        </div>
        </ModalPortal>

      )}

    </div>
  );
};

export default ProductManager;
