
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, User, Department, Opportunity, OrderItem, ApprovalRecord } from '../types';
import { 
    ArrowLeft, Box, Printer, Award, X, Lock, CheckCircle, Truck, ClipboardCheck, 
    UploadCloud, AlertOctagon, RefreshCcw, Key, Package, Disc, Receipt, FileText, 
    Briefcase, History, Eye, CheckSquare, CreditCard, ShieldCheck, User as UserIcon, Building,
    ChevronRight, AlertCircle, Clock, MapPin
} from 'lucide-react';

interface OrderDetailsProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  users: User[];
  departments: Department[];
  currentUser: User;
  opportunities: Opportunity[];
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

const OrderDetails: React.FC<OrderDetailsProps> = ({ orders, setOrders, customers, currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedOrder = orders.find(o => o.id === id);

  // States
  const [activeStepModal, setActiveStepModal] = useState<string | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  
  const [isCertDrawerClosing, setIsCertDrawerClosing] = useState(false);
  const [selectedCertificateItem, setSelectedCertificateItem] = useState<OrderItem | null>(null);
  const [isCertPreviewMode, setIsCertPreviewMode] = useState(false);
  
  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');

  // Step specific forms
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');
  const [paymentForm, setPaymentForm] = useState({ bankName: '', transactionId: '' });
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
      if (location.state && (location.state as any).openAction) {
          setActiveStepModal((location.state as any).openAction);
      }
  }, [location.state]);

  // If no order found, return early
  if (!selectedOrder) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-[#F5F5F7] dark:bg-black">
              <div className="text-gray-500 mb-4">订单不存在</div>
              <button onClick={() => navigate('/orders')} className="text-blue-600 hover:underline">返回订单列表</button>
          </div>
      );
  }

  const fullCustomer = customers.find(c => c.id === selectedOrder.customerId);

  const updateOrder = (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const createOperationRecord = (actionType: string, result: string, comment?: string): ApprovalRecord => ({
      id: `op-${Date.now()}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      actionType,
      result,
      timestamp: new Date().toISOString(),
      comment
  });

  const isStockReady = selectedOrder.isAuthConfirmed && selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isShippingConfirmed;

  // Updated Workflow: Payment -> Approval (Sales, Business, Finance) -> Confirm -> Stock -> Ship -> Accept
  let steps = [
      { 
          id: 'PAYMENT', 
          label: '支付', 
          icon: CreditCard, 
          status: selectedOrder.isPaid ? 'Completed' : (![OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(selectedOrder.status) ? 'Current' : 'Locked'),
          disabled: false 
      },
      { 
          id: 'APPROVAL', 
          label: '审批', 
          icon: FileText, 
          status: !selectedOrder.isPaid ? 'Locked' : (selectedOrder.status === OrderStatus.PENDING_APPROVAL ? 'Current' : (['PENDING_CONFIRM', 'PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked')), 
          disabled: !selectedOrder.isPaid 
      },
      { 
          id: 'CONFIRM', 
          label: '确认', 
          icon: CheckSquare, 
          status: selectedOrder.status === OrderStatus.PENDING_CONFIRM ? 'Current' : (['PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked'), 
          disabled: !['PENDING_CONFIRM', 'PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status)
      },
      { 
          id: 'STOCK_PREP', 
          label: '备货', 
          icon: Package, 
          status: (selectedOrder.status === OrderStatus.PROCESSING_PROD && isStockReady) ? 'Completed' : (selectedOrder.status === OrderStatus.PROCESSING_PROD ? 'Current' : (['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked')), 
          disabled: !['PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status)
      },
      { 
          id: 'SHIPPING', 
          label: '发货', 
          icon: Truck, 
          status: selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : (selectedOrder.status === OrderStatus.PROCESSING_PROD && isStockReady ? 'Current' : 'Locked'), 
          disabled: !['PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status)
      },
      { 
          id: 'ACCEPTANCE', 
          label: '验收', 
          icon: ClipboardCheck, 
          status: selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : (selectedOrder.status === OrderStatus.SHIPPED ? 'Current' : 'Locked'), 
          disabled: !['SHIPPED', 'DELIVERED'].includes(selectedOrder.status)
      },
  ];

  // Override steps for SelfDeal mode
  if (selectedOrder.buyerType === 'SelfDeal') {
      steps = [
          { 
              id: 'PAYMENT', 
              label: '支付', 
              icon: CreditCard, 
              status: selectedOrder.isPaid ? 'Completed' : 'Current',
              disabled: false 
          },
          {
              id: 'COMPLETED',
              label: '交易完成',
              icon: CheckCircle,
              status: selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : 'Locked',
              disabled: true
          }
      ];
  }

  const handleConfirmOrder = () => {
      updateOrder({
          ...selectedOrder,
          status: OrderStatus.PROCESSING_PROD,
          confirmedDate: new Date().toISOString(),
          approvalRecords: [createOperationRecord('订单确认', 'Confirmed', '进入备货阶段'), ...selectedOrder.approvalRecords]
      });
      handleCloseDrawer();
  };

  const handleConfirmPayment = () => {
      const isSelfDeal = selectedOrder.buyerType === 'SelfDeal';
      
      const paymentRecord = {
          amount: selectedOrder.total,
          paymentDate: new Date().toISOString(),
          bankName: paymentForm.bankName,
          accountNumber: '',
          transactionId: paymentForm.transactionId,
          payerName: selectedOrder.customerName
      };

      if (isSelfDeal) {
          // Auto-complete logic for SelfDeal
          const updatedItems = selectedOrder.items.map(item => ({
              ...item,
              deliveredContent: [`LICENSE-${Date.now()}-${Math.floor(Math.random()*1000)}`] // Mock Auto-Gen
          }));

          updateOrder({
              ...selectedOrder,
              isPaid: true,
              status: OrderStatus.DELIVERED,
              paymentDate: new Date().toISOString(),
              paymentRecord,
              items: updatedItems,
              shippedDate: new Date().toISOString(),
              // Auto-fill required fields for "Completed" state consistency
              isAuthConfirmed: true, isPackageConfirmed: true, isCDBurned: true, isShippingConfirmed: true,
              approval: { salesApproved: true, businessApproved: true, financeApproved: true },
              approvalRecords: [
                  createOperationRecord('支付完成', 'Paid', `流水号: ${paymentForm.transactionId}`),
                  createOperationRecord('系统交付', 'Completed', '自助订单自动完成交付')
              , ...selectedOrder.approvalRecords]
          });
      } else {
          // Standard Flow
          updateOrder({
              ...selectedOrder,
              isPaid: true,
              status: OrderStatus.PENDING_APPROVAL, // Move to Approval after Payment
              paymentDate: new Date().toISOString(),
              paymentRecord,
              approvalRecords: [createOperationRecord('确认收款', 'Paid', `流水号: ${paymentForm.transactionId}`), ...selectedOrder.approvalRecords]
          });
      }
      handleCloseDrawer();
  };

  const handleApproveAction = (role: 'sales' | 'finance' | 'business', action: 'Approve' | 'Reject') => {
      if (action === 'Reject') {
          // Rejection keeps it in PENDING_APPROVAL but logs the rejection
          updateOrder({
              ...selectedOrder,
              approvalRecords: [createOperationRecord(`${role === 'sales' ? '销售' : role === 'business' ? '商务' : '财务'}审批`, 'Rejected', approvalComment), ...selectedOrder.approvalRecords]
          });
          setApprovalComment('');
          alert('审批已拒绝，流程暂停。');
          return;
      }

      const newApproval = { ...selectedOrder.approval };
      let nextStatus = selectedOrder.status;
      let actionName = '';

      if (role === 'sales') {
          newApproval.salesApproved = true;
          newApproval.salesApprovedDate = new Date().toISOString();
          actionName = '销售审批';
      } else if (role === 'business') {
          newApproval.businessApproved = true;
          newApproval.businessApprovedDate = new Date().toISOString();
          actionName = '商务审批';
      } else if (role === 'finance') {
          newApproval.financeApproved = true;
          newApproval.financeApprovedDate = new Date().toISOString();
          actionName = '财务审批';
          // Final approval moves to CONFIRM
          nextStatus = OrderStatus.PENDING_CONFIRM;
      }

      updateOrder({
          ...selectedOrder,
          status: nextStatus,
          approval: newApproval,
          approvalRecords: [createOperationRecord(actionName, 'Approved', approvalComment || '同意'), ...selectedOrder.approvalRecords]
      });
      setApprovalComment('');
      // If it was the final approval, close drawer
      if (role === 'finance') {
          handleCloseDrawer();
      }
  };

  const handleStockAction = (action: string) => {
      let updates: Partial<Order> = {};
      let comment = '';
      const now = new Date().toISOString();

      if (action === 'package') {
          updates = { isPackageConfirmed: true, packageConfirmedDate: now };
          comment = '安装包核验完成';
      } else if (action === 'shipping_confirm') {
          updates = { isShippingConfirmed: true, shippingConfirmedDate: now, carrier: shippingCarrier, trackingNumber: shippingTracking };
          comment = `物流信息确认: ${shippingCarrier} ${shippingTracking}`;
      } else if (action === 'cd') {
          updates = { isCDBurned: true, cdBurnedDate: now };
          comment = '光盘刻录完成';
      } else if (action === 'auth') {
          updates = { isAuthConfirmed: true, authConfirmedDate: now };
          comment = '授权证书确认';
          setIsCertPreviewMode(false);
          setIsCertDrawerClosing(true);
          setTimeout(() => { setSelectedCertificateItem(null); setIsCertDrawerClosing(false); }, 280);
      }

      updateOrder({
          ...selectedOrder,
          ...updates,
          approvalRecords: [createOperationRecord('备货操作', 'Success', comment), ...selectedOrder.approvalRecords]
      });
  };

  const handleStockComplete = () => {
      // In this new flow, clicking complete stock prep just confirms readiness. 
      // It stays in PROCESSING_PROD but the UI should show "Ready".
      // The Shipping step will actually transition status to SHIPPED.
      updateOrder({
          ...selectedOrder,
          approvalRecords: [createOperationRecord('备货完成', 'Ready', '所有备货环节已确认完成'), ...selectedOrder.approvalRecords]
      });
      handleCloseDrawer();
  };

  const handlePreviewAuth = (item: OrderItem) => {
      setSelectedCertificateItem(item);
      setIsCertPreviewMode(true);
  };

  const handleShipOrder = () => {
      // Strict validation before shipping
      const isStockReady = selectedOrder.isAuthConfirmed && selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isShippingConfirmed;
      if (!selectedOrder.isPaid || !isStockReady) {
          alert("无法发货：请确保订单已付款，且备货流程（授权确认、安装包核验、光盘刻录、物流单确认）全部完成。");
          return;
      }

      const opRecord = createOperationRecord('正式发货', 'Shipped', `${selectedOrder.carrier}: ${selectedOrder.trackingNumber}`);
      updateOrder({ ...selectedOrder, status: OrderStatus.SHIPPED, shippedDate: new Date().toISOString(), approvalRecords: [opRecord, ...selectedOrder.approvalRecords] });
      handleCloseDrawer();
  };

  const handleAcceptPhase = (phaseId: string) => {
      if (!selectedOrder.acceptanceConfig) return;
      const phases = selectedOrder.acceptanceConfig.phases.map(p => p.id === phaseId ? { ...p, status: 'Accepted' as const, acceptedDate: new Date().toISOString() } : p);
      // const allDone = phases.every(p => p.status === 'Accepted'); // Removed auto-complete
      updateOrder({ 
          ...selectedOrder, 
          // status: allDone ? OrderStatus.DELIVERED : selectedOrder.status, // Don't auto complete
          acceptanceConfig: { ...selectedOrder.acceptanceConfig, phases, status: 'In Progress' },
          approvalRecords: [createOperationRecord('验收确认', 'Success', '阶段验收通过'), ...selectedOrder.approvalRecords]
      });
  };

  const handleCompleteAcceptance = () => {
      if (selectedOrder.status === OrderStatus.DELIVERED) return;

      let phases = selectedOrder.acceptanceConfig?.phases || [];
      const hasPending = phases.some(p => p.status !== 'Accepted');
      
      if (hasPending) {
          if (!confirm("当前仍有未完成的验收阶段，确认强制通过并完成订单吗？")) return;
          const now = new Date().toISOString();
          phases = phases.map(p => p.status === 'Accepted' ? p : { ...p, status: 'Accepted', acceptedDate: now });
      }

      updateOrder({
          ...selectedOrder,
          status: OrderStatus.DELIVERED,
          acceptanceConfig: selectedOrder.acceptanceConfig ? { ...selectedOrder.acceptanceConfig, phases, status: 'Completed' } : undefined,
          approvalRecords: [createOperationRecord('最终验收确认', 'Completed', '订单已归档'), ...selectedOrder.approvalRecords]
      });
      handleCloseDrawer();
  };

  const handleRefundSubmit = () => {
      if (!refundReason) return alert("请填写退款原因");
      updateOrder({
          ...selectedOrder,
          status: OrderStatus.REFUND_PENDING,
          refundReason,
          refundAmount,
          approvalRecords: [createOperationRecord('发起退款', 'Requested', `原因: ${refundReason}, 金额: ¥${refundAmount}`), ...selectedOrder.approvalRecords]
      });
      handleCloseDrawer();
  };

  const handleUploadAcceptanceDoc = () => {
      alert("验收单模拟上传成功！");
  };

  const handleCloseDrawer = () => { setIsDrawerClosing(true); setTimeout(() => { setActiveStepModal(null); setIsDrawerClosing(false); }, 280); };
  
  const handleCloseCertDrawer = () => { 
      setIsCertDrawerClosing(true); 
      setTimeout(() => { 
          setSelectedCertificateItem(null); 
          setIsCertDrawerClosing(false); 
          setIsCertPreviewMode(false);
      }, 280); 
  };

  const startFulfillment = (idx: number, item: OrderItem) => { setFulfillmentItemIndex(idx); setFulfillmentContent(item.deliveredContent?.join('\n') || ''); };
  const saveFulfillment = () => {
      if (fulfillmentItemIndex === null) return;
      const items = [...selectedOrder.items];
      items[fulfillmentItemIndex] = { ...items[fulfillmentItemIndex], deliveredContent: fulfillmentContent.split('\n').filter(l => l.trim()) };
      updateOrder({ ...selectedOrder, items, approvalRecords: [createOperationRecord('交付内容更新', 'Updated'), ...selectedOrder.approvalRecords] });
      setFulfillmentItemIndex(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-4 flex justify-between items-center">
           <div className="flex items-center gap-6">
               <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex flex-col">
                   <div className="flex items-center gap-3">
                       <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">订单 {selectedOrder.id}</h1>
                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                           selectedOrder.status === OrderStatus.REFUND_PENDING ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                       }`}>{statusMap[selectedOrder.status] || selectedOrder.status}</span>
                   </div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedOrder.customerName} · {new Date(selectedOrder.date).toLocaleDateString()}</div>
               </div>
           </div>
           <div className="flex gap-4 items-center">
               <div className="text-right hidden sm:block">
                   <div className="text-[10px] text-gray-400 uppercase font-bold">应收总额</div>
                   <div className="text-lg font-bold text-orange-600 dark:text-orange-400 font-mono">¥{selectedOrder.total.toLocaleString()}</div>
               </div>
               <div className="flex gap-2">
                   {selectedOrder.isPaid && selectedOrder.status !== OrderStatus.REFUND_PENDING && selectedOrder.status !== OrderStatus.REFUNDED && selectedOrder.status !== OrderStatus.CANCELLED && (
                       <button 
                           onClick={() => setActiveStepModal('REFUND_REQUEST')} 
                           className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition flex items-center gap-1.5"
                       >
                           <AlertOctagon className="w-3.5 h-3.5"/> 申请退款
                       </button>
                   )}
                   <button onClick={() => navigate('/orders', { state: { initRenewal: true, originalOrder: selectedOrder } })} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 hover:bg-indigo-700 transition"><RefreshCcw className="w-3.5 h-3.5"/> 续费订单</button>
               </div>
           </div>
      </div>

      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8 animate-fade-in pb-32">
          {/* Stepper */}
          <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-x-auto">
             <div className="flex justify-between items-start relative min-w-[800px]">
                 <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full"></div>
                 {steps.map((step) => (
                    <div key={step.id} onClick={() => !step.disabled && setActiveStepModal(step.id)} className={`flex flex-col items-center gap-3 relative z-10 flex-1 transition-all ${step.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${step.status === 'Completed' ? 'bg-green-500 text-white' : step.status === 'Current' ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-4 ring-blue-100 dark:ring-red-900/30 shadow-lg scale-110' : 'bg-white dark:bg-[#2C2C2E] border-2 border-gray-200 dark:border-gray-600 text-gray-400'}`}>
                            {step.status === 'Locked' ? <Lock className="w-4 h-4" /> : <step.icon className="w-5 h-5" />}
                        </div>
                        <div className="text-center">
                            <div className={`text-sm font-bold ${step.status === 'Completed' ? 'text-green-600' : step.status === 'Current' ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`}>{step.label}</div>
                            {step.status === 'Current' && <div className="text-[10px] text-blue-500 font-bold animate-pulse mt-0.5">点击处理</div>}
                        </div>
                    </div>
                 ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  {/* Order Items Table */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-white/10"><h3 className="text-lg font-bold text-gray-900 dark:text-white">订单商品明细</h3></div>
                      <table className="w-full text-left">
                          <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                              <tr><th className="p-5">商品与规格</th><th className="p-5 text-center">数量</th><th className="p-5 text-right">单价/小计</th><th className="p-5">交付</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {selectedOrder.items.map((item, idx) => (
                                  <tr key={idx} className="group text-sm">
                                      <td className="p-5">
                                          <div className="font-bold text-gray-900 dark:text-white">{item.productName}</div>
                                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5"><Box className="w-3 h-3"/>{item.skuName}</div>
                                      </td>
                                      <td className="p-5 text-center dark:text-white font-medium">{item.quantity}</td>
                                      <td className="p-5 text-right">
                                          <div className="text-xs text-gray-400">¥{item.priceAtPurchase.toLocaleString()}</div>
                                          <div className="font-bold dark:text-white">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</div>
                                      </td>
                                      <td className="p-5">
                                          <div className="flex flex-col gap-1.5">
                                              {item.deliveredContent?.map((c, i) => <div key={i} className="text-[10px] font-mono bg-gray-50 dark:bg-white/10 p-1.5 rounded border border-gray-100 dark:border-white/5 truncate max-w-[150px]">{c}</div>)}
                                              <div className="flex gap-2">
                                                  <button onClick={() => startFulfillment(idx, item)} className="text-[10px] text-blue-600 hover:underline">管理授权</button>
                                                  {selectedOrder.isPaid && selectedOrder.confirmedDate && (
                                                      <button onClick={() => { setSelectedCertificateItem(item); setIsCertPreviewMode(true); }} className="text-[10px] text-orange-600 hover:underline flex items-center gap-0.5"><Award className="w-3 h-3"/> 电子授权书</button>
                                                  )}
                                              </div>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Commerce & Acceptance Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Delivery & Acceptance Info */}
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Truck className="w-4 h-4"/> 交付与验收详情</h4>
                          <div className="space-y-4">
                              <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                  <div className="text-gray-400 text-[10px] uppercase font-bold mb-1.5">收货信息</div>
                                  <div className="text-gray-900 dark:text-white text-sm font-medium">{selectedOrder.shippingAddress || '无地址信息'}</div>
                                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-2">
                                      <UserIcon className="w-3 h-3"/> {selectedOrder.acceptanceInfo?.contactName} · <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-gray-300 rounded-full" /> {selectedOrder.acceptanceInfo?.contactPhone}</div>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 border dark:border-white/10 rounded-xl">
                                      <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">验收方式</div>
                                      <div className="text-xs font-bold dark:text-white">{selectedOrder.acceptanceInfo?.method === 'OnSite' ? '现场' : '远程' || '远程'}</div>
                                  </div>
                                  <div className="p-3 border dark:border-white/10 rounded-xl">
                                      <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">验收计划</div>
                                      <div className="text-xs font-bold dark:text-white">{selectedOrder.acceptanceConfig?.type === 'Phased' ? '分期验收' : '整体验收'}</div>
                                  </div>
                              </div>
                              {/* Acceptance Phases List */}
                              {selectedOrder.acceptanceConfig?.phases && (
                                  <div className="space-y-2 pt-2 border-t dark:border-white/5">
                                      {selectedOrder.acceptanceConfig.phases.map(p => (
                                          <div key={p.id} className="flex justify-between items-center text-[11px]">
                                              <span className="text-gray-500">{p.name} ({p.percentage}%)</span>
                                              {p.status === 'Accepted' ? 
                                                <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已完成</span> :
                                                <span className="text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3"/> 待验收</span>
                                              }
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Invoice Details */}
                      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Receipt className="w-4 h-4"/> 开票明细</h4>
                          {selectedOrder.invoiceInfo ? (
                              <div className="space-y-4">
                                  <div className="p-4 bg-blue-50/50 dark:bg-blue-900/5 rounded-2xl border border-blue-100 dark:border-blue-900/10">
                                      <div className="text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold mb-1">发票抬头</div>
                                      <div className="text-gray-900 dark:text-white text-sm font-bold">{selectedOrder.invoiceInfo.title}</div>
                                  </div>
                                  <div className="space-y-2.5 px-1 text-sm">
                                      <div className="flex justify-between">
                                          <span className="text-gray-500 text-xs">纳税人识别号</span>
                                          <span className="font-mono text-xs dark:text-white">{selectedOrder.invoiceInfo.taxId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-gray-500 text-xs">发票类型</span>
                                          <span className="text-xs dark:text-white">增值税专用发票</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-gray-500 text-xs">开户行</span>
                                          <span className="text-xs dark:text-white">{selectedOrder.invoiceInfo.bankName || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-gray-500 text-xs">银行账号</span>
                                          <span className="font-mono text-xs dark:text-white">{selectedOrder.invoiceInfo.accountNumber || '-'}</span>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-10 text-gray-400 italic text-xs">
                                  <FileText className="w-8 h-8 mb-2 opacity-20"/>
                                  暂无开票信息
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                  {/* Full Customer Info - Updated to use Snapshot data */}
                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">客户档案档案</h4>
                      
                      <div className="space-y-4">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0">
                                  {fullCustomer?.logo ? (
                                      <img src={fullCustomer.logo} className="w-full h-full object-cover rounded-2xl" alt="" />
                                  ) : (
                                      <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                  )}
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{selectedOrder.customerName}</div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                      {selectedOrder.customerIndustry || '行业未知'} · {selectedOrder.customerType || '类型未知'}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">客户编码</span>
                                  <span className="font-mono text-gray-700 dark:text-gray-300">{selectedOrder.customerId}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">客户等级</span>
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedOrder.customerLevel || '-'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200 dark:border-white/10">
                                  <span className="text-gray-500">所在区域</span>
                                  <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {selectedOrder.customerRegion || '未知'}
                                  </span>
                              </div>
                          </div>

                          <button onClick={() => navigate(`/customers/${selectedOrder.customerId}`)} className="w-full py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                              查看最新完整档案
                          </button>
                      </div>
                  </div>

                  {/* Business Overview */}
                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">业务归属</h4>
                      <div className="space-y-4">
                          <div>
                              <div className="text-[10px] text-gray-400 uppercase font-bold">销售负责人</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mt-1.5">
                                  <UserIcon className="w-4 h-4 text-blue-500" /> {selectedOrder.salesRepName || '未分配'}
                              </div>
                          </div>
                          <div>
                              <div className="text-[10px] text-gray-400 uppercase font-bold">商务经理</div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mt-1.5">
                                  <Briefcase className="w-4 h-4 text-orange-500" /> 王强
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><History className="w-4 h-4"/> 流转日志</h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                          {selectedOrder.approvalRecords.map((log, idx) => (
                              <div key={idx} className="relative pl-4 border-l border-gray-100 dark:border-white/10 pb-4 last:pb-0">
                                  <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-indigo-500"></div>
                                  <div className="text-[10px] font-bold dark:text-white">{log.actionType}</div>
                                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">{new Date(log.timestamp).toLocaleString()}</div>
                                  <div className="text-[10px] text-gray-500 mt-1">{log.operatorName}: {log.comment}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- Action Drawer --- */}
      {activeStepModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseDrawer}></div>
              <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {activeStepModal === 'REFUND_REQUEST' ? '发起退款申请' : `${steps.find(s => s.id === activeStepModal)?.label || '步骤'}处理`}
                      </h3>
                      <button onClick={handleCloseDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {activeStepModal === 'APPROVAL' && (
                          <div className="space-y-6">
                               <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/20 text-xs text-yellow-700 dark:text-yellow-400">
                                   请按顺序完成以下审批。财务审批通过后，订单将进入确认阶段。
                               </div>
                               
                               {/* Sales Approval Node */}
                               <div className={`p-4 rounded-2xl border transition-all ${selectedOrder.approval.salesApproved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white border-gray-200 dark:bg-black dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">1. 销售审批</div>
                                       {selectedOrder.approval.salesApproved ? <CheckCircle className="w-5 h-5 text-green-600"/> : <span className="text-xs text-orange-500 font-bold">待处理</span>}
                                   </div>
                                   {!selectedOrder.approval.salesApproved && (
                                       <div className="space-y-3">
                                           <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => handleApproveAction('sales', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => handleApproveAction('sales', 'Approve')} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs transition">同意</button>
                                           </div>
                                       </div>
                                   )}
                                   {selectedOrder.approval.salesApproved && <div className="text-xs text-gray-500">已于 {new Date(selectedOrder.approval.salesApprovedDate!).toLocaleString()} 通过</div>}
                               </div>

                               {/* Business Approval Node */}
                               <div className={`p-4 rounded-2xl border transition-all ${selectedOrder.approval.businessApproved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : (selectedOrder.approval.salesApproved ? 'bg-white border-gray-200 dark:bg-black dark:border-white/10' : 'opacity-50 bg-gray-50 dark:bg-white/5 border-gray-200')}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">2. 商务审批</div>
                                       {selectedOrder.approval.businessApproved ? <CheckCircle className="w-5 h-5 text-green-600"/> : (selectedOrder.approval.salesApproved ? <span className="text-xs text-orange-500 font-bold">待处理</span> : <Lock className="w-4 h-4 text-gray-400"/>)}
                                   </div>
                                   {selectedOrder.approval.salesApproved && !selectedOrder.approval.businessApproved && (
                                       <div className="space-y-3">
                                           <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => handleApproveAction('business', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => handleApproveAction('business', 'Approve')} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs transition">同意</button>
                                           </div>
                                       </div>
                                   )}
                                   {selectedOrder.approval.businessApproved && <div className="text-xs text-gray-500">已于 {new Date(selectedOrder.approval.businessApprovedDate!).toLocaleString()} 通过</div>}
                               </div>

                               {/* Finance Approval Node */}
                               <div className={`p-4 rounded-2xl border transition-all ${selectedOrder.approval.financeApproved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : (selectedOrder.approval.businessApproved ? 'bg-white border-gray-200 dark:bg-black dark:border-white/10' : 'opacity-50 bg-gray-50 dark:bg-white/5 border-gray-200')}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">3. 财务审批</div>
                                       {selectedOrder.approval.financeApproved ? <CheckCircle className="w-5 h-5 text-green-600"/> : (selectedOrder.approval.businessApproved ? <span className="text-xs text-orange-500 font-bold">待处理</span> : <Lock className="w-4 h-4 text-gray-400"/>)}
                                   </div>
                                   {selectedOrder.approval.businessApproved && !selectedOrder.approval.financeApproved && (
                                       <div className="space-y-3">
                                           <textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => handleApproveAction('finance', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => handleApproveAction('finance', 'Approve')} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs transition">同意</button>
                                           </div>
                                       </div>
                                   )}
                                   {selectedOrder.approval.financeApproved && <div className="text-xs text-gray-500">已于 {new Date(selectedOrder.approval.financeApprovedDate!).toLocaleString()} 通过</div>}
                               </div>
                          </div>
                      )}
                      {activeStepModal === 'CONFIRM' && (
                          <div className="space-y-6 text-center py-10">
                              <CheckSquare className="w-16 h-16 text-blue-500 mx-auto" />
                              <h4 className="text-lg font-bold dark:text-white">确认订单转备货</h4>
                              <p className="text-sm text-gray-500">确认后，系统将通知交付中心开始准备安装包与授权光盘。</p>
                              <button onClick={handleConfirmOrder} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold shadow-xl">确认并启动备货</button>
                          </div>
                      )}
                      {activeStepModal === 'STOCK_PREP' && (
                          <div className="space-y-6">
                               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-xl border border-blue-100 dark:border-blue-900/30">
                                   请依次完成以下备货环节。光盘刻录需在安装包确认后进行。
                               </div>

                               {/* 1. Authorization Confirmation */}
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isAuthConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4"/> 授权确认</div>
                                       {selectedOrder.isAuthConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isAuthConfirmed && (
                                       <>
                                           <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg text-xs mb-3 border border-gray-100 dark:border-white/5 space-y-1">
                                               {selectedOrder.items.slice(0, 3).map((item, i) => (
                                                   <div key={i} className="flex justify-between text-gray-600 dark:text-gray-400">
                                                       <span className="truncate w-2/3">{item.productName}</span>
                                                       <span>x{item.quantity}</span>
                                                   </div>
                                               ))}
                                               {selectedOrder.items.length > 3 && <div className="text-gray-400 italic">...等共 {selectedOrder.items.length} 项</div>}
                                           </div>
                                           <button onClick={() => handlePreviewAuth(selectedOrder.items[0])} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1">
                                               <Eye className="w-3.5 h-3.5"/> 生成并预览授权证书
                                           </button>
                                       </>
                                   )}
                               </div>

                               {/* 2. Package Confirmation */}
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isPackageConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4"/> 安装包核验</div>
                                       {selectedOrder.isPackageConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isPackageConfirmed && (
                                       <button onClick={() => handleStockAction('package')} className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition">确认安装包就绪</button>
                                   )}
                               </div>

                               {/* 3. Shipping Bill Confirmation */}
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isShippingConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Truck className="w-4 h-4"/> 快递单确认</div>
                                       {selectedOrder.isShippingConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isShippingConfirmed && (
                                       <div className="space-y-3">
                                           <input placeholder="快递服务商 (如: 顺丰)" value={shippingCarrier} onChange={e => setShippingCarrier(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dark:text-white" />
                                           <input placeholder="物流单号" value={shippingTracking} onChange={e => setShippingTracking(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono dark:text-white" />
                                           <button onClick={() => handleStockAction('shipping_confirm')} className="w-full py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-100 transition">保存并确认物流信息</button>
                                       </div>
                                   )}
                                   {selectedOrder.isShippingConfirmed && (
                                       <div className="text-xs text-gray-600 dark:text-gray-400">{selectedOrder.carrier}: {selectedOrder.trackingNumber}</div>
                                   )}
                               </div>

                               {/* 4. CD Burning (Dependent) */}
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isCDBurned ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : !selectedOrder.isPackageConfirmed ? 'opacity-50 grayscale bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/5' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Disc className="w-4 h-4"/> 光盘刻录</div>
                                       {selectedOrder.isCDBurned && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isCDBurned && (
                                       <button 
                                          onClick={() => handleStockAction('cd')} 
                                          disabled={!selectedOrder.isPackageConfirmed}
                                          className="w-full py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 disabled:cursor-not-allowed transition"
                                       >
                                           {selectedOrder.isPackageConfirmed ? '完成刻录' : '等待安装包确认...'}
                                       </button>
                                   )}
                               </div>

                               {/* Final Complete Button */}
                               {selectedOrder.isAuthConfirmed && selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isShippingConfirmed && (
                                   <button 
                                      onClick={handleStockComplete} 
                                      className="w-full py-4 bg-[#0071E3] dark:bg-[#0A84FF] text-white rounded-full font-bold shadow-lg animate-pulse hover:opacity-80 transition mt-4"
                                   >
                                       备货状态更新为：已备货完成
                                   </button>
                               )}
                          </div>
                      )}
                      {activeStepModal === 'PAYMENT' && (
                          <div className="space-y-6">
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-blue-700">
                                  <div className="text-[10px] font-bold uppercase mb-1">应收账款</div>
                                  <div className="text-2xl font-bold font-mono">¥{selectedOrder.total.toLocaleString()}</div>
                              </div>
                              <div className="space-y-4">
                                  <input placeholder="收款银行" value={paymentForm.bankName} onChange={e=>setPaymentForm({...paymentForm, bankName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-transparent dark:border-white/10 dark:text-white text-sm" />
                                  <input placeholder="交易流水号" value={paymentForm.transactionId} onChange={e=>setPaymentForm({...paymentForm, transactionId:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-transparent dark:border-white/10 dark:text-white text-sm font-mono" />
                              </div>
                              <button onClick={handleConfirmPayment} className="w-full py-4 bg-green-500 text-white rounded-full font-bold shadow-lg hover:opacity-80 transition mt-6">确认到账</button>
                          </div>
                      )}
                      {activeStepModal === 'SHIPPING' && (
                          <div className="space-y-6 text-center py-6">
                               <Truck className="w-12 h-12 text-blue-500 mx-auto" />
                               <div className="space-y-2 text-left bg-gray-50 dark:bg-white/10 p-4 rounded-2xl text-xs">
                                   <div className="flex justify-between"><span>财务状态</span><span className={selectedOrder.isPaid ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{selectedOrder.isPaid ? '已结清' : '未支付'}</span></div>
                                   <div className="flex justify-between"><span>备货状态</span><span className={(selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isAuthConfirmed && selectedOrder.isShippingConfirmed) ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>{(selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isAuthConfirmed && selectedOrder.isShippingConfirmed) ? '已备货' : '备货中'}</span></div>
                               </div>
                               <button 
                                  onClick={handleShipOrder} 
                                  disabled={!selectedOrder.isPaid || !selectedOrder.isPackageConfirmed || !selectedOrder.isCDBurned || !selectedOrder.isAuthConfirmed || !selectedOrder.isShippingConfirmed} 
                                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
                               >
                                  确认执行发货
                               </button>
                          </div>
                      )}
                      {activeStepModal === 'ACCEPTANCE' && (
                          <div className="space-y-6">
                               <div className="text-center">
                                   <ClipboardCheck className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                                   <h4 className="font-bold dark:text-white">验收环节确认</h4>
                               </div>
                               
                               {/* Mock Upload Section */}
                               <div className="p-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition" onClick={handleUploadAcceptanceDoc}>
                                   <UploadCloud className="w-6 h-6 text-gray-400" />
                                   <span className="text-xs text-gray-500">点击上传已签署的验收单 (PDF/IMG)</span>
                               </div>

                               <div className="space-y-3">
                                   {selectedOrder.acceptanceConfig?.phases.map(p => (
                                       <div key={p.id} className="p-4 border dark:border-white/10 rounded-2xl flex justify-between items-center bg-white dark:bg-black/20">
                                           <div>
                                               <div className="text-sm font-bold dark:text-white">{p.name} ({p.percentage}%)</div>
                                               <div className="text-[10px] text-gray-500 mt-0.5">金额: ¥{p.amount.toLocaleString()}</div>
                                           </div>
                                           {p.status === 'Accepted' ? (
                                               <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已验收</span>
                                           ) : (
                                               <button onClick={() => handleAcceptPhase(p.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition">通过验收</button>
                                           )}
                                       </div>
                                   ))}
                               </div>
                               
                               <button 
                                  onClick={handleCompleteAcceptance} 
                                  className="w-full py-4 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-700 transition mt-4"
                               >
                                  确认完成验收
                               </button>
                          </div>
                      )}
                      {activeStepModal === 'REFUND_REQUEST' && (
                          <div className="space-y-6">
                              <div className="text-center">
                                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                                      <AlertOctagon className="w-6 h-6 text-red-500" />
                                  </div>
                                  <h4 className="font-bold dark:text-white text-lg">申请退款</h4>
                                  <p className="text-xs text-gray-500 mt-1">请填写退款原因及金额，提交后需经过财务审批。</p>
                              </div>
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">退款原因</label>
                                      <textarea 
                                          className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-100 dark:text-white"
                                          rows={3}
                                          placeholder="例如：客户需求变更、产品质量问题..."
                                          value={refundReason}
                                          onChange={e => setRefundReason(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">退款金额 (最大 ¥{selectedOrder.total.toLocaleString()})</label>
                                      <input 
                                          type="number"
                                          className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none font-bold focus:ring-2 focus:ring-red-100 dark:text-white"
                                          value={refundAmount}
                                          onChange={e => setRefundAmount(Math.min(Number(e.target.value), selectedOrder.total))}
                                      />
                                  </div>
                              </div>
                              <button 
                                  onClick={handleRefundSubmit} 
                                  className="w-full py-4 bg-red-600 text-white rounded-full font-bold shadow-lg hover:bg-red-700 transition"
                              >
                                  提交退款申请
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* License Cert Drawer */}
      {selectedCertificateItem && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isCertDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseCertDrawer}></div>
              <div className={`relative w-full max-w-4xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isCertDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                   {/* Cert Header */}
                   <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center print:hidden bg-white dark:bg-white/5">
                       <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                           <Award className="w-5 h-5 text-orange-500"/> {isCertPreviewMode ? '授权证书预览与确认' : '软件授权证书'}
                       </h3>
                       <div className="flex gap-2">
                           {!isCertPreviewMode && (
                               <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition"><Printer className="w-4 h-4"/> 打印证书</button>
                           )}
                           <button onClick={handleCloseCertDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
                       </div>
                   </div>
                   
                   {/* Cert Content */}
                   <div className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-black/50">
                        {/* Certificate Paper */}
                        <div id="cert-content" className="relative bg-white text-gray-900 border-[12px] border-white shadow-xl mx-auto max-w-[800px] p-12 min-h-[1000px]">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                                <ShieldCheck className="w-[500px] h-[500px]" />
                            </div>
                            
                            <div className="relative z-10 text-center space-y-10">
                                 <div className="flex flex-col items-center gap-3">
                                     <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black italic shadow-lg">W</div>
                                     <div className="text-xs font-bold tracking-[0.3em] text-blue-600 uppercase">WPS Enterprise Systems</div>
                                 </div>
                                 
                                 <div className="space-y-1">
                                    <h2 className="text-4xl font-serif text-gray-900 font-medium tracking-wide">软件产品授权证书</h2>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">Certificate of Software License</div>
                                 </div>

                                 <div className="text-left text-base leading-loose text-gray-700 space-y-8 pt-6 border-t border-gray-100">
                                     <div>
                                         <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">授权用户 (Licensee)</p>
                                         <h3 className="text-2xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500/30 decoration-2">{selectedOrder.customerName}</h3>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 gap-6 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
                                         <div>
                                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">产品名称 (Product)</div>
                                             <div className="text-lg font-bold text-gray-900">{selectedCertificateItem.productName}</div>
                                         </div>
                                         <div>
                                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">规格型号 (SKU)</div>
                                             <div className="text-base font-medium text-gray-900">{selectedCertificateItem.skuName}</div>
                                         </div>
                                         <div>
                                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">授权数量 (Quantity)</div>
                                             <div className="text-base font-mono font-bold text-gray-900">{selectedCertificateItem.quantity}</div>
                                         </div>
                                         <div>
                                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">生效日期 (Date)</div>
                                             <div className="text-base font-mono font-medium text-gray-900">{new Date(selectedOrder.confirmedDate || Date.now()).toLocaleDateString()}</div>
                                         </div>
                                         <div className="col-span-2 pt-2 border-t border-gray-200/50">
                                             <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">授权许可码 (License Key)</div>
                                             <div className="font-mono text-sm text-blue-600 bg-white p-2 rounded border border-blue-100 break-all">
                                                 {selectedCertificateItem.deliveredContent?.[0] || 'PREVIEW-LICENSE-KEY-GENERATED-001'}
                                             </div>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex justify-between items-end pt-12 text-left">
                                     <div className="space-y-1">
                                         <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Authorized Signature</div>
                                         <div className="h-12 w-32 border-b border-gray-300 relative">
                                             <div className="absolute bottom-1 left-0 text-2xl font-serif italic text-blue-800 opacity-80 rotate-[-5deg]">WPS Inc.</div>
                                         </div>
                                         <div className="text-xs font-bold">WPS Systems Ltd.</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="w-20 h-20 border-4 border-blue-600 rounded-full flex items-center justify-center relative rotate-[-12deg] opacity-80 mask-stamp">
                                             <div className="text-[8px] uppercase font-bold tracking-widest text-blue-600 absolute top-2">Official Seal</div>
                                             <ShieldCheck className="w-8 h-8 text-blue-600" />
                                             <div className="text-[8px] uppercase font-bold tracking-widest text-blue-600 absolute bottom-2">Verified</div>
                                         </div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                   </div>

                   {/* Footer Actions for Preview Mode */}
                   {isCertPreviewMode && (
                        <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 shrink-0">
                            <button onClick={handleCloseCertDrawer} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition font-medium">取消</button>
                            <button onClick={() => handleStockAction('auth')} className="px-6 py-2.5 bg-[#0071E3] dark:bg-[#0A84FF] text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#0A84FF]/80 transition shadow-lg font-bold">确认授权无误</button>
                        </div>
                   )}
              </div>
          </div>
      )}

      {/* Fulfillment Modal */}
      {fulfillmentItemIndex !== null && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter border border-white/10">
                  <div className="p-6 border-b dark:border-white/10 flex justify-between items-center"><h3 className="font-bold dark:text-white">配置交付内容</h3><button onClick={() => setFulfillmentItemIndex(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div>
                  <div className="p-6 space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase block">授权码 / 链接 (每行一个)</label>
                      <textarea value={fulfillmentContent} onChange={e => setFulfillmentContent(e.target.value)} placeholder="例如：XXXXX-XXXXX-XXXXX" className="w-full p-4 bg-gray-50 dark:bg-black border border-transparent dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white min-h-[160px] resize-none font-mono" />
                      <button onClick={saveFulfillment} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold shadow-lg hover:opacity-80 transition">保存</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrderDetails;
