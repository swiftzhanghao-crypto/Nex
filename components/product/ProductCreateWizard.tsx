import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Product, ProductSku, InstallPackage, SalesScopeRow,
  BenefitProduct, PublicCloudBenefitType, PrivateCloudBenefitType,
  PublicCloudBenefit, PrivateCloudBenefit,
  MaterialListItem, AtomicCapability,
} from '../../types';
import { ArrowLeft, Check, ChevronRight, Save } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { generateProductDescription } from '../../services/geminiService';
import { fetchMaterials } from '../../services/materialService';
import { fetchPublicCloudBenefitProducts, fetchPrivateCloudBenefitProducts } from '../../services/benefitProductService';
import { fetchDeployPackageById } from '../../services/deployPackageService';
import { resolvePurchaseUnit, resolveAuxPurchaseUnit } from '../../utils/authTypeDefaults';
import {
  DRAFT_STORAGE_KEY,
  STEPS,
  type AuthTypeConfig,
  type ProductDraft,
  type MaintenanceField,
} from './product-wizard/constants';
import StepInfo from './product-wizard/StepInfo';
import StepClassification from './product-wizard/StepClassification';
import StepSalesScope from './product-wizard/StepSalesScope';
import StepBenefits from './product-wizard/StepBenefits';
import StepPackages from './product-wizard/StepPackages';
import ProductWizardModals from './product-wizard/ProductWizardModals';

const ProductCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { products, setProducts, authTypes, atomicCapabilities, salesOrganizations } = useAppContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [draftSavedTip, setDraftSavedTip] = useState(false);

  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    category: '',
    subCategory: '',
    description: '',
    status: 'OffShelf',
    tags: [],
    skus: [],
    composition: [],
    installPackages: [],
    salesScope: [],
    publicCloudBenefits: [],
    privateCloudBenefits: [],
    salesChannels: [],
    sellableCustomerTypes: [],
    sellableChannelLevels: [],
    productType: '',
    productCategory: '',
    productLine: '',
    productSeries: '',
    productClass: '',
    productClassification: '',
    productClassFinance: '',
    productLineFinance: '',
    productSeriesFinance: '',
    afterSalesServiceDefault: '1年',
    hasUpgradeWarranty: false,
    hasAfterSalesService: true,
    maintenanceContent: '',
    maintenanceStandard: '',
    productKind: '通用产品/非维保服务产品',
  });

  const [skuName, setSkuName] = useState('标准版');
  const fullProductName = useMemo(() => {
    const name = (form.name || '').trim();
    const sku = skuName.trim();
    if (name && sku) return `${name} ${sku}`;
    return name || sku || '';
  }, [form.name, skuName]);
  const [selectedAuthTypeIds, setSelectedAuthTypeIds] = useState<string[]>([]);
  const [authTypeConfigs, setAuthTypeConfigs] = useState<Record<string, AuthTypeConfig>>({});
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  // 授权类型选择器
  const [isAuthPickerOpen, setIsAuthPickerOpen] = useState(false);
  const [authPickerSearch, setAuthPickerSearch] = useState('');

  // 组件选择器
  const [isComponentPickerOpen, setIsComponentPickerOpen] = useState(false);
  const [componentPickerSearch, setComponentPickerSearch] = useState('');

  // Install package form
  const [isAddPkgOpen, setIsAddPkgOpen] = useState(false);
  const [pkgTab, setPkgTab] = useState<'public' | 'private'>('public');
  const [pkgForm, setPkgForm] = useState<Partial<InstallPackage>>({
    name: '', platform: '', source: 'SMS手工维护', cpu: '', os: '', url: '', packageType: 'public',
    deliveryItemId: '', deliveryItemName: '',
  });
  // 私有云部署包查询状态
  const [deployPkgLoading, setDeployPkgLoading] = useState(false);
  const [deployPkgError, setDeployPkgError] = useState<string | null>(null);
  // 私有云：更新运维聚合平台数据
  const [refreshDeployPkgLoading, setRefreshDeployPkgLoading] = useState(false);

  // Sales scope
  const [showAddSalesOrg, setShowAddSalesOrg] = useState(false);
  const [salesOrgPickerSelected, setSalesOrgPickerSelected] = useState<Set<string>>(new Set());
  const [salesOrgPickerSearch, setSalesOrgPickerSearch] = useState('');

  // 权益信息当前 Tab：公有云 / 私有云
  const [benefitTab, setBenefitTab] = useState<'public' | 'private'>('public');
  // 权益关联：当前选中的"权益类型"（每个云一个）
  const [publicBenefitType, setPublicBenefitType] = useState<PublicCloudBenefitType | ''>('');
  const [privateBenefitType, setPrivateBenefitType] = useState<PrivateCloudBenefitType | ''>('');

  // 权益产品选择器
  const [benefitPicker, setBenefitPicker] = useState<{
    open: boolean;
    cloud: 'public' | 'private' | null;
    type: PublicCloudBenefitType | PrivateCloudBenefitType | null;
  }>({ open: false, cloud: null, type: null });
  const [benefitPickerSearch, setBenefitPickerSearch] = useState('');
  const [benefitProductList, setBenefitProductList] = useState<BenefitProduct[]>([]);
  const [benefitProductLoading, setBenefitProductLoading] = useState(false);
  // 私有云多选时的临时选择集合
  const [benefitPickerSelected, setBenefitPickerSelected] = useState<Set<string>>(new Set());

  // 打开权益产品选择器时调外系统接口
  useEffect(() => {
    if (!benefitPicker.open || !benefitPicker.cloud || !benefitPicker.type) return;
    let cancelled = false;
    setBenefitProductLoading(true);
    const fetcher = benefitPicker.cloud === 'public'
      ? fetchPublicCloudBenefitProducts(benefitPicker.type as PublicCloudBenefitType, benefitPickerSearch)
      : fetchPrivateCloudBenefitProducts(benefitPicker.type as PrivateCloudBenefitType, benefitPickerSearch);
    fetcher
      .then(list => { if (!cancelled) setBenefitProductList(list); })
      .finally(() => { if (!cancelled) setBenefitProductLoading(false); });
    return () => { cancelled = true; };
  }, [benefitPicker.open, benefitPicker.cloud, benefitPicker.type, benefitPickerSearch]);

  // 运维包富文本编辑弹窗
  const [maintenanceModal, setMaintenanceModal] = useState<{ open: boolean; field: MaintenanceField | null; html: string }>({
    open: false, field: null, html: '',
  });

  // 物料选择器：targetField 决定选中物料后写入哪一列
  const [materialPicker, setMaterialPicker] = useState<{ open: boolean; rowIdx: number | null; kind: '授权' | '介质' | null }>({
    open: false, rowIdx: null, kind: null,
  });
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialList, setMaterialList] = useState<MaterialListItem[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);

  // 打开物料选择器时按 kind 加载列表
  useEffect(() => {
    if (!materialPicker.open || !materialPicker.kind) return;
    let cancelled = false;
    setMaterialLoading(true);
    fetchMaterials(materialPicker.kind, materialSearch)
      .then(list => { if (!cancelled) setMaterialList(list); })
      .finally(() => { if (!cancelled) setMaterialLoading(false); });
    return () => { cancelled = true; };
  }, [materialPicker.open, materialPicker.kind, materialSearch]);

  // --- Draft ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft: ProductDraft = JSON.parse(raw);
      setForm(draft.form);
      setCurrentStep(draft.currentStep);
      if (draft.skuName !== undefined) setSkuName(draft.skuName);
      setSelectedAuthTypeIds(draft.selectedAuthTypeIds || []);
      setAuthTypeConfigs(draft.authTypeConfigs || {});
      setSelectedComponentIds(draft.selectedComponentIds || []);
    } catch { /* ignore */ }
  }, []);

  const saveDraft = useCallback(() => {
    const draft: ProductDraft = {
      savedAt: new Date().toISOString(),
      currentStep,
      form,
      skuName,
      selectedAuthTypeIds,
      authTypeConfigs,
      selectedComponentIds,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSavedTip(true);
    setTimeout(() => setDraftSavedTip(false), 2000);
  }, [currentStep, form, skuName, selectedAuthTypeIds, authTypeConfigs, selectedComponentIds]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  // --- Classification options ---
  const classificationOptions = useMemo(() => {
    const sets: Record<string, Set<string>> = {
      categories: new Set(), subCategories: new Set(), productTypes: new Set(),
      productLines: new Set(), productSeries: new Set(), productClasses: new Set(),
      productClassifications: new Set(), productCategories: new Set(),
      productLinesFinance: new Set(), productClassesFinance: new Set(), productSeriesFinance: new Set(),
    };
    products.forEach(p => {
      if (p.category) sets.categories.add(p.category);
      if (p.subCategory) sets.subCategories.add(p.subCategory);
      if (p.productType) sets.productTypes.add(p.productType);
      if (p.productLine) sets.productLines.add(p.productLine);
      if (p.productSeries) sets.productSeries.add(p.productSeries);
      if (p.productClass) sets.productClasses.add(p.productClass);
      if (p.productClassification) sets.productClassifications.add(p.productClassification);
      if (p.productCategory) sets.productCategories.add(p.productCategory);
      if (p.productLineFinance) sets.productLinesFinance.add(p.productLineFinance);
      if (p.productClassFinance) sets.productClassesFinance.add(p.productClassFinance);
      if (p.productSeriesFinance) sets.productSeriesFinance.add(p.productSeriesFinance);
    });
    return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, [...v].sort()])) as Record<string, string[]>;
  }, [products]);

  // --- Component pool (matching search, includes already-selected with badge) ---
  const componentCandidates = useMemo(() => {
    const q = componentPickerSearch.toLowerCase();
    return atomicCapabilities.filter(c =>
      q ? c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) : true
    );
  }, [atomicCapabilities, componentPickerSearch]);

  // 当前搜索下还未添加的组件（用于批量添加）
  const unaddedComponentCandidates = useMemo(
    () => componentCandidates.filter(c => !selectedComponentIds.includes(c.id)),
    [componentCandidates, selectedComponentIds]
  );

  // --- Auth type candidates (matching search, includes already-selected with badge) ---
  const authTypeCandidates = useMemo(() => {
    const q = authPickerSearch.toLowerCase();
    return authTypes.filter(at =>
      q ? at.name.toLowerCase().includes(q) : true
    );
  }, [authTypes, authPickerSearch]);

  const unaddedAuthTypeCandidates = useMemo(
    () => authTypeCandidates.filter(at => !selectedAuthTypeIds.includes(at.id)),
    [authTypeCandidates, selectedAuthTypeIds]
  );

  const getAuthCfg = useCallback((id: string, name?: string): AuthTypeConfig => {
    if (authTypeConfigs[id]) return authTypeConfigs[id];
    const at = authTypes.find(a => a.id === id);
    const n = name || at?.name || '';
    return {
      channelTpl: `渠道授权书_${n}.docx`,
      directTpl: `直签授权书_${n}.docx`,
      saleStatus: '标准在售',
      enabled: true,
      purchaseUnit: at ? resolvePurchaseUnit(at) : '',
      auxPurchaseUnit: at ? resolveAuxPurchaseUnit(at) : '',
    };
  }, [authTypeConfigs, authTypes]);

  // 排序：启用的在前，禁用的下沉到末尾，组内按选择顺序
  const selectedAuthTypes = useMemo(() => {
    const items = selectedAuthTypeIds
      .map(id => authTypes.find(at => at.id === id))
      .filter((x): x is typeof authTypes[number] => !!x);
    return [...items].sort((a, b) => {
      const ea = getAuthCfg(a.id, a.name).enabled ? 0 : 1;
      const eb = getAuthCfg(b.id, b.name).enabled ? 0 : 1;
      return ea - eb;
    });
  }, [authTypes, selectedAuthTypeIds, getAuthCfg]);
  const selectedComponents = useMemo(
    () => atomicCapabilities.filter(c => selectedComponentIds.includes(c.id)),
    [atomicCapabilities, selectedComponentIds]
  );

  // --- Sales org candidates (matching search, includes already-added with badge) ---
  const salesOrgCandidates = useMemo(() => {
    const q = salesOrgPickerSearch.trim().toLowerCase();
    return salesOrganizations
      .filter(o => o.status === '正常')
      .filter(o => q ? o.name.toLowerCase().includes(q) || o.shortName.toLowerCase().includes(q) : true)
      .map(o => o.name);
  }, [salesOrgPickerSearch, salesOrganizations]);

  const addedSalesOrgs = useMemo(() => new Set((form.salesScope || []).map(r => r.salesOrg)), [form.salesScope]);
  const unaddedSalesOrgCandidates = useMemo(
    () => salesOrgCandidates.filter(org => !addedSalesOrgs.has(org)),
    [salesOrgCandidates, addedSalesOrgs]
  );

  // --- Handlers ---
  const updateForm = useCallback((patch: Partial<Product>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const handleAIGenerate = async () => {
    if (!form.name) return;
    setGeneratingAI(true);
    const desc = await generateProductDescription(form.name, form.category || '通用', '高效, 专业, 智能');
    updateForm({ description: desc });
    setGeneratingAI(false);
  };

  const handleAddComponent = (comp: AtomicCapability) => {
    if (selectedComponentIds.includes(comp.id)) return;
    setSelectedComponentIds(prev => [...prev, comp.id]);
    updateForm({ composition: [...(form.composition || []), comp] });
  };

  const handleRemoveComponent = (compId: string) => {
    setSelectedComponentIds(prev => prev.filter(id => id !== compId));
    updateForm({ composition: (form.composition || []).filter(c => c.id !== compId) });
  };

  const initAuthTypeConfig = useCallback((atId: string) => {
    setAuthTypeConfigs(prev => {
      if (prev[atId]) return prev;
      const at = authTypes.find(a => a.id === atId);
      return {
        ...prev,
        [atId]: {
          channelTpl: `渠道授权书_${at?.name || ''}.docx`,
          directTpl: `直签授权书_${at?.name || ''}.docx`,
          saleStatus: '标准在售',
          enabled: true,
          purchaseUnit: at ? resolvePurchaseUnit(at) : '',
          auxPurchaseUnit: at ? resolveAuxPurchaseUnit(at) : '',
        },
      };
    });
  }, [authTypes]);

  const handleAddAuthType = (atId: string) => {
    if (selectedAuthTypeIds.includes(atId)) return;
    setSelectedAuthTypeIds(prev => [...prev, atId]);
    initAuthTypeConfig(atId);
  };

  const handleRemoveAuthType = (atId: string) => {
    setSelectedAuthTypeIds(prev => prev.filter(id => id !== atId));
    setAuthTypeConfigs(prev => {
      const next = { ...prev };
      delete next[atId];
      return next;
    });
  };

  const handleAddAllAuthTypes = () => {
    if (unaddedAuthTypeCandidates.length === 0) return;
    const ids = unaddedAuthTypeCandidates.map(at => at.id);
    setSelectedAuthTypeIds(prev => [...prev, ...ids]);
    setAuthTypeConfigs(prev => {
      const next = { ...prev };
      unaddedAuthTypeCandidates.forEach(at => {
        if (!next[at.id]) {
          next[at.id] = {
            channelTpl: `渠道授权书_${at.name}.docx`,
            directTpl: `直签授权书_${at.name}.docx`,
            saleStatus: '标准在售',
            enabled: true,
            purchaseUnit: resolvePurchaseUnit(at),
            auxPurchaseUnit: resolveAuxPurchaseUnit(at),
          };
        }
      });
      return next;
    });
  };

  const updateAuthTypeConfig = useCallback((atId: string, patch: Partial<AuthTypeConfig>) => {
    setAuthTypeConfigs(prev => ({
      ...prev,
      [atId]: { ...getAuthCfg(atId), ...patch },
    }));
  }, [getAuthCfg]);

  const handleAddAllComponents = () => {
    if (unaddedComponentCandidates.length === 0) return;
    setSelectedComponentIds(prev => [...prev, ...unaddedComponentCandidates.map(c => c.id)]);
    updateForm({ composition: [...(form.composition || []), ...unaddedComponentCandidates] });
  };

  // 新增安装包必填校验
  const isPkgFormValid = pkgTab === 'public'
    ? !!(pkgForm.deliveryItemName?.trim() && pkgForm.platform && pkgForm.url?.trim() && pkgForm.cpu && pkgForm.os)
    : !!(pkgForm.deployPackageId?.trim() && pkgForm.deployPackageName?.trim()); // 私有云：ID 必填且查询成功

  // 私有云：根据部署包 ID 调用运维聚合平台带出其他字段
  const handleQueryDeployPackage = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setDeployPkgError(null);
      setPkgForm(prev => ({
        ...prev,
        deployPackageName: '',
        versionType: '',
        packageProductType: '',
        versionNumber: '',
        packageKind: '',
      }));
      return;
    }
    setDeployPkgLoading(true);
    setDeployPkgError(null);
    try {
      const info = await fetchDeployPackageById(trimmed);
      if (!info) {
        setDeployPkgError('未查询到该部署包，请核对部署包 ID');
        setPkgForm(prev => ({
          ...prev,
          deployPackageName: '',
          versionType: '',
          packageProductType: '',
          versionNumber: '',
          packageKind: '',
        }));
      } else {
        setPkgForm(prev => ({
          ...prev,
          deployPackageId: info.id,
          deployPackageName: info.name,
          versionType: info.versionType,
          packageProductType: info.packageProductType,
          versionNumber: info.versionNumber,
          packageKind: info.packageKind,
        }));
      }
    } finally {
      setDeployPkgLoading(false);
    }
  }, []);

  const handleAddInstallPkg = () => {
    if (!isPkgFormValid) return;
    const isPrivate = pkgTab === 'private';
    const newPkg: InstallPackage = {
      id: `AZ${Date.now().toString().slice(-7)}`,
      name: isPrivate ? (pkgForm.deployPackageName || '') : (pkgForm.deliveryItemName || pkgForm.name || ''),
      version: isPrivate ? (pkgForm.versionNumber || '1.0') : '1.0',
      url: pkgForm.url || '',
      platform: pkgForm.platform,
      cpu: pkgForm.cpu,
      os: pkgForm.os,
      source: isPrivate ? '对接运维聚合平台' : (pkgForm.source || 'SMS手工维护'),
      deliveryItemId: pkgForm.deliveryItemId,
      deliveryItemName: pkgForm.deliveryItemName,
      packageType: pkgForm.packageType || pkgTab,
      enabled: true,
      // 私有云特有字段
      deployPackageId: pkgForm.deployPackageId,
      deployPackageName: pkgForm.deployPackageName,
      versionType: pkgForm.versionType,
      packageProductType: pkgForm.packageProductType,
      versionNumber: pkgForm.versionNumber,
      packageKind: pkgForm.packageKind,
    };
    updateForm({ installPackages: [...(form.installPackages || []), newPkg] });
    setIsAddPkgOpen(false);
    setDeployPkgError(null);
    setPkgForm({ name: '', platform: '', source: 'SMS手工维护', cpu: '', os: '', url: '', packageType: pkgTab, deliveryItemId: '', deliveryItemName: '' });
  };

  // 私有云：批量重新拉取运维聚合平台数据，刷新已添加的私有云安装包字段
  const handleRefreshDeployPackages = useCallback(async () => {
    const list = (form.installPackages || []).filter(p => (p.packageType || 'public') === 'private' && p.deployPackageId);
    if (list.length === 0) return;
    setRefreshDeployPkgLoading(true);
    try {
      const updated = await Promise.all(
        list.map(async pkg => {
          const info = await fetchDeployPackageById(pkg.deployPackageId!);
          if (!info) return pkg;
          return {
            ...pkg,
            deployPackageName: info.name,
            versionType: info.versionType,
            packageProductType: info.packageProductType,
            versionNumber: info.versionNumber,
            packageKind: info.packageKind,
            name: info.name,
            version: info.versionNumber,
          };
        })
      );
      const updatedMap = new Map(updated.map(p => [p.id, p]));
      updateForm({
        installPackages: (form.installPackages || []).map(p => updatedMap.get(p.id) || p),
      });
    } finally {
      setRefreshDeployPkgLoading(false);
    }
  }, [form.installPackages, updateForm]);

  const openSalesOrgPicker = () => {
    setSalesOrgPickerSelected(new Set());
    setSalesOrgPickerSearch('');
    setShowAddSalesOrg(true);
  };

  const closeSalesOrgPicker = () => {
    setShowAddSalesOrg(false);
    setSalesOrgPickerSelected(new Set());
    setSalesOrgPickerSearch('');
  };

  const toggleSalesOrgPicker = (org: string) => {
    setSalesOrgPickerSelected(prev => {
      const next = new Set(prev);
      if (next.has(org)) next.delete(org); else next.add(org);
      return next;
    });
  };

  const handleAddSalesScopes = () => {
    if (salesOrgPickerSelected.size === 0) return;
    const prodName = (form.name || '').trim();
    const existing = new Set((form.salesScope || []).map(r => r.salesOrg));
    const newRows: SalesScopeRow[] = Array.from(salesOrgPickerSelected)
      .filter(org => !existing.has(org))
      .map(org => ({
        salesOrg: org,
        businessShipProductName: prodName,
        materialType: '',
        authMaterialName: '',
        mediaMaterialName: '',
        authMaterialCode: '',
        mediaMaterialCode: '',
        supplyOrg: '',
        status: 'unlisted',
        billingStatus: 'unmaintained',
      }));
    if (newRows.length > 0) {
      updateForm({ salesScope: [...(form.salesScope || []), ...newRows] });
    }
    closeSalesOrgPicker();
  };

  // 行内更新（局部 patch）
  const updateSalesScopeRow = useCallback((idx: number, patch: Partial<SalesScopeRow>) => {
    setForm(prev => {
      const rows = [...(prev.salesScope || [])];
      if (!rows[idx]) return prev;
      rows[idx] = { ...rows[idx], ...patch };
      return { ...prev, salesScope: rows };
    });
  }, []);

  // --- Benefits 关联 ---
  const openBenefitPicker = (cloud: 'public' | 'private', type: PublicCloudBenefitType | PrivateCloudBenefitType) => {
    setBenefitPickerSearch('');
    setBenefitPickerSelected(new Set());
    setBenefitPicker({ open: true, cloud, type });
  };
  const closeBenefitPicker = () => {
    setBenefitPicker({ open: false, cloud: null, type: null });
    setBenefitPickerSearch('');
    setBenefitPickerSelected(new Set());
  };

  // 公有云：单选；同一权益类型只保留一个产品
  const setPublicBenefitProduct = (type: PublicCloudBenefitType, p: BenefitProduct) => {
    setForm(prev => {
      const others = (prev.publicCloudBenefits || []).filter(b => b.type !== type);
      const next: PublicCloudBenefit = { type, productCode: p.code, productName: p.name };
      return { ...prev, publicCloudBenefits: [...others, next] };
    });
  };
  const removePublicBenefit = (type: PublicCloudBenefitType) => {
    setForm(prev => ({
      ...prev,
      publicCloudBenefits: (prev.publicCloudBenefits || []).filter(b => b.type !== type),
    }));
  };

  // 私有云：多选；按 type 累加；点击「添加」时把弹窗中勾选的写入
  const togglePrivateBenefitInPicker = (code: string) => {
    setBenefitPickerSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };
  const commitPrivateBenefits = (type: PrivateCloudBenefitType, items: BenefitProduct[]) => {
    setForm(prev => {
      const existing = prev.privateCloudBenefits || [];
      const existingCodesOfType = new Set(existing.filter(b => b.type === type).map(b => b.productCode));
      const toAdd: PrivateCloudBenefit[] = items
        .filter(p => benefitPickerSelected.has(p.code) && !existingCodesOfType.has(p.code))
        .map(p => ({ type, productCode: p.code, productName: p.name }));
      return { ...prev, privateCloudBenefits: [...existing, ...toAdd] };
    });
  };
  const removePrivateBenefit = (type: PrivateCloudBenefitType, code: string) => {
    setForm(prev => ({
      ...prev,
      privateCloudBenefits: (prev.privateCloudBenefits || []).filter(b => !(b.type === type && b.productCode === code)),
    }));
  };

  // --- Create Product ---
  const handleCreate = (autoShelf: boolean) => {
    if (!form.name) return;

    const maxId = products.reduce((max, p) => {
      const numStr = p.id.startsWith('PROD') ? p.id.substring(5) : (p.id.startsWith('P') ? p.id.substring(1) : p.id.substring(3));
      const num = parseInt(numStr, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `PROD-${(maxId + 1).toString().padStart(4, '0')}`;

    const pricingOptions = selectedAuthTypes.map(at => {
      const isPeriodic = at.period === '周期性';
      return {
        id: `opt-${Date.now()}-${at.id}`,
        title: at.name,
        price: 0,
        license: {
          type: (isPeriodic ? 'Subscription' : 'Perpetual') as 'Subscription' | 'Perpetual',
          period: 1,
          periodUnit: (isPeriodic ? 'Year' : 'Forever') as 'Year' | 'Forever',
          scope: at.name.includes('用户') ? '1 User' : at.name.includes('服务器') ? 'Platform' : 'Standard',
        },
      };
    });

    const firstAuth = selectedAuthTypes[0];
    const isPeriodic = firstAuth?.period === '周期性';
    const defaultLicense = firstAuth ? {
      type: (isPeriodic ? 'Subscription' : 'Perpetual') as 'Subscription' | 'Perpetual',
      period: 1,
      periodUnit: (isPeriodic ? 'Year' : 'Forever') as 'Year' | 'Forever',
      scope: 'Standard',
    } : { type: 'Perpetual' as const, period: 1, periodUnit: 'Forever' as const, scope: 'Standard' };

    const initialSku: ProductSku = {
      id: `spec-${Date.now()}`,
      code: `SPEC-${Date.now().toString().slice(-4)}`,
      name: skuName.trim() || '标准版',
      price: 0,
      stock: 0,
      description: form.description || '',
      status: 'Active',
      license: defaultLicense,
      pricingOptions,
    };

    const newProduct: Product = {
      ...(form as Product),
      id: newId,
      status: autoShelf ? 'OnShelf' : 'OffShelf',
      skus: [initialSku],
    };

    setProducts(prev => [...prev, newProduct]);
    clearDraft();
    navigate(`/products/${newId}`);
  };
  const isMaintenanceProduct = form.productKind === '维保服务产品';
  const stripHtml = (html?: string) => (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
  const isStep1Valid = !!(
    form.name &&
    skuName &&
    form.productKind &&
    (!isMaintenanceProduct || (stripHtml(form.maintenanceContent) && stripHtml(form.maintenanceStandard)))
  );
  const canCreate = isStep1Valid;

  const filteredPkgs = useMemo(
    () => (form.installPackages || []).filter(p => (p.packageType || 'public') === pkgTab),
    [form.installPackages, pkgTab],
  );

  const openAuthPicker = () => {
    setIsAuthPickerOpen(true);
    setAuthPickerSearch('');
  };
  const openComponentPicker = () => {
    setIsComponentPickerOpen(true);
    setComponentPickerSearch('');
  };
  const openAddPkgModal = () => {
    setDeployPkgError(null);
    setPkgForm(
      pkgTab === 'public'
        ? { name: '', platform: '', source: 'SMS手工维护', cpu: '', os: '', url: '', packageType: 'public', deliveryItemId: '', deliveryItemName: '' }
        : { name: '', source: '对接运维聚合平台', packageType: 'private', deployPackageId: '', deployPackageName: '', versionType: '', packageProductType: '', versionNumber: '', packageKind: '' },
    );
    setIsAddPkgOpen(true);
  };
  const openMaterialPicker = (rowIdx: number, kind: '授权' | '介质') => {
    setMaterialSearch('');
    setMaterialPicker({ open: true, rowIdx, kind });
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].key) {
      case 'info':
        return (
          <StepInfo
            form={form}
            skuName={skuName}
            fullProductName={fullProductName}
            isMaintenanceProduct={isMaintenanceProduct}
            updateForm={updateForm}
            setSkuName={setSkuName}
            setMaintenanceModal={setMaintenanceModal}
            generatingAI={generatingAI}
            onAIGenerate={handleAIGenerate}
            selectedAuthTypes={selectedAuthTypes}
            getAuthCfg={getAuthCfg}
            updateAuthTypeConfig={updateAuthTypeConfig}
            onOpenAuthPicker={openAuthPicker}
            onRemoveAuthType={handleRemoveAuthType}
            selectedComponents={selectedComponents}
            onOpenComponentPicker={openComponentPicker}
            onRemoveComponent={handleRemoveComponent}
          />
        );
      case 'classification':
        return (
          <StepClassification
            form={form}
            updateForm={updateForm}
            classificationOptions={classificationOptions}
          />
        );
      case 'salesScope':
        return (
          <StepSalesScope
            form={form}
            updateForm={updateForm}
            updateSalesScopeRow={updateSalesScopeRow}
            openSalesOrgPicker={openSalesOrgPicker}
            onOpenMaterialPicker={openMaterialPicker}
          />
        );
      case 'benefits':
        return (
          <StepBenefits
            form={form}
            benefitTab={benefitTab}
            setBenefitTab={setBenefitTab}
            publicBenefitType={publicBenefitType}
            setPublicBenefitType={setPublicBenefitType}
            privateBenefitType={privateBenefitType}
            setPrivateBenefitType={setPrivateBenefitType}
            openBenefitPicker={openBenefitPicker}
            removePublicBenefit={removePublicBenefit}
            removePrivateBenefit={removePrivateBenefit}
          />
        );
      case 'packages':
        return (
          <StepPackages
            form={form}
            updateForm={updateForm}
            pkgTab={pkgTab}
            setPkgTab={setPkgTab}
            filteredPkgs={filteredPkgs}
            refreshDeployPkgLoading={refreshDeployPkgLoading}
            onRefreshDeployPackages={handleRefreshDeployPackages}
            onOpenAddPkg={openAddPkgModal}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EC] dark:bg-black">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6">
        <div className="flex items-center gap-4 py-3">
          <button onClick={() => { if (confirm('离开将丢失未保存的内容，是否继续？')) navigate('/products'); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight">新增产品</h1>
          <div className="flex-1" />
          <button onClick={saveDraft} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition">
            <Save className="w-3.5 h-3.5" />
            {draftSavedTip ? '已保存' : '保存草稿'}
          </button>
        </div>
        <div className="flex items-center gap-1 pb-3 overflow-x-auto no-scrollbar">
          {STEPS.map((step, idx) => {
            const isCurrent = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <React.Fragment key={step.key}>
                {idx > 0 && (
                  <div className={`h-px flex-1 min-w-[16px] max-w-[40px] mx-0.5 ${isCompleted ? 'bg-blue-400 dark:bg-blue-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                )}
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF]'
                      : isCompleted
                        ? 'text-blue-500 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white'
                      : isCompleted
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  {step.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 page-container max-w-[1400px] animate-page-enter pb-28">
        {renderStepContent()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition">
                上一步
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 0 && !isStep1Valid}
                className="px-5 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition shadow-apple disabled:opacity-50 flex items-center gap-1.5"
              >
                下一步 <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCreate(false)}
                  disabled={!canCreate}
                  className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition disabled:opacity-50"
                >
                  仅创建（下架状态）
                </button>
                <button
                  onClick={() => handleCreate(true)}
                  disabled={!canCreate}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#FF2D55] rounded-lg hover:opacity-90 transition shadow-apple disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> 创建并上架
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ProductWizardModals
        isAuthPickerOpen={isAuthPickerOpen}
        setIsAuthPickerOpen={setIsAuthPickerOpen}
        authPickerSearch={authPickerSearch}
        setAuthPickerSearch={setAuthPickerSearch}
        authTypeCandidates={authTypeCandidates}
        unaddedAuthTypeCandidates={unaddedAuthTypeCandidates}
        selectedAuthTypeIds={selectedAuthTypeIds}
        selectedAuthTypes={selectedAuthTypes}
        handleAddAuthType={handleAddAuthType}
        handleRemoveAuthType={handleRemoveAuthType}
        handleAddAllAuthTypes={handleAddAllAuthTypes}
        isComponentPickerOpen={isComponentPickerOpen}
        setIsComponentPickerOpen={setIsComponentPickerOpen}
        componentPickerSearch={componentPickerSearch}
        setComponentPickerSearch={setComponentPickerSearch}
        componentCandidates={componentCandidates}
        unaddedComponentCandidates={unaddedComponentCandidates}
        selectedComponentIds={selectedComponentIds}
        selectedComponents={selectedComponents}
        handleAddComponent={handleAddComponent}
        handleRemoveComponent={handleRemoveComponent}
        handleAddAllComponents={handleAddAllComponents}
        maintenanceModal={maintenanceModal}
        setMaintenanceModal={setMaintenanceModal}
        updateForm={updateForm}
        showAddSalesOrg={showAddSalesOrg}
        closeSalesOrgPicker={closeSalesOrgPicker}
        salesOrgPickerSearch={salesOrgPickerSearch}
        setSalesOrgPickerSearch={setSalesOrgPickerSearch}
        salesOrgCandidates={salesOrgCandidates}
        unaddedSalesOrgCandidates={unaddedSalesOrgCandidates}
        addedSalesOrgs={addedSalesOrgs}
        salesOrgPickerSelected={salesOrgPickerSelected}
        toggleSalesOrgPicker={toggleSalesOrgPicker}
        setSalesOrgPickerSelected={setSalesOrgPickerSelected}
        handleAddSalesScopes={handleAddSalesScopes}
        isAddPkgOpen={isAddPkgOpen}
        setIsAddPkgOpen={setIsAddPkgOpen}
        pkgTab={pkgTab}
        pkgForm={pkgForm}
        setPkgForm={setPkgForm}
        deployPkgLoading={deployPkgLoading}
        deployPkgError={deployPkgError}
        setDeployPkgError={setDeployPkgError}
        handleQueryDeployPackage={handleQueryDeployPackage}
        isPkgFormValid={isPkgFormValid}
        handleAddInstallPkg={handleAddInstallPkg}
        form={form}
        skuName={skuName}
        benefitPicker={benefitPicker}
        closeBenefitPicker={closeBenefitPicker}
        benefitPickerSearch={benefitPickerSearch}
        setBenefitPickerSearch={setBenefitPickerSearch}
        benefitProductList={benefitProductList}
        benefitProductLoading={benefitProductLoading}
        benefitPickerSelected={benefitPickerSelected}
        togglePrivateBenefitInPicker={togglePrivateBenefitInPicker}
        setPublicBenefitProduct={setPublicBenefitProduct}
        commitPrivateBenefits={commitPrivateBenefits}
        materialPicker={materialPicker}
        setMaterialPicker={setMaterialPicker}
        materialSearch={materialSearch}
        setMaterialSearch={setMaterialSearch}
        materialList={materialList}
        materialLoading={materialLoading}
        updateSalesScopeRow={updateSalesScopeRow}
      />
    </div>
  );
};

export default ProductCreateWizard;
