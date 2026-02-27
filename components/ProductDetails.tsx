
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductSku, SkuPricingOption, RightPackage, LicenseType, LicenseUnit, LicenseTypeDefinition } from '../types';
import { ArrowLeft, Package, ShieldCheck, Edit3, Plus, Trash2, List, Check, Box, Zap, User as UserIcon, Shield, Layers, Clock, Calendar, ToggleLeft, ToggleRight, Key, Sliders, Tag, PackageOpen, ChevronRight, Home, CreditCard, Save, X, Download } from 'lucide-react';

interface ProductDetailsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  rightPackages?: RightPackage[];
  licenseDefs?: LicenseTypeDefinition[];
}

type ViewLevel = 'PRODUCT_DETAIL' | 'SKU_DETAIL' | 'LICENSE_DETAIL';

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, setProducts, rightPackages = [], licenseDefs = [] }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  const [currentView, setCurrentView] = useState<ViewLevel>('PRODUCT_DETAIL');
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<SkuPricingOption | null>(null);

  // Editing States
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isEditingSku, setIsEditingSku] = useState(false);
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [isAddLicenseModalOpen, setIsAddLicenseModalOpen] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState<Product | null>(null);
  const [skuForm, setSkuForm] = useState<ProductSku | null>(null);
  const [licenseForm, setLicenseForm] = useState<Partial<SkuPricingOption>>({});
  const [selectedLicenseDefId, setSelectedLicenseDefId] = useState('');
  const [newLicensePrice, setNewLicensePrice] = useState<number>(0);

  useEffect(() => { if (product) setProductForm(product); }, [product]);

  if (!product || !productForm) return <div className="p-10 text-center">Product Not Found</div>;

  // --- Navigation Helpers ---
  const goToProduct = () => {
      setCurrentView('PRODUCT_DETAIL');
      setSelectedSku(null);
      setSelectedLicense(null);
      setIsEditingSku(false);
      setIsEditingLicense(false);
  };

  const goToSku = (sku: ProductSku) => {
      setSelectedSku(sku);
      setSkuForm(sku);
      setCurrentView('SKU_DETAIL');
      setSelectedLicense(null);
      setIsEditingLicense(false);
  };

  const goToLicense = (license: SkuPricingOption) => {
      setSelectedLicense(license);
      setLicenseForm(license);
      setCurrentView('LICENSE_DETAIL');
  };

  // --- CRUD Operations ---

  // 1. Product Level
  const handleSaveProduct = () => {
      if (!productForm) return;
      setProducts(prev => prev.map(p => p.id === productForm.id ? productForm : p));
      setIsEditingProduct(false);
  };

  // 2. SKU Level
  const handleAddSku = () => {
      const newCode = `SPEC-${Date.now().toString().slice(-6)}`;
      const newSku: ProductSku = {
          id: `spec-${Date.now()}`,
          name: '新规格',
          code: newCode,
          price: 0,
          stock: 0,
          status: 'Active',
          pricingOptions: [],
          packageId: productForm.packageId, // Inherit SPU package by default
          packageName: rightPackages.find(p => p.id === productForm.packageId)?.name
      };
      const updatedProduct = { ...productForm, skus: [...productForm.skus, newSku] };
      setProductForm(updatedProduct);
      setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      goToSku(newSku);
      setIsEditingSku(true); // Auto enter edit mode
  };

  const handleSaveSku = () => {
      if (!skuForm || !selectedSku) return;
      const updatedSkus = productForm.skus.map(s => s.id === selectedSku.id ? skuForm : s);
      const updatedProduct = { ...productForm, skus: updatedSkus };
      setProductForm(updatedProduct);
      setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      setSelectedSku(skuForm);
      setIsEditingSku(false);
  };

  const handleDeleteSku = (skuId: string) => {
      if (confirm('确定删除此规格吗？')) {
          const updatedSkus = productForm.skus.filter(s => s.id !== skuId);
          const updatedProduct = { ...productForm, skus: updatedSkus };
          setProductForm(updatedProduct);
          setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
          if (selectedSku?.id === skuId) goToProduct();
      }
  };

  // 3. License Level
  const handleOpenAddLicense = () => {
      setSelectedLicenseDefId('');
      setNewLicensePrice(0);
      setIsAddLicenseModalOpen(true);
  };

  const handleAddLicenseFromDef = () => {
      if (!selectedSku || !selectedLicenseDefId) return;
      const def = licenseDefs.find(d => d.id === selectedLicenseDefId);
      if (!def) return;

      const newLicense: SkuPricingOption = {
          id: `opt-${Date.now()}`,
          title: def.name,
          price: newLicensePrice,
          license: { 
              type: def.type, 
              period: def.period, 
              periodUnit: def.periodUnit, 
              scope: def.scope 
          }
      };
      
      const updatedSku = { ...selectedSku, pricingOptions: [...(selectedSku.pricingOptions || []), newLicense] };
      setSkuForm(updatedSku); 
      setProductForm(prev => {
          if (!prev) return null;
          const updatedSkus = prev.skus.map(s => s.id === selectedSku.id ? updatedSku : s);
          return { ...prev, skus: updatedSkus };
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, skus: p.skus.map(s => s.id === selectedSku.id ? updatedSku : s) } : p));
      setSelectedSku(updatedSku);
      setIsAddLicenseModalOpen(false);
  };

  const handleDeleteLicense = (licenseId: string) => {
      if (!selectedSku) return;
      if (confirm('确定删除此授权选项吗？')) {
          const updatedOptions = (selectedSku.pricingOptions || []).filter(o => o.id !== licenseId);
          const updatedSku = { ...selectedSku, pricingOptions: updatedOptions };
          setSkuForm(updatedSku);
          setSelectedSku(updatedSku);
          
          setProductForm(prev => {
              if (!prev) return null;
              const updatedSkus = prev.skus.map(s => s.id === selectedSku.id ? updatedSku : s);
              return { ...prev, skus: updatedSkus };
          });
          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, skus: p.skus.map(s => s.id === selectedSku.id ? updatedSku : s) } : p));
      }
  };

  const handleSaveLicense = () => {
      if (!licenseForm.title || !selectedSku) return;
      const updatedOptions = (selectedSku.pricingOptions || []).map(o => o.id === selectedLicense?.id ? licenseForm as SkuPricingOption : o);
      const updatedSku = { ...selectedSku, pricingOptions: updatedOptions };
      setSkuForm(updatedSku);
      setSelectedSku(updatedSku);
      
      setProductForm(prev => {
          if (!prev) return null;
          const updatedSkus = prev.skus.map(s => s.id === selectedSku.id ? updatedSku : s);
          return { ...prev, skus: updatedSkus };
      });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, skus: p.skus.map(s => s.id === selectedSku.id ? updatedSku : s) } : p));
      
      setIsEditingLicense(false);
      setCurrentView('SKU_DETAIL');
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => {
              if(currentView === 'LICENSE_DETAIL') setCurrentView('SKU_DETAIL');
              else if(currentView === 'SKU_DETAIL') goToProduct();
              else navigate('/products');
          }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
             <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                      {currentView === 'PRODUCT_DETAIL' ? productForm.name : 
                       currentView === 'SKU_DETAIL' ? `Spec: ${selectedSku?.name}` : 
                       `License: ${selectedLicense?.title}`}
                  </h1>
                  {currentView === 'PRODUCT_DETAIL' && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${productForm.status === 'OnShelf' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {productForm.status === 'OnShelf' ? '已上架' : '已下架'}
                      </span>
                  )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 truncate">
                  <span className="font-mono">ID: {currentView === 'PRODUCT_DETAIL' ? productForm.id : currentView === 'SKU_DETAIL' ? selectedSku?.code : selectedLicense?.id}</span>
              </div>
          </div>
        </div>
        
        {currentView === 'PRODUCT_DETAIL' && (
            <button 
                onClick={isEditingProduct ? handleSaveProduct : () => setIsEditingProduct(true)}
                className={`w-full md:w-auto px-5 py-2 text-xs font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2
                ${isEditingProduct ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white' : 'bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'}`}
            >
                {isEditingProduct ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {isEditingProduct ? '保存商品' : '编辑商品'}
            </button>
        )}
        
        {currentView === 'SKU_DETAIL' && (
            <button 
                onClick={isEditingSku ? handleSaveSku : () => setIsEditingSku(true)}
                className={`w-full md:w-auto px-5 py-2 text-xs font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2
                ${isEditingSku ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white' : 'bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'}`}
            >
                {isEditingSku ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {isEditingSku ? '保存规格' : '编辑规格'}
            </button>
        )}

        {currentView === 'LICENSE_DETAIL' && (
            <button 
                onClick={isEditingLicense ? handleSaveLicense : () => setIsEditingLicense(true)}
                className={`w-full md:w-auto px-5 py-2 text-xs font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2
                ${isEditingLicense ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white' : 'bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'}`}
            >
                {isEditingLicense ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {isEditingLicense ? '保存授权' : '编辑授权'}
            </button>
        )}
      </div>

      <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
          {currentView === 'PRODUCT_DETAIL' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Product Info */}
                  <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">基本信息</h3>
                          {isEditingProduct ? (
                              <div className="space-y-4">
                                  <div><label className="text-xs text-gray-500 mb-1 block">商品名称</label><input value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">类别</label><input value={productForm.category} onChange={e=>setProductForm({...productForm, category:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">描述</label><textarea value={productForm.description} onChange={e=>setProductForm({...productForm, description:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10" rows={3}/></div>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div><div className="text-xs text-gray-500 mb-1">类别</div><div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.category}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">描述</div><div className="text-sm text-gray-600 dark:text-gray-300">{productForm.description}</div></div>
                                  <div className="flex flex-wrap gap-2 pt-2">
                                      {productForm.tags?.map(t => <span key={t} className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{t}</span>)}
                                  </div>
                              </div>
                          )}
                      </div>
                      
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">能力组成</h3>
                          <div className="space-y-2">
                              {productForm.composition?.map((c, i) => (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                      <Layers className="w-4 h-4 text-blue-500"/>
                                      <span className="text-sm dark:text-gray-300">{c.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Install Packages Section */}
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">安装包信息</h3>
                          {productForm.installPackages && productForm.installPackages.length > 0 ? (
                              <div className="space-y-3">
                                  {productForm.installPackages.map((pkg) => (
                                      <div key={pkg.id} className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 group">
                                          <div className="flex justify-between items-start mb-1">
                                              <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{pkg.name}</div>
                                              <a href={pkg.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 p-1 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                                                  <Download className="w-3.5 h-3.5" />
                                              </a>
                                          </div>
                                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                              <span>{pkg.version}</span>
                                              <span className="font-mono text-[10px]">{pkg.id}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-sm text-gray-400 italic">暂无安装包信息</div>
                          )}
                      </div>
                  </div>

                  {/* Right: SKU List */}
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                          <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">规格列表 (Specifications)</h3>
                              <button onClick={handleAddSku} className="text-blue-600 dark:text-[#FF2D55] text-sm font-medium flex items-center gap-1 hover:underline">
                                  <Plus className="w-4 h-4"/> 新增规格
                              </button>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-white/5">
                              {productForm.skus.map(sku => (
                                  <div key={sku.id} className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition flex justify-between items-center group cursor-pointer" onClick={() => goToSku(sku)}>
                                      <div>
                                          <div className="flex items-center gap-3">
                                              <div className="font-bold text-gray-900 dark:text-white">{sku.name}</div>
                                              <div className="text-xs font-mono text-gray-400">{sku.code}</div>
                                          </div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                              包含 {sku.pricingOptions?.length || 0} 种授权方案 · 库存 {sku.stock}
                                              {sku.packageName && <span className="ml-2 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">套餐: {sku.packageName}</span>}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="text-right">
                                              <div className="text-xs text-gray-400">基准价</div>
                                              <div className="font-bold text-gray-900 dark:text-white">¥{sku.price.toLocaleString()}</div>
                                          </div>
                                          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-[#FF2D55]" />
                                      </div>
                                  </div>
                              ))}
                              {productForm.skus.length === 0 && (
                                  <div className="p-8 text-center text-gray-400 text-sm">暂无规格，请点击右上角添加。</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {currentView === 'SKU_DETAIL' && skuForm && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">规格信息</h3>
                          {isEditingSku ? (
                              <div className="space-y-4">
                                  <div><label className="text-xs text-gray-500 mb-1 block">规格名称</label><input value={skuForm.name} onChange={e=>setSkuForm({...skuForm, name:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">编码 (Code)</label><input value={skuForm.code} onChange={e=>setSkuForm({...skuForm, code:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">基准价格</label><input type="number" value={skuForm.price} onChange={e=>setSkuForm({...skuForm, price:parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">库存</label><input type="number" value={skuForm.stock} onChange={e=>setSkuForm({...skuForm, stock:parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">权益套餐</label>
                                      <select 
                                          value={skuForm.packageId || ''} 
                                          onChange={e => {
                                              const pkg = rightPackages?.find(p => p.id === e.target.value);
                                              setSkuForm({ ...skuForm, packageId: e.target.value, packageName: pkg?.name });
                                          }} 
                                          className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"
                                      >
                                          <option value="">-- 继承商品默认或无 --</option>
                                          {rightPackages?.map(p => (
                                              <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div><div className="text-xs text-gray-500 mb-1">规格名称</div><div className="text-sm font-medium dark:text-white">{skuForm.name}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">编码</div><div className="text-sm font-mono dark:text-gray-300">{skuForm.code}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">基准价格</div><div className="text-lg font-bold dark:text-white">¥{skuForm.price.toLocaleString()}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">库存</div><div className="text-sm dark:text-gray-300">{skuForm.stock}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">权益套餐</div><div className="text-sm dark:text-gray-300">{skuForm.packageName || '默认/无'}</div></div>
                              </div>
                          )}
                          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                              <button onClick={() => handleDeleteSku(skuForm.id)} className="w-full py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition">删除此规格</button>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                          <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">授权方案 (License Configs)</h3>
                              <button onClick={handleOpenAddLicense} className="text-blue-600 dark:text-[#FF2D55] text-sm font-medium flex items-center gap-1 hover:underline">
                                  <Plus className="w-4 h-4"/> 关联新授权
                              </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                              {skuForm.pricingOptions?.map(opt => (
                                  <div key={opt.id} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-[#FF2D55] transition cursor-pointer bg-gray-50 dark:bg-white/5 group relative" onClick={() => goToLicense(opt)}>
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="font-bold text-gray-900 dark:text-white">{opt.title}</div>
                                          <div className="text-sm font-bold text-blue-600 dark:text-[#FF2D55]">¥{opt.price.toLocaleString()}</div>
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                          <div className="flex justify-between"><span>类型:</span><span>{opt.license.type}</span></div>
                                          <div className="flex justify-between"><span>期限:</span><span>{opt.license.period} {opt.license.periodUnit}</span></div>
                                          <div className="flex justify-between"><span>范围:</span><span>{opt.license.scope}</span></div>
                                      </div>
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                          <ChevronRight className="w-4 h-4 text-gray-400"/>
                                      </div>
                                  </div>
                              ))}
                              {(!skuForm.pricingOptions || skuForm.pricingOptions.length === 0) && (
                                  <div className="col-span-2 text-center py-8 text-gray-400 text-sm">暂无授权方案，请添加。</div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {currentView === 'LICENSE_DETAIL' && licenseForm && (
              <div className="max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">授权方案详情</h3>
                      {isEditingLicense ? (
                          <div className="space-y-4">
                              <div><label className="text-xs text-gray-500 mb-1 block">方案标题</label><input value={licenseForm.title} onChange={e=>setLicenseForm({...licenseForm, title:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                              <div><label className="text-xs text-gray-500 mb-1 block">价格 (¥)</label><input type="number" value={licenseForm.price} onChange={e=>setLicenseForm({...licenseForm, price:parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                              
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">授权类型</label>
                                      <select 
                                        value={licenseForm.license?.type} 
                                        onChange={e=>setLicenseForm({...licenseForm, license: {...licenseForm.license, type: e.target.value as LicenseType} as any})} 
                                        className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"
                                      >
                                          <option value="PerUser">PerUser</option>
                                          <option value="FlatRate">FlatRate</option>
                                          <option value="Subscription">Subscription</option>
                                          <option value="Perpetual">Perpetual</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">单位 (Period Unit)</label>
                                      <select 
                                        value={licenseForm.license?.periodUnit} 
                                        onChange={e=>setLicenseForm({...licenseForm, license: {...licenseForm.license, periodUnit: e.target.value as LicenseUnit} as any})} 
                                        className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"
                                      >
                                          <option value="Day">Day</option>
                                          <option value="Month">Month</option>
                                          <option value="Year">Year</option>
                                          <option value="Forever">Forever</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">期限值 (Period)</label>
                                      <input type="number" value={licenseForm.license?.period} onChange={e=>setLicenseForm({...licenseForm, license: {...licenseForm.license, period: parseInt(e.target.value)} as any})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">适用范围 (Scope)</label>
                                      <input value={licenseForm.license?.scope} onChange={e=>setLicenseForm({...licenseForm, license: {...licenseForm.license, scope: e.target.value} as any})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                  <div><div className="text-xs text-gray-500">方案标题</div><div className="font-bold dark:text-white">{licenseForm.title}</div></div>
                                  <div className="text-right"><div className="text-xs text-gray-500">价格</div><div className="font-bold text-xl text-blue-600 dark:text-[#FF2D55]">¥{licenseForm.price?.toLocaleString()}</div></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><div className="text-xs text-gray-500">授权类型</div><div className="font-medium dark:text-white">{licenseForm.license?.type}</div></div>
                                  <div><div className="text-xs text-gray-500">期限</div><div className="font-medium dark:text-white">{licenseForm.license?.period} {licenseForm.license?.periodUnit}</div></div>
                                  <div><div className="text-xs text-gray-500">适用范围</div><div className="font-medium dark:text-white">{licenseForm.license?.scope}</div></div>
                              </div>
                          </div>
                      )}
                      
                      <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                          <button onClick={() => handleDeleteLicense(licenseForm.id!)} className="w-full py-3 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition">删除此授权方案</button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Add License Modal */}
      {isAddLicenseModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-md p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">关联授权类型</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">选择授权模式</label>
                          <select 
                              className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                              value={selectedLicenseDefId}
                              onChange={e => setSelectedLicenseDefId(e.target.value)}
                          >
                              <option value="">-- 请选择 --</option>
                              {licenseDefs.map(def => (
                                  <option key={def.id} value={def.id}>{def.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">设定价格 (¥)</label>
                          <input 
                              type="number" 
                              value={newLicensePrice} 
                              onChange={e => setNewLicensePrice(parseFloat(e.target.value))} 
                              className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                          />
                      </div>
                      
                      {selectedLicenseDefId && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                              {(() => {
                                  const def = licenseDefs.find(d => d.id === selectedLicenseDefId);
                                  return def ? (
                                      <div>
                                          <div>类型: {def.type}</div>
                                          <div>范围: {def.scope}</div>
                                          <div>期限: {def.period} {def.periodUnit}</div>
                                      </div>
                                  ) : null;
                              })()}
                          </div>
                      )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                      <button onClick={() => setIsAddLicenseModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition text-sm">取消</button>
                      <button onClick={handleAddLicenseFromDef} disabled={!selectedLicenseDefId} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-lg hover:opacity-80 transition text-sm shadow-md disabled:opacity-50">添加关联</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProductDetails;
