
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, User, Department, Opportunity, OrderItem, ApprovalRecord } from '../types';
import { 
    ArrowLeft, Box, Printer, Award, X, Lock, CheckCircle, Truck, ClipboardCheck, 
    UploadCloud, AlertOctagon, RefreshCcw, Key, Package, Disc, Receipt, FileText, 
    Briefcase, History, Eye, CheckSquare, CreditCard, ShieldCheck, User as UserIcon, Building,
    ChevronRight, AlertCircle, Clock, MapPin, Target
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

const OrderDetails: React.FC<OrderDetailsProps> = ({ orders, setOrders, products, customers, currentUser, users, departments, opportunities }) => {
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
  const [certView, setCertView] = useState<'paper' | 'structured'>('paper');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<OrderItem | null>(null);
  const [isItemDetailsClosing, setIsItemDetailsClosing] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isLogDrawerClosing, setIsLogDrawerClosing] = useState(false);
  
  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');
  const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'SNAPSHOT' | 'FULFILLMENT' | 'EMAIL'>('MANAGEMENT');

  // Step specific forms
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');
  const [paymentForm, setPaymentForm] = useState({ bankName: '', transactionId: '' });
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
      if (location.state && (location.state as { openAction?: string }).openAction) {
          setActiveStepModal((location.state as { openAction?: string }).openAction || null);
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
  const salesUser = users.find(u => u.id === selectedOrder.salesRepId);
  const salesDept = departments.find(d => d.id === salesUser?.departmentId);

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

  const getStepTime = (stepId: string) => {
      const record = selectedOrder.approvalRecords.find(r => {
          if (stepId === 'PAYMENT') return r.actionType === '确认收款' || r.actionType === '支付完成';
          if (stepId === 'APPROVAL') return r.actionType === '财务审批' && r.result === 'Approved';
          if (stepId === 'CONFIRM') return r.actionType === '订单确认';
          if (stepId === 'STOCK_PREP') return r.actionType === '备货完成';
          if (stepId === 'SHIPPING') return r.actionType === '正式发货';
          if (stepId === 'ACCEPTANCE') return r.actionType === '最终验收确认';
          return false;
      });
      return record?.timestamp;
  };

  // Updated Workflow
  let steps = [
      { 
          id: 'PAYMENT', 
          label: '支付', 
          icon: CreditCard, 
          status: selectedOrder.isPaid ? 'Completed' : (![OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(selectedOrder.status) ? 'Current' : 'Locked'),
          completedAt: getStepTime('PAYMENT')
      },
      { 
          id: 'APPROVAL', 
          label: '审批', 
          icon: FileText, 
          status: !selectedOrder.isPaid ? 'Locked' : (selectedOrder.status === OrderStatus.PENDING_APPROVAL ? 'Current' : (['PENDING_CONFIRM', 'PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked')), 
          completedAt: getStepTime('APPROVAL')
      },
      { 
          id: 'CONFIRM', 
          label: '确认', 
          icon: CheckSquare, 
          status: selectedOrder.status === OrderStatus.PENDING_CONFIRM ? 'Current' : (['PROCESSING_PROD', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked'), 
          completedAt: getStepTime('CONFIRM')
      },
      { 
          id: 'STOCK_PREP', 
          label: '备货', 
          icon: Package, 
          status: (selectedOrder.status === OrderStatus.PROCESSING_PROD && isStockReady) ? 'Completed' : (selectedOrder.status === OrderStatus.PROCESSING_PROD ? 'Current' : (['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) ? 'Completed' : 'Locked')), 
          completedAt: getStepTime('STOCK_PREP')
      },
      { 
          id: 'SHIPPING', 
          label: '发货', 
          icon: Truck, 
          status: selectedOrder.status === OrderStatus.SHIPPED || selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : (selectedOrder.status === OrderStatus.PROCESSING_PROD && isStockReady ? 'Current' : 'Locked'), 
          completedAt: getStepTime('SHIPPING')
      },
      { 
          id: 'ACCEPTANCE', 
          label: '验收', 
          icon: ClipboardCheck, 
          status: selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : (selectedOrder.status === OrderStatus.SHIPPED ? 'Current' : 'Locked'), 
          completedAt: getStepTime('ACCEPTANCE')
      },
  ].map(s => ({ ...s, disabled: s.status === 'Locked' }));

  if (selectedOrder.buyerType === 'SelfDeal') {
      steps = [
          { 
              id: 'PAYMENT', 
              label: '支付', 
              icon: CreditCard, 
              status: selectedOrder.isPaid ? 'Completed' : 'Current',
              completedAt: getStepTime('PAYMENT')
          },
          {
              id: 'COMPLETED',
              label: '交易完成',
              icon: CheckCircle,
              status: selectedOrder.status === OrderStatus.DELIVERED ? 'Completed' : 'Locked',
              completedAt: selectedOrder.status === OrderStatus.DELIVERED ? selectedOrder.date : undefined
          }
      ].map(s => ({ ...s, disabled: s.status === 'Locked' }));
  }

  // ... (Handlers same as before, simplified for brevity in this response but kept in full file content) ...
  // [Full handlers code from previous OrderDetails.tsx is preserved]
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
          const updatedItems = selectedOrder.items.map(item => ({
              ...item,
              deliveredContent: [`LICENSE-${Date.now()}-${Math.floor(Math.random()*1000)}`] 
          }));
          updateOrder({
              ...selectedOrder,
              isPaid: true,
              status: OrderStatus.DELIVERED,
              paymentDate: new Date().toISOString(),
              paymentRecord,
              items: updatedItems,
              shippedDate: new Date().toISOString(),
              isAuthConfirmed: true, isPackageConfirmed: true, isCDBurned: true, isShippingConfirmed: true,
              approval: { salesApproved: true, businessApproved: true, financeApproved: true },
              approvalRecords: [
                  createOperationRecord('支付完成', 'Paid', `流水号: ${paymentForm.transactionId}`),
                  createOperationRecord('系统交付', 'Completed', '自助订单自动完成交付')
              , ...selectedOrder.approvalRecords]
          });
      } else {
          updateOrder({
              ...selectedOrder,
              isPaid: true,
              status: OrderStatus.PENDING_APPROVAL,
              paymentDate: new Date().toISOString(),
              paymentRecord,
              approvalRecords: [createOperationRecord('确认收款', 'Paid', `流水号: ${paymentForm.transactionId}`), ...selectedOrder.approvalRecords]
          });
      }
      handleCloseDrawer();
  };

  const handleApproveAction = (role: 'sales' | 'finance' | 'business', action: 'Approve' | 'Reject') => {
      if (action === 'Reject') {
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
          nextStatus = OrderStatus.PENDING_CONFIRM;
      }
      updateOrder({
          ...selectedOrder,
          status: nextStatus,
          approval: newApproval,
          approvalRecords: [createOperationRecord(actionName, 'Approved', approvalComment || '同意'), ...selectedOrder.approvalRecords]
      });
      setApprovalComment('');
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
      updateOrder({ 
          ...selectedOrder, 
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
      if (!refundReason) return alert("请填写退单原因");
      updateOrder({
          ...selectedOrder,
          status: OrderStatus.REFUND_PENDING,
          refundReason,
          refundAmount,
          approvalRecords: [createOperationRecord('发起退单', 'Requested', `原因: ${refundReason}, 金额: ¥${refundAmount}`), ...selectedOrder.approvalRecords]
      });
      handleCloseDrawer();
  };

  const handleUploadAcceptanceDoc = () => {
      alert("验收单模拟上传成功！");
  };

  const handleCloseDrawer = () => { setIsDrawerClosing(true); setTimeout(() => { setActiveStepModal(null); setIsDrawerClosing(false); }, 280); };
  
  const handleOpenLogDrawer = () => { setIsLogDrawerOpen(true); };
  const handleCloseLogDrawer = () => { setIsLogDrawerClosing(true); setTimeout(() => { setIsLogDrawerOpen(false); setIsLogDrawerClosing(false); }, 280); };

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

  const getApproverDisplay = (role: 'Sales' | 'Business' | 'Finance') => {
      const record = selectedOrder.approvalRecords.find(r => {
          const type = r.actionType;
          const matchSales = (type.includes('Sales') || type.includes('销售')) && role === 'Sales';
          const matchBiz = (type.includes('Business') || type.includes('商务')) && role === 'Business';
          const matchFin = (type.includes('Finance') || type.includes('财务')) && role === 'Finance';
          return (matchSales || matchBiz || matchFin) && r.result === 'Approved';
      });

      if (!record) {
          const date = role === 'Sales' ? selectedOrder.approval.salesApprovedDate 
                     : role === 'Business' ? selectedOrder.approval.businessApprovedDate 
                     : selectedOrder.approval.financeApprovedDate;
          if (!date) return null;
          return <div className="text-xs text-gray-500 mt-2">已于 {new Date(date).toLocaleString()} 通过 (系统自动)</div>;
      }

      const user = users.find(u => u.id === record.operatorId);

      return (
          <div className="mt-3 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 p-2.5 rounded-xl border border-green-100 dark:border-green-900/20">
              <div className="flex items-center gap-2.5">
                  <img 
                      src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${record.operatorName}`} 
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1C1C1E] shadow-sm bg-gray-100" 
                      alt="" 
                  />
                  <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          {record.operatorName} 
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(record.timestamp).toLocaleString()}</div>
                  </div>
              </div>
              <div className="text-green-600 dark:text-green-400 bg-white dark:bg-black/20 p-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
              </div>
          </div>
      );
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
               <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
               <div className="flex flex-col min-w-0">
                   <div className="flex items-center gap-3">
                       <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">订单 {selectedOrder.id}</h1>
                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                           selectedOrder.status === OrderStatus.REFUND_PENDING ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                       }`}>{statusMap[selectedOrder.status] || selectedOrder.status}</span>
                   </div>
                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px] md:max-w-none flex items-center gap-2">
                       <span>{selectedOrder.customerName}</span>
                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                       <span className="font-mono">{new Date(selectedOrder.date).toLocaleDateString()}</span>
                   </div>
               </div>
               
               <div className="hidden lg:flex items-center gap-6 ml-4 border-l border-gray-200 dark:border-white/10 pl-6">
                   <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-white/10">
                           <img src={users.find(u => u.id === selectedOrder.salesRepId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.salesRepName || 'Sales'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold">销售负责人</div>
                           <div className="text-xs font-bold text-gray-900 dark:text-white">{selectedOrder.salesRepName || '未分配'}</div>
                       </div>
                   </div>
                   <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-white/10">
                           <img src={users.find(u => u.id === selectedOrder.businessManagerId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.businessManagerName || 'Business'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold">商务经理</div>
                           <div className="text-xs font-bold text-gray-900 dark:text-white">{selectedOrder.businessManagerName || '未分配'}</div>
                       </div>
                   </div>
               </div>
           </div>
           <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end shrink-0">
               <div className="text-right block bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                   <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">应收总额</div>
                   <div className="text-xl font-bold text-orange-600 dark:text-orange-400 font-mono tracking-tight">¥{selectedOrder.total.toLocaleString()}</div>
               </div>
               <div className="flex gap-2 shrink-0">
                   <button 
                       onClick={handleOpenLogDrawer}
                       className="unified-button-secondary whitespace-nowrap shrink-0"
                   >
                       <History className="w-3.5 h-3.5"/> 日志
                   </button>
                   {selectedOrder.isPaid && selectedOrder.status !== OrderStatus.REFUND_PENDING && selectedOrder.status !== OrderStatus.REFUNDED && selectedOrder.status !== OrderStatus.CANCELLED && (
                       <button 
                           onClick={() => setActiveStepModal('REFUND_REQUEST')} 
                           className="unified-button-secondary !text-red-600 !border-red-200 dark:!border-red-900/30 whitespace-nowrap shrink-0"
                       >
                           <AlertOctagon className="w-3.5 h-3.5"/> 退单
                       </button>
                   )}
                   
               </div>
           </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10 px-4 md:px-10 shrink-0 sticky top-[73px] md:top-[81px] z-10">
           <div className="flex gap-8 overflow-x-auto no-scrollbar">
               {[
                   { id: 'MANAGEMENT', label: '订单管理' },
                   { id: 'SNAPSHOT', label: '订单快照' },
                   { id: 'FULFILLMENT', label: '订单交付' },
                   { id: 'EMAIL', label: '发货邮件' },
               ].map(tab => (
                   <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as 'MANAGEMENT' | 'SNAPSHOT' | 'FULFILLMENT' | 'EMAIL')}
                       className={`py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                           activeTab === tab.id 
                           ? 'border-[#0071E3] text-[#0071E3] dark:border-[#0A84FF] dark:text-[#0A84FF]' 
                           : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                       }`}
                   >
                       {tab.label}
                   </button>
               ))}
           </div>
      </div>

      <div className="p-4 lg:p-10 max-w-[2400px] mx-auto w-full space-y-8 animate-fade-in pb-32">
          {activeTab === 'MANAGEMENT' && (
            <>
              {/* Stepper */}
              <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-x-auto">
             <div className="flex justify-between items-start relative min-w-[700px]">
                 <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full overflow-hidden">
                     {/* Progress bar logic could be added here for precise width */}
                 </div>
                 {steps.map((step, idx) => (
                    <div 
                        key={step.id} 
                        onClick={() => !step.disabled && setActiveStepModal(step.id)} 
                        className={`flex flex-col items-center gap-3 relative z-10 flex-1 transition-all group ${
                            step.disabled 
                            ? 'opacity-40 grayscale cursor-not-allowed' 
                            : 'cursor-pointer hover:scale-105'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                            step.status === 'Completed' ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20' : 
                            step.status === 'Current' ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-8 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110' : 
                            'bg-white dark:bg-[#2C2C2E] border-2 border-gray-200 dark:border-gray-600 text-gray-400'
                        }`}>
                            {step.status === 'Locked' ? <Lock className="w-5 h-5" /> : <step.icon className="w-6 h-6" />}
                        </div>
                        <div className="text-center">
                            <div className={`text-sm font-bold ${step.status === 'Completed' ? 'text-green-600' : step.status === 'Current' ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400'}`}>{step.label}</div>
                            {step.completedAt && (
                                <div className="text-[9px] text-gray-400 font-mono mt-0.5 whitespace-nowrap">
                                    {new Date(step.completedAt).toLocaleDateString()} {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            {step.status === 'Current' && <div className="text-[10px] text-white bg-[#0071E3] dark:bg-[#0A84FF] px-2 py-0.5 rounded-full font-bold shadow-md mt-1 animate-bounce">点击处理</div>}
                            {step.status === 'Completed' && <div className="text-[9px] text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">查看信息</div>}
                        </div>
                    </div>
                 ))}
             </div>
          </div>

          {/* Order Items Table (Full Width) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
              <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">订单商品明细</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                          <tr>
                              <th className="p-8 pl-10">商品与规格</th>
                              <th className="p-8">授权类型</th>
                              <th className="p-8 text-center">数量</th>
                              <th className="p-8 text-right">单价/小计</th>
                              <th className="p-8">电子授权</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {selectedOrder.items.map((item, idx) => (
                              <tr 
                                key={idx} 
                                className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => setSelectedItemForDetails(item)}
                              >
                                  <td className="p-8 pl-10">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.productId}`); }}
                                        className="font-bold text-gray-900 dark:text-white hover:text-[#0071E3] dark:hover:text-[#0A84FF] hover:underline text-left text-base"
                                      >
                                          {item.productName}
                                      </button>
                                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                          <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-mono">{item.skuCode}</span>
                                          <span>{item.skuName}</span>
                                      </div>
                                  </td>
                                  <td className="p-8">
                                      <span className="text-gray-600 dark:text-gray-400 font-medium">{item.pricingOptionName || item.licenseType || '正式授权'}</span>
                                  </td>
                                  <td className="p-8 text-center dark:text-white font-medium text-lg">x {item.quantity}</td>
                                  <td className="p-8 text-right">
                                      <div className="text-xs text-gray-400">¥{item.priceAtPurchase.toLocaleString()}</div>
                                      <div className="font-bold dark:text-white text-lg">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</div>
                                  </td>
                                  <td className="p-8">
                                      {selectedOrder.isPaid && selectedOrder.confirmedDate && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedCertificateItem(item); setIsCertPreviewMode(true); }} 
                                            className="text-xs font-bold text-[#0071E3] hover:text-blue-700 dark:text-[#0A84FF] hover:underline flex items-center gap-1"
                                          >
                                              <Award className="w-3.5 h-3.5"/> 电子授权
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-end">
                  <div className="w-full max-w-sm space-y-3 text-sm">
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>产品总金额</span>
                          <span className="font-mono">¥{selectedOrder.items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>优惠折扣</span>
                          <span className="font-mono">100%</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>返利折扣</span>
                          <span className="font-mono">0%</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>优惠金额</span>
                          <span className="font-mono">- ¥0</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                          <span className="font-bold text-gray-900 dark:text-white">订单实付金额</span>
                          <span className="font-bold text-xl text-[#0071E3] dark:text-[#0A84FF] font-mono">¥{selectedOrder.total.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Customer & Business Info (Medium - 2/3) */}
              <div className="md:col-span-2 bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Building className="w-5 h-5 text-[#0071E3]" /> 客户及业务信息
                      </h4>
                      <button onClick={() => navigate(`/customers/${selectedOrder.customerId}`)} className="text-xs font-bold text-[#0071E3] hover:underline flex items-center gap-1">
                          查看完整档案 <ChevronRight className="w-3 h-3"/>
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {[
                          { label: '买方名称', value: selectedOrder.buyerName },
                          { label: '直接下级渠道', value: selectedOrder.directChannel },
                          { label: '终端渠道', value: selectedOrder.terminalChannel },
                          { label: '订单类型', value: selectedOrder.orderType },
                          { label: '制单人员', value: selectedOrder.creatorName },
                          { label: '制单人员电话', value: selectedOrder.creatorPhone },
                          { label: '客户名称', value: selectedOrder.customerName },
                          { label: '企业ID', value: selectedOrder.items[0]?.enterpriseId || '-' },
                          { label: '行业条线', value: selectedOrder.industryLine },
                          { label: '客户类型', value: selectedOrder.customerType === 'Enterprise' ? '央企' : selectedOrder.customerType },
                          { label: '所在省份', value: selectedOrder.province },
                          { label: '报备标签', value: selectedOrder.reportTag },
                          { label: '所在城市', value: selectedOrder.city },
                          { label: '所在区县', value: selectedOrder.district },
                          { label: '卖方名称', value: selectedOrder.sellerName },
                          { label: '卖方业务联系人', value: selectedOrder.sellerContact },
                          { label: '新老客户', value: selectedOrder.customerStatus },
                          { label: '渠道是否提供服务', value: selectedOrder.channelService },
                      ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-4 py-1">
                              <span className="text-gray-400 text-sm min-w-[120px] shrink-0">{item.label}:</span>
                              <span className="text-gray-900 dark:text-white text-sm font-medium">{item.value || '-'}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Opportunity Information (Small - 1/3) */}
              {selectedOrder.opportunityId && (
                  <div className="md:col-span-1 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4 text-orange-500"/> 商机信息</h4>
                      {(() => {
                          const opp = opportunities.find(o => o.id === selectedOrder.opportunityId);
                          if (!opp) return null;
                          return (
                              <div className="space-y-4">
                                  <div className="p-4 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-transparent rounded-2xl border border-orange-100 dark:border-orange-900/10">
                                      <div className="text-orange-600 dark:text-orange-400 text-[10px] uppercase font-bold mb-1">商机名称</div>
                                      <div className="text-gray-900 dark:text-white text-sm font-bold truncate" title={opp.name}>{opp.name}</div>
                                      <div className="text-[10px] text-gray-400 font-mono mt-1">CRM ID: {opp.crmId || opp.id}</div>
                                  </div>
                                  
                                  <div className="space-y-3 px-1">
                                      <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                          <span className="text-gray-400 text-[10px] uppercase font-bold">商机阶段</span>
                                          <span className="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                              {opp.stage === 'Negotiation' ? '商务洽谈' : 
                                               opp.stage === 'Qualification' ? '资格确定' :
                                               opp.stage === 'Proposal' ? '方案建议' :
                                               opp.stage === 'Closed Won' ? '已赢单' :
                                               opp.stage === 'Closed Lost' ? '已输单' : opp.stage}
                                          </span>
                                      </div>
                                      <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                          <span className="text-gray-400 text-[10px] uppercase font-bold">商机金额</span>
                                          <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">¥{(opp.amount || opp.expectedRevenue).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                          <span className="text-gray-400 text-[10px] uppercase font-bold">结单日期</span>
                                          <span className="text-sm font-medium dark:text-white font-mono">{opp.closeDate}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              )}

              {/* Invoice Details (Small - 1/3) */}
              <div className="md:col-span-1 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Receipt className="w-4 h-4"/> 开票明细</h4>
                  {selectedOrder.invoiceInfo ? (
                      <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-transparent rounded-2xl border border-blue-100 dark:border-blue-900/10">
                              <div className="text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold mb-1">发票抬头</div>
                              <div className="text-gray-900 dark:text-white text-sm font-bold">{selectedOrder.invoiceInfo.title}</div>
                          </div>
                          <div className="space-y-3 px-1 text-sm">
                              <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                  <span className="text-gray-500 text-xs">纳税人识别号</span>
                                  <span className="font-mono text-xs dark:text-white font-medium">{selectedOrder.invoiceInfo.taxId}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-50 dark:border-white/5 pb-2">
                                  <span className="text-gray-500 text-xs">发票类型</span>
                                  <span className="text-xs dark:text-white font-medium">增值税专用发票</span>
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

              {/* Original Order Numbers (Small - 1/3) */}
              <div className="md:col-span-1 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><History className="w-4 h-4"/> 订单原订单编号</h4>
                  <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-transparent rounded-2xl border border-purple-100 dark:border-purple-900/10">
                          <div className="text-purple-600 dark:text-purple-400 text-[10px] uppercase font-bold mb-1">SMS原订单编号</div>
                          <div className="text-gray-900 dark:text-white text-sm font-bold font-mono">{selectedOrder.smsOriginalOrderId || 'S00713162'}</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-transparent rounded-2xl border border-indigo-100 dark:border-indigo-900/10">
                          <div className="text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold mb-1">SaaS原订单编号</div>
                          <div className="text-gray-900 dark:text-white text-sm font-bold font-mono break-all">{selectedOrder.saasOriginalOrderId || 'P20260303195755000001'}</div>
                      </div>
                  </div>
              </div>
            </div>
          </>
        )}

          {activeTab === 'SNAPSHOT' && (
            <div className="space-y-8">
                {/* Basic Info Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6"><FileText className="w-4 h-4"/> 订单基础信息快照</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">订单编号</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">{selectedOrder.id}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">下单时间</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">订单总额</div>
                                <div className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">¥{selectedOrder.total.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">当前状态</div>
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{statusMap[selectedOrder.status]}</div>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">销售负责人</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.salesRepName}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold">商务经理</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.businessManagerName}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6"><Building className="w-4 h-4"/> 客户信息快照</h4>
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">客户名称</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.customerName}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">联系人</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{fullCustomer?.contactPerson || '-'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">联系电话</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">{fullCustomer?.phone || '-'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">收货地址</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{selectedOrder.shippingAddress || '无地址信息'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Snapshot Table */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                        <Package className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">商品明细快照</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-8 pl-10">商品名称</th>
                                    <th className="p-8">规格/SKU</th>
                                    <th className="p-8 text-center">数量</th>
                                    <th className="p-8 text-right">成交单价</th>
                                    <th className="p-8 text-right pr-10">小计</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {selectedOrder.items.map((item, idx) => (
                                    <tr key={idx} className="text-sm">
                                        <td className="p-8 pl-10 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                                        <td className="p-8">
                                            <div className="text-gray-900 dark:text-white font-medium">{item.skuName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-1">{item.skuCode}</div>
                                        </td>
                                        <td className="p-8 text-center font-bold text-gray-900 dark:text-white">x {item.quantity}</td>
                                        <td className="p-8 text-right font-mono text-gray-600 dark:text-gray-400">¥{item.priceAtPurchase.toLocaleString()}</td>
                                        <td className="p-8 text-right pr-10 font-bold text-[#0071E3] dark:text-[#0A84FF] font-mono">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50/30 dark:bg-white/5">
                                <tr>
                                    <td colSpan={4} className="p-8 text-right text-sm font-bold text-gray-500">合计应收金额</td>
                                    <td className="p-8 text-right pr-10 text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">¥{selectedOrder.total.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        <p className="font-bold mb-1">快照说明：</p>
                        <p>订单快照展示的是订单创建时的原始信息。这些信息在订单生效后通常不可变更，用于作为合同执行和财务结算的原始依据。如需修改交付地址或物流信息，请前往“订单交付”页签进行操作。</p>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'FULFILLMENT' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Delivery Info (Medium - 2/3) */}
             <div className="md:col-span-2 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 space-y-5">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Truck className="w-4 h-4"/> 交付信息</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
                         <div>
                             <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">收货单位</div>
                             <div className="text-sm font-medium dark:text-white truncate">{selectedOrder.receivingCompany || '-'}</div>
                         </div>
                         <div>
                             <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">收货地址</div>
                             <div className="text-sm font-medium dark:text-white leading-relaxed line-clamp-2">{selectedOrder.shippingAddress || '无地址信息'}</div>
                         </div>
                     </div>
                     <div className="space-y-4">
                         <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-transparent flex justify-between items-center">
                             <span className="text-gray-400 text-[10px] uppercase font-bold">物流单号</span>
                             <span className="text-sm font-bold dark:text-white font-mono">{selectedOrder.trackingNumber || '-'}</span>
                         </div>
                         <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-transparent flex justify-between items-center">
                             <span className="text-gray-400 text-[10px] uppercase font-bold">发货方式</span>
                             <span className="text-sm font-bold dark:text-white">{selectedOrder.deliveryMethod === 'Online' ? '线上发货' : '线下发货'}</span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Acceptance Information Table (Large - 3/3) */}
             <div className="md:col-span-3 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                     <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                         <ClipboardCheck className="w-5 h-5 text-green-500" />
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white">验收信息</h3>
                     </div>
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                 <tr>
                                     <th className="p-4 pl-8">明细编号</th>
                                     <th className="p-4">产品名称</th>
                                     <th className="p-4">验收方式</th>
                                     <th className="p-4">验收条件</th>
                                     <th className="p-4">预计验收时间</th>
                                     <th className="p-4">验收比例</th>
                                     <th className="p-4 text-right pr-8">验收金额</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                 {selectedOrder.items.map((item, idx) => (
                                     <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                         <td className="p-4 pl-8 font-mono text-gray-500">{idx + 1}</td>
                                         <td className="p-4 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                                         <td className="p-4 text-gray-600 dark:text-gray-300">
                                             {selectedOrder.acceptanceConfig?.type === 'Phased' ? '分期验收' : '一次性验收'}
                                         </td>
                                         <td className="p-4 text-gray-600 dark:text-gray-300">视同验收</td>
                                         <td className="p-4 text-gray-600 dark:text-gray-300">发货后2日</td>
                                         <td className="p-4 text-gray-600 dark:text-gray-300">100%</td>
                                         <td className="p-4 text-right pr-8 font-bold text-gray-900 dark:text-white">
                                             ¥{(item.priceAtPurchase * item.quantity).toLocaleString()}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 </div>
          </div>
        )}

        {activeTab === 'EMAIL' && (
          <div className="bg-white dark:bg-white/5 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden min-h-[800px] p-4 md:p-12">
              <div className="max-w-4xl mx-auto bg-white dark:bg-[#1C1C1E] shadow-2xl rounded-xl overflow-hidden border border-gray-100 dark:border-white/10">
                  {/* Email Header */}
                  <div className="bg-[#F8F9FA] dark:bg-white/5 p-6 border-b dark:border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white">【金山办公】订购服务开通通知</h2>
                          <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">最终用户</span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                  </div>

                  {/* Email Content */}
                  <div className="p-6 md:p-10 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      <div className="space-y-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">发货邮件信息</h3>
                          <p>尊敬的用户： 您好！</p>
                          <p>请查阅贵组织订购信息并按照本邮件中指引操作后开始使用所订购产品/服务</p>
                      </div>

                      <div className="space-y-3 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                          <div className="flex gap-4"><span className="text-gray-400 min-w-[100px]">单位/企业:</span><span className="font-bold text-blue-600 dark:text-blue-400">{selectedOrder.customerName}</span></div>
                          <div className="flex gap-4"><span className="text-gray-400 min-w-[100px]">产品:</span><span className="font-bold text-blue-600 dark:text-blue-400">{selectedOrder.items[0]?.productName}</span></div>
                          <div className="flex gap-4"><span className="text-gray-400 min-w-[100px]">购买套数/用户数:</span><span className="font-bold text-blue-600 dark:text-blue-400">{selectedOrder.items.reduce((sum, i) => sum + i.quantity, 0)}</span></div>
                          <div className="flex gap-4"><span className="text-gray-400 min-w-[100px]">授权类型:</span><span className="font-bold text-blue-600 dark:text-blue-400">用户订阅许可</span></div>
                          <div className="flex gap-4"><span className="text-gray-400 min-w-[100px]">授权时长:</span><span className="font-bold text-blue-600 dark:text-blue-400">{new Date(selectedOrder.date).toLocaleDateString()} 至 {new Date(new Date(selectedOrder.date).setFullYear(new Date(selectedOrder.date).getFullYear() + 1)).toLocaleDateString()}</span></div>
                      </div>

                      <div className="space-y-4">
                          <p className="text-red-600 font-bold">【重要-获取授权信息说明】 欢迎您使用金山办公产品/服务的电子交付，享WPS Office 正版权益。请您按照以下账号、密码或兑换码链接方式获取电子授权信息：</p>
                          <p>您的初始组织名称是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">{selectedOrder.customerName}(企业ID: {selectedOrder.items[0]?.enterpriseId || '658057387'})</span>，登录信息是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">该组织为用户自创建，请用该组织的企业管理员账号登录查看，https://365.wps.cn/home（请您首次登录后尽快修改初始始密码）</span>，请您按照如下操作指引获取贵组织本次所订购产品/服务电子授权信息和安装序列号（如有）、软件安装包（如有）。如前述账号密码信息显示为“无”，请将该链接复制到浏览器中打开 <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">无</span>，该链接将引导您获取所订购产品/服务电子授权信息和安装序列号（如有）、软件安装包（如有）。【升级、增减购、续费订单金山办公会按照订单信息直接在您管理后台增加权益，不再发送兑换码】</p>
                      </div>

                      <div className="space-y-4">
                          <p className="font-bold">获取电子授权的操作步骤指引，详情请阅 <a href="https://365.kdocs.cn/l/cstq9xkV34VW" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.kdocs.cn/l/cstq9xkV34VW</a></p>
                      </div>

                      <div className="pt-8 border-t dark:border-white/10 text-[10px] text-gray-400 space-y-4 italic">
                          <p>*本邮件仅为确认订购信息、交付电子授权的通知函，贵组织具有向本次订购的销售方支付全部款项的义务。本次订购记录以及贵组织对订购产品的全部权益以电子授权页面中显示的信息为准。</p>
                          <p>为便捷用户授权管理，【授权与保障】信息页面会持续升级，您可随时进入金山办公官网 <a href="https://365.wps.cn/authentication/list" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.wps.cn/authentication/list</a> 查看授权信息，并可在有因第三方检查、备案、资产登记等工作需要归档授权信息时，将电子授权信息连同金山办公官网网址一并截图提供。</p>
                      </div>
                  </div>
              </div>
          </div>
        )}

      </div>
    </div>

      {/* --- Log Drawer --- */}
      {isLogDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isLogDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseLogDrawer}></div>
              <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isLogDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-500"/> 订单流转日志
                      </h3>
                      <button onClick={handleCloseLogDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {selectedOrder.approvalRecords.map((log, idx) => (
                          <div key={idx} className="relative pl-6 border-l border-gray-200 dark:border-white/10 pb-6 last:pb-0">
                              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0071E3] border-2 border-white dark:border-[#1C1C1E]"></div>
                              <div className="text-sm font-bold dark:text-white flex justify-between">
                                  <span>{log.actionType}</span>
                                  <span className="text-[10px] text-gray-400 font-normal">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                      <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${log.operatorName}`} className="w-5 h-5 rounded-full" alt="" />
                                      <span className="font-bold text-gray-700 dark:text-gray-300">{log.operatorName}</span>
                                      <span className="text-[10px] text-gray-400 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/5">{log.operatorRole}</span>
                                  </div>
                                  <p className="leading-relaxed">{log.comment || '无备注'}</p>
                                  <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3"/> {log.result}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- Action Drawer --- */}
      {activeStepModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseDrawer}></div>
              <div className={`relative w-full max-w-3xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {activeStepModal === 'REFUND_REQUEST' ? '发起退单申请' : `${steps.find(s => s.id === activeStepModal)?.label || '步骤'}处理`}
                      </h3>
                      <button onClick={handleCloseDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {steps.find(s => s.id === activeStepModal)?.status === 'Completed' && (
                          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center gap-3 text-xs text-gray-500 font-bold">
                              <ShieldCheck className="w-5 h-5 text-green-500" />
                              此步骤已完成，当前为只读模式，无法修改原有信息。
                          </div>
                      )}
                      
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
                                   {selectedOrder.approval.salesApproved && getApproverDisplay('Sales')}
                               </div>
                               {/* ... (Other approval nodes follow similar pattern) ... */}
                               
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
                                   {selectedOrder.approval.businessApproved && getApproverDisplay('Business')}
                               </div>

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
                                   {selectedOrder.approval.financeApproved && getApproverDisplay('Finance')}
                               </div>
                          </div>
                      )}
                      
                      {activeStepModal === 'CONFIRM' && (
                          <div className="space-y-6 text-center py-10">
                              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckSquare className="w-10 h-10 text-blue-500" />
                              </div>
                              <h4 className="text-xl font-bold dark:text-white">确认订单转备货</h4>
                              <p className="text-sm text-gray-500">确认后，系统将通知交付中心开始准备安装包与授权光盘。</p>
                              <button onClick={handleConfirmOrder} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition">确认并启动备货</button>
                          </div>
                      )}

                      {/* Stock Prep and other modals follow consistent styling */}
                      {activeStepModal === 'STOCK_PREP' && (
                          <div className="space-y-6">
                               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-xl border border-blue-100 dark:border-blue-900/30">
                                   请依次完成以下备货环节。光盘刻录需在安装包确认后进行。
                               </div>
                               {/* ... Items ... */}
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isAuthConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4"/> 授权确认</div>
                                       {selectedOrder.isAuthConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isAuthConfirmed && (
                                       <button onClick={() => handlePreviewAuth(selectedOrder.items[0])} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1">
                                           <Eye className="w-3.5 h-3.5"/> 生成并预览授权证书
                                       </button>
                                   )}
                               </div>
                               
                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isPackageConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Package className="w-4 h-4"/> 安装包核验</div>
                                       {selectedOrder.isPackageConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   
                                   <div className="mb-4 overflow-x-auto border border-gray-100 dark:border-white/10 rounded-xl">
                                       <table className="w-full text-left text-xs">
                                           <thead className="bg-gray-50 dark:bg-white/5 text-gray-400 uppercase font-bold">
                                               <tr>
                                                   <th className="p-3">安装包编号</th>
                                                   <th className="p-3">安装包名称</th>
                                                   <th className="p-3">版本</th>
                                                   <th className="p-3">CPU</th>
                                                   <th className="p-3">操作系统</th>
                                                   <th className="p-3">架构</th>
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                               {selectedOrder.items.map(item => {
                                                   const product = products.find(p => p.id === item.productId);
                                                   return product?.installPackages?.map(pkg => (
                                                       <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                           <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{pkg.id}</td>
                                                           <td className="p-3 dark:text-white font-medium">{pkg.name}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.version}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.cpu || '-'}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.os || '-'}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.arch || '-'}</td>
                                                       </tr>
                                                   ));
                                               })}
                                               {selectedOrder.items.every(item => !products.find(p => p.id === item.productId)?.installPackages?.length) && (
                                                   <tr>
                                                       <td colSpan={6} className="p-8 text-center text-gray-400 italic">暂无关联安装包信息</td>
                                                   </tr>
                                               )}
                                           </tbody>
                                       </table>
                                   </div>

                                   {!selectedOrder.isPackageConfirmed && (
                                       <button onClick={() => handleStockAction('package')} className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition">确认安装包就绪</button>
                                   )}
                               </div>

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

                               {selectedOrder.isAuthConfirmed && selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isShippingConfirmed && (
                                   <button 
                                      onClick={handleStockComplete} 
                                      className="w-full py-4 bg-[#0071E3] dark:bg-[#0A84FF] text-white rounded-2xl font-bold shadow-lg animate-pulse hover:opacity-80 transition mt-4"
                                   >
                                       备货状态更新为：已备货完成
                                   </button>
                               )}
                          </div>
                      )}

                      {/* Payment, Shipping, Acceptance, Refund Steps... */}
                      {activeStepModal === 'PAYMENT' && (
                          <div className="space-y-6">
                              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl text-white shadow-lg text-center">
                                  <div className="text-xs font-bold uppercase mb-1 opacity-80">应收账款</div>
                                  <div className="text-3xl font-bold font-mono">¥{selectedOrder.total.toLocaleString()}</div>
                              </div>
                              <div className="space-y-4">
                                  <input placeholder="收款银行" value={paymentForm.bankName} onChange={e=>setPaymentForm({...paymentForm, bankName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 dark:text-white text-sm" />
                                  <input placeholder="交易流水号" value={paymentForm.transactionId} onChange={e=>setPaymentForm({...paymentForm, transactionId:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 dark:text-white text-sm font-mono" />
                              </div>
                              <button onClick={handleConfirmPayment} className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 transition mt-6">确认到账</button>
                          </div>
                      )}
                      
                      {activeStepModal === 'SHIPPING' && (
                          <div className="space-y-6 text-center py-6">
                               <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <Truck className="w-10 h-10 text-blue-500" />
                               </div>
                               <div className="space-y-2 text-left bg-gray-50 dark:bg-white/10 p-4 rounded-2xl text-xs">
                                   <div className="flex justify-between"><span>财务状态</span><span className={selectedOrder.isPaid ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{selectedOrder.isPaid ? '已结清' : '未支付'}</span></div>
                                   <div className="flex justify-between"><span>备货状态</span><span className={(selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isAuthConfirmed && selectedOrder.isShippingConfirmed) ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>{(selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isAuthConfirmed && selectedOrder.isShippingConfirmed) ? '已备货' : '备货中'}</span></div>
                               </div>
                               <button 
                                  onClick={handleShipOrder} 
                                  disabled={!selectedOrder.isPaid || !selectedOrder.isPackageConfirmed || !selectedOrder.isCDBurned || !selectedOrder.isAuthConfirmed || !selectedOrder.isShippingConfirmed} 
                                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition"
                               >
                                  确认执行发货
                               </button>
                          </div>
                      )}

                      {activeStepModal === 'ACCEPTANCE' && (
                          <div className="space-y-6">
                               <div className="text-center">
                                   <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                       <ClipboardCheck className="w-8 h-8 text-indigo-500" />
                                   </div>
                                   <h4 className="font-bold dark:text-white">验收环节确认</h4>
                               </div>
                               
                               <div className="p-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition" onClick={handleUploadAcceptanceDoc}>
                                   <UploadCloud className="w-6 h-6 text-gray-400" />
                                   <span className="text-xs text-gray-500">点击上传已签署的验收单 (PDF/IMG)</span>
                               </div>

                               <div className="space-y-3">
                                   {selectedOrder.acceptanceConfig?.phases.map(p => (
                                       <div key={p.id} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl flex justify-between items-center bg-white dark:bg-black/20">
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
                                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition mt-4"
                               >
                                  确认完成验收
                               </button>
                          </div>
                      )}

                      {activeStepModal === 'REFUND_REQUEST' && (
                          <div className="space-y-6">
                              <div className="text-center">
                                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                                      <AlertOctagon className="w-8 h-8 text-red-500" />
                                  </div>
                                  <h4 className="font-bold dark:text-white text-lg">申请退单</h4>
                                  <p className="text-xs text-gray-500 mt-1">请填写退单原因及金额，提交后需经过财务审批。</p>
                              </div>
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">退单原因</label>
                                      <textarea 
                                          className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-100 dark:text-white"
                                          rows={3}
                                          placeholder="例如：客户需求变更、产品质量问题..."
                                          value={refundReason}
                                          onChange={e => setRefundReason(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">退单金额 (最大 ¥{selectedOrder.total.toLocaleString()})</label>
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
                                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg hover:bg-red-700 transition"
                              >
                                  提交退单申请
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
                       <div className="flex items-center gap-6">
                           <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                               <Award className="w-5 h-5 text-orange-500"/> {isCertPreviewMode ? '授权证书预览与确认' : '软件授权证书'}
                           </h3>
                           
                           <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                               <button 
                                   onClick={() => setCertView('paper')}
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'paper' ? 'bg-white dark:bg-white/20 shadow-sm text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                               >
                                   纸质排版
                               </button>
                               <button 
                                   onClick={() => setCertView('structured')}
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'structured' ? 'bg-white dark:bg-white/20 shadow-sm text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                               >
                                   结构化展示
                               </button>
                           </div>
                       </div>
                       <div className="flex gap-2">
                           {!isCertPreviewMode && (
                               <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition"><Printer className="w-4 h-4"/> 打印证书</button>
                           )}
                           <button onClick={handleCloseCertDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
                       </div>
                   </div>
                   
                   {/* Cert Content */}
                   <div className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-black/50 flex justify-center">
                        {certView === 'paper' ? (
                            /* Certificate Paper */
                            <div id="cert-content" className="relative bg-white text-gray-900 border-[12px] border-white shadow-2xl w-[800px] h-[1100px] p-16 flex flex-col justify-between overflow-hidden">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                                    <ShieldCheck className="w-[600px] h-[600px]" />
                                </div>
                                
                                <div className="relative z-10 text-center space-y-12 mt-8">
                                     <div className="flex flex-col items-center gap-4">
                                         <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black italic shadow-xl">W</div>
                                         <div className="text-sm font-bold tracking-[0.4em] text-blue-600 uppercase">WPS Enterprise Systems</div>
                                     </div>
                                     
                                     <div className="space-y-2">
                                        <h2 className="text-5xl font-serif text-gray-900 font-medium tracking-wide">软件商品授权证书</h2>
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.3em]">Certificate of Software License</div>
                                     </div>

                                     <div className="text-left text-lg leading-loose text-gray-700 space-y-10 pt-10 border-t border-gray-100">
                                         <div>
                                             <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">授权用户 (Licensee)</p>
                                             <h3 className="text-3xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500/30 decoration-4">{selectedOrder.customerName}</h3>
                                         </div>
                                         
                                         <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-left bg-gray-50 p-8 rounded-3xl border border-gray-100">
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">商品名称 (Product)</div>
                                                 <div className="text-xl font-bold text-gray-900">{selectedCertificateItem.productName}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">规格型号 (SKU)</div>
                                                 <div className="text-lg font-medium text-gray-900">{selectedCertificateItem.skuName}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">授权数量 (Quantity)</div>
                                                 <div className="text-lg font-mono font-bold text-gray-900">{selectedCertificateItem.quantity}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">生效日期 (Date)</div>
                                                 <div className="text-lg font-mono font-medium text-gray-900">{new Date(selectedOrder.confirmedDate || Date.now()).toLocaleDateString()}</div>
                                             </div>
                                             <div className="col-span-2 pt-4 border-t border-gray-200/50">
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">授权许可码 (License Key)</div>
                                                 <div className="font-mono text-base text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-100 break-all shadow-sm">
                                                     {selectedCertificateItem.deliveredContent?.[0] || 'PREVIEW-LICENSE-KEY-GENERATED-001'}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                </div>

                                <div className="flex justify-between items-end pb-8 relative z-10">
                                     <div className="space-y-1 text-left">
                                         <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Authorized Signature</div>
                                         <div className="h-16 w-48 border-b border-gray-300 relative flex items-end pb-2">
                                             <span className="text-4xl font-serif italic text-blue-900 opacity-90 rotate-[-5deg]">WPS Inc.</span>
                                         </div>
                                         <div className="text-sm font-bold mt-2">WPS Systems Ltd.</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="w-32 h-32 border-4 border-blue-600 rounded-full flex items-center justify-center relative rotate-[-12deg] opacity-80 mask-stamp">
                                             <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute top-4">Official Seal</div>
                                             <ShieldCheck className="w-12 h-12 text-blue-600" />
                                             <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute bottom-4">Verified</div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            /* Structured Layout */
                            <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-5xl rounded-3xl shadow-xl overflow-hidden flex flex-col">
                                <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCertificateItem.productName}授权信息</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 rounded-full relative cursor-pointer">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">未生效</span>
                                        </div>
                                    </div>
                                    <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">编辑</button>
                                </div>
                                
                                <div className="p-10 space-y-12">
                                    {/* 授权信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">授权信息</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">被授权方:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedOrder.customerName}</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权类型:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">随机数量授权</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权数量:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedCertificateItem.quantity}</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">购买单位:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">套</span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权范围:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium leading-relaxed">
                                                    {selectedOrder.customerName}2026年3月1日（{selectedOrder.customerName}项目）新购{selectedCertificateItem.quantity}台计算机设备
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权地址:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    中华人民共和国范围内（香港及澳门特别行政区、台湾地区除外）
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权期限:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    同授权范围中所包含计算机设备的使用年限。
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权说明:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    授权编号一致的电子授权或纸版授权（如有）为同一授权，不重复累加。
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权编号:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">20260228216000_712187</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">订单编号:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedOrder.id}</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 产品信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">产品信息</h3>
                                        <div className="flex items-start gap-4">
                                            <span className="text-gray-400 text-sm min-w-[100px]">授权产品/服务:</span>
                                            <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedCertificateItem.productName}</span>
                                        </div>
                                    </section>

                                    {/* 服务信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">服务信息</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障期限:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">1年</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障开始时间:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">2026-03-05</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障结束时间:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">2027-03-05</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 序列号 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">序列号</h3>
                                        <div className="flex items-start gap-4">
                                            <span className="text-gray-400 text-sm min-w-[100px]">安装序列号:</span>
                                            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold font-mono">7H*****TH</span>
                                        </div>
                                    </section>

                                    {/* 其他 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">其他</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">下级单位清单:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">-</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权备注:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">-</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Footer Actions for Preview Mode */}
                   {isCertPreviewMode && (
                        <div className="p-6 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 shrink-0 shadow-[-5px_0_30px_rgba(0,0,0,0.1)] z-20">
                            <button onClick={handleCloseCertDrawer} className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-bold text-sm">取消</button>
                            <button onClick={() => handleStockAction('auth')} className="px-8 py-3 bg-[#0071E3] dark:bg-[#0A84FF] text-white rounded-xl hover:bg-blue-600 dark:hover:bg-[#0A84FF]/80 transition shadow-lg font-bold text-sm">确认授权无误</button>
                        </div>
                   )}
              </div>
          </div>
      )}

      {/* Fulfillment Modal */}
      {fulfillmentItemIndex !== null && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter border border-white/10">
                  <div className="p-6 border-b dark:border-white/10 flex justify-between items-center"><h3 className="font-bold dark:text-white">配置交付内容</h3><button onClick={() => setFulfillmentItemIndex(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div>
                  <div className="p-6 space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase block">授权码 / 链接 (每行一个)</label>
                      <textarea value={fulfillmentContent} onChange={e => setFulfillmentContent(e.target.value)} placeholder="例如：XXXXX-XXXXX-XXXXX" className="w-full p-4 bg-gray-50 dark:bg-black border border-transparent dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white min-h-[160px] resize-none font-mono" />
                      <button onClick={saveFulfillment} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-80 transition">保存</button>
                  </div>
              </div>
          </div>
      )}

      {/* Order Item Details Drawer */}
      {selectedItemForDetails && (
          <div className="fixed inset-0 z-[70] flex justify-end">
              <div 
                  className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isItemDetailsClosing ? 'opacity-0' : 'opacity-100'}`}
                  onClick={() => {
                      setIsItemDetailsClosing(true);
                      setTimeout(() => {
                          setSelectedItemForDetails(null);
                          setIsItemDetailsClosing(false);
                      }, 300);
                  }}
              />
              <div className={`w-full max-w-7xl bg-white dark:bg-[#1C1C1E] h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isItemDetailsClosing ? 'translate-x-full' : 'translate-x-0'} relative z-10 border-l border-gray-100 dark:border-white/10`}>
                  <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1C1C1E] shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Package className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">订单商品明细详情</h3>
                              <p className="text-xs text-gray-500 mt-0.5">查看商品规格、授权及交付状态</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => {
                              setIsItemDetailsClosing(true);
                              setTimeout(() => {
                                  setSelectedItemForDetails(null);
                                  setIsItemDetailsClosing(false);
                              }, 300);
                          }} 
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                          <X className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                      <div className="max-w-6xl mx-auto space-y-8">
                          {/* Header Info Card */}
                          <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                              <div className="space-y-1">
                                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">当前查看商品</div>
                                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItemForDetails.productName}</h2>
                                  <div className="flex items-center gap-3 mt-2">
                                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-800/30">{selectedItemForDetails.skuName}</span>
                                      <span className="text-xs font-mono text-gray-400">{selectedItemForDetails.skuCode}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-8 pr-4">
                                  <div className="text-right">
                                      <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">购买数量</div>
                                      <div className="text-2xl font-bold text-gray-900 dark:text-white">x {selectedItemForDetails.quantity}</div>
                                  </div>
                                  <div className="w-px h-10 bg-gray-100 dark:bg-white/10"></div>
                                  <div className="text-right">
                                      <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">小计金额</div>
                                      <div className="text-2xl font-bold text-[#0071E3] dark:text-[#0A84FF]">¥{(selectedItemForDetails.priceAtPurchase * selectedItemForDetails.quantity).toLocaleString()}</div>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left Column: License & Delivery */}
                              <div className="lg:col-span-2 space-y-8">
                                  {/* License Details */}
                                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                                      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                          <Key className="w-5 h-5 text-indigo-500" />
                                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">授权与交付信息</h4>
                                      </div>
                                      <div className="p-8 grid grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                              <div>
                                                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">激活方式</div>
                                                  <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                          {selectedItemForDetails.activationMethod === 'LicenseKey' ? '授权码激活' : 
                                                           selectedItemForDetails.activationMethod === 'Online' ? '在线激活' : '加密狗'}
                                                      </span>
                                                  </div>
                                              </div>
                                              <div>
                                                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">授权范围</div>
                                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedItemForDetails.quantity} 个并发授权 / 节点</div>
                                              </div>
                                              <div>
                                                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">企业ID</div>
                                                  <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                                      {selectedItemForDetails.enterpriseId || '-'}
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="space-y-4">
                                              <div>
                                                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">交付状态</div>
                                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                      selectedItemForDetails.deliveredContent && selectedItemForDetails.deliveredContent.length > 0
                                                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                                      : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                                  }`}>
                                                      {selectedItemForDetails.deliveredContent && selectedItemForDetails.deliveredContent.length > 0 ? '已交付' : '待交付'}
                                                  </span>
                                              </div>
                                              <div>
                                                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">授权周期</div>
                                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                      {selectedItemForDetails.pricingOptionName?.includes('永久') || selectedItemForDetails.pricingOptionName?.includes('Perpetual') ? '永久有效' : '年度订阅'}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      {selectedItemForDetails.deliveredContent && selectedItemForDetails.deliveredContent.length > 0 && (
                                          <div className="px-8 pb-8">
                                              <div className="text-[10px] text-gray-400 uppercase font-bold mb-3">已发放授权码清单</div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  {selectedItemForDetails.deliveredContent.map((code, idx) => (
                                                      <div key={idx} className="group relative">
                                                          <div className="text-xs font-mono bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 flex justify-between items-center">
                                                              {code}
                                                              <button className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-600 transition-opacity">
                                                                  <ClipboardCheck className="w-4 h-4"/>
                                                              </button>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      )}
                                  </div>

                                  {/* Pricing Breakdown */}
                                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                                      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                          <CreditCard className="w-5 h-5 text-orange-500" />
                                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">价格明细</h4>
                                      </div>
                                      <div className="p-8 space-y-6">
                                          <div className="flex justify-between items-center">
                                              <div className="text-sm text-gray-500">基准目录单价</div>
                                              <div className="text-sm font-mono text-gray-900 dark:text-white">¥{(selectedItemForDetails.priceAtPurchase * 1.2).toLocaleString()}</div>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <div className="text-sm text-gray-500">成交议价单价</div>
                                              <div className="text-sm font-mono text-gray-900 dark:text-white font-bold">¥{selectedItemForDetails.priceAtPurchase.toLocaleString()}</div>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <div className="text-sm text-gray-500">折扣率</div>
                                              <div className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">83.3%</div>
                                          </div>
                                          <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-end">
                                              <div className="text-sm font-bold text-gray-900 dark:text-white">结算小计</div>
                                              <div className="text-3xl font-bold text-[#0071E3] dark:text-[#0A84FF] font-mono">¥{(selectedItemForDetails.priceAtPurchase * selectedItemForDetails.quantity).toLocaleString()}</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Right Column: Technical & Support */}
                              <div className="space-y-8">
                                  {/* Technical Specs / Install Package */}
                                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                                      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                          <Disc className="w-5 h-5 text-blue-500" />
                                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">技术规格与安装包</h4>
                                      </div>
                                      <div className="p-8 space-y-6">
                                          {selectedItemForDetails.installPackageName ? (
                                              <div className="space-y-6">
                                                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                                      <div className="w-12 h-12 bg-white dark:bg-black rounded-xl flex items-center justify-center shadow-sm">
                                                          <Package className="w-6 h-6 text-blue-500" />
                                                      </div>
                                                      <div>
                                                          <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedItemForDetails.installPackageName}</div>
                                                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase mt-0.5 tracking-wider">标准分发安装包</div>
                                                      </div>
                                                  </div>
                                                  
                                                  <div className="space-y-4">
                                                      {(() => {
                                                          const product = products.find(p => p.id === selectedItemForDetails.productId);
                                                          const pkg = product?.installPackages?.find(p => p.name === selectedItemForDetails.installPackageName);
                                                          if (!pkg) return <div className="text-xs text-gray-400 italic">未找到详细技术参数</div>;
                                                          
                                                          return (
                                                              <div className="grid grid-cols-1 gap-4">
                                                                  <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-white/5">
                                                                      <span className="text-xs text-gray-400 uppercase font-bold">CPU 限制</span>
                                                                      <span className="text-sm font-bold text-gray-900 dark:text-white">{pkg.cpu || '全兼容'}</span>
                                                                  </div>
                                                                  <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-white/5">
                                                                      <span className="text-xs text-gray-400 uppercase font-bold">操作系统</span>
                                                                      <span className="text-sm font-bold text-gray-900 dark:text-white">{pkg.os || '全兼容'}</span>
                                                                  </div>
                                                                  <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-white/5">
                                                                      <span className="text-xs text-gray-400 uppercase font-bold">架构体系</span>
                                                                      <span className="text-sm font-bold text-gray-900 dark:text-white">{pkg.arch || 'x86/arm'}</span>
                                                                  </div>
                                                                  <div className="flex justify-between items-center py-2">
                                                                      <span className="text-xs text-gray-400 uppercase font-bold">版本号</span>
                                                                      <span className="text-sm font-mono text-gray-900 dark:text-white">{pkg.version}</span>
                                                                  </div>
                                                              </div>
                                                          );
                                                      })()}
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                                                      <AlertCircle className="w-8 h-8 text-gray-300" />
                                                  </div>
                                                  <div className="text-sm text-gray-400 italic leading-relaxed">
                                                      该商品无需特定安装包<br/>或尚未关联分发资源
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  {/* Lifecycle & Support */}
                                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
                                      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                          <RefreshCcw className="w-5 h-5 text-purple-500" />
                                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">生命周期与续费</h4>
                                      </div>
                                      <div className="p-8">
                                          <div className="flex items-start gap-4">
                                              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                                                  <Clock className="w-5 h-5 text-purple-500" />
                                              </div>
                                              <div>
                                                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                                      {selectedItemForDetails.pricingOptionName?.includes('永久') || selectedItemForDetails.pricingOptionName?.includes('Perpetual') 
                                                          ? '永久授权模式' 
                                                          : '订阅授权模式'}
                                                  </div>
                                                  <p className="text-xs text-gray-500 leading-relaxed">
                                                      {selectedItemForDetails.pricingOptionName?.includes('永久') || selectedItemForDetails.pricingOptionName?.includes('Perpetual')
                                                          ? '该资产属于永久性授权，一次性购买后可终身使用，建议定期关注版本升级策略。'
                                                          : '该资产属于年度订阅制，系统将在到期前 90 天自动发起续费提醒并生成续费商机。'}
                                                  </p>
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
    </>
  );
};

export default OrderDetails;
