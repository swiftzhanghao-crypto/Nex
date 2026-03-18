
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, ActivationMethod, AcceptanceType, AcceptancePhase, OrderSource, BuyerType, InvoiceInfo, AcceptanceInfo, PaymentMethod, DeliveryMethod } from '../../types';
import { User as UserIcon, Plus, Trash2, CheckCircle, FileText, CreditCard, Truck, ShoppingBag, X, Target, MousePointer2, ClipboardCheck, ArrowUpRight, Percent, Layers, Network, Globe, Radio, RefreshCcw, Wallet, Zap, Box, Settings, MapPin } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

interface OrderCreateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  renewalOrder?: Order;
}

const OrderCreateWizard: React.FC<OrderCreateWizardProps> = ({ isOpen, onClose, renewalOrder }) => {
  const { products, customers, channels, opportunities, users, orders, setOrders, currentUser, standaloneEnterprises } = useAppContext();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1); // 1: Type, 2: Info, 3: Products, 4: Delivery

  // Step 1: Order Type & Source
  const [buyerType, setBuyerType] = useState<BuyerType | ''>('');
  const [orderSource, setOrderSource] = useState<OrderSource>('Sales');

  // Step 2: Customer & Buyer & Opportunity
  const [linkedOpportunityId, setLinkedOpportunityId] = useState('');
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [businessManagerId, setBusinessManagerId] = useState('');
  const [salesRepId, setSalesRepId] = useState('');
  const [creatorId, setCreatorId] = useState(currentUser.id);
  const [orderEnterpriseId, setOrderEnterpriseId] = useState('');
  
  // Step 3: Merchandise Selection (New Cascading Logic)
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [tempProductId, setTempProductId] = useState('');
  const [tempSkuId, setTempSkuId] = useState('');
  const [tempPricingOptionId, setTempPricingOptionId] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('LicenseKey');
  const [tempLicensePeriod, setTempLicensePeriod] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  // Computed data for selection cascade
  const selectedProduct = products.find(p => p.id === tempProductId);
  const selectedSku = selectedProduct?.skus.find(s => s.id === tempSkuId);
  const selectedOption = selectedSku?.pricingOptions?.find(o => o.id === tempPricingOptionId);
  const selectedLicenseType = (() => {
    if (!selectedOption) return undefined;
    const { type, scope } = selectedOption.license;
    if (type === 'FlatRate') return '服务器授权';
    if (type === 'Perpetual') return scope === 'Platform' ? '服务器授权' : '数量授权';
    if (type === 'Subscription') return scope === '1 User' ? '用户订阅许可' : '年授权';
    return '数量授权';
  })();
  const showLicensePeriod = selectedLicenseType === '用户订阅许可' || selectedLicenseType === '年授权';

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

  const wizardSteps = [
      { id: 1, label: '订单类型', desc: '来源与模式', icon: Layers },
      { id: 2, label: '客户信息', desc: '客户/商机', icon: UserIcon },
      { id: 3, label: '产品配置', desc: '规格/价格', icon: ShoppingBag },
      { id: 4, label: '商务交付', desc: '合同/验收', icon: ClipboardCheck },
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

  // Reset downstream selections when upstream changes
  useEffect(() => { setTempSkuId(''); setTempPricingOptionId(''); setNegotiatedPrice(null); }, [tempProductId]);
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
      setNewOrderCustomer('');
      setOrderEnterpriseId('');
      setLinkedOpportunityId('');
      setBuyerType(''); 
      setOrderSource('Sales');
      setOriginalOrderId(undefined);
      setSelectedChannelId('');
      setSalesRepId(currentUser.role === 'Sales' ? currentUser.id : '');
      setBusinessManagerId('');
      setCreatorId(currentUser.id);
      setNewOrderItems([]);
      setTempProductId('');
      setTempSkuId('');
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
  };

  const handleOpportunityChange = (oppId: string) => {
      setLinkedOpportunityId(oppId);
      const opp = opportunities.find(o => o.id === oppId);
      if (opp && opp.customerId) handleCustomerChange(opp.customerId);
  };

  const handleCustomerChange = (customerId: string) => {
      setNewOrderCustomer(customerId);
      setOrderEnterpriseId(''); // Reset enterprise selection
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          if (customer.ownerId) setSalesRepId(customer.ownerId);
          // Auto-fill Invoice
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
      }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSku || tempQuantity <= 0) return;
    
    if (selectedSku.pricingOptions && selectedSku.pricingOptions.length > 0 && !selectedOption) {
        alert("请选择授权类型 (Pricing Option)");
        return;
    }

    const capabilitiesSnapshot = selectedProduct.composition?.map(c => c.name) || [];
    
    let enterpriseName = undefined;
    if (orderEnterpriseId && selectedCustomerObj?.enterprises) {
        const ent = selectedCustomerObj.enterprises.find(e => e.id === orderEnterpriseId);
        if (ent) enterpriseName = ent.name;
    }

    const finalPrice = negotiatedPrice !== null ? negotiatedPrice : (selectedOption ? selectedOption.price : selectedSku.price);

    const derivedLicenseType = (() => {
        if (!selectedOption) return undefined;
        const { type, scope } = selectedOption.license;
        if (type === 'FlatRate') return '服务器授权';
        if (type === 'Perpetual') return scope === 'Platform' ? '服务器授权' : '数量授权';
        if (type === 'Subscription') return scope === '1 User' ? '用户订阅许可' : '年授权';
        return '数量授权';
    })();
    const needsManualPeriod = derivedLicenseType === '用户订阅许可' || derivedLicenseType === '年授权';
    const isPermanent = derivedLicenseType === '数量授权' || derivedLicenseType === '服务器授权';

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
        enterpriseId: orderEnterpriseId || undefined,
        enterpriseName: enterpriseName,
        capabilitiesSnapshot
    };

    setNewOrderItems([...newOrderItems, newItem]);
    setTempQuantity(1); 
    setTempLicensePeriod('');
    setNegotiatedPrice(null);
    setTempSkuId('');
    setTempPricingOptionId('');
  };

  const handleRemoveItem = (index: number) => setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  const calculateNewOrderTotal = () => newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

  const handleCreateOrder = () => {
    const selfDealMissingEnterprise = buyerType === 'SelfDeal' && !orderEnterpriseId;
    const otherMissingCustomer = buyerType !== 'SelfDeal' && !newOrderCustomer;
    if (selfDealMissingEnterprise || otherMissingCustomer || newOrderItems.length === 0 || !buyerType) {
        alert(selfDealMissingEnterprise ? '请选择企业 ID。' : '请完善订单信息：客户、产品或订单类型未填写。');
        return;
    }
    const customer = customers.find(c => c.id === newOrderCustomer);
    const salesUser = users.find(u => u.id === salesRepId);
    const businessUser = users.find(u => u.id === businessManagerId);
    const creatorUser = users.find(u => u.id === creatorId) || currentUser;
    const linkedOpp = opportunities.find(o => o.id === linkedOpportunityId);

    const maxId = orders.reduce((max, o) => {
        const numStr = o.id.substring(1); 
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `S${(maxId + 1).toString().padStart(8, '0')}`;
    
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
        opportunityId: linkedOpp?.id, opportunityName: linkedOpp?.name
    };
    setOrders([newOrder, ...orders]); onClose(); resetCreateForm(); navigate(`/orders/${newOrder.id}`);
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
      {/* --- Full Create Order Wizard Modal --- */}
        <ModalPortal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] p-0 md:p-6 animate-fade-in overflow-hidden">
          <div className="unified-card dark:bg-[#1C1C1E] md: shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl flex flex-col border-white/10 animate-modal-enter relative">
            
            {/* Wizard Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        创建销售订单
                        {orderSource === 'Renewal' && (
                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1">
                                <RefreshCcw className="w-3.5 h-3.5"/> 续费模式
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">请按步骤完善订单信息，带 * 号为必填项。</p>
                </div>
                <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
                    <X className="w-6 h-6"/>
                </button>
            </div>

            {/* Stepper Header */}
            <div className="px-8 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 overflow-x-auto no-scrollbar">
                <div className="flex justify-between items-center relative min-w-[600px]">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-white/10 -translate-y-1/2 -z-0 rounded-full">
                        <div 
                            className="h-full bg-[#0071E3] dark:bg-[#FF2D55] transition-all duration-500 ease-out" 
                            style={{ width: `${((currentStep - 1) / (wizardSteps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                    {wizardSteps.map((s) => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-default">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                                currentStep === s.id 
                                ? 'bg-[#0071E3] dark:bg-[#FF2D55] border-white dark:border-[#1C1C1E] text-white shadow-lg scale-110' 
                                : currentStep > s.id 
                                    ? 'bg-[#0071E3] dark:bg-[#FF2D55] border-white dark:border-[#1C1C1E] text-white' 
                                    : 'bg-white dark:bg-[#2C2C2E] border-gray-200 dark:border-gray-600 text-gray-400'
                            }`}>
                                {currentStep > s.id ? <CheckCircle className="w-5 h-5"/> : <s.icon className="w-5 h-5"/>}
                            </div>
                            <div className="text-center">
                                <div className={`text-xs font-bold transition-colors ${currentStep >= s.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</div>
                                <div className="text-[10px] text-gray-400 hidden md:block mt-0.5">{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                {/* Step 1: Order Type & Source */}
                {currentStep === 1 && (
                    <div className="space-y-10 animate-fade-in max-w-4xl mx-auto">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500"/> 订单来源</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'OnlineStore', label: '官网下单', icon: Globe, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
                                    { id: 'ChannelPortal', label: '渠道下单', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                                    { id: 'APISync', label: '第三方系统', icon: Radio, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
                                    { id: 'Sales', label: '后台下单', icon: UserIcon, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' }
                                ].map(src => (
                                    <button 
                                        key={src.id}
                                        onClick={() => setOrderSource(src.id as OrderSource)}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 ${
                                            orderSource === src.id 
                                            ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-4 ring-blue-500/10' 
                                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${src.color}`}>
                                            <src.icon className="w-6 h-6"/>
                                        </div>
                                        <span className={`text-sm font-bold ${orderSource === src.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-600 dark:text-gray-300'}`}>{src.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-purple-500"/> 订单类型</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'Customer', title: '客户直签', icon: Target, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                                    { id: 'Channel', title: '渠道代理', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
                                    { id: 'SelfDeal', title: '自主成交', icon: MousePointer2, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setBuyerType(type.id as BuyerType)}
                                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 ${
                                            buyerType === type.id
                                            ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-4 ring-blue-500/10'
                                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type.color}`}>
                                            <type.icon className="w-6 h-6"/>
                                        </div>
                                        <span className={`text-sm font-bold ${buyerType === type.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-600 dark:text-gray-300'}`}>{type.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

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
                    </div>
                )}

                {/* Step 2: Basic Info */}
                {currentStep === 2 && (
                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-[#2C2C2E] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-4">
                                <UserIcon className="w-5 h-5 text-indigo-500"/> 客户与商机信息
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
                                ) : (
                                <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">选择客户 <span className="text-red-500">*</span></label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                                        <option value="">-- 请选择客户 --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">关联企业 (租户)</label>
                                    <select 
                                        className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition disabled:opacity-50" 
                                        value={orderEnterpriseId} 
                                        onChange={e => setOrderEnterpriseId(e.target.value)}
                                        disabled={!newOrderCustomer}
                                    >
                                        <option value="">-- {newOrderCustomer ? '选择关联企业' : '请先选择客户'} --</option>
                                        {selectedCustomerObj?.enterprises?.map(ent => (
                                            <option key={ent.id} value={ent.id}>{ent.name} (ID: {ent.id})</option>
                                        ))}
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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">关联商机</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition" value={linkedOpportunityId} onChange={e => handleOpportunityChange(e.target.value)}>
                                        <option value="">-- 无商机或选择已有 --</option>
                                        {opportunities.filter(o => o.customerId === newOrderCustomer || !newOrderCustomer).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Merchandise Selection */}
                {currentStep === 3 && (
                    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
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
                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">1. 选择产品</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" 
                                        value={tempProductId} 
                                        onChange={e => setTempProductId(e.target.value)}
                                    >
                                        <option value="">-- 请选择产品 --</option>
                                        {products.filter(p => p.status === 'OnShelf').map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-4 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">2. 选择规格</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm disabled:opacity-50" 
                                        value={tempSkuId} 
                                        onChange={e => setTempSkuId(e.target.value)}
                                        disabled={!tempProductId}
                                    >
                                        <option value="">-- 请选择规格 --</option>
                                        {selectedProduct?.skus.filter(s => s.status === 'Active').map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedSku?.pricingOptions && selectedSku.pricingOptions.length > 0 && (
                                    <div className="md:col-span-4 space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">3. 选择授权类型</label>
                                        <select 
                                            className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] transition text-sm" 
                                            value={tempPricingOptionId} 
                                            onChange={e => setTempPricingOptionId(e.target.value)}
                                        >
                                            <option value="">-- 请选择授权 --</option>
                                            {selectedSku.pricingOptions.map(opt => {
                                                const { type, scope } = opt.license;
                                                const label = type === 'FlatRate' ? '服务器授权' : type === 'Perpetual' ? (scope === 'Platform' ? '服务器授权' : '数量授权') : type === 'Subscription' ? (scope === '1 User' ? '用户订阅许可' : '年授权') : '数量授权';
                                                return (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.title} - ¥{opt.price.toLocaleString()} ({label})
                                                </option>
                                                );
                                            })}
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
                                    <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">授权期限</label>
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
                        </div>

                        {newOrderItems.length > 0 && (
                            <div className="bg-white dark:bg-[#2C2C2E] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-apple">
                                <table className="w-full text-left text-sm min-w-[600px]">
                                    <thead className="unified-table-header">
                                        <tr><th className="p-5 pl-6">产品/规格</th><th className="p-5">授权类型</th><th className="p-5 text-center">数量</th><th className="p-5 text-center">授权期限</th><th className="p-5 text-right">单价</th><th className="p-5 text-right">小计</th><th className="p-5 text-center">操作</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-5 pl-6"><div className="font-bold text-gray-900 dark:text-white">{item.productName}</div><div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div></td>
                                                <td className="p-5"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300 font-medium">{item.pricingOptionName || '默认'}</span></td>
                                                <td className="p-5 text-center dark:text-white font-medium">{item.quantity}</td>
                                                <td className="p-5 text-center">{item.licensePeriod && item.licensePeriod !== '永久' ? <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                                <td className="p-5 text-right dark:text-white">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                <td className="p-5 text-right font-bold text-red-600 dark:text-red-400">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                <td className="p-5 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 className="w-4 h-4"/></button></td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50/50 dark:bg-white/5">
                                            <td colSpan={5} className="p-5 text-right font-bold text-gray-500">总计金额:</td>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in max-w-5xl mx-auto">
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-[#2C2C2E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-apple space-y-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500"/> 开票配置</h4>
                                <div className="space-y-4">
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">发票抬头</label><input className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20" value={invoiceForm.title} onChange={e=>setInvoiceForm({...invoiceForm, title:e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">纳税人识别号</label><input className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white font-mono" value={invoiceForm.taxId} onChange={e=>setInvoiceForm({...invoiceForm, taxId:e.target.value})} /></div>
                                </div>
                            </div>

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
            <div className="unified-card p-6 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-end gap-4 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()} className="px-8 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition text-sm">
                    {currentStep === 1 ? '取消' : '上一步'}
                </button>
                <div className="flex gap-3">
                    {currentStep < 4 ? (
                        <button 
                            disabled={(currentStep === 1 && !buyerType) || (currentStep === 2 && (buyerType === 'SelfDeal' ? !orderEnterpriseId : !newOrderCustomer)) || (currentStep === 3 && newOrderItems.length === 0)}
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
        </div>
        </ModalPortal>
    </>
  );
};

export default OrderCreateWizard;
