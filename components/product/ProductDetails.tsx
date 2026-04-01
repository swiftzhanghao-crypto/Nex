
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductSku, SkuPricingOption, InstallPackage, LinkedService } from '../../types';
import { ArrowLeft, Package, ShieldCheck, Edit3, Plus, Trash2, List, Check, Box, Zap, User as UserIcon, Shield, Clock, Calendar, ToggleLeft, ToggleRight, Key, Sliders, Tag, PackageOpen, ChevronRight, Home, CreditCard, Save, X, Download, Copy, BookOpen, Link2, Search, Building2 } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';
import { ALL_INSTALL_PKG_ROWS } from '../../data/staticData';

const SALES_ORG_OPTIONS = [
  '珠海金山办公有限公司', '北京金山办公有限公司', '武汉金山办公有限公司',
  '长沙金山办公软件有限公司', '上海金山办公软件有限公司', '西安金山办公软件有限公司',
  '成都金山办公软件有限公司', '苏州金山办公软件有限公司', '贵州金山办公软件有限公司',
  '北京数科网维技术有限责任公司', '广州数科网维技术有限公司', '深圳数科信创技术有限责任公司',
  '天津数科网维技术有限公司', '湖北数科网维技术有限公司', '江西数科网维信息技术服务有限公司',
  '福建数科网维技术有限公司', '安徽数科网维技术有限公司', '四川数科网维技术有限公司',
  '重庆数科网维技术有限公司', '辽宁数科网维技术有限公司', '浙江数科网维技术有限公司',
  '陕西数科网维技术有限公司', '贵州数科网维技术有限公司', '山东数科信创技术有限责任公司',
];

const TAX_REFUND_OPTIONS = ['非退税', '退税', '即征即退', '先征后退'];

type ViewLevel = 'PRODUCT_DETAIL' | 'SKU_DETAIL' | 'LICENSE_DETAIL';

