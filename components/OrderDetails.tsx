
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, OrderItem, ActivationMethod, PaymentRecord, User, Department, ApprovalRecord } from '../types';
import { CheckCircle, Clock, Truck, Package, User as UserIcon, X, ShieldCheck, Key, AtSign, Edit3, Save, Download, CreditCard, Disc, CheckSquare, Settings, AlertCircle, Award, Briefcase, Building2, History, UserCheck, XSquare, ArrowLeft, Calendar, FileText, ChevronRight, Activity, Target } from 'lucide-react';

interface OrderDetailsProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  users: User[];
  departments: Department[];
  currentUser: User;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orders, setOrders, products, customers, users, departments, currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedOrder = orders.find(o => o.id === id);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentRecord>>({ bankName: '', accountNumber: '', transactionId: '', payerName: '', remarks: '' });
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingTracking, setShippingTracking] = useState('');
  const [fulfillmentItemIndex, setFulfillmentItemIndex] = useState<number | null>(null);
  const [fulfillmentContent, setFulfillmentContent] = useState('');

  const getDepartmentPath = (deptId?: string) => {
      if (!deptId) return '';
      const path: string[] = [];
      let current = departments.find(d => d.id === deptId);
      const visited = new Set<string>();
      while (current && !visited.has(current.id)) {
          visited.add(current.id);
          path.unshift(current.name);
          if (current.parentId && current.parentId !== current.id) current = departments.find(d => d.id === current.parentId); else current = undefined;
      }
      return path.join(' / ');
  };
  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
      if (i < 3) result += '-';
    }
    return result;
  };
  
  // Helper to update order and persist state
  const updateOrder = (order: Order) => setOrders(prev => prev.map(o => o.id === order.id ? order : o));

  // *** NEW: Helper to add operation record ***
  const createOperationRecord = (actionType: string, result: string, comment?: string): ApprovalRecord => {
      return {
          id: `op-${Date.now()}`,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          actionType,
          result,
          timestamp: new Date().toISOString(),
          comment
      };
  };

  if (!selectedOrder) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const canManagePayment = currentUser.role === 'Admin' || currentUser.role === 'Business';
  const canApproveSales = currentUser.role === 'Admin' || currentUser.role === 'Sales';
  const canApproveBusiness = currentUser.role === 'Admin' || currentUser.role === 'Business';
  const canApproveFinance = currentUser.role === 'Admin' || currentUser.role === 'Business';
  const canConfirmOrder = currentUser.role === 'Admin' || currentUser.role === 'Sales';
  const canManageProduction = currentUser.role === 'Admin' || currentUser.role === 'Technical';
  const canManageShipping = currentUser.role === 'Admin' || currentUser.role === 'Logistics';

  const openPaymentModal = () => { if (!canManagePayment) return; const c = customers.find(c => c.id === selectedOrder?.customerId); const b = c?.billingInfo; setPaymentForm({ bankName: b?.bankName || '', accountNumber: b?.accountNumber || '', transactionId: '', payerName: b?.title || selectedOrder?.customerName || '', remarks: '' }); setIsPaymentModalOpen(true); };
  
  const handleConfirmPayment = () => { 
      if (!selectedOrder || !paymentForm.bankName) return; 
      const record: PaymentRecord = { method: 'BankTransfer', bankName: paymentForm.bankName, accountNumber: paymentForm.accountNumber || '', transactionId: paymentForm.transactionId!, payerName: paymentForm.payerName || '', amount: paymentForm.amount || selectedOrder.total, paymentDate: new Date().toISOString(), remarks: paymentForm.remarks }; 
      
      const opRecord = createOperationRecord('Payment Received', 'Success', `Amount: ¥${record.amount}`);
      
      updateOrder({ 
          ...selectedOrder, 
          status: OrderStatus.PENDING_APPROVAL, 
          isPaid: true, 
          paymentDate: new Date().toISOString(), 
          paymentRecord: record,
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      }); 
      setIsPaymentModalOpen(false); 
  };

  const handleApprove = (type: any, action: any) => { 
      const updated = { ...selectedOrder }; 
      if(!updated.approval) updated.approval={salesApproved:false,businessApproved:false,financeApproved:false};
      const res = action==='Approve'?'Approved':'Rejected';
      
      // Use helper
      const opRecord = createOperationRecord(`${type} Approval`, res, action==='Approve'?'Approved by flow':'Rejected by flow');
      updated.approvalRecords=[opRecord, ...(updated.approvalRecords||[])];
      
      if(action==='Approve'){
          if(type==='sales') updated.approval.salesApproved=true;
          if(type==='business') updated.approval.businessApproved=true;
          if(type==='finance') updated.approval.financeApproved=true;
          if(updated.approval.salesApproved && updated.approval.businessApproved && updated.approval.financeApproved) updated.status=OrderStatus.PENDING_CONFIRM;
      }
      updateOrder(updated);
  };

  const handleConfirmOrder = () => { 
      const opRecord = createOperationRecord('Production Confirmed', 'Started', 'Order moved to production queue');
      updateOrder({ 
          ...selectedOrder, 
          status: OrderStatus.PROCESSING_PROD, 
          confirmedDate: new Date().toISOString(),
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      }); 
  };

  const handleConfirmPackage = () => {
      const opRecord = createOperationRecord('Package Check', 'Confirmed', 'Installation package verified');
      updateOrder({ 
          ...selectedOrder, 
          isPackageConfirmed: true,
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      });
  };

  const handleBurnCD = () => {
      const opRecord = createOperationRecord('CD Burning', 'Completed', 'Physical media created');
      updateOrder({ 
          ...selectedOrder, 
          isCDBurned: true, 
          cdBurnedDate: new Date().toISOString(),
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      });
  };

  const handleShipOrder = () => {
      const opRecord = createOperationRecord('Shipping', 'Shipped', `Carrier: ${shippingCarrier}, Tracking: ${shippingTracking}`);
      updateOrder({ 
          ...selectedOrder, 
          status: OrderStatus.SHIPPED, 
          carrier: shippingCarrier, 
          trackingNumber: shippingTracking,
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      });
  };

  const handleConfirmDelivery = () => {
      const opRecord = createOperationRecord('Delivery', 'Delivered', 'Customer received goods');
      updateOrder({ 
          ...selectedOrder, 
          status: OrderStatus.DELIVERED,
          approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]
      });
  };

  const startFulfillment = (i:number, item:OrderItem) => { setFulfillmentItemIndex(i); setFulfillmentContent(item.deliveredContent ? item.deliveredContent.join('\n') : ''); };
  const saveFulfillment = () => { 
      if(fulfillmentItemIndex===null) return; 
      const items = [...selectedOrder.items]; items[fulfillmentItemIndex] = { ...items[fulfillmentItemIndex], deliveredContent: fulfillmentContent.split('\n').filter(l=>l.trim()!=='') };
      
      // Log fulfillment
      const opRecord = createOperationRecord('Content Delivery', 'Updated', `Updated content for ${items[fulfillmentItemIndex].productName}`);
      
      updateOrder({...selectedOrder, items, approvalRecords: [opRecord, ...(selectedOrder.approvalRecords || [])]}); 
      setFulfillmentItemIndex(null); 
  };

  // --- UI Components ---
  const StatusBadge = ({ status }: { status: OrderStatus }) => {
     let style = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
     if(status === OrderStatus.DELIVERED) style='bg-[#34C759] text-white dark:bg-[#32D74B]';
     if(status === OrderStatus.PROCESSING_PROD) style='bg-[#0071E3] text-white dark:bg-[#FF2D55]';
     if(status === OrderStatus.PENDING_APPROVAL) style='bg-[#FF9500] text-white dark:bg-[#FF9F0A]';
     return <span className={`px-3 py-1 rounded-full text-xs font-bold ${style}`}>{status}</span>
  }

  const ActionButton = ({ label, icon: Icon, onClick, disabled, variant='primary' }: any) => (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition disabled:opacity-50
            ${variant === 'primary' 
                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
                : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'}
        `}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </button>
  );

  const getResultBadgeColor = (result: string) => {
      const r = result.toLowerCase();
      if (r === 'approved' || r === 'success' || r === 'completed' || r === 'delivered' || r === 'shipped' || r === 'confirmed') 
          return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      if (r === 'rejected') 
          return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      if (r === 'started')
          return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400';
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] dark:bg-black">
      {/* Sticky Header - Apple Style */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-6 py-4 flex justify-between items-center">
           <div className="flex items-center gap-4">
               <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400">
                   <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="flex flex-col">
                   <div className="flex items-center gap-3">
                       <h1 className="text-xl font-bold text-gray-900 dark:text-white">订单 {selectedOrder.id}</h1>
                       <StatusBadge status={selectedOrder.status} />
                   </div>
                   <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                       <span>{selectedOrder.customerName}</span>
                       <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                       <span>{new Date(selectedOrder.date).toLocaleDateString()}</span>
                   </div>
               </div>
           </div>
           
           <div className="flex gap-3">
               {selectedOrder.isPaid && (
                  <button onClick={() => setIsCertificateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-semibold rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition shadow-sm">
                      <Award className="w-4 h-4 text-[#FF9500]" /> 电子授权书
                  </button>
              )}
           </div>
      </div>

      <div className="p-6 lg:p-10 max-w-[1200px] mx-auto w-full space-y-8 animate-fade-in">
          
          {/* Progress Bar (Apple Style) */}
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
             <div className="relative flex justify-between items-center z-10">
                 {[OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_APPROVAL, OrderStatus.PENDING_CONFIRM, OrderStatus.PROCESSING_PROD, OrderStatus.SHIPPED, OrderStatus.DELIVERED].map((step, idx) => {
                     const steps = [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_APPROVAL, OrderStatus.PENDING_CONFIRM, OrderStatus.PROCESSING_PROD, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
                     const currentIdx = steps.indexOf(selectedOrder.status === OrderStatus.CANCELLED ? OrderStatus.PENDING_PAYMENT : selectedOrder.status);
                     const isDone = idx <= currentIdx;
                     return (
                         <div key={step} className="flex flex-col items-center gap-2">
                             <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${isDone ? 'bg-[#0071E3] dark:bg-[#FF2D55] border-[#0071E3] dark:border-[#FF2D55] scale-125' : 'bg-white dark:bg-black border-gray-300 dark:border-gray-600'}`}></div>
                             <div className={`text-[10px] font-semibold uppercase tracking-wider ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{step}</div>
                         </div>
                     )
                 })}
                 {/* Line */}
                 <div className="absolute top-1.5 left-0 w-full h-0.5 bg-gray-100 dark:bg-white/10 -z-10">
                     <div className="h-full bg-[#0071E3] dark:bg-[#FF2D55] transition-all duration-700" style={{ width: `${( [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_APPROVAL, OrderStatus.PENDING_CONFIRM, OrderStatus.PROCESSING_PROD, OrderStatus.SHIPPED, OrderStatus.DELIVERED].indexOf(selectedOrder.status === OrderStatus.CANCELLED ? OrderStatus.PENDING_PAYMENT : selectedOrder.status) / 5) * 100}%` }}></div>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                  
                  {/* Action Card */}
                  {selectedOrder.status !== OrderStatus.DELIVERED && selectedOrder.status !== OrderStatus.CANCELLED && (
                    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-blue-100/50 dark:border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#0071E3] dark:bg-[#FF2D55]"></div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" /> 待处理任务
                        </h3>
                        <div className="space-y-4">
                            {/* Actions Logic */}
                            {selectedOrder.status === OrderStatus.PENDING_PAYMENT && (
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">等待录入支付信息</div>
                                    <ActionButton label="录入支付" icon={CreditCard} onClick={openPaymentModal} disabled={!canManagePayment} />
                                </div>
                            )}
                            {selectedOrder.status === OrderStatus.PENDING_APPROVAL && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className={`p-4 rounded-2xl border ${selectedOrder.approval.salesApproved ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5'}`}>
                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">销售审批</div>
                                        {!selectedOrder.approval.salesApproved ? (
                                            <div className="flex gap-2"><ActionButton label="通过" variant="primary" onClick={()=>handleApprove('sales','Approve')} disabled={!canApproveSales}/><ActionButton label="拒绝" variant="secondary" onClick={()=>handleApprove('sales','Reject')} disabled={!canApproveSales}/></div>
                                        ) : <span className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 已通过</span>}
                                    </div>
                                    
                                     <div className={`p-4 rounded-2xl border ${selectedOrder.approval.businessApproved ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5'} ${!selectedOrder.approval.salesApproved && 'opacity-50'}`}>
                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">商务审批</div>
                                        {!selectedOrder.approval.businessApproved ? (
                                            <div className="flex gap-2"><ActionButton label="通过" variant="primary" onClick={()=>handleApprove('business','Approve')} disabled={!canApproveBusiness||!selectedOrder.approval.salesApproved}/><ActionButton label="拒绝" variant="secondary" onClick={()=>handleApprove('business','Reject')} disabled={!canApproveBusiness||!selectedOrder.approval.salesApproved}/></div>
                                        ) : <span className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 已通过</span>}
                                    </div>
                                     <div className={`p-4 rounded-2xl border ${selectedOrder.approval.financeApproved ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5'} ${!selectedOrder.approval.businessApproved && 'opacity-50'}`}>
                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">财务审批</div>
                                        {!selectedOrder.approval.financeApproved ? (
                                            <div className="flex gap-2"><ActionButton label="通过" variant="primary" onClick={()=>handleApprove('finance','Approve')} disabled={!canApproveFinance||!selectedOrder.approval.businessApproved}/><ActionButton label="拒绝" variant="secondary" onClick={()=>handleApprove('finance','Reject')} disabled={!canApproveFinance||!selectedOrder.approval.businessApproved}/></div>
                                        ) : <span className="text-green-600 dark:text-green-400 text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> 已通过</span>}
                                    </div>
                                </div>
                            )}
                            {selectedOrder.status === OrderStatus.PENDING_CONFIRM && (
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">所有审批已完成，准备生产。</div>
                                    <ActionButton label="确认生产" icon={CheckSquare} onClick={handleConfirmOrder} disabled={!canConfirmOrder} />
                                </div>
                            )}
                             {/* Processing/Shipping Logic */}
                             {selectedOrder.status === OrderStatus.PROCESSING_PROD && (
                                 <div className="space-y-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                     <div className="flex gap-4">
                                        <button onClick={handleConfirmPackage} disabled={selectedOrder.isPackageConfirmed} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${selectedOrder.isPackageConfirmed ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-white dark:bg-[#1C1C1E] shadow-sm dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}>安装包确认</button>
                                        <button onClick={handleBurnCD} disabled={selectedOrder.isCDBurned} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${selectedOrder.isCDBurned ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-white dark:bg-[#1C1C1E] shadow-sm dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}>光盘刻录</button>
                                     </div>
                                     <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex gap-2">
                                         <input placeholder="物流公司" value={shippingCarrier} onChange={e=>setShippingCarrier(e.target.value)} className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-sm dark:text-white" />
                                         <input placeholder="单号" value={shippingTracking} onChange={e=>setShippingTracking(e.target.value)} className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-sm dark:text-white" />
                                         <ActionButton label="发货" onClick={handleShipOrder} disabled={!shippingCarrier || !shippingTracking || !selectedOrder.isPackageConfirmed || !selectedOrder.isCDBurned} />
                                     </div>
                                 </div>
                             )}
                             {selectedOrder.status === OrderStatus.SHIPPED && (
                                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                                     <div>
                                         <div className="text-sm font-bold text-gray-900 dark:text-white">运输中</div>
                                         <div className="text-xs text-gray-500 dark:text-gray-400">{shippingCarrier} - {shippingTracking}</div>
                                     </div>
                                     <ActionButton label="确认送达" icon={CheckCircle} onClick={handleConfirmDelivery} disabled={!canManageShipping} />
                                 </div>
                             )}
                        </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 dark:border-white/10">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">购买清单</h3>
                      </div>
                      <table className="w-full text-left">
                          <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                              <tr>
                                  <th className="p-5 pl-6">产品</th>
                                  <th className="p-5">规格</th>
                                  <th className="p-5 text-center">数量</th>
                                  <th className="p-5 text-right">小计</th>
                                  <th className="p-5 w-1/3">交付信息</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {selectedOrder.items.map((item, idx) => (
                                  <tr key={idx}>
                                      <td className="p-5 pl-6">
                                          <div className="font-bold text-gray-900 dark:text-white">{item.productName}</div>
                                          {item.installPackageName && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.installPackageName}</div>}
                                      </td>
                                      <td className="p-5 text-sm text-gray-600 dark:text-gray-300">{item.skuName}</td>
                                      <td className="p-5 text-center font-medium dark:text-white">{item.quantity}</td>
                                      <td className="p-5 text-right font-bold text-gray-900 dark:text-white">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                      <td className="p-5 text-xs">
                                          {fulfillmentItemIndex === idx ? (
                                              <div className="flex flex-col gap-2">
                                                  <textarea className="border border-gray-200 dark:border-white/10 p-2 rounded-lg w-full bg-white dark:bg-black text-gray-900 dark:text-white" value={fulfillmentContent} onChange={e=>setFulfillmentContent(e.target.value)}></textarea>
                                                  <button onClick={saveFulfillment} className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-lg self-end">保存</button>
                                              </div>
                                          ) : (
                                              <div className="space-y-1">
                                                  {item.deliveredContent?.map((c,i) => <div key={i} className="font-mono bg-gray-50 dark:bg-white/10 px-2 py-1 rounded inline-block mr-1 text-gray-700 dark:text-gray-300">{c}</div>)}
                                                  {selectedOrder.status !== OrderStatus.CANCELLED && (
                                                      <button onClick={()=>startFulfillment(idx, item)} className="block mt-1 text-[#0071E3] dark:text-[#FF2D55] hover:underline">编辑交付内容</button>
                                                  )}
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Operations History (Timeline) - Updated */}
                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-gray-500" /> 操作记录
                      </h3>
                      <div className="space-y-6 relative pl-2">
                           {/* Vertical Line */}
                          <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-white/10"></div>
                          
                          {selectedOrder.approvalRecords?.map(rec => (
                              <div key={rec.id} className="relative pl-10">
                                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-white dark:border-[#1C1C1E] shadow-sm flex items-center justify-center z-10 bg-gray-50 dark:bg-white/10`}>
                                      <img src={`https://ui-avatars.com/api/?name=${rec.operatorName}&background=random`} className="w-full h-full rounded-full" alt=""/>
                                  </div>
                                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                      <div className="flex justify-between mb-1">
                                          <span className="font-bold text-gray-900 dark:text-white text-sm">{rec.operatorName} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({rec.operatorRole})</span></span>
                                          <span className="text-xs text-gray-400">{new Date(rec.timestamp).toLocaleString()}</span>
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mb-1">
                                          <span className="font-medium">{rec.actionType}</span>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getResultBadgeColor(rec.result)}`}>{rec.result}</span>
                                      </div>
                                      {rec.comment && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic border-t border-gray-200 dark:border-white/10 pt-2">"{rec.comment}"</div>}
                                  </div>
                              </div>
                          ))}
                          
                          {(!selectedOrder.approvalRecords || selectedOrder.approvalRecords.length === 0) && (
                              <div className="text-center py-8 text-gray-400 text-sm italic pl-8">暂无操作记录</div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Right Column: Info Cards */}
              <div className="space-y-6">
                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">客户信息</h4>
                      <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition" onClick={()=>navigate(`/customers/${selectedOrder.customerId}`)}>
                          <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                              <div className="font-bold text-gray-900 dark:text-white">{selectedOrder.customerName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedOrder.customerId}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-auto text-gray-300 dark:text-gray-600" />
                      </div>
                      {/* Opportunity Info if exists */}
                      {selectedOrder.opportunityId && (
                           <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 cursor-pointer" onClick={() => navigate(`/opportunities/${selectedOrder.opportunityId}`)}>
                                <div className="text-blue-500 dark:text-blue-400">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">关联商机</div>
                                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">{selectedOrder.opportunityName || selectedOrder.opportunityId}</div>
                                </div>
                           </div>
                      )}

                      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/10 text-sm">
                          <div>
                              <div className="text-gray-400 text-xs mb-0.5">销售负责人</div>
                              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  <UserIcon className="w-3 h-3 text-blue-500" /> {selectedOrder.salesRepName || '未分配'}
                              </div>
                              {selectedOrder.salesDepartmentId && <div className="text-xs text-gray-400 ml-5 mt-0.5">{getDepartmentPath(selectedOrder.salesDepartmentId)}</div>}
                          </div>
                          <div>
                              <div className="text-gray-400 text-xs mb-0.5">商务跟单</div>
                              <div className="font-medium text-gray-900 dark:text-white">{selectedOrder.businessManagerName || '-'}</div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-[#1D1D1F] dark:bg-white p-6 rounded-3xl shadow-lg text-white dark:text-black">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">订单总金额</h4>
                      <div className="text-3xl font-bold tracking-tight">¥{selectedOrder.total.toLocaleString()}</div>
                      {selectedOrder.isPaid ? (
                          <div className="mt-4 flex items-center gap-2 text-green-400 dark:text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" /> 已支付
                          </div>
                      ) : (
                          <div className="mt-4 flex items-center gap-2 text-orange-400 dark:text-orange-600 text-sm font-medium">
                              <Clock className="w-4 h-4" /> 待支付
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Payment Modal (Apple Style) */}
      {isPaymentModalOpen && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-enter border border-white/10">
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">录入支付</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20"><X className="w-4 h-4 text-gray-500 dark:text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <input className="w-full p-3 bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" placeholder="银行名称" value={paymentForm.bankName} onChange={e=>setPaymentForm({...paymentForm, bankName:e.target.value})} />
                    <input className="w-full p-3 bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" placeholder="交易流水号" value={paymentForm.transactionId} onChange={e=>setPaymentForm({...paymentForm, transactionId:e.target.value})} />
                    <input className="w-full p-3 bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" placeholder="付款人" value={paymentForm.payerName} onChange={e=>setPaymentForm({...paymentForm, payerName:e.target.value})} />
                    <textarea className="w-full p-3 bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white resize-none" placeholder="备注 (可选)" rows={2} value={paymentForm.remarks} onChange={e=>setPaymentForm({...paymentForm, remarks:e.target.value})} />
                </div>
                <div className="p-6 bg-gray-50/50 dark:bg-white/5 flex justify-end gap-3">
                    <button onClick={() => setIsPaymentModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">取消</button>
                    <button onClick={handleConfirmPayment} className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200">确认</button>
                </div>
            </div>
         </div>
      )}

      {/* Certificate */}
      {isCertificateOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative animate-modal-enter overflow-y-auto max-h-[90vh]">
                   <button onClick={() => setIsCertificateOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full z-10 hover:bg-gray-200 transition"><X className="w-5 h-5 text-gray-600" /></button>
                   
                   <div className="p-12 m-4 text-center relative overflow-hidden">
                        {/* Decorative Border */}
                        <div className="absolute inset-0 border-[12px] border-double border-[#C5A572] pointer-events-none"></div>
                        <div className="absolute inset-3 border border-[#C5A572] pointer-events-none"></div>

                        {/* Header */}
                        <div className="mb-10">
                            <div className="flex justify-center mb-4">
                                <Award className="w-16 h-16 text-[#C5A572]" />
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2 tracking-wide">正版软件授权书</h1>
                            <div className="text-xs font-serif text-[#C5A572] uppercase tracking-[0.3em]">Certificate of Authorization</div>
                        </div>

                        {/* Content */}
                        <div className="mb-8 text-left space-y-6 px-8 font-serif text-gray-800 leading-relaxed">
                            <p>
                                兹证明：<span className="font-bold text-xl underline decoration-[#C5A572] underline-offset-4 px-2">{selectedOrder.customerName}</span>
                            </p>
                            <p>
                                已获得北京金山办公软件股份有限公司旗下相关产品的合法使用授权。该授权受中华人民共和国法律保护，请放心使用。
                            </p>
                            
                            {/* Product Table */}
                            <div className="mt-8 border-t border-b border-gray-200 py-4">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-sm text-gray-500 border-b border-gray-100">
                                            <th className="pb-2 font-normal">授权产品</th>
                                            <th className="pb-2 font-normal">规格/版本</th>
                                            <th className="pb-2 font-normal text-center">数量</th>
                                            <th className="pb-2 font-normal text-right">授权期限</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-base font-bold">
                                        {selectedOrder.items.map((item, idx) => {
                                            const template = products.find(p => p.id === item.productId)?.licenseTemplate;
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-3">{item.productName}</td>
                                                    <td className="py-3 font-medium text-gray-600 text-sm">{item.skuName}</td>
                                                    <td className="py-3 text-center">{item.quantity}</td>
                                                    <td className="py-3 text-right">
                                                        {template?.showLicensePeriod ? (item.skuName.includes('年') ? '1 年' : '永久') : '永久有效'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-16 flex justify-between items-end px-8">
                            <div className="text-left text-sm text-gray-500 font-serif">
                                <div>授权编号：{selectedOrder.id}</div>
                                <div>颁发日期：{new Date().toLocaleDateString()}</div>
                            </div>
                            <div className="text-center relative">
                                {/* Digital Stamp */}
                                <div className="w-32 h-32 rounded-full border-4 border-red-600 text-red-600 flex items-center justify-center absolute -top-20 -left-10 opacity-80 rotate-[-15deg] pointer-events-none mix-blend-multiply">
                                    <div className="w-28 h-28 rounded-full border border-red-600 flex items-center justify-center relative">
                                        <div className="text-[10px] absolute top-2 tracking-widest font-bold">北京金山办公软件</div>
                                        <div className="font-bold text-lg border-t border-b border-red-600 py-1">业务专用章</div>
                                        <div className="text-[8px] absolute bottom-3 tracking-widest">1101080000000</div>
                                    </div>
                                </div>
                                <div className="font-bold font-serif text-gray-900 relative z-10 mt-4">北京金山办公软件股份有限公司</div>
                            </div>
                        </div>
                   </div>
                   
                   {/* Actions */}
                   <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-100">
                       <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition text-sm font-medium">
                           <Download className="w-4 h-4" /> 打印/下载
                       </button>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OrderDetails;
