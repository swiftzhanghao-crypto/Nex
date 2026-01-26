
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, OrderItem, ActivationMethod, User, Department, ApprovalRecord, Opportunity, AcceptanceType, AcceptancePhase, AcceptanceConfig, OrderSource, SalesMerchandise, BuyerType, InvoiceInfo, AcceptanceInfo, PaymentMethod, PaymentRecord, DeliveryMethod, Channel } from '../types';
import { Search, User as UserIcon, Plus, Trash2, MapPin, Building2, Briefcase, ChevronRight, Download, ArrowLeft, ArrowRight, CheckCircle, FileText, CreditCard, Users, Truck, ShoppingBag, Tag, X, Target, MousePointer2, ClipboardCheck, ArrowUpRight, Percent, Calendar, Layers, Clock, AlertCircle, Network, Globe, Radio, RefreshCcw, Banknote, Wallet, FileCheck, CheckSquare, Package, AlertOctagon, Save, UploadCloud, Filter, Zap, Box } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  currentUser: User;
  users: User[];
  departments: Department[];
  opportunities: Opportunity[];
  channels: Channel[];
  merchandises: SalesMerchandise[];
}

const statusMap: Record<string, string> = {
    [OrderStatus.PENDING_APPROVAL]: '待审批',
    [OrderStatus.PENDING_CONFIRM]: '待确认',
    [OrderStatus.PROCESSING_PROD]: '备货中',
    [OrderStatus.PENDING_PAYMENT]: '待支付',
    [OrderStatus.SHIPPED]: '已发货',
    [OrderStatus.DELIVERED]: '已完成',
    [OrderStatus.CANCELLED]: '已取消',
    [OrderStatus.REFUND_PENDING]: '退款中',
    [OrderStatus.REFUNDED]: '已退款',
};

const buyerTypeMap: Record<string, string> = {
    'Customer': '客户直签',
    'Channel': '渠道代理',
    'SelfDeal': '自主成交'
};