const ProductDetails: React.FC = () => {
  const { products, setProducts, authTypes } = useAppContext();
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

  // Product Detail Tabs
  const [detailTab, setDetailTab] = useState<'info' | 'attributes' | 'packages' | 'linkedServices'>('info');
  const [copiedId, setCopiedId] = useState(false);

  // Linked Services
  const [isAddLinkedServiceOpen, setIsAddLinkedServiceOpen] = useState(false);
  const [linkedServiceSearch, setLinkedServiceSearch] = useState('');
  const [linkedServiceSelectedProductId, setLinkedServiceSelectedProductId] = useState('');
  const [linkedServiceSelectedSkuId, setLinkedServiceSelectedSkuId] = useState('');
  const [linkedServiceRequired, setLinkedServiceRequired] = useState(true);
  const [linkedServiceRemark, setLinkedServiceRemark] = useState('');

  const linkedServiceCandidates = useMemo(() => {
    if (!productForm) return [];
    const existingIds = new Set((productForm.linkedServices || []).map(s => s.productId));
    return products.filter(p =>
      p.id !== productForm.id &&
      p.status === 'OnShelf' &&
      !existingIds.has(p.id) &&
      (linkedServiceSearch ? p.name.toLowerCase().includes(linkedServiceSearch.toLowerCase()) || p.id.toLowerCase().includes(linkedServiceSearch.toLowerCase()) : true)
    );
  }, [products, productForm, linkedServiceSearch]);

  const linkedServiceSelectedProduct = products.find(p => p.id === linkedServiceSelectedProductId);

  // Install Package States
  const [pkgTab, setPkgTab] = useState<'public' | 'private'>('public');
  const [pkgPage, setPkgPage] = useState(1);
  const pkgPageSize = 10;
  const [isAddPkgModalOpen, setIsAddPkgModalOpen] = useState(false);
  const [pkgForm, setPkgForm] = useState<Partial<InstallPackage>>({
    name: '', deliveryItemId: '', deliveryItemName: '', platform: '', source: '', cpu: '', os: '', url: '', packageType: 'public'
  });

  useEffect(() => {
    if (!product) return;
    const pkgRows = ALL_INSTALL_PKG_ROWS.filter(r => r.productId === product.id);
    const mappedPkgs: InstallPackage[] = pkgRows.map(r => ({
      id: r.id,
      name: r.deliveryItemName,
      version: r.productSpec || '',
      url: '',
      platform: r.platform,
      cpu: r.cpu,
      os: r.os,
      deliveryItemId: r.deliveryItemId !== '-' ? r.deliveryItemId : undefined,
      deliveryItemName: r.deliveryItemName,
      productSpec: r.productSpec,
      enabled: r.enabled,
      packageType: r.packageType,
      source: r.productLine,
    }));
    const existingPkgs = product.installPackages || [];
    const mergedPkgs = existingPkgs.length > 0 ? existingPkgs : mappedPkgs;
    setProductForm({ ...product, installPackages: mergedPkgs });
  }, [product]);

  const filteredPkgs = useMemo(() => {
    const all = productForm?.installPackages || [];
    return all.filter(p => (p.packageType || 'public') === pkgTab);
  }, [productForm?.installPackages, pkgTab]);

  const pkgTotalPages = Math.max(1, Math.ceil(filteredPkgs.length / pkgPageSize));
  const pagedPkgs = filteredPkgs.slice((pkgPage - 1) * pkgPageSize, pkgPage * pkgPageSize);

  if (!product || !productForm) return <div className="p-10 text-center">Product Not Found</div>;

  const handleCopyId = () => {
    const text = currentView === 'PRODUCT_DETAIL' ? productForm.id : currentView === 'SKU_DETAIL' ? selectedSku?.code : selectedLicense?.id;
    if (text) navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

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
      const authType = authTypes.find(a => a.id === selectedLicenseDefId);
      if (!authType) return;

      const isPeriodic = authType.period === '周期性';
      const newLicense: SkuPricingOption = {
          id: `opt-${Date.now()}`,
          title: authType.name,
          price: newLicensePrice,
          license: { 
              type: isPeriodic ? 'Subscription' : 'Perpetual', 
              period: 1, 
              periodUnit: isPeriodic ? 'Year' : 'Forever', 
              scope: authType.name.includes('用户') ? '1 User' : authType.name.includes('服务器') ? 'Platform' : authType.name.includes('场地') ? '100 Devices' : 'Standard'
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

  // --- Install Package Handlers ---
  const handleOpenAddPkg = () => {
    setPkgForm({ name: '', deliveryItemId: '', deliveryItemName: '', platform: '', source: '', cpu: '', os: '', url: '', packageType: pkgTab });
    setIsAddPkgModalOpen(true);
  };

  const handleSavePkg = () => {
    if (!pkgForm.name || !productForm) return;
    const newPkg: InstallPackage = {
      id: `PKG-${Date.now().toString().slice(-8)}`,
      name: pkgForm.name || '',
      version: '1.0',
      url: pkgForm.url || '',
      platform: pkgForm.platform,
      cpu: pkgForm.cpu,
      os: pkgForm.os,
      source: pkgForm.source,
      deliveryItemId: pkgForm.deliveryItemId,
      deliveryItemName: pkgForm.deliveryItemName,
      packageType: pkgForm.packageType || pkgTab,
      enabled: true,
    };
    const updated = { ...productForm, installPackages: [...(productForm.installPackages || []), newPkg] };
    setProductForm(updated);
    setProducts(prev => prev.map(p => p.id === product!.id ? updated : p));
    setIsAddPkgModalOpen(false);
  };

  const handleDeletePkg = (pkgId: string) => {
    if (!productForm || !confirm('确定删除此安装包？')) return;
    const updated = { ...productForm, installPackages: (productForm.installPackages || []).filter(p => p.id !== pkgId) };
    setProductForm(updated);
    setProducts(prev => prev.map(p => p.id === product!.id ? updated : p));
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header — modeled after OrderDetails */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
          <div className="flex items-center gap-4 pb-3">
              <button onClick={() => {
                  if(currentView === 'LICENSE_DETAIL') setCurrentView('SKU_DETAIL');
                  else if(currentView === 'SKU_DETAIL') goToProduct();
                  else navigate('/products');
              }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
                 <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="shrink-0">
                  <div className="flex items-center gap-2">
                      <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                          {currentView === 'PRODUCT_DETAIL' ? productForm.name :
                           currentView === 'SKU_DETAIL' ? `规格: ${selectedSku?.name}` :
                           `授权: ${selectedLicense?.title}`}
                      </h1>
                      <button
                          onClick={handleCopyId}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                          title="复制编号"
                      >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                          {currentView === 'PRODUCT_DETAIL' ? productForm.id : currentView === 'SKU_DETAIL' ? selectedSku?.code : selectedLicense?.id}
                      </span>
                      {currentView === 'PRODUCT_DETAIL' && (
                          <span className={`!rounded-full ${productForm.status === 'OnShelf' ? 'unified-tag-green' : 'unified-tag-gray'}`}>
                              {productForm.status === 'OnShelf' ? '已上架' : '已下架'}
                          </span>
                      )}
                      {currentView === 'PRODUCT_DETAIL' && productForm.productCategory && (
                          <span className="unified-tag-xs unified-tag-blue">{productForm.productCategory}</span>
                      )}
                      {currentView === 'PRODUCT_DETAIL' && productForm.productLine && (
                          <span className="unified-tag-xs unified-tag-indigo">{productForm.productLine}</span>
                      )}
                  </div>
              </div>

              {currentView === 'PRODUCT_DETAIL' && (
                  <div className="hidden md:flex items-center gap-2.5 border-l border-gray-200/60 dark:border-white/10 pl-4 shrink-0">
                      {([
                          { label: '产品系列', value: productForm.productSeries },
                          { label: '产品类型', value: productForm.productType },
                          { label: '规格数', value: `${productForm.skus?.length || 0}` },
                      ] as const).map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">{item.label}</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{item.value || '—'}</span>
                          </div>
                      ))}
                  </div>
              )}

              <div className="flex-1"></div>

              <div className="flex items-center gap-2 shrink-0">
                  {currentView === 'PRODUCT_DETAIL' && (
                      <button
                          onClick={() => navigate(`/catalog/${productForm.id}/preview`)}
                          className="unified-button-secondary whitespace-nowrap shrink-0 flex items-center gap-1.5"
                      >
                          <BookOpen className="w-3.5 h-3.5" />
                          产品目录详情
                      </button>
                  )}
                  {currentView === 'PRODUCT_DETAIL' && (
                      <button
                          onClick={isEditingProduct ? handleSaveProduct : () => setIsEditingProduct(true)}
                          className={`unified-button-secondary whitespace-nowrap shrink-0 ${isEditingProduct ? '!bg-[#0071E3] dark:!bg-[#FF2D55] !text-white !border-transparent' : ''}`}
                      >
                          {isEditingProduct ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          {isEditingProduct ? '保存' : '编辑'}
                      </button>
                  )}
                  {currentView === 'SKU_DETAIL' && (
                      <button
                          onClick={isEditingSku ? handleSaveSku : () => setIsEditingSku(true)}
                          className={`unified-button-secondary whitespace-nowrap shrink-0 ${isEditingSku ? '!bg-[#0071E3] dark:!bg-[#FF2D55] !text-white !border-transparent' : ''}`}
                      >
                          {isEditingSku ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          {isEditingSku ? '保存规格' : '编辑规格'}
                      </button>
                  )}
                  {currentView === 'LICENSE_DETAIL' && (
                      <button
                          onClick={isEditingLicense ? handleSaveLicense : () => setIsEditingLicense(true)}
                          className={`unified-button-secondary whitespace-nowrap shrink-0 ${isEditingLicense ? '!bg-[#0071E3] dark:!bg-[#FF2D55] !text-white !border-transparent' : ''}`}
                      >
                          {isEditingLicense ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          {isEditingLicense ? '保存授权' : '编辑授权'}
                      </button>
                  )}
              </div>
          </div>

          {currentView === 'PRODUCT_DETAIL' && (
              <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-b border-gray-200 dark:border-white/10">
                  {([['info', '产品信息'], ['attributes', '产品属性'], ['linkedServices', '关联服务'], ['packages', '安装包']] as const).map(([key, label]) => (
                      <button
                          key={key}
                          onClick={() => setDetailTab(key)}
                          className={`relative px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                              detailTab === key
                                  ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                      >
                          {label}
                          {key === 'linkedServices' && (productForm.linkedServices?.length || 0) > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{productForm.linkedServices?.length}</span>
                          )}
                          {key === 'packages' && (productForm.installPackages?.length || 0) > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{productForm.installPackages?.length}</span>
                          )}
                      </button>
                  ))}
              </div>
          )}
      </div>

      <div className="p-4 lg:p-6 max-w-[2400px] mx-auto w-full space-y-4 animate-page-enter pb-20">
          {currentView === 'PRODUCT_DETAIL' && (<>

              {detailTab === 'info' && (<>
              {/* Basic Info - Full Width */}
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">基本信息</h3>
                  {isEditingProduct && <span className="text-xs text-gray-400">编辑模式</span>}
                </div>
                {isEditingProduct ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {[
                      [
                        { label: '产品名称', key: 'name' },
                        { label: '产品类别', key: 'productCategory' },
                        { label: '产品条线', key: 'productLine' },
                      ],
                      [
                        { label: '产品类型', key: 'productType' },
                        { label: '产品类', key: 'productClass' },
                        { label: '产品分类', key: 'productClassification' },
                      ],
                      [
                        { label: '产品系列', key: 'productSeries' },
                        { label: '产品类-财务口径', key: 'productClassFinance' },
                        { label: '产品条线-财务口径', key: 'productLineFinance' },
                      ],
                      [
                        { label: '产品系列-财务口径', key: 'productSeriesFinance' },
                      ],
                      [
                        { label: '运维包服务内容', key: 'maintenanceContent' },
                      ],
                      [
                        { label: '运维包服务标准', key: 'maintenanceStandard' },
                      ],
                    ].map((row, ri) => (
                      <div key={ri} className="grid grid-cols-1 md:grid-cols-3">
                        {row.map(f => (
                          <div key={f.key} className="px-6 py-3">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{f.label}</label>
                            <input
                              value={(productForm as any)[f.key] || ''}
                              onChange={e => setProductForm({ ...productForm, [f.key]: e.target.value })}
                              className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2 rounded text-sm dark:text-white outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="px-6 py-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">是否含升级保障期限</label>
                        <select
                          value={productForm.hasUpgradeWarranty ? '是' : '否'}
                          onChange={e => setProductForm({ ...productForm, hasUpgradeWarranty: e.target.value === '是' })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2 rounded text-sm dark:text-white outline-none"
                        >
                          <option value="否">否</option>
                          <option value="是">是</option>
                        </select>
                      </div>
                      <div className="px-6 py-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">是否包含售后服务期限</label>
                        <select
                          value={productForm.hasAfterSalesService ? '是' : '否'}
                          onChange={e => setProductForm({ ...productForm, hasAfterSalesService: e.target.value === '是' })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2 rounded text-sm dark:text-white outline-none"
                        >
                          <option value="否">否</option>
                          <option value="是">是</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
                      {([
                        { label: '产品名称', value: productForm.name },
                        { label: '产品类别', value: productForm.productCategory || productForm.category },
                        { label: '产品条线', value: productForm.productLine },
                        { label: '产品类型', value: productForm.productType },
                        { label: '产品类', value: productForm.productClass },
                        { label: '产品分类', value: productForm.productClassification },
                        { label: '产品系列', value: productForm.productSeries },
                        { label: '产品类-财务口径', value: productForm.productClassFinance },
                        { label: '产品条线-财务口径', value: productForm.productLineFinance },
                        { label: '产品系列-财务口径', value: productForm.productSeriesFinance },
                        { label: '是否含升级保障期限', value: productForm.hasUpgradeWarranty ? '是' : '否' },
                        { label: '是否包含售后服务期限', value: productForm.hasAfterSalesService ? '是' : '否' },
                      ] as { label: string; value: string | undefined }[]).map((f, i) => (
                        <div key={i}>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">{f.label}</div>
                          {f.value && f.value !== '/' ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{f.value}</div>
                          ) : (
                            <div className="text-sm text-gray-300 dark:text-gray-600">—</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">运维包服务内容</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{productForm.maintenanceContent && productForm.maintenanceContent !== '/' ? productForm.maintenanceContent : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">运维包服务标准</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{productForm.maintenanceStandard && productForm.maintenanceStandard !== '/' ? productForm.maintenanceStandard : '—'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                  {/* SKU List */}
                  <div>
                      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
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
              </>)}

              {/* 产品属性配置 */}
              {detailTab === 'attributes' && (
              <div className="space-y-4">
                <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" /> 基础信息
                    </h3>
                    {isEditingProduct && <span className="text-xs text-gray-400">编辑模式</span>}
                  </div>
                  {isEditingProduct ? (
                    <div className="px-6 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">销售组织</label>
                          <select
                            value={productForm.salesOrgName || ''}
                            onChange={e => setProductForm({ ...productForm, salesOrgName: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                          >
                            <option value="">请选择销售组织</option>
                            {SALES_ORG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">退税类型</label>
                          <select
                            value={productForm.taxRefundType || ''}
                            onChange={e => setProductForm({ ...productForm, taxRefundType: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                          >
                            <option value="">请选择退税类型</option>
                            {TAX_REFUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">商务发货名称</label>
                          <input
                            value={productForm.businessDeliveryName || ''}
                            onChange={e => setProductForm({ ...productForm, businessDeliveryName: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                            placeholder="请输入商务发货名称"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
                        <div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品编号</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{productForm.id}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品名称</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.name}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">销售组织</div>
                          {productForm.salesOrgName ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.salesOrgName}</div>
                          ) : (
                            <div className="text-sm text-gray-300 dark:text-gray-600">—</div>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">退税类型</div>
                          {productForm.taxRefundType ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                productForm.taxRefundType === '非退税'
                                  ? 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              }`}>
                                {productForm.taxRefundType}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300 dark:text-gray-600">—</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
                        <div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">商务发货名称</div>
                          {productForm.businessDeliveryName ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.businessDeliveryName}</div>
                          ) : (
                            <div className="text-sm text-gray-300 dark:text-gray-600">—</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* 关联服务管理 */}
              {detailTab === 'linkedServices' && (
              <div className="space-y-4">
                <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-blue-500" /> 关联服务
                    </h3>
                    <button
                      onClick={() => {
                        setLinkedServiceSearch('');
                        setLinkedServiceSelectedProductId('');
                        setLinkedServiceSelectedSkuId('');
                        setLinkedServiceRequired(true);
                        setLinkedServiceRemark('');
                        setIsAddLinkedServiceOpen(true);
                      }}
                      className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white text-xs font-medium rounded-lg hover:opacity-80 transition shadow-apple flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加关联服务
                    </button>
                  </div>

                  {(productForm.linkedServices?.length || 0) > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/10">
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">关联产品编号</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">关联产品名称</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">关联规格</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">是否必选</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">备注</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {productForm.linkedServices!.map((svc, idx) => (
                            <tr key={svc.productId} className="group hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                              <td className="px-6 py-3.5 text-xs font-mono text-gray-600 dark:text-gray-400">{svc.productId}</td>
                              <td className="px-6 py-3.5">
                                <button
                                  onClick={() => navigate(`/products/${svc.productId}`)}
                                  className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline text-left"
                                >
                                  {svc.productName}
                                </button>
                              </td>
                              <td className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300">{svc.skuName || '—'}</td>
                              <td className="px-6 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  svc.required
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                }`}>
                                  {svc.required ? '必选' : '可选'}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-gray-500 dark:text-gray-400">{svc.remark || '—'}</td>
                              <td className="px-6 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    if (confirm(`确定移除关联服务「${svc.productName}」吗？`)) {
                                      const updated = { ...productForm, linkedServices: productForm.linkedServices!.filter((_, i) => i !== idx) };
                                      setProductForm(updated);
                                      setProducts(prev => prev.map(p => p.id === product!.id ? updated : p));
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                                  title="移除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <Link2 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                      <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">暂无关联服务</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">添加关联服务后，创建订单时选择此产品会自动带出关联的服务产品</div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Install Package Management */}
              {detailTab === 'packages' && (
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between px-6 pt-4">
                    <div className="flex gap-0">
                      {(['public', 'private'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => { setPkgTab(tab); setPkgPage(1); }}
                          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            pkgTab === tab
                              ? 'text-[#0071E3] dark:text-[#64D2FF] border-[#0071E3] dark:border-[#64D2FF]'
                              : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          {tab === 'public' ? '端安装包' : '私有云安装包'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">安装包</h3>
                    <button onClick={handleOpenAddPkg} className="px-4 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white text-xs font-medium rounded-lg hover:opacity-80 transition shadow-apple flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> 新增安装包
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">安装包编号</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">交付物编号</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">交付物名称</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">发布平台</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">安装包来源</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">cpu</th>
                          <th className="py-3 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">操作系统</th>
                          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">安装包</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {pagedPkgs.length > 0 ? pagedPkgs.map(pkg => (
                          <tr key={pkg.id} className="group hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-150">
                            <td className="py-3 pr-4 text-xs font-mono text-gray-600 dark:text-gray-400">{pkg.id}</td>
                            <td className="py-3 pr-4 text-xs font-mono text-gray-600 dark:text-gray-400">{pkg.deliveryItemId || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 pr-4 text-xs text-gray-700 dark:text-gray-300">{pkg.deliveryItemName || pkg.name}</td>
                            <td className="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">{pkg.platform || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">{pkg.source || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">{pkg.cpu || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 pr-4 text-xs text-gray-600 dark:text-gray-400">{pkg.os || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 text-xs">
                              <div className="flex items-center gap-2">
                                {pkg.url ? (
                                  <a href={pkg.url} target="_blank" rel="noreferrer" className="text-[#0071E3] dark:text-[#64D2FF] hover:underline truncate max-w-[140px] block">{pkg.name || '下载'}</a>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                                <button onClick={() => handleDeletePkg(pkg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition" title="删除">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Package className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                <span className="text-sm text-gray-400 dark:text-gray-500">暂无{pkgTab === 'public' ? '端' : '私有云'}安装包</span>
                                <button onClick={handleOpenAddPkg} className="text-xs text-[#0071E3] dark:text-[#64D2FF] hover:underline mt-1">点击新增</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredPkgs.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-medium text-gray-700 dark:text-gray-300">{filteredPkgs.length}</span> 条</span>
                    {pkgTotalPages > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{pkgPageSize}条/页</span>
                      <button onClick={() => setPkgPage(p => Math.max(1, p - 1))} disabled={pkgPage <= 1} className="px-2 py-1 border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition">&lt;</button>
                      <span className="px-2.5 py-1 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded text-xs font-medium">{pkgPage}</span>
                      <button onClick={() => setPkgPage(p => Math.min(pkgTotalPages, p + 1))} disabled={pkgPage >= pkgTotalPages} className="px-2 py-1 border border-gray-200 dark:border-white/10 rounded hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition">&gt;</button>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">前往</span>
                      <input
                        type="number"
                        min={1}
                        max={pkgTotalPages}
                        className="w-12 px-1.5 py-1 border border-gray-200 dark:border-white/10 rounded text-center text-xs bg-white dark:bg-black dark:text-white outline-none"
                        onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (v >= 1 && v <= pkgTotalPages) setPkgPage(v); } }}
                      />
                      <span className="text-gray-500 dark:text-gray-400">页</span>
                    </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
              )}
          </>)}

          {currentView === 'SKU_DETAIL' && skuForm && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                      <div className="unified-card dark:bg-[#1C1C1E] p-6 border-gray-100/50 dark:border-white/10">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">规格信息</h3>
                          {isEditingSku ? (
                              <div className="space-y-4">
                                  <div><label className="text-xs text-gray-500 mb-1 block">规格名称</label><input value={skuForm.name} onChange={e=>setSkuForm({...skuForm, name:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">编码 (Code)</label><input value={skuForm.code} onChange={e=>setSkuForm({...skuForm, code:e.target.value})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">基准价格</label><input type="number" value={skuForm.price} onChange={e=>setSkuForm({...skuForm, price:parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                                  <div><label className="text-xs text-gray-500 mb-1 block">库存</label><input type="number" value={skuForm.stock} onChange={e=>setSkuForm({...skuForm, stock:parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div><div className="text-xs text-gray-500 mb-1">规格名称</div><div className="text-sm font-medium dark:text-white">{skuForm.name}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">编码</div><div className="text-sm font-mono dark:text-gray-300">{skuForm.code}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">基准价格</div><div className="text-lg font-bold dark:text-white">¥{skuForm.price.toLocaleString()}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-1">库存</div><div className="text-sm dark:text-gray-300">{skuForm.stock}</div></div>
                              </div>
                          )}
                          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                              <button onClick={() => handleDeleteSku(skuForm.id)} className="w-full py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition">删除此规格</button>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
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
                  <div className="unified-card dark:bg-[#1C1C1E] p-8 border-gray-100/50 dark:border-white/10 space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">授权方案详情</h3>
                      {isEditingLicense ? (
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs text-gray-500 mb-1 block">授权类型 <span className="text-[10px] text-gray-400">（来自系统配置）</span></label>
                                  <select 
                                    value={authTypes.find(a => a.name === licenseForm.title)?.id || ''} 
                                    onChange={e => {
                                        const at = authTypes.find(a => a.id === e.target.value);
                                        if (at) {
                                            const isPeriodic = at.period === '周期性';
                                            setLicenseForm({...licenseForm, title: at.name, license: {
                                                type: isPeriodic ? 'Subscription' : 'Perpetual',
                                                period: licenseForm.license?.period || 1,
                                                periodUnit: isPeriodic ? 'Year' : 'Forever',
                                                scope: at.name.includes('用户') ? '1 User' : at.name.includes('服务器') ? 'Platform' : at.name.includes('场地') ? '100 Devices' : 'Standard'
                                            }});
                                        }
                                    }} 
                                    className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"
                                  >
                                      <option value="">-- 选择授权类型 --</option>
                                      {authTypes.map(at => <option key={at.id} value={at.id}>{at.name}（{at.period}）</option>)}
                                  </select>
                              </div>
                              <div><label className="text-xs text-gray-500 mb-1 block">价格 (¥)</label><input type="number" value={licenseForm.price} onChange={e=>setLicenseForm({...licenseForm, price:parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-black border p-2 rounded text-sm dark:text-white dark:border-white/10"/></div>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                  <div><div className="text-xs text-gray-500">授权类型</div><div className="font-bold dark:text-white">{licenseForm.title}</div></div>
                                  <div className="text-right"><div className="text-xs text-gray-500">价格</div><div className="font-bold text-xl text-blue-600 dark:text-[#FF2D55]">¥{licenseForm.price?.toLocaleString()}</div></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><div className="text-xs text-gray-500">定价周期</div><div className="font-medium dark:text-white">{licenseForm.license?.periodUnit === 'Forever' ? '非周期性' : '周期性'}</div></div>
                                  <div><div className="text-xs text-gray-500">NCC 业务类型</div><div className="font-medium dark:text-white">{authTypes.find(a => a.name === licenseForm.title)?.nccBiz || '-'}</div></div>
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

      {/* Add Install Package Modal */}
      {isAddPkgModalOpen && (
          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg p-6 border-white/10">
                  <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">新增安装包</h3>
                      <button onClick={() => setIsAddPkgModalOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"><X className="w-4 h-4 text-gray-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">安装包类型</label>
                              <select value={pkgForm.packageType} onChange={e => setPkgForm({...pkgForm, packageType: e.target.value as 'public' | 'private'})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none">
                                  <option value="public">端安装包</option>
                                  <option value="private">私有云安装包</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">交付物名称 *</label>
                              <input value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none" placeholder="安装包名称" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">交付物编号</label>
                              <input value={pkgForm.deliveryItemId} onChange={e => setPkgForm({...pkgForm, deliveryItemId: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none" placeholder="如 DLV-001" />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">交付物名称</label>
                              <input value={pkgForm.deliveryItemName} onChange={e => setPkgForm({...pkgForm, deliveryItemName: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none" placeholder="交付物描述" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">发布平台</label>
                              <select value={pkgForm.platform} onChange={e => setPkgForm({...pkgForm, platform: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none">
                                  <option value="">请选择</option>
                                  <option value="Windows">Windows</option>
                                  <option value="Linux">Linux</option>
                                  <option value="macOS">macOS</option>
                                  <option value="Android">Android</option>
                                  <option value="iOS">iOS</option>
                                  <option value="通用">通用</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">安装包来源</label>
                              <select value={pkgForm.source} onChange={e => setPkgForm({...pkgForm, source: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none">
                                  <option value="">请选择</option>
                                  <option value="自研">自研</option>
                                  <option value="第三方">第三方</option>
                                  <option value="OEM">OEM</option>
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CPU</label>
                              <select value={pkgForm.cpu} onChange={e => setPkgForm({...pkgForm, cpu: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none">
                                  <option value="">请选择</option>
                                  <option value="x86_64">x86_64</option>
                                  <option value="ARM64">ARM64</option>
                                  <option value="MIPS64">MIPS64</option>
                                  <option value="LoongArch">LoongArch</option>
                                  <option value="通用">通用</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">操作系统</label>
                              <select value={pkgForm.os} onChange={e => setPkgForm({...pkgForm, os: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none">
                                  <option value="">请选择</option>
                                  <option value="Windows">Windows</option>
                                  <option value="CentOS">CentOS</option>
                                  <option value="Ubuntu">Ubuntu</option>
                                  <option value="UOS">UOS</option>
                                  <option value="Kylin">Kylin</option>
                                  <option value="macOS">macOS</option>
                                  <option value="Android">Android</option>
                                  <option value="iOS">iOS</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">安装包链接</label>
                          <input value={pkgForm.url} onChange={e => setPkgForm({...pkgForm, url: e.target.value})} className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none" placeholder="https://..." />
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                      <button onClick={() => setIsAddPkgModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition text-sm">取消</button>
                      <button onClick={handleSavePkg} disabled={!pkgForm.name} className="px-5 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white text-sm font-medium rounded-lg hover:opacity-80 transition shadow-apple disabled:opacity-50">确认新增</button>
                  </div>
              </div>
          </div>
          </ModalPortal>
      )}

      {/* Add License Modal */}
      {isAddLicenseModalOpen && (

          <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md p-6 border-white/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">关联授权类型 <span className="text-xs font-normal text-gray-400">（来自系统配置）</span></h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">选择授权类型</label>
                          <select 
                              className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                              value={selectedLicenseDefId}
                              onChange={e => setSelectedLicenseDefId(e.target.value)}
                          >
                              <option value="">-- 请选择 --</option>
                              {authTypes.map(at => (
                                  <option key={at.id} value={at.id}>{at.name}（{at.period}）</option>
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
                                  const at = authTypes.find(a => a.id === selectedLicenseDefId);
                                  return at ? (
                                      <div>
                                          <div>授权类型: {at.name}</div>
                                          <div>定价周期: {at.period}</div>
                                          {at.nccBiz && <div>NCC 业务类型: {at.nccBiz}</div>}
                                          {at.nccIncome && <div>NCC 收入类型: {at.nccIncome}</div>}
                                      </div>
                                  ) : null;
                              })()}
                          </div>
                      )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                      <button onClick={() => setIsAddLicenseModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition text-sm">取消</button>
                      <button onClick={handleAddLicenseFromDef} disabled={!selectedLicenseDefId} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] hover:opacity-80 shadow-apple disabled:opacity-50">添加关联</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

      {/* Add Linked Service Modal */}
      {isAddLinkedServiceOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg p-6 border-white/10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-500" /> 添加关联服务
                </h3>
                <button onClick={() => setIsAddLinkedServiceOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">搜索产品</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={linkedServiceSearch}
                      onChange={e => { setLinkedServiceSearch(e.target.value); setLinkedServiceSelectedProductId(''); setLinkedServiceSelectedSkuId(''); }}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black text-sm dark:text-white outline-none focus:border-blue-400 transition"
                      placeholder="输入产品名称或编号搜索..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">选择产品</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg divide-y divide-gray-100 dark:divide-white/5">
                    {linkedServiceCandidates.length > 0 ? linkedServiceCandidates.slice(0, 20).map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setLinkedServiceSelectedProductId(p.id); setLinkedServiceSelectedSkuId(''); }}
                        className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                          linkedServiceSelectedProductId === p.id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
                            {p.productCategory && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                p.productCategory === '服务'
                                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              }`}>{p.productCategory}</span>
                            )}
                          </div>
                        </div>
                        {linkedServiceSelectedProductId === p.id && (
                          <Check className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                    )) : (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">未找到匹配的产品</div>
                    )}
                  </div>
                </div>

                {linkedServiceSelectedProduct && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">选择规格（可选）</label>
                    <select
                      value={linkedServiceSelectedSkuId}
                      onChange={e => setLinkedServiceSelectedSkuId(e.target.value)}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                    >
                      <option value="">-- 不指定规格（下单时选择）--</option>
                      {linkedServiceSelectedProduct.skus.filter(s => s.status === 'Active').map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code}) - ¥{s.price.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">关联类型</label>
                    <select
                      value={linkedServiceRequired ? 'required' : 'optional'}
                      onChange={e => setLinkedServiceRequired(e.target.value === 'required')}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                    >
                      <option value="required">必选</option>
                      <option value="optional">可选</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">备注</label>
                    <input
                      value={linkedServiceRemark}
                      onChange={e => setLinkedServiceRemark(e.target.value)}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm dark:text-white outline-none"
                      placeholder="如：必选运维服务"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                <button onClick={() => setIsAddLinkedServiceOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition text-sm">取消</button>
                <button
                  disabled={!linkedServiceSelectedProductId}
                  onClick={() => {
                    const sp = products.find(p => p.id === linkedServiceSelectedProductId);
                    if (!sp || !productForm) return;
                    const sku = sp.skus.find(s => s.id === linkedServiceSelectedSkuId);
                    const newSvc: LinkedService = {
                      productId: sp.id,
                      productName: sp.name,
                      skuId: sku?.id,
                      skuName: sku?.name,
                      required: linkedServiceRequired,
                      remark: linkedServiceRemark || undefined,
                    };
                    const updated = { ...productForm, linkedServices: [...(productForm.linkedServices || []), newSvc] };
                    setProductForm(updated);
                    setProducts(prev => prev.map(p => p.id === product!.id ? updated : p));
                    setIsAddLinkedServiceOpen(false);
                  }}
                  className="px-5 py-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white text-sm font-medium rounded-lg hover:opacity-80 transition shadow-apple disabled:opacity-50"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ProductDetails;
