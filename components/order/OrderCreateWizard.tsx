
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, ActivationMethod, AcceptanceType, AcceptancePhase, OrderSource, BuyerType, InvoiceInfo, AcceptanceInfo, PaymentMethod, DeliveryMethod, OrderDraft, ConversionOrder, CustomerContact, PurchaseNature, SubUnitAuthMode, OnlineDeliveryEntry, Subscription, SubscriptionLineProductSnapshot, LinkedService } from '../../types';
import { initialConversionOrders, ALL_INSTALL_PKG_ROWS } from '../../data/staticData';
import { User as UserIcon, Plus, Trash2, CheckCircle, FileText, CreditCard, Truck, ShoppingBag, X, Target, MousePointer2, ClipboardCheck, ArrowUpRight, Percent, Layers, Network, Globe, Radio, RefreshCcw, Wallet, Zap, Box, Settings, MapPin, Briefcase, XCircle, Search, Save, ScrollText, Phone, Mail, Users, Banknote, Calendar, Check, ChevronRight, ChevronDown, Pencil, Key, Building2, Sparkles, Upload, Download, Wrench, Tag, Package } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  inferOrderLinePurchaseNatureFromSubscription,
  purchaseNatureDisplay,
  subscriptionStatusLabel,
} from './inferOrderLinePurchaseNatureFromSubscription';
import {
  generateId,
  subscriptionLicensePeriodLabel,
  purchaseNatureBadgeClass,
} from './wizard/wizardUtils';
import {
  parseSubUnitsCSV,
  downloadSubUnitTemplate as downloadSubUnitTemplateImpl,
  SUB_UNIT_CSV_HEADERS,
  type SubUnitLocal,
} from './wizard/subUnitCsv';
import { useItemSubUnits } from './wizard/useItemSubUnits';
import { useTempSubUnits } from './wizard/useTempSubUnits';
import { useProductCascade } from './wizard/useProductCascade';
import { useConversion } from './wizard/useConversion';
import Step1OrderType from './wizard/Step1OrderType';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateAll,
  getFieldError,
  type ValidationError,
  type WizardFormState,
} from './wizard/wizardValidation';
import { FieldError, ValidationToast, StepValidationBanner } from './wizard/ValidationFeedback';
import OrderConfirmModal from './wizard/OrderConfirmModal';
import Step2BasicInfo from './wizard/Step2BasicInfo';
import Step3ProductSelect from './wizard/Step3ProductSelect';
import Step4CommerceDelivery from './wizard/Step4CommerceDelivery';
import ConversionPickerModal from './wizard/ConversionPickerModal';
import ContractPickerModal from './wizard/ContractPickerModal';
import OpportunityPickerModal from './wizard/OpportunityPickerModal';
import NewContactModal from './wizard/NewContactModal';
import WizardStepNav from './wizard/WizardStepNav';

interface OrderCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  renewalOrder?: Order;
  /** 从续费管理「续费/增购」进入：预填客户与产品并锁定部分字段 */
  subscriptionCheckout?: { subscription: Subscription; lineProduct: SubscriptionLineProductSnapshot; mode: 'renew' | 'addon' } | null;
  initialDraft?: OrderDraft;
}

