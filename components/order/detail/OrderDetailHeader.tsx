import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Copy, Check, CreditCard, Edit3, Camera, History, AlertOctagon,
} from 'lucide-react';
import { OrderStatus } from '../../../types';
import type { Order } from '../../../types';
import type { User } from '../../../types';
import { statusMap } from './constants';
import type { OrderDetailTab } from './types';

export type OrderDetailHeaderProps = {
    selectedOrder: Order;
    users: User[];
    copiedOrderId: boolean;
    showCreatorPhone: boolean;
    activeTab: OrderDetailTab;
    hasPermission: (perm: string) => boolean;
    onCopyOrderId: () => void;
    onToggleCreatorPhone: () => void;
    onOpenUserDetail: (userId?: string) => void;
    onOpenSnapshot: () => void;
    onOpenLog: () => void;
    onOpenStepModal: (stepId: string) => void;
    onTabChange: (tab: OrderDetailTab) => void;
};

export const OrderDetailHeader: React.FC<OrderDetailHeaderProps> = ({
    selectedOrder,
    users,
    copiedOrderId,
    showCreatorPhone,
    activeTab,
    hasPermission,
    onCopyOrderId,
    onToggleCreatorPhone,
    onOpenUserDetail,
    onOpenSnapshot,
    onOpenLog,
    onOpenStepModal,
    onTabChange,
}) => {
    const navigate = useNavigate();
    return (
      <>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 md:px-6 pt-4 flex flex-col">
          <div className="flex items-center gap-4 pb-3">
               {/* Group 1: 返回 + 订单编号 */}
               <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition text-gray-500 dark:text-gray-400 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
               <div className="shrink-0">
                   <div className="flex items-center gap-2">
                       <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">订单 {selectedOrder.id}</h1>
                       <button
                           onClick={onCopyOrderId}
                           className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                           title="复制订单编号"
                       >
                           {copiedOrderId
                               ? <Check className="w-3.5 h-3.5 text-green-500" />
                               : <Copy className="w-3.5 h-3.5" />}
                       </button>
                   </div>
                   <div className="hidden sm:flex items-center gap-2 mt-0.5">
                       <span className="text-[11px] text-gray-400 dark:text-gray-500">提单时间：<span className="font-mono">{new Date(selectedOrder.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span></span>
                       {selectedOrder.buyerType === 'Channel'    && <span className="unified-tag-xs unified-tag-indigo">渠道订单</span>}
                       {selectedOrder.buyerType === 'SelfDeal'   && <span className="unified-tag-xs unified-tag-orange">自成交订单</span>}
                       {selectedOrder.buyerType === 'RedeemCode' && <span className="unified-tag-xs unified-tag-purple">兑换码订单</span>}
                       {(selectedOrder.buyerType === 'Customer' || !selectedOrder.buyerType) && <span className="unified-tag-xs unified-tag-blue">直签订单</span>}
                       {selectedOrder.source === 'Sales'         && <span className="unified-tag-xs unified-tag-blue">后台下单</span>}
                       {selectedOrder.source === 'ChannelPortal' && <span className="unified-tag-xs unified-tag-indigo">渠道下单</span>}
                       {selectedOrder.source === 'OnlineStore'   && <span className="unified-tag-xs unified-tag-orange">官网下单</span>}
                       {selectedOrder.source === 'APISync'       && <span className="unified-tag-xs unified-tag-green">三方平台</span>}
                       {selectedOrder.source === 'Renewal'       && <span className="unified-tag-xs unified-tag-green">客户续费</span>}
                   </div>
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

               <div className="flex-1 min-w-0"></div>

               {/* Group 3: 人员 */}
               <div className="hidden lg:flex items-center gap-4 border-r border-gray-200 dark:border-white/10 pr-4 shrink-0">
                   <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 -m-1 rounded-lg transition-all group/user" onClick={() => onOpenUserDetail(selectedOrder.salesRepId)}>
                       <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0 transition-transform group-hover/user:scale-110">
                           <img src={users.find(u => u.id === selectedOrder.salesRepId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.salesRepName || 'Sales'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">销售</div>
                           <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none group-hover/user:text-blue-600 transition-colors">{(selectedOrder.salesRepName || '未分配').replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                       </div>
                   </div>
                   <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 -m-1 rounded-lg transition-all group/user" onClick={() => onOpenUserDetail(selectedOrder.businessManagerId)}>
                       <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0 transition-transform group-hover/user:scale-110">
                           <img src={users.find(u => u.id === selectedOrder.businessManagerId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.businessManagerName || 'Business'}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div>
                           <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">商务</div>
                           <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none group-hover/user:text-blue-600 transition-colors">{(selectedOrder.businessManagerName || '未分配').replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                       </div>
                   </div>
                   {selectedOrder.creatorName && (
                       <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 -m-1 rounded-lg transition-all group/user" onClick={() => onOpenUserDetail(selectedOrder.creatorId)}>
                           <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0 transition-transform group-hover/user:scale-110">
                               <img src={users.find(u => u.id === selectedOrder.creatorId)?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedOrder.creatorName || 'Creator'}`} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div>
                               <div className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-1">制单人</div>
                               <div className="text-xs font-semibold text-gray-900 dark:text-white leading-none group-hover/user:text-blue-600 transition-colors">{selectedOrder.creatorName.replace(/\s*[\((（].*?[\))）]\s*/g, '').trim()}</div>
                               {(() => {
                                   const phone = selectedOrder.creatorPhone || users.find(u => u.id === selectedOrder.creatorId)?.phone;
                                   if (!phone) return null;
                                   const masked = phone.length >= 7 ? phone.slice(0, 3) + '****' + phone.slice(-4) : phone;
                                   return (
                                       <div
                                           className="text-[10px] text-gray-400 leading-none mt-0.5 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors select-none"
                                           onClick={(e) => { e.stopPropagation(); onToggleCreatorPhone(); }}
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
                   {![OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.DRAFT].includes(selectedOrder.status) && (
                   <button 
                       onClick={() => onOpenStepModal('PAYMENT')}
                       className={`whitespace-nowrap shrink-0 ${selectedOrder.isPaid ? 'unified-button-secondary !text-green-600 !border-green-200 dark:!border-green-900/30' : 'unified-button-primary !bg-green-600 hover:!bg-green-700'}`}
                   >
                       <CreditCard className="w-3.5 h-3.5"/> {selectedOrder.isPaid ? '支付详情' : '支付'}
                   </button>
                   )}
                   {selectedOrder.status === OrderStatus.DRAFT && (
                   <button 
                       onClick={() => navigate('/orders', { state: { editDraftId: selectedOrder.id } })}
                       className="unified-button-primary whitespace-nowrap shrink-0"
                   >
                       <Edit3 className="w-3.5 h-3.5"/> 编辑订单
                   </button>
                   )}
                   {hasPermission('order_detail_snapshot') && (
                   <button 
                       onClick={onOpenSnapshot}
                       className="unified-button-secondary whitespace-nowrap shrink-0"
                   >
                       <Camera className="w-3.5 h-3.5"/> 快照
                   </button>
                   )}
                   {hasPermission('order_detail_log') && (
                   <button 
                       onClick={onOpenLog}
                       className="unified-button-secondary whitespace-nowrap shrink-0"
                   >
                       <History className="w-3.5 h-3.5"/> 记录
                   </button>
                   )}
                   {selectedOrder.isPaid && selectedOrder.status !== OrderStatus.REFUND_PENDING && selectedOrder.status !== OrderStatus.REFUNDED && selectedOrder.status !== OrderStatus.CANCELLED && (
                       <button 
                           onClick={() => onOpenStepModal('REFUND_REQUEST')} 
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
                  { id: 'FULFILLMENT', label: '订单交付', permission: 'order_detail_delivery' },
                  { id: 'EMAIL', label: '发货记录', permission: 'order_detail_shipping' },
              ] as { id: string; label: string; permission?: string; hidden?: boolean }[]).filter(tab => !tab.hidden && (!tab.permission || hasPermission(tab.permission))).map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id as OrderDetailTab)}
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
      </>
    );
};
