import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

const statusMap: Record<string, string> = {
  [OrderStatus.DRAFT]: '草稿',
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

const statusColors: Record<string, string> = {
  [OrderStatus.DRAFT]: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  [OrderStatus.PENDING_APPROVAL]: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  [OrderStatus.PENDING_CONFIRM]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  [OrderStatus.PROCESSING_PROD]: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  [OrderStatus.PENDING_PAYMENT]: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  [OrderStatus.SHIPPED]: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  [OrderStatus.DELIVERED]: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500',
  [OrderStatus.REFUND_PENDING]: 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400',
  [OrderStatus.REFUNDED]: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
};

const sourceMap: Record<string, string> = {
  Direct: '直销',
  Channel: '渠道',
  Online: '线上',
  Offline: '线下',
};

function formatAmount(n: number): string {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (n >= 10000) return `${(n / 10000).toFixed(2).replace(/\.?0+$/, '')}万`;
  return n.toLocaleString('zh-CN');
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return sameYear ? `${m}-${day}` : `${date.getFullYear()}-${m}-${day}`;
  } catch {
    return d;
  }
}

interface OrderCardInChatProps {
  orderId: string;
  onClose?: () => void;
}

const OrderCardInChat: React.FC<OrderCardInChatProps> = ({ orderId, onClose }) => {
  const { filteredOrders } = useAppContext();
  const navigate = useNavigate();
  const order = filteredOrders.find((o: Order) => o.id === orderId);

  if (!order) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 px-4 py-3 max-w-md">
        <div className="text-xs text-gray-400">未找到订单 <span className="font-mono text-gray-600 dark:text-gray-300">{orderId}</span></div>
      </div>
    );
  }

  const handleClick = () => {
    onClose?.();
    navigate(`/orders/${order.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md cursor-pointer transition-all overflow-hidden max-w-md"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-mono text-gray-500 dark:text-gray-400 truncate">
            {order.id}
          </span>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
            {statusMap[order.status] || order.status}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-2">
        {/* Customer & Amount Row */}
        <div className="flex items-end justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {order.customerName || '—'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatDate(order.date)} · {sourceMap[order.source] || order.source || '—'}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-[16px] font-bold text-gray-900 dark:text-white tabular-nums">
              ¥{formatAmount(order.total)}
            </p>
            <p className={`text-[10px] font-medium mt-0.5 ${order.isPaid ? 'text-emerald-500' : 'text-orange-500'}`}>
              {order.isPaid ? '已支付' : '待支付'}
            </p>
          </div>
        </div>

        {/* Products Preview */}
        {order.items && order.items.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {order.items.slice(0, 2).map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5"
              >
                <Package className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{item.productName}</span>
                <span className="text-gray-400">×{item.quantity || 1}</span>
              </span>
            ))}
            {order.items.length > 2 && (
              <span className="text-[10px] text-gray-400 self-center ml-1">
                +{order.items.length - 2} 项
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCardInChat;
