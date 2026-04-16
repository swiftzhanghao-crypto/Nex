import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Package, X, Filter, ChevronDown } from 'lucide-react';
import { Order, OrderStatus, OrderSource } from '../../types';
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
  [OrderStatus.DRAFT]: 'bg-gray-100 text-gray-600',
  [OrderStatus.PENDING_APPROVAL]: 'bg-amber-50 text-amber-600',
  [OrderStatus.PENDING_CONFIRM]: 'bg-blue-50 text-blue-600',
  [OrderStatus.PROCESSING_PROD]: 'bg-indigo-50 text-indigo-600',
  [OrderStatus.PENDING_PAYMENT]: 'bg-orange-50 text-orange-600',
  [OrderStatus.SHIPPED]: 'bg-cyan-50 text-cyan-600',
  [OrderStatus.DELIVERED]: 'bg-emerald-50 text-emerald-600',
  [OrderStatus.CANCELLED]: 'bg-gray-100 text-gray-400',
  [OrderStatus.REFUND_PENDING]: 'bg-rose-50 text-rose-500',
  [OrderStatus.REFUNDED]: 'bg-red-50 text-red-500',
};

const sourceMap: Record<string, string> = {
  Sales: '后台',
  ChannelPortal: '渠道',
  OnlineStore: '官网',
  APISync: '三方',
  Renewal: '续费',
};

const statusTabs = [
  { id: 'All', label: '全部' },
  { id: OrderStatus.DRAFT, label: '草稿' },
  { id: OrderStatus.PENDING_APPROVAL, label: '待审批' },
  { id: OrderStatus.PENDING_CONFIRM, label: '待确认' },
  { id: OrderStatus.PROCESSING_PROD, label: '备货中' },
  { id: OrderStatus.PENDING_PAYMENT, label: '待支付' },
  { id: OrderStatus.SHIPPED, label: '已发货' },
  { id: OrderStatus.DELIVERED, label: '已完成' },
];

interface MobileOrderManagerProps {
  onViewDetail?: (orderId: string) => void;
}

const MobileOrderManager: React.FC<MobileOrderManagerProps> = ({ onViewDetail }) => {
  const { orders, customers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = activeStatus === 'All' || o.status === activeStatus;
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        o.id.toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.items || []).some(i => (i.productName || '').toLowerCase().includes(q));
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, activeStatus, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${m}-${day} ${h}:${min}`;
  };

  const formatAmount = (n: number) =>
    n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black">
      {/* iOS-style Navigation Bar */}
      <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08] safe-area-top">
        <div className="flex items-center justify-between px-4 h-11">
          <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">订单管理</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <Search className="w-[18px] h-[18px] text-[#007AFF]" />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl px-3 h-9">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索订单号、客户、产品..."
                className="flex-1 bg-transparent text-[15px] outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status Tabs - iOS Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 px-4 pb-2 min-w-max">
            {statusTabs.map(tab => {
              const isActive = activeStatus === tab.id;
              const count = statusCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatus(tab.id)}
                  className={`shrink-0 px-3 py-1.5 text-[13px] font-medium rounded-full mr-2 transition-all ${
                    isActive
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1 text-[11px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-[15px] font-medium">暂无订单</p>
            <p className="text-[13px] mt-1 opacity-60">
              {searchTerm ? `未找到"${searchTerm}"相关订单` : '当前筛选条件下没有订单'}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-3 pb-6 space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                共 {filteredOrders.length} 条订单
              </span>
            </div>

            {filteredOrders.map((order, idx) => (
              <div
                key={order.id}
                onClick={() => onViewDetail?.(order.id)}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] active:scale-[0.98] transition-transform overflow-hidden"
                style={{ animation: `mobileSlideUp 0.3s ease-out ${idx * 0.04}s both` }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-mono text-gray-500 dark:text-gray-400 truncate">
                      {order.id}
                    </span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusMap[order.status] || order.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                </div>

                {/* Card Body */}
                <div className="px-4 pb-3 space-y-2">
                  {/* Customer & Amount Row */}
                  <div className="flex items-end justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                        {order.customerName || '—'}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {formatDate(order.date)} · {sourceMap[order.source] || order.source}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[17px] font-bold text-gray-900 dark:text-white tabular-nums">
                        ¥{formatAmount(order.total)}
                      </p>
                      <p className={`text-[11px] font-medium mt-0.5 ${order.isPaid ? 'text-emerald-500' : 'text-orange-500'}`}>
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5"
                        >
                          <Package className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{item.productName}</span>
                          <span className="text-gray-400">×{item.quantity || 1}</span>
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="text-[11px] text-gray-400 self-center ml-1">
                          +{order.items.length - 2} 项
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes mobileSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MobileOrderManager;
