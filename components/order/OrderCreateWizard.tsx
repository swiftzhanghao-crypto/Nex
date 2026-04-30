
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, ActivationMethod, AcceptanceType, AcceptancePhase, OrderSource, BuyerType, InvoiceInfo, AcceptanceInfo, PaymentMethod, DeliveryMethod, OrderDraft, ConversionOrder, CustomerContact, PurchaseNature, SubUnitAuthMode, OnlineDeliveryEntry, Subscription, SubscriptionLineProductSnapshot } from '../../types';
import { initialConversionOrders, ALL_INSTALL_PKG_ROWS } from '../../data/staticData';
import { User as UserIcon, Plus, Trash2, CheckCircle, FileText, CreditCard, Truck, ShoppingBag, X, Target, MousePointer2, ClipboardCheck, ArrowUpRight, Percent, Layers, Network, Globe, Radio, RefreshCcw, Wallet, Zap, Box, Settings, MapPin, Briefcase, XCircle, Search, Save, ScrollText, Phone, Mail, Users, Banknote, Calendar, Check, ChevronRight, ChevronDown, Pencil, Key, Building2, Sparkles, Upload, Download, Wrench, Tag } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
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

interface OrderCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  renewalOrder?: Order;
  /** 从续费管理「续费/增购」进入：预填客户与产品并锁定部分字段 */
  subscriptionCheckout?: { subscription: Subscription; lineProduct: SubscriptionLineProductSnapshot; mode: 'renew' | 'addon' } | null;
  initialDraft?: OrderDraft;
}

