import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    FileText, CheckSquare, Package, Truck, ClipboardCheck, CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Order, OrderStatus, OrderItem, ApprovalRecord, User } from '../../types';
import UserDetailPanel from '../common/UserDetailPanel';
import EmployeeCardModal from '../common/EmployeeCardModal';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import OrderLogDrawer from './OrderLogDrawer';
import OrderSnapshotDrawer from './OrderSnapshotDrawer';
import OrderContractPreview from './OrderContractPreview';
import OrderItemDetailsDrawer from './OrderItemDetailsDrawer';
import { ConfirmDialog } from './detail/ConfirmDialog';
import { EmptyState } from './detail/EmptyState';
import { OrderDetailSkeleton } from './detail/OrderDetailSkeleton';
import { statusMap } from './detail/constants';
import { OrderDetailHeader } from './detail/OrderDetailHeader';
import { OrderWorkflowStepper } from './detail/OrderWorkflowStepper';
import { OrderManagementTab } from './detail/OrderManagementTab';
import { OrderFulfillmentTab } from './detail/OrderFulfillmentTab';
import { OrderShippingTab } from './detail/OrderShippingTab';
import { OrderStepActionDrawer } from './detail/OrderStepActionDrawer';
import { OrderCertificateDrawer } from './detail/OrderCertificateDrawer';
import { OrderFulfillmentModal } from './detail/OrderFulfillmentModal';
import { OrderContractPickerModal } from './detail/OrderContractPickerModal';
import { OrderContractInlinePreviewModal } from './detail/OrderContractInlinePreviewModal';
import { ServiceDetailModal } from './detail/ServiceDetailModal';
import type { OrderDetailTab, ServiceDetailItem } from './detail/types';

