import React from 'react';
import {
    X, ShieldCheck, FileText, CheckCircle, Lock, CheckSquare, Package, Key, Eye,
    Truck, Disc, ClipboardCheck, UploadCloud, CreditCard, Wallet, Banknote, AlertOctagon,
} from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import { OrderStatus } from '../../../types';
import type { Order, OrderItem, User } from '../../../types';
import { EmptyState } from './EmptyState';
import type { WorkflowStep } from './types';

export type OrderStepActionDrawerProps = {
    activeStepModal: string;
    isDrawerClosing: boolean;
    steps: WorkflowStep[];
    selectedOrder: Order;
    products: import('../../../types').Product[];
    users: User[];
    approvalComment: string;
    paymentForm: { bankName: string; transactionId: string; paymentMethod: 'WechatPay' | 'Alipay' | 'Transfer' };
    shippingCarrier: string;
    shippingTracking: string;
    refundReason: string;
    refundAmount: number;
    canAccept: boolean;
    onClose: () => void;
    onApprovalCommentChange: (v: string) => void;
    onPaymentFormChange: (v: OrderStepActionDrawerProps['paymentForm']) => void;
    onShippingCarrierChange: (v: string) => void;
    onShippingTrackingChange: (v: string) => void;
    onRefundReasonChange: (v: string) => void;
    onRefundAmountChange: (v: number) => void;
    onApproveAction: (role: 'sales' | 'finance' | 'business', action: 'Approve' | 'Reject') => void;
    onConfirmOrder: () => void;
    onConfirmPayment: () => void;
    onStockAction: (action: string) => void;
    onStockComplete: () => void;
    onPreviewAuth: (item: OrderItem) => void;
    onShipOrder: () => void;
    onAcceptPhase: (phaseId: string) => void;
    onCompleteAcceptance: () => void;
    onUploadAcceptanceDoc: () => void;
    onRefundSubmit: () => void;
    requestConfirm: (opts: { title: string; description: string; confirmLabel?: string; variant?: 'danger' | 'primary'; onConfirm: () => void }) => void;
    getApproverDisplay: (role: 'Sales' | 'Business' | 'Finance') => React.ReactNode;
};

