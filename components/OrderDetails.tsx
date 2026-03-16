
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, User, Department, Opportunity, OrderItem, ApprovalRecord, RoleDefinition } from '../types';
import { 
    ArrowLeft, Box, Printer, Award, X, Lock, CheckCircle, Truck, ClipboardCheck, 
    UploadCloud, AlertOctagon, RefreshCcw, Key, Package, Disc, Receipt, FileText, 
    Briefcase, History, Eye, CheckSquare, CreditCard, ShieldCheck, User as UserIcon, Building,
    ChevronRight, AlertCircle, Clock, MapPin, Target, Users, Paperclip, Scroll, ZoomIn, ZoomOut, Download, Camera
} from 'lucide-react';
import ModalPortal from './ModalPortal';

interface OrderDetailsProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  users: User[];
  departments: Department[];
  currentUser: User;
  opportunities: Opportunity[];
  roles: RoleDefinition[];
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

const OrderDetails: React.FC<OrderDetailsProps> = ({ orders, setOrders, products, customers, currentUser, users, departments, opportunities, roles }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentUserRole = roles.find(r => r.id === currentUser.role);
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  const hasMediumCards = hasPermission('order_detail_customer') || hasPermission('order_detail_trader');

  const cardSpans = (() => {
    const cards: { id: string; span: number }[] = [];
    if (hasMediumCards) cards.push({ id: 'medium', span: 2 });
    if (hasPermission('order_detail_opportunity')) cards.push({ id: 'opportunity', span: 1 });
    if (hasPermission('order_detail_contract')) cards.push({ id: 'contract', span: 1 });
    if (hasPermission('order_detail_invoice')) cards.push({ id: 'invoice', span: 1 });
    if (hasPermission('order_detail_original')) cards.push({ id: 'original', span: 1 });

    let col = 0;
    for (const card of cards) {
      if (col + card.span > 3) col = 0;
      col += card.span;
    }
    const remaining = 3 - col;
    if (cards.length > 0 && remaining > 0 && cards[cards.length - 1].span < 2) {
      cards[cards.length - 1].span = Math.min(cards[cards.length - 1].span + remaining, 2);
    }

    const result: Record<string, string> = {};
    for (const card of cards) {
      result[card.id] = card.span === 2 ? 'md:col-span-2' : 'md:col-span-1';
    }
    return result;
  })();

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
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [isItemDetailsClosing, setIsItemDetailsClosing] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isLogDrawerClosing, setIsLogDrawerClosing] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [isSnapshotClosing, setIsSnapshotClosing] = useState(false);
  const [showCreatorPhone, setShowCreatorPhone] = useState(false);
  
  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');
  const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'FULFILLMENT' | 'EMAIL'>('MANAGEMENT');
  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);
  const [contractZoom, setContractZoom] = useState(100);
  const [selectedDeliveryNo, setSelectedDeliveryNo] = useState<string | null>(null);

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

  const stepPermissionMap: Record<string, string> = {
      PAYMENT: 'order_workflow_payment',
      APPROVAL: 'order_workflow_approval',
      CONFIRM: 'order_workflow_confirm',
      STOCK_PREP: 'order_workflow_stock',
      SHIPPING: 'order_workflow_shipping',
      ACCEPTANCE: 'order_workflow_acceptance',
      COMPLETED: 'order_workflow_payment',
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

  steps = steps.filter(s => hasPermission(stepPermissionMap[s.id] || ''));

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
  const handleOpenSnapshot = () => { setIsSnapshotOpen(true); };
  const handleCloseSnapshot = () => { setIsSnapshotClosing(true); setTimeout(() => { setIsSnapshotOpen(false); setIsSnapshotClosing(false); }, 280); };

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
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1C1C1E] shadow-apple bg-gray-100" 
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
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
          <div className="flex items-center gap-4 pb-3">
               {/* Group 1: 返回 + 订单编号 */}
               <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
               <div className="shrink-0">
                   <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">订单 {selectedOrder.id}</h1>
                   <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:block mt-0.5">提单时间：<span className="font-mono">{new Date(selectedOrder.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span></span>
               </div>

               {/* Group 2: 状态标签 */}
               <div className="hidden md:flex items-center gap-2.5 border-l border-gray-200/60 dark:border-white/10 pl-4 shrink-0">
                   <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">订单状态</span>
                       <span className={`!rounded-full ${
                           selectedOrder.status === OrderStatus.DELIVERED ? 'unified-tag-green' :
                           selectedOrder.status === OrderStatus.SHIPPED ? 'unified-tag-indigo' :
                           selectedOrder.status === OrderStatus.PROCESSING_PROD ? 'unified-tag-blue' :
                           selectedOrder.status === OrderStatus.PENDING_APPROVAL ? 'unified-tag-blue' :
                           selectedOrder.status === OrderStatus.PENDING_CONFIRM ? 'unified-tag-blue' :
                           selectedOrder.status === OrderStatus.REFUND_PENDING ? 'unified-tag-blue' :
                           selectedOrder.status === OrderStatus.CANCELLED ? 'unified-tag-gray' :
                           selectedOrder.status === OrderStatus.REFUNDED ? 'unified-tag-red' :
                           selectedOrder.status === OrderStatus.PENDING_PAYMENT ? 'unified-tag-blue' :
                           'unified-tag-gray'
                       }`}>{statusMap[selectedOrder.status] || selectedOrder.status}</span>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">付款状态</span>
                       <span className={`!rounded-full ${selectedOrder.isPaid ? 'unified-tag-green' : 'unified-tag-blue'}`}>
                           {selectedOrder.isPaid ? '已支付' : '待支付'}
                       </span>
                   </div>
                   <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">备货状态</span>
                       <span className={`!rounded-full ${
                           selectedOrder.status === OrderStatus.DELIVERED ? 'unified-tag-green' :
                           selectedOrder.status === OrderStatus.SHIPPED ? 'unified-tag-indigo' :
                           selectedOrder.isShippingConfirmed ? 'unified-tag-blue' :
                           (selectedOrder.isAuthConfirmed || selectedOrder.isPackageConfirmed || selectedOrder.status === OrderStatus.PROCESSING_PROD) ? 'unified-tag-orange' :
                           'unified-tag-blue'
                       }`}>{selectedOrder.status === OrderStatus.DELIVERED ? '已完成' :
                        selectedOrder.status === OrderStatus.SHIPPED ? '已发货' :
                        selectedOrder.isShippingConfirmed ? '待发货' :
                        (selectedOrder.isAuthConfirmed || selectedOrder.isPackageConfirmed || selectedOrder.status === OrderStatus.PROCESSING_PROD) ? '备货中' :
                        '待处理'}</span>
                   </div>
               </div>

               <div className="flex-1"></div>

               {/* Group 3: 人员 */}
               <div className="hidden lg:flex items-center gap-4 border-r border-gray-200 dark:border-white/10 pr-4 shrink-0">
                   <div className="flex items-center gap-2.5">
                       <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                           <img src={users.find(u => u.id === selectedOrder.salesRepId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.salesRepName || 'Sales'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">销售</div>
                           <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{(selectedOrder.salesRepName || '未分配').replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                       </div>
                   </div>
                   <div className="flex items-center gap-2.5">
                       <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                           <img src={users.find(u => u.id === selectedOrder.businessManagerId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.businessManagerName || 'Business'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">商务</div>
                           <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{(selectedOrder.businessManagerName || '未分配').replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                       </div>
                   </div>
                   {selectedOrder.creatorName && (
                       <div className="flex items-center gap-2.5">
                           <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                               <img src={users.find(u => u.id === selectedOrder.creatorId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.creatorName || 'Creator'}`} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div>
                               <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">制单人</div>
                               <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{selectedOrder.creatorName.replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                               {(() => {
                                   const phone = selectedOrder.creatorPhone || users.find(u => u.id === selectedOrder.creatorId)?.phone;
                                   if (!phone) return null;
                                   const masked = phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone;
                                   return (
                                       <div
                                           className="text-[10px] text-gray-400 leading-none mt-0.5 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors select-none"
                                           onClick={() => setShowCreatorPhone(v => !v)}
                                           title={showCreatorPhone ? '点击隐藏' : '点击显示完整号码'}
                                       >
                                           {showCreatorPhone ? phone : masked}
                                       </div>
                                   );
                               })()}
                           </div>
                       </div>
                   )}
               </div>

               {/* Group 4: 操作按钮 */}
               <div className="flex items-center gap-2 shrink-0">
                   {hasPermission('order_detail_snapshot') && (
                   <button 
                       onClick={handleOpenSnapshot}
                       className="unified-button-secondary whitespace-nowrap shrink-0"
                   >
                       <Camera className="w-3.5 h-3.5"/> 快照
                   </button>
                   )}
                   {hasPermission('order_detail_log') && (
                   <button 
                       onClick={handleOpenLogDrawer}
                       className="unified-button-secondary whitespace-nowrap shrink-0"
                   >
                       <History className="w-3.5 h-3.5"/> 记录
                   </button>
                   )}
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

          {/* Tabs Navigation */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pt-2 border-b border-gray-200 dark:border-white/10">
              {([
                  { id: 'MANAGEMENT', label: '订单信息', permission: undefined },
                  { id: 'EMAIL', label: '发货信息', permission: 'order_detail_shipping' },
                  { id: 'FULFILLMENT', label: '订单交付', permission: 'order_detail_delivery' },
              ] as { id: string; label: string; permission?: string }[]).filter(tab => !tab.permission || hasPermission(tab.permission)).map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'MANAGEMENT' | 'FULFILLMENT' | 'EMAIL')}
                      className={`relative px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                          activeTab === tab.id
                          ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]'
                          : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="p-4 lg:p-6 max-w-[2400px] mx-auto w-full space-y-4 animate-page-enter pb-20">
          {activeTab === 'MANAGEMENT' && (
            <>
              {/* Stepper */}
              {hasPermission('order_workflow_view') && steps.length > 0 && (
              <div className="unified-card dark:bg-[#1C1C1E] px-6 py-4 -gray-100/50 dark:-white/10 overflow-x-auto">
             <div className="flex justify-between items-start relative min-w-[700px]">
                 <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 dark:bg-white/10 -z-0 rounded-full overflow-hidden">
                 </div>
                 {steps.map((step, idx) => (
                    <div 
                        key={step.id} 
                        onClick={() => !step.disabled && setActiveStepModal(step.id)} 
                        className={`flex flex-col items-center gap-1.5 relative z-10 flex-1 transition-all group ${
                            step.disabled 
                            ? 'opacity-40 grayscale cursor-not-allowed' 
                            : 'cursor-pointer hover:scale-105'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-apple ${
                            step.status === 'Completed' ? 'bg-green-500 text-white ring-4 ring-green-100 dark:ring-green-900/20' : 
                            step.status === 'Current' ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-xl scale-110' : 
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
                            {step.status === 'Current' && <div className="text-[9px] font-bold text-white bg-[#0071E3] dark:bg-[#0A84FF] px-2 py-0.5 rounded-full mt-1 animate-pulse">点击处理</div>}
                            {step.status === 'Completed' && <div className="text-[9px] text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-bold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">查看信息</div>}
                        </div>
                    </div>
                 ))}
             </div>
          </div>
              )}

          {/* Order Items Table + Summary Side-by-Side */}
          {hasPermission('order_detail_product') && (
          <div className="unified-card dark:bg-[#1C1C1E] -gray-100/50 dark:-white/10">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">订单产品明细</h3>
              </div>
              <div className="flex items-stretch">
                  {/* Left: items table (fills remaining) */}
                  <div className="flex-1 min-w-0 overflow-x-auto border-r border-gray-100 dark:border-white/10">
                      <table className="w-full text-left min-w-[520px]">
                          <thead className="unified-table-header">
                              <tr>
                                  <th className="px-5 py-4 pl-6 text-center w-16 whitespace-nowrap">明细编号</th>
                                  <th className="px-5 py-4">产品信息</th>
                                  <th className="px-5 py-4 text-center">数量</th>
                                  <th className="px-5 py-4 text-center">授权期限</th>
                                  <th className="px-5 py-4 text-right">单价</th>
                                  <th className="px-5 py-4 text-right">产品金额</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {selectedOrder.items.map((item, idx) => {
                                  const lineNo = String(idx + 1).padStart(3, '0');
                                  const itemAmount = item.priceAtPurchase * item.quantity;
                                  return (
                                  <tr
                                    key={idx}
                                    className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                      <td className="px-5 py-5 pl-6 text-center">
                                          <button
                                              onClick={() => { setSelectedItemForDetails(item); setSelectedItemIndex(idx); }}
                                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF] transition-all"
                                          >
                                              {lineNo}
                                          </button>
                                      </td>
                                      <td className="px-5 py-5">
                                          <button
                                            onClick={() => navigate(`/catalog/${item.productId}/preview`)}
                                            className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline text-left text-sm"
                                          >
                                              {item.productName}
                                          </button>
                                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                              {item.skuName && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                                              {item.licenseType && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                                          </div>
                                      </td>
                                      <td className="px-5 py-5 text-center dark:text-white font-medium">x {item.quantity}</td>
                                      <td className="px-5 py-5 text-center">
                                          {item.licensePeriod && item.licensePeriod !== '永久'
                                              ? <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span>
                                              : <span className="text-gray-300 dark:text-gray-600">-</span>
                                          }
                                      </td>
                                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-700 dark:text-gray-300">¥{item.priceAtPurchase.toLocaleString()}</td>
                                      <td className="px-5 py-5 text-right font-bold font-mono text-gray-900 dark:text-white">¥{itemAmount.toLocaleString()}</td>
                                  </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  {/* Right: price summary */}
                  <div className="w-[27%] shrink-0 flex flex-col justify-between p-6 bg-gray-50/50 dark:bg-white/5">
                      {(() => {
                          const productTotal = selectedOrder.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
                          const discountAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 1000 ? Math.floor(lineTotal * 0.05 / 10) * 10 : 0);
                          }, 0);
                          const rebateAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 5000 ? Math.floor(lineTotal * 0.02 / 10) * 10 : 0);
                          }, 0);
                          const convDeductAmt = selectedOrder.conversionDeductionAmount ?? 0;
                          const totalDiscount = discountAmt + rebateAmt + convDeductAmt;
                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                          return (
                      <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                              <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">产品总金额</span>
                              <span className="font-bold text-xl font-mono text-gray-900 dark:text-white">{fmt(productTotal)}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">优惠折扣金额</span>
                                  <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">- {fmt(discountAmt)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">返利折扣金额</span>
                                  <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">- {fmt(rebateAmt)}</span>
                              </div>
                              {convDeductAmt > 0 && (
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">折算抵扣金额</span>
                                      <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">- {fmt(convDeductAmt)}</span>
                                  </div>
                              )}
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">优惠金额</span>
                                  <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">- {fmt(totalDiscount)}</span>
                              </div>
                          </div>
                      </div>
                          );
                      })()}
                      {(() => {
                          const productTotal = selectedOrder.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
                          const discountAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 1000 ? Math.floor(lineTotal * 0.05 / 10) * 10 : 0);
                          }, 0);
                          const rebateAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 5000 ? Math.floor(lineTotal * 0.02 / 10) * 10 : 0);
                          }, 0);
                          const convDeductAmt2 = selectedOrder.conversionDeductionAmount ?? 0;
                          const amountDue = productTotal - discountAmt - rebateAmt - convDeductAmt2;
                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                          return (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2">
                                  <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">订单应付金额</span>
                                      <span className="font-bold text-xl text-red-600 dark:text-red-400 font-mono">{fmt(amountDue)}</span>
                                  </div>
                                  {selectedOrder.isPaid && (
                                      <div className="flex justify-between items-center">
                                          <span className="font-bold text-gray-900 dark:text-white text-sm">订单实付金额</span>
                                          <span className="font-bold text-xl text-green-600 dark:text-green-400 font-mono">{fmt(amountDue)}</span>
                                      </div>
                                  )}
                                  {selectedOrder.conversionAmount != null && (
                                      <div className="flex justify-between items-center pt-1">
                                          <span className="font-bold text-gray-900 dark:text-white text-sm">折算金额</span>
                                          <span className="font-bold text-xl text-blue-600 dark:text-blue-400 font-mono">{fmt(selectedOrder.conversionAmount)}</span>
                                      </div>
                                  )}
                              </div>
                          );
                      })()}
                  </div>
              </div>
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Info + Trader Info (Medium) */}
              {hasMediumCards && (
              <div className={`${cardSpans.medium} space-y-4`}>
                  {/* 客户信息卡片 */}
                  {hasPermission('order_detail_customer') && (
                  <div className="unified-card dark:bg-[#1C1C1E] p-5 -gray-100/50 dark:-white/10 space-y-4">
                      <div className="border-b border-gray-100 dark:border-white/10 pb-2.5">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Building className="w-5 h-5 text-[#0071E3]" /> 客户信息
                          </h4>
                      </div>
                      {(() => {
                          const fields = [
                              { label: '客户名称', value: selectedOrder.customerName, isLink: true, linkTo: `/customers/${selectedOrder.customerId}` },
                              { label: '客户类型', value: selectedOrder.customerType === 'Enterprise' ? '央企' : selectedOrder.customerType },
                              { label: '行业条线', value: selectedOrder.industryLine },
                              { label: '所在地区', value: [selectedOrder.province, selectedOrder.city, selectedOrder.district].filter(Boolean).join(' / ') || undefined },
                              { label: '报备标签', value: selectedOrder.reportTag },
                              { label: '是否授权覆盖客户', value: selectedOrder.customerStatus },
                          ];
                          return (
                              <div className="grid grid-cols-2 gap-x-6">
                                  {fields.map((item, idx) => (
                                      <div key={idx} className={`flex items-center gap-8 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap whitespace-nowrap">{item.label}</span>
                                          {item.isLink ? (
                                              <button onClick={() => navigate(item.linkTo!)} className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline text-left flex-1">
                                                  {item.value || '-'}
                                              </button>
                                          ) : (
                                              <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{item.value || '-'}</span>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          );
                      })()}
                  </div>
                  )}

                  {/* 交易方信息卡片 */}
                  {hasPermission('order_detail_trader') && (
                  <div className="unified-card dark:bg-[#1C1C1E] p-5 -gray-100/50 dark:-white/10 space-y-4">
                      <div className="border-b border-gray-100 dark:border-white/10 pb-2.5">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-500" /> 交易双方信息
                          </h4>
                      </div>
                      {(() => {
                          const fields = [
                              { label: '买方名称', value: selectedOrder.buyerName },
                              { label: '卖方名称', value: selectedOrder.sellerName },
                              { label: '直接下级渠道', value: selectedOrder.directChannel },
                              { label: '终端渠道', value: selectedOrder.terminalChannel },
                              { label: '渠道是否提供服务', value: selectedOrder.channelService },
                          ];
                          return (
                              <div className="grid grid-cols-2 gap-x-6">
                                  {fields.map((item, idx) => (
                                      <div key={idx} className={`flex items-center gap-8 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap whitespace-nowrap">{item.label}</span>
                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{item.value || '-'}</span>
                                      </div>
                                  ))}
                              </div>
                          );
                      })()}
                  </div>
                  )}
              </div>
              )}

              {/* Opportunity Information (dynamic) */}
              {hasPermission('order_detail_opportunity') && (
              <div className={`unified-card ${cardSpans.opportunity} dark:bg-[#1C1C1E] p-4 -gray-100/50 dark:-white/10 space-y-3`}>
                  <div className="border-b border-gray-100 dark:border-white/10 pb-2.5">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Target className="w-5 h-5 text-orange-500"/> 商机信息</h4>
                  </div>
                  {(() => {
                      const opp = selectedOrder.opportunityId ? opportunities.find(o => o.id === selectedOrder.opportunityId) : null;
                      if (!opp) return (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
                              <Target className="w-8 h-8 mb-2 opacity-20" />
                              <span className="text-xs">暂无关联商机信息</span>
                          </div>
                      );
                      return (
                          <div className="divide-y divide-gray-50 dark:divide-white/5">
                              {[
                                  { label: '商机名称', value: opp.name },
                                  { label: '商机编号', value: opp.crmId || opp.id },
                                  { label: '商机客户名称', value: selectedOrder.customerName },
                                  { label: '商机产品名称', value: selectedOrder.items?.[0]?.productName },
                                  { label: '商机授权类型', value: selectedOrder.items?.[0]?.licenseType },
                                  { label: '商机阶段', value: opp.stage === 'Negotiation' ? '商务洽谈' : opp.stage === 'Qualification' ? '资格确定' : opp.stage === 'Proposal' ? '方案建议' : opp.stage === 'Closed Won' ? '已赢单' : opp.stage === 'Closed Lost' ? '已输单' : opp.stage },
                                  { label: '商机金额', value: `¥${(opp.amount || opp.expectedRevenue).toLocaleString()}` },
                                  { label: '结单日期', value: opp.closeDate },
                              ].map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-8 py-3.5">
                                      <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{item.label}</span>
                                      <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{item.value || '-'}</span>
                                  </div>
                              ))}
                          </div>
                      );
                  })()}
              </div>
              )}

              {/* Contract Info (dynamic) */}
              {hasPermission('order_detail_contract') && (
              <div className={`unified-card ${cardSpans.contract} dark:bg-[#1C1C1E] p-4 -gray-100/50 dark:-white/10 space-y-3`}>
                  <div className="border-b border-gray-100 dark:border-white/10 pb-2.5 flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Scroll className="w-5 h-5 text-blue-500"/> 合同信息
                      </h4>
                      <button
                          onClick={() => setIsContractPreviewOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-100 dark:border-blue-800/40"
                      >
                          <Paperclip className="w-3.5 h-3.5" /> 合同预览
                      </button>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                      {[
                          { label: '合同名称', value: `${selectedOrder.customerName}软件产品采购合同` },
                          { label: '合同编号', value: `HT-${new Date(selectedOrder.date).getFullYear()}-${selectedOrder.id.slice(-6).toUpperCase()}` },
                          { label: '签约金额', value: `¥${selectedOrder.total.toLocaleString()}`, highlight: true },
                      ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-8 py-3.5">
                              <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap whitespace-nowrap">{item.label}</span>
                              {item.highlight
                                  ? <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono flex-1">{item.value}</span>
                                  : <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{item.value || '-'}</span>
                              }
                          </div>
                      ))}
                  </div>
              </div>
              )}

              {/* Invoice Details (dynamic) */}
              {hasPermission('order_detail_invoice') && (
              <div className={`unified-card ${cardSpans.invoice} dark:bg-[#1C1C1E] p-4 -gray-100/50 dark:-white/10 space-y-3`}>
                  <div className="border-b border-gray-100 dark:border-white/10 pb-2.5">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-green-500"/> 开票明细</h4>
                  </div>
                  {selectedOrder.invoiceInfo ? (
                      <div className="divide-y divide-gray-50 dark:divide-white/5">
                          {[
                              { label: '发票抬头', value: selectedOrder.invoiceInfo.title },
                              { label: '纳税人识别号', value: selectedOrder.invoiceInfo.taxId },
                              { label: '发票类型', value: '增值税专用发票' },
                          ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-8 py-3.5">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap whitespace-nowrap">{item.label}</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{item.value || '-'}</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400 italic text-xs">
                          <FileText className="w-8 h-8 mb-2 opacity-20"/>
                          暂无开票信息
                      </div>
                  )}
              </div>
              )}

              {/* Original Order Numbers (dynamic) */}
              {hasPermission('order_detail_original') && (
              <div className={`unified-card ${cardSpans.original} dark:bg-[#1C1C1E] p-4 -gray-100/50 dark:-white/10 space-y-3`}>
                  <div className="border-b border-gray-100 dark:border-white/10 pb-2.5">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"><History className="w-5 h-5 text-purple-500"/> 原订单编号</h4>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                      {[
                          { label: 'SMS订单编号', value: selectedOrder.smsOriginalOrderId || 'S00713162' },
                          { label: 'SaaS订单编号', value: selectedOrder.saasOriginalOrderId || 'P20260303195755000001' },
                      ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-8 py-3.5">
                              <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap whitespace-nowrap">{item.label}</span>
                              <span className="text-sm font-medium font-mono text-gray-900 dark:text-white flex-1 break-all">{item.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
              )}
            </div>

            {/* Acceptance Information Table */}
            {hasPermission('order_detail_acceptance') && (
            <div className="unified-card dark:bg-[#1C1C1E] -gray-100/50 dark:-white/10">
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-green-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">验收信息</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header">
                                <tr>
                                    <th className="px-5 py-4 pl-6 text-center w-16 whitespace-nowrap">明细编号</th>
                                    <th className="px-5 py-4">产品名称</th>
                                    <th className="px-5 py-4">验收方式</th>
                                    <th className="px-5 py-4">验收条件</th>
                                    <th className="px-5 py-4">预计验收时间</th>
                                    <th className="px-5 py-4">验收比例</th>
                                    <th className="px-5 py-4 text-right pr-8">验收金额</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {selectedOrder.items.map((item, idx) => {
                                    const lineNo = String(idx + 1).padStart(3, '0');
                                    return (
                                    <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-5 pl-6 text-center">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">
                                                {lineNo}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">
                                            {selectedOrder.acceptanceConfig?.type === 'Phased' ? '分期验收' : '一次性验收'}
                                        </td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">视同验收</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">发货后2日</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">100%</td>
                                        <td className="px-5 py-5 text-right pr-8 font-bold text-gray-900 dark:text-white">
                                            ¥{(item.priceAtPurchase * item.quantity).toLocaleString()}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </>
        )}

          {activeTab === 'FULFILLMENT' && hasPermission('order_detail_delivery') && (
          <div className="space-y-6">
          {/* 订单交付列表 */}
          <div className="unified-card dark:bg-[#1C1C1E] -gray-100/50 dark:-white/10">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">订单交付列表</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                      <thead className="unified-table-header">
                          <tr>
                              <th className="px-5 py-4 pl-6 whitespace-nowrap">交付编号</th>
                              <th className="px-5 py-4 text-center whitespace-nowrap">购买数量</th>
                              <th className="px-5 py-4 whitespace-nowrap">被授权方</th>
                              <th className="px-5 py-4 whitespace-nowrap">客户名称/编号</th>
                              <th className="px-5 py-4 whitespace-nowrap">授权类型</th>
                              <th className="px-5 py-4 whitespace-nowrap">产品名称</th>
                              <th className="px-5 py-4 whitespace-nowrap">电子授权</th>
                              {(hasPermission('order_delivery_auth_change') || hasPermission('order_delivery_redelivery')) && (
                              <th className="px-5 py-4 text-right pr-6 whitespace-nowrap">操作</th>
                              )}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {selectedOrder.items.map((item, idx) => {
                              const deliveryNo = `JF${selectedOrder.id.replace(/[^0-9]/g, '').padStart(5, '0')}${String(idx + 1).padStart(3, '0')}`;
                              const productCode = `AB${String(item.productId).replace(/[^0-9]/g, '').padStart(7, '0')}`;
                              return (
                              <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-5 py-5 pl-6">
                                      <span className="font-mono font-bold text-[#0071E3] dark:text-[#0A84FF]">{deliveryNo}</span>
                                  </td>
                                  <td className="px-5 py-5 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</td>
                                  <td className="px-5 py-5 text-gray-700 dark:text-gray-300">{selectedOrder.customerName}</td>
                                  <td className="px-5 py-5">
                                      <div className="text-gray-900 dark:text-white font-medium">{selectedOrder.customerName}</div>
                                      <div className="text-xs text-gray-400 mt-0.5 font-mono">C-{selectedOrder.id.replace(/[^0-9]/g, '').padStart(8, '0')}</div>
                                  </td>
                                  <td className="px-5 py-5 text-gray-700 dark:text-gray-300">{item.licenseType || '-'}</td>
                                  <td className="px-5 py-5">
                                      <div className="text-gray-900 dark:text-white font-medium">{item.productName}</div>
                                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{productCode}</div>
                                  </td>
                                  <td className="px-5 py-5">
                                      {selectedOrder.isPaid && selectedOrder.confirmedDate && (
                                          <button
                                            onClick={() => { setSelectedCertificateItem(item); setIsCertPreviewMode(true); }}
                                            className="text-xs font-bold text-[#0071E3] hover:text-blue-700 dark:text-[#0A84FF] hover:underline flex items-center gap-1"
                                          >
                                              <Award className="w-3.5 h-3.5"/> 电子授权
                                          </button>
                                      )}
                                  </td>
                                  {(hasPermission('order_delivery_auth_change') || hasPermission('order_delivery_redelivery')) && (
                                  <td className="px-5 py-5 text-right pr-6">
                                      <div className="flex items-center justify-end gap-3">
                                          {hasPermission('order_delivery_auth_change') && (
                                          <button className="text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline whitespace-nowrap">授权信息变更</button>
                                          )}
                                          {hasPermission('order_delivery_redelivery') && (
                                          <button className="text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline whitespace-nowrap">二次交付申请</button>
                                          )}
                                      </div>
                                  </td>
                                  )}
                              </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
          </div>
        )}

        {activeTab === 'EMAIL' && hasPermission('order_detail_shipping') && (
          <div className="flex min-h-[600px]">
            {(() => {
              // ── Shared delivery record data ──────────────────────────────────
              const expressList = ['顺丰速运', '中通快递', '圆通速递', 'EMS邮政'];
              const senderNames = ['王明', '李静', '张伟', '赵敏'];
              const senderPhones = ['0756-8888001', '021-6666002', '010-5555003', '027-4444004'];
              const receiverPhones = [
                '138' + selectedOrder.id.slice(-8),
                '139' + selectedOrder.id.slice(-8),
                '136' + selectedOrder.id.slice(-8),
              ];
              const deliveryRecords = [
                {
                  no: '001',
                  type: '线下发货',
                  receiver: '买方',
                  unitName: selectedOrder.buyerName || selectedOrder.customerName,
                  item: selectedOrder.items[0],
                  method: '快递',
                  email: undefined as string | undefined,
                  address: selectedOrder.shippingAddress || '上海市浦东新区张江高科技园区',
                  senderName: '陈晓',
                  senderUnit: '珠海金山办公软件有限公司',
                  senderAddress: '广东省珠海市香洲区金山软件园8号楼',
                  senderPhone: '0756-8888099',
                  receiverName: selectedOrder.customerName.slice(0, 3) + '采购部',
                  receiverUnit: selectedOrder.buyerName || selectedOrder.customerName,
                  receiverAddress: selectedOrder.shippingAddress || '上海市浦东新区张江高科技园区',
                  receiverPhone: '021-8888' + selectedOrder.id.slice(-4),
                  expressCompany: '顺丰速运',
                  expressNo: `SF${selectedOrder.id.replace(/[^0-9]/g, '').slice(0, 6)}9999`,
                },
                ...selectedOrder.items.map((item, idx) => {
                  const receiver = idx % 3 === 0 ? '最终用户' : '买方';
                  const unitName = receiver === '最终用户'
                    ? selectedOrder.customerName
                    : (selectedOrder.buyerName || selectedOrder.customerName);
                  return {
                    no: String(idx + 2).padStart(3, '0'),
                    type: '线上发货',
                    receiver, unitName, item,
                    method: '账号分发',
                    email: `service@${selectedOrder.customerName.slice(0, 4).replace(/\s/g, '')}.com` as string | undefined,
                    address: undefined as string | undefined,
                    senderName: senderNames[idx % senderNames.length],
                    senderUnit: '珠海金山办公软件有限公司',
                    senderAddress: '广东省珠海市香洲区金山软件园8号楼',
                    senderPhone: senderPhones[idx % senderPhones.length],
                    receiverName: selectedOrder.customerName.slice(0, 3) + '负责人',
                    receiverUnit: unitName,
                    receiverAddress: selectedOrder.shippingAddress || '北京市海淀区中关村大街1号',
                    receiverPhone: receiverPhones[idx % receiverPhones.length],
                    expressCompany: expressList[idx % expressList.length],
                    expressNo: `SF${selectedOrder.id.replace(/[^0-9]/g, '').slice(0, 6)}${String(idx + 2).padStart(4, '0')}`,
                  };
                }),
              ];

              const active = deliveryRecords.find(r => r.no === (selectedDeliveryNo ?? deliveryRecords[0]?.no)) ?? deliveryRecords[0] ?? null;

              return (
                <>
                  {/* ── Left: Delivery Cards ─────────────────────────────── */}
                  <div className="w-[460px] shrink-0 space-y-3 pr-6 overflow-y-auto">
                    <div className="flex items-center gap-2 px-1 mb-4">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">发货信息</span>
                      <span className="ml-auto text-xs font-mono"><span className="text-[#0071E3] dark:text-[#0A84FF]">{deliveryRecords.length}</span><span className="text-gray-400 dark:text-gray-500"> 条</span></span>
                    </div>
                    {deliveryRecords.map((rec) => {
                      const isOnline = rec.type === '线上发货';
                      const isSelected = (selectedDeliveryNo ?? deliveryRecords[0]?.no) === rec.no;
                      return (
                        <div
                          key={rec.no}
                          onClick={() => setSelectedDeliveryNo(isSelected ? null : rec.no)}
                          className={`rounded-2xl shadow-apple border p-4 space-y-3 transition-all cursor-pointer ${
                            isSelected
                              ? isOnline
                                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 ring-2 ring-blue-200 dark:ring-blue-800'
                                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-800'
                              : 'bg-white dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border text-xs font-bold font-mono transition-colors ${
                              isSelected
                                ? isOnline
                                  ? 'bg-[#0071E3] border-blue-500 text-white'
                                  : 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40 text-[#0071E3] dark:text-[#0A84FF]'
                            }`}>{rec.no}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                {new Date(new Date(selectedOrder.date).getTime() + (rec.no.charCodeAt(2) - 48 + 1) * 86400000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOnline
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                                  : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-800'
                              }`}>
                                {isOnline ? <Box className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                {rec.type}
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-50 dark:divide-white/5 text-sm">
                            {[
                              { label: '收货方', value: rec.receiver },
                              { label: '收货单位名称', value: rec.unitName },
                              { label: '收货方式', value: rec.method },
                              ...(isOnline
                                ? [{ label: '收货邮箱', value: rec.email }]
                                : [{ label: '收货地址', value: rec.address }]
                              ),
                            ].map((field, fi) => (
                              <div key={fi} className="flex items-center gap-8 py-3.5">
                                <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-28 shrink-0 whitespace-nowrap">{field.label}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white break-all flex-1">{field.value || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Divider ──────────────────────────────────────────── */}
                  <div className="w-px bg-gray-200 dark:bg-white/10 mx-6 self-stretch" />

                  {/* ── Right: Detail Card ────────────────────────────────── */}
                  <div className="unified-card flex-1 dark:bg-[#1C1C1E] -gray-100/50 dark:-white/10 flex flex-col">
                    {!active ? (
                      <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] gap-4 text-gray-400 dark:text-gray-600">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center">
                          <Truck className="w-8 h-8 text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-sm font-medium">请点击左侧发货卡片查看详情</p>
                      </div>
                    ) : active.type === '线上发货' ? (
                      /* Online: email preview */
                      <div key={active.no} className="animate-page-enter flex flex-col flex-1 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">【金山办公】订购服务开通通知</h2>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">{active.receiver}</span>
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">#{active.no}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                          <div className="space-y-2">
                            <p>尊敬的用户： 您好！</p>
                            <p>请查阅贵组织订购信息并按照本邮件中指引操作后开始使用所订购产品/服务</p>
                          </div>
                          <div className="space-y-3 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">收货方:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.receiver}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">单位/企业:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.unitName}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">收货邮箱:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.email || '-'}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">产品:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.productName}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">购买套数/用户数:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.quantity}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">授权类型:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.licenseType || '用户订阅许可'}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">授权时长:</span><span className="font-bold text-blue-600 dark:text-blue-400">{new Date(selectedOrder.date).toLocaleDateString()} 至 {new Date(new Date(selectedOrder.date).setFullYear(new Date(selectedOrder.date).getFullYear() + 1)).toLocaleDateString()}</span></div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-red-600 font-bold">【重要-获取授权信息说明】 欢迎您使用金山办公产品/服务的电子交付，享WPS Office 正版权益。请您按照以下账号、密码或兑换码链接方式获取电子授权信息：</p>
                            <p>您的初始组织名称是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">{active.unitName}(企业ID: {active.item?.enterpriseId || '658057387'})</span>，登录信息是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">该组织为用户自创建，请用该组织的企业管理员账号登录查看，https://365.wps.cn/home（请您首次登录后尽快修改初始密码）</span>，请您按照如下操作指引获取贵组织本次所订购产品/服务电子授权信息。【升级、增减购、续费订单金山办公会按照订单信息直接在您管理后台增加权益，不再发送兑换码】</p>
                          </div>
                          <div>
                            <p className="font-bold">获取电子授权的操作步骤指引，详情请阅 <a href="https://365.kdocs.cn/l/cstq9xkV34VW" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.kdocs.cn/l/cstq9xkV34VW</a></p>
                          </div>
                          <div className="pt-6 border-t border-gray-100 dark:border-white/10 text-[10px] text-gray-400 space-y-3 italic">
                            <p>*本邮件仅为确认订购信息、交付电子授权的通知函，贵组织具有向本次订购的销售方支付全部款项的义务。</p>
                            <p>为便捷用户授权管理，【授权与保障】信息页面会持续升级，您可随时进入金山办公官网 <a href="https://365.wps.cn/authentication/list" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.wps.cn/authentication/list</a> 查看授权信息。</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Offline: courier info */
                      <div key={active.no} className="animate-page-enter overflow-y-auto flex-1">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 bg-gray-50 dark:bg-white/5 shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <Package className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">线下发货快递信息</h3>
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">#{active.no}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                        </div>
                        <div className="p-6 space-y-5">
                          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Truck className="w-6 h-6 text-orange-500 shrink-0" />
                              <div>
                                <div className="text-xs text-orange-400 font-bold mb-1">快递公司</div>
                                <div className="text-base font-bold text-gray-900 dark:text-white">{active.expressCompany}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400 font-bold mb-1">快递单号</div>
                              <div className="text-base font-bold font-mono text-orange-600 dark:text-orange-400 tracking-widest">{active.expressNo}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">寄件信息</span>
                              </div>
                              <div className="divide-y divide-gray-50 dark:divide-white/5 px-5 text-sm">
                                {[
                                  { label: '寄件人姓名', value: active.senderName },
                                  { label: '寄件单位', value: active.senderUnit },
                                  { label: '寄件地址', value: active.senderAddress },
                                  { label: '寄件人电话', value: active.senderPhone },
                                ].map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-8 py-3.5">
                                    <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{f.label}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 break-all">{f.value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">收件信息</span>
                              </div>
                              <div className="divide-y divide-gray-50 dark:divide-white/5 px-5 text-sm">
                                {[
                                  { label: '收件人姓名', value: active.receiverName },
                                  { label: '收件单位', value: active.receiverUnit },
                                  { label: '收件地址', value: active.receiverAddress },
                                  { label: '收件人电话', value: active.receiverPhone },
                                ].map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-8 py-3.5">
                                    <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{f.label}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 break-all">{f.value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>

      {/* --- Log Drawer --- */}
      {isLogDrawerOpen && (

          <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isLogDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseLogDrawer}></div>
              <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isLogDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-500"/> 订单流转记录
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
          </ModalPortal>

      )}

      {/* --- Snapshot Drawer --- */}
      {isSnapshotOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
            <div
              className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isSnapshotClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
              onClick={handleCloseSnapshot}
            />
            <div className={`relative w-full max-w-2xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isSnapshotClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-500" /> 订单快照
                </h3>
                <button onClick={handleCloseSnapshot} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 订单基础信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">订单基础信息</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: '订单编号', value: selectedOrder.id, mono: true },
                      { label: '下单时间', value: new Date(selectedOrder.date).toLocaleString(), mono: true },
                      { label: '订单总额', value: `¥${selectedOrder.total.toLocaleString()}`, className: 'text-red-600 dark:text-red-400' },
                      { label: '当前状态', value: statusMap[selectedOrder.status], className: 'text-blue-600 dark:text-blue-400' },
                    ].map(field => (
                      <div key={field.label} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">{field.label}</div>
                        <div className={`text-sm font-bold text-gray-900 dark:text-white ${field.mono ? 'font-mono' : ''} ${field.className || ''}`}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">销售负责人</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.salesRepName || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">商务经理</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.businessManagerName || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 客户信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">客户信息快照</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '客户名称', value: selectedOrder.customerName },
                      { label: '联系人',   value: fullCustomer?.contactPerson || '-' },
                      { label: '联系电话', value: fullCustomer?.phone || '-', mono: true },
                      { label: '收货地址', value: selectedOrder.shippingAddress || '无地址信息' },
                    ].map(field => (
                      <div key={field.label} className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{field.label}</span>
                        <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 ${field.mono ? 'font-mono' : ''}`}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 产品明细 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">产品明细快照</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5 text-left">产品</th>
                          <th className="px-4 py-2.5 text-center">数量</th>
                          <th className="px-4 py-2.5 text-right">单价</th>
                          <th className="px-4 py-2.5 text-right">小计</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">{item.productName}</div>
                              <div className="text-gray-400 font-mono mt-0.5">{item.skuName}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">×{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">¥{item.priceAtPurchase.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/50 dark:bg-white/5">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-gray-500">合计应收金额</td>
                          <td className="px-4 py-3 text-right text-base font-bold text-red-600 dark:text-red-400 font-mono">¥{selectedOrder.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 说明 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <p className="font-bold mb-1">快照说明</p>
                    <p>订单快照展示的是订单创建时的原始信息，在订单生效后通常不可变更，用于作为合同执行和财务结算的原始依据。如需修改交付地址或物流信息，请前往「订单交付」页签操作。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* --- Action Drawer --- */}
      {activeStepModal && (

          <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseDrawer}></div>
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
                                               <button onClick={() => handleApproveAction('sales', 'Approve')} className="unified-button-primary -1">同意</button>
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
                                               <button onClick={() => handleApproveAction('business', 'Approve')} className="unified-button-primary -1">同意</button>
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
                                               <button onClick={() => handleApproveAction('finance', 'Approve')} className="unified-button-primary -1">同意</button>
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
                                           <thead className="unified-table-header">
                                               <tr>
                                                   <th className="p-3">编号</th>
                                                   <th className="p-3">安装包名称</th>
                                                   <th className="p-3">发布平台</th>
                                                   <th className="p-3">操作系统</th>
                                                   <th className="p-3">CPU</th>
                                               </tr>
                                           </thead>
                                           <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                               {selectedOrder.items.map(item => {
                                                   const product = products.find(p => p.id === item.productId);
                                                   return product?.installPackages?.map(pkg => (
                                                       <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                           <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{pkg.id}</td>
                                                           <td className="p-3 dark:text-white font-medium">{pkg.name}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.platform || '-'}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.os || '-'}</td>
                                                           <td className="p-3 dark:text-gray-300">{pkg.cpu || '-'}</td>
                                                       </tr>
                                                   ));
                                               })}
                                               {selectedOrder.items.every(item => !products.find(p => p.id === item.productId)?.installPackages?.length) && (
                                                   <tr>
                                                       <td colSpan={5} className="p-8 text-center text-gray-400 italic">暂无关联安装包信息</td>
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
                                      className="unified-button-primary w-full bg-[#0071E3] dark:bg-[#0A84FF] rounded-2xl animate-pulse hover:opacity-80 mt-4"
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
          </ModalPortal>

      )}

      {/* License Cert Drawer */}
      {selectedCertificateItem && (

          <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isCertDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={handleCloseCertDrawer}></div>
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
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'paper' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                               >
                                   纸质排版
                               </button>
                               <button 
                                   onClick={() => setCertView('structured')}
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'structured' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
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
                                         <div className="unified-button-primary w-20 h-20 rounded-3xl text-3xl font-black italic shadow-xl">W</div>
                                         <div className="text-sm font-bold tracking-[0.4em] text-blue-600 uppercase">WPS Enterprise Systems</div>
                                     </div>
                                     
                                     <div className="space-y-2">
                                        <h2 className="text-5xl font-serif text-gray-900 font-medium tracking-wide">软件产品授权证书</h2>
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.3em]">Certificate of Software License</div>
                                     </div>

                                     <div className="text-left text-lg leading-loose text-gray-700 space-y-10 pt-10 border-t border-gray-100">
                                         <div>
                                             <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">授权用户 (Licensee)</p>
                                             <h3 className="text-3xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500/30 decoration-4">{selectedOrder.customerName}</h3>
                                         </div>
                                         
                                         <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-left bg-gray-50 p-8 rounded-3xl border border-gray-100">
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">产品名称 (Product)</div>
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
                                                 <div className="font-mono text-base text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-100 break-all shadow-apple">
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
                            <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-5xl flex flex-col">
                                <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCertificateItem.productName}授权信息</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 rounded-full relative cursor-pointer">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-apple"></div>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">未生效</span>
                                        </div>
                                    </div>
                                    <button className="unified-button-primary">编辑</button>
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
                        <div className="unified-card p-6 dark:bg-[#1C1C1E] -t -gray-100 dark:-white/10 flex justify-end gap-3 shrink-0 shadow-[-5px_0_30px_rgba(0,0,0,0.1)] z-20">
                            <button onClick={handleCloseCertDrawer} className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-bold text-sm">取消</button>
                            <button onClick={() => handleStockAction('auth')} className="unified-button-primary bg-[#0071E3] dark:bg-[#0A84FF] hover: dark:hover:bg-[#0A84FF]/80">确认授权无误</button>
                        </div>
                   )}
              </div>
          </div>
          </ModalPortal>

      )}

      {/* Fulfillment Modal */}
      {fulfillmentItemIndex !== null && (

          <ModalPortal>
          <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md animate-modal-enter -white/10">
                  <div className="p-6 border-b dark:border-white/10 flex justify-between items-center"><h3 className="font-bold dark:text-white">配置交付内容</h3><button onClick={() => setFulfillmentItemIndex(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div>
                  <div className="p-6 space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase block">授权码 / 链接 (每行一个)</label>
                      <textarea value={fulfillmentContent} onChange={e => setFulfillmentContent(e.target.value)} placeholder="例如：XXXXX-XXXXX-XXXXX" className="w-full p-4 bg-gray-50 dark:bg-black border border-transparent dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white min-h-[160px] resize-none font-mono" />
                      <button onClick={saveFulfillment} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-80 transition">保存</button>
                  </div>
              </div>
          </div>
          </ModalPortal>

      )}

      {/* Order Item Details Drawer */}
      {selectedItemForDetails && (
          <div className="fixed inset-y-0 right-0 left-[240px] z-[70] flex justify-end">
              <div 
                  className={`absolute inset-0 bg-black/20 backdrop-blur-sm ${isItemDetailsClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
                  onClick={() => {
                      setIsItemDetailsClosing(true);
                      setTimeout(() => {
                          setSelectedItemForDetails(null);
                          setIsItemDetailsClosing(false);
                      }, 300);
                  }}
              />
              <div className={`w-full bg-white dark:bg-[#1C1C1E] h-full shadow-2xl flex flex-col relative z-10 ${isItemDetailsClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="unified-card p-5 -b -gray-100 dark:-white/10 flex justify-between items-center dark:bg-[#1C1C1E] shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Package className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                              <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">订单产品明细详情</h3>
                                  <span className="text-xl font-bold text-gray-500 dark:text-gray-400 font-mono">
                                      {selectedOrder.id}-{String(selectedItemIndex + 1).padStart(3, '0')}
                                  </span>
                              </div>
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
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
                      <div className="grid grid-cols-3 gap-4">

                          {/* 左侧大列 (2/3)：产品交易信息、产品交付信息、产品授权信息 纵向排列 */}
                          <div className="col-span-2 space-y-4">

                              {/* 产品交易信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Box className="w-5 h-5 text-blue-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品交易信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const itemAmount = selectedItemForDetails.priceAtPurchase * selectedItemForDetails.quantity;
                                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                                          const fields = [
                                              { label: '产品名称', value: selectedItemForDetails.productName || '-', isAmount: false },
                                              { label: '产品规格', value: [selectedItemForDetails.skuName, selectedItemForDetails.skuCode].filter(Boolean).join('  ·  ') || '-', isAmount: false },
                                              { label: '授权类型', value: selectedItemForDetails.pricingOptionName || selectedItemForDetails.licenseType || '-', isAmount: false },
                                              { label: '产品类型', value: selectedItemForDetails.productType || '-', isAmount: false },
                                              { label: '数量', value: String(selectedItemForDetails.quantity), isAmount: false },
                                              { label: '单价', value: fmt(selectedItemForDetails.priceAtPurchase), isAmount: true },
                                              { label: '计价数量', value: String(selectedItemForDetails.quantity), isAmount: false },
                                              { label: '计价单价', value: selectedItemForDetails.pricingUnitPrice != null ? fmt(selectedItemForDetails.pricingUnitPrice) : '-', isAmount: true },
                                              { label: '产品金额', value: fmt(itemAmount), isAmount: true },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className={`text-sm font-medium flex-1 ${f.isAmount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 产品授权信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <ShieldCheck className="w-5 h-5 text-purple-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品授权信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const fields = [
                                              { label: '被授权方', value: selectedItemForDetails.licensee || '-' },
                                              { label: '授权范围', value: selectedItemForDetails.licenseScope || '企业内部使用' },
                                              { label: '授权期限', value: (selectedItemForDetails.licensePeriod && selectedItemForDetails.licensePeriod !== '永久') ? selectedItemForDetails.licensePeriod : '-' },
                                              { label: '授权开始计算', value: selectedItemForDetails.licenseStartMethod || '-' },
                                              { label: '授权截止日期', value: selectedItemForDetails.licenseEndDate || '-' },
                                              { label: '是否下级单位提供授权', value: selectedItemForDetails.subUnitLicenseAllowed == null ? '-' : selectedItemForDetails.subUnitLicenseAllowed ? '是' : '否' },
                                              { label: '升级保障期限', value: selectedItemForDetails.upgradeWarrantyPeriod || '-' },
                                              { label: '售后保障期限', value: selectedItemForDetails.afterSaleWarrantyPeriod || '1年' },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 产品价格参考 */}
                              <div className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <CreditCard className="w-5 h-5 text-green-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品价格参考</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const fields = [
                                              { label: '渠道等级', value: selectedItemForDetails.channelLevel || '-', isAmount: false },
                                              { label: '协议编号', value: selectedItemForDetails.agreementNo || '-', isAmount: false },
                                              { label: '匹配价格类型', value: selectedItemForDetails.matchedPriceType || '-', isAmount: false },
                                              { label: '匹配价格', value: selectedItemForDetails.matchedPrice != null ? `¥${selectedItemForDetails.matchedPrice.toLocaleString()}` : '-', isAmount: true },
                                              { label: '匹配价格ID', value: selectedItemForDetails.matchedPriceId || '-', isAmount: false },
                                              { label: '建议销售价', value: selectedItemForDetails.suggestedRetailPrice != null ? `¥${selectedItemForDetails.suggestedRetailPrice.toLocaleString()}` : '-', isAmount: true },
                                          ];
                                          return (
                                              <div className="grid grid-cols-2 gap-x-6">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className={`flex items-start gap-4 py-3.5 ${idx < fields.length - 2 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className={`text-sm font-medium flex-1 ${f.isAmount ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                          </div>

                          {/* 右侧小列 (1/3)：产品交付信息 + 安装包 纵向排列 */}
                          <div className="space-y-4">

                              {/* 产品交付信息 */}
                              <div className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Truck className="w-5 h-5 text-indigo-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">产品交付信息</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const activationLabel = selectedItemForDetails.activationMethod === 'LicenseKey' ? '授权码激活'
                                              : selectedItemForDetails.activationMethod === 'Online' ? '在线激活' : '加密狗';
                                          const distMode = selectedItemForDetails.distributionMode
                                              || (selectedItemIndex % 2 === 0 ? '账号分发' : '兑换码分发');
                                          const enterpriseName = selectedItemForDetails.enterpriseName || selectedOrder.customerName;
                                          const enterpriseId = selectedItemForDetails.enterpriseId
                                              || String(parseInt(selectedOrder.id.replace(/\D/g, '').slice(-6) || '100000', 10) + 500000000).slice(0, 9);
                                          const fields = [
                                              { label: '分发模式', value: distMode },
                                              { label: '激活方式', value: activationLabel },
                                              { label: '企业名称', value: enterpriseName },
                                              { label: '企业ID', value: enterpriseId },
                                              { label: '供货组织信息', value: selectedItemForDetails.supplyOrgInfo || '-' },
                                          ];
                                          return (
                                              <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {fields.map((f, idx) => (
                                                      <div key={idx} className="flex items-center gap-8 py-3.5">
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{f.label}</span>
                                                          <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{f.value}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                              {/* 安装包 */}
                              <div className="unified-card dark:bg-[#1C1C1E] -gray-100 dark:-white/10">
                                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                                      <Disc className="w-5 h-5 text-blue-500" />
                                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">安装包</h4>
                                  </div>
                                  <div className="p-5">
                                      {(() => {
                                          const product = products.find(p => p.id === selectedItemForDetails.productId);
                                          const pkg = product?.installPackages?.[0];
                                          if (!pkg) {
                                              return (
                                                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                                      <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                                                          <AlertCircle className="w-6 h-6 text-gray-300" />
                                                      </div>
                                                      <div className="text-sm text-gray-400 italic">暂无安装包数据</div>
                                                  </div>
                                              );
                                          }
                                          const rows: { label: string; value: string; isLink?: boolean }[] = [
                                              { label: '安装包编号', value: pkg.id },
                                              { label: '安装包名称', value: pkg.name },
                                              { label: 'CPU', value: pkg.cpu || '-' },
                                              { label: '操作系统', value: pkg.os || '-' },
                                              { label: '架构', value: pkg.arch || '-' },
                                              { label: '安装包链接', value: pkg.url || '-', isLink: true },
                                              { label: '安装包备注', value: pkg.remarks || '-' },
                                          ];
                                          return (
                                              <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                  {rows.map((row, i) => (
                                                      <div key={i} className="flex items-center gap-8 py-3.5">
                                                          <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{row.label}</span>
                                                          {row.isLink && row.value !== '-' ? (
                                                              <a href={row.value} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline flex-1 truncate">{row.value}</a>
                                                          ) : (
                                                              <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{row.value}</span>
                                                          )}
                                                      </div>
                                                  ))}
                                              </div>
                                          );
                                      })()}
                                  </div>
                              </div>

                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* Contract Preview Modal */}
      {isContractPreviewOpen && selectedOrder && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col -gray-200/50 dark:-white/10">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Scroll className="w-5 h-5 text-[#0071E3]" />
                          </div>
                          <div>
                              <div className="text-base font-bold text-gray-900 dark:text-white">{selectedOrder.customerName}软件产品采购合同</div>
                              <div className="text-xs text-gray-400 font-mono">HT-{new Date(selectedOrder.date).getFullYear()}-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => setContractZoom(z => Math.max(60, z - 10))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition"><ZoomOut className="w-4 h-4" /></button>
                          <span className="text-xs text-gray-500 w-10 text-center">{contractZoom}%</span>
                          <button onClick={() => setContractZoom(z => Math.min(150, z + 10))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition"><ZoomIn className="w-4 h-4" /></button>
                          <button className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition" title="下载合同"><Download className="w-4 h-4" /></button>
                          <button onClick={() => setIsContractPreviewOpen(false)} className="ml-1 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
                      </div>
                  </div>

                  {/* Contract Document */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 dark:bg-black/30 p-6">
                      <div
                          className="bg-white dark:bg-[#2C2C2E] mx-auto shadow-xl rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-200"
                          style={{ width: `${contractZoom}%`, minWidth: '480px', padding: '60px 72px' }}
                      >
                          {/* Contract Title */}
                          <div className="text-center mb-8">
                              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest mb-1">软件产品采购合同</h1>
                              <div className="text-sm text-gray-400 font-mono">合同编号：HT-{new Date(selectedOrder.date).getFullYear()}-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                          </div>

                          {/* Parties */}
                          <div className="mb-6 text-sm leading-8 text-gray-700 dark:text-gray-300">
                              <p>甲方（买方）：<strong className="text-gray-900 dark:text-white">{selectedOrder.customerName}</strong></p>
                              <p>乙方（卖方）：<strong className="text-gray-900 dark:text-white">北京金山办公软件股份有限公司</strong></p>
                              <p className="mt-2 text-gray-500 dark:text-gray-400 text-xs leading-6">
                                  根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿、公平、诚实信用的基础上，经友好协商，就甲方购买乙方软件产品事宜，达成如下协议：
                              </p>
                          </div>

                          <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-5" />

                          {/* Article 1 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第一条　产品信息</h2>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-xs border border-gray-200 dark:border-white/10 border-collapse">
                                      <thead>
                                          <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">序号</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">产品名称</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">规格/版本</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center font-bold">数量</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-bold">单价（元）</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-bold">小计（元）</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {selectedOrder.items.map((item, idx) => (
                                              <tr key={idx} className="text-gray-700 dark:text-gray-300">
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center">{idx + 1}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2">{item.productName}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2">{item.skuName || item.skuCode}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center">{item.quantity}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                              </tr>
                                          ))}
                                          <tr className="bg-orange-50/60 dark:bg-orange-900/10 font-bold text-gray-900 dark:text-white">
                                              <td colSpan={5} className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right">合计金额</td>
                                              <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono text-red-600 dark:text-red-400">¥{selectedOrder.total.toLocaleString()}</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-6">
                                  合同总金额（大写）：<strong className="text-gray-700 dark:text-gray-300">{(() => {
                                      const units = ['', '拾', '佰', '仟'];
                                      const bigUnits = ['', '万', '亿'];
                                      const nums = '零壹贰叁肆伍陆柒捌玖';
                                      const n = Math.round(selectedOrder.total);
                                      if (n === 0) return '零元整';
                                      let result = '';
                                      const str = String(n);
                                      const len = str.length;
                                      for (let i = 0; i < len; i++) {
                                          const d = parseInt(str[i]);
                                          const pos = len - i - 1;
                                          result += nums[d];
                                          if (d !== 0) result += units[pos % 4];
                                          if (pos % 4 === 0 && pos !== 0) result += bigUnits[Math.floor(pos / 4)];
                                      }
                                      return result + '元整';
                                  })()}</strong>
                              </p>
                          </div>

                          {/* Article 2 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第二条　付款方式</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  甲方应于合同签订后 <strong className="text-gray-900 dark:text-white">30</strong> 个工作日内，将合同款项全额汇入乙方指定账户。付款方式为银行转账。乙方收到全部款项后，向甲方开具增值税专用发票。
                              </p>
                              <div className="mt-3 bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                  <p>开户行：<span className="text-gray-800 dark:text-gray-200">中国工商银行北京海淀支行</span></p>
                                  <p>账户名称：<span className="text-gray-800 dark:text-gray-200">北京金山办公软件股份有限公司</span></p>
                                  <p>银行账号：<span className="text-gray-800 dark:text-gray-200 font-mono">0200 0048 0920 0135 958</span></p>
                              </div>
                          </div>

                          {/* Article 3 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第三条　交付方式</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  乙方在收到甲方全额货款后，通过电子邮件或在线系统向甲方交付产品授权码（License Key）及相关安装介质。交付完成后，甲方应在 <strong className="text-gray-900 dark:text-white">5</strong> 个工作日内签署验收确认书。
                              </p>
                          </div>

                          {/* Article 4 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第四条　保密条款</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  双方对在合同履行过程中知悉的对方商业秘密及技术秘密，负有保密义务，未经书面同意不得向第三方披露，该义务在合同终止后仍持续有效，期限为 <strong className="text-gray-900 dark:text-white">3</strong> 年。
                              </p>
                          </div>

                          {/* Article 5 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第五条　违约责任</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  任何一方违反本合同规定，应向守约方支付合同总金额 <strong className="text-gray-900 dark:text-white">10%</strong> 的违约金，并赔偿由此造成的全部损失。
                              </p>
                          </div>

                          {/* Article 6 */}
                          <div className="mb-8">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第六条　争议解决</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  本合同在履行过程中发生的争议，双方应友好协商解决；协商不成的，提交 <strong className="text-gray-900 dark:text-white">北京仲裁委员会</strong> 按其仲裁规则进行仲裁，仲裁裁决为终局裁决。
                              </p>
                          </div>

                          <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-6" />

                          {/* Signatures */}
                          <div className="grid grid-cols-2 gap-8 text-xs text-gray-600 dark:text-gray-400">
                              <div className="space-y-3">
                                  <p className="font-bold text-gray-800 dark:text-gray-200">甲方（盖章）</p>
                                  <p>{selectedOrder.customerName}</p>
                                  <div className="w-28 h-28 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-2 opacity-60">
                                      <div className="text-center">
                                          <div className="text-[9px] text-red-400 font-bold tracking-widest">合同专用章</div>
                                          <div className="text-[8px] text-red-400 mt-1">{selectedOrder.customerName.slice(0, 6)}</div>
                                      </div>
                                  </div>
                                  <p className="mt-2">签约日期：{new Date(selectedOrder.date).toLocaleDateString('zh-CN')}</p>
                              </div>
                              <div className="space-y-3">
                                  <p className="font-bold text-gray-800 dark:text-gray-200">乙方（盖章）</p>
                                  <p>北京金山办公软件股份有限公司</p>
                                  <div className="w-28 h-28 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-2 opacity-60">
                                      <div className="text-center">
                                          <div className="text-[9px] text-red-400 font-bold tracking-widest">合同专用章</div>
                                          <div className="text-[8px] text-red-400 mt-1">金山办公</div>
                                      </div>
                                  </div>
                                  <p className="mt-2">签约日期：{new Date(selectedOrder.date).toLocaleDateString('zh-CN')}</p>
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