const OrderCreateWizard: React.FC<OrderCreateWizardProps> = ({ isOpen, onClose, renewalOrder, subscriptionCheckout, initialDraft }) => {
  const { products, customers, setCustomers, channels, opportunities, contracts, users, orders, setOrders, currentUser, standaloneEnterprises, orderDrafts, setOrderDrafts, apiMode, refreshOrders, subscriptions } = useAppContext();
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
    tempSkuId, setTempSkuId, setTempSkuIdFromOption,
    tempPricingOptionId, setTempPricingOptionId,
    tempQuantity, setTempQuantity,
    tempActivationMethod, setTempActivationMethod,
    tempMediaCount, setTempMediaCount,
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
  } = useTempSubUnits(customers as any);

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

  // Seller info (auto-populated from product's salesOrgName)
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
  };
  const [productAcceptanceRows, setProductAcceptanceRows] = useState<ProductAcceptanceRow[]>([]);

  const [settlementMethod, setSettlementMethod] = useState<'cash' | 'credit' | ''>('');
  const [settlementType, setSettlementType] = useState<'once' | 'installment'>('once');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [installmentPlans, setInstallmentPlans] = useState<{amount: number; expectedDate: string; actualDate: string; paidAmount: number}[]>([]);
  const [serialNumberRequirement, setSerialNumberRequirement] = useState<'生成新序列号' | '沿用正式序列号' | '沿用测试序列号'>('生成新序列号');
  const [reuseSerialNumber, setReuseSerialNumber] = useState('');

  const [expandedSubUnitIdx, setExpandedSubUnitIdx] = useState<number | null>(null);

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
      const newSubs = parseSubUnitsCSV(text, customers as any, 'su_imp', msg => alert(msg));
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

  const wizardSteps = [
      { id: 1, label: '订单类型', desc: '来源与模式', icon: Layers },
      { id: 2, label: '客户信息', desc: '客户/商机', icon: UserIcon },
      { id: 3, label: '产品配置', desc: '规格/价格', icon: ShoppingBag },
      { id: 4, label: '交付信息', desc: '备注/验收', icon: ClipboardCheck },
  ];

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
      setSettlementMethod('');
      setSettlementType('once');
      setExpectedPaymentDate('');
      setInstallmentPlans([]);
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
              licenseType: pricingOpt?.title || op.licenseType,
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

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSku || tempQuantity <= 0) return;

    
    if (selectedSku.pricingOptions && selectedSku.pricingOptions.length > 0 && !selectedOption) {
        alert("请选择授权类型 (Pricing Option)");
        return;
    }

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

    const derivedLicenseType = selectedOption?.title || undefined;
    const isPermanent = selectedOption ? selectedOption.license.periodUnit === 'Forever' : true;
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
  const handleUpdateItem = (index: number, field: keyof OrderItem, value: any) => {
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
                  next.push({ productIdx: idx, method: '一次性验收', condition: '视同验收', expectedDate: '', percentage: 100 });
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
      newOrderItems, tempCategory, enableConversion, selectedConversionIds, sellerName, sellerContact,
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
    setSettlementMethod(d.settlementMethod || '');
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

  const handleCreateOrder = async () => {
    const selfDealMissingEnterprise = buyerType === 'SelfDeal' && !orderEnterpriseId;
    const otherMissingCustomer = buyerType !== 'SelfDeal' && !newOrderCustomer;
    if (selfDealMissingEnterprise || otherMissingCustomer || newOrderItems.length === 0 || !buyerType) {
        alert(selfDealMissingEnterprise ? '请选择企业 ID。' : '请完善订单信息：客户、产品或订单类型未填写。');
        return;
    }
    const invalidItem = newOrderItems.find(it => !it.quantity || it.quantity <= 0 || it.priceAtPurchase < 0);
    if (invalidItem) {
        alert(`产品"${invalidItem.productName}"的数量或价格无效，请检查后再提交。`);
        return;
    }
    if (serialNumberRequirement !== '生成新序列号' && reuseSerialNumber.length !== 20) {
        alert(`选择"${serialNumberRequirement}"时需要填写 20 位序列号（当前 ${reuseSerialNumber.length} 位），请补全后再提交。`);
        return;
    }
    if (settlementMethod === 'credit' && settlementType === 'installment' && installmentPlans.length < 2) {
        alert('分期付款至少需要 2 期，请添加更多分期计划。');
        return;
    }
    for (let pi = 0; pi < newOrderItems.length; pi++) {
        const rows = productAcceptanceRows.filter(r => r.productIdx === pi);
        if (rows.some(r => r.method === '分期验收')) {
            const totalPct = rows.reduce((s, r) => s + r.percentage, 0);
            if (Math.abs(totalPct - 100) > 0.01) {
                alert(`产品"${newOrderItems[pi].productName}"的分期验收比例合计为 ${totalPct}%，必须等于 100%，请调整后再提交。`);
                return;
            }
        }
    }
    for (let pi = 0; pi < newOrderItems.length; pi++) {
        const item = newOrderItems[pi];
        if (item.subUnitAuthMode && item.subUnitAuthMode !== 'none' && item.subUnits && item.subUnits.length > 0) {
            const subs = item.subUnits as SubUnitLocal[];
            const subTotal = subs.reduce((s, u) => s + (parseInt(u.authCount) || 0), 0);
            if (subTotal !== item.quantity) {
                alert(`产品"${item.productName}"的下级单位授权数量合计 (${subTotal}) 与该明细数量 (${item.quantity}) 不一致，请调整后再提交。`);
                return;
            }
            const emptyUnit = subs.find(u => !u.unitName || !u.enterpriseId || !u.authCount || !u.itContact || !u.phone);
            if (emptyUnit) {
                alert(`产品"${item.productName}"中下级单位"${emptyUnit.unitName || '(未命名)'}"存在未填写的必填字段，请补充完整。`);
                return;
            }
        }
    }
    const customer = customers.find(c => c.id === newOrderCustomer);
    const salesUser = users.find(u => u.id === salesRepId);
    const businessUser = users.find(u => u.id === businessManagerId);
    const creatorUser = users.find(u => u.id === creatorId) || currentUser;
    const linkedOpp = opportunities.find(o => o.id === linkedOpportunityId);

    // Reuse draft order ID if available, otherwise generate new
    const newId = currentDraftId || `S${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const totalAmount = calculateNewOrderTotal();
    
    let phases: AcceptancePhase[] = [];
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
        buyerType,
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
            onClose(); resetCreateForm(); navigate(`/orders/${created.id}`);
        } catch (e: any) { alert(e.message || '创建订单失败'); return; }
    } else {
        if (currentDraftId) {
            setOrders(prev => prev.map(o => o.id === currentDraftId ? newOrder : o));
            setOrderDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        } else {
            setOrders([newOrder, ...orders]);
        }
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

            {/* Stepper Header */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100/50 dark:border-white/10 overflow-x-auto no-scrollbar">
                <div className="flex justify-between items-start relative">
                    <div className="absolute top-5 h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full overflow-hidden" style={{ left: `calc(100% / ${wizardSteps.length} / 2)`, right: `calc(100% / ${wizardSteps.length} / 2)` }}>
                        <div
                            className="h-full bg-[#0071E3] dark:bg-[#0A84FF] transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep - 1) / (wizardSteps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                    {wizardSteps.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-1.5 relative z-10 flex-1 transition-all group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-apple ${
                                currentStep > s.id
                                ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20'
                                : currentStep === s.id
                                    ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110'
                                    : 'bg-white dark:bg-[#2C2C2E] border-2 border-gray-200 dark:border-gray-600 text-gray-400'
                            }`}>
                                {currentStep > s.id ? <CheckCircle className="w-4 h-4"/> : <s.icon className="w-5 h-5"/>}
                            </div>
                            <div className="text-center">
                                <div className={`text-sm font-bold ${currentStep > s.id ? 'text-green-600' : currentStep === s.id ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`}>{s.label}</div>
                                <div className="text-[10px] text-gray-400 hidden md:block mt-0.5">{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
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

                {/* Step 2: Basic Info */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-fade-in">

                        {/* 关联商机 */}
                        {buyerType !== 'SelfDeal' && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-purple-500"/> 关联商机
                                </h4>
                                <div className="flex gap-2">
                                    <button onClick={() => setHasOpportunity('yes')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${hasOpportunity === 'yes' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-sm' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                        <CheckCircle className="w-3.5 h-3.5"/>有商机
                                    </button>
                                    {buyerType !== 'Customer' && (
                                    <button onClick={() => setHasOpportunity('no')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${hasOpportunity === 'no' ? 'border-gray-500 bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200 shadow-sm' : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}>
                                        <XCircle className="w-3.5 h-3.5"/>无商机
                                    </button>
                                    )}
                                </div>
                            </div>

                            {/* 有商机：选择商机 */}
                            {hasOpportunity === 'yes' && (
                                <div>
                                    {linkedOpportunityId ? (() => {
                                        const linkedOppObj = opportunities.find(o => o.id === linkedOpportunityId);
                                        const stageClass = linkedOppObj?.stage === '赢单' ? 'unified-tag-green !rounded-full' : linkedOppObj?.stage === '输单' ? 'unified-tag-gray !rounded-full' : linkedOppObj?.stage === '需求判断' ? 'unified-tag-blue !rounded-full' : linkedOppObj?.stage === '确认商机' ? 'unified-tag-indigo !rounded-full' : linkedOppObj?.stage === '确认渠道' ? 'unified-tag-purple !rounded-full' : 'unified-tag-yellow !rounded-full';
                                        return (
                                        <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机名称</div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{linkedOppObj?.name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机编号</div>
                                                        <div className="text-xs font-mono text-gray-600 dark:text-gray-300">{linkedOppObj?.id}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">客户名称</div>
                                                        <div className="text-xs text-gray-700 dark:text-gray-300">{linkedOppObj?.customerName}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">商机阶段</div>
                                                        <span className={stageClass}>{linkedOppObj?.stage}</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">所属部门</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.department || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">负责人</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.ownerName || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">预计收入</div>
                                                        <div className="text-xs font-mono text-gray-700 dark:text-gray-300">{linkedOppObj?.expectedRevenue != null ? `¥${linkedOppObj.expectedRevenue.toLocaleString()}` : '-'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 uppercase">预计关闭</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{linkedOppObj?.closeDate ? new Date(linkedOppObj.closeDate).toLocaleDateString('zh-CN') : '-'}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setLinkedOpportunityId(''); setNewOrderCustomer(''); setOrderEnterpriseId(''); setNewOrderItems([]); setSellerName(''); setOppItemWarnings([]); }}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                            {linkedOppObj?.products && linkedOppObj.products.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-green-200/50 dark:border-green-800/20">
                                                    <span className="text-[10px] text-gray-400 uppercase mr-1 self-center">产品:</span>
                                                    {linkedOppObj.products.map((p, pi) => (
                                                        <span key={pi} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 dark:bg-black/20 border border-green-200/60 dark:border-green-700/30 rounded-lg text-xs">
                                                            <span className="font-medium text-gray-800 dark:text-gray-200">{p.productName}</span>
                                                            {p.skuName && <span className="text-gray-400 dark:text-gray-500">/ {p.skuName}</span>}
                                                            {p.licenseType && <span className="text-green-600 dark:text-green-400 text-[10px]">({p.licenseType})</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })() : (
                                        <button
                                            onClick={() => setIsOppPickerOpen(true)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#0071E3] dark:hover:border-[#FF2D55] hover:text-[#0071E3] dark:hover:text-[#FF2D55] transition flex items-center justify-center gap-2"
                                        >
                                            <Briefcase className="w-4 h-4"/> 点击选择商机
                                        </button>
                                    )}
                                </div>
                            )}

                            {hasOpportunity === 'no' && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">无关联商机，将手动填写客户信息。</div>
                            )}
                        </div>
                        )}

                        {/* 客户与买方信息 */}
                        {(buyerType === 'SelfDeal' || hasOpportunity === 'no' || (hasOpportunity === 'yes' && linkedOpportunityId)) && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <UserIcon className="w-4 h-4 text-indigo-500"/> 客户与买方信息
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {buyerType === 'SelfDeal' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">企业 ID <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                            value={orderEnterpriseId}
                                            onChange={e => handleSelfDealEnterpriseChange(e.target.value)}
                                        >
                                            <option value="">-- 请选择企业 --</option>
                                            {allEnterprises.map(ent => (
                                                <option key={ent.entId} value={ent.entId}>{ent.entName} (ID: {ent.entId})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {orderEnterpriseId && !allEnterprises.find(e => e.entId === orderEnterpriseId) && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">该企业 ID 未匹配到已有客户</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">关联客户</label>
                                    {newOrderCustomer ? (
                                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomerObj?.companyName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">自动匹配</div>
                                            </div>
                                        </div>
                                    ) : orderEnterpriseId ? (
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                                            <div className="w-5 h-5 rounded-full border-2 border-amber-400 dark:border-amber-500 flex items-center justify-center shrink-0">
                                                <span className="text-amber-500 text-xs font-bold">?</span>
                                            </div>
                                            <div className="text-sm font-medium text-amber-700 dark:text-amber-400">企业暂未关联客户</div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 dark:bg-black/30 border border-dashed border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-400 dark:text-gray-500">
                                            选择企业后自动匹配
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">是否代理商订单</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsAgentOrder(!isAgentOrder); if (isAgentOrder) setAgentCode(''); }}
                                        className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all ${
                                            isAgentOrder
                                                ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5'
                                                : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30'
                                        }`}
                                    >
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isAgentOrder ? 'bg-[#0071E3] dark:bg-[#FF2D55]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isAgentOrder ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </div>
                                        <span className={`text-sm font-medium ${isAgentOrder ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {isAgentOrder ? '是（代理商订单）' : '否'}
                                        </span>
                                    </button>
                                </div>
                                {isAgentOrder && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">代理商编号 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={agentCode}
                                        onChange={e => setAgentCode(e.target.value)}
                                        placeholder="请输入代理商编号"
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                                )}
                                </>
                                ) : hasOpportunity === 'yes' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                    {linkedOpportunityId && (
                                        <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 mt-1">
                                            <Briefcase className="w-3 h-3 shrink-0" />
                                            <span>商机带入: {opportunities.find(o => o.id === linkedOpportunityId)?.name}，可手动调整</span>
                                        </div>
                                    )}
                                </div>
                                </>
                                ) : (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    {subscriptionLock && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1">来自订阅续费/增购，客户不可更换。</p>
                                    )}
                                    <select disabled={!!subscriptionLock} className={`w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm disabled:opacity-60 disabled:cursor-not-allowed ${subscriptionLock ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'}`} value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                </>
                                )}

                                {buyerType === 'Customer' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">买方名称（客户）</label>
                                    <select
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                        value={selectedBuyerNameId}
                                        onChange={e => setSelectedBuyerNameId(e.target.value)}
                                    >
                                        <option value="">-- 请选择买方 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                )}

                                {buyerType === 'Channel' && (
                                    <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">买方名称（代理商） <span className="text-red-500">*</span></label>
                                        <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                                            <option value="">-- 选择渠道商 --</option>
                                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">直接下级渠道</label>
                                        <input type="text" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" placeholder="买方订购本订单产品的渠道商" value={directChannel} onChange={e => setDirectChannel(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">终端渠道</label>
                                        <input type="text" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" placeholder="向最终用户销售本订单产品的渠道，与直接下级渠道不同时需要填写" value={terminalChannel} onChange={e => setTerminalChannel(e.target.value)} />
                                    </div>
                                    </>
                                )}
                                {buyerType !== 'SelfDeal' && (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">销售负责人</label>
                                    <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={salesRepId} onChange={e => setSalesRepId(e.target.value)}>
                                        <option value="">-- 分配销售人员 --</option>
                                        {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">商务负责人</label>
                                    <select className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm" value={businessManagerId} onChange={e => setBusinessManagerId(e.target.value)}>
                                        <option value="">-- 分配商务人员 --</option>
                                        {users.filter(u => u.roles?.includes('Business') || u.roles?.includes('Admin')).map(u => <option key={u.id} value={u.id}>{u.name.replace(/\s*\(.*?\)/g, '')}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">卖方名称</label>
                                    {sellerName ? (
                                        <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-xl">
                                            <Briefcase className="w-4 h-4 text-teal-500 shrink-0"/>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{sellerName}</div>
                                                {linkedOpportunityId && <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">来自商机产品的销售组织</div>}
                                            </div>
                                            <button onClick={() => setSellerName('')} className="text-gray-400 hover:text-red-500 p-0.5 transition shrink-0"><X className="w-3.5 h-3.5"/></button>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={sellerName}
                                            onChange={e => setSellerName(e.target.value)}
                                            placeholder="选择商机后自动带入，也可手动填写"
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                                        />
                                    )}
                                </div>
                                </>
                                )}
                            </div>
                        </div>
                        )}

                        {/* 订单联系人选择 */}
                        {newOrderCustomer && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <Users className="w-4 h-4 text-teal-500"/> 订单联系人
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 采购联系人 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">采购联系人 <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedPurchasingContactId}
                                            onChange={e => setSelectedPurchasingContactId(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition"
                                        >
                                            <option value="">请选择采购联系人</option>
                                            {purchasingContacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.isPrimary ? '（主要）' : ''}{c.position ? ` · ${c.position}` : ''}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => { setNewContactForm({ name: '', phone: '', email: '', position: '' }); setShowNewContactModal('Purchasing'); }}
                                            className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/>新建
                                        </button>
                                    </div>
                                    {selectedPurchasingContactId && (() => {
                                        const c = purchasingContacts.find(x => x.id === selectedPurchasingContactId);
                                        if (!c) return null;
                                        return (
                                            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500"/>{c.phone}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500"/>{c.email}</span>}
                                                {!c.phone && !c.email && <span className="text-gray-400">暂无联系方式</span>}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* IT 联系人 */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">IT 联系人 <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedItContactId}
                                            onChange={e => setSelectedItContactId(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#2C2C2E] text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition"
                                        >
                                            <option value="">请选择 IT 联系人</option>
                                            {itContacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.isPrimary ? '（主要）' : ''}{c.position ? ` · ${c.position}` : ''}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => { setNewContactForm({ name: '', phone: '', email: '', position: '' }); setShowNewContactModal('IT'); }}
                                            className="shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/>新建
                                        </button>
                                    </div>
                                    {selectedItContactId && (() => {
                                        const c = itContacts.find(x => x.id === selectedItContactId);
                                        if (!c) return null;
                                        return (
                                            <div className="flex items-center gap-3 px-3 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-purple-500"/>{c.phone}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-purple-500"/>{c.email}</span>}
                                                {!c.phone && !c.email && <span className="text-gray-400">暂无联系方式</span>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 关联合同 - 官网订单和自成交订单不需要选择合同 */}
                        {orderSource !== 'OnlineStore' && buyerType !== 'SelfDeal' && <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ScrollText className="w-4 h-4 text-blue-500"/> 关联合同
                                    {linkedContractIds.length > 0 && (
                                        <span className="text-sm font-normal text-gray-400 ml-1">({linkedContractIds.length}/5)</span>
                                    )}
                                </h4>
                                {linkedContractIds.length > 0 && linkedContractIds.length < 5 && (
                                    <button
                                        onClick={() => setIsContractPickerOpen(true)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-[#0071E3] hover:text-blue-700 transition"
                                    >
                                        <Plus className="w-4 h-4"/> 添加合同
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {linkedContractIds.map(cid => {
                                    const c = contracts.find(ct => ct.id === cid);
                                    return (
                                        <div key={cid} className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                                            <ScrollText className="w-4 h-4 text-[#0071E3] shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c?.name || cid}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{c?.code}{c?.contractType ? ` · ${c.contractType}` : ''}</div>
                                            </div>
                                            <button
                                                onClick={() => setLinkedContractIds(prev => prev.filter(id => id !== cid))}
                                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    );
                                })}
                                {linkedContractIds.length === 0 && (
                                    <button
                                        onClick={() => setIsContractPickerOpen(true)}
                                        className="w-full p-4 bg-white dark:bg-[#2C2C2E] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#0071E3] dark:hover:border-[#0A84FF] hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition flex items-center justify-center gap-2"
                                    >
                                        <ScrollText className="w-4 h-4"/> 点击选择关联合同（选填，最多 5 个）
                                    </button>
                                )}
                                {linkedContractIds.length === 5 && (
                                    <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 pl-1">
                                        <span>已达到最多 5 个合同的上限</span>
                                    </p>
                                )}
                            </div>
                        </div>}
                    </div>
                )}

                {/* Step 3: Merchandise Selection */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        {orderSource === 'Renewal' && originalOrderId && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                                <RefreshCcw className="w-5 h-5"/>
                                <span>续费模式：正在基于订单 <strong>{originalOrderId}</strong> 的明细进行续费。您可以继续添加或移除产品。</span>
                            </div>
                        )}

                        {linkedOpportunityId && (newOrderItems.length > 0 || oppItemWarnings.length > 0) && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-sm text-amber-700 dark:text-amber-300 space-y-2">
                                {newOrderItems.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 font-bold">
                                            <Briefcase className="w-4 h-4 shrink-0"/>
                                            <span>已从商机自动带入 {newOrderItems.length} 个产品，以下信息需要您补充完善：</span>
                                        </div>
                                        <ul className="list-disc list-inside text-xs space-y-1 ml-6 text-amber-600 dark:text-amber-400">
                                            <li>订购性质 — 系统会结合「续费管理」订阅自动判断，请核对；365 订购性质请按需选择</li>
                                            <li>数量、授权/服务期限 — 请确认或修改</li>
                                            <li>激活方式、安装包类型、介质数量 — 请点击编辑按钮补充</li>
                                        </ul>
                                    </>
                                )}
                                {oppItemWarnings.length > 0 && (
                                    <div className={`space-y-1 ${newOrderItems.length > 0 ? 'mt-2 pt-2 border-t border-amber-200 dark:border-amber-700/50' : ''}`}>
                                        {newOrderItems.length === 0 && (
                                            <div className="flex items-center gap-2 font-bold mb-2">
                                                <XCircle className="w-4 h-4 text-red-500 shrink-0"/>
                                                <span className="text-red-600 dark:text-red-400">商机产品匹配失败，请手动添加产品：</span>
                                            </div>
                                        )}
                                        {oppItemWarnings.map((w, wi) => (
                                            <div key={wi} className="text-xs flex items-start gap-1.5">
                                                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5"/>
                                                <span><strong>{w.productName}</strong>：{w.missingFields.join('、')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 订单产品明细列表 - 置顶 */}
                        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-apple">
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/> 订单产品明细
                                    {newOrderItems.length > 0 && <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full ml-1">{newOrderItems.length}</span>}
                                </h4>
                                <div className="flex items-center gap-3">
                                    {newOrderItems.length > 0 && (
                                        <div className="text-sm text-gray-500">总计：<span className="text-lg font-bold text-red-600 dark:text-red-400">¥{calculateNewOrderTotal().toLocaleString()}</span></div>
                                    )}
                                    <button
                                        onClick={() => { setEditingItemIndex(null); setTempPurchaseNature('New'); setTempPurchaseNature365('New'); setTempSubUnitMode('none'); setTempSubUnits([]); setShowAddProductModal(true); }}
                                        disabled={!!subscriptionLock || (enableSubUnitAuth && newOrderItems.length >= 1)}
                                        title={subscriptionLock ? '订阅续费/增购模式下不可再添加产品' : (enableSubUnitAuth && newOrderItems.length >= 1 ? '下级单位授权模式下仅允许一个产品明细' : undefined)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-xs font-bold transition shadow-apple disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0071E3]"
                                    >
                                        <Plus className="w-3.5 h-3.5"/> 添加产品
                                    </button>
                                </div>
                            </div>
                            {(buyerType === 'Customer' || buyerType === 'Channel') && newOrderCustomer && !renewalOrder && !subscriptionCheckout && newOrderItems.length > 0 && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 px-5 pb-2 leading-relaxed">
                                    每条明细<strong>下方</strong>为与「续费管理」订阅的比对结果；如需修改订购性质，请点击<strong>编辑</strong>按钮。
                                </p>
                            )}
                            {newOrderItems.length > 0 ? (
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="unified-table-header">
                                        <tr><th className="p-3 pl-4 text-center w-16 whitespace-nowrap">明细编号</th><th className="p-3">产品/规格</th><th className="p-3">订购性质</th><th className="p-3">365订购性质</th><th className="p-3">授权类型</th><th className="p-3 text-center">数量</th><th className="p-3 text-center">授权/服务期限</th>{(buyerType === 'Customer' || buyerType === 'Channel') && <th className="p-3">激活方式</th>}<th className="p-3 text-right">单价</th><th className="p-3 text-right">小计</th><th className="p-3 text-center">操作</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, idx) => {
                                            const rowLocked = !!subscriptionLock && idx === 0;
                                            const addonTimeLocked = rowLocked && subscriptionLock?.mode === 'addon';
                                            const lineColSpan = 10 + (buyerType === 'Customer' || buyerType === 'Channel' ? 1 : 0);
                                            return (
                                            <React.Fragment key={idx}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-3 pl-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">{String(idx + 1).padStart(3, '0')}</span>
                                                </td>
                                                <td className="p-3"><div className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</div><div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div>{item.ecoProductName && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><Tag className="w-2.5 h-2.5"/>生态: {item.ecoProductName}</div>}{rowLocked && <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">（来自订阅，不可更换产品）</div>}</td>
                                                <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${purchaseNatureBadgeClass((item.purchaseNature || 'New') as PurchaseNature)}`}>{purchaseNatureDisplay((item.purchaseNature || 'New') as PurchaseNature)}</span></td>
                                                <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${purchaseNatureBadgeClass((item.purchaseNature365 || 'New') as PurchaseNature)}`}>{purchaseNatureDisplay((item.purchaseNature365 || 'New') as PurchaseNature)}</span></td>
                                                <td className="p-3"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 font-medium">{item.pricingOptionName || '默认'}</span></td>
                                                <td className="p-3 text-center"><span className="text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span></td>
                                                <td className="p-3 text-center">
                                                    {addonTimeLocked ? (
                                                        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                                            <div><span className="text-gray-400">起</span> {item.licenseStartDate || '-'}</div>
                                                            <div><span className="text-gray-400">止</span> {item.licenseEndDate || '-'}</div>
                                                            <div className="inline-flex px-2 py-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">{item.licensePeriod}</div>
                                                        </div>
                                                    ) : item.licensePeriod && item.licensePeriod !== '永久' ? (
                                                        <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">-</span>
                                                    )}
                                                </td>
                                                {(buyerType === 'Customer' || buyerType === 'Channel') && (
                                                    <td className="p-3"><span className="text-xs text-gray-700 dark:text-gray-300">{({ Account: '账号激活', SerialKey: '序列号激活', AccountAndSerialKey: '账号+序列号', LicenseKey: '授权码激活', Online: '在线激活', Dongle: '硬件加密狗' } as Record<string, string>)[item.activationMethod || 'Account'] || '账号激活'}</span></td>
                                                )}
                                                <td className="p-3 text-right"><span className="text-sm font-medium text-gray-900 dark:text-white" style={{fontVariantNumeric:'tabular-nums'}}>¥{item.priceAtPurchase.toLocaleString()}</span></td>
                                                <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                    <button type="button" onClick={() => handleEditItem(idx)} disabled={rowLocked} className="text-gray-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-30 disabled:pointer-events-none" title="编辑"><Pencil className="w-3.5 h-3.5"/></button>
                                                    <button type="button" onClick={() => handleRemoveItem(idx)} disabled={rowLocked} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30 disabled:pointer-events-none" title="删除"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                    {item.subUnitAuthMode && item.subUnitAuthMode !== 'none' && item.subUnits && item.subUnits.length > 0 && (
                                                        <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1 font-bold flex items-center justify-center gap-1"><Building2 className="w-3 h-3"/>{item.subUnits.length} 个下级单位</div>
                                                    )}
                                                </td>
                                            </tr>
                                            </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-5 pb-4 pt-1">
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-gray-600">
                                        <ShoppingBag className="w-10 h-10 mb-3 opacity-40"/>
                                        <p className="text-sm font-medium">暂无产品，请点击右上方"添加产品"按钮</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 折算抵扣 - 仅自成交订单 */}
                        {buyerType === 'SelfDeal' && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                                <Percent className="w-4 h-4 text-amber-500"/> 折算抵扣
                            </h4>
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">是否折算</label>
                                <button
                                    onClick={() => { setEnableConversion(!enableConversion); if (enableConversion) { setSelectedConversionIds([]); } }}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${enableConversion ? 'bg-[#0071E3]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${enableConversion ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{enableConversion ? '需要折算' : '不需要折算'}</span>
                            </div>
                            {enableConversion && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => { setConversionSearch(''); setIsConversionPickerOpen(true); }}
                                        className="flex items-center gap-2 px-5 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition text-sm font-medium"
                                    >
                                        <Search className="w-4 h-4"/> 选择关联折算单
                                    </button>
                                    {selectedConversionIds.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="grid gap-2">
                                                {selectedConversionIds.map(cid => {
                                                    const co = availableConversionOrders.find(c => c.id === cid);
                                                    if (!co) return null;
                                                    return (
                                                        <div key={cid} className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{co.id}</div>
                                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{co.enterpriseName}</div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">¥{co.amount.toLocaleString()}</span>
                                                                <button onClick={() => setSelectedConversionIds(prev => prev.filter(id => id !== cid))} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"><X className="w-3.5 h-3.5"/></button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">折算总金额:</span>
                                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">¥{conversionTotalAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        )}


                        {/* 添加产品抽屉 */}
                        {showAddProductModal && (
                        <ModalPortal>
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[600] animate-fade-in" onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }}/>
                        <div className="fixed inset-y-0 right-0 z-[601] w-[85vw] max-w-[1600px] flex flex-col bg-white dark:bg-[#1C1C1E] shadow-[-8px_0_30px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_30px_rgba(0,0,0,0.5)] animate-drawer-enter">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0 bg-white dark:bg-[#1C1C1E]">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/> {editingItemIndex !== null ? '编辑产品' : '添加产品'}
                                </h4>
                                <button onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-5 pb-8 space-y-5">

                            {/* ═══ 产品信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <ShoppingBag className="w-4 h-4 text-blue-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">产品信息</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2 relative" ref={categoryPickerRef}>
                                    <label className="text-xs font-bold text-gray-500 uppercase">产品分类</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsCategoryPickerOpen(!isCategoryPickerOpen); if (!isCategoryPickerOpen && !tempHoverCategory && categoryTree.length > 0) setTempHoverCategory(categoryTree[0].label); }}
                                        className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl outline-none text-sm text-left flex items-center justify-between transition ${isCategoryPickerOpen ? 'ring-2 ring-[#0071E3] border-[#0071E3]' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className={tempCategory ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{selectedCategoryLabel || '-- 请选择分类 --'}</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`}/>
                                    </button>
                                    {isCategoryPickerOpen && (
                                        <div className="absolute z-50 top-full left-0 mt-1 w-[480px] bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex" style={{ maxHeight: 320 }}>
                                            <div className="w-[180px] border-r border-gray-100 dark:border-white/10 overflow-y-auto py-1">
                                                {categoryTree.map(cat => (
                                                    <div
                                                        key={cat.label}
                                                        onMouseEnter={() => setTempHoverCategory(cat.label)}
                                                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            tempHoverCategory === cat.label
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span className="truncate">{cat.label}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50"/>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex-1 overflow-y-auto py-1">
                                                {categoryTree.find(c => c.label === tempHoverCategory)?.subs.map(sub => (
                                                    <div
                                                        key={sub}
                                                        onClick={() => { setTempCategory(sub); setIsCategoryPickerOpen(false); }}
                                                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                                            tempCategory === sub
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-blue-400 font-bold'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        {tempCategory === sub && <Check className="w-3.5 h-3.5 text-[#0071E3] dark:text-blue-400 shrink-0"/>}
                                                        <span className="truncate">{sub}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">选择产品</label>
                                    <select 
                                        className={`w-full p-3 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${!tempCategory ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'}`}
                                        value={tempProductId} 
                                        onChange={e => setTempProductId(e.target.value)}
                                        disabled={!tempCategory}
                                    >
                                        <option value="">-- {tempCategory ? '请选择产品' : '请先选择分类'} --</option>
                                        {products.filter(p => p.status === 'OnShelf' && p.subCategory === tempCategory).map(p => {
                                            const activeSkus = p.skus.filter(s => s.status === 'Active');
                                            const specName = activeSkus.length > 0 ? activeSkus[0].name : '';
                                            return (
                                                <option key={p.id} value={p.id}>{p.name}{specName ? ` / ${specName}` : ''}</option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">授权类型</label>
                                    {(() => {
                                        const activeSkus = selectedProduct?.skus.filter(s => s.status === 'Active') || [];
                                        const allOptions = activeSkus.flatMap(s => (s.pricingOptions || []).map(opt => ({ ...opt, skuId: s.id, skuCode: s.code })));
                                        if (!tempProductId) {
                                            return <div className="w-full p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 cursor-not-allowed">请先选择产品</div>;
                                        }
                                        if (allOptions.length === 0) {
                                            return <div className="w-full p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 cursor-not-allowed">该产品无授权类型</div>;
                                        }
                                        return (
                                            <select
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                value={tempPricingOptionId}
                                                onChange={e => {
                                                    const optId = e.target.value;
                                                    setTempPricingOptionId(optId);
                                                    const matched = allOptions.find(o => o.id === optId);
                                                    if (matched && matched.skuId !== tempSkuId) {
                                                        setTempSkuIdFromOption(matched.skuId);
                                                    }
                                                }}
                                            >
                                                <option value="">-- 请选择授权类型 --</option>
                                                {allOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.title} ({opt.skuCode})</option>
                                                ))}
                                            </select>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">数量</label>
                                    <input type="number" className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" min="1" value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">授权/服务期限</label>
                                    {showLicensePeriod ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="请输入"
                                            className="flex-1 p-3 bg-white dark:bg-[#1C1C1E] border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm font-medium text-teal-700 dark:text-teal-400"
                                            value={tempLicensePeriodNum}
                                            onChange={e => setTempLicensePeriodNum(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        <select
                                            className="w-20 p-3 bg-white dark:bg-[#1C1C1E] border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm font-medium text-teal-700 dark:text-teal-400"
                                            value={tempLicensePeriodUnit}
                                            onChange={e => setTempLicensePeriodUnit(e.target.value as '年' | '月' | '日')}
                                        >
                                            <option value="年">年</option>
                                            <option value="月">月</option>
                                            <option value="日">日</option>
                                        </select>
                                    </div>
                                    ) : (
                                    <div className="w-full p-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 rounded-xl text-sm font-medium text-teal-700 dark:text-teal-400">
                                        永久
                                    </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 单价</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full p-3 pr-16 bg-white dark:bg-[#1C1C1E] border border-orange-200 dark:border-orange-900/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition text-sm font-bold text-orange-600" 
                                            value={negotiatedPrice !== null ? negotiatedPrice : ''} 
                                            onChange={e => setNegotiatedPrice(Number(e.target.value))} 
                                            placeholder={`基准: ¥${selectedOption?.price || selectedSku?.price || 0}`} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-400 font-medium pointer-events-none">
                                            {showLicensePeriod ? `元/${tempLicensePeriodUnit}` : '元'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1">计价单价</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full p-3 pr-16 bg-gray-100 dark:bg-white/5 border border-orange-100 dark:border-orange-900/20 rounded-xl outline-none transition text-sm font-medium text-orange-500 cursor-not-allowed"
                                            value={negotiatedPrice !== null ? negotiatedPrice : (selectedOption?.price || selectedSku?.price || 0)}
                                            readOnly
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-300 font-medium pointer-events-none">
                                            {showLicensePeriod ? `元/${tempLicensePeriodUnit}` : '元'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">产品金额</label>
                                    {(() => {
                                        const unitPrice = negotiatedPrice !== null ? negotiatedPrice : (selectedOption?.price || selectedSku?.price || 0);
                                        const periodMultiplier = showLicensePeriod && tempLicensePeriodNum
                                            ? (tempLicensePeriodUnit === '年' ? Number(tempLicensePeriodNum) : tempLicensePeriodUnit === '月' ? Number(tempLicensePeriodNum) / 12 : Number(tempLicensePeriodNum) / 365)
                                            : 1;
                                        const totalAmount = unitPrice * tempQuantity * periodMultiplier;
                                        const divisor = tempQuantity * periodMultiplier;
                                        return (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full p-3 pr-10 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl outline-none focus:ring-2 focus:ring-red-200 transition text-sm font-bold text-red-600 dark:text-red-400 text-right font-mono"
                                                    value={Math.round(totalAmount * 100) / 100}
                                                    onChange={e => {
                                                        const val = Number(e.target.value);
                                                        if (!isFinite(val) || divisor === 0) return;
                                                        setNegotiatedPrice(Math.round((val / divisor) * 100) / 100);
                                                    }}
                                                    min="0"
                                                    step="0.01"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-red-400 font-medium pointer-events-none">¥</span>
                                                {(showLicensePeriod && tempLicensePeriodNum ? true : tempQuantity > 1) && (
                                                    <div className="text-[10px] font-normal text-red-400 dark:text-red-500 mt-1.5 text-right">
                                                        反推单价: ¥{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        {showLicensePeriod && tempLicensePeriodNum
                                                            ? ` × ${tempQuantity} × ${tempLicensePeriodNum}${tempLicensePeriodUnit}`
                                                            : ` × ${tempQuantity}`
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {selectedProduct?.tags?.includes('生态') && (
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><Tag className="w-3 h-3"/> 生态产品名称</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-emerald-200 dark:border-emerald-900/30 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 transition text-sm text-emerald-700 dark:text-emerald-400 placeholder:text-gray-400"
                                        placeholder="请输入生态产品具体名称"
                                        value={tempEcoProductName}
                                        onChange={e => setTempEcoProductName(e.target.value)}
                                    />
                                </div>
                                )}

                                </div>
                            </div>

                            {/* ═══ 服务信息 ═══ */}
                            {(() => {
                                const linkedSvcs = selectedProduct?.linkedServices || [];
                                if (linkedSvcs.length === 0) return null;
                                return linkedSvcs.map((svc) => {
                                    const svcProduct = products.find(p => p.id === svc.productId);
                                    if (!svcProduct || svcProduct.status !== 'OnShelf') return null;
                                    const svcSku = svc.skuId
                                        ? svcProduct.skus.find(s => s.id === svc.skuId && s.status === 'Active')
                                        : svcProduct.skus.find(s => s.status === 'Active');
                                    if (!svcSku) return null;
                                    const svcOption = svcSku.pricingOptions?.[0];
                                    const unitPrice = svcOption?.price ?? svcSku.price;
                                    const licenseTitle = svcOption?.title || '—';
                                    const periodUnit = svcOption?.license?.periodUnit;
                                    const periodNum = svcOption?.license?.period ?? 1;
                                    const periodLabel = periodUnit === 'Forever' ? '永久'
                                        : periodUnit === 'Year' ? `${periodNum}年`
                                        : periodUnit === 'Month' ? `${periodNum}月`
                                        : periodUnit === 'Day' ? `${periodNum}日` : '—';
                                    const priceUnitLabel = periodUnit === 'Year' ? '元/年'
                                        : periodUnit === 'Month' ? '元/月'
                                        : periodUnit === 'Day' ? '元/日' : '元';
                                    const qty = tempQuantity || 1;
                                    const totalCost = unitPrice * qty;
                                    return (
                                    <div key={svc.productId} className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                            <Wrench className="w-4 h-4 text-orange-500"/>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">服务明细详情</span>
                                            {svc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-800/40">必选</span>}
                                            {!svc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 font-bold">可选</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品类型：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcProduct.subCategory || svcProduct.productType || '—'}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品规格：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcSku.name}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">产品名称：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{svcProduct.name}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">授权/服务方式：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{licenseTitle}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">数量：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{qty}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">授权/服务期限：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">{periodLabel}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">服务成本预提计价单价：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">¥ {unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元/{qty > 1 ? '个' : '个'}/{priceUnitLabel.replace('元/', '')}</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic">服务成本预提单价：</span>
                                                <span className="text-gray-900 dark:text-white font-medium">¥ {unitPrice.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} {priceUnitLabel}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[130px] text-right italic font-medium">服务成本预提金额小计(含税)：</span>
                                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">¥ {totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                });
                            })()}

                            {/* ═══ 交付物信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Box className="w-4 h-4 text-indigo-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">交付物信息</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {(buyerType === 'Customer' || buyerType === 'Channel') && (
                                    <div className="col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-purple-500 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> 激活方式</label>
                                        <div className="flex gap-1.5">
                                            {([
                                                { id: 'Account' as ActivationMethod, label: '账号激活' },
                                                { id: 'SerialKey' as ActivationMethod, label: '序列号激活' },
                                                { id: 'AccountAndSerialKey' as ActivationMethod, label: '账号+序列号' },
                                            ]).map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setTempActivationMethod(opt.id)}
                                                    className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition border ${
                                                        tempActivationMethod === opt.id
                                                            ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                            : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-purple-300 dark:hover:border-purple-700'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    )}

                                    {/* 介质数量 */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">介质数量</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={tempMediaCount}
                                            onChange={e => setTempMediaCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition"
                                            placeholder="请输入介质数量"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 安装包选择 */}
                            {(() => {
                                if (!selectedProduct) return null;
                                const allPkgRows = ALL_INSTALL_PKG_ROWS.filter(r => r.productId === selectedProduct.id && r.enabled);

                                const universalPkgs = allPkgRows.filter(r => r.packageType === 'public');
                                const customPkgs = allPkgRows.filter(r => r.packageType === 'private');

                                const universalCpuOptions = Array.from(new Set(universalPkgs.map(p => p.cpu).filter(v => v && v !== '-')));
                                const universalOsOptions = Array.from(new Set(universalPkgs.map(p => p.os).filter(v => v && v !== '-')));
                                const customCpuOptions = Array.from(new Set(customPkgs.map(p => p.cpu).filter(v => v && v !== '-')));
                                const customOsOptions = Array.from(new Set(
                                    customPkgs.filter(p => !tempPkgCpu || p.cpu === tempPkgCpu).map(p => p.os).filter(v => v && v !== '-')
                                ));

                                if (allPkgRows.length === 0) return null;

                                let previewPkg: typeof allPkgRows[0] | null = null;
                                if (tempPkgType === '通用' && tempPkgCpu && tempPkgOs) {
                                    previewPkg = universalPkgs.find(p => p.cpu === tempPkgCpu && p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '通用' && tempPkgOs) {
                                    previewPkg = universalPkgs.find(p => p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '通用' && universalPkgs.length === 1) {
                                    previewPkg = universalPkgs[0] || null;
                                }

                                return (
                                    <div className="space-y-3">

                                        {/* 通用 / 定制 切换 */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setTempPkgType('通用')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                                    tempPkgType === '通用'
                                                    ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5 text-[#0071E3] dark:text-[#FF2D55]'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <Globe className="w-4 h-4"/> 通用
                                            </button>
                                            <button
                                                onClick={() => setTempPkgType('定制')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                                    tempPkgType === '定制'
                                                    ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/40 dark:bg-white/5 text-[#0071E3] dark:text-[#FF2D55]'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <Settings className="w-4 h-4"/> 定制
                                            </button>
                                            {tempPkgType && (
                                                <button onClick={() => setTempPkgType('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 transition">清除</button>
                                            )}
                                        </div>

                                        {/* 通用：选择 CPU 和操作系统 */}
                                        {tempPkgType === '通用' && universalPkgs.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {universalCpuOptions.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">CPU</label>
                                                    <select
                                                        className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                        value={tempPkgCpu}
                                                        onChange={e => { setTempPkgCpu(e.target.value); setTempPkgOs(''); }}
                                                    >
                                                        <option value="">-- 请选择 CPU --</option>
                                                        {universalCpuOptions.map(cpu => <option key={cpu} value={cpu}>{cpu}</option>)}
                                                    </select>
                                                </div>
                                                )}
                                                {universalOsOptions.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">操作系统</label>
                                                    <select
                                                        className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                        value={tempPkgOs}
                                                        onChange={e => setTempPkgOs(e.target.value)}
                                                    >
                                                        <option value="">-- 请选择系统 --</option>
                                                        {Array.from(new Set(
                                                            universalPkgs.filter(p => !tempPkgCpu || p.cpu === tempPkgCpu).map(p => p.os).filter(v => v && v !== '-')
                                                        )).map(os => <option key={os} value={os}>{os}</option>)}
                                                    </select>
                                                </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 定制：先选发布平台/OS（如有定制安装包数据），再填安装包链接 */}
                                        {tempPkgType === '定制' && (
                                            <div className="space-y-4">
                                                {customCpuOptions.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">发布平台</label>
                                                            <select
                                                                className="w-full p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                                value={tempPkgCpu}
                                                                onChange={e => { setTempPkgCpu(e.target.value); setTempPkgOs(''); }}
                                                            >
                                                                <option value="">-- 请选择发布平台 --</option>
                                                                {customCpuOptions.map(cpu => <option key={cpu} value={cpu}>{cpu}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold text-gray-500 uppercase">操作系统</label>
                                                            <select
                                                                className={`w-full p-2.5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${!tempPkgCpu ? 'bg-gray-100 dark:bg-white/5' : 'bg-white dark:bg-[#1C1C1E]'}`}
                                                                value={tempPkgOs}
                                                                onChange={e => setTempPkgOs(e.target.value)}
                                                                disabled={!tempPkgCpu}
                                                            >
                                                                <option value="">-- {tempPkgCpu ? '请选择系统' : '请先选 CPU'} --</option>
                                                                {customOsOptions.map(os => <option key={os} value={os}>{os}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">安装包链接 <span className="text-red-400 text-[10px] normal-case font-normal ml-1">定制安装包请粘贴链接</span></label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="url"
                                                            value={tempPkgLink}
                                                            onChange={e => setTempPkgLink(e.target.value)}
                                                            placeholder="请粘贴定制安装包下载链接"
                                                            className="flex-1 p-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
                                                        />
                                                        {tempPkgLink && (
                                                            <button onClick={() => setTempPkgLink('')} className="px-3 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 dark:border-white/10 rounded-xl transition">清除</button>
                                                        )}
                                                    </div>
                                                    {tempPkgLink && (
                                                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
                                                            <CheckCircle className="w-3 h-3"/>
                                                            <span>已填写安装包链接</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 已确认的安装包预览 */}
                                        {previewPkg && (
                                            <div className="flex items-center gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-xl">
                                                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0"/>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{previewPkg.deliveryItemName}</div>
                                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                        {[previewPkg.platform, previewPkg.cpu, previewPkg.os].filter(v => v && v !== '-').join(' · ')}
                                                        {previewPkg.productSpec && <span className="ml-2 text-indigo-400">({previewPkg.productSpec})</span>}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-indigo-400 shrink-0">{previewPkg.id}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ═══ 产品交付信息 ═══ */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Truck className="w-4 h-4 text-cyan-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">产品交付信息</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-cyan-500 uppercase flex items-center gap-1"><UserIcon className="w-3 h-3"/> 被授权方</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-cyan-200 dark:border-cyan-900/30 rounded-xl outline-none focus:ring-2 focus:ring-cyan-200 transition text-sm text-cyan-700 dark:text-cyan-400"
                                            placeholder="默认取客户名称"
                                            value={tempLicensee}
                                            onChange={e => setTempLicensee(e.target.value)}
                                        />
                                    </div>

                                    {(buyerType === 'Customer' || buyerType === 'Channel') && newOrderCustomer && selectedCustomerObj?.enterprises && selectedCustomerObj.enterprises.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> 关联企业 ID</label>
                                        <select
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-indigo-200 dark:border-indigo-900/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm text-indigo-700 dark:text-indigo-400"
                                            value={tempEnterpriseId}
                                            onChange={e => setTempEnterpriseId(e.target.value)}
                                        >
                                            <option value="">-- 不关联企业 --</option>
                                            {selectedCustomerObj.enterprises.map(ent => (
                                                <option key={ent.id} value={ent.id}>{ent.name} (ID: {ent.id})</option>
                                            ))}
                                        </select>
                                    </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-teal-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> 供货组织</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm text-teal-700 dark:text-teal-400"
                                            placeholder="自动带出"
                                            value={sellerName}
                                            onChange={e => setSellerName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ═══ 续费信息 ═══ */}
                            {(() => {
                                const canInfer = (buyerType === 'Customer' || buyerType === 'Channel') && !!newOrderCustomer && !renewalOrder && !subscriptionCheckout && !!tempProductId;
                                const tempItem: OrderItem = {
                                    productId: tempProductId,
                                    skuId: tempSkuId,
                                    productName: selectedProduct?.name || '',
                                    skuName: selectedSku?.name || '',
                                    quantity: tempQuantity,
                                    licensePeriod: tempLicensePeriodNum ? `${tempLicensePeriodNum}${tempLicensePeriodUnit}` : undefined,
                                    purchaseNature: tempPurchaseNature,
                                    purchaseNature365: tempPurchaseNature365,
                                } as OrderItem;
                                const modalInf = canInfer ? inferOrderLinePurchaseNatureFromSubscription(tempItem, newOrderCustomer, subscriptions) : null;
                                return (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Layers className="w-4 h-4 text-blue-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">续费信息</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">订购性质</label>
                                        <select
                                            value={tempPurchaseNature}
                                            onChange={e => setTempPurchaseNature(e.target.value as PurchaseNature)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 transition text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            <option value="New">新购</option>
                                            <option value="Renewal">续费</option>
                                            <option value="AddOn">增购</option>
                                            <option value="Upgrade">升级</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">365 订购性质</label>
                                        <select
                                            value={tempPurchaseNature365}
                                            onChange={e => setTempPurchaseNature365(e.target.value as PurchaseNature)}
                                            className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 transition text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                        >
                                            <option value="New">新购</option>
                                            <option value="Renewal">续费</option>
                                            <option value="AddOn">增购</option>
                                            <option value="Upgrade">升级</option>
                                        </select>
                                    </div>
                                </div>
                                {modalInf && (
                                <div className="border-l-2 border-teal-500/80 pl-3 pr-2 py-3 space-y-2.5 rounded-r-xl bg-teal-50/40 dark:bg-teal-950/20">
                                    <div className="text-[11px] font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300"/>
                                        订购性质识别
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                        <span className="text-gray-500">当前选择</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${purchaseNatureBadgeClass(tempPurchaseNature)}`}>{purchaseNatureDisplay(tempPurchaseNature)}</span>
                                        <span className="text-gray-400">·</span>
                                        <span className="text-gray-500">系统推荐</span>
                                        {modalInf.purchaseNature ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-bold ${purchaseNatureBadgeClass(modalInf.purchaseNature)}`}>{purchaseNatureDisplay(modalInf.purchaseNature)}</span>
                                        ) : (
                                            <span className="text-[11px] text-gray-500">待完善授权信息后判定</span>
                                        )}
                                        {modalInf.purchaseNature && modalInf.purchaseNature !== tempPurchaseNature && (
                                            <button type="button" onClick={() => { setTempPurchaseNature(modalInf.purchaseNature!); setTempPurchaseNature365(modalInf.purchaseNature!); }} className="ml-1 text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 underline underline-offset-2 font-bold transition">
                                                采纳推荐
                                            </button>
                                        )}
                                    </div>
                                    {modalInf.matchedSubscription && modalInf.matchedProduct && (
                                        <div className="rounded-xl border border-teal-100/90 dark:border-teal-800/40 bg-teal-50/40 dark:bg-teal-950/25 px-3 py-2.5 space-y-2 text-xs text-gray-800 dark:text-gray-200">
                                            <div>
                                                <span className="text-gray-500">对应订阅批</span>{' '}
                                                <span className="font-mono font-semibold text-[#0071E3] dark:text-[#0A84FF]">{modalInf.matchedSubscription.id}</span>
                                                <span className="text-gray-400 mx-1">·</span>
                                                <span className="text-gray-500">产品线</span> {modalInf.matchedSubscription.productLine}
                                            </div>
                                            <div>
                                                <div className="text-gray-500 mb-1">匹配产品（链上快照）</div>
                                                <div className="grid gap-1.5 sm:grid-cols-2">
                                                    <div><span className="text-gray-500">产品</span> {modalInf.matchedProduct.productName}</div>
                                                    <div><span className="text-gray-500">编码</span> {modalInf.matchedProduct.productCode}</div>
                                                    <div><span className="text-gray-500">SKU</span> {modalInf.matchedProduct.skuName}</div>
                                                    <div><span className="text-gray-500">当前数量</span> {modalInf.matchedProduct.currentQuantity}</div>
                                                    <div className="sm:col-span-2"><span className="text-gray-500">周期</span> {modalInf.matchedProduct.startDate} ~ {modalInf.matchedProduct.endDate} · {subscriptionStatusLabel(modalInf.matchedProduct.status)}</div>
                                                    <div className="sm:col-span-2"><span className="text-gray-500">授权类型</span> {modalInf.matchedProduct.licenseType}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {modalInf.headline && (
                                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{modalInf.headline}</p>
                                    )}
                                    {modalInf.bullets.length > 0 && (
                                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-4 list-disc marker:text-teal-600">
                                            {modalInf.bullets.map((b, bi) => (
                                                <li key={bi} className="leading-relaxed">{b}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                )}
                                {!canInfer && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                                    点击「确认添加」后，系统会根据当前订单客户与本产品授权期限，自动推断订购性质；您也可手动选择。
                                </div>
                                )}
                            </div>
                                );
                            })()}

                            {/* ═══ 下级单位授权 ═══ */}
                            {(buyerType !== 'SelfDeal' && selectedProduct?.subUnitLicenseAllowed !== false) && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                                    <Building2 className="w-4 h-4 text-indigo-500"/>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">下级单位授权</span>
                                    {selectedProduct?.subUnitLicenseAllowed === true && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold border border-green-100 dark:border-green-800">产品已启用</span>
                                    )}
                                </div>
                                <div className="flex items-start gap-4 flex-wrap">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5"><span className="text-blue-500 shrink-0 mt-px">ⓘ</span><span>选此方式表示由交付邮件的接收方在同一企业ID下查看一份电子授权信息（包含下级清单）；金山将交付邮件发送至线上收货"指定接收邮箱"</span></p>
                                    <p className="text-xs text-orange-500 dark:text-orange-400 flex items-start gap-1.5 shrink-0"><span className="shrink-0 mt-px">⚠</span><span>下级单位【卖方业务联系人】需要与主订单【卖方业务联系人】保持一致，否则存在退单可能性</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">按下级单位授权</span>
                                    <select
                                        value={tempSubUnitMode}
                                        onChange={e => { const mode = e.target.value as SubUnitAuthMode; setTempSubUnitMode(mode); if (mode === 'none') { setTempSubUnits([]); } else if (tempSubUnits.length === 0) { setTempSubUnits([{ id: `su_${Date.now()}_0`, unitName: '', enterpriseId: '', enterpriseName: '-', authCount: '', itContact: '', phone: '', email: '', customerType: '-', industryLine: '-', sellerContact: '-' }, { id: `su_${Date.now()}_1`, unitName: '', enterpriseId: '', enterpriseName: '-', authCount: '', itContact: '', phone: '', email: '', customerType: '-', industryLine: '-', sellerContact: '-' }]); } }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-400 transition min-w-[280px]"
                                    >
                                        <option value="none">无下级单位</option>
                                        <option value="separate_auth_separate_eid">授权分别呈现，企业ID分别管理</option>
                                        <option value="separate_auth_unified_eid">授权分别呈现，企业ID统一管理</option>
                                        <option value="unified_auth_with_list">授权和企业ID统一管理并提供下级清单</option>
                                    </select>
                                </div>
                                {tempSubUnitMode !== 'none' && (() => {
                                    const subTotal = tempSubUnits.reduce((s, u) => s + (parseInt(u.authCount) || 0), 0);
                                    const matched = tempSubUnits.length > 0 && subTotal === tempQuantity;
                                    const hasSubData = tempSubUnits.length > 0 && tempSubUnits.some(u => u.authCount);
                                    return (
                                    <div>
                                        <div className="px-5 py-2.5 flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                {hasSubData && (
                                                    <div className={`inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${matched ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200'}`}>
                                                        <span>合计: {subTotal}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>明细数量: {tempQuantity}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>{matched ? '✓ 匹配' : '✗ 不匹配'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={addTempSubUnit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
                                                    <Plus className="w-3 h-3"/> 新增下级单位
                                                </button>
                                                <button onClick={() => tempSubUnitImportRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1C1C1E] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-bold transition">
                                                    <Upload className="w-3 h-3"/> 批量导入
                                                </button>
                                                <button onClick={downloadSubUnitTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-xs font-medium transition">
                                                    <Download className="w-3 h-3"/> 下载模板
                                                </button>
                                            </div>
                                        </div>
                                        {(() => {
                                            const isUnifiedEid = tempSubUnitMode === 'separate_auth_unified_eid' || tempSubUnitMode === 'unified_auth_with_list';
                                            const colCount = isUnifiedEid ? 10 : 12;
                                            return (
                                        <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                                            <table className="w-full text-left text-xs" style={{ minWidth: isUnifiedEid ? 900 : 1100 }}>
                                                <thead className="sticky top-0 z-10"><tr className="bg-indigo-100/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                                                    <th className="p-2 pl-5 w-8 text-center">#</th>
                                                    <th className="p-2 whitespace-nowrap">客户下级单位名称</th>
                                                    {!isUnifiedEid && <th className="p-2 whitespace-nowrap">企业ID</th>}
                                                    {!isUnifiedEid && <th className="p-2 whitespace-nowrap">企业名称</th>}
                                                    <th className="p-2 whitespace-nowrap">授权数量</th>
                                                    <th className="p-2 whitespace-nowrap">IT联系人</th>
                                                    <th className="p-2 whitespace-nowrap">手机</th>
                                                    <th className="p-2 whitespace-nowrap">邮箱</th>
                                                    <th className="p-2 whitespace-nowrap">客户类型</th>
                                                    <th className="p-2 whitespace-nowrap">行业条线</th>
                                                    <th className="p-2 whitespace-nowrap">卖方联系人</th>
                                                    <th className="p-2 pr-5 text-center whitespace-nowrap">操作</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-indigo-100 dark:divide-indigo-800/20">
                                                    {tempSubUnits.map((unit, si) => (
                                                    <tr key={unit.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors align-top">
                                                        <td className="p-2 pl-5 text-center text-gray-400 font-mono">{si + 1}</td>
                                                        <td className="p-2">
                                                            <select value={unit.unitName} onChange={e => { const cust = customers.find(c => c.companyName === e.target.value); updateTempSubUnit(unit.id, 'unitName', e.target.value); updateTempSubUnit(unit.id, 'enterpriseId', ''); updateTempSubUnit(unit.id, 'enterpriseName', '-'); if (cust) { updateTempSubUnit(unit.id, 'customerType', cust.customerType || '-'); updateTempSubUnit(unit.id, 'industryLine', cust.industryLine || cust.industry || '-'); } }} className={`w-full min-w-[140px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.unitName ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}>
                                                                <option value="">请选择客户</option>
                                                                {customers.filter(c => c.id !== newOrderCustomer).map(c => <option key={c.id} value={c.companyName}>{c.companyName}</option>)}
                                                            </select>
                                                        </td>
                                                        {!isUnifiedEid && <td className="p-2">{(() => { const uc = customers.find(c => c.companyName === unit.unitName); const ents = uc?.enterprises; return ents && ents.length > 0 ? (<select value={unit.enterpriseId} onChange={e => { const ent = ents.find(en => en.id === e.target.value); updateTempSubUnit(unit.id, 'enterpriseId', e.target.value); updateTempSubUnit(unit.id, 'enterpriseName', ent?.name || '-'); }} className={`w-full min-w-[90px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.enterpriseId ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}><option value="">选择</option>{ents.map(ent => <option key={ent.id} value={ent.id}>{ent.id} ({ent.name})</option>)}</select>) : <span className="text-[10px] text-gray-400">{unit.unitName ? '无关联企业' : '请先选择'}</span>; })()}</td>}
                                                        {!isUnifiedEid && <td className="p-2 text-gray-500">{unit.enterpriseName}</td>}
                                                        <td className="p-2"><input type="number" min={1} value={unit.authCount} onChange={e => updateTempSubUnit(unit.id, 'authCount', e.target.value)} placeholder="数量" className={`w-full min-w-[60px] px-2 py-1 border rounded-lg text-xs outline-none transition bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.authCount ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}/></td>
                                                        <td className="p-2"><input value={unit.itContact} onChange={e => updateTempSubUnit(unit.id, 'itContact', e.target.value)} placeholder="联系人" className="w-full min-w-[80px] px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400"/></td>
                                                        <td className="p-2"><input value={unit.phone} onChange={e => updateTempSubUnit(unit.id, 'phone', e.target.value)} placeholder="手机号" className="w-full min-w-[90px] px-2 py-1 border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400"/></td>
                                                        <td className="p-2"><input type="email" value={unit.email} onChange={e => updateTempSubUnit(unit.id, 'email', e.target.value)} placeholder="邮箱" className={`w-full min-w-[100px] px-2 py-1 border rounded-lg text-xs outline-none bg-white dark:bg-black/30 dark:text-white focus:border-indigo-400 ${!unit.email ? 'border-red-300' : 'border-gray-200 dark:border-white/10'}`}/></td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.customerType}</td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.industryLine}</td>
                                                        <td className="p-2 text-gray-400 whitespace-nowrap">{unit.sellerContact}</td>
                                                        <td className="p-2 pr-5 text-center whitespace-nowrap"><button onClick={() => removeTempSubUnit(unit.id)} className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline">删除</button></td>
                                                    </tr>
                                                    ))}
                                                    {tempSubUnits.length === 0 && <tr><td colSpan={colCount} className="px-3 py-6 text-center text-gray-400 text-xs">暂无下级单位，请点击"新增下级单位"或"批量导入"添加</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                            );
                                        })()}
                                    </div>
                                    );
                                })()}
                            </div>
                            )}
                            <input ref={tempSubUnitImportRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleTempSubUnitImport(f); e.target.value = ''; }} />

                            </div>
                            {/* 底部操作栏 */}
                            <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1C1C1E] flex items-center justify-between">
                                <button onClick={() => { setShowAddProductModal(false); setEditingItemIndex(null); }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!tempProductId || !tempSkuId || !tempPricingOptionId}
                                    className="px-8 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-apple"
                                >
                                    {editingItemIndex !== null ? <><Check className="w-4 h-4"/> 保存修改</> : <><Plus className="w-4 h-4"/> 加入清单</>}
                                </button>
                            </div>
                        </div>
                        </ModalPortal>
                        )}


                    </div>
                )}

                {/* Step 4: Commerce & Delivery */}
                {currentStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4 text-amber-500"/> 序列号需求</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['生成新序列号', '沿用正式序列号', '沿用测试序列号'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setSerialNumberRequirement(opt); if (opt === '生成新序列号') setReuseSerialNumber(''); }}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                                serialNumberRequirement === opt
                                                    ? 'border-amber-500 dark:border-amber-400 bg-amber-50/60 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                                            }`}
                                        >
                                            {serialNumberRequirement === opt && <Check className="w-4 h-4 shrink-0" />}
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {serialNumberRequirement !== '生成新序列号' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <Key className="w-3 h-3"/> 请输入沿用的序列号（20位）
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={20}
                                            value={reuseSerialNumber}
                                            onChange={e => setReuseSerialNumber(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                                            className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl text-sm outline-none dark:text-white font-mono tracking-widest focus:ring-2 transition ${
                                                reuseSerialNumber.length === 20
                                                    ? 'border-green-300 dark:border-green-700 focus:ring-green-500/20'
                                                    : reuseSerialNumber.length > 0
                                                        ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500/20'
                                                        : 'border-gray-200 dark:border-white/10 focus:ring-blue-500/20'
                                            }`}
                                            placeholder="例如：A1B2C3D4E5F6G7H8I9J0"
                                        />
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className={`font-bold ${reuseSerialNumber.length === 20 ? 'text-green-600' : reuseSerialNumber.length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                {reuseSerialNumber.length}/20 位
                                                {reuseSerialNumber.length === 20 && ' ✓'}
                                            </span>
                                            <span className="text-gray-400">仅支持字母和数字</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 结算方式 */}
                            <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-500"/> 结算方式</h4>

                                {/* 第一层：现结销售 vs 信用额度 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setSettlementMethod('cash'); setSettlementType('once'); setInstallmentPlans([]); setExpectedPaymentDate(''); }}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                            settlementMethod === 'cash'
                                                ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settlementMethod === 'cash' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                            <Banknote className="w-4 h-4"/>
                                        </div>
                                        <div className="text-left">
                                            <div className={`text-sm font-bold ${settlementMethod === 'cash' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-300'}`}>现结销售</div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">款到发货，一次性结清</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setSettlementMethod('credit'); setSettlementType('once'); setInstallmentPlans([]); }}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                            settlementMethod === 'credit'
                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settlementMethod === 'credit' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                            <CreditCard className="w-4 h-4"/>
                                        </div>
                                        <div className="text-left">
                                            <div className={`text-sm font-bold ${settlementMethod === 'credit' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>信用额度</div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">先货后款，支持分期</div>
                                        </div>
                                    </button>
                                </div>

                                {/* 现结销售提示 */}
                                {settlementMethod === 'cash' && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 leading-relaxed flex items-center gap-2">
                                        <Check className="w-4 h-4 shrink-0"/>
                                        <span>现结销售：订单全部款项将在发货前一次性结清，无需分期。</span>
                                    </div>
                                )}

                                {/* 信用额度：第二层 - 一次性付款 vs 分期付款 */}
                                {settlementMethod === 'credit' && (
                                    <div className="space-y-4">
                                        <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                            <button
                                                onClick={() => { setSettlementType('once'); setInstallmentPlans([]); }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'once' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                            >
                                                一次性付款
                                            </button>
                                            <button
                                                onClick={() => { setSettlementType('installment'); setExpectedPaymentDate(''); if (installmentPlans.length < 2) { const total = calculateNewOrderTotal(); const half = Math.round(total / 2 * 100) / 100; setInstallmentPlans([{ amount: half, expectedDate: '', actualDate: '', paidAmount: 0 }, { amount: Math.round((total - half) * 100) / 100, expectedDate: '', actualDate: '', paidAmount: 0 }]); } }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'installment' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                            >
                                                分期付款
                                            </button>
                                        </div>

                                        {/* 一次性付款：填写预计付款时间 */}
                                        {settlementType === 'once' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500">预计付款时间</label>
                                                <input
                                                    type="date"
                                                    value={expectedPaymentDate}
                                                    onChange={e => setExpectedPaymentDate(e.target.value)}
                                                    className="w-full md:w-64 p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                                />
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">信用额度模式下，全部款项将在上述日期前一次性付清。</p>
                                            </div>
                                        )}

                                        {/* 分期付款：填写每期金额与预计付款时间 */}
                                        {settlementType === 'installment' && (
                                            <div className="space-y-3">
                                                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
                                                    <table className="w-full text-left text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">分期计划</th>
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">分期金额</th>
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">预计付款时间</th>
                                                                <th className="px-4 py-2.5 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                            {installmentPlans.map((plan, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/3">
                                                                    <td className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">第{idx + 1}期</td>
                                                                    <td className="px-4 py-2.5">
                                                                        <input
                                                                            type="number"
                                                                            value={plan.amount || ''}
                                                                            onChange={e => { const next = [...installmentPlans]; next[idx] = { ...next[idx], amount: Number(e.target.value) }; setInstallmentPlans(next); }}
                                                                            className="w-28 p-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 text-right font-mono"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        <input
                                                                            type="date"
                                                                            value={plan.expectedDate}
                                                                            onChange={e => { const next = [...installmentPlans]; next[idx] = { ...next[idx], expectedDate: e.target.value }; setInstallmentPlans(next); }}
                                                                            className="w-36 p-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        {installmentPlans.length > 2 && (
                                                                            <button onClick={() => setInstallmentPlans(installmentPlans.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1 transition"><X className="w-3.5 h-3.5"/></button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => setInstallmentPlans([...installmentPlans, { amount: 0, expectedDate: '', actualDate: '', paidAmount: 0 }])}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition"
                                                    >
                                                        <Plus className="w-3.5 h-3.5"/> 添加分期
                                                    </button>
                                                    <div className="text-xs text-gray-500">
                                                        分期合计：<span className={`font-bold font-mono ${Math.abs(installmentPlans.reduce((s, p) => s + p.amount, 0) - calculateNewOrderTotal()) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>¥{installmentPlans.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
                                                        <span className="mx-1.5">/</span>
                                                        订单总额：<span className="font-bold font-mono text-gray-700 dark:text-gray-300">¥{calculateNewOrderTotal().toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500"/> 收货信息</h4>

                                {/* 发货方式切换 */}
                                <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                    <button
                                        onClick={() => setDeliveryMethod('Online')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Online' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Mail className="w-3.5 h-3.5"/> 线上发货
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('Offline')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Offline' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Truck className="w-3.5 h-3.5"/> 线下发货
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('Hybrid')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Hybrid' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Layers className="w-3.5 h-3.5"/> 混合发货
                                    </button>
                                </div>

                                {/* 线上发货 - 多条记录 */}
                                {(deliveryMethod === 'Online' || deliveryMethod === 'Hybrid') && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3"/> 线上发货信息</span>
                                            <span className="text-[10px] text-gray-400">{onlineDeliveries.length} 条记录</span>
                                        </div>
                                        <div className="space-y-2">
                                            {onlineDeliveries.map((entry, idx) => (
                                                <div key={entry.id} className="relative p-4 bg-blue-50/40 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-blue-500">#{idx + 1}</span>
                                                        {onlineDeliveries.length > 1 && (
                                                            <button onClick={() => setOnlineDeliveries(onlineDeliveries.filter(e => e.id !== entry.id))} className="text-gray-400 hover:text-red-500 p-0.5 transition"><X className="w-3.5 h-3.5"/></button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货方</label>
                                                            <select
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.receivingParty}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], receivingParty: e.target.value }; setOnlineDeliveries(next); }}
                                                            >
                                                                <option value="买方">买方</option>
                                                                <option value="代理商">代理商</option>
                                                                <option value="最终用户">最终用户</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货单位名称</label>
                                                            <input
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.receivingCompany}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], receivingCompany: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="收货单位全称..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货邮箱 <span className="text-red-400">*</span></label>
                                                            <input
                                                                type="email"
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.email}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], email: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="接收开通通知的邮箱..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">联系电话</label>
                                                            <input
                                                                type="tel"
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.phone || ''}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], phone: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="联系电话..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setOnlineDeliveries([...onlineDeliveries, { id: generateId(), receivingParty: '买方', receivingCompany: '', email: '', phone: '' }])}
                                            className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/> 添加线上发货记录
                                        </button>
                                    </div>
                                )}

                                {/* 线下发货 - 单条收货信息 */}
                                {(deliveryMethod === 'Offline' || deliveryMethod === 'Hybrid') && (
                                    <div className="space-y-3">
                                        {deliveryMethod === 'Hybrid' && (
                                            <span className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1"><Truck className="w-3 h-3"/> 线下发货信息</span>
                                        )}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货方</label>
                                            <select
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingParty}
                                                onChange={e => setReceivingParty(e.target.value)}
                                            >
                                                <option value="买方">买方</option>
                                                <option value="代理商">代理商</option>
                                                <option value="最终用户">最终用户</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货单位名称</label>
                                            <input
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingCompany}
                                                onChange={e => setReceivingCompany(e.target.value)}
                                                placeholder="请输入收货单位全称..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 block mb-1">联系电话</label>
                                                <input
                                                    type="tel"
                                                    className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={shippingPhone}
                                                    onChange={e => setShippingPhone(e.target.value)}
                                                    placeholder="请输入收货联系电话..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 block mb-1">联系邮箱</label>
                                                <input
                                                    type="email"
                                                    className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={shippingEmail}
                                                    onChange={e => setShippingEmail(e.target.value)}
                                                    placeholder="请输入收货联系邮箱..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货地址</label>
                                            <textarea
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                                                value={shippingAddress}
                                                onChange={e => setShippingAddress(e.target.value)}
                                                placeholder="请输入详细收货地址..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* 验收计划 - 整行展示 */}
                    <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple overflow-hidden">
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-green-500"/> 验收计划</h4>
                        </div>
                        {newOrderItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="unified-table-header">
                                        <tr>
                                            <th className="px-4 py-3 pl-5 text-center w-16">明细编号</th>
                                            <th className="px-4 py-3">产品名称</th>
                                            <th className="px-4 py-3">验收方式</th>
                                            <th className="px-4 py-3">验收条件</th>
                                            <th className="px-4 py-3">预计验收时间</th>
                                            <th className="px-4 py-3 text-center">验收比例</th>
                                            <th className="px-4 py-3 text-right">验收金额</th>
                                            <th className="px-4 py-3 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, itemIdx) => {
                                            const rows = productAcceptanceRows.filter(r => r.productIdx === itemIdx);
                                            const itemAmount = item.priceAtPurchase * item.quantity;
                                            return rows.map((row, rowIdx) => {
                                                const globalIdx = productAcceptanceRows.indexOf(row);
                                                const isFirst = rowIdx === 0;
                                                const rowAmount = Math.round(itemAmount * row.percentage / 100 * 100) / 100;
                                                return (
                                                    <tr key={`${itemIdx}-${rowIdx}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        {isFirst && (
                                                            <td className="px-4 py-3 pl-5 text-center align-top" rowSpan={rows.length}>
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 text-xs font-bold font-mono text-green-600 dark:text-green-400">{itemIdx + 1}</span>
                                                            </td>
                                                        )}
                                                        {isFirst && (
                                                            <td className="px-4 py-3 align-top" rowSpan={rows.length}>
                                                                <div className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</div>
                                                                {item.skuName && <div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div>}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3">
                                                            <select value={row.method} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                const newMethod = e.target.value as '一次性验收' | '分期验收';
                                                                next[globalIdx] = { ...next[globalIdx], method: newMethod };
                                                                if (newMethod === '一次性验收') {
                                                                    const filtered = next.filter(r => !(r.productIdx === itemIdx && next.indexOf(r) !== globalIdx));
                                                                    filtered[filtered.indexOf(next[globalIdx])] = { ...next[globalIdx], percentage: 100 };
                                                                    setProductAcceptanceRows(filtered);
                                                                } else {
                                                                    setProductAcceptanceRows(next);
                                                                }
                                                            }} className="text-xs font-medium border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition cursor-pointer">
                                                                <option value="一次性验收">一次性验收</option>
                                                                <option value="分期验收">分期验收</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.condition} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                next[globalIdx] = { ...next[globalIdx], condition: e.target.value };
                                                                setProductAcceptanceRows(next);
                                                            }} className="text-xs font-medium border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition cursor-pointer">
                                                                <option value="视同验收">视同验收</option>
                                                                <option value="签字验收">签字验收</option>
                                                                <option value="系统验收">系统验收</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input type="date" value={row.expectedDate} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                next[globalIdx] = { ...next[globalIdx], expectedDate: e.target.value };
                                                                setProductAcceptanceRows(next);
                                                            }} className="text-xs border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition w-32"/>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <input type="number" min={0} max={100} value={row.percentage} onChange={e => {
                                                                    const next = [...productAcceptanceRows];
                                                                    next[globalIdx] = { ...next[globalIdx], percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) };
                                                                    setProductAcceptanceRows(next);
                                                                }} className="w-14 text-center text-xs font-mono border border-gray-200 dark:border-white/10 rounded-lg px-1 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition"/>
                                                                <span className="text-xs text-gray-400">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white text-xs">¥{rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {row.method === '分期验收' && rows.length > 1 && (
                                                                <button onClick={() => setProductAcceptanceRows(prev => prev.filter((_, i) => i !== globalIdx))} className="text-gray-400 hover:text-red-500 p-0.5 transition"><X className="w-3.5 h-3.5"/></button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </tbody>
                                </table>
                                {newOrderItems.some((_, idx) => productAcceptanceRows.some(r => r.productIdx === idx && r.method === '分期验收')) && (
                                    <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-2">
                                        {newOrderItems.map((item, idx) => {
                                            const rows = productAcceptanceRows.filter(r => r.productIdx === idx);
                                            if (!rows.some(r => r.method === '分期验收')) return null;
                                            const totalPct = rows.reduce((s, r) => s + r.percentage, 0);
                                            return (
                                                <button key={idx} onClick={() => setProductAcceptanceRows(prev => [...prev, { productIdx: idx, method: '分期验收', condition: '视同验收', expectedDate: '', percentage: Math.max(0, 100 - totalPct) }])} className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                                    <Plus className="w-3 h-3"/> {item.productName} 添加分期
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-5 pb-4 pt-1">
                                <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                                    <ClipboardCheck className="w-8 h-8 mb-2 opacity-50"/>
                                    <p className="text-sm font-medium">请先添加产品后配置验收计划</p>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
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
                            disabled={
                                (currentStep === 1 && !buyerType) ||
                                (currentStep === 2 && (
                                    buyerType === 'SelfDeal' ? !orderEnterpriseId
                                    : buyerType === 'Customer' ? (!linkedOpportunityId || !newOrderCustomer)
                                    : !hasOpportunity || (hasOpportunity === 'yes' ? (!linkedOpportunityId || !newOrderCustomer) : !newOrderCustomer)
                                       || (buyerType === 'Channel' && !selectedChannelId)
                                )) ||
                                (currentStep === 3 && newOrderItems.length === 0)
                            }
                            onClick={() => {
                                if (currentStep === 2) {
                                    const missingPurchasing = purchasingContacts.length > 0 && !selectedPurchasingContactId;
                                    const missingIT = itContacts.length > 0 && !selectedItContactId;
                                    if (missingPurchasing || missingIT) {
                                        alert(`请选择${missingPurchasing ? '采购联系人' : ''}${missingPurchasing && missingIT ? '和' : ''}${missingIT ? 'IT 联系人' : ''}`);
                                        return;
                                    }
                                }
                                setCurrentStep(currentStep + 1);
                            }}
                            className="bg-[#0071E3] text-white px-10 py-3 rounded-xl font-bold shadow-xl hover:scale-105 hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none text-sm"
                        >
                            下一步
                        </button>
                    ) : (
                        <button onClick={handleCreateOrder} className="unified-button-primary bg-[#0071E3] dark:bg-[#FF2D55] shadow-xl dark:hover:bg-[#FF2D55]/90 hover:scale-105 hover:shadow-blue-500/30">
                            提交订单
                        </button>
                    )}
                </div>
            </div>
        </div>
        </ModalPortal>


        {/* 折算单选择弹窗 */}
        {isConversionPickerOpen && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-white/10 animate-modal-enter">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">选择关联折算单</h3>
                        <button onClick={() => setIsConversionPickerOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                        <select className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" value={conversionSearchField} onChange={e => setConversionSearchField(e.target.value as 'enterpriseName' | 'id')}>
                            <option value="enterpriseName">企业名称</option>
                            <option value="id">折算单号</option>
                        </select>
                        <div className="flex items-center gap-2 flex-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                            <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                            <input
                                type="text"
                                placeholder="请输入"
                                className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                                value={conversionSearch}
                                onChange={e => setConversionSearch(e.target.value)}
                                autoFocus
                            />
                            {conversionSearch && (
                                <button onClick={() => setConversionSearch('')} className="text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4"/></button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header sticky top-0">
                                <tr>
                                    <th className="p-4 pl-5 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-[#0071E3] rounded"
                                            checked={filteredConversionOrders.length > 0 && filteredConversionOrders.every(c => selectedConversionIds.includes(c.id))}
                                            ref={(el) => { if (el) el.indeterminate = filteredConversionOrders.some(c => selectedConversionIds.includes(c.id)) && !filteredConversionOrders.every(c => selectedConversionIds.includes(c.id)); }}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    const newIds = new Set([...selectedConversionIds, ...filteredConversionOrders.map(c => c.id)]);
                                                    setSelectedConversionIds(Array.from(newIds));
                                                } else {
                                                    const removeIds = new Set(filteredConversionOrders.map(c => c.id));
                                                    setSelectedConversionIds(prev => prev.filter(id => !removeIds.has(id)));
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="p-4 whitespace-nowrap">折算单号</th>
                                    <th className="p-4 whitespace-nowrap text-center">折算金额</th>
                                    <th className="p-4 whitespace-nowrap">企业名称</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {filteredConversionOrders.length === 0 ? (
                                    <tr><td colSpan={4} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">未找到可用的折算单</td></tr>
                                ) : filteredConversionOrders.map(co => {
                                    const isSelected = selectedConversionIds.includes(co.id);
                                    return (
                                        <tr
                                            key={co.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedConversionIds(prev => prev.filter(id => id !== co.id));
                                                else setSelectedConversionIds(prev => [...prev, co.id]);
                                            }}
                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20' : 'hover:bg-blue-50/60 dark:hover:bg-white/[0.06]'}`}
                                        >
                                            <td className="p-4 pl-5"><input type="checkbox" className="w-4 h-4 accent-[#0071E3] rounded pointer-events-none" checked={isSelected} readOnly /></td>
                                            <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-300">{co.id}</td>
                                            <td className="p-4 text-center font-medium text-gray-900 dark:text-white">¥{co.amount.toLocaleString()}</td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{co.enterpriseName}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between shrink-0">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            折算总金额: <span className="text-amber-600 dark:text-amber-400">¥{selectedConversionIds.reduce((s, id) => s + (availableConversionOrders.find(c => c.id === id)?.amount ?? 0), 0).toLocaleString()}</span>
                        </span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsConversionPickerOpen(false)} className="px-5 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                            <button onClick={() => setIsConversionPickerOpen(false)} className="unified-button-primary bg-[#0071E3] text-sm">确定</button>
                        </div>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* 商机选择器弹窗 */}
        {isContractPickerOpen && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col border-white/10 animate-modal-enter">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ScrollText className="w-5 h-5 text-blue-500"/> 选择关联合同
                            <span className="text-sm font-normal text-gray-400">（已选 {linkedContractIds.length}/5）</span>
                        </h3>
                        <button onClick={() => { setIsContractPickerOpen(false); setContractPickerSearch(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                        <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input
                            type="text"
                            placeholder="搜索合同名称、编号、甲方或乙方..."
                            className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                            value={contractPickerSearch}
                            onChange={e => { setContractPickerSearch(e.target.value); setContractPickerPage(1); }}
                            autoFocus
                        />
                        {contractPickerSearch && (
                            <button onClick={() => setContractPickerSearch('')} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header sticky top-0">
                                <tr>
                                    <th className="p-4 pl-5 whitespace-nowrap">合同名称</th>
                                    <th className="p-4 whitespace-nowrap">合同编号</th>
                                    <th className="p-4 whitespace-nowrap">合同类型</th>
                                    <th className="p-4 whitespace-nowrap">甲方</th>
                                    <th className="p-4 whitespace-nowrap text-right">签约金额</th>
                                    <th className="p-4 whitespace-nowrap">签署日期</th>
                                    <th className="p-4 whitespace-nowrap">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {(() => {
                                    const q = contractPickerSearch.toLowerCase();
                                    const filtered = contracts.filter(c =>
                                        !q ||
                                        c.name.toLowerCase().includes(q) ||
                                        c.code.toLowerCase().includes(q) ||
                                        (c.partyA || '').toLowerCase().includes(q) ||
                                        (c.partyB || '').toLowerCase().includes(q)
                                    );
                                    if (filtered.length === 0) return (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
                                                未找到匹配的合同
                                            </td>
                                        </tr>
                                    );
                                    const statusLabel: Record<string, string> = {
                                        PENDING_BUSINESS: '待商务审核', PENDING: '待审核',
                                        VERIFIED: '已审核', APPROVED: '已批准', REJECTED: '已拒绝',
                                    };
                                    const statusTagClass: Record<string, string> = {
                                        PENDING_BUSINESS: 'unified-tag-yellow !rounded-full',
                                        PENDING: 'unified-tag-blue !rounded-full',
                                        VERIFIED: 'unified-tag-indigo !rounded-full',
                                        APPROVED: 'unified-tag-green !rounded-full',
                                        REJECTED: 'unified-tag-red !rounded-full',
                                    };
                                    const paginated = filtered.slice((contractPickerPage - 1) * CONTRACT_PAGE_SIZE, contractPickerPage * CONTRACT_PAGE_SIZE);
                                    return paginated.map(c => {
                                        const isSelected = linkedContractIds.includes(c.id);
                                        const isDisabled = !isSelected && linkedContractIds.length >= 5;
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => {
                                                    if (isDisabled) return;
                                                    if (isSelected) {
                                                        setLinkedContractIds(prev => prev.filter(id => id !== c.id));
                                                    } else {
                                                        setLinkedContractIds(prev => [...prev, c.id]);
                                                    }
                                                }}
                                                className={`transition-colors ${
                                                    isDisabled
                                                        ? 'opacity-40 cursor-not-allowed'
                                                        : isSelected
                                                        ? 'bg-blue-50/80 dark:bg-blue-900/20 cursor-pointer'
                                                        : 'hover:bg-blue-50/60 dark:hover:bg-white/[0.06] cursor-pointer group'
                                                }`}
                                            >
                                                <td className="p-4 pl-5 max-w-[220px]">
                                                    <div className={`font-medium truncate flex items-center gap-2 ${isSelected ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-900 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF]'} transition-colors`}>
                                                        {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                                                        {c.name}
                                                    </div>
                                                    {c.externalCode && <div className="text-xs text-gray-400 font-mono mt-0.5">{c.externalCode}</div>}
                                                </td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300 font-mono whitespace-nowrap">{c.code}</td>
                                                <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{c.contractType}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 max-w-[160px]">
                                                    <div className="truncate">{c.partyA || '-'}</div>
                                                </td>
                                                <td className="p-4 text-right whitespace-nowrap font-mono text-gray-700 dark:text-gray-300">
                                                    {c.amount != null ? `¥${c.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {c.signDate ? new Date(c.signDate).toLocaleDateString('zh-CN') : '-'}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={statusTagClass[c.verifyStatus] || 'unified-tag-gray !rounded-full'}>
                                                        {statusLabel[c.verifyStatus] || c.verifyStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                    {/* 分页 + 底部确认栏 */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between shrink-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {linkedContractIds.length === 0 ? '点击行选择合同' : `已选 ${linkedContractIds.length} 个合同`}
                        </span>
                        {(() => {
                            const q = contractPickerSearch.toLowerCase();
                            const totalFiltered = contracts.filter(c =>
                                !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.partyA || '').toLowerCase().includes(q) || (c.partyB || '').toLowerCase().includes(q)
                            ).length;
                            if (totalFiltered <= CONTRACT_PAGE_SIZE) return null;
                            return (
                                <Pagination
                                    page={contractPickerPage}
                                    size={CONTRACT_PAGE_SIZE}
                                    total={totalFiltered}
                                    onPageChange={setContractPickerPage}
                                    className="flex items-center gap-3"
                                />
                            );
                        })()}
                        <button
                            onClick={() => { setIsContractPickerOpen(false); setContractPickerSearch(''); }}
                            className="unified-button-primary bg-[#0071E3] text-sm"
                        >
                            确定
                        </button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {isOppPickerOpen && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
                <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col border-white/10 animate-modal-enter">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-500"/> 选择商机
                        </h3>
                        <button onClick={() => { setIsOppPickerOpen(false); setOppPickerSearch(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-3 shrink-0">
                        <Search className="w-4 h-4 text-gray-400 shrink-0"/>
                        <input
                            type="text"
                            placeholder="搜索商机名称、客户名称或商机编号..."
                            className="bg-transparent border-none outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-sm"
                            value={oppPickerSearch}
                            onChange={e => setOppPickerSearch(e.target.value)}
                            autoFocus
                        />
                        {oppPickerSearch && (
                            <button onClick={() => setOppPickerSearch('')} className="text-gray-400 hover:text-gray-600 transition">
                                <X className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header sticky top-0">
                                <tr>
                                    <th className="p-4 pl-5 whitespace-nowrap">商机编号</th>
                                    <th className="p-4 whitespace-nowrap">商机名称</th>
                                    <th className="p-4 whitespace-nowrap">客户名称</th>
                                    <th className="p-4 whitespace-nowrap">产品名称/授权类型</th>
                                    <th className="p-4 whitespace-nowrap">所属部门</th>
                                    <th className="p-4 whitespace-nowrap">商机阶段</th>
                                    <th className="p-4 whitespace-nowrap">最终成交金额</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {opportunities
                                    .filter(o =>
                                        !oppPickerSearch ||
                                        o.name.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                        o.customerName.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                        o.id.toLowerCase().includes(oppPickerSearch.toLowerCase())
                                    )
                                    .map(o => (
                                        <tr
                                            key={o.id}
                                            onClick={() => {
                                                handleOpportunityChange(o.id);
                                                setIsOppPickerOpen(false);
                                                setOppPickerSearch('');
                                            }}
                                            className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-white/[0.06] transition-colors group"
                                        >
                                            <td className="p-4 pl-5 text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap text-xs">{o.id}</td>
                                            <td className="p-4 max-w-[200px]">
                                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#FF2D55] transition-colors line-clamp-2">{o.name}</div>
                                            </td>
                                            <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{o.customerName}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[240px]">
                                                {o.products && o.products.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {o.products.map((p, pi) => (
                                                            <span key={pi} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[11px] leading-tight">
                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{p.productName}</span>
                                                                {p.skuName && <span className="text-gray-400">/{p.skuName}</span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs">{o.productType || '-'}</div>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">{o.department || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                                                    o.stage === '赢单' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    o.stage === '输单' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' :
                                                    o.stage === '需求判断' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    o.stage === '确认商机' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                    o.stage === '确认渠道' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>{o.stage}</span>
                                            </td>
                                            <td className="p-4 text-gray-900 dark:text-white whitespace-nowrap font-medium">
                                                {o.finalUserRevenue != null ? `${o.finalUserRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : o.amount != null ? `${o.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                {opportunities.filter(o =>
                                    !oppPickerSearch ||
                                    o.name.toLowerCase().includes(oppPickerSearch.toLowerCase()) ||
                                    o.customerName.toLowerCase().includes(oppPickerSearch.toLowerCase())
                                ).length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
                                            未找到匹配的商机
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

        {/* New Contact Modal */}
        {showNewContactModal && (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in" onClick={() => setShowNewContactModal(null)}>
                <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-[440px] animate-modal-enter" onClick={e => e.stopPropagation()}>
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            新建{showNewContactModal === 'Purchasing' ? '采购' : 'IT'}联系人
                        </h3>
                        <button onClick={() => setShowNewContactModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">姓名 <span className="text-red-500">*</span></label>
                            <input
                                value={newContactForm.name}
                                onChange={e => setNewContactForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                placeholder="请输入联系人姓名"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">职位</label>
                            <input
                                value={newContactForm.position}
                                onChange={e => setNewContactForm(f => ({ ...f, position: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                placeholder="请输入职位"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">手机号</label>
                                <input
                                    value={newContactForm.phone}
                                    onChange={e => setNewContactForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                    placeholder="请输入手机号"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">邮箱</label>
                                <input
                                    value={newContactForm.email}
                                    onChange={e => setNewContactForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                    placeholder="请输入邮箱"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
                        <button onClick={() => setShowNewContactModal(null)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
                        <button
                            onClick={handleSaveNewContact}
                            disabled={!newContactForm.name.trim()}
                            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            确定创建
                        </button>
                    </div>
                </div>
            </div>
            </ModalPortal>
        )}

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
