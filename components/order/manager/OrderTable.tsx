import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, X } from 'lucide-react';
import { Order, OrderStatus, User } from '../../../types';
import Pagination from '../../common/Pagination';
import { Badge } from '../../ui';
import { buyerTypeMap, deliveryMethodMap, paymentMethodMap } from './orderManagerUtils';

export interface OrderTableProps {
  currentOrders: Order[];
  filteredOrdersCount: number;
  visibleColumns: string[];
  orderedVisibleColumns: { id: string; label: string }[];
  tableColGroup: React.ReactNode;
  tableWidth: number;
  selectedOrderIds: Set<string>;
  headerScrollRef: React.RefObject<HTMLDivElement | null>;
  bodyScrollRef: React.RefObject<HTMLDivElement | null>;
  productPopoverId: string | null;
  popoverPos: { top: number; left: number } | null;
  productPopoverRef: React.RefObject<HTMLDivElement | null>;
  copiedOrderId: string | null;
  tableCopied: boolean;
  safePage: number;
  itemsPerPage: number;
  orders: Order[];
  users: User[];
  departments: { id: string; name: string; parentId?: string }[];
  channels: { id: string; name: string }[];
  onToggleSelectAll: () => void;
  onToggleSelectOrder: (id: string) => void;
  onCopyOrderId: (e: React.MouseEvent, id: string) => void;
  onCopyTable: () => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onProductPopoverToggle: (orderId: string, rect: DOMRect) => void;
  onProductPopoverClose: () => void;
  onUserClick: (user: User) => void;
  getDepartmentPath: (deptId?: string) => string;
  getStatusBadge: (status: OrderStatus) => React.ReactNode;
  getPaymentStatusBadge: (isPaid: boolean) => React.ReactNode;
  getStockStatusBadge: (order: Order) => React.ReactNode;
  getSourceBadge: (source: Order['source']) => React.ReactNode;
  getAction: (order: Order) => React.ReactNode;
}