const OrderDetails: React.FC = () => {
  const { orders, setOrders, products, customers, filteredOrders, users, setUsers, departments, opportunities, contracts, roles, apiMode, refreshOrders } = useAppContext();
  const { currentUser } = useAuth();
  useEnsureData(['orders', 'customers', 'contracts']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentUserRole = roles.find(r => currentUser.roles?.includes(r.id));
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  const selectedOrder = useMemo(() => {
      const o = filteredOrders.find(o => o.id === id);
      if (!o) return undefined;
      return {
          ...o,
          items: o.items || [],
          total: typeof o.total === 'number' ? o.total : 0,
          approvalRecords: o.approvalRecords || [],
      };
  }, [filteredOrders, id]);

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
  const [serviceDetailModal, setServiceDetailModal] = useState<{ id: string; productType: string; productSpec: string; productName: string; serviceMethod: string; servicePeriod: string; quantity: number; unitPrice: number; subtotal: number } | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [itemDrawerInitialTab, setItemDrawerInitialTab] = useState<'INFO' | 'SUBUNIT'>('INFO');
  const [isItemDetailsClosing, setIsItemDetailsClosing] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isLogDrawerClosing, setIsLogDrawerClosing] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [isSnapshotClosing, setIsSnapshotClosing] = useState(false);
  const [showCreatorPhone, setShowCreatorPhone] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isUserDrawerClosing, setIsUserDrawerClosing] = useState(false);
  const [isEmployeeCardOpen, setIsEmployeeCardOpen] = useState(false);
  const openUserDetail = (userId?: string) => {
    if (!userId) return;
    const u = users.find(uu => uu.id === userId);
    if (!u) return;
    setDetailsUser(u);
    setIsUserDrawerOpen(true);
  };
  const closeUserDrawer = () => {
    setIsUserDrawerClosing(true);
    setTimeout(() => { setIsUserDrawerOpen(false); setDetailsUser(null); setIsUserDrawerClosing(false); }, 280);
  };
  const handleCopyOrderId = () => {
      navigator.clipboard.writeText(selectedOrder?.id || '').then(() => {
          setCopiedOrderId(true);
          setTimeout(() => setCopiedOrderId(false), 1500);
      });
  };

  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');
  const [activeTab, setActiveTab] = useState<'MANAGEMENT' | 'FULFILLMENT' | 'EMAIL'>('MANAGEMENT');
  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);
  const [contractZoom, setContractZoom] = useState(100);
  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(new Set());
  const [previewContractId, setPreviewContractId] = useState<string | null>(null);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [contractPickerSearch, setContractPickerSearch] = useState('');
  const [tempLinkedContractIds, setTempLinkedContractIds] = useState<string[]>([]);
  const [selectedDeliveryNo, setSelectedDeliveryNo] = useState<string | null>(null);


  // Step specific forms
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');
  const [paymentForm, setPaymentForm] = useState({ bankName: '', transactionId: '', paymentMethod: 'Transfer' as 'WechatPay' | 'Alipay' | 'Transfer' });
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
      if (location.state && (location.state as { openAction?: string }).openAction) {
          setActiveStepModal((location.state as { openAction?: string }).openAction || null);
      }
  }, [location.state]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
      title: string; description: string; confirmLabel?: string;
      variant?: 'danger' | 'primary'; onConfirm: () => void;
  } | null>(null);

  const requestConfirm = useCallback((opts: {
      title: string; description: string; confirmLabel?: string;
      variant?: 'danger' | 'primary'; onConfirm: () => void;
  }) => setConfirmDialog(opts), []);

  const isDataLoading = apiMode && orders.length === 0;

  if (isDataLoading) {
      return <OrderDetailSkeleton />;
  }

  if (!selectedOrder) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-[#F5F2EC] dark:bg-black">
              <EmptyState
                  icon={<FileText className="w-7 h-7 text-gray-300 dark:text-gray-600" />}
                  title="订单不存在"
                  description="该订单可能已被删除或编号有误"
              />
              <button onClick={() => navigate('/orders')} className="text-[#0071E3] dark:text-[#0A84FF] text-sm font-semibold hover:underline mt-2">返回订单列表</button>
          </div>
      );
  }

  const fullCustomer = customers.find(c => c.id === selectedOrder.customerId);
  const salesUser = users.find(u => u.id === selectedOrder.salesRepId);
  const salesDept = departments.find(d => d.id === salesUser?.departmentId);

  const updateOrder = async (updatedOrder: Order) => {
      if (apiMode) {
          try {
              const { orderApi } = await import('../../services/api');
              await orderApi.update(updatedOrder.id, updatedOrder);
              await refreshOrders();
          } catch (e: unknown) {
              console.error('[API] Failed to update order:', e);
              alert(e instanceof Error ? e.message : '订单更新失败');
              return;
          }
      } else {
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
  };

  const createOperationRecord = (actionType: string, result: string, comment?: string): ApprovalRecord => ({
      id: `op-${Date.now()}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.roles?.join(',') || '',
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

  // Updated Workflow — 自成交订单无工作流，其他类型订单不含支付步骤（支付按钮已移至右上角）
  let steps: { id: string; label: string; icon: LucideIcon; status: string; completedAt?: string; disabled?: boolean }[] = [];

  if (selectedOrder.buyerType !== 'SelfDeal') {
      steps = [
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

      steps = steps.filter(s => hasPermission(stepPermissionMap[s.id] || ''));
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
      if (paymentForm.paymentMethod === 'Transfer' && !paymentForm.bankName.trim()) { alert('请填写收款银行'); return; }
      const isSelfDeal = selectedOrder.buyerType === 'SelfDeal';
      const pmLabel = paymentForm.paymentMethod === 'WechatPay' ? '微信支付' : paymentForm.paymentMethod === 'Alipay' ? '支付宝' : '银行转账';
      const paymentRecord = {
          amount: selectedOrder.total,
          paymentDate: new Date().toISOString(),
          bankName: paymentForm.bankName,
          accountNumber: '',
          transactionId: paymentForm.transactionId,
          payerName: selectedOrder.customerName,
          paymentMethod: paymentForm.paymentMethod,
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
              paymentMethod: paymentForm.paymentMethod,
              paymentDate: new Date().toISOString(),
              paymentRecord,
              items: updatedItems,
              shippedDate: new Date().toISOString(),
              isAuthConfirmed: true, isPackageConfirmed: true, isCDBurned: true, isShippingConfirmed: true,
              approval: { salesApproved: true, businessApproved: true, financeApproved: true },
              approvalRecords: [
                  createOperationRecord('支付完成', 'Paid', `${pmLabel} · 流水号: ${paymentForm.transactionId}`),
                  createOperationRecord('系统交付', 'Completed', '自助订单自动完成交付')
              , ...selectedOrder.approvalRecords]
          });
      } else {
          updateOrder({
              ...selectedOrder,
              isPaid: true,
              status: OrderStatus.PENDING_APPROVAL,
              paymentMethod: paymentForm.paymentMethod,
              paymentDate: new Date().toISOString(),
              paymentRecord,
              approvalRecords: [createOperationRecord('确认收款', 'Paid', `${pmLabel} · 流水号: ${paymentForm.transactionId}`), ...selectedOrder.approvalRecords]
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

  const canAccept = selectedOrder.status === OrderStatus.SHIPPED;

  const handleAcceptPhase = (phaseId: string) => {
      if (!selectedOrder.acceptanceConfig || !canAccept) return;
      const phases = selectedOrder.acceptanceConfig.phases.map(p => p.id === phaseId ? { ...p, status: 'Accepted' as const, acceptedDate: new Date().toISOString() } : p);
      updateOrder({ 
          ...selectedOrder, 
          acceptanceConfig: { ...selectedOrder.acceptanceConfig, phases, status: 'In Progress' },
          approvalRecords: [createOperationRecord('验收确认', 'Success', '阶段验收通过'), ...selectedOrder.approvalRecords]
      });
  };

  const handleCompleteAcceptance = () => {
      if (!canAccept) { alert('仅在"已发货"状态下可进行验收操作。'); return; }
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

  const previewContract = previewContractId ? contracts.find(ct => ct.id === previewContractId) : undefined;

  return (
    <>
      
      <div className="flex flex-col min-h-screen bg-[#F5F2EC] dark:bg-black">
        <OrderDetailHeader
          selectedOrder={selectedOrder}
          users={users}
          copiedOrderId={copiedOrderId}
          showCreatorPhone={showCreatorPhone}
          activeTab={activeTab}
          hasPermission={hasPermission}
          onCopyOrderId={handleCopyOrderId}
          onToggleCreatorPhone={() => setShowCreatorPhone(v => !v)}
          onOpenUserDetail={openUserDetail}
          onOpenSnapshot={handleOpenSnapshot}
          onOpenLog={handleOpenLogDrawer}
          onOpenStepModal={setActiveStepModal}
          onTabChange={setActiveTab}
        />

        {activeTab === 'MANAGEMENT' && hasPermission('order_workflow_view') && steps.length > 0 && (
          <OrderWorkflowStepper steps={steps} onStepClick={setActiveStepModal} />
        )}

        <div className="page-container space-y-2.5 animate-page-enter pb-20">
          {activeTab === 'MANAGEMENT' && (
            <OrderManagementTab
              selectedOrder={selectedOrder}
              products={products}
              customers={customers}
              contracts={contracts}
              opportunities={opportunities}
              hasPermission={hasPermission}
              onOpenItemDetails={(item, index, tab) => {
                setItemDrawerInitialTab(tab);
                setSelectedItemForDetails(item);
                setSelectedItemIndex(index);
              }}
              onOpenServiceDetail={setServiceDetailModal}
              onOpenContractPicker={() => {
                setTempLinkedContractIds([...(selectedOrder.linkedContractIds || [])]);
                setContractPickerSearch('');
                setShowContractPicker(true);
              }}
              onPreviewContract={setPreviewContractId}
            />
          )}

          {activeTab === 'FULFILLMENT' && hasPermission('order_detail_delivery') && (
            <OrderFulfillmentTab
              selectedOrder={selectedOrder}
              hasPermission={hasPermission}
              onPreviewCertificate={(item) => {
                setSelectedCertificateItem(item);
                setIsCertPreviewMode(true);
              }}
            />
          )}

          {activeTab === 'EMAIL' && hasPermission('order_detail_shipping') && (
            <OrderShippingTab
              selectedOrder={selectedOrder}
              selectedDeliveryNo={selectedDeliveryNo}
              onSelectDeliveryNo={setSelectedDeliveryNo}
            />
          )}
        
        </div>
      </div>

      <OrderLogDrawer
        isOpen={isLogDrawerOpen}
        isClosing={isLogDrawerClosing}
        onClose={handleCloseLogDrawer}
        order={selectedOrder}
      />

      <OrderSnapshotDrawer
        isOpen={isSnapshotOpen}
        isClosing={isSnapshotClosing}
        onClose={handleCloseSnapshot}
        order={selectedOrder}
        statusMap={statusMap}
        fullCustomer={fullCustomer}
      />

      {activeStepModal && (
        <OrderStepActionDrawer
          activeStepModal={activeStepModal}
          isDrawerClosing={isDrawerClosing}
          steps={steps}
          selectedOrder={selectedOrder}
          products={products}
          users={users}
          approvalComment={approvalComment}
          paymentForm={paymentForm}
          shippingCarrier={shippingCarrier}
          shippingTracking={shippingTracking}
          refundReason={refundReason}
          refundAmount={refundAmount}
          canAccept={canAccept}
          onClose={handleCloseDrawer}
          onApprovalCommentChange={setApprovalComment}
          onPaymentFormChange={setPaymentForm}
          onShippingCarrierChange={setShippingCarrier}
          onShippingTrackingChange={setShippingTracking}
          onRefundReasonChange={setRefundReason}
          onRefundAmountChange={setRefundAmount}
          onApproveAction={handleApproveAction}
          onConfirmOrder={handleConfirmOrder}
          onConfirmPayment={handleConfirmPayment}
          onStockAction={handleStockAction}
          onStockComplete={handleStockComplete}
          onPreviewAuth={handlePreviewAuth}
          onShipOrder={handleShipOrder}
          onAcceptPhase={handleAcceptPhase}
          onCompleteAcceptance={handleCompleteAcceptance}
          onUploadAcceptanceDoc={handleUploadAcceptanceDoc}
          onRefundSubmit={handleRefundSubmit}
          requestConfirm={requestConfirm}
          getApproverDisplay={getApproverDisplay}
        />
      )}

      {selectedCertificateItem && (
        <OrderCertificateDrawer
          selectedOrder={selectedOrder}
          selectedCertificateItem={selectedCertificateItem}
          isCertDrawerClosing={isCertDrawerClosing}
          isCertPreviewMode={isCertPreviewMode}
          certView={certView}
          onClose={handleCloseCertDrawer}
          onCertViewChange={setCertView}
          onConfirmAuth={() => handleStockAction('auth')}
        />
      )}

      {fulfillmentItemIndex !== null && (
        <OrderFulfillmentModal
          fulfillmentContent={fulfillmentContent}
          onContentChange={setFulfillmentContent}
          onClose={() => setFulfillmentItemIndex(null)}
          onSave={saveFulfillment}
        />
      )}

      <OrderItemDetailsDrawer
        item={selectedItemForDetails}
        itemIndex={selectedItemIndex}
        isClosing={isItemDetailsClosing}
        onClose={() => {
          setIsItemDetailsClosing(true);
          setTimeout(() => { setSelectedItemForDetails(null); setIsItemDetailsClosing(false); }, 300);
        }}
        products={products}
        selectedOrder={selectedOrder}
        editable={['DRAFT', 'PENDING_APPROVAL', 'PENDING_CONFIRM'].includes(selectedOrder.status)}
        customers={customers}
        onUpdateItem={(idx, updatedItem) => {
          const newItems = [...selectedOrder.items];
          newItems[idx] = updatedItem;
          updateOrder({ ...selectedOrder, items: newItems });
        }}
        initialTab={itemDrawerInitialTab}
      />

      <OrderContractPreview
        isOpen={isContractPreviewOpen && !!selectedOrder}
        order={selectedOrder}
        zoom={contractZoom}
        setZoom={setContractZoom}
        onClose={() => setIsContractPreviewOpen(false)}
      />

      {showContractPicker && (
        <OrderContractPickerModal
          contracts={contracts}
          selectedOrder={selectedOrder}
          tempLinkedContractIds={tempLinkedContractIds}
          contractPickerSearch={contractPickerSearch}
          onSearchChange={setContractPickerSearch}
          onToggleContract={(id) => {
            setTempLinkedContractIds(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 5 ? prev : [...prev, id]
            );
          }}
          onClose={() => setShowContractPicker(false)}
          onConfirm={async () => {
            const newNames = tempLinkedContractIds.map(cid => contracts.find(c => c.id === cid)?.name || cid);
            await updateOrder({
              ...selectedOrder,
              linkedContractIds: tempLinkedContractIds.length > 0 ? tempLinkedContractIds : undefined,
              linkedContractNames: newNames.length > 0 ? newNames : undefined,
            });
            setShowContractPicker(false);
          }}
        />
      )}

      {previewContract && (
        <OrderContractInlinePreviewModal
          contract={previewContract}
          selectedOrder={selectedOrder}
          onClose={() => setPreviewContractId(null)}
        />
      )}

      {isUserDrawerOpen && detailsUser && (
        <UserDetailPanel
          user={detailsUser}
          isClosing={isUserDrawerClosing}
          onClose={closeUserDrawer}
          roles={roles}
          departments={departments}
          users={users}
          onEmployeeCard={() => setIsEmployeeCardOpen(true)}
          onSave={(updated) => {
            setUsers(prev => prev.map(u => u.id === detailsUser.id ? { ...u, ...updated } as User : u));
            setDetailsUser(prev => prev ? { ...prev, ...updated } as User : prev);
          }}
        />
      )}
      {isEmployeeCardOpen && detailsUser && (
        <EmployeeCardModal user={detailsUser} roles={roles} departments={departments} users={users} onClose={() => setIsEmployeeCardOpen(false)} />
      )}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => { confirmDialog?.onConfirm(); setConfirmDialog(null); }}
        onCancel={() => setConfirmDialog(null)}
      />
      {serviceDetailModal && (
        <ServiceDetailModal item={serviceDetailModal} onClose={() => setServiceDetailModal(null)} />
      )}
    </>
  );
};

export default OrderDetails;