const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, products, customers, currentUser, users, departments, opportunities, channels, merchandises }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filter State
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState<number | ''>('');
  const [filterAmountMax, setFilterAmountMax] = useState<number | ''>('');
  const [filterSource, setFilterSource] = useState<OrderSource | 'All'>('All');

  // Batch Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Create Order Wizard State ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  const [orderEnterpriseId, setOrderEnterpriseId] = useState('');
  
  // Step 3: Merchandise Selection (New Cascading Logic)
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [tempProductId, setTempProductId] = useState('');
  const [tempSkuId, setTempSkuId] = useState('');
  const [tempPricingOptionId, setTempPricingOptionId] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('LicenseKey');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);

  // Computed data for selection cascade
  const selectedProduct = products.find(p => p.id === tempProductId);
  const selectedSku = selectedProduct?.skus.find(s => s.id === tempSkuId);
  const selectedOption = selectedSku?.pricingOptions?.find(o => o.id === tempPricingOptionId);

  // Renewal tracking
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
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Online'); // New State

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
      { id: 3, label: '商品配置', desc: '规格/价格', icon: ShoppingBag },
      { id: 4, label: '商务交付', desc: '合同/验收', icon: ClipboardCheck },
  ];

  // Pipeline Status Definitions - Fixed to include PENDING_PAYMENT
  const pipelineStatuses = [
      { id: OrderStatus.PENDING_APPROVAL, label: '待审批', icon: FileCheck },
      { id: OrderStatus.PENDING_CONFIRM, label: '待确认', icon: CheckSquare },
      { id: OrderStatus.PROCESSING_PROD, label: '备货中', icon: Package },
      { id: OrderStatus.PENDING_PAYMENT, label: '待支付', icon: CreditCard }, // Added PENDING_PAYMENT
      { id: OrderStatus.SHIPPED, label: '已发货', icon: Truck },
      { id: OrderStatus.DELIVERED, label: '已完成', icon: CheckCircle },
  ];
  
  // Exception Statuses - Fixed to include REFUNDED
  const exceptionStatuses = [
      { id: OrderStatus.REFUND_PENDING, label: '退款中', icon: RefreshCcw },
      { id: OrderStatus.REFUNDED, label: '已退款', icon: AlertCircle }, // Added REFUNDED
      { id: OrderStatus.CANCELLED, label: '已取消', icon: X },
  ];

  // --- Handle Renewal Initialization ---
  useEffect(() => {
      const state = location.state as any;
      if (state?.initRenewal && state?.originalOrder) {
          const original = state.originalOrder as Order;
          resetCreateForm();
          
          setOrderSource('Renewal');
          setOriginalOrderId(original.id);
          setBuyerType(original.buyerType || 'Customer');
          
          // Auto fill step 2
          handleCustomerChange(original.customerId);
          if (original.opportunityId) setLinkedOpportunityId(original.opportunityId);
          if (original.salesRepId) setSalesRepId(original.salesRepId);
          if (original.businessManagerId) setBusinessManagerId(original.businessManagerId);
          
          // Auto fill step 3 (Renewal items)
          const renewalItems: OrderItem[] = original.items.map(item => ({
              ...item,
              deliveredContent: [], // Clear license keys for new order
          }));
          setNewOrderItems(renewalItems);
          
          // Open modal and skip to step 3 to let user review items
          setIsCreateOpen(true);
          setCurrentStep(3);
          
          // Clear location state to avoid re-triggering
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const selectedCustomerObj = customers.find(c => c.id === newOrderCustomer);
  
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
  const canCreateOrder = currentUser.role === 'Admin' || currentUser.role === 'Sales';

  const getStatusBadge = (status: OrderStatus) => {
    let color = '';
    const text = statusMap[status] || status;
    switch (status) {
      case OrderStatus.PENDING_PAYMENT: color = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'; break;
      case OrderStatus.PENDING_APPROVAL: color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'; break;
      case OrderStatus.PENDING_CONFIRM: color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'; break;
      case OrderStatus.PROCESSING_PROD: color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'; break;
      case OrderStatus.SHIPPED: color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'; break;
      case OrderStatus.DELIVERED: color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; break;
      case OrderStatus.CANCELLED: color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; break;
      case OrderStatus.REFUND_PENDING: color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'; break;
      case OrderStatus.REFUNDED: color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; break;
      default: color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
    return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${color}`}>{text}</span>;
  };

  const getSourceBadge = (source: OrderSource) => {
      let label = '';
      let color = '';
      switch(source) {
          case 'Sales': label = '商务代下单'; color = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'; break;
          case 'ChannelPortal': label = '渠道下单'; color = 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'; break;
          case 'OnlineStore': label = '官网下单'; color = 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'; break;
          case 'APISync': label = '第三方系统下单'; color = 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'; break;
          case 'Renewal': label = '客户续费'; color = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'; break;
          default: label = source; color = 'bg-gray-50 text-gray-600';
      }
      return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium border border-transparent ${color}`}>{label}</span>;
  };

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
      setNewOrderItems([]);
      setTempProductId('');
      setTempSkuId('');
      setTempPricingOptionId('');
      setNegotiatedPrice(null);
      setCurrentStep(1);
      setInvoiceForm({ type: 'VAT_Special', title: '', taxId: '', content: '软件产品', bankName: '', accountNumber: '', address: '', phone: '' });
      setPaymentMethod('Transfer');
      setPaymentTerms('');
      setDeliveryMethod('Online'); // Reset Delivery Method
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
    
    // Validate pricing option requirement
    if (selectedSku.pricingOptions && selectedSku.pricingOptions.length > 0 && !selectedOption) {
        alert("请选择授权类型 (Pricing Option)");
        return;
    }

    const capabilitiesSnapshot = selectedProduct.composition?.map(c => c.name) || [];
    
    // Use the Order-level enterprise selection
    let enterpriseName = undefined;
    if (orderEnterpriseId && selectedCustomerObj?.enterprises) {
        const ent = selectedCustomerObj.enterprises.find(e => e.id === orderEnterpriseId);
        if (ent) enterpriseName = ent.name;
    }

    const finalPrice = negotiatedPrice !== null ? negotiatedPrice : (selectedOption ? selectedOption.price : selectedSku.price);

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
        activationMethod: tempActivationMethod,
        enterpriseId: orderEnterpriseId || undefined,
        enterpriseName: enterpriseName,
        capabilitiesSnapshot
    };

    setNewOrderItems([...newOrderItems, newItem]);
    
    // Reset selection partially to allow adding same product different sku or just reset quantity
    setTempQuantity(1); 
    setNegotiatedPrice(null);
    // Optionally reset SKU/Option
    setTempSkuId('');
    setTempPricingOptionId('');
  };

  const handleRemoveItem = (index: number) => setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  const calculateNewOrderTotal = () => newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);

  const handleCreateOrder = () => {
    if (!newOrderCustomer || newOrderItems.length === 0 || !buyerType) {
        alert('请完善订单信息：客户、商品或销售模式未填写。');
        return;
    }
    const customer = customers.find(c => c.id === newOrderCustomer);
    const salesUser = users.find(u => u.id === salesRepId);
    const businessUser = users.find(u => u.id === businessManagerId);
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
        customerId: newOrderCustomer, 
        customerName: customer ? customer.companyName : '未知', 
        
        // Snapshot Customer Fields
        customerType: customer?.customerType,
        customerLevel: customer?.level,
        customerIndustry: customer?.industry,
        customerRegion: customer?.region,

        date: new Date().toISOString(),
        // SelfDeal orders start at PENDING_PAYMENT, others at PENDING_APPROVAL
        status: buyerType === 'SelfDeal' ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING_APPROVAL,
        source: orderSource,
        deliveryMethod: deliveryMethod, // Save Delivery Method
        originalOrderId: originalOrderId,
        total: totalAmount, items: newOrderItems, shippingAddress: customer ? customer.address : '',
        isPaid: false, 
        // If Online delivery, auto-confirm stock steps to skip them
        isPackageConfirmed: deliveryMethod === 'Online', 
        isCDBurned: deliveryMethod === 'Online', 
        approval: { salesApproved: false, businessApproved: false, financeApproved: false },
        approvalRecords: [], salesRepId: salesRepId, salesRepName: salesUser?.name, 
        businessManagerId: businessManagerId, businessManagerName: businessUser?.name,
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
    setOrders([newOrder, ...orders]); setIsCreateOpen(false); resetCreateForm(); navigate(`/orders/${newOrder.id}`);
  };

  const filteredOrders = orders.filter(order => {
    // 1. Status Filter
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    // 2. Search Filter
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Advanced Filters
    const matchesSource = filterSource === 'All' || order.source === filterSource;
    
    const matchesDate = (!filterDateStart || new Date(order.date) >= new Date(filterDateStart)) &&
                        (!filterDateEnd || new Date(order.date) <= new Date(new Date(filterDateEnd).setHours(23, 59, 59, 999)));
                        
    const matchesAmount = (filterAmountMin === '' || order.total >= filterAmountMin) &&
                          (filterAmountMax === '' || order.total <= filterAmountMax);

    return matchesStatus && matchesSearch && matchesSource && matchesDate && matchesAmount;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // --- Batch Actions ---
  const toggleSelectOrder = (id: string) => {
      const newSet = new Set(selectedOrderIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedOrderIds(newSet);
  };

  const toggleSelectAll = () => {
      const currentPageIds = currentOrders.map(o => o.id);
      const allSelected = currentPageIds.every(id => selectedOrderIds.has(id));
      
      const newSet = new Set(selectedOrderIds);
      if (allSelected) {
          currentPageIds.forEach(id => newSet.delete(id));
      } else {
          currentPageIds.forEach(id => newSet.add(id));
      }
      setSelectedOrderIds(newSet);
  };

  const getEligibleCounts = () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      return {
          confirm: selectedList.filter(o => o.status === OrderStatus.PENDING_CONFIRM).length,
          ship: selectedList.filter(o => o.status === OrderStatus.PROCESSING_PROD).length
      };
  };

  const handleBatchConfirm = () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      const eligible = selectedList.filter(o => o.status === OrderStatus.PENDING_CONFIRM);
      
      if (eligible.length === 0) return alert('未选中任何“待确认”状态的订单。');
      
      if (confirm(`确定批量确认 ${eligible.length} 个订单吗？`)) {
          const now = new Date().toISOString();
          const updatedOrders = orders.map(o => {
              if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PENDING_CONFIRM) {
                  return {
                      ...o,
                      status: OrderStatus.PROCESSING_PROD,
                      confirmedDate: now,
                      approvalRecords: [{
                          id: `op-batch-${Date.now()}-${o.id}`,
                          operatorId: currentUser.id,
                          operatorName: currentUser.name,
                          operatorRole: currentUser.role,
                          actionType: 'Batch Confirm',
                          result: 'Confirmed',
                          timestamp: now,
                          comment: '批量确认操作'
                      }, ...o.approvalRecords]
                  };
              }
              return o;
          });
          setOrders(updatedOrders);
          setSelectedOrderIds(new Set());
      }
  };

  const handleBatchShip = () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      const eligible = selectedList.filter(o => o.status === OrderStatus.PROCESSING_PROD);
      
      if (eligible.length === 0) return alert('未选中任何“备货中”状态的订单。');

      const unpaidCount = eligible.filter(o => !o.isPaid).length;
      if (unpaidCount > 0) {
          if(!confirm(`其中有 ${unpaidCount} 个订单尚未支付，确定要强制发货吗？`)) return;
      } else {
          if(!confirm(`确定批量发货 ${eligible.length} 个订单吗？`)) return;
      }

      const now = new Date().toISOString();
      const updatedOrders = orders.map(o => {
          if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PROCESSING_PROD) {
              const isPhysical = o.deliveryMethod !== 'Online';
              return {
                  ...o,
                  status: OrderStatus.SHIPPED,
                  shippedDate: now,
                  // If physical and no tracking, set a placeholder for batch ship
                  carrier: isPhysical ? (o.carrier || 'Batch Ship') : undefined,
                  trackingNumber: isPhysical ? (o.trackingNumber || `BATCH-${Date.now()}`) : undefined,
                  isPackageConfirmed: true, // Force complete stock steps
                  isCDBurned: true,
                  approvalRecords: [{
                      id: `op-batch-ship-${Date.now()}-${o.id}`,
                      operatorId: currentUser.id,
                      operatorName: currentUser.name,
                      operatorRole: currentUser.role,
                      actionType: 'Batch Ship',
                      result: 'Shipped',
                      timestamp: now,
                      comment: '批量发货操作'
                  }, ...o.approvalRecords]
              };
          }
          return o;
      });
      setOrders(updatedOrders);
      setSelectedOrderIds(new Set());
      const { confirm: confirmCount, ship: shipCount } = getEligibleCounts();
  };

  const getAction = (order: Order) => {
      if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) return null;
      const navigateToStep = (step: string) => navigate(`/orders/${order.id}`, { state: { openAction: step } });
      if (order.status === OrderStatus.PENDING_APPROVAL) return <button onClick={(e) => { e.stopPropagation(); navigateToStep('APPROVAL'); }} className="px-2.5 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-sm text-[10px] font-bold whitespace-nowrap">去审批</button>;
      if (order.status === OrderStatus.PENDING_CONFIRM) return <button onClick={(e) => { e.stopPropagation(); navigateToStep('CONFIRM'); }} className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-sm text-[10px] font-bold whitespace-nowrap">去确认</button>;
      return <span className="text-gray-400 text-[10px] whitespace-nowrap">详情</span>;
  };

  const getSalesInfo = (order: Order) => {
      const user = users.find(u => u.id === order.salesRepId);
      const dept = departments.find(d => d.id === user?.departmentId);
      return {
          name: order.salesRepName || user?.name || '未分配',
          deptName: dept?.name || '未知部门'
      };
  };

  const clearAdvancedFilters = () => {
      setFilterDateStart('');
      setFilterDateEnd('');
      setFilterAmountMin('');
      setFilterAmountMax('');
      setFilterSource('All');
  };

  const { confirm: confirmCount, ship: shipCount } = getEligibleCounts();

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">订单中心</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理系统中的所有销售订单及交付流程。</p>
        </div>
        {canCreateOrder && (
            <button onClick={() => { setIsCreateOpen(true); resetCreateForm(); }} className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-5 py-2.5 rounded-md flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-lg text-sm font-medium">
                <Plus className="w-4 h-4" /> 新建订单
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
        {/* Tab Bar Logic */}
        <div className="flex flex-col xl:flex-row items-center justify-between px-6 py-3 border-b border-gray-100/50 dark:border-white/10 bg-white/50 dark:bg-[#1C1C1E] backdrop-blur gap-4">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full xl:w-auto">
                {/* 1. All Button */}
                <button 
                    onClick={() => setFilterStatus('All')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border shrink-0
                        ${filterStatus === 'All' 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                            : 'bg-white dark:bg-[#1C1C1E] text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}
                    `}
                >
                    <Layers className="w-3.5 h-3.5"/>
                    全部
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${filterStatus === 'All' ? 'bg-white/20 text-white dark:text-black' : 'bg-gray-100 text-gray-600 dark:bg-white/10'}`}>
                        {orders.length}
                    </span>
                </button>

                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 shrink-0 hidden md:block"></div>

                {/* 2. Pipeline Sequence */}
                <div className="flex items-center bg-gray-50/80 dark:bg-white/5 p-1 rounded-lg border border-gray-200/50 dark:border-white/10 shrink-0">
                    {pipelineStatuses.map((step, idx) => {
                        const isActive = filterStatus === step.id;
                        const count = orders.filter(o => o.status === step.id).length;
                        return (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => setFilterStatus(step.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap
                                        ${isActive 
                                            ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#FF2D55] shadow-sm ring-1 ring-gray-200 dark:ring-black' 
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'}
                                    `}
                                >
                                    {step.label}
                                    {count > 0 && (
                                        <span className={`px-1.5 rounded-sm text-[9px] ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-200 text-gray-600 dark:bg-white/20 dark:text-gray-300'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                                {idx < pipelineStatuses.length - 1 && (
                                    <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 mx-1 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 shrink-0 hidden md:block"></div>

                {/* 3. Exceptions */}
                <div className="flex gap-2 shrink-0">
                    {exceptionStatuses.map(step => {
                        const isActive = filterStatus === step.id;
                        const count = orders.filter(o => o.status === step.id).length;
                        return (
                            <button 
                                key={step.id}
                                onClick={() => setFilterStatus(step.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border shrink-0 whitespace-nowrap
                                    ${isActive 
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' 
                                        : 'bg-white dark:bg-[#1C1C1E] text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-300'}
                                `}
                            >
                                <step.icon className="w-3.5 h-3.5"/>
                                {step.label}
                                {count > 0 && <span className="opacity-60">({count})</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
            
            <div className="flex items-center gap-2 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64 shrink-0">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input type="text" placeholder="搜索单号或客户..." className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button 
                    onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                    className={`p-2 rounded-lg border transition ${isAdvancedFilterOpen ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                    title="高级筛选"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Advanced Filters Panel */}
        {isAdvancedFilterOpen && (
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">创建日期范围</label>
                    <div className="flex items-center gap-2">
                        <input type="date" className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">订单金额范围</label>
                    <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value ? Number(e.target.value) : '')} />
                        <span className="text-gray-400">-</span>
                        <input type="number" placeholder="Max" className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">订单来源</label>
                    <select className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white" value={filterSource} onChange={e => setFilterSource(e.target.value as any)}>
                        <option value="All">全部来源</option>
                        <option value="OnlineStore">官网下单</option>
                        <option value="ChannelPortal">渠道下单</option>
                        <option value="APISync">第三方系统下单</option>
                        <option value="Sales">商务代下单</option>
                        <option value="Renewal">客户续费</option>
                    </select>
                </div>
                <div>
                    <button onClick={clearAdvancedFilters} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white underline">
                        重置筛选
                    </button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 dark:bg-white/5 backdrop-blur border-b border-gray-200/50 dark:border-white/10 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 w-12 pl-8">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={toggleSelectAll}
                        checked={currentOrders.length > 0 && currentOrders.every(o => selectedOrderIds.has(o.id))}
                    />
                </th>
                <th className="p-5 whitespace-nowrap">订单号</th>
                <th className="p-5 whitespace-nowrap">客户 / 买方</th>
                <th className="p-5 hidden lg:table-cell whitespace-nowrap">商品信息</th>
                <th className="p-5 hidden xl:table-cell whitespace-nowrap">销售 / 部门</th>
                <th className="p-5 hidden xl:table-cell whitespace-nowrap">来源</th>
                <th className="p-5 hidden 2xl:table-cell whitespace-nowrap">销售模式</th>
                <th className="p-5 hidden md:table-cell whitespace-nowrap">日期</th>
                <th className="p-5 whitespace-nowrap">状态</th>
                <th className="p-5 text-right whitespace-nowrap">金额</th>
                <th className="p-5 text-center whitespace-nowrap">操作</th> 
                <th className="p-5 pr-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {currentOrders.map(order => (
                <tr key={order.id} className={`group cursor-pointer hover:bg-gray-100/80 dark:hover:bg-white/[0.08] even:bg-gray-50/50 dark:even:bg-white/[0.02] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${selectedOrderIds.has(order.id) ? '!bg-blue-50/50 dark:!bg-blue-900/20' : ''}`} onClick={() => navigate(`/orders/${order.id}`)}>
                  <td className="p-5 pl-8" onClick={(e) => e.stopPropagation()}>
                      <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                      />
                  </td>
                  <td className="p-5 font-mono text-[#0071E3] dark:text-[#FF2D55] whitespace-nowrap">{order.id}</td>
                  <td className="p-5 max-w-[200px]">
                    <div 
                        className="font-medium text-[#0071E3] dark:text-[#0A84FF] hover:font-bold cursor-pointer transition-all truncate"
                        title={order.customerName}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${order.customerId}`);
                        }}
                    >
                        {order.customerName}
                    </div>
                    {order.buyerType === 'Channel' && (
                        <div 
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 hover:underline cursor-pointer truncate"
                            onClick={(e) => {
                                e.stopPropagation();
                                const channelId = order.buyerId || channels.find(c => c.name === order.buyerName)?.id;
                                if (channelId) navigate(`/channels/${channelId}`);
                            }}
                        >
                            代理: {order.buyerName}
                        </div>
                    )}
                  </td>
                  <td className="p-5 hidden lg:table-cell">
                      <div className="flex flex-col gap-1 max-w-[240px]">
                          {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                  <div className="truncate font-medium text-gray-700 dark:text-gray-300 max-w-[150px]" title={item.productName}>
                                      {item.productName}
                                  </div>
                                  <span className="text-gray-400 shrink-0 ml-2">x{item.quantity}</span>
                              </div>
                          ))}
                          {order.items.length > 2 && (
                              <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-white/5 w-fit px-1.5 py-0.5 rounded">
                                  + {order.items.length - 2} 更多
                              </div>
                          )}
                      </div>
                  </td>
                  <td className="p-5 hidden xl:table-cell whitespace-nowrap">
                      {(() => {
                          const info = getSalesInfo(order);
                          return (
                              <div className="flex flex-col">
                                  <span className="font-medium text-gray-900 dark:text-white text-xs">{info.name}</span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{info.deptName}</span>
                              </div>
                          );
                      })()}
                  </td>
                  <td className="p-5 hidden xl:table-cell whitespace-nowrap">{getSourceBadge(order.source)}</td>
                  <td className="p-5 hidden 2xl:table-cell whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-medium border ${
                          order.buyerType === 'Channel' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                          order.buyerType === 'SelfDeal' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                      }`}>
                          {buyerTypeMap[order.buyerType] || '客户直签'}
                      </span>
                  </td>
                  <td className="p-5 text-gray-400 dark:text-gray-500 font-mono text-[11px] hidden md:table-cell whitespace-nowrap">{new Date(order.date).toLocaleString('zh-CN', { hour12: false })}</td>
                  <td className="p-5 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="p-5 text-right font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">¥{order.total.toLocaleString()}</td>
                  <td className="p-5 text-center whitespace-nowrap">{getAction(order)}</td>
                  <td className="p-5 pr-8 text-right"><ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" /></td>
                </tr>
              ))}
              {currentOrders.length === 0 && <tr><td colSpan={11} className="p-12 text-center text-gray-400">暂无订单数据</td></tr>}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium shadow-sm transition">上一页</button>
                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">第 {currentPage} 页 / 共 {totalPages} 页</div>
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium shadow-sm transition">下一页</button>
            </div>
        )}
      </div>

      {/* Batch Action Floating Bar */}
      {selectedOrderIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
              <div className="bg-white dark:bg-[#1C1C1E] shadow-2xl border border-gray-200 dark:border-white/10 rounded-full px-6 py-3 flex items-center gap-4 ring-1 ring-black/5">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white mr-2">
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">
                          {selectedOrderIds.size}
                      </div>
                      已选择
                  </div>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                  
                  {confirmCount > 0 ? (
                      <button 
                          onClick={handleBatchConfirm}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold hover:bg-orange-200 transition"
                      >
                          <CheckSquare className="w-3.5 h-3.5" /> 批量确认 ({confirmCount})
                      </button>
                  ) : (
                      <button disabled className="px-4 py-2 text-gray-400 text-xs font-bold cursor-not-allowed">
                          批量确认 (0)
                      </button>
                  )}

                  {shipCount > 0 ? (
                      <button 
                          onClick={handleBatchShip}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold hover:bg-blue-200 transition"
                      >
                          <Truck className="w-3.5 h-3.5" /> 批量发货 ({shipCount})
                      </button>
                  ) : (
                      <button disabled className="px-4 py-2 text-gray-400 text-xs font-bold cursor-not-allowed">
                          批量发货 (0)
                      </button>
                  )}
                  
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                  <button onClick={() => setSelectedOrderIds(new Set())} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          </div>
      )}

      {/* --- Full Create Order Wizard Modal --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8 border border-white/10 animate-modal-enter">
            {/* ... (Existing Create Order Wizard Content) ... */}
            {/* Header with Steps */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">创建销售订单</h3>
                        {orderSource === 'Renewal' && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-sm flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> 续费模式</span>}
                    </div>
                    <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex justify-between items-center px-4 relative">
                    <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-200 dark:bg-white/10 -translate-y-1/2 -z-0"></div>
                    {wizardSteps.map(s => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                currentStep === s.id ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white ring-4 ring-blue-100 dark:ring-red-900/30 shadow-lg' : 
                                currentStep > s.id ? 'bg-green-500 text-white' : 'bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 text-gray-400'
                            }`}>
                                {currentStep > s.id ? <CheckCircle className="w-5 h-5"/> : <s.icon className="w-5 h-5"/>}
                            </div>
                            <div className="text-center">
                                <div className={`text-xs font-bold ${currentStep === s.id ? 'text-[#0071E3] dark:text-[#FF2D55]' : 'text-gray-400'}`}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {/* Step 1: Order Type & Source */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Source Selection Grid */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">第一步：选择订单录入来源</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'OnlineStore', label: '官网下单', icon: Globe, color: 'text-orange-500 bg-orange-50' },
                                    { id: 'ChannelPortal', label: '渠道下单', icon: Network, color: 'text-purple-500 bg-purple-50' },
                                    { id: 'APISync', label: '第三方系统下单', icon: Radio, color: 'text-teal-500 bg-teal-50' },
                                    { id: 'Sales', label: '商务代下单', icon: UserIcon, color: 'text-blue-500 bg-blue-50' }
                                ].map(src => (
                                    <button 
                                        key={src.id}
                                        onClick={() => setOrderSource(src.id as OrderSource)}
                                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${orderSource === src.id ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/10 dark:bg-white/5' : 'border-gray-100 dark:border-white/5 hover:border-gray-200'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${src.color} dark:bg-white/10`}><src.icon className="w-5 h-5"/></div>
                                        <span className="text-xs font-bold dark:text-white">{src.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text--[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">第二步：选择业务销售模式</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: 'Customer', title: '客户直签', desc: '公司直接与客户签署合同', icon: Target, color: 'text-blue-500 bg-blue-50' },
                                    { id: 'Channel', title: '渠道代理', desc: '通过代理商进行转售', icon: Network, color: 'text-purple-500 bg-purple-50' },
                                    { id: 'SelfDeal', title: '自主成交', desc: '线上/自助扫码支付订单', icon: MousePointer2, color: 'text-orange-500 bg-orange-50' }
                                ].map(type => (
                                    <div key={type.id} 
                                        onClick={() => { setBuyerType(type.id as BuyerType); setCurrentStep(2); }}
                                        className={`p-6 rounded-lg border-2 transition-all cursor-pointer group hover:shadow-apple-hover ${buyerType === type.id ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/20 dark:bg-white/5' : 'border-gray-100 dark:border-white/5 hover:border-blue-200'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${type.color} dark:bg-white/10`}>
                                            <type.icon className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{type.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{type.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Basic Info */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">选择客户 (最终用户)</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white" value={newOrderCustomer} onChange={e => handleCustomerChange(e.target.value)}>
                                    <option value="">-- 选择客户 --</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                </select>
                            </div>
                            
                            {/* Enterprise Select */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">关联企业 (租户)</label>
                                <select 
                                    className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white" 
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

                            {buyerType === 'Channel' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">选择代理商 (买方)</label>
                                    <select className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white" value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                                        <option value="">-- 选择渠道商 --</option>
                                        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">关联商机</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white" value={linkedOpportunityId} onChange={e => handleOpportunityChange(e.target.value)}>
                                    <option value="">-- 无商机或选择已有 --</option>
                                    {opportunities.filter(o => o.customerId === newOrderCustomer || !newOrderCustomer).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">销售负责人</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm outline-none focus:ring-1 focus:ring-blue-500 dark:text-white" value={salesRepId} onChange={e => setSalesRepId(e.target.value)}>
                                    <option value="">-- 分配销售人员 --</option>
                                    {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Merchandise Selection (New Logic) */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        {orderSource === 'Renewal' && originalOrderId && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-3">
                                <RefreshCcw className="w-5 h-5"/>
                                <span>续费模式：正在基于订单 <strong>{originalOrderId}</strong> 的明细进行续费。您可以继续添加或移除商品。</span>
                            </div>
                        )}
                        
                        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                {/* 1. Product Selection */}
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">1. 选择商品 (Product)</label>
                                    <select 
                                        className="w-full p-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" 
                                        value={tempProductId} 
                                        onChange={e => setTempProductId(e.target.value)}
                                    >
                                        <option value="">-- 请选择商品 --</option>
                                        {products.filter(p => p.status === 'OnShelf').map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. SKU Selection */}
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">2. 选择规格 (SKU)</label>
                                    <select 
                                        className="w-full p-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" 
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
                                
                                {/* 3. License Selection */}
                                {selectedSku?.pricingOptions && selectedSku.pricingOptions.length > 0 && (
                                    <div className="lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">3. 选择授权类型 (Pricing Option)</label>
                                        <select 
                                            className="w-full p-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20" 
                                            value={tempPricingOptionId} 
                                            onChange={e => setTempPricingOptionId(e.target.value)}
                                        >
                                            <option value="">-- 请选择授权 --</option>
                                            {selectedSku.pricingOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {opt.title} - ¥{opt.price.toLocaleString()} ({opt.license.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">数量</label>
                                    <input type="number" className="w-full p-2.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm dark:text-white" min="1" value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} />
                                </div>
                                
                                <button 
                                    onClick={handleAddItem} 
                                    disabled={!tempProductId || !tempSkuId || (selectedSku?.pricingOptions?.length > 0 && !tempPricingOptionId)} 
                                    className="bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 hover:opacity-80 transition disabled:opacity-50 h-[42px]"
                                >
                                    <Plus className="w-4 h-4"/> 加入清单
                                </button>
                                
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 最终单价 (可议价)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 bg-white dark:bg-black border border-orange-200 dark:border-orange-900/30 rounded-sm dark:text-white text-sm" 
                                        value={negotiatedPrice !== null ? negotiatedPrice : ''} 
                                        onChange={e => setNegotiatedPrice(Number(e.target.value))} 
                                        placeholder={`基准: ¥${selectedOption?.price || selectedSku?.price || 0}`} 
                                    />
                                </div>
                            </div>
                        </div>

                        {newOrderItems.length > 0 && (
                            <div className="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-100 dark:border-white/5 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-400">
                                        <tr><th className="p-4">商品/规格</th><th className="p-4">授权类型</th><th className="p-4 text-center">数量</th><th className="p-4 text-right">单价</th><th className="p-4 text-right">小计</th><th className="p-4 text-center">操作</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-4"><div className="font-bold dark:text-white">{item.productName}</div><div className="text-xs text-gray-500">{item.skuName}</div></td>
                                                <td className="p-4"><span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-sm text-gray-600 dark:text-gray-300">{item.pricingOptionName || '默认'}</span></td>
                                                <td className="p-4 text-center dark:text-white">{item.quantity}</td>
                                                <td className="p-4 text-right dark:text-white">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                <td className="p-4 text-right font-bold text-orange-600 dark:text-orange-400">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                <td className="p-4 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50/50 dark:bg-white/5 font-bold">
                                            <td colSpan={4} className="p-4 text-right">总计金额:</td>
                                            <td className="p-4 text-right text-lg text-orange-600 dark:text-orange-400">¥{calculateNewOrderTotal().toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Commerce & Delivery (Same as before) */}
                {currentStep === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        {/* ... existing code for Step 4 ... */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500"/> 开票配置</h4>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">发票抬头</label><input className="w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-sm dark:text-white" value={invoiceForm.title} onChange={e=>setInvoiceForm({...invoiceForm, title:e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">纳税人识别号</label><input className="w-full p-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-sm dark:text-white font-mono" value={invoiceForm.taxId} onChange={e=>setInvoiceForm({...invoiceForm, taxId:e.target.value})} /></div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500"/> 支付方式</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'Online', label: '在线支付', icon: Wallet, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' },
                                        { id: 'Transfer', label: '银行转账', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' },
                                        { id: 'COD', label: '货到付款', icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' },
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-1.5 ${
                                                paymentMethod === method.id 
                                                ? method.color 
                                                : 'border-gray-100 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <method.icon className="w-5 h-5"/>
                                            <span className="text-xs font-bold">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {paymentMethod === 'Online' && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        订单提交后系统将生成聚合支付二维码，支持微信/支付宝。
                                    </div>
                                )}
                                {paymentMethod === 'Transfer' && (
                                    <div className="space-y-2 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block">付款方户名 (用于对账)</label>
                                        <input 
                                            value={paymentTerms} 
                                            onChange={e => setPaymentTerms(e.target.value)}
                                            placeholder="请输入汇款账户名称..." 
                                            className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-sm text-xs dark:text-white"
                                        />
                                    </div>
                                )}
                                {paymentMethod === 'COD' && (
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-xs text-orange-600 dark:text-orange-300 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                        需先支付 30% 定金，剩余尾款由物流人员送货时现场代收。
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Truck className="w-4 h-4 text-green-500"/> 发货方式</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'Online', label: '线上发货', icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' },
                                        { id: 'Offline', label: '线下发货', icon: Box, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' },
                                        { id: 'Hybrid', label: '混合发货', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400' },
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setDeliveryMethod(method.id as DeliveryMethod)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all gap-1.5 ${
                                                deliveryMethod === method.id 
                                                ? method.color 
                                                : 'border-gray-100 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <method.icon className="w-5 h-5"/>
                                            <span className="text-xs font-bold">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {deliveryMethod === 'Online' && <div className="text-xs text-gray-500 bg-gray-50 dark:bg-white/10 p-2 rounded-lg">仅生成电子授权，无需实物物流。</div>}
                                {deliveryMethod === 'Offline' && <div className="text-xs text-gray-500 bg-gray-50 dark:bg-white/10 p-2 rounded-lg">需准备光盘/U盘介质，并通过快递发货。</div>}
                                {deliveryMethod === 'Hybrid' && <div className="text-xs text-gray-500 bg-gray-50 dark:bg-white/10 p-2 rounded-lg">同时包含电子授权与实物介质交付。</div>}
                            </div>

                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-green-500"/> 验收计划</h4>
                            <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-md">
                                <button onClick={()=>setAcceptanceType('OneTime')} className={`flex-1 py-1.5 rounded-sm text-xs font-medium transition ${acceptanceType === 'OneTime' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3]' : 'text-gray-500'}`}>整体验收</button>
                                <button onClick={()=>setAcceptanceType('Phased')} className={`flex-1 py-1.5 rounded-sm text-xs font-medium transition ${acceptanceType === 'Phased' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3]' : 'text-gray-500'}`}>分期验收</button>
                            </div>
                            {acceptanceType === 'Phased' && (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                                    {phaseDrafts.map((p, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input className="flex-1 p-2 bg-white dark:bg-black border rounded-sm text-xs dark:text-white" placeholder="阶段名称" value={p.name} onChange={e=> {
                                                const next = [...phaseDrafts]; next[idx].name = e.target.value; setPhaseDrafts(next);
                                            }} />
                                            <div className="w-24 relative">
                                                <input type="number" className="w-full p-2 bg-white dark:bg-black border rounded-sm text-xs dark:text-white pr-6" value={p.percentage} onChange={e=> {
                                                    const next = [...phaseDrafts]; next[idx].percentage = Number(e.target.value); setPhaseDrafts(next);
                                                }} />
                                                <Percent className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                            </div>
                                            <button onClick={() => setPhaseDrafts(phaseDrafts.filter((_,i) => i !== idx))} className="text-gray-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                    <button onClick={()=>setPhaseDrafts([...phaseDrafts, { name: '', percentage: 0 }])} className="w-full py-2 border border-dashed rounded-lg text-[10px] font-bold text-blue-500 hover:bg-blue-50 transition">+ 添加验收节点</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                <button onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setIsCreateOpen(false)} className="px-6 py-2 text-gray-500 dark:text-gray-400 font-medium hover:underline text-sm">
                    {currentStep === 1 ? '取消' : '上一步'}
                </button>
                <div className="flex gap-3">
                    {currentStep < 4 ? (
                        <button 
                            disabled={(currentStep === 1 && !buyerType) || (currentStep === 2 && !newOrderCustomer) || (currentStep === 3 && newOrderItems.length === 0)}
                            onClick={() => setCurrentStep(currentStep + 1)} 
                            className="bg-black dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-md font-bold shadow-lg hover:opacity-80 transition disabled:opacity-50"
                        >
                            下一步
                        </button>
                    ) : (
                        <button onClick={handleCreateOrder} className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-8 py-2.5 rounded-md font-bold shadow-lg hover:opacity-80 transition">
                            提交并创建订单
                        </button>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