const OrderCreateWizard: React.FC<OrderCreateWizardProps> = ({ isOpen, onClose, renewalOrder, subscriptionCheckout, initialDraft }) => {
  const { products, customers, setCustomers, channels, opportunities, contracts, users, orders, setOrders, standaloneEnterprises, orderDrafts, setOrderDrafts, apiMode, refreshOrders, subscriptions } = useAppContext();
  const { currentUser } = useAuth();
  useEnsureData(['customers', 'orders', 'contracts']);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1); // 1: Type, 2: Info, 3: Products, 4: Delivery
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(initialDraft?.id);
  const [draftSavedTip, setDraftSavedTip] = useState(false);
  const isRestoringDraftRef = useRef(false);

  // Step 1: Order Type & Source
  const [buyerType, setBuyerType] = useState<BuyerType | ''>('');
  const [orderSource, setOrderSource] = useState<OrderSource>('Sales');
  const [orderRemark, setOrderRemark] = useState('');
  const [linkedContractIds, setLinkedContractIds] = useState<string[]>([]);
  const [isContractPickerOpen, setIsContractPickerOpen] = useState(false);
  const [contractPickerSearch, setContractPickerSearch] = useState('');
  const [contractPickerPage, setContractPickerPage] = useState(1);
  const CONTRACT_PAGE_SIZE = 50;

  // Step 2: Customer & Buyer & Opportunity
  const [hasOpportunity, setHasOpportunity] = useState<'yes' | 'no' | ''>('');
  const [linkedOpportunityId, setLinkedOpportunityId] = useState('');
  const [oppItemWarnings, setOppItemWarnings] = useState<{ productName: string; missingFields: string[] }[]>([]);
  const [isOppPickerOpen, setIsOppPickerOpen] = useState(false);
  const [oppPickerSearch, setOppPickerSearch] = useState('');
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [directChannel, setDirectChannel] = useState('');
  const [terminalChannel, setTerminalChannel] = useState('');
  const [businessManagerId, setBusinessManagerId] = useState('');
  const [salesRepId, setSalesRepId] = useState('');
  const [creatorId, setCreatorId] = useState(currentUser.id);
  const [orderEnterpriseId, setOrderEnterpriseId] = useState('');
  const [isAgentOrder, setIsAgentOrder] = useState(false);
  const [agentCode, setAgentCode] = useState('');
  const [selectedBuyerNameId, setSelectedBuyerNameId] = useState('');
  // 可选联系人列表 & 选中的联系人 ID
  const [purchasingContacts, setPurchasingContacts] = useState<typeof customers[0]['contacts']>([]);
  const [itContacts, setItContacts] = useState<typeof customers[0]['contacts']>([]);
  const [selectedPurchasingContactId, setSelectedPurchasingContactId] = useState('');
  const [selectedItContactId, setSelectedItContactId] = useState('');
  const [showNewContactModal, setShowNewContactModal] = useState<'Purchasing' | 'IT' | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [newContactForm, setNewContactForm] = useState({ name: '', phone: '', email: '', position: '' });
  
  // Step 3: Merchandise Selection (New Cascading Logic)
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  /** 来自续费管理订阅入口时锁定客户/产品（增购时另锁定授权时间与单价） */
  const [subscriptionLock, setSubscriptionLock] = useState<null | { mode: 'renew' | 'addon'; lineProduct: SubscriptionLineProductSnapshot }>(null);
  /** 用户手动改过订购性质/365 的行号，自动推断不再覆盖该行，直至授权或产品变更清空 */
  const [purchaseNatureManualByRow, setPurchaseNatureManualByRow] = useState<Record<number, boolean>>({});

  const {
    tempCategory, setTempCategory,
    tempHoverCategory, setTempHoverCategory,
    isCategoryPickerOpen, setIsCategoryPickerOpen,
    categoryPickerRef,
    tempProductId, setTempProductId,
    tempSkuId, setTempSkuId, setTempSkuIdFromOption, setTempProductWithSku,
    tempPricingOptionId, setTempPricingOptionId,
    tempQuantity, setTempQuantity,
    tempActivationMethod, setTempActivationMethod,
    tempMediaCount, setTempMediaCount,
    tempSiteLicensePcCount, setTempSiteLicensePcCount,
    tempLicensePeriod, setTempLicensePeriod,
    tempLicensePeriodNum, setTempLicensePeriodNum,
    tempLicensePeriodUnit, setTempLicensePeriodUnit,
    negotiatedPrice, setNegotiatedPrice,
    tempEnterpriseId, setTempEnterpriseId,
    tempLicensee, setTempLicensee,
    tempPkgType, setTempPkgType,
    tempPkgCpu, setTempPkgCpu,
    tempPkgOs, setTempPkgOs,
    tempPkgLink, setTempPkgLink,
    tempPurchaseNature, setTempPurchaseNature,
    tempPurchaseNature365, setTempPurchaseNature365,
    tempSubUnitMode, setTempSubUnitMode,
    tempEcoProductName, setTempEcoProductName,
    categoryTree, selectedCategoryLabel,
    selectedProduct, selectedSku, selectedOption,
    selectedLicenseType, selectedLicensePeriodType, showLicensePeriod,
  } = useProductCascade(products);
  const {
    tempSubUnits,
    setTempSubUnits,
    tempSubUnitImportRef,
    addTempSubUnit,
    updateTempSubUnit,
    removeTempSubUnit,
    handleTempSubUnitImport,
  } = useTempSubUnits(customers);

  const {
    enableConversion,
    setEnableConversion,
    selectedConversionIds,
    setSelectedConversionIds,
    isConversionPickerOpen,
    setIsConversionPickerOpen,
    conversionSearchField,
    setConversionSearchField,
    conversionSearch,
    setConversionSearch,
    availableConversionOrders,
    filteredConversionOrders,
    conversionTotalAmount,
  } = useConversion();

  // categoryTree, selectedProduct, selectedSku, selectedOption, etc. are in useProductCascade

  const [originalOrderId, setOriginalOrderId] = useState<string | undefined>(undefined);

  // Seller info: step 2 picks product category → derives available sales orgs
  const [sellerProductCategory, setSellerProductCategory] = useState('');
  const [isSellerCategoryPickerOpen, setIsSellerCategoryPickerOpen] = useState(false);
  const [sellerHoverCategory, setSellerHoverCategory] = useState('');
  const sellerCategoryPickerRef = useRef<HTMLDivElement>(null);
  const sellerAvailableOrgs = useMemo(() => {
    if (!sellerProductCategory) return [];
    const matched = products.filter(p => p.status === 'OnShelf' && p.subCategory === sellerProductCategory);
    const orgSet = new Set<string>();
    matched.forEach(p => {
      if (p.salesScope && p.salesScope.length > 0) {
        p.salesScope.forEach(r => { if (r.salesOrg) orgSet.add(r.salesOrg); });
      } else if (p.salesOrgName) {
        orgSet.add(p.salesOrgName);
      }
    });
    return Array.from(orgSet);
  }, [sellerProductCategory, products]);
  const sellerCategoryLabel = useMemo(() => {
    if (!sellerProductCategory) return '';
    const parent = categoryTree.find(c => c.subs.includes(sellerProductCategory));
    return parent ? `${parent.label} / ${sellerProductCategory}` : sellerProductCategory;
  }, [sellerProductCategory, categoryTree]);
  const [sellerName, setSellerName] = useState('');
  const [sellerContact, setSellerContact] = useState('');

  // Step 4: Invoice, Payment & Acceptance & Delivery
  const [invoiceForm, setInvoiceForm] = useState<InvoiceInfo>({
      type: 'VAT_Special',
      title: '',
      taxId: '',
      content: '软件产品',
      bankName: '',
      accountNumber: '',
      address: '',
      phone: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WechatPay');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Online');
  const [receivingParty, setReceivingParty] = useState('买方');
  const [receivingCompany, setReceivingCompany] = useState('');
  const [receivingMethod, setReceivingMethod] = useState('邮寄');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingEmail, setShippingEmail] = useState('');
  const [onlineDeliveries, setOnlineDeliveries] = useState<OnlineDeliveryEntry[]>([
      { id: generateId(), receivingParty: '买方', receivingCompany: '', email: '', phone: '' },
  ]);

  const [acceptanceForm, setAcceptanceForm] = useState<AcceptanceInfo>({
      contactName: '',
      contactPhone: '',
      method: 'Remote',
      email: ''
  });
  
  const [acceptanceType, setAcceptanceType] = useState<AcceptanceType>('OneTime');
  const [phaseDrafts, setPhaseDrafts] = useState<{name: string, percentage: number}[]>([
      { name: '第一阶段验收', percentage: 30 },
      { name: '最终验收', percentage: 70 }
  ]);

  type ProductAcceptanceRow = {
      productIdx: number;
      method: '一次性验收' | '分期验收';
      condition: string;
      expectedDate: string;
      percentage: number;
      content?: string;
  };
  const [productAcceptanceRows, setProductAcceptanceRows] = useState<ProductAcceptanceRow[]>([]);

  const [settlementMethod, setSettlementMethod] = useState<'cash' | 'credit' | ''>('cash');
  const [settlementType, setSettlementType] = useState<'once' | 'installment'>('once');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [installmentPlans, setInstallmentPlans] = useState<{amount: number; expectedDate: string; actualDate: string; paidAmount: number}[]>([]);
  const [serialNumberRequirement, setSerialNumberRequirement] = useState<'生成新序列号' | '沿用正式序列号' | '沿用测试序列号'>('生成新序列号');
  const [reuseSerialNumber, setReuseSerialNumber] = useState('');

  const [expandedSubUnitIdx, setExpandedSubUnitIdx] = useState<number | null>(null);

  // --- Realtime Validation State ---
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const markFieldTouched = useCallback((field: string) => {
    setTouchedFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const getVisibleFieldError = useCallback((field: string): string | undefined => {
    if (!touchedFields.has(field) && !hasAttemptedSubmit) return undefined;
    return getFieldError(validationErrors, field);
  }, [validationErrors, touchedFields, hasAttemptedSubmit]);

  const {
    updateItemSubUnitMode,
    addItemSubUnit,
    updateItemSubUnit,
    removeItemSubUnit,
  } = useItemSubUnits(setNewOrderItems);

  const subUnitImportRef = useRef<HTMLInputElement>(null);
  const [importTargetIdx, setImportTargetIdx] = useState<number | null>(null);

  const downloadSubUnitTemplate = downloadSubUnitTemplateImpl;

  const handleSubUnitImport = (itemIdx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const newSubs = parseSubUnitsCSV(text, customers, 'su_imp', msg => alert(msg));
      if (newSubs.length === 0) return;
      setNewOrderItems(prev => prev.map((it, i) => {
        if (i !== itemIdx) return it;
        const existing = (it.subUnits as SubUnitLocal[]) || [];
        return { ...it, subUnits: [...existing, ...newSubs] };
      }));
      alert(`成功导入 ${newSubs.length} 条下级单位数据。`);
    };
    reader.readAsText(file);
  };

  const enableSubUnitAuth = newOrderItems.some(it => it.subUnitAuthMode && it.subUnitAuthMode !== 'none');

  const selectedCustomerObj = customers.find(c => c.id === newOrderCustomer);

  const allEnterprises = useMemo(() => {
    const list: { entId: string; entName: string; customerId: string; customerName: string }[] = [];
    customers.forEach(c => {
      c.enterprises?.forEach(ent => {
        list.push({ entId: ent.id, entName: ent.name, customerId: c.id, customerName: c.companyName });
      });
    });
    standaloneEnterprises.forEach(ent => {
      list.push({ entId: ent.id, entName: ent.name, customerId: '', customerName: '' });
    });
    return list;
  }, [customers, standaloneEnterprises]);

  const handleSelfDealEnterpriseChange = (entId: string) => {
    setOrderEnterpriseId(entId);
    const matched = allEnterprises.find(e => e.entId === entId);
    if (matched) {
      setNewOrderCustomer(matched.customerId);
    } else {
      setNewOrderCustomer('');
    }
  };

  // When buyerType changes to Channel, restrict orderSource; reset if invalid
  useEffect(() => {
    if (isRestoringDraftRef.current) return;
    if (buyerType === 'Customer') {
      setOrderSource('Sales');
    } else if (buyerType === 'Channel') {
      if (orderSource !== 'ChannelPortal' && orderSource !== 'Sales') {
        setOrderSource('ChannelPortal');
      }
    } else if (buyerType === 'RedeemCode') {
      if (orderSource !== 'APISync' && orderSource !== 'Sales') {
        setOrderSource('APISync');
      }
    } else if (buyerType === 'SelfDeal') {
      if (orderSource !== 'OnlineStore' && orderSource !== 'APISync' && orderSource !== 'Sales') {
        setOrderSource('Sales');
      }
      // 自成交订单不支持下级单位授权：切换到自成交时清空配置，避免误带入
      setTempSubUnitMode('none');
      setTempSubUnits([]);
    }
    if (buyerType !== 'SelfDeal') {
      setEnableConversion(false);
      setSelectedConversionIds([]);
      setIsAgentOrder(false);
      setAgentCode('');
    }
    if (buyerType === 'Customer') {
      setHasOpportunity('yes');
    }
    setSelectedBuyerNameId('');
  }, [buyerType]);

  // When toggling hasOpportunity, reset related fields
  useEffect(() => {
    if (isRestoringDraftRef.current) return;
    if (hasOpportunity === 'no') {
      setLinkedOpportunityId('');
      setOppItemWarnings([]);
    }
    if (hasOpportunity === 'yes') {
      setNewOrderCustomer('');
      setOrderEnterpriseId('');
    }
  }, [hasOpportunity]);

  useEffect(() => {
    if (isRestoringDraftRef.current) return;
    if (!sellerProductCategory || sellerAvailableOrgs.length === 0) return;
    if (!sellerName || !sellerAvailableOrgs.includes(sellerName)) {
      setSellerName(sellerAvailableOrgs[0]);
    }
  }, [sellerProductCategory, sellerAvailableOrgs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sellerCategoryPickerRef.current && !sellerCategoryPickerRef.current.contains(e.target as Node)) {
        setIsSellerCategoryPickerOpen(false);
      }
    };
    if (isSellerCategoryPickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSellerCategoryPickerOpen]);

  // Product cascade reset effects are now in useProductCascade

  const salesUsers = users.filter(u => u.roles?.includes('Sales') || u.roles?.includes('Admin'));
  const resetCreateForm = () => {
      setCurrentDraftId(undefined);
      setDraftSavedTip(false);
      setNewOrderCustomer('');
      setOrderEnterpriseId('');
      setIsAgentOrder(false);
      setAgentCode('');
      setLinkedOpportunityId('');
      setHasOpportunity('');
      setBuyerType(''); 
      setOrderSource('Sales');
      setOrderRemark('');
      setLinkedContractIds([]);
      setOriginalOrderId(undefined);
      setSelectedChannelId('');
      setDirectChannel('');
      setTerminalChannel('');
      setSalesRepId(currentUser.roles?.includes('Sales') ? currentUser.id : '');
      setBusinessManagerId('');
      setCreatorId(currentUser.id);
      setNewOrderItems([]);
      setPurchaseNatureManualByRow({});
      setSubscriptionLock(null);
      setSellerProductCategory('');
      setTempCategory('');
      setTempProductId('');
      setTempSkuId('');
      setTempEnterpriseId('');
      setTempPkgType('');
      setTempPkgCpu('');
      setTempPkgOs('');
      setTempPkgLink('');
      setTempPricingOptionId('');
      setNegotiatedPrice(null);
      setCurrentStep(1);
      setInvoiceForm({ type: 'VAT_Special', title: '', taxId: '', content: '软件产品', bankName: '', accountNumber: '', address: '', phone: '' });
      setPaymentMethod('WechatPay');
      setPaymentTerms('');
      setDeliveryMethod('Online');
      setReceivingParty('买方');
      setReceivingCompany('');
      setReceivingMethod('邮寄');
      setShippingAddress('');
      setShippingPhone('');
      setShippingEmail('');
      setOnlineDeliveries([{ id: generateId(), receivingParty: '买方', receivingCompany: '', email: '', phone: '' }]);
      setAcceptanceForm({ contactName: '', contactPhone: '', method: 'Remote', email: '' });
      setAcceptanceType('OneTime');
      setPhaseDrafts([{ name: '第一阶段验收', percentage: 30 }, { name: '最终验收', percentage: 70 }]);
      setProductAcceptanceRows([]);
      setPurchasingContacts([]);
      setItContacts([]);
      setSelectedPurchasingContactId('');
      setSelectedItContactId('');
      setEnableConversion(false);
      setSelectedConversionIds([]);
      setSellerName('');
      setSellerContact('');
      setSettlementMethod('cash');
      setSettlementType('once');
      setExpectedPaymentDate('');
      setInstallmentPlans([]);
      setValidationErrors([]);
      setTouchedFields(new Set());
      setShowValidationToast(false);
      setShowConfirmModal(false);
      setIsSubmitting(false);
      setHasAttemptedSubmit(false);
  };

  const handleClose = () => { onClose(); resetCreateForm(); };

  const buildItemsFromOpportunity = (opp: typeof opportunities[0]) => {
      if (!opp?.products || opp.products.length === 0) return;
      const autoItems: OrderItem[] = [];
      const warnings: { productName: string; missingFields: string[] }[] = [];
      for (const op of opp.products) {
          const prod = products.find(p => p.status === 'OnShelf' && p.name === op.productName);
          if (!prod) {
              warnings.push({ productName: op.productName, missingFields: ['未找到匹配的在售产品，请手动添加'] });
              continue;
          }
          const sku = op.skuName
              ? prod.skus.find(s => s.status === 'Active' && s.name === op.skuName) || prod.skus.find(s => s.status === 'Active')
              : prod.skus.find(s => s.status === 'Active');
          if (!sku) {
              warnings.push({ productName: op.productName, missingFields: ['无可用 SKU 规格，请手动添加'] });
              continue;
          }
          const pricingOpt = op.licenseType
              ? sku.pricingOptions?.find(po => po.title === op.licenseType)
              : sku.pricingOptions?.[0];
          const price = pricingOpt ? pricingOpt.price : sku.price;
          const isPermanent = pricingOpt ? pricingOpt.license.periodUnit === 'Forever' : true;
          autoItems.push({
              productId: prod.id, productName: prod.name,
              skuId: sku.id, skuName: sku.name, skuCode: sku.code,
              quantity: 1, priceAtPurchase: price,
              pricingOptionId: pricingOpt?.id, pricingOptionName: pricingOpt?.title,
              licenseType: pricingOpt?.title || pricingOpt?.name || op.licenseType,
              licensePeriod: isPermanent ? '永久' : undefined,
              activationMethod: (buyerType === 'Customer' || buyerType === 'Channel') ? 'Account' : 'LicenseKey',
              capabilitiesSnapshot: prod.composition?.map(c => c.name) || [],
          });
          const missing: string[] = [];
          if (!pricingOpt) missing.push('授权类型');
          if (!isPermanent && !pricingOpt?.license?.period) missing.push('授权期限');
          if (missing.length > 0) warnings.push({ productName: prod.name, missingFields: missing });
      }
      if (autoItems.length > 0) {
          setNewOrderItems(autoItems);
          const firstProd = products.find(p => p.id === autoItems[0].productId);
          if (firstProd?.salesOrgName) setSellerName(firstProd.salesOrgName);
      }
      setOppItemWarnings(warnings);
  };

  const handleOpportunityChange = (oppId: string) => {
      setLinkedOpportunityId(oppId);
      const opp = opportunities.find(o => o.id === oppId);
      if (opp && opp.customerId) handleCustomerChange(opp.customerId);
      if (opp) buildItemsFromOpportunity(opp);
  };

  const handleCustomerChange = (customerId: string) => {
      setNewOrderCustomer(customerId);
      setPurchaseNatureManualByRow({});
      setOrderEnterpriseId(''); // Reset enterprise selection
      setPurchasingContacts([]);
      setItContacts([]);
      setSelectedPurchasingContactId('');
      setSelectedItContactId('');
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          if (customer.ownerId) setSalesRepId(customer.ownerId);
          setTempLicensee(customer.companyName || '');
          setInvoiceForm(prev => ({
              ...prev,
              title: customer.billingInfo?.title || customer.companyName,
              taxId: customer.billingInfo?.taxId || '',
              bankName: customer.billingInfo?.bankName || '',
              accountNumber: customer.billingInfo?.accountNumber || '',
              address: customer.billingInfo?.registerAddress || '',
              phone: customer.billingInfo?.registerPhone || ''
          }));
          const primaryContact = customer.contacts.find(c => c.isPrimary) || customer.contacts[0];
          if (primaryContact) {
              setAcceptanceForm(prev => ({
                  ...prev,
                  contactName: primaryContact.name,
                  contactPhone: primaryContact.phone,
                  email: primaryContact.email
              }));
          }
          const pContacts = customer.contacts.filter(c => c.roles.includes('Purchasing'));
          const iContacts = customer.contacts.filter(c => c.roles.includes('IT'));
          setPurchasingContacts(pContacts);
          setItContacts(iContacts);
          setSelectedPurchasingContactId('');
          setSelectedItContactId('');
      }
  };

  const handleSaveNewContact = () => {
    if (!newContactForm.name.trim() || !newOrderCustomer || !showNewContactModal) return;
    const role = showNewContactModal;
    const newContact: CustomerContact = {
      id: `contact-${Date.now()}`,
      name: newContactForm.name.trim(),
      phone: newContactForm.phone.trim(),
      email: newContactForm.email.trim(),
      position: newContactForm.position.trim() || undefined,
      roles: [role],
      isPrimary: false,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => prev.map(c => c.id === newOrderCustomer ? { ...c, contacts: [...c.contacts, newContact] } : c));
    if (apiMode) {
        const cust = customers.find(c => c.id === newOrderCustomer);
        if (cust) {
            import('../../services/api').then(({ customerApi }) =>
                customerApi.update(cust.id, { ...cust, contacts: [...cust.contacts, newContact] })
            ).catch(() => {});
        }
    }
    if (role === 'Purchasing') {
      setPurchasingContacts(prev => [...prev, newContact]);
      setSelectedPurchasingContactId(newContact.id);
    } else {
      setItContacts(prev => [...prev, newContact]);
      setSelectedItContactId(newContact.id);
    }
    setShowNewContactModal(null);
    setNewContactForm({ name: '', phone: '', email: '', position: '' });
  };

  const canAddItem = useMemo(() => {
    if (!selectedProduct || !selectedSku || tempQuantity <= 0) return false;
    if (selectedSku.pricingOptions && selectedSku.pricingOptions.length > 0 && !tempPricingOptionId) return false;
    const pkgRows = ALL_INSTALL_PKG_ROWS.filter(r => r.productId === selectedProduct.id && r.enabled);
    if (pkgRows.length > 0 && !tempPkgType) return false;
    if ((buyerType === 'Customer' || buyerType === 'Channel') && !tempEnterpriseId) return false;
    return true;
  }, [selectedProduct, selectedSku, tempQuantity, tempPricingOptionId, tempPkgType, buyerType, tempEnterpriseId, orderEnterpriseId]);

  const handleAddItem = () => {
    if (!canAddItem || !selectedProduct || !selectedSku) return;

    const capabilitiesSnapshot = selectedProduct.composition?.map(c => c.name) || [];

    // Resolve selected install package from shared data
    const pkgRows = ALL_INSTALL_PKG_ROWS.filter(r => r.productId === selectedProduct.id && r.enabled);
    const universalPkgRows = pkgRows.filter(r => r.packageType === 'public');
    const customPkgRows = pkgRows.filter(r => r.packageType === 'private');
    let resolvedInstallPackageName: string | undefined;
    if (tempPkgType === '通用') {
        const matched = universalPkgRows.find(p => !tempPkgOs || p.os === tempPkgOs);
        resolvedInstallPackageName = matched ? `${matched.deliveryItemName} (${matched.cpu} / ${matched.os})` : undefined;
    } else if (tempPkgType === '定制') {
        resolvedInstallPackageName = [tempPkgCpu, tempPkgOs].filter(Boolean).join(' / ') || '定制安装包';
    }

    // For Customer/Channel: use per-item tempEnterpriseId; for SelfDeal: use orderEnterpriseId
    const resolvedEntId = (buyerType === 'Customer' || buyerType === 'Channel') ? tempEnterpriseId : orderEnterpriseId;
    let enterpriseName = undefined;
    if (resolvedEntId && selectedCustomerObj?.enterprises) {
        const ent = selectedCustomerObj.enterprises.find(e => e.id === resolvedEntId);
        if (ent) enterpriseName = ent.name;
    }

    const finalPrice = negotiatedPrice !== null ? negotiatedPrice : (selectedOption ? selectedOption.price : selectedSku.price);

    const isPermanent = selectedOption ? selectedOption.license.periodUnit === 'Forever' : true;
    const derivedLicenseType = selectedOption?.title || selectedOption?.name || undefined;
    const needsManualPeriod = !isPermanent;

    const endCustomerId = (buyerType === 'Customer' || buyerType === 'Channel') ? newOrderCustomer : undefined;
    const withInferredPurchaseNature = (base: OrderItem): OrderItem => {
      if (!endCustomerId) return { ...base, purchaseNature: 'New', purchaseNature365: 'New' };
      const inf = inferOrderLinePurchaseNatureFromSubscription(base, endCustomerId, subscriptions);
      const pn = inf.purchaseNature ?? 'New';
      return { ...base, purchaseNature: pn, purchaseNature365: pn };
    };

    let newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        skuId: selectedSku.id,
        skuName: selectedSku.name,
        skuCode: selectedSku.code,
        quantity: tempQuantity,
        priceAtPurchase: finalPrice,
        pricingOptionId: selectedOption?.id,
        pricingOptionName: selectedOption?.title,
        licenseType: derivedLicenseType,
        licensePeriod: isPermanent ? '永久' : (needsManualPeriod && tempLicensePeriodNum ? `${tempLicensePeriodNum}${tempLicensePeriodUnit}` : undefined),
        activationMethod: tempActivationMethod,
        mediaCount: typeof tempMediaCount === 'number' ? tempMediaCount : undefined,
        siteLicensePcCount: typeof tempSiteLicensePcCount === 'number' ? tempSiteLicensePcCount : undefined,
        purchaseNature: tempPurchaseNature,
        purchaseNature365: tempPurchaseNature365,
        licensee: tempLicensee || undefined,
        installPackageName: resolvedInstallPackageName,
        installPackageType: tempPkgType || undefined,
        installPackageLink: tempPkgType === '定制' && tempPkgLink ? tempPkgLink : undefined,
        enterpriseId: resolvedEntId || undefined,
        enterpriseName: enterpriseName,
        capabilitiesSnapshot,
        subUnitAuthMode: (buyerType !== 'SelfDeal' && tempSubUnitMode !== 'none') ? tempSubUnitMode : undefined,
        subUnits: (buyerType !== 'SelfDeal' && tempSubUnitMode !== 'none' && tempSubUnits.length > 0) ? tempSubUnits : undefined,
        ecoProductName: selectedProduct.tags?.includes('生态') && tempEcoProductName ? tempEcoProductName : undefined,
    };
    if (editingItemIndex === null && tempPurchaseNature === 'New' && tempPurchaseNature365 === 'New') {
      newItem = withInferredPurchaseNature(newItem);
    }

    const itemsToAdd: OrderItem[] = [newItem];

    // Auto-add linked services
    const linkedServices = selectedProduct.linkedServices || [];
    if (linkedServices.length > 0) {
      const existingProductIds = new Set(newOrderItems.map(i => i.productId));
      for (const svc of linkedServices) {
        if (existingProductIds.has(svc.productId)) continue;
        const svcProduct = products.find(p => p.id === svc.productId);
        if (!svcProduct || svcProduct.status !== 'OnShelf') continue;
        const svcSku = svc.skuId
          ? svcProduct.skus.find(s => s.id === svc.skuId && s.status === 'Active')
          : svcProduct.skus.find(s => s.status === 'Active');
        if (!svcSku) continue;
        const svcOption = svcSku.pricingOptions && svcSku.pricingOptions.length > 0 ? svcSku.pricingOptions[0] : undefined;
        const svcPrice = svcOption ? svcOption.price : svcSku.price;
        const svcIsPermanent = svcOption ? svcOption.license.periodUnit === 'Forever' : true;
        itemsToAdd.push(withInferredPurchaseNature({
          productId: svcProduct.id,
          productName: svcProduct.name,
          skuId: svcSku.id,
          skuName: svcSku.name,
          skuCode: svcSku.code,
          quantity: tempQuantity,
          priceAtPurchase: svcPrice,
          pricingOptionId: svcOption?.id,
          pricingOptionName: svcOption?.title,
          licenseType: svcOption?.title || undefined,
          licensePeriod: svcIsPermanent ? '永久' : undefined,
          activationMethod: tempActivationMethod,
          purchaseNature: 'New',
          purchaseNature365: 'New',
          enterpriseId: resolvedEntId || undefined,
          enterpriseName: enterpriseName,
          capabilitiesSnapshot: svcProduct.composition?.map(c => c.name) || [],
        }));
      }
    }

    if (editingItemIndex !== null) {
        setNewOrderItems(prev => prev.map((item, i) => i === editingItemIndex ? newItem : item));
        setEditingItemIndex(null);
    } else {
        setNewOrderItems([...newOrderItems, ...itemsToAdd]);

        if (linkedServices.length > 0) {
          const addedNames = itemsToAdd.slice(1).map(i => i.productName);
          if (addedNames.length > 0) {
            setTimeout(() => alert(`已自动带出关联服务：${addedNames.join('、')}`), 100);
          }
        }
    }

    if (selectedProduct.salesOrgName) {
        setSellerName(selectedProduct.salesOrgName);
    }

    setTempQuantity(1); 
    setTempLicensePeriod('');
    setTempLicensePeriodNum('');
    setTempLicensePeriodUnit('年');
    setNegotiatedPrice(null);
    setTempSkuId('');
    setTempPricingOptionId('');
    setTempEnterpriseId('');
    setTempPkgType('');
    setTempPkgCpu('');
    setTempPkgOs('');
    setTempPkgLink('');
    setTempMediaCount(1);
    setTempPurchaseNature('New');
    setTempPurchaseNature365('New');
    setTempSubUnitMode('none');
    setTempSubUnits([]);
    setTempEcoProductName('');
    setShowAddProductModal(false);
  };

  const handleRemoveItem = (index: number) => {
    if (subscriptionLock && index === 0) return;
    setPurchaseNatureManualByRow({});
    setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  };
  const handleUpdateItem = <K extends keyof OrderItem>(index: number, field: K, value: OrderItem[K]) => {
      if (field === 'purchaseNature' || field === 'purchaseNature365') {
        setPurchaseNatureManualByRow(prev => ({ ...prev, [index]: true }));
      }
      if (field === 'licensePeriod' || field === 'licenseStartDate' || field === 'licenseEndDate' || field === 'productId' || field === 'skuId') {
        setPurchaseNatureManualByRow(prev => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
      setNewOrderItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const handleEditItem = (index: number) => {
      const item = newOrderItems[index];
      if (!item) return;
      if (subscriptionLock && index === 0) return;
      setTempProductId(item.productId);
      setTempSkuId(item.skuId);
      setTempPricingOptionId(item.pricingOptionId || '');
      setTempQuantity(item.quantity);
      setTempActivationMethod(item.activationMethod || 'Account');
      setTempMediaCount(item.mediaCount ?? 1);
      setTempSiteLicensePcCount(item.siteLicensePcCount ?? '');
      setNegotiatedPrice(item.priceAtPurchase);
      setTempEnterpriseId(item.enterpriseId || '');
      setTempLicensee(item.licensee || '');
      setTempPkgType((item.installPackageType as '通用' | '定制' | '') || '');
      setTempPkgLink(item.installPackageLink || '');
      setTempPurchaseNature((item.purchaseNature as PurchaseNature) || 'New');
      setTempPurchaseNature365((item.purchaseNature365 as PurchaseNature) || 'New');
      setTempSubUnitMode((item.subUnitAuthMode as SubUnitAuthMode) || 'none');
      setTempSubUnits((item.subUnits as SubUnitLocal[]) || []);
      setTempEcoProductName(item.ecoProductName || '');
      if (item.licensePeriod && item.licensePeriod !== '永久') {
          const match = item.licensePeriod.match(/^(\d+)(年|月|日)$/);
          if (match) {
              setTempLicensePeriodNum(parseInt(match[1]));
              setTempLicensePeriodUnit(match[2] as '年' | '月' | '日');
          }
      } else {
          setTempLicensePeriodNum('');
          setTempLicensePeriodUnit('年');
      }
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
          setTempCategory(prod.category);
      }
      setEditingItemIndex(index);
      setShowAddProductModal(true);
  };

  const calculateNewOrderTotal = () => newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

  // ── 产品附带服务 ──
  const [serviceProcurementMode, setServiceProcurementMode] = useState<'together' | 'separate'>('separate');
  const prevProductIdsRef = useRef<string>('');

  // 文档3.6: 切换产品类型/名称/授权方式时重置采购方式为默认「分开采购」
  useEffect(() => {
    const currentIds = newOrderItems.map(i => `${i.productId}_${i.skuId}_${i.activationMethod}`).join('|');
    if (prevProductIdsRef.current && prevProductIdsRef.current !== currentIds) {
      setServiceProcurementMode('separate');
    }
    prevProductIdsRef.current = currentIds;
  }, [newOrderItems]);

  // 判断是否有可用的服务配置（根据文档：匹配产品类型+规格+授权方式）
  const hasServiceConfig = useMemo(() => {
    return newOrderItems.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.linkedServices && product.linkedServices.length > 0;
    });
  }, [newOrderItems, products]);

  // 服务明细表格出现的完整条件（文档3.2）：
  // 1. 服务配置可用 2. 选择了一并采购 3. 已选订购性质 4. 已填单价 5. 已填数量
  const showServiceDetailTable = useMemo(() => {
    if (!hasServiceConfig) return false;
    if (serviceProcurementMode !== 'together') return false;
    return newOrderItems.some(item => item.purchaseNature && item.priceAtPurchase > 0 && item.quantity > 0);
  }, [hasServiceConfig, serviceProcurementMode, newOrderItems]);

  // 服务明细数据
  const serviceDetailItems = useMemo(() => {
    if (!showServiceDetailTable) return [];
    const items: { id: string; productType: string; productSpec: string; productName: string; serviceMethod: string; servicePeriod: string; quantity: number; unitPrice: number; subtotal: number; sourceProductName: string; category: string }[] = [];
    newOrderItems.forEach((orderItem, idx) => {
      const product = products.find(p => p.id === orderItem.productId);
      if (!product) return;
      const linkedServices = product.linkedServices || [];
      linkedServices.forEach((svc: LinkedService, sIdx: number) => {
        const svcProduct = products.find(p => p.id === svc.productId);
        if (!svcProduct) return;
        const svcSku = svc.skuId
          ? svcProduct.skus.find(s => s.id === svc.skuId)
          : svcProduct.skus.find(s => s.status === 'Active');
        const svcOption = svcSku?.pricingOptions?.[0];
        const unitPrice = svcOption?.price ?? svcSku?.price ?? 0;
        const period = svcOption
          ? (svcOption.license.periodUnit === 'Forever' ? '永久' : `${svcOption.license.periodNum || 1}${svcOption.license.periodUnit === 'Year' ? '年' : '月'}`)
          : orderItem.licensePeriod || '1年';
        items.push({
          id: `svc_${idx}_${sIdx}`,
          productType: svcProduct.productType || svcProduct.subCategory || '-',
          productSpec: svcSku?.name || '-',
          productName: svcProduct.name,
          serviceMethod: svcProduct.activationMethods?.[0] || '在线服务',
          servicePeriod: period,
          quantity: orderItem.quantity,
          unitPrice,
          subtotal: unitPrice * orderItem.quantity,
          sourceProductName: orderItem.productName,
          category: svc.required ? '必选服务' : '基础服务',
        });
      });
    });
    return items;
  }, [showServiceDetailTable, newOrderItems, products]);

  // --- Realtime Validation Effect ---
  useEffect(() => {
    const formState: WizardFormState = {
      buyerType,
      orderSource,
      hasOpportunity,
      linkedOpportunityId,
      newOrderCustomer,
      orderEnterpriseId,
      selectedChannelId,
      purchasingContacts,
      selectedPurchasingContactId,
      itContacts,
      selectedItContactId,
      isAgentOrder,
      agentCode,
      sellerProductCategory,
      sellerName,
      newOrderItems,
      serialNumberRequirement,
      reuseSerialNumber,
      settlementMethod,
      settlementType,
      installmentPlans,
      productAcceptanceRows,
      orderTotal: newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0),
    };
    setValidationErrors(validateAll(formState));
  }, [
    buyerType, orderSource, hasOpportunity, linkedOpportunityId, newOrderCustomer,
    orderEnterpriseId, selectedChannelId, purchasingContacts, selectedPurchasingContactId,
    itContacts, selectedItContactId, isAgentOrder, agentCode, sellerProductCategory, sellerName, newOrderItems,
    serialNumberRequirement, reuseSerialNumber, settlementMethod, settlementType,
    installmentPlans, productAcceptanceRows,
  ]);

  const orderLinesNatureSourceKey = useMemo(
    () =>
      JSON.stringify(
        newOrderItems.map(i => ({
          productId: i.productId,
          licensePeriod: i.licensePeriod,
          ls: i.licenseStartDate,
          le: i.licenseEndDate,
        })),
      ),
    [newOrderItems],
  );

  /** 根据续费管理订阅 + 客户/产品/授权时间，自动写入订购性质（尊重用户手动修改） */
  useEffect(() => {
    if (currentStep !== 3) return;
    if (!newOrderCustomer || (buyerType !== 'Customer' && buyerType !== 'Channel')) return;
    if (renewalOrder || subscriptionCheckout) return;

    setNewOrderItems(prev => {
      let changed = false;
      const next = prev.map((item, idx) => {
        if (subscriptionLock && idx === 0) return item;
        if (purchaseNatureManualByRow[idx]) return item;
        if (item.purchaseNature === 'Upgrade') return item;
        const inf = inferOrderLinePurchaseNatureFromSubscription(item, newOrderCustomer, subscriptions);
        if (!inf.purchaseNature) return item;
        const cur365 = item.purchaseNature365 ?? 'New';
        if (item.purchaseNature === inf.purchaseNature && cur365 === inf.purchaseNature) return item;
        changed = true;
        return { ...item, purchaseNature: inf.purchaseNature, purchaseNature365: inf.purchaseNature };
      });
      return changed ? next : prev;
    });
  }, [
    orderLinesNatureSourceKey,
    currentStep,
    newOrderCustomer,
    buyerType,
    renewalOrder,
    subscriptionCheckout,
    subscriptions,
    subscriptionLock,
    purchaseNatureManualByRow,
  ]);

  // Sync productAcceptanceRows when items change
  useEffect(() => {
      setProductAcceptanceRows(prev => {
          const existingMap = new Map<number, ProductAcceptanceRow[]>();
          prev.forEach(r => {
              const arr = existingMap.get(r.productIdx) || [];
              arr.push(r);
              existingMap.set(r.productIdx, arr);
          });
          const next: ProductAcceptanceRow[] = [];
          newOrderItems.forEach((_, idx) => {
              const existing = existingMap.get(idx);
              if (existing && existing.length > 0) {
                  next.push(...existing);
              } else {
                  next.push({ productIdx: idx, method: '一次性验收', condition: '视同验收', expectedDate: '', percentage: 100, content: '' });
              }
          });
          return next;
      });
  }, [newOrderItems.length]);

  // --- Save Draft ---
  const handleSaveDraft = () => {
    // Generate or reuse order ID
    const orderId = currentDraftId || `S${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Write a lightweight DRAFT order entry into orders list
    const customer = customers.find(c => c.id === newOrderCustomer);
    const draftOrder: Order = {
      id: orderId,
      customerId: newOrderCustomer || orderEnterpriseId || '',
      customerName: customer?.companyName || (newOrderCustomer ? newOrderCustomer : '（草稿）'),
      date: new Date().toISOString(),
      status: OrderStatus.DRAFT,
      total: calculateNewOrderTotal(),
      items: newOrderItems,
      source: orderSource || 'Sales',
      buyerType: (buyerType as BuyerType) || 'Customer',
      isPaid: false,
      isPackageConfirmed: false,
      isCDBurned: false,
      approval: { salesApproved: false, businessApproved: false, financeApproved: false },
      approvalRecords: [],
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      opportunityId: linkedOpportunityId || undefined,
      orderRemark: orderRemark || undefined,
    };
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === orderId);
      if (idx >= 0) { const next = [...prev]; next[idx] = draftOrder; return next; }
      return [draftOrder, ...prev];
    });

    // Save full wizard state in orderDrafts
    const draft: OrderDraft = {
      id: orderId,
      savedAt: new Date().toISOString(),
      currentStep,
      buyerType, orderSource, orderRemark, linkedContractIds, creatorId, originalOrderId,
      hasOpportunity, linkedOpportunityId, newOrderCustomer,
      orderEnterpriseId, isAgentOrder, agentCode, selectedChannelId, directChannel, terminalChannel, salesRepId, businessManagerId, buyerNameId: selectedBuyerNameId,
      newOrderItems, tempCategory, sellerProductCategory, enableConversion, selectedConversionIds, sellerName, sellerContact,
      invoiceForm,
      deliveryMethod, receivingParty, receivingCompany, receivingMethod, shippingAddress, shippingPhone, shippingEmail, onlineDeliveries,
      acceptanceForm, acceptanceType, phaseDrafts,
      purchasingContactId: selectedPurchasingContactId,
      itContactId: selectedItContactId,
      settlementMethod,
      expectedPaymentDate,
      serialNumberRequirement,
      reuseSerialNumber,
    };
    setOrderDrafts(prev => {
      const exists = prev.findIndex(d => d.id === orderId);
      if (exists >= 0) { const next = [...prev]; next[exists] = draft; return next; }
      return [draft, ...prev];
    });
    setCurrentDraftId(orderId);
    setDraftSavedTip(true);
    setTimeout(() => setDraftSavedTip(false), 2500);
  };

  // --- Restore from draft ---
  useEffect(() => {
    if (!initialDraft) return;
    isRestoringDraftRef.current = true;
    const d = initialDraft;
    setCurrentStep(d.currentStep);
    setBuyerType(d.buyerType);
    setOrderSource(d.orderSource);
    setOrderRemark(d.orderRemark || '');
    setLinkedContractIds(d.linkedContractIds || []);
    setCreatorId(d.creatorId);
    setOriginalOrderId(d.originalOrderId);
    setHasOpportunity(d.hasOpportunity);
    setLinkedOpportunityId(d.linkedOpportunityId);
    setNewOrderCustomer(d.newOrderCustomer);
    setOrderEnterpriseId(d.orderEnterpriseId);
    setIsAgentOrder(d.isAgentOrder || false);
    setAgentCode(d.agentCode || '');
    setSelectedBuyerNameId(d.buyerNameId || '');
    setSelectedChannelId(d.selectedChannelId);
    setDirectChannel(d.directChannel || '');
    setTerminalChannel(d.terminalChannel || '');
    setSalesRepId(d.salesRepId);
    setBusinessManagerId(d.businessManagerId);
    setNewOrderItems(d.newOrderItems);
    setTempCategory(d.tempCategory);
    setEnableConversion(d.enableConversion || false);
    setSelectedConversionIds(d.selectedConversionIds || []);
    setSellerProductCategory(d.sellerProductCategory || '');
    setSellerName(d.sellerName || '');
    setSellerContact(d.sellerContact || '');
    setInvoiceForm(d.invoiceForm);
    setDeliveryMethod(d.deliveryMethod);
    setReceivingParty(d.receivingParty);
    setReceivingCompany(d.receivingCompany);
    setReceivingMethod(d.receivingMethod);
    setShippingAddress(d.shippingAddress);
    setShippingPhone(d.shippingPhone || '');
    setShippingEmail(d.shippingEmail || '');
    if (d.onlineDeliveries && d.onlineDeliveries.length > 0) setOnlineDeliveries(d.onlineDeliveries);
    setAcceptanceForm(d.acceptanceForm);
    setAcceptanceType(d.acceptanceType);
    setPhaseDrafts(d.phaseDrafts);
    setCurrentDraftId(d.id);
    setSelectedPurchasingContactId(d.purchasingContactId || '');
    setSelectedItContactId(d.itContactId || '');
    setSettlementMethod(d.settlementMethod || 'cash');
    setExpectedPaymentDate(d.expectedPaymentDate || '');
    setSerialNumberRequirement(d.serialNumberRequirement || '生成新序列号');
    setReuseSerialNumber(d.reuseSerialNumber || '');
    // 恢复可选联系人列表
    const cust = customers.find(c => c.id === d.newOrderCustomer);
    if (cust) {
      setPurchasingContacts(cust.contacts.filter(c => c.roles.includes('Purchasing')));
      setItContacts(cust.contacts.filter(c => c.roles.includes('IT')));
    }
    if (d.buyerType === 'Customer') {
      setHasOpportunity('yes');
    }
    requestAnimationFrame(() => { isRestoringDraftRef.current = false; });
  }, [initialDraft]);

  const handleCreateOrder = () => {
    setHasAttemptedSubmit(true);
    const currentErrors = validationErrors;
    if (currentErrors.length > 0) {
      setShowValidationToast(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const customer = customers.find(c => c.id === newOrderCustomer);
    const salesUser = users.find(u => u.id === salesRepId);
    const businessUser = users.find(u => u.id === businessManagerId);
    const creatorUser = users.find(u => u.id === creatorId) || currentUser;
    const linkedOpp = opportunities.find(o => o.id === linkedOpportunityId);

    // Reuse draft order ID if available, otherwise generate new
    const newId = currentDraftId || `S${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const totalAmount = calculateNewOrderTotal();
    
    const phases: AcceptancePhase[] = [];
    const hasPhased = productAcceptanceRows.some(r => r.method === '分期验收');
    const resolvedAcceptanceType: AcceptanceType = hasPhased ? 'Phased' : 'OneTime';
    let phaseIdx = 0;
    for (let i = 0; i < newOrderItems.length; i++) {
        const rows = productAcceptanceRows.filter(r => r.productIdx === i);
        const itemAmount = newOrderItems[i].priceAtPurchase * newOrderItems[i].quantity;
        let allocatedAmount = 0;
        for (let ri = 0; ri < rows.length; ri++) {
            const row = rows[ri];
            const isLast = ri === rows.length - 1;
            const amount = isLast
                ? Math.round((itemAmount - allocatedAmount) * 100) / 100
                : Math.round(itemAmount * row.percentage / 100 * 100) / 100;
            allocatedAmount += amount;
            phases.push({
                id: `ph-${Date.now()}-${phaseIdx++}`,
                name: `${newOrderItems[i].productName}${rows.length > 1 ? ` (${ri + 1}/${rows.length})` : ''}`,
                percentage: row.percentage,
                amount,
                status: 'Pending',
                content: row.content || undefined,
            });
        }
    }

    const newOrder: Order = {
        id: newId, 
        customerId: newOrderCustomer || orderEnterpriseId, 
        customerName: customer ? customer.companyName : (buyerType === 'SelfDeal' ? '企业暂未关联客户' : '未知'), 
        customerType: customer?.customerType,
        customerLevel: customer?.level,
        customerIndustry: customer?.industry,
        customerRegion: customer?.region,
        date: new Date().toISOString(),
        status: buyerType === 'SelfDeal' ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING_APPROVAL,
        source: orderSource,
        deliveryMethod: deliveryMethod, 
        receivingParty,
        receivingCompany,
        receivingMethod,
        originalOrderId: originalOrderId,
        total: totalAmount, items: newOrderItems,
        shippingAddress: shippingAddress || (customer ? customer.address : ''),
        shippingPhone: shippingPhone || undefined,
        shippingEmail: shippingEmail || undefined,
        onlineDeliveries: (deliveryMethod === 'Online' || deliveryMethod === 'Hybrid') && onlineDeliveries.length > 0 ? onlineDeliveries : undefined,
        isPaid: false, 
        isPackageConfirmed: deliveryMethod === 'Online' || deliveryMethod === 'Hybrid', 
        isCDBurned: deliveryMethod === 'Online' || deliveryMethod === 'Hybrid', 
        approval: { salesApproved: false, businessApproved: false, financeApproved: false },
        approvalRecords: [], salesRepId: salesRepId, salesRepName: salesUser?.name, 
        businessManagerId: businessManagerId, businessManagerName: businessUser?.name,
        creatorId: creatorUser.id, creatorName: creatorUser.name.replace(/\s*\(.*?\)/g, ''), creatorPhone: creatorUser.phone,
        buyerType: buyerType as BuyerType,
        buyerId: buyerType === 'Channel' ? selectedChannelId : (buyerType === 'Customer' ? newOrderCustomer : undefined),
        buyerName: selectedBuyerNameId
            ? (buyerType === 'Channel' ? channels.find(c => c.id === selectedBuyerNameId)?.name : customers.find(c => c.id === selectedBuyerNameId)?.companyName)
            : (buyerType === 'Channel' ? channels.find(c => c.id === selectedChannelId)?.name : customer?.companyName),
        directChannel: buyerType === 'Channel' && directChannel ? directChannel : undefined,
        terminalChannel: buyerType === 'Channel' && terminalChannel ? terminalChannel : undefined,
        invoiceInfo: invoiceForm, 
        paymentMethod: undefined,
        paymentTerms: undefined,
        acceptanceInfo: acceptanceForm,
        acceptanceConfig: { type: resolvedAcceptanceType, status: 'Pending', phases, setupDate: new Date().toISOString() },
        opportunityId: linkedOpp?.id, opportunityName: linkedOpp?.name,
        orderRemark: orderRemark || undefined,
        purchasingContactId: selectedPurchasingContactId || undefined,
        itContactId: selectedItContactId || undefined,
        linkedContractIds: buyerType !== 'SelfDeal' && linkedContractIds.length > 0 ? linkedContractIds : undefined,
        linkedContractNames: buyerType !== 'SelfDeal' && linkedContractIds.length > 0 ? linkedContractIds.map(id => contracts.find(c => c.id === id)?.name || id) : undefined,
        settlementMethod: settlementMethod || undefined,
        settlementType: settlementMethod === 'credit' ? settlementType : undefined,
        expectedPaymentDate: settlementMethod === 'credit' && settlementType === 'once' && expectedPaymentDate ? expectedPaymentDate : undefined,
        installmentPlans: settlementMethod === 'credit' && settlementType === 'installment' && installmentPlans.length > 0 ? installmentPlans : undefined,
        conversionDeductionAmount: enableConversion && conversionTotalAmount > 0 ? conversionTotalAmount : undefined,
        sellerName: sellerName || undefined,
        sellerContact: sellerContact || undefined,
        isAgentOrder: buyerType === 'SelfDeal' && isAgentOrder ? true : undefined,
        agentCode: buyerType === 'SelfDeal' && isAgentOrder && agentCode ? agentCode : undefined,
    };
    if (apiMode) {
        try {
            const { orderApi } = await import('../../services/api');
            const created = await orderApi.create(newOrder);
            if (currentDraftId) setOrderDrafts(prev => prev.filter(d => d.id !== currentDraftId));
            await refreshOrders();
            setShowConfirmModal(false);
            onClose(); resetCreateForm(); navigate(`/orders/${created.id}`);
        } catch (e: unknown) {
            setIsSubmitting(false);
            alert(e instanceof Error ? e.message : '创建订单失败');
            return;
        }
    } else {
        if (currentDraftId) {
            setOrders(prev => prev.map(o => o.id === currentDraftId ? newOrder : o));
            setOrderDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        } else {
            setOrders([newOrder, ...orders]);
        }
        setShowConfirmModal(false);
        onClose(); resetCreateForm(); navigate(`/orders/${newOrder.id}`);
    }
  };

  // --- Handle Renewal Initialization ---
  useEffect(() => {
      if (!renewalOrder) return;
      const original = renewalOrder;
      resetCreateForm();
      
      setOrderSource('Renewal');
      setOriginalOrderId(original.id);
      setBuyerType(original.buyerType || 'Customer');
      
      handleCustomerChange(original.customerId);
      if (original.opportunityId) setLinkedOpportunityId(original.opportunityId);
      if (original.salesRepId) setSalesRepId(original.salesRepId);
      if (original.businessManagerId) setBusinessManagerId(original.businessManagerId);
      
      const renewalItems: OrderItem[] = original.items.map(item => ({
          ...item,
          deliveredContent: [],
      }));
      setNewOrderItems(renewalItems);
      setCurrentStep(3);
  }, [renewalOrder]);

  // --- 从续费管理订阅发起续费/增购 ---
  useEffect(() => {
    if (!subscriptionCheckout) return;
    const { subscription, lineProduct, mode } = subscriptionCheckout;
    resetCreateForm();
    setSubscriptionLock({ mode, lineProduct });

    const customerObj = customers.find(c => c.id === subscription.customerId);
    const product = products.find(p => p.id === lineProduct.productCode)
      || products.find(p => p.name === lineProduct.productName);
    if (!customerObj || !product) {
      alert(!customerObj ? '未找到订阅关联客户，请检查客户主数据。' : '未找到订阅关联在售产品，请检查产品编码。');
      setSubscriptionLock(null);
      return;
    }
    const sku = product.skus.find(s => s.name === lineProduct.skuName && s.status === 'Active')
      || product.skus.find(s => s.status === 'Active');
    if (!sku) {
      alert('未找到匹配的 SKU 规格');
      setSubscriptionLock(null);
      return;
    }
    const opt = sku.pricingOptions?.find(o => o.title === lineProduct.licenseType)
      || sku.pricingOptions?.[0];
    const price = opt?.price ?? sku.price;
    const isPermanent = opt ? opt.license.periodUnit === 'Forever' : false;
    const licensePeriod = isPermanent ? '永久' : subscriptionLicensePeriodLabel(lineProduct.startDate, lineProduct.endDate, opt);

    const item: OrderItem = {
      productId: product.id,
      productName: product.name,
      skuId: sku.id,
      skuName: sku.name,
      skuCode: sku.code,
      quantity: Math.max(1, lineProduct.currentQuantity),
      priceAtPurchase: price,
      pricingOptionId: opt?.id,
      pricingOptionName: opt?.title,
      licenseType: opt?.title ?? lineProduct.licenseType,
      licensePeriod,
      licenseStartDate: lineProduct.startDate,
      licenseEndDate: lineProduct.endDate,
      activationMethod: 'Account',
      mediaCount: 1,
      purchaseNature: mode === 'renew' ? 'Renewal' : 'AddOn',
      purchaseNature365: mode === 'renew' ? 'Renewal' : 'AddOn',
      licensee: customerObj.companyName,
      enterpriseId: customerObj.enterprises?.[0]?.id,
      enterpriseName: customerObj.enterprises?.[0]?.name,
      capabilitiesSnapshot: product.composition?.map(c => c.name) || [],
    };

    setBuyerType('Customer');
    setOrderSource(mode === 'renew' ? 'Renewal' : 'Sales');
    setHasOpportunity('no');
    setOrderRemark(mode === 'renew' ? `【订阅续费】${subscription.id} ${lineProduct.productCode}` : `【订阅增购】${subscription.id} ${lineProduct.productCode}`);
    if (lineProduct.lastOrderId) setOriginalOrderId(lineProduct.lastOrderId);
    handleCustomerChange(subscription.customerId);
    setNewOrderItems([item]);
    if (product.salesOrgName) setSellerName(product.salesOrgName);
    setCurrentStep(3);
  }, [subscriptionCheckout]);


  if (!isOpen) return null;

  return (
    <>
      {/* --- Create Order Drawer (slides in from right) --- */}
        <ModalPortal>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[500] animate-fade-in"
          onClick={handleClose}
        />
        <div className="fixed inset-y-0 right-0 z-[501] w-[calc(100vw-240px)] flex flex-col bg-white dark:bg-[#1C1C1E] shadow-2xl border-l border-gray-200 dark:border-white/10 animate-drawer-enter overflow-hidden">
            
            {/* Wizard Header */}
            <div className="px-8 py-3 border-b border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur flex justify-between items-center shrink-0">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3" style={{ fontSize: '20px' }}>
                        新建订单
                        {subscriptionLock && (
                            <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 text-xs font-bold rounded-lg flex items-center gap-1">
                                <RefreshCcw className="w-3.5 h-3.5"/> {subscriptionLock.mode === 'renew' ? '订阅续费' : '订阅增购'}
                            </span>
                        )}
                        {orderSource === 'Renewal' && !subscriptionLock && (
                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                <RefreshCcw className="w-3.5 h-3.5"/> 续费模式
                            </span>
                        )}
                    </h3>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                    <X className="w-6 h-6"/>
                </button>
            </div>

            <WizardStepNav currentStep={currentStep} />

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                {/* 步骤级校验错误 Banner */}
                {hasAttemptedSubmit && <StepValidationBanner errors={validationErrors} currentStep={currentStep} />}

                {/* Step 1: Order Type & Source */}
                {currentStep === 1 && (
                    <Step1OrderType
                        buyerType={buyerType}
                        setBuyerType={setBuyerType}
                        orderSource={orderSource}
                        setOrderSource={setOrderSource}
                        setLinkedContractIds={setLinkedContractIds}
                        users={users}
                        creatorId={creatorId}
                        currentUser={currentUser}
                        orderRemark={orderRemark}
                        setOrderRemark={setOrderRemark}
                    />
                )}

                {currentStep === 2 && (
                    <Step2BasicInfo
                        agentCode={agentCode}
                        allEnterprises={allEnterprises}
                        businessManagerId={businessManagerId}
                        buyerType={buyerType}
                        categoryTree={categoryTree}
                        channels={channels}
                        contracts={contracts}
                        customers={customers}
                        directChannel={directChannel}
                        getVisibleFieldError={getVisibleFieldError}
                        handleCustomerChange={handleCustomerChange}
                        handleSelfDealEnterpriseChange={handleSelfDealEnterpriseChange}
                        hasOpportunity={hasOpportunity}
                        isAgentOrder={isAgentOrder}
                        isSellerCategoryPickerOpen={isSellerCategoryPickerOpen}
                        itContacts={itContacts}
                        linkedContractIds={linkedContractIds}
                        linkedOpportunityId={linkedOpportunityId}
                        markFieldTouched={markFieldTouched}
                        newOrderCustomer={newOrderCustomer}
                        opportunities={opportunities}
                        orderEnterpriseId={orderEnterpriseId}
                        orderSource={orderSource}
                        products={products}
                        purchasingContacts={purchasingContacts}
                        salesRepId={salesRepId}
                        salesUsers={salesUsers}
                        selectedBuyerNameId={selectedBuyerNameId}
                        selectedChannelId={selectedChannelId}
                        selectedCustomerObj={selectedCustomerObj}
                        selectedItContactId={selectedItContactId}
                        selectedPurchasingContactId={selectedPurchasingContactId}
                        sellerAvailableOrgs={sellerAvailableOrgs}
                        sellerCategoryLabel={sellerCategoryLabel}
                        sellerCategoryPickerRef={sellerCategoryPickerRef}
                        sellerHoverCategory={sellerHoverCategory}
                        sellerName={sellerName}
                        sellerProductCategory={sellerProductCategory}
                        setAgentCode={setAgentCode}
                        setBusinessManagerId={setBusinessManagerId}
                        setDirectChannel={setDirectChannel}
                        setHasOpportunity={setHasOpportunity}
                        setIsAgentOrder={setIsAgentOrder}
                        setIsContractPickerOpen={setIsContractPickerOpen}
                        setIsOppPickerOpen={setIsOppPickerOpen}
                        setIsSellerCategoryPickerOpen={setIsSellerCategoryPickerOpen}
                        setLinkedContractIds={setLinkedContractIds}
                        setLinkedOpportunityId={setLinkedOpportunityId}
                        setNewContactForm={setNewContactForm}
                        setNewOrderCustomer={setNewOrderCustomer}
                        setNewOrderItems={setNewOrderItems}
                        setOppItemWarnings={setOppItemWarnings}
                        setOrderEnterpriseId={setOrderEnterpriseId}
                        setSalesRepId={setSalesRepId}
                        setSelectedBuyerNameId={setSelectedBuyerNameId}
                        setSelectedChannelId={setSelectedChannelId}
                        setSelectedItContactId={setSelectedItContactId}
                        setSelectedPurchasingContactId={setSelectedPurchasingContactId}
                        setSellerHoverCategory={setSellerHoverCategory}
                        setSellerName={setSellerName}
                        setSellerProductCategory={setSellerProductCategory}
                        setShowNewContactModal={setShowNewContactModal}
                        setTerminalChannel={setTerminalChannel}
                        subscriptionLock={subscriptionLock}
                        terminalChannel={terminalChannel}
                        users={users}
                    />
                )}

                {currentStep === 3 && (
                    <Step3ProductSelect
                        SUB_UNIT_CSV_HEADERS={SUB_UNIT_CSV_HEADERS}
                        addItemSubUnit={addItemSubUnit}
                        addTempSubUnit={addTempSubUnit}
                        availableConversionOrders={availableConversionOrders}
                        buyerType={buyerType}
                        calculateNewOrderTotal={calculateNewOrderTotal}
                        canAddItem={canAddItem}
                        categoryPickerRef={categoryPickerRef}
                        categoryTree={categoryTree}
                        conversionTotalAmount={conversionTotalAmount}
                        customers={customers}
                        downloadSubUnitTemplate={downloadSubUnitTemplate}
                        editingItemIndex={editingItemIndex}
                        enableConversion={enableConversion}
                        enableSubUnitAuth={enableSubUnitAuth}
                        expandedSubUnitIdx={expandedSubUnitIdx}
                        handleAddItem={handleAddItem}
                        handleEditItem={handleEditItem}
                        handleRemoveItem={handleRemoveItem}
                        handleSubUnitImport={handleSubUnitImport}
                        handleTempSubUnitImport={handleTempSubUnitImport}
                        handleUpdateItem={handleUpdateItem}
                        hasServiceConfig={hasServiceConfig}
                        isCategoryPickerOpen={isCategoryPickerOpen}
                        linkedOpportunityId={linkedOpportunityId}
                        negotiatedPrice={negotiatedPrice}
                        newOrderCustomer={newOrderCustomer}
                        newOrderItems={newOrderItems}
                        oppItemWarnings={oppItemWarnings}
                        orderSource={orderSource}
                        originalOrderId={originalOrderId}
                        products={products}
                        removeItemSubUnit={removeItemSubUnit}
                        removeTempSubUnit={removeTempSubUnit}
                        renewalOrder={renewalOrder}
                        selectedCategoryLabel={selectedCategoryLabel}
                        selectedConversionIds={selectedConversionIds}
                        selectedCustomerObj={selectedCustomerObj}
                        selectedLicensePeriodType={selectedLicensePeriodType}
                        selectedLicenseType={selectedLicenseType}
                        selectedOption={selectedOption}
                        selectedProduct={selectedProduct}
                        selectedSku={selectedSku}
                        sellerContact={sellerContact}
                        sellerName={sellerName}
                        serviceDetailItems={serviceDetailItems}
                        serviceProcurementMode={serviceProcurementMode}
                        setAgentCode={setAgentCode}
                        setBusinessManagerId={setBusinessManagerId}
                        setConversionSearch={setConversionSearch}
                        setDirectChannel={setDirectChannel}
                        setEditingItemIndex={setEditingItemIndex}
                        setEnableConversion={setEnableConversion}
                        setExpandedSubUnitIdx={setExpandedSubUnitIdx}
                        setHasOpportunity={setHasOpportunity}
                        setImportTargetIdx={setImportTargetIdx}
                        setIsAgentOrder={setIsAgentOrder}
                        setIsCategoryPickerOpen={setIsCategoryPickerOpen}
                        setIsContractPickerOpen={setIsContractPickerOpen}
                        setIsConversionPickerOpen={setIsConversionPickerOpen}
                        setIsOppPickerOpen={setIsOppPickerOpen}
                        setIsSellerCategoryPickerOpen={setIsSellerCategoryPickerOpen}
                        setLinkedContractIds={setLinkedContractIds}
                        setLinkedOpportunityId={setLinkedOpportunityId}
                        setNegotiatedPrice={setNegotiatedPrice}
                        setNewContactForm={setNewContactForm}
                        setNewOrderItems={setNewOrderItems}
                        setOppItemWarnings={setOppItemWarnings}
                        setOrderEnterpriseId={setOrderEnterpriseId}
                        setPurchaseNatureManualByRow={setPurchaseNatureManualByRow}
                        setSalesRepId={setSalesRepId}
                        setSelectedBuyerNameId={setSelectedBuyerNameId}
                        setSelectedChannelId={setSelectedChannelId}
                        setSelectedConversionIds={setSelectedConversionIds}
                        setSelectedItContactId={setSelectedItContactId}
                        setSelectedPurchasingContactId={setSelectedPurchasingContactId}
                        setSellerHoverCategory={setSellerHoverCategory}
                        setSellerName={setSellerName}
                        setSellerProductCategory={setSellerProductCategory}
                        setServiceProcurementMode={setServiceProcurementMode}
                        setShowAddProductModal={setShowAddProductModal}
                        setShowNewContactModal={setShowNewContactModal}
                        setTempActivationMethod={setTempActivationMethod}
                        setTempCategory={setTempCategory}
                        setTempEcoProductName={setTempEcoProductName}
                        setTempEnterpriseId={setTempEnterpriseId}
                        setTempHoverCategory={setTempHoverCategory}
                        setTempLicensePeriod={setTempLicensePeriod}
                        setTempLicensePeriodNum={setTempLicensePeriodNum}
                        setTempLicensePeriodUnit={setTempLicensePeriodUnit}
                        setTempLicensee={setTempLicensee}
                        setTempMediaCount={setTempMediaCount}
                        setTempPkgCpu={setTempPkgCpu}
                        setTempPkgLink={setTempPkgLink}
                        setTempPkgOs={setTempPkgOs}
                        setTempPkgType={setTempPkgType}
                        setTempPricingOptionId={setTempPricingOptionId}
                        setTempProductId={setTempProductId}
                        setTempProductWithSku={setTempProductWithSku}
                        setTempPurchaseNature={setTempPurchaseNature}
                        setTempPurchaseNature365={setTempPurchaseNature365}
                        setTempQuantity={setTempQuantity}
                        setTempSiteLicensePcCount={setTempSiteLicensePcCount}
                        setTempSkuId={setTempSkuId}
                        setTempSkuIdFromOption={setTempSkuIdFromOption}
                        setTempSubUnitMode={setTempSubUnitMode}
                        setTempSubUnits={setTempSubUnits}
                        setTerminalChannel={setTerminalChannel}
                        showAddProductModal={showAddProductModal}
                        showLicensePeriod={showLicensePeriod}
                        showServiceDetailTable={showServiceDetailTable}
                        subUnitImportRef={subUnitImportRef}
                        subscriptionCheckout={subscriptionCheckout}
                        subscriptionLock={subscriptionLock}
                        subscriptions={subscriptions}
                        tempActivationMethod={tempActivationMethod}
                        tempCategory={tempCategory}
                        tempEcoProductName={tempEcoProductName}
                        tempEnterpriseId={tempEnterpriseId}
                        tempHoverCategory={tempHoverCategory}
                        tempLicensePeriodNum={tempLicensePeriodNum}
                        tempLicensePeriodUnit={tempLicensePeriodUnit}
                        tempLicensee={tempLicensee}
                        tempMediaCount={tempMediaCount}
                        tempPkgCpu={tempPkgCpu}
                        tempPkgLink={tempPkgLink}
                        tempPkgOs={tempPkgOs}
                        tempPkgType={tempPkgType}
                        tempPricingOptionId={tempPricingOptionId}
                        tempProductId={tempProductId}
                        tempPurchaseNature={tempPurchaseNature}
                        tempPurchaseNature365={tempPurchaseNature365}
                        tempQuantity={tempQuantity}
                        tempSiteLicensePcCount={tempSiteLicensePcCount}
                        tempSkuId={tempSkuId}
                        tempSubUnitImportRef={tempSubUnitImportRef}
                        tempSubUnitMode={tempSubUnitMode}
                        tempSubUnits={tempSubUnits}
                        updateItemSubUnit={updateItemSubUnit}
                        updateItemSubUnitMode={updateItemSubUnitMode}
                        updateTempSubUnit={updateTempSubUnit}
                    />
                )}

                {currentStep === 4 && (
                    <Step4CommerceDelivery
                        acceptanceForm={acceptanceForm}
                        acceptanceType={acceptanceType}
                        calculateNewOrderTotal={calculateNewOrderTotal}
                        deliveryMethod={deliveryMethod}
                        expectedPaymentDate={expectedPaymentDate}
                        getVisibleFieldError={getVisibleFieldError}
                        installmentPlans={installmentPlans}
                        invoiceForm={invoiceForm}
                        markFieldTouched={markFieldTouched}
                        newOrderItems={newOrderItems}
                        onlineDeliveries={onlineDeliveries}
                        paymentMethod={paymentMethod}
                        paymentTerms={paymentTerms}
                        phaseDrafts={phaseDrafts}
                        productAcceptanceRows={productAcceptanceRows}
                        receivingCompany={receivingCompany}
                        receivingMethod={receivingMethod}
                        receivingParty={receivingParty}
                        reuseSerialNumber={reuseSerialNumber}
                        serialNumberRequirement={serialNumberRequirement}
                        setAcceptanceForm={setAcceptanceForm}
                        setAcceptanceType={setAcceptanceType}
                        setDeliveryMethod={setDeliveryMethod}
                        setExpectedPaymentDate={setExpectedPaymentDate}
                        setInstallmentPlans={setInstallmentPlans}
                        setInvoiceForm={setInvoiceForm}
                        setOnlineDeliveries={setOnlineDeliveries}
                        setPaymentMethod={setPaymentMethod}
                        setPaymentTerms={setPaymentTerms}
                        setPhaseDrafts={setPhaseDrafts}
                        setProductAcceptanceRows={setProductAcceptanceRows}
                        setReceivingCompany={setReceivingCompany}
                        setReceivingMethod={setReceivingMethod}
                        setReceivingParty={setReceivingParty}
                        setReuseSerialNumber={setReuseSerialNumber}
                        setSerialNumberRequirement={setSerialNumberRequirement}
                        setSettlementMethod={setSettlementMethod}
                        setSettlementType={setSettlementType}
                        setShippingAddress={setShippingAddress}
                        setShippingEmail={setShippingEmail}
                        setShippingPhone={setShippingPhone}
                        settlementMethod={settlementMethod}
                        settlementType={settlementType}
                        shippingAddress={shippingAddress}
                        shippingEmail={shippingEmail}
                        shippingPhone={shippingPhone}
                    />
                )}

            </div>

            {/* Footer Actions */}
            <div className="unified-card p-4 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()} className="px-8 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition text-sm">
                        {currentStep === 1 ? '取消' : '上一步'}
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition text-sm font-medium"
                    >
                        <Save className="w-4 h-4"/>
                        {draftSavedTip ? '已暂存 ✓' : '暂存'}
                    </button>
                    {currentDraftId && !draftSavedTip && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{currentDraftId}</span>
                    )}
                </div>
                <div className="flex gap-3">
                    {currentStep < 4 ? (
                        <button 
                            disabled={validationErrors.some(e => e.step === currentStep)}
                            onClick={() => {
                                const stepErrors = validationErrors.filter(e => e.step === currentStep);
                                if (stepErrors.length > 0) {
                                    setHasAttemptedSubmit(true);
                                    setShowValidationToast(true);
                                    return;
                                }
                                setCurrentStep(currentStep + 1);
                            }}
                            className="bg-[#0071E3] text-white px-10 py-3 rounded-xl font-bold shadow-xl hover:scale-105 hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none text-sm"
                        >
                            下一步
                        </button>
                    ) : (
                        <button onClick={handleCreateOrder} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] shadow-xl dark:hover:bg-[#FF2D55]/90 hover:scale-105 hover:shadow-blue-500/30 relative">
                            提交订单
                            {validationErrors.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                    {validationErrors.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
        </ModalPortal>

        {/* 校验错误 Toast 通知 */}
        {showValidationToast && validationErrors.length > 0 && (
            <ModalPortal>
                <ValidationToast
                    errors={validationErrors}
                    onClose={() => setShowValidationToast(false)}
                    onNavigateStep={(step) => { setCurrentStep(step); setShowValidationToast(false); }}
                />
            </ModalPortal>
        )}

        {/* 订单确认弹窗 */}
        <OrderConfirmModal
            open={showConfirmModal}
            onClose={() => { setShowConfirmModal(false); setIsSubmitting(false); }}
            onConfirm={handleConfirmSubmit}
            isSubmitting={isSubmitting}
            validationErrors={validationErrors}
            buyerType={buyerType}
            orderSource={orderSource}
            customerName={customers.find(c => c.id === newOrderCustomer)?.companyName || (buyerType === 'SelfDeal' ? allEnterprises.find(e => e.entId === orderEnterpriseId)?.entName || '' : '')}
            channelName={buyerType === 'Channel' ? channels.find(c => c.id === selectedChannelId)?.name : undefined}
            opportunityName={opportunities.find(o => o.id === linkedOpportunityId)?.name}
            salesRepName={users.find(u => u.id === salesRepId)?.name}
            businessManagerName={users.find(u => u.id === businessManagerId)?.name}
            sellerName={sellerName}
            creatorName={(users.find(u => u.id === creatorId) || currentUser)?.name}
            orderRemark={orderRemark}
            purchasingContactName={purchasingContacts.find(c => c.id === selectedPurchasingContactId)?.name}
            purchasingContactPhone={purchasingContacts.find(c => c.id === selectedPurchasingContactId)?.phone}
            itContactName={itContacts.find(c => c.id === selectedItContactId)?.name}
            itContactPhone={itContacts.find(c => c.id === selectedItContactId)?.phone}
            linkedContractNames={linkedContractIds.length > 0 ? linkedContractIds.map(id => contracts.find(c => c.id === id)?.name || id) : undefined}
            items={newOrderItems}
            totalAmount={calculateNewOrderTotal()}
            deliveryMethod={deliveryMethod}
            shippingAddress={shippingAddress}
            shippingPhone={shippingPhone}
            shippingEmail={shippingEmail}
            onlineDeliveries={onlineDeliveries}
            acceptanceForm={acceptanceForm}
            productAcceptanceRows={productAcceptanceRows}
            settlementMethod={settlementMethod}
            settlementType={settlementType}
            expectedPaymentDate={expectedPaymentDate}
            installmentPlans={installmentPlans}
            serialNumberRequirement={serialNumberRequirement}
            reuseSerialNumber={reuseSerialNumber}
        />

                <ConversionPickerModal
            availableConversionOrders={availableConversionOrders}
            conversionSearch={conversionSearch}
            conversionSearchField={conversionSearchField}
            filteredConversionOrders={filteredConversionOrders}
            isConversionPickerOpen={isConversionPickerOpen}
            selectedConversionIds={selectedConversionIds}
            setConversionSearch={setConversionSearch}
            setConversionSearchField={setConversionSearchField}
            setIsConversionPickerOpen={setIsConversionPickerOpen}
            setSelectedConversionIds={setSelectedConversionIds}
        />

                <ContractPickerModal
            CONTRACT_PAGE_SIZE={CONTRACT_PAGE_SIZE}
            contractPickerPage={contractPickerPage}
            contractPickerSearch={contractPickerSearch}
            contracts={contracts}
            isContractPickerOpen={isContractPickerOpen}
            linkedContractIds={linkedContractIds}
            setContractPickerPage={setContractPickerPage}
            setContractPickerSearch={setContractPickerSearch}
            setIsContractPickerOpen={setIsContractPickerOpen}
            setLinkedContractIds={setLinkedContractIds}
        />

                <OpportunityPickerModal
            handleOpportunityChange={handleOpportunityChange}
            isOppPickerOpen={isOppPickerOpen}
            oppPickerSearch={oppPickerSearch}
            opportunities={opportunities}
            products={products}
            setIsOppPickerOpen={setIsOppPickerOpen}
            setOppPickerSearch={setOppPickerSearch}
        />

                <NewContactModal
            handleSaveNewContact={handleSaveNewContact}
            newContactForm={newContactForm}
            setNewContactForm={setNewContactForm}
            setShowNewContactModal={setShowNewContactModal}
            showNewContactModal={showNewContactModal}
        />

        {/* 下级单位批量导入隐藏文件输入 */}
        <input
          ref={subUnitImportRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && importTargetIdx !== null) {
              handleSubUnitImport(importTargetIdx, file);
            }
            e.target.value = '';
            setImportTargetIdx(null);
          }}
        />
    </>
  );
};

export default OrderCreateWizard;
