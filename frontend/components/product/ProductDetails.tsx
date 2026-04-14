
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, InstallPackage, LinkedService, SalesScopeRow } from '../../types';
import { ArrowLeft, Package, ShieldCheck, Edit3, Plus, Trash2, List, Check, Box, Zap, User as UserIcon, Shield, Clock, Calendar, ToggleLeft, ToggleRight, Key, Sliders, Tag, PackageOpen, ChevronRight, ChevronDown, Home, CreditCard, Save, X, Download, Copy, BookOpen, Link2, Search, Building2, Cpu, FileText, Globe, Gift } from 'lucide-react';
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

const ProductDetails: React.FC = () => {
  const { products, setProducts, authTypes, atomicCapabilities, apiMode } = useAppContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  const persistProduct = useCallback((updatedProduct: Product) => {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      if (apiMode) {
          import('../../services/api').then(({ productApi }) =>
              productApi.update(updatedProduct.id, updatedProduct)
          ).catch(e => console.error('[API] Failed to persist product:', e));
      }
  }, [apiMode, setProducts]);

  // Editing States
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState<Product | null>(null);

  // Product Detail Tabs
  const [detailTab, setDetailTab] = useState<'info' | 'classification' | 'salesScope' | 'benefits' | 'packages' | 'linkedServices'>('info');
  const [copiedId, setCopiedId] = useState(false);

  // Edit Classification Modal
  const [isEditClassificationOpen, setIsEditClassificationOpen] = useState(false);
  const [classificationForm, setClassificationForm] = useState({ category: '', subCategory: '', productType: '' });

  // Linked Services
  const [isAddLinkedServiceOpen, setIsAddLinkedServiceOpen] = useState(false);
  const [linkedServiceSearch, setLinkedServiceSearch] = useState('');
  const [linkedServiceSelectedProductId, setLinkedServiceSelectedProductId] = useState('');
  const [linkedServiceSelectedSkuId, setLinkedServiceSelectedSkuId] = useState('');
  const [linkedServiceRequired, setLinkedServiceRequired] = useState(true);
  const [linkedServiceRemark, setLinkedServiceRemark] = useState('');
  const [expandedBillingRows, setExpandedBillingRows] = useState<Set<number>>(new Set());

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

  const classificationOptions = useMemo(() => {
    const cats = new Set<string>();
    const subCats = new Set<string>();
    const types = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.subCategory) subCats.add(p.subCategory);
      if (p.productType) types.add(p.productType);
    });
    return {
      categories: [...cats].sort(),
      subCategories: [...subCats].sort(),
      productTypes: [...types].sort(),
    };
  }, [products]);

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

    const existingSalesScope = product.salesScope;
    let salesScope = existingSalesScope;
    if (!salesScope || salesScope.length === 0) {
      const baseSpec = product.skus?.[0]?.name || '标准版';
      const prodName = product.name;
      const SALES_ORGS: { org: string; supply: string; listed: boolean; maintained: boolean }[] = [
        { org: '华东销售中心', supply: '珠海总部', listed: true, maintained: true },
        { org: '华南销售中心', supply: '珠海总部', listed: true, maintained: true },
        { org: '华北销售中心', supply: '北京分部', listed: true, maintained: true },
        { org: '全国直销中心', supply: '珠海总部', listed: true, maintained: true },
        { org: '政务事业部', supply: '珠海总部', listed: false, maintained: false },
      ];
      const matType = product.productCategory === '服务' ? '服务产品' : '软件产品';
      salesScope = SALES_ORGS.map(s => ({
        salesOrg: s.org,
        materialType: s.org === '政务事业部' ? `${matType}（政务）` : matType,
        authMaterialName: s.org === '政务事业部' ? `${prodName} ${baseSpec}-政务授权` : `${prodName} ${baseSpec}-永久授权`,
        mediaMaterialName: s.org === '政务事业部' ? `${prodName} ${baseSpec}-政务介质` : `${prodName} ${baseSpec}-电子介质`,
        supplyOrg: s.supply,
        status: s.listed ? 'listed' as const : 'unlisted' as const,
        billingStatus: s.maintained ? 'maintained' as const : 'unmaintained' as const,
        ...(s.maintained ? {
          billingTaxRefundType: '即征即退',
          billingInvoiceName: `${prodName} ${baseSpec}办公软件`,
          billingTaxRate: '13%',
          billingModelSpec: `${baseSpec}/5年/永久授权`,
          billingProductCode: '1060201030000000000',
          billingUnit: '套',
        } : {}),
      }));
    }

    setProductForm({ ...product, installPackages: mergedPkgs, salesScope });
  }, [product]);

  const filteredPkgs = useMemo(() => {
    const all = productForm?.installPackages || [];
    return all.filter(p => (p.packageType || 'public') === pkgTab);
  }, [productForm?.installPackages, pkgTab]);

  const pkgTotalPages = Math.max(1, Math.ceil(filteredPkgs.length / pkgPageSize));
  const pagedPkgs = filteredPkgs.slice((pkgPage - 1) * pkgPageSize, pkgPage * pkgPageSize);

  if (!product || !productForm) return <div className="p-10 text-center">Product Not Found</div>;

  const handleCopyId = () => {
    if (productForm.id) navigator.clipboard.writeText(productForm.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // --- CRUD Operations ---
  const handleSaveProduct = () => {
      if (!productForm) return;
      persistProduct(productForm);
      setIsEditingProduct(false);
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
    persistProduct(updated);
    setIsAddPkgModalOpen(false);
  };

  const handleDeletePkg = (pkgId: string) => {
    if (!productForm || !confirm('确定删除此安装包？')) return;
    const updated = { ...productForm, installPackages: (productForm.installPackages || []).filter(p => p.id !== pkgId) };
    setProductForm(updated);
    persistProduct(updated);
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header — modeled after OrderDetails */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
          <div className="flex items-center gap-4 pb-3">
              <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
                 <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="shrink-0">
                  <div className="flex items-center gap-2">
                      <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                          {productForm.name}
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
                          {productForm.id}
                      </span>
                      <span className={`!rounded-full ${productForm.status === 'OnShelf' ? 'unified-tag-green' : 'unified-tag-gray'}`}>
                          {productForm.status === 'OnShelf' ? '已上架' : '已下架'}
                      </span>
                  </div>
              </div>

              <div className="flex-1"></div>
          </div>

              <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-b border-gray-200 dark:border-white/10">
                  {([['info', '产品信息'], ['classification', '产品分类'], ['salesScope', '销售范围'], ['benefits', '权益信息'], ['packages', '安装包'], ['linkedServices', '关联服务']] as const).map(([key, label]) => (
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
      </div>

      <div className="p-4 lg:p-6 max-w-[2400px] mx-auto w-full space-y-4 animate-page-enter pb-20">
              {detailTab === 'info' && (<>
              {/* Basic Info - Full Width */}
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">基本信息</h3>
                  </div>
                  {isEditingProduct && <span className="text-xs text-gray-400">编辑模式</span>}
                </div>
                {isEditingProduct ? (
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">产品名称</label>
                        <input
                          value={productForm.name || ''}
                          onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">产品规格</label>
                        <input
                          value={productForm.skus?.[0]?.name || ''}
                          onChange={e => {
                            const updatedSkus = [...(productForm.skus || [])];
                            if (updatedSkus[0]) { updatedSkus[0] = { ...updatedSkus[0], name: e.target.value }; }
                            setProductForm({ ...productForm, skus: updatedSkus });
                          }}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">售后服务期限默认值</label>
                        <input
                          value={productForm.afterSalesServiceDefault || ''}
                          onChange={e => setProductForm({ ...productForm, afterSalesServiceDefault: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                          placeholder="如：1年"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">是否含升级保障期限</label>
                        <select
                          value={productForm.hasUpgradeWarranty ? '是' : '否'}
                          onChange={e => setProductForm({ ...productForm, hasUpgradeWarranty: e.target.value === '是' })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                        >
                          <option value="否">否</option>
                          <option value="是">是</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">是否包含售后服务期限</label>
                        <select
                          value={productForm.hasAfterSalesService ? '是' : '否'}
                          onChange={e => setProductForm({ ...productForm, hasAfterSalesService: e.target.value === '是' })}
                          className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-2.5 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 transition"
                        >
                          <option value="否">否</option>
                          <option value="是">是</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 leading-none">产品名称</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.name || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 leading-none">产品规格</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.skus?.[0]?.name || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 leading-none">售后服务期限默认值</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.afterSalesServiceDefault || '1年'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 leading-none">是否含升级保障期限</div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          productForm.hasUpgradeWarranty
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        }`}>{productForm.hasUpgradeWarranty ? '是' : '否'}</span>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 leading-none">是否包含售后服务期限</div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          productForm.hasAfterSalesService
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        }`}>{productForm.hasAfterSalesService ? '是' : '否'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 组件明细 */}
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">组件明细</h3>
                  <span className="text-xs text-gray-400 ml-1">({(productForm.composition || []).length})</span>
                </div>
                {(productForm.composition || []).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead className="unified-table-header">
                        <tr>
                          <th className="px-5 py-3 w-10">#</th>
                          <th className="px-5 py-3">组件名称</th>
                          <th className="px-5 py-3">主版本号</th>
                          <th className="px-5 py-3">组件性质</th>
                          <th className="px-5 py-3">组件编号</th>
                          <th className="px-5 py-3">组件描述</th>
                          <th className="px-5 py-3">生成序列号</th>
                          <th className="px-5 py-3">激活方式</th>
                          <th className="px-5 py-3">生成安装包</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {(productForm.composition || []).map((compRef, idx) => {
                          const full = atomicCapabilities.find(ac => ac.id === compRef.id);
                          const activationMethod = full?.generateSerial ? '在线激活' : full?.type === 'Service' ? '服务授权' : '独立组件';
                          const hasPackage = full?.type === 'Component' && full?.enabled !== false;
                          return (
                            <tr key={compRef.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                              <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                              <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{full?.name || compRef.name}</td>
                              <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{full?.version || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                              <td className="px-6 py-3 text-xs">
                                {full?.nature ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    full.nature === '自有' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : full.nature === '第三方采购' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                  }`}>{full.nature}</span>
                                ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                              </td>
                              <td className="px-6 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{full?.componentNo || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                              <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={full?.description}>{full?.description || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                              <td className="px-6 py-3 text-xs">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  full?.generateSerial ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                }`}>{full?.generateSerial ? '是' : '否'}</span>
                              </td>
                              <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{activationMethod}</td>
                              <td className="px-6 py-3 text-xs">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  hasPackage ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                }`}>{hasPackage ? '是' : '否'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Cpu className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <div className="text-sm text-gray-400 dark:text-gray-500">暂无组件构成信息</div>
                  </div>
                )}
              </div>

              {/* 授权类型明细 */}
              {(() => {
                const usedAuthNames = new Set<string>();
                const primarySku = productForm.skus?.[0];
                if (primarySku) {
                  (primarySku.pricingOptions || []).forEach(opt => { if (opt.title) usedAuthNames.add(opt.title); });
                }
                const productAuthTypes = authTypes.filter(at => usedAuthNames.has(at.name));
                return (
                  <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">授权类型明细</h3>
                      <span className="text-xs text-gray-400 ml-1">({productAuthTypes.length})</span>
                    </div>
                    {productAuthTypes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                          <thead className="unified-table-header">
                            <tr>
                              <th className="px-5 py-3 w-10">#</th>
                              <th className="px-5 py-3">授权类型</th>
                              <th className="px-5 py-3">定价周期</th>
                              <th className="px-5 py-3">购买单位</th>
                              <th className="px-5 py-3">辅助购买单位</th>
                              <th className="px-5 py-3">渠道授权书模版</th>
                              <th className="px-5 py-3">直签授权书模版</th>
                              <th className="px-5 py-3">在售状态</th>
                              <th className="px-5 py-3">状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {productAuthTypes.map((at, idx) => {
                              const purchaseUnit = at.name.includes('场地') ? '台' : at.name.includes('服务器') ? '台' : at.name.includes('零售') ? '套' : '套';
                              const auxUnit = at.name.includes('用户') ? '用户数' : at.name.includes('并发') ? '并发数' : at.name.includes('场地') ? '点' : at.name.includes('字数') || at.name.includes('额度') ? '额度' : at.name.includes('次数') || at.name.includes('计次') ? '次' : '点';
                              const channelTpl = `渠道授权书_${at.name}.docx`;
                              const directTpl = `直签授权书_${at.name}.docx`;
                              return (
                                <tr key={at.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                  <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                  <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{at.name}</td>
                                  <td className="px-6 py-3 text-xs">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      at.period === '周期性' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                                    }`}>{at.period}</span>
                                  </td>
                                  <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{purchaseUnit}</td>
                                  <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{auxUnit}</td>
                                  <td className="px-6 py-3 text-xs">
                                    <span className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer truncate max-w-[160px] block" title={channelTpl}>{channelTpl}</span>
                                  </td>
                                  <td className="px-6 py-3 text-xs">
                                    <span className="text-[#0071E3] dark:text-[#0A84FF] hover:underline cursor-pointer truncate max-w-[160px] block" title={directTpl}>{directTpl}</span>
                                  </td>
                                  <td className="px-6 py-3 text-xs">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">标准在售</span>
                                  </td>
                                  <td className="px-6 py-3 text-xs">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">启用</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                        <div className="text-sm text-gray-400 dark:text-gray-500">暂无关联的授权类型</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">在产品的授权方案中关联授权类型后，此处将自动展示</div>
                      </div>
                    )}
                  </div>
                );
              })()}
              </>)}


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
                        <thead className="unified-table-header">
                          <tr>
                            <th className="px-5 py-3">关联产品编号</th>
                            <th className="px-5 py-3">关联产品名称</th>
                            <th className="px-5 py-3">关联规格</th>
                            <th className="px-5 py-3">是否必选</th>
                            <th className="px-5 py-3">备注</th>
                            <th className="px-5 py-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {productForm.linkedServices!.map((svc, idx) => (
                            <tr key={svc.productId} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
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
                                      persistProduct(updated);
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
                    <div className="p-12 text-center">
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
                              ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
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
                      <thead className="unified-table-header">
                        <tr>
                          <th className="px-5 py-3">安装包编号</th>
                          <th className="px-5 py-3">交付物编号</th>
                          <th className="px-5 py-3">交付物名称</th>
                          <th className="px-5 py-3">发布平台</th>
                          <th className="px-5 py-3">安装包来源</th>
                          <th className="px-5 py-3">CPU</th>
                          <th className="px-5 py-3">操作系统</th>
                          <th className="px-5 py-3">安装包</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {pagedPkgs.length > 0 ? pagedPkgs.map(pkg => (
                          <tr key={pkg.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors duration-150">
                            <td className="px-5 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">{pkg.id}</td>
                            <td className="px-5 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">{pkg.deliveryItemId || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300">{pkg.deliveryItemName || pkg.name}</td>
                            <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">{pkg.platform || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">{pkg.source || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">{pkg.cpu || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400">{pkg.os || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                            <td className="py-3 text-xs">
                              <div className="flex items-center gap-2">
                                {pkg.url ? (
                                  <a href={pkg.url} target="_blank" rel="noreferrer" className="text-[#0071E3] dark:text-[#0A84FF] hover:underline truncate max-w-[140px] block">{pkg.name || '下载'}</a>
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
                            <td colSpan={8} className="p-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Package className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                                <span className="text-sm text-gray-400 dark:text-gray-500">暂无{pkgTab === 'public' ? '端' : '私有云'}安装包</span>
                                <button onClick={handleOpenAddPkg} className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline mt-1">点击新增</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredPkgs.length > 0 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredPkgs.length}</span> 条</span>
                    {pkgTotalPages > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-xs text-gray-400">{pkgPage} / {pkgTotalPages} 页</span>
                      <button onClick={() => setPkgPage(p => Math.max(1, p - 1))} disabled={pkgPage <= 1} className="unified-card px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition">上一页</button>
                      <button onClick={() => setPkgPage(p => Math.min(pkgTotalPages, p + 1))} disabled={pkgPage >= pkgTotalPages} className="unified-card px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition">下一页</button>
                    </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
              )}

              {/* 产品分类 */}
              {detailTab === 'classification' && (
              <div className="space-y-4">
                {/* 营管分类 */}
                <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">营管分类</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> 分类定义
                      </button>
                      <button
                        onClick={() => {
                          setClassificationForm({
                            category: productForm.category || '',
                            subCategory: productForm.subCategory || '',
                            productType: productForm.productType || '',
                          });
                          setIsEditClassificationOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] border border-gray-200 dark:border-white/10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> 编辑分类
                      </button>
                    </div>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品一级分类</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productCategory || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品二级分类</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.subCategory || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品条线</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productLine || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品类型</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.category || '—'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 mt-5">
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品系列</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productSeries || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品类</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productClass || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品分类</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productClassification || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">规格分类</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productType || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 财务分类 */}
                <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">财务分类</h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品条线-财务口径</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productLineFinance || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品类-财务口径</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productClassFinance || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1 leading-none">产品系列-财务口径</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{productForm.productSeriesFinance || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 关联业务标签 */}
                <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">关联业务标签</h3>
                  </div>
                  <div className="px-6 py-5">
                    {(productForm.tags?.length || 0) > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {productForm.tags!.map(tag => (
                          <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 dark:text-gray-500">暂无关联业务标签</div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* 销售范围 & 开票信息 */}
              {detailTab === 'salesScope' && (
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">销售范围 & 开票信息</h3>
                </div>
                {(productForm.salesScope?.length || 0) > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead className="unified-table-header">
                        <tr>
                          <th className="px-5 py-3 w-10">#</th>
                          <th className="px-5 py-3">销售组织</th>
                          <th className="px-5 py-3">物料类型</th>
                          <th className="px-5 py-3">授权物料名称</th>
                          <th className="px-5 py-3">介质物料名称</th>
                          <th className="px-5 py-3">供货组织</th>
                          <th className="px-5 py-3">状态</th>
                          <th className="px-5 py-3">开票信息</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {productForm.salesScope!.map((row, idx) => {
                          const isExpanded = expandedBillingRows.has(idx);
                          return (
                          <React.Fragment key={idx}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                            <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.salesOrg}</td>
                            <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{row.materialType}</td>
                            <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{row.authMaterialName}</td>
                            <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{row.mediaMaterialName}</td>
                            <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{row.supplyOrg}</td>
                            <td className="px-6 py-3 text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'listed'
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                              }`}>{row.status === 'listed' ? '已上架' : '未上架'}</span>
                            </td>
                            <td className="px-6 py-3 text-xs">
                              <button
                                onClick={() => {
                                  setExpandedBillingRows(prev => {
                                    const next = new Set(prev);
                                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                                    return next;
                                  });
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                  row.billingStatus === 'maintained'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                                }`}
                              >
                                {row.billingStatus === 'maintained' ? '已维护' : '未维护'}
                                {row.billingStatus === 'maintained' && (
                                  isExpanded
                                    ? <ChevronDown className="w-3 h-3" />
                                    : <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && row.billingStatus === 'maintained' && (
                            <tr className="bg-gray-50/80 dark:bg-white/[0.03]">
                              <td colSpan={8} className="px-6 py-0">
                                <div className="py-4 pl-8 border-l-2 border-blue-200 dark:border-blue-800 ml-2">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">开票信息 — {row.salesOrg}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-x-10 gap-y-4">
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">退税类型</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{row.billingTaxRefundType || '—'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">开票名称</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{row.billingInvoiceName || '—'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">产品税率</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{row.billingTaxRate || '—'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">开票制模型号</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{row.billingModelSpec || '—'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">开票商品编码</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">{row.billingProductCode || '—'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">随货单位</div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{row.billingUnit || '—'}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Globe className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂无销售范围数据</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">配置产品的销售组织后，此处将自动展示销售范围信息</div>
                  </div>
                )}
              </div>
              )}

              {detailTab === 'benefits' && (
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">权益信息</h3>
                </div>
                <div className="p-12 text-center">
                  <Gift className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <div className="text-sm text-gray-400 dark:text-gray-500">暂无权益信息</div>
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
                    persistProduct(updated);
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

      {/* Edit Classification Modal */}
      {isEditClassificationOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-lg p-6 border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">编辑产品分类</h3>
                <button onClick={() => setIsEditClassificationOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">产品一级分类</label>
                  <select
                    value={classificationForm.category}
                    onChange={e => setClassificationForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-400 transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="">请选择</option>
                    {classificationOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">产品二级分类</label>
                  <select
                    value={classificationForm.subCategory}
                    onChange={e => setClassificationForm(prev => ({ ...prev, subCategory: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-400 transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="">请选择</option>
                    {classificationOptions.subCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase">规格分类</label>
                  <select
                    value={classificationForm.productType}
                    onChange={e => setClassificationForm(prev => ({ ...prev, productType: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 bg-white dark:bg-black text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-400 transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="">请选择</option>
                    {classificationOptions.productTypes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsEditClassificationOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const updated = {
                      ...productForm,
                      category: classificationForm.category,
                      subCategory: classificationForm.subCategory,
                      productType: classificationForm.productType,
                    };
                    setProductForm(updated);
                    persistProduct(updated);
                    setIsEditClassificationOpen(false);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#FF2D55] rounded-xl hover:opacity-90 transition shadow-apple"
                >
                  保存
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
