
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, ActivationMethod, AcceptanceType, AcceptancePhase, OrderSource, BuyerType, InvoiceInfo, AcceptanceInfo, PaymentMethod, DeliveryMethod, OrderDraft } from '../../types';
import { User as UserIcon, Plus, Trash2, CheckCircle, FileText, CreditCard, Truck, ShoppingBag, X, Target, MousePointer2, ClipboardCheck, ArrowUpRight, Percent, Layers, Network, Globe, Radio, RefreshCcw, Wallet, Zap, Box, Settings, MapPin, Briefcase, XCircle, Search, Save, ScrollText, Phone, Mail, Users, Banknote, Calendar, Check } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

interface OrderCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  renewalOrder?: Order;
  initialDraft?: OrderDraft;
}

const OrderCreateWizard: React.FC<OrderCreateWizardProps> = ({ isOpen, onClose, renewalOrder, initialDraft }) => {
  const { products, customers, channels, opportunities, contracts, users, orders, setOrders, currentUser, standaloneEnterprises, orderDrafts, setOrderDrafts } = useAppContext();
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

  // Step 2: Customer & Buyer & Opportunity
  const [hasOpportunity, setHasOpportunity] = useState<'yes' | 'no' | ''>('');
  const [linkedOpportunityId, setLinkedOpportunityId] = useState('');
  const [isOppPickerOpen, setIsOppPickerOpen] = useState(false);
  const [oppPickerSearch, setOppPickerSearch] = useState('');
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [businessManagerId, setBusinessManagerId] = useState('');
  const [salesRepId, setSalesRepId] = useState('');
  const [creatorId, setCreatorId] = useState(currentUser.id);
  const [orderEnterpriseId, setOrderEnterpriseId] = useState('');
  // 可选联系人列表 & 选中的联系人 ID
  const [purchasingContacts, setPurchasingContacts] = useState<typeof customers[0]['contacts']>([]);
  const [itContacts, setItContacts] = useState<typeof customers[0]['contacts']>([]);
  const [selectedPurchasingContactId, setSelectedPurchasingContactId] = useState('');
  const [selectedItContactId, setSelectedItContactId] = useState('');
  
  // Step 3: Merchandise Selection (New Cascading Logic)
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [tempTopCategory, setTempTopCategory] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempProductId, setTempProductId] = useState('');
  const [tempSkuId, setTempSkuId] = useState('');
  const [tempPricingOptionId, setTempPricingOptionId] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('LicenseKey');
  const [tempLicensePeriod, setTempLicensePeriod] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  // Per-item enterprise selection (Customer & Channel types)
  const [tempEnterpriseId, setTempEnterpriseId] = useState('');

  // Install package selection
  const [tempPkgType, setTempPkgType] = useState<'通用' | '定制' | ''>('');
  const [tempPkgCpu, setTempPkgCpu] = useState('');
  const [tempPkgOs, setTempPkgOs] = useState('');
  const [tempPkgLink, setTempPkgLink] = useState('');

  // Computed data for selection cascade
  const selectedProduct = products.find(p => p.id === tempProductId);
  const selectedSku = selectedProduct?.skus.find(s => s.id === tempSkuId);
  const selectedOption = selectedSku?.pricingOptions?.find(o => o.id === tempPricingOptionId);
  const selectedLicenseType = selectedOption?.title || undefined;
  const selectedLicensePeriodType = selectedOption ? selectedOption.license.periodUnit : undefined;
  const showLicensePeriod = selectedLicensePeriodType !== 'Forever' && selectedLicensePeriodType !== undefined;

  const [originalOrderId, setOriginalOrderId] = useState<string | undefined>(undefined);

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
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Online');
  const [receivingParty, setReceivingParty] = useState('买方');
  const [receivingCompany, setReceivingCompany] = useState('');
  const [receivingMethod, setReceivingMethod] = useState('邮寄');
  const [shippingAddress, setShippingAddress] = useState('');

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

  const [settlementType, setSettlementType] = useState<'once' | 'installment'>('once');
  const [installmentPlans, setInstallmentPlans] = useState<{amount: number; expectedDate: string; actualDate: string; paidAmount: number}[]>([]);

  const wizardSteps = [
      { id: 1, label: '订单类型', desc: '来源与模式', icon: Layers },
      { id: 2, label: '客户信息', desc: '客户/商机', icon: UserIcon },
      { id: 3, label: '产品配置', desc: '规格/价格', icon: ShoppingBag },
      { id: 4, label: '商务交付', desc: '备注/验收', icon: ClipboardCheck },
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
    }
  }, [buyerType]);

  // When toggling hasOpportunity, reset related fields
  useEffect(() => {
    if (isRestoringDraftRef.current) return;
    if (hasOpportunity === 'no') {
      setLinkedOpportunityId('');
    }
    if (hasOpportunity === 'yes') {
      setNewOrderCustomer('');
      setOrderEnterpriseId('');
    }
  }, [hasOpportunity]);

  // Reset downstream selections when upstream changes
  useEffect(() => { setTempCategory(''); setTempProductId(''); setTempSkuId(''); setTempPricingOptionId(''); setNegotiatedPrice(null); setTempPkgType(''); setTempPkgCpu(''); setTempPkgOs(''); setTempPkgLink(''); }, [tempTopCategory]);
  useEffect(() => { setTempProductId(''); setTempSkuId(''); setTempPricingOptionId(''); setNegotiatedPrice(null); setTempPkgType(''); setTempPkgCpu(''); setTempPkgOs(''); setTempPkgLink(''); }, [tempCategory]);
  useEffect(() => { setTempSkuId(''); setTempPricingOptionId(''); setNegotiatedPrice(null); setTempPkgType(''); setTempPkgCpu(''); setTempPkgOs(''); setTempPkgLink(''); }, [tempProductId]);
  useEffect(() => { setTempPkgCpu(''); setTempPkgOs(''); setTempPkgLink(''); }, [tempPkgType]);
  useEffect(() => { 
      setTempPricingOptionId(''); 
      setNegotiatedPrice(null); 
      // Auto select first option if only one
      if (selectedSku?.pricingOptions && selectedSku.pricingOptions.length === 1) {
          setTempPricingOptionId(selectedSku.pricingOptions[0].id);
      }
  }, [tempSkuId, selectedSku]);

  // Set default price
  useEffect(() => {
      if (selectedOption) {
          setNegotiatedPrice(selectedOption.price);
      } else if (selectedSku) {
          setNegotiatedPrice(selectedSku.price);
      }
  }, [selectedOption, selectedSku]);

  const salesUsers = users.filter(u => u.role === 'Sales' || u.role === 'Admin');
  const resetCreateForm = () => {
      setCurrentDraftId(undefined);
      setDraftSavedTip(false);
      setNewOrderCustomer('');
      setOrderEnterpriseId('');
      setLinkedOpportunityId('');
      setHasOpportunity('');
      setBuyerType(''); 
      setOrderSource('Sales');
      setOrderRemark('');
      setLinkedContractIds([]);
      setOriginalOrderId(undefined);
      setSelectedChannelId('');
      setSalesRepId(currentUser.role === 'Sales' ? currentUser.id : '');
      setBusinessManagerId('');
      setCreatorId(currentUser.id);
      setNewOrderItems([]);
      setTempTopCategory('');
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
      setPaymentMethod('Transfer');
      setPaymentTerms('');
      setDeliveryMethod('Online');
      setReceivingParty('买方');
      setReceivingCompany('');
      setReceivingMethod('邮寄');
      setShippingAddress('');
      setAcceptanceForm({ contactName: '', contactPhone: '', method: 'Remote', email: '' });
      setAcceptanceType('OneTime');
      setPhaseDrafts([{ name: '第一阶段验收', percentage: 30 }, { name: '最终验收', percentage: 70 }]);
      setPurchasingContacts([]);
      setItContacts([]);
      setSelectedPurchasingContactId('');
      setSelectedItContactId('');
  };

  const handleClose = () => { onClose(); resetCreateForm(); };

  const handleOpportunityChange = (oppId: string) => {
      setLinkedOpportunityId(oppId);
      const opp = opportunities.find(o => o.id === oppId);
      if (opp && opp.customerId) handleCustomerChange(opp.customerId);
  };

  const handleCustomerChange = (customerId: string) => {
      setNewOrderCustomer(customerId);
      setOrderEnterpriseId(''); // Reset enterprise selection
      setPurchasingContacts([]);
      setItContacts([]);
      setSelectedPurchasingContactId('');
      setSelectedItContactId('');
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          if (customer.ownerId) setSalesRepId(customer.ownerId);
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
          // 自动选中：唯一一个则直接选中，否则优先选主要联系人
          if (pContacts.length === 1) {
              setSelectedPurchasingContactId(pContacts[0].id);
          } else if (pContacts.length > 1) {
              const primary = pContacts.find(c => c.isPrimary);
              if (primary) setSelectedPurchasingContactId(primary.id);
          }
          if (iContacts.length === 1) {
              setSelectedItContactId(iContacts[0].id);
          } else if (iContacts.length > 1) {
              const primary = iContacts.find(c => c.isPrimary);
              if (primary) setSelectedItContactId(primary.id);
          }
      }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSku || tempQuantity <= 0) return;
    
    if (selectedSku.pricingOptions && selectedSku.pricingOptions.length > 0 && !selectedOption) {
        alert("请选择授权类型 (Pricing Option)");
        return;
    }

    const capabilitiesSnapshot = selectedProduct.composition?.map(c => c.name) || [];

    // Resolve selected install package
    const pkgs = selectedProduct.installPackages || [];
    let resolvedInstallPackageName: string | undefined;
    if (tempPkgType === '通用') {
        const universalPkgs = pkgs.filter(p => p.cpu === '通用');
        const matched = universalPkgs.find(p => !tempPkgOs || p.os === tempPkgOs);
        resolvedInstallPackageName = matched ? `${matched.name} v${matched.version} (${matched.os})` : undefined;
    } else if (tempPkgType === '定制') {
        const customPkgs = pkgs.filter(p => p.cpu !== '通用');
        const matched = customPkgs.find(p =>
            (!tempPkgCpu || p.cpu === tempPkgCpu) && (!tempPkgOs || p.os === tempPkgOs)
        );
        resolvedInstallPackageName = matched ? `${matched.name} v${matched.version} (${matched.cpu} / ${matched.os})` : undefined;
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

    const newItem: OrderItem = {
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
        licensePeriod: isPermanent ? '永久' : (needsManualPeriod && tempLicensePeriod ? tempLicensePeriod : undefined),
        activationMethod: tempActivationMethod,
        installPackageName: resolvedInstallPackageName,
        installPackageType: tempPkgType || undefined,
        installPackageLink: tempPkgType === '定制' && tempPkgLink ? tempPkgLink : undefined,
        enterpriseId: resolvedEntId || undefined,
        enterpriseName: enterpriseName,
        capabilitiesSnapshot
    };

    setNewOrderItems([...newOrderItems, newItem]);
    setTempQuantity(1); 
    setTempLicensePeriod('');
    setNegotiatedPrice(null);
    setTempSkuId('');
    setTempPricingOptionId('');
    setTempEnterpriseId('');
    setTempPkgType('');
    setTempPkgCpu('');
    setTempPkgOs('');
    setTempPkgLink('');
  };

  const handleRemoveItem = (index: number) => setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  const calculateNewOrderTotal = () => newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

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
      orderEnterpriseId, selectedChannelId, salesRepId, businessManagerId,
      newOrderItems, tempCategory,
      invoiceForm, paymentMethod, paymentTerms,
      deliveryMethod, receivingParty, receivingCompany, receivingMethod, shippingAddress,
      acceptanceForm, acceptanceType, phaseDrafts,
      purchasingContactId: selectedPurchasingContactId,
      itContactId: selectedItContactId,
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
    setSelectedChannelId(d.selectedChannelId);
    setSalesRepId(d.salesRepId);
    setBusinessManagerId(d.businessManagerId);
    setNewOrderItems(d.newOrderItems);
    setTempCategory(d.tempCategory);
    setInvoiceForm(d.invoiceForm);
    setPaymentMethod(d.paymentMethod);
    setPaymentTerms(d.paymentTerms);
    setDeliveryMethod(d.deliveryMethod);
    setReceivingParty(d.receivingParty);
    setReceivingCompany(d.receivingCompany);
    setReceivingMethod(d.receivingMethod);
    setShippingAddress(d.shippingAddress);
    setAcceptanceForm(d.acceptanceForm);
    setAcceptanceType(d.acceptanceType);
    setPhaseDrafts(d.phaseDrafts);
    setCurrentDraftId(d.id);
    setSelectedPurchasingContactId(d.purchasingContactId || '');
    setSelectedItContactId(d.itContactId || '');
    // 恢复可选联系人列表
    const cust = customers.find(c => c.id === d.newOrderCustomer);
    if (cust) {
      setPurchasingContacts(cust.contacts.filter(c => c.roles.includes('Purchasing')));
      setItContacts(cust.contacts.filter(c => c.roles.includes('IT')));
    }
    // Allow cascading effects to see the flag during the same commit,
    // then clear it after React has flushed all synchronous effects.
    requestAnimationFrame(() => { isRestoringDraftRef.current = false; });
  }, [initialDraft]);

  const handleCreateOrder = () => {
    const selfDealMissingEnterprise = buyerType === 'SelfDeal' && !orderEnterpriseId;
    const otherMissingCustomer = buyerType !== 'SelfDeal' && !newOrderCustomer;
    const channelMissingChannel = buyerType === 'Channel' && !selectedChannelId;
    if (selfDealMissingEnterprise || otherMissingCustomer || channelMissingChannel || newOrderItems.length === 0 || !buyerType) {
        alert(channelMissingChannel ? '渠道订单请选择关联渠道。' : selfDealMissingEnterprise ? '请选择企业 ID。' : '请完善订单信息：客户、产品或订单类型未填写。');
        return;
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
    if (acceptanceType === 'OneTime') {
        phases = [{ id: `ph-${Date.now()}`, name: '整体验收', percentage: 100, amount: totalAmount, status: 'Pending' }];
    } else {
        const totalPct = phaseDrafts.reduce((sum, p) => sum + Number(p.percentage), 0);
        if (Math.abs(totalPct - 100) > 0.1) { alert(`验收阶段总比必须为 100% (当前: ${totalPct}%)`); return; }
        phases = phaseDrafts.map((p, idx) => ({ id: `ph-${Date.now()}-${idx}`, name: p.name || `阶段 ${idx + 1}`, percentage: Number(p.percentage), amount: (totalAmount * Number(p.percentage)) / 100, status: 'Pending' }));
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
        total: totalAmount, items: newOrderItems, shippingAddress: shippingAddress || (customer ? customer.address : ''),
        isPaid: false, 
        isPackageConfirmed: deliveryMethod === 'Online', 
        isCDBurned: deliveryMethod === 'Online', 
        approval: { salesApproved: false, businessApproved: false, financeApproved: false },
        approvalRecords: [], salesRepId: salesRepId, salesRepName: salesUser?.name, 
        businessManagerId: businessManagerId, businessManagerName: businessUser?.name,
        creatorId: creatorUser.id, creatorName: creatorUser.name.replace(/\s*\(.*?\)/g, ''), creatorPhone: creatorUser.phone,
        buyerType,
        buyerId: buyerType === 'Channel' ? selectedChannelId : (buyerType === 'Customer' ? newOrderCustomer : undefined),
        buyerName: buyerType === 'Channel' ? channels.find(c => c.id === selectedChannelId)?.name : customer?.companyName,
        invoiceInfo: invoiceForm, 
        paymentMethod: paymentMethod,
        paymentTerms: paymentTerms,
        acceptanceInfo: acceptanceForm,
        acceptanceConfig: { type: acceptanceType, status: 'Pending', phases, setupDate: new Date().toISOString() },
        opportunityId: linkedOpp?.id, opportunityName: linkedOpp?.name,
        orderRemark: orderRemark || undefined,
        purchasingContactId: selectedPurchasingContactId || undefined,
        itContactId: selectedItContactId || undefined,
        linkedContractIds: linkedContractIds.length > 0 ? linkedContractIds : undefined,
        linkedContractNames: linkedContractIds.length > 0 ? linkedContractIds.map(id => contracts.find(c => c.id === id)?.name || id) : undefined,
        settlementType,
        installmentPlans: settlementType === 'installment' && installmentPlans.length > 0 ? installmentPlans : undefined,
    };
    if (currentDraftId) {
        // Replace the draft order entry with the final order
        setOrders(prev => prev.map(o => o.id === currentDraftId ? newOrder : o));
        setOrderDrafts(prev => prev.filter(d => d.id !== currentDraftId));
    } else {
        setOrders([newOrder, ...orders]);
    }
    onClose(); resetCreateForm(); navigate(`/orders/${newOrder.id}`);
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
                        {orderSource === 'Renewal' && (
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

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                {/* Step 1: Order Type & Source */}
                {currentStep === 1 && (
                    <div className="space-y-10 animate-fade-in">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-purple-500"/> 订单类型</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'Customer', title: '直签订单', icon: Target, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                                    { id: 'Channel', title: '渠道订单', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                                    { id: 'SelfDeal', title: '自成交订单', icon: MousePointer2, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                                    { id: 'RedeemCode', title: '兑换码订单', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setBuyerType(type.id as BuyerType)}
                                        className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                                            buyerType === type.id
                                            ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-2 ring-blue-500/10'
                                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                                            <type.icon className="w-4 h-4"/>
                                        </div>
                                        <span className={`text-sm font-bold ${buyerType === type.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-600 dark:text-gray-300'}`}>{type.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {buyerType && <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500"/> 订单来源</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'OnlineStore', label: '官网', icon: Globe, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                                    { id: 'ChannelPortal', label: '渠道来源', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                                    { id: 'APISync', label: '第三方系统', icon: Radio, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
                                    { id: 'Sales', label: '后台下单', icon: UserIcon, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' }
                                ].filter(src => {
                                    if (buyerType === 'Customer') return src.id === 'Sales';
                                    if (buyerType === 'Channel') return src.id === 'ChannelPortal' || src.id === 'Sales';
                                    if (buyerType === 'RedeemCode') return src.id === 'APISync' || src.id === 'Sales';
                                    if (buyerType === 'SelfDeal') return src.id === 'OnlineStore' || src.id === 'APISync' || src.id === 'Sales';
                                    return true;
                                }).map(src => (
                                    <button 
                                        key={src.id}
                                        onClick={() => {
                                            setOrderSource(src.id as OrderSource);
                                            if (src.id === 'OnlineStore') setLinkedContractIds([]);
                                        }}
                                        className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                                            orderSource === src.id 
                                            ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-2 ring-blue-500/10' 
                                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${src.color}`}>
                                            <src.icon className="w-4 h-4"/>
                                        </div>
                                        <span className={`text-sm font-bold ${orderSource === src.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-600 dark:text-gray-300'}`}>{src.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>}

                        {/* 制单人选择 */}
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-blue-500"/> 制单人
                            </h4>
                            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 p-5 flex items-center gap-4 max-w-sm">
                                {(() => {
                                    const sel = users.find(u => u.id === creatorId) || currentUser;
                                    return (
                                        <>
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                                                <img
                                                    src={sel.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${sel.name}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={e => {
                                                        const t = e.currentTarget;
                                                        t.style.display = 'none';
                                                        const p = t.parentElement;
                                                        if (p && !p.querySelector('span')) {
                                                            const s = document.createElement('span');
                                                            s.className = 'w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-400 to-indigo-600';
                                                            s.textContent = sel.name.replace(/\s*\(.*?\)/g, '').charAt(0);
                                                            p.appendChild(s);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{sel.name.replace(/\s*\(.*?\)/g, '')}</div>
                                                {sel.phone && <div className="text-xs text-gray-400 font-mono mt-0.5">{sel.phone}</div>}
                                            </div>
                                            <select
                                                className="text-sm bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#0071E3] transition"
                                                value={creatorId}
                                                onChange={e => setCreatorId(e.target.value)}
                                            >
                                                {users.filter(u => u.status === 'Active').map(u => (
                                                    <option key={u.id} value={u.id}>{u.name.replace(/\s*\(.*?\)/g, '')}</option>
                                                ))}
                                            </select>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* 订单备注 */}
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500"/> 订单备注
                            </h4>
                            <textarea
                                value={orderRemark}
                                onChange={e => setOrderRemark(e.target.value)}
                                placeholder="请输入订单备注（选填）..."
                                rows={3}
                                className="w-full p-4 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/5 rounded-2xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                        </div>

                    </div>
                )}

                {/* Step 2: Basic Info */}
                {currentStep === 2 && (
                    <div className="space-y-5 animate-fade-in">

                        {/* 是否有商机 */}
                        {buyerType !== 'SelfDeal' && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-3">
                                <Briefcase className="w-4 h-4 text-purple-500"/> 是否有商机？
                            </h4>
                            <div className="flex gap-3">
                                {[
                                    { id: 'yes' as const, label: '有商机', desc: '选择已有商机，自动带入客户信息', icon: CheckCircle, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
                                    { id: 'no' as const, label: '无商机', desc: '手动填写客户信息', icon: XCircle, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800/40' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setHasOpportunity(opt.id)}
                                        className={`px-5 py-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                                            hasOpportunity === opt.id
                                            ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-2 ring-blue-500/10'
                                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.color}`}>
                                            <opt.icon className="w-4 h-4"/>
                                        </div>
                                        <div className="text-left">
                                            <span className={`text-sm font-bold block ${hasOpportunity === opt.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-600 dark:text-gray-300'}`}>{opt.label}</span>
                                            <span className="text-[11px] text-gray-400 leading-tight">{opt.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* 有商机：选择商机 */}
                            {hasOpportunity === 'yes' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">选择商机 <span className="text-red-500">*</span></label>
                                    {linkedOpportunityId ? (() => {
                                        const linkedOppObj = opportunities.find(o => o.id === linkedOpportunityId);
                                        return (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl space-y-2">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{linkedOppObj?.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{selectedCustomerObj?.companyName} · 已自动带入客户信息</div>
                                                </div>
                                                <button
                                                    onClick={() => { setLinkedOpportunityId(''); setNewOrderCustomer(''); setOrderEnterpriseId(''); }}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                            {linkedOppObj?.products && linkedOppObj.products.length > 0 && (
                                                <div className="ml-7 flex flex-wrap gap-1.5">
                                                    {linkedOppObj.products.map((p, pi) => (
                                                        <span key={pi} className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 dark:bg-black/20 border border-green-200/60 dark:border-green-700/30 rounded-lg text-xs">
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
                                            className="w-full p-3 bg-gray-50 dark:bg-black border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:border-[#0071E3] dark:hover:border-[#FF2D55] hover:text-[#0071E3] dark:hover:text-[#FF2D55] transition flex items-center justify-center gap-2"
                                        >
                                            <Briefcase className="w-4 h-4"/> 点击选择商机
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        )}

                        {/* 客户与买方信息 */}
                        {(buyerType === 'SelfDeal' || hasOpportunity === 'no' || (hasOpportunity === 'yes' && linkedOpportunityId)) && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
                                <UserIcon className="w-5 h-5 text-indigo-500"/> 客户与买方信息
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {buyerType === 'SelfDeal' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">企业 ID <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition"
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
                                </>
                                ) : hasOpportunity === 'yes' ? (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">客户 (商机带入)</label>
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-blue-500 shrink-0" />
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomerObj?.companyName || '未关联客户'}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">来自商机: {opportunities.find(o => o.id === linkedOpportunityId)?.name}</div>
                                        </div>
                                    </div>
                                </div>
                                </>
                                ) : (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                </>
                                )}

                                {buyerType === 'Channel' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择代理商 (买方) <span className="text-red-500">*</span></label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                                            <option value="">-- 选择渠道商 --</option>
                                            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {buyerType !== 'SelfDeal' && (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">销售负责人</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={salesRepId} onChange={e => setSalesRepId(e.target.value)}>
                                        <option value="">-- 分配销售人员 --</option>
                                        {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">商务负责人</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={businessManagerId} onChange={e => setBusinessManagerId(e.target.value)}>
                                        <option value="">-- 分配商务人员 --</option>
                                        {users.filter(u => u.role === 'Business' || u.role === 'Admin').map(u => <option key={u.id} value={u.id}>{u.name.replace(/\s*\(.*?\)/g, '')}</option>)}
                                    </select>
                                </div>
                                </>
                                )}
                            </div>
                        </div>
                        )}

                        {/* 订单联系人选择 */}
                        {newOrderCustomer && (
                        <div className="bg-white dark:bg-[#2C2C2E] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-5">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
                                <Users className="w-5 h-5 text-teal-500"/> 订单联系人
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 采购联系人 */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">采购联系人</label>
                                    {purchasingContacts.length > 0 ? (
                                        <>
                                        <div className="space-y-2">
                                            {purchasingContacts.map(c => {
                                                const isSelected = selectedPurchasingContactId === c.id;
                                                return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setSelectedPurchasingContactId(isSelected ? '' : c.id)}
                                                    className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white"/>}
                                                    </div>
                                                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${c.name}`} className="w-9 h-9 rounded-full bg-white border border-gray-200 dark:border-white/10 shrink-0" alt={c.name} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</span>
                                                            {c.isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold shrink-0">主要</span>}
                                                        </div>
                                                        {c.position && <div className="text-xs text-gray-400 truncate">{c.position}</div>}
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {c.phone && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/>{c.phone}</span>}
                                                            {c.email && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3"/>{c.email}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        </>
                                    ) : (
                                        <div className="p-3.5 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-400 text-center">该客户暂无采购联系人</div>
                                    )}
                                </div>

                                {/* IT 联系人 */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">IT 联系人</label>
                                    {itContacts.length > 0 ? (
                                        <>
                                        <div className="space-y-2">
                                            {itContacts.map(c => {
                                                const isSelected = selectedItContactId === c.id;
                                                return (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setSelectedItContactId(isSelected ? '' : c.id)}
                                                    className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-500 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white"/>}
                                                    </div>
                                                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${c.name}`} className="w-9 h-9 rounded-full bg-white border border-gray-200 dark:border-white/10 shrink-0" alt={c.name} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</span>
                                                            {c.isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500 text-white font-bold shrink-0">主要</span>}
                                                        </div>
                                                        {c.position && <div className="text-xs text-gray-400 truncate">{c.position}</div>}
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {c.phone && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/>{c.phone}</span>}
                                                            {c.email && <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3"/>{c.email}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        </>
                                    ) : (
                                        <div className="p-3.5 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-400 text-center">该客户暂无 IT 联系人</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 关联合同 - 官网订单不需要选择合同 */}
                        {orderSource !== 'OnlineStore' && <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ScrollText className="w-5 h-5 text-blue-500"/> 关联合同
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
                    <div className="space-y-8 animate-fade-in">
                        {orderSource === 'Renewal' && originalOrderId && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                                <RefreshCcw className="w-5 h-5"/>
                                <span>续费模式：正在基于订单 <strong>{originalOrderId}</strong> 的明细进行续费。您可以继续添加或移除产品。</span>
                            </div>
                        )}
                        
                        <div className="bg-white dark:bg-[#2C2C2E] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4 mb-6">
                                <ShoppingBag className="w-5 h-5 text-blue-500"/> 添加产品
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">1. 一级分类</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                        value={tempTopCategory}
                                        onChange={e => setTempTopCategory(e.target.value)}
                                    >
                                        <option value="">-- 请选择 --</option>
                                        {Array.from(new Set(products.filter(p => p.status === 'OnShelf').map(p => p.category))).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">2. 二级分类</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50"
                                        value={tempCategory}
                                        onChange={e => setTempCategory(e.target.value)}
                                        disabled={!tempTopCategory}
                                    >
                                        <option value="">-- {tempTopCategory ? '请选择' : '请先选一级'} --</option>
                                        {Array.from(new Set(
                                            products.filter(p => p.status === 'OnShelf' && p.category === tempTopCategory && p.subCategory).map(p => p.subCategory!)
                                        )).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">3. 选择产品</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50" 
                                        value={tempProductId} 
                                        onChange={e => setTempProductId(e.target.value)}
                                        disabled={!tempCategory}
                                    >
                                        <option value="">-- {tempCategory ? '请选择' : '请先选二级'} --</option>
                                        {products.filter(p => p.status === 'OnShelf' && p.subCategory === tempCategory).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">4. 选择规格</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50" 
                                        value={tempSkuId} 
                                        onChange={e => setTempSkuId(e.target.value)}
                                        disabled={!tempProductId}
                                    >
                                        <option value="">-- {tempProductId ? '请选择规格' : '请先选择产品'} --</option>
                                        {selectedProduct?.skus.filter(s => s.status === 'Active').map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedSku?.pricingOptions && selectedSku.pricingOptions.length > 0 && (
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">5. 选择授权类型</label>
                                        <select 
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" 
                                            value={tempPricingOptionId} 
                                            onChange={e => setTempPricingOptionId(e.target.value)}
                                        >
                                            <option value="">-- 请选择授权 --</option>
                                            {selectedSku.pricingOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.title} - ¥{opt.price.toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedLicenseType && (
                                            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                授权类型：<span className="font-bold text-purple-600 dark:text-purple-400">{selectedLicenseType}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">数量</label>
                                    <input type="number" className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" min="1" value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} />
                                </div>

                                {showLicensePeriod && (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">授权/服务期限</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-teal-200 dark:border-teal-900/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 transition text-sm font-medium text-teal-700 dark:text-teal-400"
                                        value={tempLicensePeriod}
                                        onChange={e => setTempLicensePeriod(e.target.value)}
                                    >
                                        <option value="">-- 请选择 --</option>
                                        <option value="1年">1年</option>
                                        <option value="2年">2年</option>
                                        <option value="3年">3年</option>
                                        <option value="5年">5年</option>
                                    </select>
                                </div>
                                )}
                                
                                {(buyerType === 'Customer' || buyerType === 'Channel') && newOrderCustomer && selectedCustomerObj?.enterprises && selectedCustomerObj.enterprises.length > 0 && (
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1">
                                            <Briefcase className="w-3 h-3"/> 关联企业 ID
                                        </label>
                                        <select
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-indigo-200 dark:border-indigo-900/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition text-sm text-indigo-700 dark:text-indigo-400"
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

                                <div className={`${showLicensePeriod ? 'md:col-span-2' : 'md:col-span-3'} space-y-2`}>
                                    <label className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 最终单价 (可议价)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-orange-200 dark:border-orange-900/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-200 transition text-sm font-bold text-orange-600" 
                                        value={negotiatedPrice !== null ? negotiatedPrice : ''} 
                                        onChange={e => setNegotiatedPrice(Number(e.target.value))} 
                                        placeholder={`基准: ¥${selectedOption?.price || selectedSku?.price || 0}`} 
                                    />
                                </div>

                                <div className={showLicensePeriod ? 'md:col-span-2' : 'md:col-span-3'}>
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!tempProductId || !tempSkuId || (selectedSku?.pricingOptions?.length > 0 && !tempPricingOptionId)}
                                        className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-apple"
                                    >
                                        <Plus className="w-4 h-4"/> 加入清单
                                    </button>
                                </div>
                            </div>

                            {/* 安装包选择 */}
                            {(() => {
                                if (!selectedProduct) return null;
                                const pkgs = selectedProduct.installPackages || [];

                                const universalPkgs = pkgs.filter(p => p.cpu === '通用');
                                const customPkgs = pkgs.filter(p => p.cpu !== '通用');

                                const universalOsOptions = Array.from(new Set(universalPkgs.map(p => p.os).filter(Boolean)));
                                const customCpuOptions = Array.from(new Set(customPkgs.map(p => p.cpu).filter(Boolean)));
                                const customOsOptions = Array.from(new Set(
                                    customPkgs.filter(p => !tempPkgCpu || p.cpu === tempPkgCpu).map(p => p.os).filter(Boolean)
                                ));

                                let previewPkg = null;
                                if (tempPkgType === '通用' && tempPkgOs) {
                                    previewPkg = universalPkgs.find(p => p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '定制' && tempPkgCpu && tempPkgOs) {
                                    previewPkg = customPkgs.find(p => p.cpu === tempPkgCpu && p.os === tempPkgOs) || null;
                                } else if (tempPkgType === '通用' && universalOsOptions.length === 1) {
                                    previewPkg = universalPkgs[0] || null;
                                }

                                return (
                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Box className="w-4 h-4 text-indigo-500"/>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">安装包配置</span>
                                        </div>

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

                                        {/* 通用：选择操作系统（仅在有通用安装包数据时显示） */}
                                        {tempPkgType === '通用' && universalOsOptions.length > 1 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">操作系统</label>
                                                    <select
                                                        className="w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
                                                        value={tempPkgOs}
                                                        onChange={e => setTempPkgOs(e.target.value)}
                                                    >
                                                        <option value="">-- 请选择系统 --</option>
                                                        {universalOsOptions.map(os => <option key={os} value={os}>{os}</option>)}
                                                    </select>
                                                </div>
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
                                                                className="w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm"
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
                                                                className="w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50"
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
                                                            className="flex-1 p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm text-gray-800 dark:text-white placeholder:text-gray-400"
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
                                                    <div className="text-sm font-bold text-indigo-800 dark:text-indigo-300">{previewPkg.name} <span className="font-mono font-normal text-xs">{previewPkg.version}</span></div>
                                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                        {[previewPkg.platform, previewPkg.cpu, previewPkg.os].filter(Boolean).join(' · ')}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-indigo-400 shrink-0">{previewPkg.id}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {newOrderItems.length > 0 && (
                            <div className="bg-white dark:bg-[#2C2C2E] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-apple">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="unified-table-header">
                                        <tr><th className="p-5 pl-6">产品/规格</th><th className="p-5">授权类型</th><th className="p-5 text-center">数量</th><th className="p-5 text-center">授权/服务期限</th><th className="p-5">安装包</th>{(buyerType === 'Customer' || buyerType === 'Channel') && <th className="p-5">关联企业</th>}<th className="p-5 text-right">单价</th><th className="p-5 text-right">小计</th><th className="p-5 text-center">操作</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-5 pl-6"><div className="font-bold text-gray-900 dark:text-white">{item.productName}</div><div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div></td>
                                                <td className="p-5"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 font-medium">{item.pricingOptionName || '默认'}</span></td>
                                                <td className="p-5 text-center dark:text-white font-medium">{item.quantity}</td>
                                                <td className="p-5 text-center">{item.licensePeriod && item.licensePeriod !== '永久' ? <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                                <td className="p-5 max-w-[180px]">
                                                    <div className="space-y-1">
                                                        {item.installPackageType && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.installPackageType === '通用' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>{item.installPackageType}</span>
                                                        )}
                                                        {item.installPackageName && <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg font-medium">{item.installPackageName}</div>}
                                                        {item.installPackageLink && <a href={item.installPackageLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block" title={item.installPackageLink}>🔗 定制安装包链接</a>}
                                                        {!item.installPackageType && !item.installPackageName && <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>}
                                                    </div>
                                                </td>
                                                {(buyerType === 'Customer' || buyerType === 'Channel') && (
                                                    <td className="p-5 max-w-[140px]">
                                                        {item.enterpriseName ? (
                                                            <div>
                                                                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{item.enterpriseName}</div>
                                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.enterpriseId}</div>
                                                            </div>
                                                        ) : <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>}
                                                    </td>
                                                )}
                                                <td className="p-5 text-right dark:text-white">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                <td className="p-5 text-right font-bold text-red-600 dark:text-red-400">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                <td className="p-5 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 className="w-4 h-4"/></button></td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50/50 dark:bg-white/5">
                                            <td colSpan={(buyerType === 'Customer' || buyerType === 'Channel') ? 7 : 6} className="p-5 text-right font-bold text-gray-500">总计金额:</td>
                                            <td className="p-5 text-right text-xl font-bold text-red-600 dark:text-red-400">¥{calculateNewOrderTotal().toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Commerce & Delivery */}
                {currentStep === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500"/> 支付方式</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'Online', label: '在线支付', icon: Wallet, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' },
                                        { id: 'Transfer', label: '银行转账', icon: Settings, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' },
                                        { id: 'COD', label: '货到付款', icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' },
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                                paymentMethod === method.id 
                                                ? method.color 
                                                : 'border-gray-100 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200'
                                            }`}
                                        >
                                            <method.icon className="w-6 h-6"/>
                                            <span className="text-xs font-bold">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {paymentMethod === 'Online' && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-900/30 leading-relaxed">
                                        订单提交后系统将生成聚合支付二维码，支持微信/支付宝。
                                    </div>
                                )}
                                {paymentMethod === 'Transfer' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase block">付款方户名 (用于对账)</label>
                                        <input 
                                            value={paymentTerms} 
                                            onChange={e => setPaymentTerms(e.target.value)}
                                            placeholder="请输入汇款账户名称..." 
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 结算方式 */}
                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-5">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-500"/> 结算方式</h4>
                                <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                    <button onClick={() => { setSettlementType('once'); setInstallmentPlans([]); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'once' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}>一次性结算</button>
                                    <button onClick={() => { setSettlementType('installment'); if (installmentPlans.length === 0) { const total = calculateNewOrderTotal(); setInstallmentPlans([{ amount: total, expectedDate: '', actualDate: '', paidAmount: 0 }]); } }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'installment' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}>分期结算</button>
                                </div>
                                {settlementType === 'once' && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 leading-relaxed">
                                        订单全部款项将在一次结算中完成支付。
                                    </div>
                                )}
                                {settlementType === 'installment' && (
                                    <div className="space-y-3">
                                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">分期计划</th>
                                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">分期金额</th>
                                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">预计付款时间</th>
                                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">实际付款时间</th>
                                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">付款金额</th>
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
                                                            <td className="px-4 py-2.5 text-xs text-gray-400">-</td>
                                                            <td className="px-4 py-2.5 text-xs text-gray-400">-</td>
                                                            <td className="px-4 py-2.5">
                                                                {installmentPlans.length > 1 && (
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
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Truck className="w-5 h-5 text-green-500"/> 发货方式</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'Online', label: '线上发货', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' },
                                        { id: 'Offline', label: '线下发货', icon: Box, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' },
                                        { id: 'Hybrid', label: '混合发货', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' },
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setDeliveryMethod(method.id as DeliveryMethod)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                                                deliveryMethod === method.id 
                                                ? method.color 
                                                : 'border-gray-100 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200'
                                            }`}
                                        >
                                            <method.icon className="w-6 h-6"/>
                                            <span className="text-xs font-bold">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 dark:bg-white/10 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                    {deliveryMethod === 'Online' && '仅生成电子授权，无需实物物流。'}
                                    {deliveryMethod === 'Offline' && '需准备光盘/U盘介质，并通过快递发货。'}
                                    {deliveryMethod === 'Hybrid' && '同时包含电子授权与实物介质交付。'}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500"/> 收货信息</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">收货方</label>
                                            <select 
                                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingParty}
                                                onChange={e => setReceivingParty(e.target.value)}
                                            >
                                                <option value="买方">买方</option>
                                                <option value="代理商">代理商</option>
                                                <option value="最终用户">最终用户</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">收货方式</label>
                                            <select 
                                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingMethod}
                                                onChange={e => setReceivingMethod(e.target.value)}
                                            >
                                                <option value="邮寄">邮寄</option>
                                                <option value="自提">自提</option>
                                                <option value="送货上门">送货上门</option>
                                                <option value="电子交付">电子交付</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">收货单位名称</label>
                                        <input 
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20" 
                                            value={receivingCompany} 
                                            onChange={e => setReceivingCompany(e.target.value)}
                                            placeholder="请输入收货单位全称..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">收货地址</label>
                                        <textarea 
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 h-20 resize-none" 
                                            value={shippingAddress} 
                                            onChange={e => setShippingAddress(e.target.value)}
                                            placeholder="请输入详细收货地址及联系人信息..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-green-500"/> 验收计划</h4>
                                <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                    <button onClick={()=>setAcceptanceType('OneTime')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${acceptanceType === 'OneTime' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}>整体验收</button>
                                    <button onClick={()=>setAcceptanceType('Phased')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${acceptanceType === 'Phased' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}>分期验收</button>
                                </div>
                                {acceptanceType === 'Phased' && (
                                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                        {phaseDrafts.map((p, idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <input className="flex-1 p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="阶段名称" value={p.name} onChange={e=> {
                                                    const next = [...phaseDrafts]; next[idx].name = e.target.value; setPhaseDrafts(next);
                                                }} />
                                                <div className="w-24 relative">
                                                    <input type="number" className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 pr-6" value={p.percentage} onChange={e=> {
                                                        const next = [...phaseDrafts]; next[idx].percentage = Number(e.target.value); setPhaseDrafts(next);
                                                    }} />
                                                    <Percent className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                </div>
                                                <button onClick={() => setPhaseDrafts(phaseDrafts.filter((_,i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1"><X className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        <button onClick={()=>setPhaseDrafts([...phaseDrafts, { name: '', percentage: 0 }])} className="w-full py-2.5 border border-dashed border-gray-300 dark:border-white/20 rounded-lg text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-white/5 transition">+ 添加验收节点</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="unified-card p-6 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
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
                                    : !hasOpportunity || (hasOpportunity === 'yes' ? (!linkedOpportunityId || !newOrderCustomer) : !newOrderCustomer)
                                )) ||
                                (currentStep === 3 && newOrderItems.length === 0)
                            }
                            onClick={() => setCurrentStep(currentStep + 1)} 
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
                            onChange={e => setContractPickerSearch(e.target.value)}
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
                                    const statusColor: Record<string, string> = {
                                        PENDING_BUSINESS: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
                                        PENDING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
                                        VERIFIED: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
                                        APPROVED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                                        REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                                    };
                                    return filtered.map(c => {
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
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor[c.verifyStatus] || 'bg-gray-100 text-gray-500'}`}>
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
                    {/* 底部确认栏 */}
                    <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between shrink-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {linkedContractIds.length === 0 ? '点击行选择合同' : `已选 ${linkedContractIds.length} 个合同`}
                        </span>
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
    </>
  );
};

export default OrderCreateWizard;