export const OrderTable: React.FC<OrderTableProps> = React.memo(function OrderTable(props) {
  const navigate = useNavigate();
  const {
    currentOrders,
    filteredOrdersCount,
    visibleColumns,
    orderedVisibleColumns,
    tableColGroup,
    tableWidth,
    selectedOrderIds,
    headerScrollRef,
    bodyScrollRef,
    productPopoverId,
    popoverPos,
    productPopoverRef,
    copiedOrderId,
    tableCopied,
    safePage,
    itemsPerPage,
    orders,
    users,
    departments,
    channels,
    onToggleSelectAll,
    onToggleSelectOrder,
    onCopyOrderId,
    onCopyTable,
    onPageChange,
    onSizeChange: onItemsPerPageChange,
    onProductPopoverToggle,
    onProductPopoverClose,
    onUserClick,
    getDepartmentPath,
    getStatusBadge,
    getPaymentStatusBadge,
    getStockStatusBadge,
    getSourceBadge,
    getAction,
  } = props;

  const useVirtual = currentOrders.length > 50;
  const rowVirtualizer = useVirtualizer({
    count: currentOrders.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => 72,
    overscan: 8,
    enabled: useVirtual,
  });

  return (
    <>
<div className="unified-card overflow-hidden flex-1 min-h-0 min-w-0 flex flex-col">
    {/* ── 固定表头（不在滚动容器内，滚动条不延伸至此） ── */}
    <div
        ref={headerScrollRef}
        className="overflow-x-auto no-scrollbar"
        onScroll={(e) => { if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
    >
      <table className="text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', width: tableWidth }}>
        {tableColGroup}
        <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
          <tr>
            <th className="pl-6 pr-2 py-2.5 sticky left-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 w-[52px] min-w-[52px] align-middle">
                <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 align-middle"
                    onChange={onToggleSelectAll}
                    checked={currentOrders.length > 0 && currentOrders.every(o => selectedOrderIds.has(o.id))}
                />
            </th>
            {orderedVisibleColumns.map(col => (
                <th key={col.id} className={`px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] ${
                    col.id === 'id'
                        ? 'sticky left-[52px] z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]'
                        : col.id === 'action'
                        ? 'sticky right-[52px] z-10 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.3)] text-right'
                        : ''
                }`}>{col.label}</th>
            ))}
            <th className="px-3 py-2.5 sticky right-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 w-[52px] min-w-[52px]"></th>
          </tr>
        </thead>
      </table>
    </div>
    {/* ── 可滚动表体（滚动条只在此区域） ── */}
    <div
        ref={bodyScrollRef}
        className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar"
        onScroll={(e) => { if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
    >
  <table className="text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', width: tableWidth }}>
    {tableColGroup}
    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
      {useVirtual && (() => {
        const virtualRows = rowVirtualizer.getVirtualItems();
        const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
        const paddingBottom = virtualRows.length > 0
          ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
          : 0;
        return (
          <>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={visibleColumns.length + 2} style={{ height: paddingTop, padding: 0, border: 'none' }} />
              </tr>
            )}
          </>
        );
      })()}
      {(useVirtual ? rowVirtualizer.getVirtualItems().map((v) => currentOrders[v.index]) : currentOrders).map(order => {
        const isSelected = selectedOrderIds.has(order.id);
        const stickyBg = isSelected
            ? 'bg-blue-50/80 dark:bg-blue-900/10'
            : 'bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 dark:group-hover:bg-white/[0.03]';
        return (
        <tr key={order.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${isSelected ? '!bg-blue-50/50 dark:!bg-blue-900/10' : ''}`}>
          <td className={`pl-6 pr-2 py-2.5 sticky left-0 z-20 ${stickyBg} transition-colors align-middle`}>
              <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 align-middle"
                  checked={isSelected}
                  onChange={() => onToggleSelectOrder(order.id)}
              />
          </td>
          {orderedVisibleColumns.map(col => {
            const colId = col.id;
            switch (colId) {
              case 'id':
                return (
                  <td key={colId} className={`px-3 py-2 sticky left-[52px] z-20 ${stickyBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors align-middle`}>
                      <div className="relative">
                          <span
                              className={`text-sm font-semibold cursor-pointer hover:underline ${order.status === OrderStatus.DRAFT ? 'text-amber-500 dark:text-amber-400' : 'text-[#0071E3] dark:text-[#FF2D55]'}`}
                              style={{fontVariantNumeric:'tabular-nums'}}
                              onClick={() => navigate(`/orders/${order.id}`)}
                          >
                              {order.id}
                          </span>
                          <button
                              onClick={(e) => onCopyOrderId(e, order.id)}
                              className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-all"
                              title="复制订单编号"
                          >
                              {copiedOrderId === order.id
                                  ? <Check className="w-3 h-3 text-green-500" />
                                  : <Copy className="w-3 h-3" />}
                          </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="group/tip relative">
                            {order.buyerType === 'Channel'    && <Badge color="indigo">{buyerTypeMap['Channel']}</Badge>}
                            {order.buyerType === 'SelfDeal'   && <Badge color="orange">{buyerTypeMap['SelfDeal']}</Badge>}
                            {order.buyerType === 'RedeemCode' && <Badge color="purple">{buyerTypeMap['RedeemCode']}</Badge>}
                            {(order.buyerType === 'Customer' || !order.buyerType) && <Badge color="blue">{buyerTypeMap[order.buyerType || 'Customer']}</Badge>}
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 px-1.5 py-0.5 rounded bg-gray-800 dark:bg-gray-700 text-[10px] text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-30">订单类型</span>
                          </span>
                          <span className="group/tip relative">
                            {getStatusBadge(order.status)}
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 px-1.5 py-0.5 rounded bg-gray-800 dark:bg-gray-700 text-[10px] text-white whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-30">订单状态</span>
                          </span>
                          <span className="group/tip relative text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap ml-auto" style={{fontVariantNumeric:'tabular-nums'}}>
                            ¥{(order.total ?? 0).toLocaleString()}
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 px-1.5 py-0.5 rounded bg-gray-800 dark:bg-gray-700 text-[10px] text-white font-normal whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-30">订单应付金额</span>
                          </span>
                      </div>
                  </td>
                );
              case 'customer':
                return (
                  <td key={colId} className="px-3 py-2.5 max-w-[180px]">
                    <div 
                        className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline transition-colors break-words cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${order.customerId}`);
                        }}
                    >
                        {order.customerName}
                    </div>
                  </td>
                );
              case 'buyer':
                return (
                  <td key={colId} className="px-3 py-2.5 max-w-[180px]">
                    {order.buyerType === 'Channel' ? (
                        <div 
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer break-words"
                            onClick={(e) => {
                                e.stopPropagation();
                                const channelId = order.buyerId || channels.find(c => c.name === order.buyerName)?.id;
                                if (channelId) navigate(`/channels/${channelId}`);
                            }}
                        >
                            {order.buyerName}
                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 break-words">
                            {order.customerName}
                        </div>
                    )}
                  </td>
                );
              case 'products':
                return (
                  <td key={colId} className="px-3 py-2.5">
                      <div className="flex flex-col gap-1 max-w-[220px]">
                          {(order.items || []).slice(0, 1).map((item, idx) => (
                              <div key={idx} className="flex flex-col">
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="relative group/pname min-w-0 flex-1">
                                          <div className="truncate font-medium text-gray-700 dark:text-gray-300">{item.productName}</div>
                                          <div className="absolute left-0 top-full mt-1.5 z-[9999] hidden group-hover/pname:block pointer-events-none">
                                              <div className="px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 text-white dark:text-gray-900 text-xs leading-relaxed rounded-lg shadow-lg max-w-xs whitespace-normal break-words animate-[tooltipIn_0.15s_ease-out]">{item.productName}</div>
                                          </div>
                                      </div>
                                      <span className="text-gray-400 shrink-0">×{item.quantity}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                      {item.skuName && <span className="inline-flex w-fit px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                                      {item.licenseType && <span className="inline-flex w-fit px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                                      {item.subUnits && item.subUnits.length > 0 && <span className="inline-flex w-fit px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">下级×{item.subUnits.length}</span>}
                                  </div>
                              </div>
                          ))}
                          {(order.items || []).length > 1 && (
                              <div className="mt-1 self-end" ref={productPopoverId === order.id ? productPopoverRef : undefined}>
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (productPopoverId === order.id) { onProductPopoverClose(); } else { onProductPopoverToggle(order.id, (e.currentTarget as HTMLElement).getBoundingClientRect()); }
                                      }}
                                      className="text-[10px] font-semibold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 px-1.5 py-px rounded-full transition"
                                  >
                                      +{(order.items || []).length - 1} 更多
                                  </button>
                              </div>
                          )}
                      </div>
                  </td>
                );
              case 'sales':
                return (
                  <td key={colId} className="px-3 py-2.5 whitespace-nowrap">
                      {(() => {
                          const user = users.find(u => u.id === order.salesRepId);
                          const rawName = order.salesRepName || '未分配';
                          const displayName = rawName.replace(/\s*\(.*\)\s*$/, '');
                          const initials = displayName.slice(0, 1);
                          return (
                              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-lg transition-all group/user" onClick={(e) => { e.stopPropagation(); if (user) { onUserClick(user); } }}>
                                  <div className="relative shrink-0">
                                      <img src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${rawName}`} className="w-7 h-7 rounded-full object-cover bg-gray-100 border border-gray-200 dark:border-white/10 transition-transform group-hover/user:scale-110" alt={displayName}
                                          onError={(e) => { const t = e.currentTarget; t.style.display='none'; const f = t.nextElementSibling as HTMLElement; if(f) f.style.display='flex'; }} />
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white text-[10px] font-bold" style={{display:'none'}}>{initials}</div>
                                      {user?.status === 'Active' && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>}
                                  </div>
                                  <span className="font-semibold text-gray-900 dark:text-white group-hover/user:text-blue-600 transition-colors whitespace-nowrap">{displayName}</span>
                              </div>
                          );
                      })()}
                  </td>
                );
              case 'businessManager':
                return (
                  <td key={colId} className="px-3 py-2.5 whitespace-nowrap">
                      {(() => {
                          const user = users.find(u => u.id === order.businessManagerId);
                          const rawName = order.businessManagerName || '未分配';
                          const displayName = rawName.replace(/\s*\(.*\)\s*$/, '');
                          const initials = displayName.slice(0, 1);
                          return (
                              <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-lg transition-all group/user" onClick={(e) => { e.stopPropagation(); if (user) { onUserClick(user); } }}>
                                  <div className="relative shrink-0">
                                      <img src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${rawName}`} className="w-7 h-7 rounded-full object-cover bg-gray-100 border border-gray-200 dark:border-white/10 transition-transform group-hover/user:scale-110" alt={displayName}
                                          onError={(e) => { const t = e.currentTarget; t.style.display='none'; const f = t.nextElementSibling as HTMLElement; if(f) f.style.display='flex'; }} />
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 items-center justify-center text-white text-[10px] font-bold" style={{display:'none'}}>{initials}</div>
                                      {user?.status === 'Active' && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>}
                                  </div>
                                  <span className="font-semibold text-gray-900 dark:text-white group-hover/user:text-blue-600 transition-colors whitespace-nowrap">{displayName}</span>
                              </div>
                          );
                      })()}
                  </td>
                );
              case 'department':
                return (
                  <td key={colId} className="px-3 py-2.5">
                      {(() => {
                          const user = users.find(u => u.id === order.salesRepId);
                          const fullPath = getDepartmentPath(user?.departmentId);
                          if (fullPath === '-') return <span className="text-gray-400">-</span>;
                          const parts = fullPath.split(' / ');
                          return (
                              <div className="flex items-start gap-1 flex-wrap leading-snug">
                                  {parts.map((part, idx) => (
                                      <span key={idx} className="flex items-center gap-1">
                                          {idx > 0 && <span className="text-gray-300 dark:text-gray-600 text-[10px]">/</span>}
                                          <span className={`text-xs font-medium ${idx === parts.length - 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{part}</span>
                                      </span>
                                  ))}
                              </div>
                          );
                      })()}
                  </td>
                );
              case 'source':
                return <td key={colId} className="px-3 py-2.5 whitespace-nowrap">{getSourceBadge(order.source)}</td>;
              case 'buyerType':
                return (
                  <td key={colId} className="px-3 py-2.5 whitespace-nowrap">
                      {order.buyerType === 'Channel'    && <Badge color="indigo">{buyerTypeMap['Channel']}</Badge>}
                      {order.buyerType === 'SelfDeal'   && <Badge color="orange">{buyerTypeMap['SelfDeal']}</Badge>}
                      {order.buyerType === 'RedeemCode' && <Badge color="purple">{buyerTypeMap['RedeemCode']}</Badge>}
                      {order.buyerType === 'Customer'   && <Badge color="blue">{buyerTypeMap['Customer']}</Badge>}
                      {!order.buyerType                 && <Badge color="gray">{buyerTypeMap['Customer']}</Badge>}
                  </td>
                );
              case 'date':
                return <td key={colId} className="px-3 py-2.5 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap" style={{fontVariantNumeric:'tabular-nums'}}>{new Date(order.date).toLocaleString('zh-CN', { hour12: false })}</td>;
              case 'status':
                return <td key={colId} className="px-3 py-2.5 whitespace-nowrap">{getStatusBadge(order.status)}</td>;
              case 'paymentStatus':
                return <td key={colId} className="px-3 py-2.5 whitespace-nowrap">{getPaymentStatusBadge(order.isPaid)}</td>;
              case 'stockStatus':
                return <td key={colId} className="px-3 py-2.5 whitespace-nowrap">{getStockStatusBadge(order)}</td>;
              case 'total':
                return <td key={colId} className="px-3 py-2.5 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap" style={{fontVariantNumeric:'tabular-nums'}}>¥{(order.total ?? 0).toLocaleString()}</td>;
              case 'payment':
                return (
                  <td key={colId} className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                      {order.paymentMethod ? paymentMethodMap[order.paymentMethod] : '-'}
                  </td>
                );
              case 'delivery':
                return (
                  <td key={colId} className="px-3 py-2.5">
                      {order.deliveryMethod ? (
                          <Badge color={order.deliveryMethod === 'Online' ? 'blue' : order.deliveryMethod === 'Offline' ? 'orange' : 'indigo'}>{deliveryMethodMap[order.deliveryMethod]}</Badge>
                      ) : <span className="text-gray-400">-</span>}
                  </td>
                );
              case 'address':
                return (
                  <td key={colId} className="px-3 py-2.5 text-gray-500 dark:text-gray-400 max-w-[180px] truncate" title={order.shippingAddress}>
                      {order.shippingAddress || '-'}
                  </td>
                );
              case 'invoice':
                return (
                  <td key={colId} className="px-3 py-2.5 text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={order.invoiceInfo?.title}>
                      {order.invoiceInfo?.title || '-'}
                  </td>
                );
              case 'licensee':
                return (
                  <td key={colId} className="px-3 py-2.5 max-w-[200px]">
                      {(() => {
                          const licensees = [...new Set((order.items || []).map(i => i.licensee).filter(Boolean))];
                          if (licensees.length === 0) return <span className="text-gray-400">-</span>;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="relative group/lic">
                                <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{licensees[0]}</div>
                                <div className="absolute left-0 top-full mt-1.5 z-[9999] hidden group-hover/lic:block pointer-events-none">
                                  <div className="px-3 py-2 bg-gray-900/95 dark:bg-gray-100/95 text-white dark:text-gray-900 text-xs leading-relaxed rounded-lg shadow-lg max-w-xs whitespace-normal break-words animate-[tooltipIn_0.15s_ease-out]">{licensees[0]}</div>
                                </div>
                              </div>
                              {licensees.length > 1 && (
                                <div className="relative group/licmore self-start">
                                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 px-1.5 py-px rounded-full cursor-default">
                                    +{licensees.length - 1} 被授权方
                                  </span>
                                  <div className="absolute left-0 top-full mt-1.5 z-[9999] hidden group-hover/licmore:block">
                                    <div className="px-3 py-2.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl min-w-[180px] max-w-xs">
                                      <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">全部被授权方（{licensees.length}）</div>
                                      <div className="space-y-1">
                                        {licensees.map((lic, li) => (
                                          <div key={li} className="text-xs text-gray-700 dark:text-gray-300 leading-snug break-words">{lic}</div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                      })()}
                  </td>
                );
              case 'opportunity':
                return (
                  <td key={colId} className="px-3 py-2.5 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer max-w-[150px] truncate" title={order.opportunityName} onClick={(e) => { e.stopPropagation(); if (order.opportunityId) navigate(`/opportunities/${order.opportunityId}`); }}>
                      {order.opportunityName || '-'}
                  </td>
                );
              case 'action': {
                const actionContent = getAction(order);
                const hasAction = actionContent !== null;
                return (
                  <td key={colId} className={`px-3 py-2.5 text-right whitespace-nowrap sticky right-[52px] z-20 transition-colors overflow-visible ${hasAction ? `${stickyBg} shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.25)]` : ''}`}>
                      {actionContent}
                  </td>
                );
              }
              default:
                return <td key={colId} className="px-3 py-2.5 text-gray-400">-</td>;
            }
          })}
          <td className={`px-3 py-2.5 sticky right-0 z-10 w-[52px] min-w-[52px] ${stickyBg} transition-colors`} />
        </tr>
        );
      })}
      {useVirtual && (() => {
        const virtualRows = rowVirtualizer.getVirtualItems();
        const paddingBottom = virtualRows.length > 0
          ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
          : 0;
        return paddingBottom > 0 ? (
          <tr aria-hidden="true">
            <td colSpan={visibleColumns.length + 2} style={{ height: paddingBottom, padding: 0, border: 'none' }} />
          </tr>
        ) : null;
      })()}
      {currentOrders.length === 0 && <tr><td colSpan={visibleColumns.length + 2} className="p-12 text-center text-gray-400">暂无订单数据</td></tr>}
    </tbody>
  </table>
</div>

<div className="flex items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5 shrink-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">
      共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredOrdersCount}</span> 条
    </span>
    <button
        onClick={onCopyTable}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ml-4 ${
            tableCopied
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
        }`}
        title="复制当前页表格数据（可粘贴到 Excel）"
    >
        {tableCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {tableCopied ? '已复制' : '复制表格'}
    </button>
    <Pagination
        page={safePage}
        size={itemsPerPage}
        total={filteredOrdersCount}
        onPageChange={onPageChange}
        onSizeChange={(s) => { onItemsPerPageChange(s); onPageChange(1); }}
        sizeOptions={[20, 50, 100]}
        className="flex items-center gap-3 ml-auto"
        hideTotal
    />
</div>
</div>

      {/* Product Popover — fixed to viewport, avoids table clipping */}
      {productPopoverId && popoverPos && (() => {
  const order = orders.find(o => o.id === productPopoverId);
  if (!order) return null;
  return (
      <div
          ref={productPopoverRef}
          style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999, width: 288 }}
          className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in"
          onClick={e => e.stopPropagation()}
      >
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">全部产品（{(order.items || []).length}）</span>
              <button onClick={() => { onProductPopoverClose(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                  <X className="w-3.5 h-3.5" />
              </button>
          </div>
          <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
              {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1 pb-2.5 border-b border-gray-50 dark:border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{item.productName}</span>
                          <span className="text-xs text-gray-400 shrink-0">×{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                          {item.skuName && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                          {item.licenseType && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                          {item.subUnits && item.subUnits.length > 0 && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">下级×{item.subUnits.length}</span>}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
      })()}
    </>
  );
});