export const OrderStepActionDrawer: React.FC<OrderStepActionDrawerProps> = React.memo(function OrderStepActionDrawer({
    activeStepModal,
    isDrawerClosing,
    steps,
    selectedOrder,
    products,
    users,
    approvalComment,
    paymentForm,
    shippingCarrier,
    shippingTracking,
    refundReason,
    refundAmount,
    canAccept,
    onClose,
    onApprovalCommentChange,
    onPaymentFormChange,
    onShippingCarrierChange,
    onShippingTrackingChange,
    onRefundReasonChange,
    onRefundAmountChange,
    onApproveAction,
    onConfirmOrder,
    onConfirmPayment,
    onStockAction,
    onStockComplete,
    onPreviewAuth,
    onShipOrder,
    onAcceptPhase,
    onCompleteAcceptance,
    onUploadAcceptanceDoc,
    onRefundSubmit,
    requestConfirm,
    getApproverDisplay,
}) {
    return (
<ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose}></div>
              <div className={`relative w-full max-w-3xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {activeStepModal === 'REFUND_REQUEST' ? '发起退单申请' : `${steps.find(s => s.id === activeStepModal)?.label || '步骤'}处理`}
                      </h3>
                      <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
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
                                           <textarea value={approvalComment} onChange={e => onApprovalCommentChange(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => onApproveAction('sales', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => onApproveAction('sales', 'Approve')} className="unified-button-primary -1">同意</button>
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
                                           <textarea value={approvalComment} onChange={e => onApprovalCommentChange(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => onApproveAction('business', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => onApproveAction('business', 'Approve')} className="unified-button-primary -1">同意</button>
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
                                           <textarea value={approvalComment} onChange={e => onApprovalCommentChange(e.target.value)} placeholder="审批意见..." className="w-full p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent dark:border-white/10 text-sm outline-none resize-none h-20 dark:text-white" />
                                           <div className="flex gap-2">
                                               <button onClick={() => onApproveAction('finance', 'Reject')} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 text-xs transition">拒绝</button>
                                               <button onClick={() => onApproveAction('finance', 'Approve')} className="unified-button-primary -1">同意</button>
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
                              <button onClick={() => requestConfirm({ title: '确认启动备货', description: '订单将进入备货阶段，系统将通知交付中心开始准备安装包与授权光盘。确认继续？', confirmLabel: '确认并启动', onConfirm: onConfirmOrder })} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition">确认并启动备货</button>
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
                                       <button onClick={() => onPreviewAuth(selectedOrder.items[0])} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1">
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
                                                       <td colSpan={5}><EmptyState icon={<Package className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="暂无关联安装包信息" className="py-6" /></td>
                                                   </tr>
                                               )}
                                           </tbody>
                                       </table>
                                   </div>

                                   {!selectedOrder.isPackageConfirmed && (
                                       <button onClick={() => onStockAction('package')} className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition">确认安装包就绪</button>
                                   )}
                               </div>

                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedOrder.isShippingConfirmed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white dark:bg-black border-gray-100 dark:border-white/10'}`}>
                                   <div className="flex justify-between items-center mb-3">
                                       <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Truck className="w-4 h-4"/> 快递单确认</div>
                                       {selectedOrder.isShippingConfirmed && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400"/>}
                                   </div>
                                   {!selectedOrder.isShippingConfirmed && (
                                       <div className="space-y-3">
                                           <input placeholder="快递服务商 (如: 顺丰)" value={shippingCarrier} onChange={e => onShippingCarrierChange(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dark:text-white" />
                                           <input placeholder="物流单号" value={shippingTracking} onChange={e => onShippingTrackingChange(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono dark:text-white" />
                                           <button onClick={() => onStockAction('shipping_confirm')} className="w-full py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-bold hover:bg-orange-100 transition">保存并确认物流信息</button>
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
                                          onClick={() => onStockAction('cd')} 
                                          disabled={!selectedOrder.isPackageConfirmed}
                                          className="w-full py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 disabled:cursor-not-allowed transition"
                                       >
                                           {selectedOrder.isPackageConfirmed ? '完成刻录' : '等待安装包确认...'}
                                       </button>
                                   )}
                               </div>

                               {selectedOrder.isAuthConfirmed && selectedOrder.isPackageConfirmed && selectedOrder.isCDBurned && selectedOrder.isShippingConfirmed && (
                                   <button 
                                      onClick={() => requestConfirm({ title: '确认备货完成', description: '所有备货环节已确认完成，将更新订单备货状态。确认继续？', confirmLabel: '确认完成', onConfirm: onStockComplete })}
                                      className="unified-button-primary w-full bg-[#0071E3] dark:bg-[#0A84FF] rounded-2xl hover:opacity-80 mt-4"
                                   >
                                       备货状态更新为：已备货完成
                                   </button>
                               )}
                          </div>
                      )}

                      {/* Payment, Shipping, Acceptance, Refund Steps... */}
                      {activeStepModal === 'PAYMENT' && (
                          selectedOrder.isPaid ? (
                          <div className="space-y-5">
                              <div className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-lg text-center">
                                  <div className="text-xs font-bold uppercase mb-1 opacity-80">已收款项</div>
                                  <div className="text-3xl font-bold font-mono">¥{selectedOrder.total.toLocaleString()}</div>
                                  <div className="flex items-center justify-center gap-1.5 mt-2 text-green-100">
                                      <CheckCircle className="w-4 h-4"/>
                                      <span className="text-xs font-bold">支付完成</span>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  {[
                                      { label: '支付方式', value: selectedOrder.paymentRecord?.paymentMethod || (selectedOrder.paymentMethod === 'WechatPay' ? '微信支付' : selectedOrder.paymentMethod === 'Alipay' ? '支付宝' : selectedOrder.paymentMethod === 'Transfer' ? '银行转账' : selectedOrder.paymentMethod || '-') },
                                      { label: '支付时间', value: selectedOrder.paymentDate ? new Date(selectedOrder.paymentDate).toLocaleString('zh-CN') : '-' },
                                      { label: '交易流水号', value: selectedOrder.paymentRecord?.transactionId || '-', mono: true },
                                      ...(selectedOrder.paymentRecord?.bankName ? [{ label: '收款银行', value: selectedOrder.paymentRecord.bankName }] : []),
                                      { label: '付款方', value: selectedOrder.paymentRecord?.payerName || selectedOrder.customerName || '-' },
                                      { label: '收款金额', value: `¥${(selectedOrder.paymentRecord?.amount || selectedOrder.total).toLocaleString()}`, mono: true },
                                  ].map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between py-2.5 px-4 bg-gray-50/80 dark:bg-white/5 rounded-xl">
                                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{item.label}</span>
                                          <span className={`text-sm font-medium text-gray-900 dark:text-white ${'mono' in item && item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          ) : (
                          <div className="space-y-5">
                              <div className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg text-center">
                                  <div className="text-xs font-bold uppercase mb-1 opacity-80">应收账款</div>
                                  <div className="text-3xl font-bold font-mono">¥{selectedOrder.total.toLocaleString()}</div>
                              </div>

                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">支付方式</label>
                                  <div className="grid grid-cols-3 gap-3">
                                      {([
                                          { id: 'WechatPay' as const, label: '微信支付', icon: Wallet, activeColor: 'text-green-600 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' },
                                          { id: 'Alipay' as const, label: '支付宝', icon: CreditCard, activeColor: 'text-blue-600 bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400' },
                                          { id: 'Transfer' as const, label: '银行转账', icon: Banknote, activeColor: 'text-purple-600 bg-purple-50 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400' },
                                      ]).map(m => (
                                          <button
                                              key={m.id}
                                              onClick={() => onPaymentFormChange({ ...paymentForm, paymentMethod: m.id })}
                                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5 ${
                                                  paymentForm.paymentMethod === m.id
                                                      ? m.activeColor
                                                      : 'border-gray-100 dark:border-white/10 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200'
                                              }`}
                                          >
                                              <m.icon className="w-5 h-5"/>
                                              <span className="text-xs font-bold">{m.label}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div className="space-y-3">
                                  {paymentForm.paymentMethod === 'Transfer' && (
                                      <input placeholder="收款银行" value={paymentForm.bankName} onChange={e=>onPaymentFormChange({...paymentForm, bankName:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 dark:text-white text-sm" />
                                  )}
                                  <input placeholder="交易流水号" value={paymentForm.transactionId} onChange={e=>onPaymentFormChange({...paymentForm, transactionId:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-white/10 dark:text-white text-sm font-mono" />
                                  {paymentForm.paymentMethod === 'WechatPay' && (
                                      <div className="p-3 bg-green-50 dark:bg-green-900/20 text-xs text-green-600 dark:text-green-300 rounded-xl border border-green-100 dark:border-green-900/30 leading-relaxed">确认到账后将记录为微信支付收款。</div>
                                  )}
                                  {paymentForm.paymentMethod === 'Alipay' && (
                                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-900/30 leading-relaxed">确认到账后将记录为支付宝收款。</div>
                                  )}
                              </div>

                              <button onClick={() => requestConfirm({ title: '确认收款到账', description: `即将确认收到 ¥${selectedOrder.total.toLocaleString()} 款项，此操作不可撤销，确认继续？`, confirmLabel: '确认到账', onConfirm: onConfirmPayment })} className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 transition">确认到账</button>
                          </div>
                          )
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
                                  onClick={() => requestConfirm({ title: '确认执行发货', description: '订单将标记为"已发货"状态，客户将收到发货通知。此操作不可撤销，确认继续？', confirmLabel: '确认发货', onConfirm: onShipOrder })}
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
                               
                               <div className="p-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition" onClick={onUploadAcceptanceDoc}>
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
                                           ) : canAccept ? (
                                               <button onClick={() => onAcceptPhase(p.id)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition">通过验收</button>
                                           ) : (
                                               <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">需先发货</span>
                                           )}
                                       </div>
                                   ))}
                               </div>
                               
                               <button 
                                  onClick={() => requestConfirm({ title: '确认完成验收', description: '验收完成后订单将归档为"已完成"状态，此操作不可撤销。确认继续？', confirmLabel: '确认验收', onConfirm: onCompleteAcceptance })}
                                  disabled={!canAccept}
                                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition mt-4 disabled:opacity-30 disabled:cursor-not-allowed"
                               >
                                  {canAccept ? '确认完成验收' : '需先发货后才可验收'}
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
                                          onChange={e => onRefundReasonChange(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">退单金额 (最大 ¥{selectedOrder.total.toLocaleString()})</label>
                                      <input 
                                          type="number"
                                          className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none font-bold focus:ring-2 focus:ring-red-100 dark:text-white"
                                          value={refundAmount}
                                          onChange={e => { const v = Number(e.target.value); onRefundAmountChange(isNaN(v) ? 0 : Math.min(Math.max(v, 0), selectedOrder.total)); }}
                                      />
                                  </div>
                              </div>
                              <button 
                                  onClick={() => requestConfirm({ title: '提交退单申请', description: `退单金额 ¥${refundAmount.toLocaleString()}，提交后需经过财务审批，确认提交？`, confirmLabel: '提交退单', variant: 'danger', onConfirm: onRefundSubmit })}
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
    );
});
