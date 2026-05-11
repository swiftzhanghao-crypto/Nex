
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Product, ProductSku, InstallPackage, SalesScopeRow, AtomicCapability,
  MaterialListItem, BenefitProduct, PublicCloudBenefitType, PrivateCloudBenefitType,
  PublicCloudBenefit, PrivateCloudBenefit,
} from '../../types';
import {
  ArrowLeft, Check, ChevronRight, Save, Package, Cpu, FileText, Tag, Globe, Gift,
  Plus, Trash2, Search, X, Key, Sparkles, Loader2, Info, RefreshCw,
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { generateProductDescription } from '../../services/geminiService';
import { fetchMaterials } from '../../services/materialService';
import { fetchPublicCloudBenefitProducts, fetchPrivateCloudBenefitProducts } from '../../services/benefitProductService';
import { fetchDeployPackageById } from '../../services/deployPackageService';
import { resolvePurchaseUnit, resolveAuxPurchaseUnit } from '../../utils/authTypeDefaults';
import ModalPortal from '../common/ModalPortal';
import RichTextEditor from '../common/RichTextEditor';

const DRAFT_STORAGE_KEY = 'product_create_draft';

const STEPS = [
  { key: 'info', label: '产品信息', icon: Cpu },
  { key: 'classification', label: '产品分类', icon: FileText },
  { key: 'benefits', label: '权益信息', icon: Gift },
  { key: 'packages', label: '安装包', icon: Package },
  { key: 'salesScope', label: '销售范围', icon: Globe },
] as const;

type StepKey = typeof STEPS[number]['key'];

const SALES_ORG_OPTIONS = [
  '珠海金山办公有限公司', '北京金山办公有限公司', '武汉金山办公有限公司',
  '长沙金山办公软件有限公司', '上海金山办公软件有限公司', '西安金山办公软件有限公司',
  '成都金山办公软件有限公司', '苏州金山办公软件有限公司', '贵州金山办公软件有限公司',
  '北京数科网维技术有限责任公司', '广州数科网维技术有限公司', '深圳数科信创技术有限责任公司',
];

const BUSINESS_TAG_OPTIONS = ['生态', '数科', '金山志远', '公有云', '流版套件', '私有云', 'AI', 'IM'];

// 销售范围-物料类型可选值
const MATERIAL_TYPE_OPTIONS = ['单授权', '介质+授权', '服务', '介质+服务'];

// 销售渠道可选值（渠道端、商城、365后台等）
const SALES_CHANNEL_OPTIONS = [
  '渠道端', '商城', '365后台直签', '365后台兑换码', '365后台自流量',
] as const;

// 可销售客户类型（客户清单维度）
const SELLABLE_CUSTOMER_TYPES = [
  '金融', '央企', '地方国企', '其他中央企业', '港澳台企业', '外资企业',
  '地方事业单位', '地方党政机关', '中央事业单位', '中央党政机关',
  '学校', '军队', '中央团体', '地方团体', '海外', '民企',
];

// 渠道级别（仅当勾选"渠道端"时启用）
const CHANNEL_LEVEL_OPTIONS = ['钻石', '铂金', '金牌', '银牌', '普通'];

// 权益关联类型
const PUBLIC_CLOUD_BENEFIT_TYPES: PublicCloudBenefitType[] = ['套餐', '权益包', '三方产品', '三方产品-政企'];
const PRIVATE_CLOUD_BENEFIT_TYPES: PrivateCloudBenefitType[] = ['云办公（私有云）', '文档中台'];

// 与授权类型管理保持一致的可选值
const PURCHASE_UNIT_OPTIONS = ['套', '用户', '获得授权主体', '人天', '人月', '次', '个', '年', '客户', '件'];
const AUX_PURCHASE_UNIT_OPTIONS = ['用户', '套', '个', '客户', '次'];

// 运维包富文本编辑可插入的变量
const MAINTENANCE_VARIABLES = [
  '产品类型', '产品名称', '下单日期', '授权方式', '被授权方', '授权开始时间', '计价数量',
  '序列号', '词霸账号', '词霸密码', '销售组织', '客户名称', '授权数量', '授权期限',
  '官网兑换码', '官网兑换链接', '到期后授权数量', '安装包链接', '授权结束时间', '黑马账号',
  '云服务用户数', '直签合同编号', '直签合同名称', '商务发货产品名称', '订单编号', '产品规格',
  '服务期限', '服务开始时间', '服务结束时间', '升级保障期限', '升级保障开始时间',
  '升级保障结束时间', '赠送端授权截止时间', '赠送端年限', '初始企业名称', 'WPS账号和初始密码',
  '生态伙伴产品名称',
];

type MaintenanceField = 'maintenanceContent' | 'maintenanceStandard';
const MAINTENANCE_FIELD_META: Record<MaintenanceField, { label: string; placeholder: string }> = {
  maintenanceContent: { label: '运维包服务内容', placeholder: '请输入运维包包含的服务内容，例如：系统巡检、故障响应、版本升级等' },
  maintenanceStandard: { label: '运维包服务标准', placeholder: '请输入运维包服务标准，例如：7×24 小时响应、4 小时到场、SLA 99.9%' },
};

interface AuthTypeConfig {
  channelTpl: string;
  directTpl: string;
  saleStatus: '标准在售' | '非标在售';
  enabled: boolean;
  /** 购买单位（默认带出授权类型配置，可调整） */
  purchaseUnit: string;
  /** 辅助购买单位，仅周期性 */
  auxPurchaseUnit: string;
}

interface ProductDraft {
  savedAt: string;
  currentStep: number;
  form: Partial<Product>;
  skuName: string;
  selectedAuthTypeIds: string[];
  selectedComponentIds: string[];
  authTypeConfigs?: Record<string, AuthTypeConfig>;
}

const ProductCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  const { products, setProducts, authTypes, atomicCapabilities } = useAppContext();

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
    return SALES_ORG_OPTIONS.filter(org => q ? org.toLowerCase().includes(q) : true);
  }, [salesOrgPickerSearch]);

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

  // --- Computed ---
  const fullProductName = useMemo(() => {
    const n = (form.name || '').trim();
    const s = (skuName || '').trim();
    if (n && s) return `${n} ${s}`;
    return n || s;
  }, [form.name, skuName]);

  // --- Validation ---
  const isMaintenanceProduct = form.productKind === '维保服务产品';
  // 富文本字段：去掉所有 HTML 标签和空白后判断是否真的有内容
  const stripHtml = (html?: string) => (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
  const isStep1Valid = !!(
    form.name &&
    skuName &&
    form.productKind &&
    (!isMaintenanceProduct || (stripHtml(form.maintenanceContent) && stripHtml(form.maintenanceStandard)))
  );
  const canCreate = isStep1Valid;

  // --- Render helpers ---
  const inputClass = 'w-full border border-gray-200 dark:border-white/10 rounded-lg p-2.5 bg-white dark:bg-black text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 transition';
  const selectClass = inputClass + ' appearance-none cursor-pointer';
  const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';
  const cardClass = 'unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10';

  const renderStepContent = () => {
    switch (STEPS[currentStep].key) {
      case 'info': return renderStepInfo();
      case 'classification': return renderStepClassification();
      case 'salesScope': return renderStepSalesScope();
      case 'benefits': return renderStepBenefits();
      case 'packages': return renderStepPackages();
    }
  };

  // ===================== STEP 1: 产品信息 =====================
  const renderStepInfo = () => (
    <div className="space-y-5">
      {/* 基本信息 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">基本信息</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>产品类别 <span className="text-red-500">*</span></label>
              <select
                value={form.productKind || ''}
                onChange={e => updateForm({ productKind: (e.target.value || undefined) as '通用产品/非维保服务产品' | '维保服务产品' | undefined })}
                className={selectClass}
              >
                <option value="">请选择</option>
                <option value="通用产品/非维保服务产品">通用产品/非维保服务产品</option>
                <option value="维保服务产品">维保服务产品</option>
              </select>
            </div>
          </div>
          {isMaintenanceProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-lg bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              {(['maintenanceContent', 'maintenanceStandard'] as MaintenanceField[]).map(field => {
                const meta = MAINTENANCE_FIELD_META[field];
                const html = (form[field] as string | undefined) || '';
                const empty = !html || html.replace(/<[^>]+>/g, '').trim() === '';
                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {meta.label} <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMaintenanceModal({ open: true, field, html })}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        {empty ? '+ 编辑' : '编辑'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaintenanceModal({ open: true, field, html })}
                      className={`w-full border border-gray-200 dark:border-white/10 rounded-lg p-3 bg-white dark:bg-black hover:border-blue-300 dark:hover:border-blue-500/40 transition min-h-[88px] flex items-start justify-start text-left ${empty ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {empty ? (
                        <span className="text-xs">{meta.placeholder}</span>
                      ) : (
                        <div
                          className="rte-content text-xs line-clamp-4 break-words text-left w-full"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>产品名称 <span className="text-red-500">*</span></label>
              <input value={form.name || ''} onChange={e => updateForm({ name: e.target.value })} className={inputClass} placeholder="例如：WPS 365" />
            </div>
            <div>
              <label className={labelClass}>规格名称 <span className="text-red-500">*</span></label>
              <input value={skuName} onChange={e => setSkuName(e.target.value)} className={inputClass} placeholder="例如：商业版" />
            </div>
            <div>
              <label className={labelClass}>产品详细名称 <span className="text-gray-400 font-normal">（自动生成）</span></label>
              <input
                value={fullProductName}
                readOnly
                className={inputClass + ' bg-gray-50 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                placeholder="产品名称 + 规格名称"
                title="由产品名称和规格名称自动拼接"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>产品规格描述</label>
            <div className="flex items-center gap-2">
              <input value={form.description || ''} onChange={e => updateForm({ description: e.target.value })} className={inputClass} placeholder="输入产品规格描述" />
              <button onClick={handleAIGenerate} disabled={generatingAI || !form.name} className="shrink-0 p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition" title="AI 自动填充">
                {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>是否含升级保障期限</label>
              <select value={form.hasUpgradeWarranty ? '是' : '否'} onChange={e => updateForm({ hasUpgradeWarranty: e.target.value === '是' })} className={selectClass}>
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>是否包含售后服务期限</label>
              <select
                value={form.hasAfterSalesService ? '是' : '否'}
                onChange={e => {
                  const has = e.target.value === '是';
                  updateForm({
                    hasAfterSalesService: has,
                    afterSalesServiceDefault: has ? (form.afterSalesServiceDefault || '1年') : '',
                  });
                }}
                className={selectClass}
              >
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
            {form.hasAfterSalesService && (
              <div>
                <label className={labelClass}>售后服务期限默认（非周期性订单）</label>
                <select
                  value={form.afterSalesServiceDefault || '1年'}
                  onChange={e => updateForm({ afterSalesServiceDefault: e.target.value })}
                  className={selectClass}
                >
                  {['1年', '3年'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 授权类型 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">授权类型</h3>
            <span className="text-xs text-gray-400">({selectedAuthTypes.length})</span>
          </div>
          <button onClick={() => { setIsAuthPickerOpen(true); setAuthPickerSearch(''); }} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加授权类型
          </button>
        </div>
        {selectedAuthTypes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1300px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">授权类型</th>
                  <th className="px-5 py-3 w-[90px]">定价周期</th>
                  <th className="px-4 py-3 w-[120px]">购买单位</th>
                  <th className="px-4 py-3 w-[140px]">辅助购买单位</th>
                  <th className="px-5 py-3">直签授权模板</th>
                  <th className="px-5 py-3">渠道授权模板</th>
                  <th className="px-5 py-3 w-[120px]">在售类型</th>
                  <th className="px-5 py-3 w-[100px] text-center">售卖状态</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {selectedAuthTypes.map((at, idx) => {
                  const cfg = getAuthCfg(at.id, at.name);
                  return (
                  <tr key={at.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!cfg.enabled ? 'opacity-60 bg-gray-50/40 dark:bg-white/[0.02]' : ''}`}>
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{at.name}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${at.period === '周期性' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>{at.period}</span>
                    </td>
                    <td className="px-4 py-2">
                      {(() => {
                        const defaultUnit = resolvePurchaseUnit(at);
                        return (
                          <select
                            value={cfg.purchaseUnit}
                            onChange={e => updateAuthTypeConfig(at.id, { purchaseUnit: e.target.value })}
                            title={defaultUnit ? `授权类型默认：${defaultUnit}` : '授权类型未配置默认值'}
                            className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                          >
                            <option value="">请选择</option>
                            {PURCHASE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            {defaultUnit && !PURCHASE_UNIT_OPTIONS.includes(defaultUnit) && (
                              <option value={defaultUnit}>{defaultUnit}</option>
                            )}
                          </select>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2">
                      {at.period === '周期性' ? (() => {
                        const defaultAux = resolveAuxPurchaseUnit(at);
                        return (
                          <select
                            value={cfg.auxPurchaseUnit}
                            onChange={e => updateAuthTypeConfig(at.id, { auxPurchaseUnit: e.target.value })}
                            title={defaultAux ? `授权类型默认：${defaultAux}` : '授权类型未配置默认值'}
                            className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                          >
                            <option value="">请选择</option>
                            {AUX_PURCHASE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                            {defaultAux && !AUX_PURCHASE_UNIT_OPTIONS.includes(defaultAux) && (
                              <option value={defaultAux}>{defaultAux}</option>
                            )}
                          </select>
                        );
                      })() : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 italic">非周期性不适用</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={cfg.directTpl}
                        onChange={e => updateAuthTypeConfig(at.id, { directTpl: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                        placeholder="直签授权书模板名"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={cfg.channelTpl}
                        onChange={e => updateAuthTypeConfig(at.id, { channelTpl: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                        placeholder="渠道授权书模板名"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={cfg.saleStatus}
                        onChange={e => updateAuthTypeConfig(at.id, { saleStatus: e.target.value as '标准在售' | '非标在售' })}
                        className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                      >
                        <option value="标准在售">标准在售</option>
                        <option value="非标在售">非标在售</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          role="switch"
                          aria-checked={cfg.enabled}
                          onClick={() => updateAuthTypeConfig(at.id, { enabled: !cfg.enabled })}
                          title={cfg.enabled ? '点击禁用售卖' : '点击启用售卖'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            cfg.enabled ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-white/15'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                              cfg.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-medium ${cfg.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {cfg.enabled ? '启用' : '禁用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleRemoveAuthType(at.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Key className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂未添加授权类型</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">点击右上角按钮添加授权类型</div>
          </div>
        )}
      </div>

      {/* 组件构成 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">组件构成</h3>
            <span className="text-xs text-gray-400">({selectedComponents.length})</span>
          </div>
          <button onClick={() => { setIsComponentPickerOpen(true); setComponentPickerSearch(''); }} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加组件
          </button>
        </div>
        {selectedComponents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">组件名称</th>
                  <th className="px-5 py-3">组件编号</th>
                  <th className="px-5 py-3">主版本号</th>
                  <th className="px-5 py-3">组件性质</th>
                  <th className="px-5 py-3">描述</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {selectedComponents.map((c, idx) => (
                  <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{c.id}</td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{c.version || '—'}</td>
                    <td className="px-6 py-3 text-xs">
                      {c.nature ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.nature === '自有' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : c.nature === '第三方采购' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        }`}>{c.nature}</span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[240px] truncate" title={c.description}>{c.description || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => handleRemoveComponent(c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Cpu className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂未添加组件</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">点击右上角按钮从组件池添加组件</div>
          </div>
        )}
      </div>
    </div>
  );

  // ===================== STEP 2: 产品分类 =====================
  const renderStepClassification = () => (
    <div className="space-y-5">
      {/* 营管分类 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">营管分类</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            {([
              ['productCategory', '产品一级分类', 'productCategories'],
              ['subCategory', '产品二级分类', 'subCategories'],
              ['productLine', '产品条线', 'productLines'],
              ['category', '产品类型', 'categories'],
              ['productSeries', '产品系列', 'productSeries'],
              ['productClass', '产品类', 'productClasses'],
              ['productClassification', '产品分类', 'productClassifications'],
              ['productType', '规格分类', 'productTypes'],
            ] as [keyof Product, string, string][]).map(([field, label, optKey]) => (
              <div key={field as string}>
                <label className={labelClass}>{label}</label>
                <select
                  value={(form[field] as string) || ''}
                  onChange={e => updateForm({ [field]: e.target.value })}
                  className={selectClass}
                >
                  <option value="">请选择</option>
                  {(classificationOptions[optKey] || []).map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 财务分类 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">财务分类</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {([
              ['productLineFinance', '产品条线-财务口径', 'productLinesFinance'],
              ['productClassFinance', '产品类-财务口径', 'productClassesFinance'],
              ['productSeriesFinance', '产品系列-财务口径', 'productSeriesFinance'],
            ] as [keyof Product, string, string][]).map(([field, label, optKey]) => (
              <div key={field as string}>
                <label className={labelClass}>{label}</label>
                <select
                  value={(form[field] as string) || ''}
                  onChange={e => updateForm({ [field]: e.target.value })}
                  className={selectClass}
                >
                  <option value="">请选择</option>
                  {(classificationOptions[optKey] || []).map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 业务标签 */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">关联业务标签</h3>
          <span className="text-xs text-gray-400">（多选）</span>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            已选 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{form.tags?.length || 0}</span> / {BUSINESS_TAG_OPTIONS.length}
          </span>
        </div>

        {/* 已选标签区 */}
        <div className="px-6 pt-5">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-green-500" /> 已选标签
          </div>
          {(form.tags?.length || 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {form.tags!.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0071E3] dark:bg-[#0A84FF] text-white shadow-sm"
                >
                  {tag}
                  <button
                    onClick={() => updateForm({ tags: form.tags?.filter(t => t !== tag) })}
                    className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
                    title="移除"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 italic py-1">未选择任何标签</div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="mx-6 my-4 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

        {/* 可选标签区 */}
        <div className="px-6 pb-5">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Plus className="w-3 h-3 text-gray-400" /> 可选标签
          </div>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TAG_OPTIONS.map(tag => {
              const selected = form.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const current = form.tags || [];
                    updateForm({ tags: selected ? current.filter(t => t !== tag) : [...current, tag] });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
                    selected
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 cursor-default'
                      : 'border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-400 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                  }`}
                  title={selected ? '已选中（点击下方蓝色徽章可移除）' : `点击添加「${tag}」`}
                >
                  {selected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ===================== STEP 3: 销售范围 =====================
  // 销售渠道：toggle 勾选；取消"渠道端"时同步清空渠道级别
  const toggleSalesChannel = (ch: string) => {
    const cur = form.salesChannels || [];
    const next = cur.includes(ch) ? cur.filter(x => x !== ch) : [...cur, ch];
    if (ch === '渠道端' && cur.includes(ch)) {
      // 取消渠道端 → 同步清空渠道级别
      updateForm({ salesChannels: next, sellableChannelLevels: [] });
    } else {
      updateForm({ salesChannels: next });
    }
  };
  const toggleCustomerType = (t: string) => {
    const cur = form.sellableCustomerTypes || [];
    updateForm({ sellableCustomerTypes: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };
  const toggleChannelLevel = (lvl: string) => {
    const cur = form.sellableChannelLevels || [];
    updateForm({ sellableChannelLevels: cur.includes(lvl) ? cur.filter(x => x !== lvl) : [...cur, lvl] });
  };
  const channelEnabled = (form.salesChannels || []).includes('渠道端');

  const renderStepSalesScope = () => (
    <div className="space-y-5">
      {/* ===== 模块 1：销售渠道设置 ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">销售渠道设置</h3>
            {(form.salesChannels || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.salesChannels || []).length}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">支持多选</span>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {SALES_CHANNEL_OPTIONS.map(ch => {
              const active = (form.salesChannels || []).includes(ch);
              return (
                <button
                  key={ch} type="button"
                  onClick={() => toggleSalesChannel(ch)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                    active
                      ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>选择产品在哪些渠道可销售。仅勾选"渠道端"时，下方"渠道级别"配置生效。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 2：可销售客户清单 ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">可销售客户清单</h3>
            {(form.sellableCustomerTypes || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.sellableCustomerTypes || []).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateForm({ sellableCustomerTypes: [...SELLABLE_CUSTOMER_TYPES] })}
              className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline"
            >
              全选
            </button>
            <span className="text-gray-300 dark:text-white/10">|</span>
            <button
              type="button"
              onClick={() => updateForm({ sellableCustomerTypes: [] })}
              className="text-xs text-gray-500 hover:underline"
            >
              清空
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-1.5">
            {SELLABLE_CUSTOMER_TYPES.map(t => {
              const active = (form.sellableCustomerTypes || []).includes(t);
              return (
                <button
                  key={t} type="button"
                  onClick={() => toggleCustomerType(t)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition flex items-center gap-1 ${
                    active
                      ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {t}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>限定该产品可售卖给哪些类型的客户；下单时将根据客户类型校验是否可购买。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 3：渠道级别（仅当勾选"渠道端"时启用） ===== */}
      <div className={cardClass + (channelEnabled ? '' : ' opacity-60')}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">渠道级别</h3>
            {(form.sellableChannelLevels || []).length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">
                已选 {(form.sellableChannelLevels || []).length}
              </span>
            )}
            {!channelEnabled && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500">
                需先勾选「渠道端」
              </span>
            )}
          </div>
          {channelEnabled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateForm({ sellableChannelLevels: [...CHANNEL_LEVEL_OPTIONS] })}
                className="text-xs text-[#0071E3] dark:text-[#0A84FF] hover:underline"
              >
                全选
              </button>
              <span className="text-gray-300 dark:text-white/10">|</span>
              <button
                type="button"
                onClick={() => updateForm({ sellableChannelLevels: [] })}
                className="text-xs text-gray-500 hover:underline"
              >
                清空
              </button>
            </div>
          )}
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {CHANNEL_LEVEL_OPTIONS.map(lvl => {
              const active = (form.sellableChannelLevels || []).includes(lvl);
              return (
                <button
                  key={lvl} type="button"
                  disabled={!channelEnabled}
                  onClick={() => toggleChannelLevel(lvl)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                    active
                      ? 'border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-transparent'
                  } disabled:cursor-not-allowed`}
                >
                  {active && <Check className="w-3 h-3" />}
                  {lvl}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-start gap-2 text-[11px] text-gray-400">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>渠道端售卖时，仅以下渠道级别的代理商可分销该产品。</span>
          </div>
        </div>
      </div>

      {/* ===== 模块 4：允许售卖的销售组织（原有） ===== */}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">允许售卖的销售组织</h3>
          </div>
          <button onClick={openSalesOrgPicker} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加销售组织
          </button>
        </div>

      {(form.salesScope || []).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1400px]">
            <thead className="unified-table-header">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 min-w-[180px]">销售组织</th>
                <th className="px-4 py-3 min-w-[160px]">商务发货产品名称</th>
                <th className="px-4 py-3 w-[130px]">物料类型</th>
                <th className="px-4 py-3 min-w-[200px]">授权物料名称</th>
                <th className="px-4 py-3 min-w-[200px]">介质物料名称</th>
                <th className="px-4 py-3 w-[140px]">供货组织</th>
                <th className="px-4 py-3 w-[80px]">状态</th>
                <th className="px-4 py-3 w-[60px] text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {form.salesScope!.map((row, idx) => {
                // 介质物料是否需要：仅 "介质+授权" / "介质+服务" 需要
                const mediaRequired = row.materialType === '介质+授权' || row.materialType === '介质+服务';
                return (
                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.salesOrg}</td>
                  {/* 商务发货产品名称：默认带出产品名，可编辑 */}
                  <td className="px-3 py-2">
                    <input
                      value={row.businessShipProductName || ''}
                      onChange={e => updateSalesScopeRow(idx, { businessShipProductName: e.target.value })}
                      placeholder={form.name ? `默认：${form.name}` : '请输入'}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition"
                    />
                  </td>
                  {/* 物料类型：切换到不需要介质的类型时自动清空介质物料 */}
                  <td className="px-3 py-2">
                    <select
                      value={row.materialType}
                      onChange={e => {
                        const newType = e.target.value;
                        const stillNeedsMedia = newType === '介质+授权' || newType === '介质+服务';
                        const patch: Partial<SalesScopeRow> = { materialType: newType };
                        if (!stillNeedsMedia) {
                          // 清空介质相关字段；若供货组织来自介质，需重新以授权物料的供货组织兜底
                          patch.mediaMaterialName = '';
                          patch.mediaMaterialCode = '';
                        }
                        updateSalesScopeRow(idx, patch);
                      }}
                      className="w-full text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none focus:border-blue-400 transition appearance-none cursor-pointer"
                    >
                      <option value="">请选择</option>
                      {MATERIAL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  {/* 授权物料名称：点击打开物料选择器 */}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => { setMaterialSearch(''); setMaterialPicker({ open: true, rowIdx: idx, kind: '授权' }); }}
                      className="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 hover:border-blue-400 transition flex items-center justify-between gap-1 group/picker"
                    >
                      {row.authMaterialName ? (
                        <span className="truncate">
                          {row.authMaterialName}
                          {row.authMaterialCode && <span className="ml-1 text-gray-400">({row.authMaterialCode})</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">点击选择授权物料</span>
                      )}
                      <Search className="w-3 h-3 text-gray-400 shrink-0 group-hover/picker:text-blue-500" />
                    </button>
                  </td>
                  {/* 介质物料名称：仅 "介质+授权" / "介质+服务" 需要；其他类型显示不适用 */}
                  <td className="px-3 py-2">
                    {mediaRequired ? (
                      <button
                        type="button"
                        onClick={() => { setMaterialSearch(''); setMaterialPicker({ open: true, rowIdx: idx, kind: '介质' }); }}
                        className="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 hover:border-blue-400 transition flex items-center justify-between gap-1 group/picker"
                      >
                        {row.mediaMaterialName ? (
                          <span className="truncate">
                            {row.mediaMaterialName}
                            {row.mediaMaterialCode && <span className="ml-1 text-gray-400">({row.mediaMaterialCode})</span>}
                          </span>
                        ) : (
                          <span className="text-gray-400">点击选择介质物料</span>
                        )}
                        <Search className="w-3 h-3 text-gray-400 shrink-0 group-hover/picker:text-blue-500" />
                      </button>
                    ) : (
                      <div
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] text-gray-300 dark:text-gray-600 italic cursor-not-allowed"
                        title={row.materialType ? `物料类型「${row.materialType}」不需要介质物料` : '请先选择物料类型'}
                      >
                        {row.materialType ? '不适用' : '请先选择物料类型'}
                      </div>
                    )}
                  </td>
                  {/* 供货组织：自动从所选物料带出，只读 */}
                  <td className="px-4 py-3 text-xs">
                    {row.supplyOrg ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium">{row.supplyOrg}</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 italic">选择物料后自动带出</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="unified-tag-gray !rounded-full">{row.status === 'listed' ? '已上架' : '未上架'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateForm({ salesScope: form.salesScope!.filter((_, i) => i !== idx) })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <Globe className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂无销售范围</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">点击上方按钮添加销售组织</div>
        </div>
      )}
      </div>
    </div>
  );

  // ===================== STEP 4: 权益信息 =====================
  const renderStepBenefits = () => {
    const publicBenefitOfType = (t: PublicCloudBenefitType) =>
      (form.publicCloudBenefits || []).find(b => b.type === t);
    const privateBenefitsOfType = (t: PrivateCloudBenefitType) =>
      (form.privateCloudBenefits || []).filter(b => b.type === t);

    const publicCount = (form.publicCloudBenefits || []).length;
    const privateCount = (form.privateCloudBenefits || []).length;
    const isPublic = benefitTab === 'public';

    return (
      <div className={cardClass}>
        {/* Tab 切换 */}
        <div className="border-b border-gray-200 dark:border-white/10">
          <div className="flex gap-0 px-6 pt-3">
            <button
              type="button"
              onClick={() => setBenefitTab('public')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                isPublic
                  ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Globe className={`w-4 h-4 ${isPublic ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`} />
              公有云权益关联
              {publicCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isPublic ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {publicCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setBenefitTab('private')}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                !isPublic
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Package className={`w-4 h-4 ${!isPublic ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
              私有云权益关联
              {privateCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${!isPublic ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {privateCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 内容：公有云 */}
        {isPublic && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                先选择「权益类型」，再通过外系统的产品查询接口选择产品。每种权益类型可关联一个产品。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
              <div>
                <label className={labelClass}>权益类型</label>
                <select
                  value={publicBenefitType}
                  onChange={e => setPublicBenefitType(e.target.value as PublicCloudBenefitType | '')}
                  className={selectClass}
                >
                  <option value="">请选择权益类型</option>
                  {PUBLIC_CLOUD_BENEFIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!publicBenefitType}
                  onClick={() => publicBenefitType && openBenefitPicker('public', publicBenefitType)}
                  className="px-4 h-[42px] text-xs font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {publicBenefitType ? `从外系统选择「${publicBenefitType}」产品` : '请先选择权益类型'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {PUBLIC_CLOUD_BENEFIT_TYPES.map(t => {
                const b = publicBenefitOfType(t);
                if (!b) return null;
                return (
                  <div key={t} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">{t}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.productName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{b.productCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openBenefitPicker('public', t)}
                        className="px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      >
                        更换
                      </button>
                      <button
                        type="button"
                        onClick={() => removePublicBenefit(t)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                        title="移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {publicCount === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                  <Gift className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  暂无公有云权益关联，请选择权益类型后从外系统添加
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 内容：私有云 */}
        {!isPublic && (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50/60 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
              <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700 dark:text-purple-300">
                先选择「权益类型」，再通过外系统的产品查询接口选择产品。每种权益类型支持多选。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
              <div>
                <label className={labelClass}>权益类型</label>
                <select
                  value={privateBenefitType}
                  onChange={e => setPrivateBenefitType(e.target.value as PrivateCloudBenefitType | '')}
                  className={selectClass}
                >
                  <option value="">请选择权益类型</option>
                  {PRIVATE_CLOUD_BENEFIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={!privateBenefitType}
                  onClick={() => privateBenefitType && openBenefitPicker('private', privateBenefitType)}
                  className="px-4 h-[42px] text-xs font-medium text-white bg-purple-600 dark:bg-purple-500 rounded-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {privateBenefitType ? `从外系统选择「${privateBenefitType}」产品` : '请先选择权益类型'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {PRIVATE_CLOUD_BENEFIT_TYPES.map(t => {
                const items = privateBenefitsOfType(t);
                if (items.length === 0) return null;
                return (
                  <div key={t} className="border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50/60 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">{t}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">已关联 {items.length} 个产品</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBenefitPicker('private', t)}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-0.5 rounded transition"
                      >
                        + 继续添加
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {items.map(b => (
                        <div key={b.productCode} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.productName}</div>
                            <div className="text-[11px] text-gray-400 font-mono">{b.productCode}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePrivateBenefit(t, b.productCode)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition shrink-0"
                            title="移除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {privateCount === 0 && (
                <div className="py-10 text-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                  <Package className="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  暂无私有云权益关联，请选择权益类型后从外系统添加
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== STEP 5: 安装包 =====================
  const filteredPkgs = useMemo(() => (form.installPackages || []).filter(p => (p.packageType || 'public') === pkgTab), [form.installPackages, pkgTab]);

  const togglePkgEnabled = (pkgId: string) => {
    updateForm({
      installPackages: (form.installPackages || []).map(p =>
        p.id === pkgId ? { ...p, enabled: !(p.enabled ?? true) } : p
      ),
    });
  };

  const renderStepPackages = () => (
    <div className={cardClass}>
      {/* Tab 切换 */}
      <div className="border-b border-gray-200 dark:border-white/10 px-6 pt-4">
        <div className="flex gap-0">
          {(['public', 'private'] as const).map(tab => (
            <button key={tab} onClick={() => setPkgTab(tab)} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${pkgTab === tab ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'}`}>
              {tab === 'public' ? '端安装包' : '私有云安装包'}
            </button>
          ))}
        </div>
      </div>

      {/* 安装包子标题 + 操作按钮 */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">安装包</h4>
        <div className="flex items-center gap-2">
          {pkgTab === 'private' && (
            <button
              type="button"
              onClick={handleRefreshDeployPackages}
              disabled={refreshDeployPkgLoading || filteredPkgs.length === 0}
              title={filteredPkgs.length === 0 ? '请先添加安装包' : '从运维聚合平台重新拉取最新数据'}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {refreshDeployPkgLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              更新运维聚合平台数据
            </button>
          )}
          <button
            onClick={() => {
              setDeployPkgError(null);
              setPkgForm(pkgTab === 'public'
                ? { name: '', platform: '', source: 'SMS手工维护', cpu: '', os: '', url: '', packageType: 'public', deliveryItemId: '', deliveryItemName: '' }
                : { name: '', source: '对接运维聚合平台', packageType: 'private', deployPackageId: '', deployPackageName: '', versionType: '', packageProductType: '', versionNumber: '', packageKind: '' }
              );
              setIsAddPkgOpen(true);
            }}
            className="unified-button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> 新增安装包
          </button>
        </div>
      </div>

      {filteredPkgs.length > 0 ? (
        <div className="overflow-x-auto">
          {pkgTab === 'public' ? (
            <table className="w-full text-left min-w-[1100px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3">安装包编号</th>
                  <th className="px-5 py-3">交付物编号</th>
                  <th className="px-5 py-3 min-w-[200px]">交付物名称</th>
                  <th className="px-5 py-3">发布平台</th>
                  <th className="px-5 py-3">安装包来源</th>
                  <th className="px-5 py-3">CPU</th>
                  <th className="px-5 py-3">操作系统</th>
                  <th className="px-5 py-3 w-[120px]">安装包</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredPkgs.map(pkg => {
                  const enabled = pkg.enabled ?? true;
                  return (
                  <tr key={pkg.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!enabled ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 text-sm">
                      <a href={pkg.url || '#'} target={pkg.url ? '_blank' : undefined} rel="noreferrer" className="text-[#0071E3] dark:text-[#0A84FF] hover:underline font-mono">{pkg.id}</a>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.deliveryItemId || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white break-words">{pkg.deliveryItemName || pkg.name || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.platform || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.source || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.cpu || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.os || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${enabled ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400 dark:text-gray-500'}`}>
                          {enabled ? '安装包' : '已停用'}
                        </span>
                        <button type="button" role="switch" aria-checked={enabled} onClick={() => togglePkgEnabled(pkg.id)} title={enabled ? '点击停用' : '点击启用'} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-300 dark:bg-white/15'}`}>
                          <span aria-hidden="true" className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => updateForm({ installPackages: (form.installPackages || []).filter(p => p.id !== pkg.id) })} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          ) : (
            // 私有云表格（按图：安装包编号 / 包编号 / 包类型 / 包产品类型 / 版本类型 / 版本号 / 安装包）
            <table className="w-full text-left min-w-[1100px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3">安装包编号</th>
                  <th className="px-5 py-3">包编号</th>
                  <th className="px-5 py-3">包类型</th>
                  <th className="px-5 py-3 min-w-[200px]">包产品类型</th>
                  <th className="px-5 py-3">版本类型</th>
                  <th className="px-5 py-3">版本号</th>
                  <th className="px-5 py-3 w-[120px]">安装包</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredPkgs.map(pkg => {
                  const enabled = pkg.enabled ?? true;
                  return (
                  <tr key={pkg.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!enabled ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 text-sm">
                      <span className="text-[#0071E3] dark:text-[#0A84FF] font-mono" title={pkg.deployPackageName || ''}>{pkg.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 font-mono">{pkg.deployPackageId || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.packageKind || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 break-words">{pkg.packageProductType || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.versionType || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.versionNumber || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${enabled ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400 dark:text-gray-500'}`}>
                          {enabled ? '安装包' : '已停用'}
                        </span>
                        <button type="button" role="switch" aria-checked={enabled} onClick={() => togglePkgEnabled(pkg.id)} title={enabled ? '点击停用' : '点击启用'} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-300 dark:bg-white/15'}`}>
                          <span aria-hidden="true" className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => updateForm({ installPackages: (form.installPackages || []).filter(p => p.id !== pkg.id) })} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="p-12 text-center">
          <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <div className="text-sm text-gray-400 dark:text-gray-500">暂无{pkgTab === 'public' ? '端' : '私有云'}安装包</div>
        </div>
      )}

    </div>
  );

  // ===================== MAIN RENDER =====================
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F2EC] dark:bg-black">
      {/* Sticky Header */}
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

        {/* Step Bar */}
        <div className="flex items-center gap-1 pb-3 overflow-x-auto no-scrollbar">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
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

      {/* Content */}
      <div className="flex-1 p-3 lg:p-4 max-w-[1400px] mx-auto w-full animate-page-enter pb-28">
        {renderStepContent()}
      </div>

      {/* Bottom Action Bar */}
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

      {/* 授权类型选择器 */}
      {isAuthPickerOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" /> 选择授权类型
                </h3>
                <button onClick={() => setIsAuthPickerOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={authPickerSearch}
                    onChange={e => setAuthPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索授权类型名称..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{authTypeCandidates.length}</span> 项
                    {authPickerSearch && unaddedAuthTypeCandidates.length !== authTypeCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{authTypeCandidates.length - unaddedAuthTypeCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={handleAddAllAuthTypes}
                    disabled={unaddedAuthTypeCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" /> {authPickerSearch ? `全部添加 (${unaddedAuthTypeCandidates.length})` : `添加全部 (${unaddedAuthTypeCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {authTypeCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {authTypeCandidates.map(at => {
                      const isAdded = selectedAuthTypeIds.includes(at.id);
                      return (
                      <div key={at.id} className={`py-2.5 flex items-center justify-between gap-3 -mx-2 px-2 rounded-lg transition ${isAdded ? 'bg-green-50/40 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{at.name}</div>
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${at.period === '周期性' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>{at.period}</span>
                            {at.nccBiz && <span className="text-[10px] text-gray-400">NCC业务: {at.nccBiz}</span>}
                          </div>
                        </div>
                        {isAdded ? (
                          <button onClick={() => handleRemoveAuthType(at.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition flex items-center gap-1">
                            <X className="w-3 h-3" /> 移除
                          </button>
                        ) : (
                          <button onClick={() => handleAddAuthType(at.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1">
                            <Plus className="w-3 h-3" /> 添加
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">已添加 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{selectedAuthTypes.length}</span> 项</span>
                <button onClick={() => setIsAuthPickerOpen(false)} className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition">完成</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 组件选择器 */}
      {isComponentPickerOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" /> 选择组件
                </h3>
                <button onClick={() => setIsComponentPickerOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={componentPickerSearch}
                    onChange={e => setComponentPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索组件名称或编号..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{componentCandidates.length}</span> 项
                    {componentCandidates.length !== unaddedComponentCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{componentCandidates.length - unaddedComponentCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={handleAddAllComponents}
                    disabled={unaddedComponentCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" /> {componentPickerSearch ? `全部添加 (${unaddedComponentCandidates.length})` : `添加全部 (${unaddedComponentCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {componentCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {componentCandidates.map(c => {
                      const isAdded = selectedComponentIds.includes(c.id);
                      return (
                      <div key={c.id} className={`py-2.5 flex items-center justify-between gap-3 -mx-2 px-2 rounded-lg transition ${isAdded ? 'bg-green-50/40 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</div>
                            {c.nature && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                c.nature === '自有' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : c.nature === '第三方采购' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                              }`}>{c.nature}</span>
                            )}
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-gray-400">{c.id}</span>
                            {c.version && <span className="text-[10px] text-gray-400">v{c.version}</span>}
                            {c.description && <span className="text-[10px] text-gray-400 truncate">— {c.description}</span>}
                          </div>
                        </div>
                        {isAdded ? (
                          <button onClick={() => handleRemoveComponent(c.id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition flex items-center gap-1">
                            <X className="w-3 h-3" /> 移除
                          </button>
                        ) : (
                          <button onClick={() => handleAddComponent(c)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1">
                            <Plus className="w-3 h-3" /> 添加
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">已添加 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{selectedComponents.length}</span> 项</span>
                <button onClick={() => setIsComponentPickerOpen(false)} className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition">完成</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 运维包富文本编辑弹窗 */}
      {maintenanceModal.open && maintenanceModal.field && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {MAINTENANCE_FIELD_META[maintenanceModal.field].label}使用说明
                </h3>
                <button
                  onClick={() => setMaintenanceModal({ open: false, field: null, html: '' })}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1">
                <RichTextEditor
                  key={maintenanceModal.field}
                  fieldName={MAINTENANCE_FIELD_META[maintenanceModal.field].label}
                  value={maintenanceModal.html}
                  onChange={(html) => setMaintenanceModal(m => ({ ...m, html }))}
                  variables={MAINTENANCE_VARIABLES}
                  placeholder="请输入模板内容"
                  maxLength={10000}
                  minHeight={260}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setMaintenanceModal({ open: false, field: null, html: '' })}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (maintenanceModal.field) {
                      updateForm({ [maintenanceModal.field]: maintenanceModal.html } as Partial<Product>);
                    }
                    setMaintenanceModal({ open: false, field: null, html: '' });
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 销售组织多选器 */}
      {showAddSalesOrg && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" /> 选择销售组织
                  <span className="text-xs font-normal text-gray-400">（可多选）</span>
                </h3>
                <button onClick={closeSalesOrgPicker} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={salesOrgPickerSearch}
                    onChange={e => setSalesOrgPickerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="搜索销售组织..."
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    匹配 <span className="font-semibold text-gray-700 dark:text-gray-200">{salesOrgCandidates.length}</span> 项
                    {salesOrgCandidates.length !== unaddedSalesOrgCandidates.length && (
                      <span className="ml-1.5 text-gray-400">（{salesOrgCandidates.length - unaddedSalesOrgCandidates.length} 项已添加）</span>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Set(salesOrgPickerSelected);
                      const allSelected = unaddedSalesOrgCandidates.every(o => next.has(o));
                      if (allSelected) {
                        unaddedSalesOrgCandidates.forEach(o => next.delete(o));
                      } else {
                        unaddedSalesOrgCandidates.forEach(o => next.add(o));
                      }
                      setSalesOrgPickerSelected(next);
                    }}
                    disabled={unaddedSalesOrgCandidates.length === 0}
                    className="px-3 py-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {unaddedSalesOrgCandidates.length > 0 && unaddedSalesOrgCandidates.every(o => salesOrgPickerSelected.has(o))
                      ? `取消全选 (${unaddedSalesOrgCandidates.length})`
                      : `全选 (${unaddedSalesOrgCandidates.length})`}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {salesOrgCandidates.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {salesOrgCandidates.map(org => {
                      const isAdded = addedSalesOrgs.has(org);
                      const isChecked = salesOrgPickerSelected.has(org);
                      return (
                        <label
                          key={org}
                          className={`py-2.5 px-2 -mx-2 flex items-center gap-3 rounded-lg transition ${
                            isAdded
                              ? 'bg-green-50/40 dark:bg-green-900/10 cursor-not-allowed'
                              : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isAdded}
                            checked={isAdded || isChecked}
                            onChange={() => !isAdded && toggleSalesOrgPicker(org)}
                            className="w-4 h-4 accent-[#0071E3] dark:accent-[#0A84FF] disabled:opacity-60"
                          />
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{org}</span>
                            {isAdded && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-2.5 h-2.5" /> 已添加
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配结果</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  已选 <span className="font-bold text-[#0071E3] dark:text-[#0A84FF]">{salesOrgPickerSelected.size}</span> 项
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeSalesOrgPicker}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddSalesScopes}
                    disabled={salesOrgPickerSelected.size === 0}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加 ({salesOrgPickerSelected.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 新增安装包弹窗 */}
      {isAddPkgOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  新增{pkgTab === 'public' ? '端' : '私有云'}安装包
                </h3>
                <button onClick={() => setIsAddPkgOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
                {/* 安装包维护来源 */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">安装包维护来源</h4>
                  <div className="flex gap-2">
                    {pkgTab === 'public' ? (
                      (['SMS手工维护', '对接交付物平台'] as const).map(s => {
                        const active = (pkgForm.source || 'SMS手工维护') === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPkgForm(prev => ({ ...prev, source: s }))}
                            className={`px-4 py-2 text-xs font-medium rounded-lg border transition ${
                              active
                                ? 'border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/60 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-transparent'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })
                    ) : (
                      // 私有云：仅"对接运维聚合平台"，单标签呈现
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 text-xs font-medium rounded-lg border border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] bg-blue-50/60 dark:bg-blue-900/20 cursor-default"
                      >
                        对接运维聚合平台
                      </button>
                    )}
                  </div>
                </div>

                {/* 表单字段：根据 pkgTab 切换 */}
                {pkgTab === 'public' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>交付物编号</label>
                      <input
                        value={pkgForm.deliveryItemId || ''}
                        onChange={e => setPkgForm({ ...pkgForm, deliveryItemId: e.target.value })}
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5'}
                        placeholder={pkgForm.source === '对接交付物平台' ? '由交付物平台带出' : '可选'}
                        readOnly={pkgForm.source === '对接交付物平台'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>交付物名称 <span className="text-red-500">*</span></label>
                      <input
                        value={pkgForm.deliveryItemName || ''}
                        onChange={e => setPkgForm({ ...pkgForm, deliveryItemName: e.target.value })}
                        className={inputClass}
                        placeholder="请输入"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>发布平台 <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.platform || ''}
                        onChange={e => setPkgForm({ ...pkgForm, platform: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['Windows', 'Linux', 'macOS', 'Android', 'iOS', '通用'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>安装包链接 <span className="text-red-500">*</span></label>
                      <input
                        value={pkgForm.url || ''}
                        onChange={e => setPkgForm({ ...pkgForm, url: e.target.value })}
                        className={inputClass}
                        placeholder="请输入"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CPU <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.cpu || ''}
                        onChange={e => setPkgForm({ ...pkgForm, cpu: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['x86_64', 'ARM64', 'MIPS64', 'LoongArch', '通用'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>操作系统 <span className="text-red-500">*</span></label>
                      <select
                        value={pkgForm.os || ''}
                        onChange={e => setPkgForm({ ...pkgForm, os: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">请选择</option>
                        {['Windows', 'CentOS', 'Ubuntu', 'UOS', 'Kylin', 'macOS', 'Android', 'iOS'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  // 私有云：先填部署包 ID，回车/失焦从运维聚合平台带出其他字段
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>部署包ID <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          value={pkgForm.deployPackageId || ''}
                          onChange={e => {
                            setDeployPkgError(null);
                            setPkgForm(prev => ({ ...prev, deployPackageId: e.target.value }));
                          }}
                          onBlur={e => handleQueryDeployPackage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleQueryDeployPackage((e.target as HTMLInputElement).value); }}
                          className={inputClass + ' pr-9'}
                          placeholder="请输入部署包ID（回车查询）"
                          autoFocus
                        />
                        {deployPkgLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                        )}
                      </div>
                      {deployPkgError && (
                        <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {deployPkgError}
                        </div>
                      )}
                      {!deployPkgError && (
                        <div className="mt-1 text-[10px] text-gray-400">
                          示例 ID：DEP-100001 / DEP-100005 / DEP-100006
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>部署包名称</label>
                      <input
                        value={pkgForm.deployPackageName || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>版本类型</label>
                      <input
                        value={pkgForm.versionType || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>包产品类型</label>
                      <input
                        value={pkgForm.packageProductType || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>版本号</label>
                      <input
                        value={pkgForm.versionNumber || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>包类型</label>
                      <input
                        value={pkgForm.packageKind || ''}
                        readOnly
                        placeholder="由部署包ID自动带出"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-600 dark:text-gray-400'}
                      />
                    </div>
                  </div>
                )}

                {/* 产品信息（自动带出，只读） */}
                <div className="border-t border-gray-100 dark:border-white/10 pt-5">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">产品信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className={labelClass}>产品编号</label>
                      <input
                        value="新建中（保存后生成）"
                        readOnly
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品条线</label>
                      <input
                        value={form.productLine || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品类型</label>
                      <input
                        value={form.productType || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>产品规格</label>
                      <input
                        value={skuName || ''}
                        readOnly
                        placeholder="—"
                        className={inputClass + ' bg-gray-50/60 dark:bg-white/5 cursor-not-allowed text-gray-500 dark:text-gray-400'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end items-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setIsAddPkgOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleAddInstallPkg}
                  disabled={!isPkgFormValid}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#0071E3] dark:bg-[#0A84FF] rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 权益产品选择器（公有云单选 / 私有云多选） */}
      {benefitPicker.open && benefitPicker.cloud && benefitPicker.type && (() => {
        const isMulti = benefitPicker.cloud === 'private';
        const accentClass = isMulti ? 'bg-purple-600 dark:bg-purple-500' : 'bg-[#0071E3] dark:bg-[#0A84FF]';
        const existingCodes = isMulti
          ? new Set((form.privateCloudBenefits || []).filter(b => b.type === benefitPicker.type).map(b => b.productCode))
          : new Set<string>();
        const currentSinglePick = !isMulti
          ? (form.publicCloudBenefits || []).find(b => b.type === benefitPicker.type)?.productCode
          : undefined;
        const newSelectedCount = isMulti ? Array.from(benefitPickerSelected).filter(c => !existingCodes.has(c)).length : 0;
        return (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
                <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift className={`w-4 h-4 ${isMulti ? 'text-purple-500' : 'text-blue-500'}`} />
                    选择产品 - {benefitPicker.type}
                    <span className="text-xs font-normal text-gray-400">
                      （{isMulti ? '私有云权益 · 多选' : '公有云权益 · 单选'}）
                    </span>
                  </h3>
                  <button onClick={closeBenefitPicker} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      autoFocus
                      value={benefitPickerSearch}
                      onChange={e => setBenefitPickerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                      placeholder="按产品编号或名称搜索..."
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    共 <span className="font-semibold text-gray-700 dark:text-gray-200">{benefitProductList.length}</span> 条匹配产品
                    {isMulti && existingCodes.size > 0 && (
                      <span className="ml-1.5 text-gray-400">（其中 {benefitProductList.filter(p => existingCodes.has(p.code)).length} 项已添加）</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  {benefitProductLoading ? (
                    <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> 调用外系统接口查询...
                    </div>
                  ) : benefitProductList.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {benefitProductList.map(p => {
                        const isAlreadyAdded = isMulti && existingCodes.has(p.code);
                        const isChecked = benefitPickerSelected.has(p.code);
                        const isCurrentSingle = !isMulti && currentSinglePick === p.code;

                        if (isMulti) {
                          return (
                            <label
                              key={p.code}
                              className={`py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                                isAlreadyAdded
                                  ? 'bg-green-50/40 dark:bg-green-900/10 cursor-not-allowed'
                                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isAlreadyAdded}
                                checked={isAlreadyAdded || isChecked}
                                onChange={() => !isAlreadyAdded && togglePrivateBenefitInPicker(p.code)}
                                className="w-4 h-4 accent-purple-600 dark:accent-purple-500 disabled:opacity-60"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                  {isAlreadyAdded && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                      <Check className="w-2.5 h-2.5" /> 已添加
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[11px] font-mono text-gray-400">{p.code}</span>
                                  {p.description && <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">— {p.description}</span>}
                                </div>
                              </div>
                            </label>
                          );
                        }

                        // 单选
                        return (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => {
                              setPublicBenefitProduct(benefitPicker.type as PublicCloudBenefitType, p);
                              closeBenefitPicker();
                            }}
                            className={`w-full text-left py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                              isCurrentSingle ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                {isCurrentSingle && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    <Check className="w-2.5 h-2.5" /> 当前选中
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[11px] font-mono text-gray-400">{p.code}</span>
                                {p.description && <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">— {p.description}</span>}
                              </div>
                            </div>
                            <Check className={`w-4 h-4 shrink-0 ${isCurrentSingle ? 'text-blue-500' : 'text-transparent'}`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">无匹配产品</div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isMulti ? <>本次新增 <span className="font-bold text-purple-600 dark:text-purple-400">{newSelectedCount}</span> 项</> : '点击产品即完成关联'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeBenefitPicker}
                      className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                    >
                      {isMulti ? '取消' : '关闭'}
                    </button>
                    {isMulti && (
                      <button
                        onClick={() => {
                          commitPrivateBenefits(benefitPicker.type as PrivateCloudBenefitType, benefitProductList);
                          closeBenefitPicker();
                        }}
                        disabled={newSelectedCount === 0}
                        className={`px-4 py-1.5 text-sm font-medium text-white ${accentClass} rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        添加 ({newSelectedCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalPortal>
        );
      })()}

      {/* 物料选择器（授权 / 介质） */}
      {materialPicker.open && materialPicker.kind && materialPicker.rowIdx != null && (() => {
        const row = form.salesScope?.[materialPicker.rowIdx];
        // 锁定供货组织：来自当前行已选的"另一类"物料
        const lockedSupplyOrg = materialPicker.kind === '授权'
          ? (row?.mediaMaterialCode ? row?.supplyOrg : '')
          : (row?.authMaterialCode ? row?.supplyOrg : '');
        const filteredList = lockedSupplyOrg
          ? materialList.filter(m => m.supplyOrg === lockedSupplyOrg)
          : materialList;
        const otherKindLabel = materialPicker.kind === '授权' ? '介质' : '授权';

        return (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in p-4">
            <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border-white/10">
              <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  选择{materialPicker.kind}物料
                  <span className="text-xs font-normal text-gray-400">
                    （销售组织：{row?.salesOrg}）
                  </span>
                </h3>
                <button
                  onClick={() => setMaterialPicker({ open: false, rowIdx: null, kind: null })}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="px-5 pt-4 pb-3 shrink-0 space-y-2.5">
                {/* 供货组织一致性约束提示 */}
                {lockedSupplyOrg && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/70 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/30">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-200 flex-1">
                      已锁定供货组织为
                      <span className="mx-1 font-semibold">{lockedSupplyOrg}</span>
                      （与已选{otherKindLabel}物料保持一致）。如需切换，请先
                      <button
                        type="button"
                        onClick={() => {
                          const idx = materialPicker.rowIdx!;
                          const patch: Partial<SalesScopeRow> = materialPicker.kind === '授权'
                            ? { mediaMaterialCode: '', mediaMaterialName: '', supplyOrg: '' }
                            : { authMaterialCode: '', authMaterialName: '', supplyOrg: '' };
                          updateSalesScopeRow(idx, patch);
                        }}
                        className="mx-0.5 font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
                      >
                        清空已选{otherKindLabel}物料
                      </button>
                      解除限制。
                    </div>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                    placeholder="按物料编号或名称搜索..."
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  共 <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredList.length}</span> 条匹配物料
                  {lockedSupplyOrg && materialList.length > filteredList.length && (
                    <span className="ml-1.5 text-gray-400">（已过滤 {materialList.length - filteredList.length} 条非「{lockedSupplyOrg}」物料）</span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                {materialLoading ? (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 加载物料清单...
                  </div>
                ) : filteredList.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredList.map(m => {
                      const currentCode = materialPicker.kind === '授权' ? row?.authMaterialCode : row?.mediaMaterialCode;
                      const isSelected = currentCode === m.code;
                      return (
                        <button
                          key={m.code}
                          type="button"
                          onClick={() => {
                            const idx = materialPicker.rowIdx!;
                            const patch: Partial<SalesScopeRow> = materialPicker.kind === '授权'
                              ? { authMaterialCode: m.code, authMaterialName: m.name, supplyOrg: m.supplyOrg }
                              : { mediaMaterialCode: m.code, mediaMaterialName: m.name, supplyOrg: m.supplyOrg };
                            updateSalesScopeRow(idx, patch);
                            setMaterialPicker({ open: false, rowIdx: null, kind: null });
                          }}
                          className={`w-full text-left py-3 px-3 -mx-2 flex items-center gap-3 rounded-lg transition ${
                            isSelected ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</span>
                              {isSelected && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  <Check className="w-2.5 h-2.5" /> 当前选中
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] font-mono text-gray-400">{m.code}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${m.kind === '授权' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>{m.kind}</span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">供货组织：{m.supplyOrg}</span>
                            </div>
                          </div>
                          <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-transparent'}`} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                    {lockedSupplyOrg
                      ? <>当前供货组织「{lockedSupplyOrg}」下无匹配的{materialPicker.kind}物料</>
                      : '无匹配物料'}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end items-center bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={() => setMaterialPicker({ open: false, rowIdx: null, kind: null })}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
        );
      })()}
    </div>
  );
};

export default ProductCreateWizard;
