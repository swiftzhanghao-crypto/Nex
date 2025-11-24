
import React, { useState } from 'react';
import { Order, OrderStatus, Product, Customer, OrderItem, ActivationMethod, PaymentRecord, User } from '../types';
import { Search, CheckCircle, Clock, Truck, XCircle, Eye, Package, User as UserIcon, Plus, Trash2, X, MapPin, ShieldCheck, FileCheck, Key, AtSign, Edit3, Save, Download, CreditCard, Disc, CheckSquare, Settings, ArrowRight, AlertCircle, DollarSign, Wand2, Award, Printer, Lock } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  currentUser: User;
}

const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, products, customers, currentUser }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Create Order State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  
  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentRecord>>({
      bankName: '',
      accountNumber: '',
      transactionId: '',
      payerName: '',
      remarks: ''
  });

  // Certificate State
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  
  // Item Selection State
  const [tempProductId, setTempProductId] = useState('');
  const [tempLicenseId, setTempLicenseId] = useState(''); // For selecting license option
  const [tempPackageId, setTempPackageId] = useState(''); // For selecting install package
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('LicenseKey');

  // Shipping Action State
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');

  // Fulfillment State (Inside Order Details)
  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');

  // Filter only OnShelf products for new orders
  const availableProducts = products.filter(p => p.status === 'OnShelf');
  
  // Get currently selected product to check for options
  const selectedProduct = availableProducts.find(p => p.id === tempProductId);

  // --- PERMISSION CHECKS ---
  const canCreateOrder = currentUser.role === 'Admin' || currentUser.role === 'Sales';
  const canManagePayment = currentUser.role === 'Admin' || currentUser.role === 'Business';
  const canApproveSales = currentUser.role === 'Admin' || currentUser.role === 'Sales';
  const canApproveBusiness = currentUser.role === 'Admin' || currentUser.role === 'Business';
  const canConfirmOrder = currentUser.role === 'Admin' || currentUser.role === 'Sales';
  const canManageProduction = currentUser.role === 'Admin' || currentUser.role === 'Technical';
  const canManageShipping = currentUser.role === 'Admin' || currentUser.role === 'Logistics';
  // -------------------------

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT: return 'bg-gray-100 text-gray-800 border-gray-200';
      case OrderStatus.PENDING_APPROVAL: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PENDING_CONFIRM: return 'bg-orange-100 text-orange-800 border-orange-200';
      case OrderStatus.PROCESSING_PROD: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.SHIPPED: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
     const steps = [
         OrderStatus.PENDING_PAYMENT,
         OrderStatus.PENDING_APPROVAL,
         OrderStatus.PENDING_CONFIRM,
         OrderStatus.PROCESSING_PROD,
         OrderStatus.SHIPPED,
         OrderStatus.DELIVERED
     ];
     return steps.indexOf(status);
  };

  const getLicenseDurationText = (item: OrderItem) => {
      const name = item.licenseOptionName || '';
      if (name.includes('永久') || name.includes('终身')) return '永久授权';
      if (name.includes('年')) return '1年 (订阅制)';
      if (name.includes('季')) return '3个月 (订阅制)';
      if (name.includes('月')) return '1个月 (订阅制)';
      return '标准商业授权';
  };

  // Workflow Actions
  const openPaymentModal = () => {
      if (!canManagePayment) return;

      // Find customer to pre-fill info
      const customer = customers.find(c => c.id === selectedOrder?.customerId);
      const bankInfo = customer?.bankInfo;

      setPaymentForm({
        bankName: bankInfo?.bankName || '',
        accountNumber: bankInfo?.accountNumber || '',
        transactionId: '',
        payerName: bankInfo?.accountName || selectedOrder?.customerName || '',
        remarks: ''
      });
      setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
      if (!selectedOrder || !paymentForm.bankName || !paymentForm.transactionId || !paymentForm.amount) return;
      
      const record: PaymentRecord = {
          method: 'BankTransfer',
          bankName: paymentForm.bankName,
          accountNumber: paymentForm.accountNumber || '',
          transactionId: paymentForm.transactionId,
          payerName: paymentForm.payerName || '',
          amount: paymentForm.amount || selectedOrder.total,
          paymentDate: new Date().toISOString(),
          remarks: paymentForm.remarks
      };

      const updatedOrder = { 
          ...selectedOrder, 
          status: OrderStatus.PENDING_APPROVAL,
          isPaid: true,
          paymentDate: new Date().toISOString(),
          paymentRecord: record
      };
      updateOrder(updatedOrder);
      setIsPaymentModalOpen(false);
  };

  const handleApprove = (type: 'sales' | 'business') => {
    if (!selectedOrder) return;
    
    if (type === 'sales' && !canApproveSales) return;
    if (type === 'business' && !canApproveBusiness) return;

    const updatedOrder = { ...selectedOrder };
    
    // Initialize approval if missing
    if (!updatedOrder.approval) {
        updatedOrder.approval = { salesApproved: false, businessApproved: false };
    }
    const now = new Date().toISOString();
    if (type === 'sales') {
        updatedOrder.approval = { ...updatedOrder.approval, salesApproved: true, salesApprovedDate: now };
    } else if (type === 'business') {
        updatedOrder.approval = { ...updatedOrder.approval, businessApproved: true, businessApprovedDate: now };
    }

    // If both approved, move to Confirm stage
    if (updatedOrder.approval.salesApproved && updatedOrder.approval.businessApproved) {
        updatedOrder.status = OrderStatus.PENDING_CONFIRM;
    }
    updateOrder(updatedOrder);
  };

  const handleConfirmOrder = () => {
      if (!selectedOrder || !canConfirmOrder) return;
      const updatedOrder = { 
          ...selectedOrder, 
          status: OrderStatus.PROCESSING_PROD,
          confirmedDate: new Date().toISOString()
      };
      updateOrder(updatedOrder);
  };

  const handleConfirmPackage = () => {
      if (!selectedOrder || !canManageProduction) return;
      const updatedOrder = { ...selectedOrder, isPackageConfirmed: true };
      updateOrder(updatedOrder);
  };

  const handleBurnCD = () => {
      if (!selectedOrder || !canManageProduction) return;
      const updatedOrder = { ...selectedOrder, isCDBurned: true, cdBurnedDate: new Date().toISOString() };
      updateOrder(updatedOrder);
  };

  const handleShipOrder = () => {
    if (!selectedOrder || !shippingCarrier || !shippingTracking || !canManageShipping) return;
    
    const updatedOrder = {
        ...selectedOrder,
        status: OrderStatus.SHIPPED,
        carrier: shippingCarrier,
        trackingNumber: shippingTracking
    };
    updateOrder(updatedOrder);
    setShippingCarrier('');
    setShippingTracking('');
  };

  const updateOrder = (order: Order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      setSelectedOrder(order);
  };

  // Item Management Logic
  const handleAddItem = () => {
    if (!tempProductId || tempQuantity <= 0) return;
    
    const product = products.find(p => p.id === tempProductId);
    if (!product) return;

    let price = product.price;
    let licenseName = undefined;
    let packageName = undefined;

    if (product.licenseOptions && product.licenseOptions.length > 0) {
        if (!tempLicenseId) return; 
        const license = product.licenseOptions.find(l => l.id === tempLicenseId);
        if (license) {
            price = license.price;
            licenseName = license.name;
        }
    }

    if (tempPackageId) {
        const pkg = product.installPackages?.find(p => p.id === tempPackageId);
        if (pkg) {
            packageName = pkg.name;
            if (pkg.version) packageName += ` (${pkg.version})`;
        }
    }

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: tempQuantity,
      priceAtPurchase: price,
      licenseOptionId: tempLicenseId || undefined,
      licenseOptionName: licenseName,
      installPackageName: packageName,
      activationMethod: tempActivationMethod
    };

    setNewOrderItems([...newOrderItems, newItem]);
    setTempProductId('');
    setTempLicenseId('');
    setTempPackageId('');
    setTempQuantity(1);
    setTempActivationMethod('LicenseKey');
  };

  const handleRemoveItem = (index: number) => {
    setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateNewOrderTotal = () => {
    return newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);
  };

  const handleCreateOrder = () => {
    if (!newOrderCustomer || newOrderItems.length === 0) return;
    const customer = customers.find(c => c.id === newOrderCustomer);
    const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: newOrderCustomer,
        customerName: customer ? customer.companyName : '未知客户',
        date: new Date().toISOString(),
        status: OrderStatus.PENDING_PAYMENT, // Start at pending payment
        total: calculateNewOrderTotal(),
        items: newOrderItems,
        shippingAddress: customer ? customer.address : '',
        isPaid: false,
        isPackageConfirmed: false,
        isCDBurned: false,
        approval: { salesApproved: false, businessApproved: false }
    };

    setOrders([newOrder, ...orders]);
    setIsCreateOpen(false);
    setNewOrderCustomer('');
    setNewOrderItems([]);
    setTempProductId('');
    setTempLicenseId('');
    setTempPackageId('');
    setTempQuantity(1);
    setTempActivationMethod('LicenseKey');
  };

  // Manual Fulfillment Logic
  const startFulfillment = (index: number, item: OrderItem) => {
    setFulfillmentItemIndex(index);
    setFulfillmentContent(item.deliveredContent ? item.deliveredContent.join('\n') : '');
  };

  const saveFulfillment = () => {
      if (!selectedOrder || fulfillmentItemIndex === null) return;
      const contentArray = fulfillmentContent.split('\n').filter(line => line.trim() !== '');
      const updatedItems = [...selectedOrder.items];
      updatedItems[fulfillmentItemIndex] = {
          ...updatedItems[fulfillmentItemIndex],
          deliveredContent: contentArray
      };
      const updatedOrder = { ...selectedOrder, items: updatedItems };
      updateOrder(updatedOrder);
      setFulfillmentItemIndex(null);
      setFulfillmentContent('');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stepper UI Component
  const OrderStepper = ({ currentStatus }: { currentStatus: OrderStatus }) => {
      if (currentStatus === OrderStatus.CANCELLED) return <div className="w-full bg-red-50 text-red-600 p-2 text-center rounded">订单已取消</div>;
      
      const steps = [
          { id: OrderStatus.PENDING_PAYMENT, label: '下单/支付' },
          { id: OrderStatus.PENDING_APPROVAL, label: '审批' },
          { id: OrderStatus.PENDING_CONFIRM, label: '确认' },
          { id: OrderStatus.PROCESSING_PROD, label: '生产/配货' },
          { id: OrderStatus.SHIPPED, label: '发货' },
          { id: OrderStatus.DELIVERED, label: '完成' }
      ];
      
      const currentIndex = getStatusStepIndex(currentStatus);

      return (
          <div className="flex items-center justify-between w-full mb-8 relative">
              {/* Line background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded"></div>
              {/* Active Line */}
               <div 
                className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 transform -translate-y-1/2 rounded transition-all duration-500"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
               ></div>

              {steps.map((step, idx) => {
                  const isCompleted = idx <= currentIndex;
                  const isActive = idx === currentIndex;
                  return (
                      <div key={step.id} className="flex flex-col items-center bg-white px-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 
                              ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'}
                              ${isActive ? 'ring-4 ring-indigo-100' : ''}
                          `}>
                              {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                          </div>
                          <div className={`text-xs mt-2 font-medium ${isCompleted ? 'text-indigo-700' : 'text-gray-400'}`}>
                              {step.label}
                          </div>
                      </div>
                  )
              })}
          </div>
      );
  };

  const ActionButton = ({ label, icon: Icon, onClick, disabled, variant = 'primary' }: any) => (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition w-full md:w-auto
            ${disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : variant === 'primary' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }
        `}
        title={disabled ? "您没有权限执行此操作" : ""}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {disabled && <Lock className="w-3 h-3 ml-1 opacity-50" />}
      </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
        
        {canCreateOrder ? (
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
            >
                <Plus className="w-4 h-4" /> 新建订单
            </button>
        ) : (
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded border">
                当前角色 ({currentUser.role}) 无法创建新订单
            </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 p-2 rounded-lg border border-gray-200">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="text" 
            placeholder="搜索订单号或客户..." 
            className="bg-transparent border-none outline-none text-sm w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          <button 
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === 'All' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            全部
          </button>
          {Object.values(OrderStatus).map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">订单号</th>
                <th className="p-4">客户</th>
                <th className="p-4">日期</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">总金额</th>
                <th className="p-4 text-center">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <button 
                        onClick={() => setSelectedOrder(order)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                        {order.id}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{order.customerName}</div>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(order.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-gray-800">
                    ¥{order.total.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-indigo-600 transition">
                        <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">未找到订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" />
                            订单详情 {selectedOrder.id}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">下单时间: {new Date(selectedOrder.date).toLocaleString('zh-CN')}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                         {selectedOrder.isPaid && (
                            <button 
                                onClick={() => setIsCertificateOpen(true)}
                                className="flex items-center gap-1 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition border border-indigo-100"
                            >
                                <Award className="w-4 h-4" /> 查看电子授权书
                            </button>
                        )}
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Stepper */}
                    <OrderStepper currentStatus={selectedOrder.status} />

                    {/* Workflow Action Zone */}
                    {selectedOrder.status !== OrderStatus.CANCELLED && selectedOrder.status !== OrderStatus.DELIVERED && selectedOrder.status !== OrderStatus.SHIPPED && (
                         <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                            <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5" /> 当前待处理任务
                            </h4>
                            
                            {/* Step 1: Payment */}
                            {selectedOrder.status === OrderStatus.PENDING_PAYMENT && (
                                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-indigo-100">
                                    <div>
                                        <div className="font-bold text-gray-800">等待支付</div>
                                        <div className="text-sm text-gray-500">请联系客户进行转账支付，并录入支付流水信息。</div>
                                    </div>
                                    <ActionButton 
                                        label="录入银行转账信息" 
                                        icon={CreditCard} 
                                        onClick={openPaymentModal} 
                                        disabled={!canManagePayment} 
                                    />
                                </div>
                            )}

                            {/* Step 2: Approval */}
                            {selectedOrder.status === OrderStatus.PENDING_APPROVAL && (
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Sales Approval */}
                                    <div className={`flex-1 p-4 rounded-lg border bg-white ${selectedOrder.approval?.salesApproved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800">销售审批</span>
                                            {selectedOrder.approval?.salesApproved && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        </div>
                                        {!selectedOrder.approval?.salesApproved && (
                                            <ActionButton 
                                                label="销售经理审批" 
                                                onClick={() => handleApprove('sales')} 
                                                disabled={!canApproveSales} 
                                                variant="secondary"
                                            />
                                        )}
                                    </div>
                                    {/* Business Approval */}
                                    <div className={`flex-1 p-4 rounded-lg border bg-white ${selectedOrder.approval?.businessApproved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800">商务审批</span>
                                            {selectedOrder.approval?.businessApproved && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        </div>
                                        {!selectedOrder.approval?.businessApproved && (
                                             <ActionButton 
                                                label="商务部门审批" 
                                                onClick={() => handleApprove('business')} 
                                                disabled={!canApproveBusiness} 
                                                variant="secondary"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                             {/* Step 3: Confirmation */}
                             {selectedOrder.status === OrderStatus.PENDING_CONFIRM && (
                                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-indigo-100">
                                    <div>
                                        <div className="font-bold text-gray-800">订单最终确认</div>
                                        <div className="text-sm text-gray-500">审批已完成，请确认订单详情无误进入生产流程。</div>
                                    </div>
                                    <ActionButton 
                                        label="确认订单 & 开始生产" 
                                        icon={CheckSquare} 
                                        onClick={handleConfirmOrder} 
                                        disabled={!canConfirmOrder} 
                                    />
                                </div>
                            )}

                            {/* Step 4: Production (Package Check & CD Burn) */}
                            {selectedOrder.status === OrderStatus.PROCESSING_PROD && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Package Check */}
                                        <div className={`p-4 rounded-lg border transition ${selectedOrder.isPackageConfirmed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    <Download className="w-4 h-4" /> 安装包确认
                                                </div>
                                                {selectedOrder.isPackageConfirmed && <CheckCircle className="w-5 h-5 text-green-500" />}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">核对订单中选定的安装包版本是否正确。</p>
                                            {!selectedOrder.isPackageConfirmed && (
                                                <button 
                                                    onClick={handleConfirmPackage} 
                                                    disabled={!canManageProduction}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${!canManageProduction ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                                >
                                                    {!canManageProduction && <Lock className="w-3 h-3"/>} 确认安装包无误
                                                </button>
                                            )}
                                        </div>

                                        {/* CD Burn */}
                                        <div className={`p-4 rounded-lg border transition ${selectedOrder.isCDBurned ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-bold text-gray-800 flex items-center gap-2">
                                                    <Disc className="w-4 h-4" /> 光盘刻录
                                                </div>
                                                {selectedOrder.isCDBurned && <CheckCircle className="w-5 h-5 text-green-500" />}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">制作物理介质（如需），并完成校验。</p>
                                            {!selectedOrder.isCDBurned && (
                                                <button 
                                                    onClick={handleBurnCD} 
                                                    disabled={!canManageProduction}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${!canManageProduction ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                                >
                                                    {!canManageProduction && <Lock className="w-3 h-3"/>} 完成刻录
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ship Trigger */}
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                                        <div className="mb-3 text-sm font-bold text-gray-800">填写发货信息</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                            <input 
                                                type="text" 
                                                placeholder="物流公司 (如: 顺丰)" 
                                                value={shippingCarrier}
                                                onChange={(e) => setShippingCarrier(e.target.value)}
                                                disabled={!canManageShipping}
                                                className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="快递单号" 
                                                value={shippingTracking}
                                                onChange={(e) => setShippingTracking(e.target.value)}
                                                disabled={!canManageShipping}
                                                className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <div className="text-xs text-red-500">
                                                 {(!selectedOrder.isPackageConfirmed || !selectedOrder.isCDBurned) && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> 请先完成安装包确认和光盘刻录</span>}
                                             </div>
                                             <ActionButton 
                                                label="确认发货" 
                                                icon={Truck} 
                                                onClick={handleShipOrder} 
                                                disabled={!shippingCarrier || !shippingTracking || !selectedOrder.isPackageConfirmed || !selectedOrder.isCDBurned || !canManageShipping} 
                                             />
                                        </div>
                                    </div>
                                </div>
                            )}
                         </div>
                    )}

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <div className="text-xs text-indigo-500 mb-1 font-medium uppercase">客户信息</div>
                            <div className="font-bold text-indigo-900 text-lg">{selectedOrder.customerName}</div>
                            <div className="text-sm text-indigo-700 mt-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> ID: {selectedOrder.customerId}
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <div className="text-xs text-green-500 mb-1 font-medium uppercase">订单状态</div>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold border ${getStatusColor(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                             <div className="text-xs text-gray-500 mb-1 font-medium uppercase">订单总额</div>
                             <div className="font-bold text-gray-900 text-2xl">¥{selectedOrder.total.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Payment Information Section - Displayed if paid */}
                    {selectedOrder.isPaid && selectedOrder.paymentRecord && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-8">
                            <h4 className="font-bold text-orange-900 flex items-center gap-2 mb-3">
                                <CreditCard className="w-5 h-5" /> 支付详情 (银行转账)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="text-orange-400 text-xs mb-1">汇款银行</div>
                                    <div className="font-medium text-gray-800">{selectedOrder.paymentRecord.bankName}</div>
                                </div>
                                <div>
                                    <div className="text-orange-400 text-xs mb-1">交易流水号</div>
                                    <div className="font-mono font-medium text-gray-800">{selectedOrder.paymentRecord.transactionId}</div>
                                </div>
                                <div>
                                    <div className="text-orange-400 text-xs mb-1">付款人/户名</div>
                                    <div className="font-medium text-gray-800">{selectedOrder.paymentRecord.payerName}</div>
                                </div>
                                <div>
                                    <div className="text-orange-400 text-xs mb-1">支付时间</div>
                                    <div className="font-medium text-gray-800">{new Date(selectedOrder.paymentRecord.paymentDate).toLocaleString('zh-CN')}</div>
                                </div>
                            </div>
                             {selectedOrder.paymentRecord.remarks && (
                                <div className="mt-2 text-xs text-gray-500">
                                    <span className="font-bold text-orange-400">备注:</span> {selectedOrder.paymentRecord.remarks}
                                </div>
                             )}
                        </div>
                    )}
                    
                    {/* Shipping Info (Read Only) */}
                    {(selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.DELIVERED) && (
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
                                    <Truck className="w-5 h-5" /> 物流已发出
                                </h4>
                                <p className="text-blue-800 text-sm">收货地址: {selectedOrder.shippingAddress}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-blue-500 uppercase font-bold">快递单号 ({selectedOrder.carrier})</div>
                                <div className="text-lg font-mono font-bold text-blue-900">{selectedOrder.trackingNumber}</div>
                            </div>
                         </div>
                    )}

                    {/* Products Table */}
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" /> 商品及交付详情
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="p-3">商品名称</th>
                                    <th className="p-3 text-center">激活方式</th>
                                    <th className="p-3 text-center">数量</th>
                                    <th className="p-3 text-right">小计</th>
                                    <th className="p-3 w-1/3">交付内容 (序列号/账号)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    selectedOrder.items.map((item, idx) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="p-3 text-gray-800 align-top">
                                                <div className="font-medium">{item.productName}</div>
                                                {item.licenseOptionName && (
                                                    <div className="text-xs text-indigo-500 bg-indigo-50 inline-block px-1.5 rounded mt-0.5 mr-1">{item.licenseOptionName}</div>
                                                )}
                                                {item.installPackageName && (
                                                    <div className="text-xs text-green-600 bg-green-50 inline-flex items-center px-1.5 rounded mt-0.5 gap-0.5">
                                                        <Download className="w-2.5 h-2.5" />
                                                        {item.installPackageName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center align-top">
                                                <span className={`text-xs px-2 py-1 rounded flex items-center justify-center gap-1 w-fit mx-auto ${item.activationMethod === 'LicenseKey' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.activationMethod === 'LicenseKey' ? <Key className="w-3 h-3" /> : <AtSign className="w-3 h-3" />}
                                                    {item.activationMethod === 'LicenseKey' ? '序列号' : '账号直充'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-gray-600 align-top">x{item.quantity}</td>
                                            <td className="p-3 text-right font-medium text-gray-800 align-top">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                            <td className="p-3 align-top">
                                                {fulfillmentItemIndex === idx ? (
                                                    <div className="space-y-2">
                                                        <textarea 
                                                            className="w-full border border-blue-300 rounded p-2 text-xs font-mono h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                                            placeholder={item.activationMethod === 'LicenseKey' ? "请输入序列号，每行一个" : "请输入充值账号，每行一个"}
                                                            value={fulfillmentContent}
                                                            onChange={(e) => setFulfillmentContent(e.target.value)}
                                                        ></textarea>
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                onClick={() => setFulfillmentItemIndex(null)}
                                                                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                                            >
                                                                取消
                                                            </button>
                                                            <button 
                                                                onClick={saveFulfillment}
                                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                                                            >
                                                                <Save className="w-3 h-3" /> 保存
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {item.deliveredContent && item.deliveredContent.length > 0 ? (
                                                            <ul className="bg-gray-50 rounded p-2 border border-gray-200 space-y-1">
                                                                {item.deliveredContent.map((content, i) => (
                                                                    <li key={i} className="text-xs font-mono text-gray-700 break-all flex items-start gap-2">
                                                                        <span className="text-gray-400 select-none">{i+1}.</span>
                                                                        {content}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 italic">暂无发货信息</div>
                                                        )}
                                                        
                                                        {selectedOrder.status !== OrderStatus.CANCELLED && (
                                                            <button 
                                                                onClick={() => startFulfillment(idx, item)}
                                                                disabled={!canManageProduction && !canManageShipping} // Assuming prod/shipping can fulfill keys
                                                                className={`text-xs flex items-center gap-1 ${!canManageProduction && !canManageShipping ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800 hover:underline'}`}
                                                            >
                                                                <Edit3 className="w-3 h-3" /> {item.deliveredContent && item.deliveredContent.length > 0 ? '修改发放内容' : '录入/发放'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-4 text-center text-gray-400">无商品详情</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Electronic Certificate Modal */}
      {isCertificateOpen && selectedOrder && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] animate-fade-in p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) setIsCertificateOpen(false);
            }}
          >
              <div className="bg-white w-full max-w-4xl shadow-2xl relative rounded-sm flex flex-col max-h-[90vh]">
                  {/* Toolbar - Moved inside */}
                  <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center shrink-0">
                      <div className="font-medium flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#B8860B]" />
                          正版授权证书预览
                      </div>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition text-sm"
                          >
                              <Printer className="w-4 h-4" /> 打印证书
                          </button>
                          <button 
                            onClick={() => setIsCertificateOpen(false)} 
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition text-sm"
                          >
                              <X className="w-4 h-4" /> 关闭
                          </button>
                      </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="overflow-y-auto p-6 bg-gray-100 flex-1 custom-scrollbar">
                      <div id="print-area" className="bg-white p-12 shadow-lg mx-auto max-w-[800px] relative">
                           {/* Border */}
                          <div className="absolute inset-4 border-[3px] border-[#B8860B] pointer-events-none"></div>
                          <div className="absolute inset-6 border border-[#B8860B] pointer-events-none"></div>
                          
                          {/* Watermark */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none overflow-hidden">
                               <div className="text-[120px] font-serif font-bold text-gray-900 transform -rotate-45 whitespace-nowrap">OFFICIAL LICENSE</div>
                          </div>

                          {/* Header */}
                          <div className="text-center mb-12 relative z-10 mt-4">
                              <div className="flex items-center justify-center gap-3 mb-5">
                                  <div className="w-12 h-12 bg-[#d32f2f] rounded flex items-center justify-center text-white font-bold text-2xl shadow-sm">W</div>
                                  <div className="text-left">
                                      <h2 className="text-lg tracking-widest text-gray-500 font-serif uppercase leading-none">Kingsoft Office</h2>
                                      <h2 className="text-lg tracking-widest text-gray-900 font-serif uppercase leading-none font-bold">WPS</h2>
                                  </div>
                              </div>
                              <h1 className="text-4xl font-serif font-bold text-[#333] tracking-wide mb-3">正版授权证明书</h1>
                              <div className="h-1 w-20 bg-[#B8860B] mx-auto mb-2"></div>
                              <div className="text-[#B8860B] text-xs tracking-[0.4em] uppercase font-bold">Certificate of Authorization</div>
                          </div>

                          {/* Body */}
                          <div className="space-y-8 relative z-10 px-4">
                              <div className="text-lg text-gray-800 leading-relaxed font-serif text-justify">
                                  <span className="font-bold text-2xl border-b-2 border-gray-800 pb-1 pr-4">{selectedOrder.customerName}</span> ：
                              </div>
                              <div className="text-lg text-gray-700 leading-loose font-serif indent-8 text-justify">
                                  兹证明，上述客户已通过北京金山办公软件股份有限公司及其授权合作伙伴的正规渠道，购买并获得以下软件产品的合法使用授权。
                                  本授权书证明所列软件均为正版，受《中华人民共和国著作权法》及国际版权公约保护。
                              </div>

                              {/* Product Table */}
                              <div className="mt-8 border-t-2 border-b-2 border-gray-800 py-1">
                                  <table className="w-full text-left border-collapse">
                                      <thead>
                                          <tr className="border-b border-gray-300">
                                              <th className="py-3 font-serif font-bold text-gray-900">授权产品名称</th>
                                              <th className="py-3 font-serif font-bold text-gray-900 text-center">版本/类型</th>
                                              <th className="py-3 font-serif font-bold text-gray-900 text-center">授权数量</th>
                                              <th className="py-3 font-serif font-bold text-gray-900 text-right">授权期限</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {selectedOrder.items.map((item, idx) => (
                                              <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                  <td className="py-4 font-serif text-lg font-bold text-gray-800">{item.productName}</td>
                                                  <td className="py-4 text-center font-serif text-gray-600">{item.licenseOptionName || '标准版'}</td>
                                                  <td className="py-4 text-center font-serif text-gray-800 font-bold">{item.quantity} <span className="text-xs font-normal text-gray-500">套/用户</span></td>
                                                  <td className="py-4 text-right font-serif text-gray-800">{getLicenseDurationText(item)}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                              
                              <div className="flex justify-between items-end mt-16 pt-4">
                                  <div className="text-sm text-gray-500 font-serif space-y-1">
                                      <p>授权编号：<span className="font-mono text-gray-900 font-bold">{selectedOrder.id}</span></p>
                                      <p>签发日期：<span className="font-mono text-gray-900 font-bold">{new Date(selectedOrder.confirmedDate || selectedOrder.date).toLocaleDateString()}</span></p>
                                      <div className="pt-4">
                                          <div className="w-24 h-24 bg-white border border-gray-200 p-1">
                                              {/* QR Code Placeholder */}
                                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WPS-AUTH-${selectedOrder.id}`} alt="Verify QR" className="w-full h-full opacity-80" />
                                          </div>
                                          <p className="text-[10px] mt-1 text-center w-24">扫码查验真伪</p>
                                      </div>
                                  </div>
                                  
                                  <div className="relative pr-4 pb-4">
                                      <div className="text-center font-serif font-bold text-xl text-gray-900 relative z-10 tracking-widest">
                                          北京金山办公软件股份有限公司
                                      </div>
                                      <div className="text-center text-xs text-gray-500 mt-1 font-serif tracking-wider uppercase">Kingsoft Office Software Co., Ltd.</div>
                                      <div className="h-px w-full bg-gray-300 mt-8"></div>
                                      <div className="text-center text-xs text-gray-400 mt-1">授权专用章 (Authorized Signature)</div>
                                      
                                      {/* Stamp CSS Effect */}
                                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-36 h-36 border-4 border-[#d32f2f] rounded-full opacity-80 pointer-events-none select-none flex items-center justify-center rotate-[-15deg] z-0 mix-blend-multiply">
                                          <div className="w-32 h-32 border border-[#d32f2f] rounded-full flex items-center justify-center p-1">
                                              <div className="w-full h-full border-[0.5px] border-[#d32f2f] rounded-full flex items-center justify-center relative">
                                                  <div className="absolute top-2 text-[#d32f2f] text-xs font-bold tracking-[0.2em]">北京金山办公</div>
                                                  <div className="absolute bottom-4 text-[#d32f2f] font-mono text-[8px] tracking-widest">1101080000000</div>
                                                  <div className="text-[#d32f2f] text-4xl">★</div>
                                                  <div className="absolute top-1/2 mt-4 text-[#d32f2f] text-xs font-bold">授权业务专用章</div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> 录入银行转账信息
                    </h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800 mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                            请确保您已收到款项并核对金额无误。
                            {customers.find(c => c.id === selectedOrder?.customerId)?.bankInfo && (
                                <div className="text-indigo-600 font-medium mt-1 flex items-center gap-1">
                                    <Wand2 className="w-3 h-3" /> 已自动填充客户默认付款信息
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">付款方户名</label>
                        <input 
                            type="text" 
                            placeholder="如: 未来科技集团"
                            value={paymentForm.payerName}
                            onChange={(e) => setPaymentForm({...paymentForm, payerName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">付款银行</label>
                        <input 
                            type="text" 
                            placeholder="如: 招商银行"
                            value={paymentForm.bankName}
                            onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">银行账号 (后4位或完整账号)</label>
                        <input 
                            type="text" 
                            placeholder="如: 8821"
                            value={paymentForm.accountNumber}
                            onChange={(e) => setPaymentForm({...paymentForm, accountNumber: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">交易流水号 / 凭证号</label>
                        <input 
                            type="text" 
                            placeholder="如: TXN-20241010-001"
                            value={paymentForm.transactionId}
                            onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">确认金额 (¥)</label>
                            <input 
                                type="number" 
                                value={paymentForm.amount || selectedOrder?.total}
                                onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-gray-50"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">备注 (选填)</label>
                        <textarea 
                            rows={2}
                            value={paymentForm.remarks}
                            onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                     <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
                     <button 
                        onClick={handleConfirmPayment}
                        disabled={!paymentForm.bankName || !paymentForm.transactionId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50"
                     >
                        确认并提交
                     </button>
                </div>
            </div>
          </div>
      )}

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">创建新订单</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择客户</label>
                <select 
                  value={newOrderCustomer}
                  onChange={(e) => setNewOrderCustomer(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- 请选择企业客户 --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} (联系人: {c.contactPerson})</option>
                  ))}
                </select>
                {newOrderCustomer && (
                   <p className="text-xs text-gray-500 mt-1 ml-1 flex items-center gap-1">
                     <MapPin className="w-3 h-3"/> 默认收货地址: {customers.find(c => c.id === newOrderCustomer)?.address}
                   </p>
                )}
              </div>

              {/* Add Items Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-3">添加商品</h4>
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-[2] w-full">
                    <label className="block text-xs text-gray-500 mb-1">产品</label>
                    <select 
                      value={tempProductId}
                      onChange={(e) => {
                          setTempProductId(e.target.value);
                          setTempLicenseId(''); // Reset license when product changes
                          setTempPackageId(''); // Reset package when product changes
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">-- 选择产品 --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* License Option Select */}
                  {selectedProduct?.licenseOptions && selectedProduct.licenseOptions.length > 0 && (
                       <div className="flex-1 w-full">
                            <label className="block text-xs text-gray-500 mb-1">授权方式</label>
                            <select 
                                value={tempLicenseId}
                                onChange={(e) => setTempLicenseId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">-- 选择方案 --</option>
                                {selectedProduct.licenseOptions.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} (¥{l.price})
                                    </option>
                                ))}
                            </select>
                       </div>
                  )}
                  
                  {/* Install Package Select */}
                  {selectedProduct?.installPackages && selectedProduct.installPackages.length > 0 && (
                      <div className="flex-1 w-full">
                           <label className="block text-xs text-gray-500 mb-1">安装包</label>
                           <select 
                               value={tempPackageId}
                               onChange={(e) => setTempPackageId(e.target.value)}
                               className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                           >
                               <option value="">-- 选择版本 --</option>
                               {selectedProduct.installPackages.map(p => (
                                   <option key={p.id} value={p.id}>
                                       {p.name} ({p.version})
                                   </option>
                                ))}
                           </select>
                      </div>
                  )}

                  <div className="flex-1 w-full">
                    <label className="block text-xs text-gray-500 mb-1">激活方式</label>
                    <select 
                      value={tempActivationMethod}
                      onChange={(e) => setTempActivationMethod(e.target.value as ActivationMethod)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="LicenseKey">序列号激活</option>
                      <option value="AccountBind">账号直充/绑定</option>
                    </select>
                  </div>

                  <div className="w-full md:w-24">
                    <label className="block text-xs text-gray-500 mb-1">数量</label>
                    <input 
                      type="number" 
                      min="1"
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddItem}
                    disabled={!tempProductId || (selectedProduct?.licenseOptions && selectedProduct.licenseOptions.length > 0 && !tempLicenseId)}
                    className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    添加
                  </button>
                </div>
                {/* Show selected price preview */}
                {tempProductId && (
                    <div className="text-right mt-2 text-sm text-gray-500">
                        {selectedProduct?.licenseOptions && selectedProduct.licenseOptions.length > 0 && tempLicenseId ? (
                            <span>单价: ¥{selectedProduct.licenseOptions.find(l => l.id === tempLicenseId)?.price}</span>
                        ) : !selectedProduct?.licenseOptions?.length ? (
                            <span>单价: ¥{selectedProduct?.price}</span>
                        ) : null}
                    </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">订单内容</h4>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                        <th className="p-3">产品</th>
                        <th className="p-3 text-center">激活类型</th>
                        <th className="p-3 text-right">单价</th>
                        <th className="p-3 text-center">数量</th>
                        <th className="p-3 text-right">小计</th>
                        <th className="p-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {newOrderItems.map((item, idx) => (
                        <tr key={idx}>
                            <td className="p-3">
                                <div>{item.productName}</div>
                                {item.licenseOptionName && <div className="text-xs text-gray-500">{item.licenseOptionName}</div>}
                                {item.installPackageName && (
                                    <div className="text-xs text-green-600 bg-green-50 inline-flex items-center px-1.5 rounded mt-1 gap-0.5">
                                        <Download className="w-2.5 h-2.5" />
                                        {item.installPackageName}
                                    </div>
                                )}
                            </td>
                            <td className="p-3 text-center">
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                    {item.activationMethod === 'LicenseKey' ? '序列号' : '账号直充'}
                                </span>
                            </td>
                            <td className="p-3 text-right">¥{item.priceAtPurchase}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">¥{(item.priceAtPurchase * item.quantity).toFixed(2)}</td>
                            <td className="p-3 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            </td>
                        </tr>
                        ))}
                        {newOrderItems.length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-400">暂无商品，请添加。</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end items-center gap-4">
                    <span className="text-gray-600">总计:</span>
                    <span className="text-2xl font-bold text-indigo-600">¥{calculateNewOrderTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">取消</button>
              <button 
                onClick={handleCreateOrder}
                disabled={!newOrderCustomer || newOrderItems.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
