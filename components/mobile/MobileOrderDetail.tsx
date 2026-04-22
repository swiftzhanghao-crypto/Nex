import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, Copy, Check, Package, CreditCard, Truck, MapPin, FileText,
  User, Building, Clock, CheckCircle, AlertCircle, Shield, ChevronRight, Receipt
} from 'lucide-react';
import { Order, OrderStatus, OrderItem } from '../../types';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';

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

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  [OrderStatus.DRAFT]:            { bg: 'bg-gray-50',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  [OrderStatus.PENDING_APPROVAL]: { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400' },
  [OrderStatus.PENDING_CONFIRM]:  { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400' },
  [OrderStatus.PROCESSING_PROD]:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  dot: 'bg-indigo-400' },
  [OrderStatus.PENDING_PAYMENT]:  { bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-400' },
  [OrderStatus.SHIPPED]:          { bg: 'bg-cyan-50',    text: 'text-cyan-600',    dot: 'bg-cyan-400' },
  [OrderStatus.DELIVERED]:        { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  [OrderStatus.CANCELLED]:        { bg: 'bg-gray-50',    text: 'text-gray-400',    dot: 'bg-gray-300' },
  [OrderStatus.REFUND_PENDING]:   { bg: 'bg-rose-50',    text: 'text-rose-500',    dot: 'bg-rose-400' },
  [OrderStatus.REFUNDED]:         { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400' },
};

const sourceMap: Record<string, string> = {
  Sales: '后台下单', ChannelPortal: '渠道下单', OnlineStore: '官网下单', APISync: '三方平台', Renewal: '客户续费',
};

const buyerTypeMap: Record<string, string> = {
  Customer: '直签订单', Channel: '渠道订单', SelfDeal: '自成交订单', RedeemCode: '兑换码订单',
};

const deliveryMap: Record<string, string> = { Online: '线上发货', Offline: '线下发货', Hybrid: '混合发货' };
const paymentMap: Record<string, string> = { WechatPay: '微信支付', Alipay: '支付宝', Transfer: '银行转账' };

interface MobileOrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const MobileOrderDetail: React.FC<MobileOrderDetailProps> = ({ orderId, onBack }) => {
  const { filteredOrders: orders, users, departments } = useAppContext();
  useEnsureData(['orders']);
  const [copiedId, setCopiedId] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'items' | 'logistics' | 'approval'>('overview');

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black">
        <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08]">
          <div className="flex items-center px-1 h-11">
            <button onClick={onBack} className="flex items-center text-[#007AFF] px-2 py-1 active:opacity-50">
              <ChevronLeft className="w-5 h-5" /><span className="text-[17px]">返回</span>
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[15px] text-gray-400">订单不存在</p>
        </div>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const sc = statusColors[order.status] || statusColors[OrderStatus.DRAFT];
  const salesUser = users.find(u => u.id === order.salesRepId);
  const salesDept = departments.find(d => d.id === salesUser?.departmentId);
  const bizUser = users.find(u => u.id === order.businessManagerId);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  const formatAmount = (n: number) =>
    n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const sections = [
    { id: 'overview' as const, label: '概览' },
    { id: 'items' as const, label: `商品 ${order.items?.length || 0}` },
    { id: 'logistics' as const, label: '物流' },
    { id: 'approval' as const, label: `记录 ${order.approvalRecords?.length || 0}` },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black" style={{ animation: 'mobileDetailIn 0.3s ease-out' }}>
      {/* Nav Bar */}
      <div className="shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.08] z-10">
        <div className="flex items-center justify-between px-1 h-11">
          <button onClick={onBack} className="flex items-center text-[#007AFF] px-2 py-1 active:opacity-50">
            <ChevronLeft className="w-5 h-5" /><span className="text-[17px]">订单</span>
          </button>
          <span className="text-[17px] font-semibold text-gray-900 dark:text-white absolute left-1/2 -translate-x-1/2 pointer-events-none">
            订单详情
          </span>
          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Status Hero */}
        <div className={`mx-4 mt-3 rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden ${sc.bg}`}>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
              <span className={`text-[17px] font-bold ${sc.text}`}>{statusMap[order.status] || order.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-mono text-gray-500">{order.id}</span>
              <button onClick={handleCopyId} className="active:opacity-50">
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gray-300" />}
              </button>
            </div>
            <div className="flex items-end justify-between mt-3">
              <div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">{order.customerName || '—'}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{formatDate(order.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-bold text-gray-900 dark:text-white tabular-nums">¥{formatAmount(order.total)}</p>
                <p className={`text-[12px] font-semibold ${order.isPaid ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {order.isPaid ? '已支付' : '待支付'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-4 pt-4 pb-1">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 min-w-max">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full mr-2 transition-all ${
                    activeSection === s.id
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-4 pb-6 pt-2">

          {/* ── Overview ── */}
          {activeSection === 'overview' && (
            <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
              {/* Basic Info Card */}
              <SectionCard title="订单信息">
                <InfoRow icon={<FileText />} label="订单来源" value={sourceMap[order.source] || order.source} />
                <InfoRow icon={<Receipt />} label="订单类型" value={buyerTypeMap[order.buyerType] || '—'} />
                {order.orderType && <InfoRow icon={<FileText />} label="业务类型" value={order.orderType} />}
                {order.buyerName && <InfoRow icon={<Building />} label="买方" value={order.buyerName} />}
                {order.opportunityName && <InfoRow icon={<FileText />} label="关联商机" value={order.opportunityName} />}
              </SectionCard>

              {/* People Card */}
              <SectionCard title="人员信息">
                {salesUser && <InfoRow icon={<User />} label="销售代表" value={`${salesUser.name}${salesDept ? ` · ${salesDept.name}` : ''}`} />}
                {bizUser && <InfoRow icon={<User />} label="商务经理" value={bizUser.name} />}
                {order.creatorName && <InfoRow icon={<User />} label="创建人" value={order.creatorName} />}
              </SectionCard>

              {/* Payment Card */}
              <SectionCard title="支付信息">
                <InfoRow icon={<CreditCard />} label="支付状态" value={order.isPaid ? '已支付' : '待支付'} valueColor={order.isPaid ? 'text-emerald-500' : 'text-orange-500'} />
                {order.paymentMethod && <InfoRow icon={<CreditCard />} label="支付方式" value={paymentMap[order.paymentMethod] || order.paymentMethod} />}
                {order.paymentDate && <InfoRow icon={<Clock />} label="支付时间" value={formatDate(order.paymentDate)} />}
                {order.settlementMethod && <InfoRow icon={<CreditCard />} label="结算方式" value={order.settlementMethod === 'cash' ? '现款' : order.settlementMethod === 'credit' ? '信用' : '预付'} />}
              </SectionCard>

              {/* Invoice Card */}
              {order.invoiceInfo && (
                <SectionCard title="发票信息">
                  <InfoRow icon={<Receipt />} label="发票类型" value={order.invoiceInfo.type === 'VAT_Special' ? '增值税专票' : '增值税普票'} />
                  <InfoRow icon={<Building />} label="发票抬头" value={order.invoiceInfo.title} />
                  <InfoRow icon={<FileText />} label="税号" value={order.invoiceInfo.taxId} />
                </SectionCard>
              )}

              {order.orderRemark && (
                <SectionCard title="订单备注">
                  <div className="px-4 py-3 text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {order.orderRemark}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* ── Items ── */}
          {activeSection === 'items' && (
            <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
              {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">{item.productName}</h4>
                      <p className="text-[12px] text-gray-400 mt-0.5">{item.skuName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[11px] text-gray-400">单价</p>
                        <p className="text-[14px] font-semibold text-gray-900 dark:text-white tabular-nums">
                          ¥{formatAmount(item.priceAtPurchase)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">数量</p>
                        <p className="text-[14px] font-semibold text-gray-900 dark:text-white tabular-nums">
                          {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">小计</p>
                      <p className="text-[15px] font-bold text-[#007AFF] tabular-nums">
                        ¥{formatAmount(item.priceAtPurchase * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Extra fields */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.licensee && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                        授权: {item.licensee}
                      </span>
                    )}
                    {item.licenseType && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-sky-50 text-sky-600 border border-sky-100">
                        {item.licenseType}
                      </span>
                    )}
                    {item.activationMethod && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-orange-50 text-orange-600 border border-orange-100">
                        {item.activationMethod}
                      </span>
                    )}
                    {item.enterpriseName && (
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        {item.enterpriseName}
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] px-4 py-12 text-center text-[14px] text-gray-400">
                  暂无商品明细
                </div>
              )}

              {/* Total Summary */}
              {order.items && order.items.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-gray-500">合计（{order.items.length} 项）</span>
                    <span className="text-[18px] font-bold text-gray-900 dark:text-white tabular-nums">¥{formatAmount(order.total)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Logistics ── */}
          {activeSection === 'logistics' && (
            <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
              <SectionCard title="发货信息">
                <InfoRow icon={<Truck />} label="发货方式" value={deliveryMap[order.deliveryMethod || ''] || order.deliveryMethod || '—'} />
                <InfoRow icon={<Clock />} label="发货时间" value={order.shippedDate ? formatDate(order.shippedDate) : '—'} />
                {order.carrier && <InfoRow icon={<Truck />} label="物流公司" value={order.carrier} />}
                {order.trackingNumber && <InfoRow icon={<FileText />} label="快递单号" value={order.trackingNumber} />}
              </SectionCard>

              <SectionCard title="收货信息">
                {order.receivingParty && <InfoRow icon={<User />} label="收货人" value={order.receivingParty} />}
                {order.receivingCompany && <InfoRow icon={<Building />} label="收货单位" value={order.receivingCompany} />}
                <InfoRow icon={<MapPin />} label="收货地址" value={order.shippingAddress || '—'} />
                {order.shippingPhone && <InfoRow icon={<User />} label="联系电话" value={order.shippingPhone} />}
                {order.shippingEmail && <InfoRow icon={<User />} label="联系邮箱" value={order.shippingEmail} />}
              </SectionCard>

              <SectionCard title="备货进度">
                <ProgressRow label="授权确认" done={!!order.isAuthConfirmed} date={order.authConfirmedDate} formatDate={formatDate} />
                <ProgressRow label="安装包核验" done={!!order.isPackageConfirmed} date={order.packageConfirmedDate} formatDate={formatDate} />
                <ProgressRow label="发货确认" done={!!order.isShippingConfirmed} date={order.shippingConfirmedDate} formatDate={formatDate} />
                <ProgressRow label="光盘刻录" done={!!order.isCDBurned} date={order.cdBurnedDate} formatDate={formatDate} />
              </SectionCard>
            </div>
          )}

          {/* ── Approval Records ── */}
          {activeSection === 'approval' && (
            <div className="space-y-3" style={{ animation: 'mobileSlideUp 0.25s ease-out' }}>
              {/* Approval Status */}
              <SectionCard title="审批状态">
                <ProgressRow label="销售审批" done={!!order.approval?.salesApproved} date={order.approval?.salesApprovedDate} formatDate={formatDate} />
                <ProgressRow label="商务审批" done={!!order.approval?.businessApproved} date={order.approval?.businessApprovedDate} formatDate={formatDate} />
                <ProgressRow label="财务审批" done={!!order.approval?.financeApproved} date={order.approval?.financeApprovedDate} formatDate={formatDate} />
              </SectionCard>

              {/* Timeline */}
              {order.approvalRecords && order.approvalRecords.length > 0 ? (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">操作记录</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                    {order.approvalRecords.map((rec, i) => (
                      <div key={rec.id || i} className="px-4 py-3 flex gap-3">
                        <div className="mt-0.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            rec.result === 'Approved' || rec.result === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-500'
                              : rec.result === 'Rejected'
                              ? 'bg-red-50 text-red-500'
                              : 'bg-blue-50 text-blue-500'
                          }`}>
                            {rec.result === 'Rejected'
                              ? <AlertCircle className="w-3.5 h-3.5" />
                              : <CheckCircle className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-gray-900 dark:text-white">{rec.operatorName}</span>
                            <span className="text-[11px] text-gray-400">{rec.operatorRole}</span>
                          </div>
                          <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-0.5">
                            {rec.actionType} · {rec.result === 'Approved' ? '通过' : rec.result === 'Rejected' ? '驳回' : rec.result === 'Confirmed' ? '确认' : rec.result}
                          </p>
                          {rec.comment && (
                            <p className="text-[13px] text-gray-500 mt-1 bg-gray-50 dark:bg-white/5 rounded-lg px-2.5 py-1.5 leading-relaxed">
                              {rec.comment}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">{formatDate(rec.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] px-4 py-12 text-center text-[14px] text-gray-400">
                  暂无操作记录
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mobileDetailIn {
          from { opacity: 0; transform: translateX(30%); }
          to { opacity: 1; transform: translateX(0); }
        }
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

/* ─── Reusable sub-components ─── */

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
      <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string }> = ({
  icon, label, value, valueColor,
}) => (
  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 dark:border-white/[0.03] last:border-b-0">
    <div className="flex items-center gap-2 text-gray-400">
      <span className="opacity-50 w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      <span className="text-[14px]">{label}</span>
    </div>
    <span className={`text-[14px] font-medium max-w-[180px] text-right truncate ${valueColor || 'text-gray-900 dark:text-white'}`}>
      {value}
    </span>
  </div>
);

const ProgressRow: React.FC<{ label: string; done: boolean; date?: string; formatDate: (d?: string) => string }> = ({
  label, done, date, formatDate,
}) => (
  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 dark:border-white/[0.03] last:border-b-0">
    <div className="flex items-center gap-2">
      {done
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600" />}
      <span className={`text-[14px] ${done ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}`}>{label}</span>
    </div>
    <span className="text-[12px] text-gray-400">{done && date ? formatDate(date) : '—'}</span>
  </div>
);

export default MobileOrderDetail;
