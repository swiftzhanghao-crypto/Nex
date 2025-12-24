
import React, { useState } from 'react';
import { Product, ProductSku, InstallPackage, AtomicCapability, CapabilityType, SalesMerchandise, ProductRightDefinition, RightPackage, RightValue, RightDataType, SkuPricingOption, LicenseTypeDefinition, LicenseType, LicenseUnit } from '../types';
import { Plus, Trash2, Search, Sparkles, Loader2, Tag, Box, ArrowUpCircle, ArrowDownCircle, Archive, Eye, ShieldCheck, X, Download, Layers, Component, ShoppingBag, List, Clock, Briefcase, Package as PackageIcon, Check, Key } from 'lucide-react';
import { generateProductDescription, suggestCategory } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface ProductManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  atomicCapabilities: AtomicCapability[];
  setAtomicCapabilities: React.Dispatch<React.SetStateAction<AtomicCapability[]>>;
  merchandises: SalesMerchandise[];
  setMerchandises: React.Dispatch<React.SetStateAction<SalesMerchandise[]>>;
  productRights: ProductRightDefinition[];
  setProductRights: React.Dispatch<React.SetStateAction<ProductRightDefinition[]>>;
  rightPackages: RightPackage[];
  setRightPackages: React.Dispatch<React.SetStateAction<RightPackage[]>>;
  licenseDefs: LicenseTypeDefinition[];
  setLicenseDefs: React.Dispatch<React.SetStateAction<LicenseTypeDefinition[]>>;
}

const ProductManager: React.FC<ProductManagerProps> = ({ 
    products, setProducts, 
    atomicCapabilities, setAtomicCapabilities, 
    merchandises, setMerchandises,
    productRights, setProductRights,
    rightPackages, setRightPackages,
    licenseDefs, setLicenseDefs
}) => {
  const navigate = useNavigate();
  // Removed 'Merchandise' from activeTab options, renamed SPU/SKU labels internally but kept values for code stability
  const [activeTab, setActiveTab] = useState<'SPU' | 'SKU' | 'Rights' | 'Packages' | 'Atomic' | 'LicenseTypes'>('SPU');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAtomModalOpen, setIsAtomModalOpen] = useState(false);
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  
  // SPU State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempStock, setTempStock] = useState<number>(0);
  const [tempTag, setTempTag] = useState('');
  const [selectedLicenseDefId, setSelectedLicenseDefId] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    description: '',
    status: 'OffShelf',
    skus: [],
    installPackages: [],
    composition: [],
    tags: []
  });
  const [selectedAtomIds, setSelectedAtomIds] = useState<string[]>([]);
  
  // Atomic State
  const [atomForm, setAtomForm] = useState<Partial<AtomicCapability>>({ name: '', type: 'Component', description: '' });

  // Rights State
  const [rightsForm, setRightsForm] = useState<Partial<ProductRightDefinition>>({ name: '', code: '', dataType: 'Number', unit: '', description: '' });

  // Package State
  const [pkgForm, setPkgForm] = useState<Partial<RightPackage>>({ name: '', description: '', rights: [] });
  const [tempPkgRights, setTempPkgRights] = useState<RightValue[]>([]);

  // License Type State
  const [licenseForm, setLicenseForm] = useState<Partial<LicenseTypeDefinition>>({
      name: '', code: '', type: 'Subscription', period: 1, periodUnit: 'Year', scope: '1 User', description: ''
  });

  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestingCat, setSuggestingCat] = useState(false);

  // --- SPU Handlers ---
  const handleOpenModal = () => {
    setFormData({ name: '', category: '', description: '', status: 'OffShelf', skus: [], installPackages: [], composition: [], tags: [], packageId: '' });
    setSelectedAtomIds([]);
    setTempPrice(0);
    setTempStock(0);
    setSelectedLicenseDefId('');
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
    
    const composition = atomicCapabilities.filter(a => selectedAtomIds.includes(a.id));

    const newSkuCode = `SPEC-${Date.now().toString().slice(-4)}`;
    
    // Create initial SKU with selected license option
    let initialSku: ProductSku;
    
    // Find selected package info if exists
    const selectedPkg = rightPackages.find(p => p.id === formData.packageId);

    if (selectedLicenseDefId) {
        const licenseDef = licenseDefs.find(l => l.id === selectedLicenseDefId);
        initialSku = {
            id: `spec-${Date.now()}`,
            code: newSkuCode,
            name: '标准版',
            price: tempPrice,
            stock: tempStock,
            description: '默认创建的基础规格',
            status: 'Active',
            packageId: formData.packageId, // Inherit SPU package setting
            packageName: selectedPkg?.name,
            license: { // Fallback/Default
                type: licenseDef?.type || 'Perpetual',
                period: licenseDef?.period || 1,
                periodUnit: licenseDef?.periodUnit || 'Forever',
                scope: licenseDef?.scope || 'Standard'
            },
            pricingOptions: licenseDef ? [
                {
                    id: `opt-${Date.now()}`,
                    title: licenseDef.name,
                    price: tempPrice,
                    license: { 
                        type: licenseDef.type, 
                        period: licenseDef.period, 
                        periodUnit: licenseDef.periodUnit, 
                        scope: licenseDef.scope 
                    }
                }
            ] : []
        };
    } else {
        // Fallback if no license selected (should restrict in UI but keeping safe)
        initialSku = {
            id: `spec-${Date.now()}`,
            code: newSkuCode,
            name: '标准版',
            price: tempPrice,
            stock: tempStock,
            description: '基础规格',
            status: 'Active',
            packageId: formData.packageId, // Inherit SPU package setting
            packageName: selectedPkg?.name,
            license: { type: 'Perpetual', period: 1, periodUnit: 'Forever', scope: 'Standard' },
            pricingOptions: []
        };
    }

    const newProduct: Product = {
      id: newId,
      ...formData as Product,
      skus: [initialSku],
      composition
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
    if (confirm('确定要删除这个商品吗？')) {
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

  // --- License Type Handlers ---
  const handleSaveLicenseType = () => {
      if (!licenseForm.name || !licenseForm.code) return;
      const newId = `LT${(licenseDefs.length + 1).toString().padStart(3, '0')}`;
      const newDef: LicenseTypeDefinition = { id: newId, ...licenseForm as LicenseTypeDefinition };
      setLicenseDefs(prev => [...prev, newDef]);
      setIsLicenseModalOpen(false);
      setLicenseForm({ name: '', code: '', type: 'Subscription', period: 1, periodUnit: 'Year', scope: '1 User', description: '' });
  };

  // --- Atomic Handlers ---
  const handleSaveAtom = () => {
      if (!atomForm.name) return;
      const newId = `AC${(atomicCapabilities.length + 1).toString().padStart(3, '0')}`;
      const newAtom: AtomicCapability = {
          id: newId,
          ...atomForm as AtomicCapability
      };
      setAtomicCapabilities(prev => [...prev, newAtom]);
      setIsAtomModalOpen(false);
      setAtomForm({ name: '', type: 'Component', description: '' });
  };

  const handleDeleteAtom = (id: string) => {
      const usedIn = products.filter(p => p.composition?.some(c => c.id === id));
      if (usedIn.length > 0) {
          alert(`无法删除：该能力已被 ${usedIn.length} 个商品使用 (如: ${usedIn[0].name})`);
          return;
      }
      if (confirm('确定要删除此原子能力吗？')) {
          setAtomicCapabilities(prev => prev.filter(a => a.id !== id));
      }
  };

  // --- Rights Handlers ---
  const handleSaveRights = () => {
      if(!rightsForm.name || !rightsForm.code) return;
      const newId = `PR${(productRights.length + 1).toString().padStart(3, '0')}`;
      setProductRights(prev => [...prev, { id: newId, ...rightsForm as ProductRightDefinition }]);
      setIsRightsModalOpen(false);
      setRightsForm({ name: '', code: '', dataType: 'Number', unit: '', description: '' });
  };

  // --- Packages Handlers ---
  const handleOpenPkgModal = () => {
      setPkgForm({ name: '', description: '', rights: [] });
      setTempPkgRights([]);
      setIsPackageModalOpen(true);
  };

  const handleTogglePkgRight = (def: ProductRightDefinition) => {
      const exists = tempPkgRights.find(r => r.definitionId === def.id);
      if (exists) {
          setTempPkgRights(prev => prev.filter(r => r.definitionId !== def.id));
      } else {
          setTempPkgRights(prev => [...prev, { definitionId: def.id, name: def.name, value: def.dataType === 'Boolean' ? false : 0, unit: def.unit }]);
      }
  };

  const handleUpdatePkgRightValue = (defId: string, val: any) => {
      setTempPkgRights(prev => prev.map(r => r.definitionId === defId ? { ...r, value: val } : r));
  };

  const handleSavePackage = () => {
      if (!pkgForm.name) return;
      const newId = `PKG${(rightPackages.length + 1).toString().padStart(3, '0')}`;
      setRightPackages(prev => [...prev, { id: newId, ...pkgForm as RightPackage, rights: tempPkgRights }]);
      setIsPackageModalOpen(false);
  };

  const handleAIGenerate = async () => {
    if (!formData.name) return alert("请先输入商品名称。");
    setGeneratingAI(true);
    
    const atomNames = atomicCapabilities.filter(a => selectedAtomIds.includes(a.id)).map(a => a.name).join(', ');
    const context = atomNames ? `包含以下能力：${atomNames}。` : '';

    const descriptionPromise = generateProductDescription(
        formData.name || '', 
        formData.category || '通用', 
        `高效, 专业, 智能. ${context}`
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

  const getFilteredItems = () => {
      if (activeTab === 'SPU') {
          return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (activeTab === 'SKU') {
          const allSkus = products.flatMap(p => p.skus.map(s => ({ ...s, parentName: p.name, parentId: p.id })));
          return allSkus.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return [];
  };

  const currentItems = getFilteredItems();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const pageItems = currentItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  React.useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const getPriceRange = (product: Product) => {
      if (product.skus.length === 0) return '¥0.00';
      // Calculate min/max from all pricing options across all SKUs
      const allPrices = product.skus.flatMap(s => s.pricingOptions?.map(o => o.price) || [s.price]);
      const min = Math.min(...allPrices);
      const max = Math.max(...allPrices);
      if (min === max) return `¥${min.toLocaleString()}`;
      return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">商品中心</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理商品、规格及授权定价体系。</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-md overflow-x-auto">
            {['SPU', 'SKU', 'LicenseTypes', 'Rights', 'Packages', 'Atomic'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-2 rounded-sm text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-[#1C1C1E] shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                    {tab === 'SPU' ? '商品列表' : 
                     tab === 'SKU' ? '规格列表' : 
                     tab === 'LicenseTypes' ? '授权类型' : 
                     tab === 'Rights' ? '权益定义' : 
                     tab === 'Packages' ? '权益套餐' : '原子能力'}
                </button>
            ))}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6 animate-fade-in">
          {(activeTab !== 'Atomic' && activeTab !== 'Rights' && activeTab !== 'Packages' && activeTab !== 'LicenseTypes') && (
              <div className="flex justify-between items-center">
                  <div className="bg-white dark:bg-[#1C1C1E] p-2.5 rounded-md shadow-sm border border-gray-100 dark:border-white/10 flex items-center gap-3 w-80">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={`搜索 ${activeTab === 'SPU' ? '商品' : '规格'}...`} 
                        className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {activeTab === 'SPU' && (
                      <button 
                        onClick={handleOpenModal}
                        className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-4 py-2.5 rounded-md flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-sm text-sm font-medium"
                        >
                        <Plus className="w-4 h-4" /> 新增商品
                      </button>
                  )}
              </div>
          )}

          {/* SPU (Product) List */}
          {activeTab === 'SPU' && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
                    <tr>
                        <th className="p-4 pl-6">商品名称 / ID</th>
                        <th className="p-4">标签</th>
                        <th className="p-4">状态</th>
                        <th className="p-4">权益/套餐</th>
                        <th className="p-4">价格区间</th>
                        <th className="p-4">规格数</th>
                        <th className="p-4 text-right pr-6">操作</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-base">
                    {(pageItems as Product[]).map(product => (
                        <tr key={product.id} className={`group cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors ${product.status === 'OffShelf' ? 'opacity-60 grayscale' : ''}`}>
                        <td className="p-4 pl-6">
                            <button 
                            onClick={() => navigate(`/products/${product.id}`)}
                            className={`font-medium text-base hover:underline text-left ${product.status === 'OffShelf' ? 'text-gray-500 dark:text-gray-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                            >
                            {product.name}
                            </button>
                            <div className="text-sm text-gray-400 font-mono mt-0.5">{product.id}</div>
                        </td>
                        <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                                {product.tags?.map(t => (
                                    <span key={t} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-sm border border-gray-200 dark:border-white/5">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium ${
                                product.status === 'OnShelf' 
                                ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                : 'bg-gray-200 text-gray-600 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                            }`}>
                                {product.status === 'OnShelf' ? <ArrowUpCircle className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                                {product.status === 'OnShelf' ? '已上架' : '已下架'}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="flex flex-col gap-1 max-w-[200px]">
                                {product.packageId && (
                                    <div className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-sm w-fit mb-1 border border-purple-100">
                                        {rightPackages.find(p=>p.id===product.packageId)?.name}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                    {product.composition?.slice(0, 2).map((c, i) => (
                                        <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-sm border border-blue-100 dark:border-blue-800">
                                            {c.name}
                                        </span>
                                    ))}
                                    {(product.composition?.length || 0) > 2 && <span className="text-[10px] text-gray-400">...</span>}
                                </div>
                            </div>
                        </td>
                        <td className="p-4 text-base font-medium text-gray-900 dark:text-gray-300">
                            {getPriceRange(product)}
                        </td>
                        <td className="p-4">
                            <span className="text-base text-gray-600 dark:text-gray-400">{product.skus.length}</span>
                        </td>
                        <td className="p-4 text-right pr-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button 
                                onClick={() => navigate(`/products/${product.id}`)}
                                title="查看详情/编辑"
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleToggleStatus(product)}
                                title={product.status === 'OnShelf' ? "下架产品" : "上架产品"}
                                className={`p-2 rounded-full transition ${
                                    product.status === 'OnShelf' 
                                    ? 'text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
                                    : 'text-green-500 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                                }`}
                            >
                                {product.status === 'OnShelf' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          )}

          {/* SKU (Specification) List */}
          {activeTab === 'SKU' && (
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase">
                          <tr>
                              <th className="p-4 pl-6">规格编码</th>
                              <th className="p-4">规格名称</th>
                              <th className="p-4">所属商品</th>
                              <th className="p-4">授权类型数</th>
                              <th className="p-4">基准价格</th>
                              <th className="p-4">库存</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-base">
                          {(pageItems as any[]).map(sku => (
                              <tr key={sku.id} className="group hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors">
                                  <td className="p-4 pl-6 font-mono text-sm text-gray-500 dark:text-gray-400">{sku.code}</td>
                                  <td className="p-4 font-medium text-gray-900 dark:text-white">{sku.name}</td>
                                  <td className="p-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" onClick={() => navigate(`/products/${sku.parentId}`)}>{sku.parentName}</td>
                                  <td className="p-4">
                                      <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-sm text-xs text-gray-600 dark:text-gray-300">
                                          {sku.pricingOptions?.length || 0} 种定价
                                      </span>
                                  </td>
                                  <td className="p-4 font-bold text-gray-900 dark:text-white">¥{sku.price.toLocaleString()}</td>
                                  <td className="p-4 text-sm">{sku.stock}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          )}

          {/* License Type Management */}
          {activeTab === 'LicenseTypes' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">授权类型定义</h3>
                          <p className="text-sm text-gray-500">配置产品规格可引用的标准化授权模式。</p>
                      </div>
                      <button 
                        onClick={() => setIsLicenseModalOpen(true)}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-80 transition shadow-sm text-sm font-medium"
                        >
                        <Plus className="w-4 h-4" /> 新增授权类型
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {licenseDefs.map(def => (
                          <div key={def.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-lg border border-gray-100 dark:border-white/10 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-md">
                                          <Key className="w-4 h-4"/>
                                      </div>
                                      <h4 className="font-bold text-gray-900 dark:text-white">{def.name}</h4>
                                  </div>
                                  <span className="text-[10px] bg-gray-50 dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded-sm font-mono">{def.code}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 h-8 line-clamp-2">{def.description || '暂无描述'}</p>
                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-50 dark:border-white/5 pt-2">
                                  <div><span className="text-gray-400">类型:</span> <span className="dark:text-gray-300">{def.type}</span></div>
                                  <div><span className="text-gray-400">范围:</span> <span className="dark:text-gray-300">{def.scope}</span></div>
                                  <div className="col-span-2"><span className="text-gray-400">期限:</span> <span className="dark:text-gray-300">{def.period} {def.periodUnit}</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Rights Management Tab */}
          {activeTab === 'Rights' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">权益定义 (Rights Definition)</h3>
                          <p className="text-sm text-gray-500">定义产品中可控的权益项，如存储空间、并发数等。</p>
                      </div>
                      <button 
                        onClick={() => setIsRightsModalOpen(true)}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-80 transition shadow-sm text-sm font-medium"
                        >
                        <Plus className="w-4 h-4" /> 新增权益项
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productRights.map(right => (
                          <div key={right.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-lg border border-gray-100 dark:border-white/10 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-900 dark:text-white">{right.name}</h4>
                                  <span className="text-xs bg-gray-50 dark:bg-white/10 text-gray-500 px-2 py-0.5 rounded-sm font-mono">{right.code}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 h-8 line-clamp-2">{right.description}</p>
                              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 dark:border-white/5 pt-2">
                                  <span>类型: {right.dataType}</span>
                                  <span>单位: {right.unit || '-'}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Packages Management Tab */}
          {activeTab === 'Packages' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">权益套餐 (Rights Packages)</h3>
                          <p className="text-sm text-gray-500">组合多个权益项，形成标准化的产品权益配置。</p>
                      </div>
                      <button 
                        onClick={handleOpenPkgModal}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-80 transition shadow-sm text-sm font-medium"
                        >
                        <Plus className="w-4 h-4" /> 新增套餐
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {rightPackages.map(pkg => (
                          <div key={pkg.id} className="bg-white dark:bg-[#1C1C1E] p-5 rounded-lg border border-gray-100 dark:border-white/10 hover:shadow-md transition">
                              <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-md">
                                      <PackageIcon className="w-5 h-5"/>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900 dark:text-white">{pkg.name}</h4>
                                      <div className="text-xs text-gray-400">{pkg.id}</div>
                                  </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pkg.description}</p>
                              <div className="space-y-2 bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                                  {pkg.rights.map((rv, idx) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-gray-600 dark:text-gray-300">{rv.name}</span>
                                          <span className="font-bold text-gray-900 dark:text-white">
                                              {typeof rv.value === 'boolean' ? (rv.value ? '是' : '否') : rv.value} {rv.unit}
                                          </span>
                                      </div>
                                  ))}
                                  {pkg.rights.length === 0 && <span className="text-xs text-gray-400 italic">无权益项</span>}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Atomic Management Tab */}
          {activeTab === 'Atomic' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">原子能力列表</h3>
                          <p className="text-sm text-gray-500">这些是构成产品的最小功能单元。</p>
                      </div>
                      <button 
                        onClick={() => setIsAtomModalOpen(true)}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-80 transition shadow-sm text-sm font-medium"
                        >
                        <Plus className="w-4 h-4" /> 新增原子能力
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {atomicCapabilities.map(atom => (
                          <div key={atom.id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-lg border border-gray-100 dark:border-white/10 hover:shadow-md transition group relative">
                              <div className="flex justify-between items-start mb-2">
                                  <div className={`p-2 rounded-md ${atom.type === 'Component' ? 'bg-purple-100 text-purple-600' : atom.type === 'Service' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                      {atom.type === 'Component' ? <Component className="w-4 h-4"/> : atom.type === 'Service' ? <Sparkles className="w-4 h-4"/> : <Layers className="w-4 h-4"/>}
                                  </div>
                                  <button onClick={() => handleDeleteAtom(atom.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4"/></button>
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{atom.name}</h4>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3 h-8 line-clamp-2">{atom.description}</div>
                              <div className="flex justify-between items-center text-xs">
                                  <span className="font-mono text-gray-400">{atom.id}</span>
                                  <span className="bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-sm">{atom.type}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {/* SPU Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-3xl m-4 overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">新增商品</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">商品名称</label>
                    <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder="例如：WPS 365 商业版"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类别</label>
                    <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        placeholder={suggestingCat ? "AI 正在推测..." : "例如：公网套餐"}
                    />
                </div>
              </div>

              {/* Tags Input */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">商品标签</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags?.map(tag => (
                          <span key={tag} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-sm flex items-center gap-1">
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
                          className="flex-1 border border-gray-300 dark:border-white/10 rounded-sm p-2 bg-white dark:bg-black text-sm dark:text-white"
                      />
                      <button onClick={handleAddTag} className="px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-sm text-sm">添加</button>
                  </div>
              </div>

              {/* Package Selector */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <PackageIcon className="w-4 h-4"/> 关联权益套餐
                  </label>
                  <select 
                      value={formData.packageId || ''}
                      onChange={e => setFormData({...formData, packageId: e.target.value})}
                      className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2.5 bg-white dark:bg-black text-gray-900 dark:text-white outline-none"
                  >
                      <option value="">-- 不关联套餐 --</option>
                      {rightPackages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {formData.packageId && (
                      <div className="mt-2 bg-teal-50 dark:bg-teal-900/10 p-3 rounded-lg border border-teal-100 dark:border-teal-900/20 text-xs space-y-1">
                          {rightPackages.find(p=>p.id===formData.packageId)?.rights.map((r,i) => (
                              <div key={i} className="flex justify-between text-teal-700 dark:text-teal-300">
                                  <span>{r.name}</span>
                                  <strong>{r.value} {r.unit}</strong>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Atomic Composition Selector */}
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4"/> 能力组装 (Composition)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                      {atomicCapabilities.map(atom => {
                          const isSelected = selectedAtomIds.includes(atom.id);
                          return (
                              <button
                                  key={atom.id}
                                  onClick={() => {
                                      if (isSelected) setSelectedAtomIds(prev => prev.filter(id => id !== atom.id));
                                      else setSelectedAtomIds(prev => [...prev, atom.id]);
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-sm border transition flex items-center gap-1 ${
                                      isSelected 
                                      ? 'bg-indigo-600 text-white border-indigo-600' 
                                      : 'bg-white dark:bg-black text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-indigo-300'
                                  }`}
                              >
                                  {atom.name}
                                  {isSelected && <X className="w-3 h-3 ml-1" />}
                              </button>
                          )
                      })}
                  </div>
              </div>

              {/* Default Spec Config */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20 space-y-3">
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <Key className="w-4 h-4"/> 默认规格配置 (Default Spec)
                  </h4>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">选择授权模式</label>
                      <select 
                          className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2 bg-white dark:bg-black text-sm dark:text-white"
                          value={selectedLicenseDefId}
                          onChange={e => setSelectedLicenseDefId(e.target.value)}
                      >
                          <option value="">-- 选择授权类型 --</option>
                          {licenseDefs.map(def => (
                              <option key={def.id} value={def.id}>{def.name} ({def.type} / {def.period}{def.periodUnit})</option>
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
                            className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2 bg-white dark:bg-black text-sm dark:text-white"
                        />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">初始库存</label>
                      <input 
                        type="number" 
                        value={tempStock} 
                        onChange={(e) => setTempStock(parseInt(e.target.value))}
                        className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-2 bg-white dark:bg-black text-sm dark:text-white"
                      />
                    </div>
                  </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">商品描述</label>
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
                    className="w-full border border-gray-300 dark:border-white/10 rounded-sm p-3 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                    placeholder="输入商品描述..."
                ></textarea>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition font-medium">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-md hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-md">创建商品</button>
            </div>
          </div>
        </div>
      )}

      {/* License Type Modal */}
      {isLicenseModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-md p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">新增授权类型</h3>
                  <div className="space-y-4">
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">名称 (Name)</label><input value={licenseForm.name} onChange={e => setLicenseForm({...licenseForm, name: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" placeholder="如：年度订阅" /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">代码 (Code)</label><input value={licenseForm.code} onChange={e => setLicenseForm({...licenseForm, code: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white font-mono" placeholder="SUB-YEAR" /></div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">类型</label>
                              <select value={licenseForm.type} onChange={e => setLicenseForm({...licenseForm, type: e.target.value as any})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white">
                                  <option value="Subscription">订阅 (Subscription)</option>
                                  <option value="Perpetual">永久 (Perpetual)</option>
                                  <option value="FlatRate">固定价 (FlatRate)</option>
                                  <option value="PerUser">按人头 (PerUser)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">单位</label>
                              <select value={licenseForm.periodUnit} onChange={e => setLicenseForm({...licenseForm, periodUnit: e.target.value as any})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white">
                                  <option value="Year">年</option>
                                  <option value="Month">月</option>
                                  <option value="Day">日</option>
                                  <option value="Forever">永久</option>
                              </select>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div><label className="block text-xs font-medium text-gray-500 mb-1">期限值</label><input type="number" value={licenseForm.period} onChange={e => setLicenseForm({...licenseForm, period: Number(e.target.value)})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" /></div>
                          <div><label className="block text-xs font-medium text-gray-500 mb-1">适用范围</label><input value={licenseForm.scope} onChange={e => setLicenseForm({...licenseForm, scope: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" placeholder="如: 1 User" /></div>
                      </div>

                      <div><label className="block text-xs font-medium text-gray-500 mb-1">描述</label><textarea value={licenseForm.description} onChange={e => setLicenseForm({...licenseForm, description: e.target.value})} className="w-full border rounded-sm p-2 resize-none dark:bg-black dark:border-white/10 dark:text-white" rows={2}/></div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setIsLicenseModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md">取消</button>
                      <button onClick={handleSaveLicenseType} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md">保存</button>
                  </div>
              </div>
          </div>
      )}

      {/* Atomic Modal */}
      {isAtomModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-md p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">新增原子能力</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">能力名称</label>
                          <input value={atomForm.name} onChange={e => setAtomForm({...atomForm, name: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">类型</label>
                          <select value={atomForm.type} onChange={e => setAtomForm({...atomForm, type: e.target.value as CapabilityType})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white">
                              <option value="Component">组件 (Component)</option>
                              <option value="Feature">功能 (Feature)</option>
                              <option value="Rights">权益 (Rights)</option>
                              <option value="Service">服务 (Service)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">描述</label>
                          <textarea value={atomForm.description} onChange={e => setAtomForm({...atomForm, description: e.target.value})} className="w-full border rounded-sm p-2 resize-none dark:bg-black dark:border-white/10 dark:text-white" rows={3}/>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setIsAtomModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md">取消</button>
                      <button onClick={handleSaveAtom} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md">保存</button>
                  </div>
              </div>
          </div>
      )}

      {/* Rights Modal */}
      {isRightsModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-md p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">新增权益定义</h3>
                  <div className="space-y-4">
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">权益名称</label><input value={rightsForm.name} onChange={e => setRightsForm({...rightsForm, name: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" placeholder="如：云空间" /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">权益代码 (Code)</label><input value={rightsForm.code} onChange={e => setRightsForm({...rightsForm, code: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white font-mono" placeholder="storage_quota" /></div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">数据类型</label>
                          <select value={rightsForm.dataType} onChange={e => setRightsForm({...rightsForm, dataType: e.target.value as RightDataType})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white">
                              <option value="Number">数字 (Number)</option>
                              <option value="Boolean">布尔 (Boolean)</option>
                              <option value="Text">文本 (Text)</option>
                          </select>
                      </div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">单位</label><input value={rightsForm.unit} onChange={e => setRightsForm({...rightsForm, unit: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" placeholder="如：GB, 个" /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">描述</label><textarea value={rightsForm.description} onChange={e => setRightsForm({...rightsForm, description: e.target.value})} className="w-full border rounded-sm p-2 resize-none dark:bg-black dark:border-white/10 dark:text-white" rows={2}/></div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setIsRightsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md">取消</button>
                      <button onClick={handleSaveRights} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md">保存</button>
                  </div>
              </div>
          </div>
      )}

      {/* Package Modal */}
      {isPackageModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-lg shadow-2xl w-full max-w-2xl p-6 border border-white/10 max-h-[90vh] flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">新增权益套餐</h3>
                  <div className="space-y-4 overflow-y-auto flex-1">
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">套餐名称</label><input value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} className="w-full border rounded-sm p-2 dark:bg-black dark:border-white/10 dark:text-white" /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">描述</label><textarea value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} className="w-full border rounded-sm p-2 resize-none dark:bg-black dark:border-white/10 dark:text-white" rows={2}/></div>
                      
                      <div className="border-t pt-4 dark:border-white/10">
                          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">配置权益值</label>
                          <div className="grid grid-cols-1 gap-3">
                              {productRights.map(def => {
                                  const selected = tempPkgRights.find(r => r.definitionId === def.id);
                                  return (
                                      <div key={def.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${selected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-white/10'}`}>
                                          <input type="checkbox" checked={!!selected} onChange={() => handleTogglePkgRight(def)} className="w-4 h-4 rounded-sm" />
                                          <div className="flex-1">
                                              <div className="text-sm font-medium dark:text-white">{def.name}</div>
                                              <div className="text-xs text-gray-400">{def.description}</div>
                                          </div>
                                          {selected && (
                                              <div className="flex items-center gap-2">
                                                  {def.dataType === 'Boolean' ? (
                                                      <select 
                                                        value={String(selected.value)} 
                                                        onChange={(e) => handleUpdatePkgRightValue(def.id, e.target.value === 'true')}
                                                        className="border rounded-sm p-1 text-sm bg-white dark:bg-black dark:text-white dark:border-white/10"
                                                      >
                                                          <option value="true">是 (True)</option>
                                                          <option value="false">否 (False)</option>
                                                      </select>
                                                  ) : (
                                                      <input 
                                                        type={def.dataType === 'Number' ? 'number' : 'text'}
                                                        value={String(selected.value)}
                                                        onChange={(e) => handleUpdatePkgRightValue(def.id, def.dataType === 'Number' ? parseFloat(e.target.value) : e.target.value)}
                                                        className="border rounded-sm p-1 w-24 text-sm bg-white dark:bg-black dark:text-white dark:border-white/10"
                                                      />
                                                  )}
                                                  <span className="text-xs text-gray-500">{def.unit}</span>
                                              </div>
                                          )}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-white/10">
                      <button onClick={() => setIsPackageModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md">取消</button>
                      <button onClick={handleSavePackage} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md">保存套餐</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProductManager;