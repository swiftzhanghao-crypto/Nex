import React from 'react';
import { X, Package, Building, Users, FileText, Truck, Banknote, ClipboardCheck, Target, MapPin, Mail, Phone, CreditCard, Key, Calendar, Layers, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { OrderItem, BuyerType, OrderSource, DeliveryMethod, AcceptanceInfo, OnlineDeliveryEntry } from '../../../types';
import type { ValidationError } from './wizardValidation';

const buyerTypeLabels: Record<string, string> = {
  Customer: '直签订单',
  Channel: '渠道订单',
  SelfDeal: '自成交订单',
  RedeemCode: '兑换码订单',
};
const sourceLabels: Record<string, string> = {
  Sales: '销售录入',
  OnlineStore: '官网',
  ChannelPortal: '渠道来源',
  APISync: 'API 对接',
  Renewal: '续费',
};
const deliveryLabels: Record<string, string> = {
  Online: '线上发货',
  Offline: '线下发货',
  Hybrid: '混合发货',
};

interface OrderConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  validationErrors: ValidationError[];
  // 基本信息
  buyerType: BuyerType | '';
  orderSource: OrderSource;
  customerName: string;
  channelName?: string;
  opportunityName?: string;
  salesRepName?: string;
  businessManagerName?: string;
  sellerName?: string;
  creatorName?: string;
  orderRemark?: string;
  // 联系人
  purchasingContactName?: string;
  purchasingContactPhone?: string;
  itContactName?: string;
  itContactPhone?: string;
  // 合同
  linkedContractNames?: string[];
  // 产品
  items: OrderItem[];
  totalAmount: number;
  // 交付
  deliveryMethod: DeliveryMethod;
  shippingAddress?: string;
  shippingPhone?: string;
  shippingEmail?: string;
  onlineDeliveries?: OnlineDeliveryEntry[];
  // 验收
  acceptanceForm: AcceptanceInfo;
  productAcceptanceRows: { productIdx: number; method: string; condition: string; expectedDate: string; percentage: number }[];
  // 结算
  settlementMethod: string;
  settlementType?: string;
  expectedPaymentDate?: string;
  installmentPlans?: { amount: number; expectedDate: string }[];
  // 序列号
  serialNumberRequirement: string;
  reuseSerialNumber?: string;
}

const InfoRow: React.FC<{ label: string; value?: string | React.ReactNode; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
    <span className="text-[13px] font-bold text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{label}</span>
    {typeof value === 'string' || !value ? (
      <span className={`text-[13px] font-medium flex-1 truncate ${highlight ? 'font-mono font-bold text-red-600 dark:text-red-400' : mono ? 'font-mono text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`} title={typeof value === 'string' ? value : undefined}>{value || '-'}</span>
    ) : (
      <span className="text-[13px] font-medium flex-1">{value}</span>
    )}
  </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
  <div className={`unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden ${className}`}>
    <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-white/50 dark:bg-white/5">
      {icon}
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
  open, onClose, onConfirm, isSubmitting, validationErrors,
  buyerType, orderSource, customerName, channelName, opportunityName,
  salesRepName, businessManagerName, sellerName, creatorName, orderRemark,
  purchasingContactName, purchasingContactPhone, itContactName, itContactPhone,
  linkedContractNames,
  items, totalAmount,
  deliveryMethod, shippingAddress, shippingPhone, shippingEmail, onlineDeliveries,
  acceptanceForm, productAcceptanceRows,
  settlementMethod, settlementType, expectedPaymentDate, installmentPlans,
  serialNumberRequirement, reuseSerialNumber,
}) => {
  if (!open) return null;

  const hasErrors = validationErrors.length > 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[600] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 z-[601] flex flex-col bg-[#F5F5F7] dark:bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-modal-enter">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#0071E3] dark:text-[#0A84FF]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">订单确认</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">请仔细核对以下信息，确认无误后提交</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Validation Banner */}
        {hasErrors && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-bold text-red-700 dark:text-red-300">存在 {validationErrors.length} 项校验问题，请返回修正</span>
              <ul className="mt-1 space-y-0.5">
                {validationErrors.slice(0, 3).map((e, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {e.message}
                  </li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="text-xs text-red-500">...还有 {validationErrors.length - 3} 项</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
          {/* 订单产品明细 */}
          <SectionCard icon={<Package className="w-5 h-5 text-orange-500" />} title="订单产品明细">
            <div className="flex items-stretch gap-0 -m-5">
              <div className="flex-1 min-w-0 overflow-x-auto">
                <table className="w-full text-left min-w-[520px]">
                  <thead className="unified-table-header">
                    <tr>
                      <th className="px-5 py-3 pl-6 text-center w-12">序号</th>
                      <th className="px-5 py-3">产品信息</th>
                      <th className="px-5 py-3 text-center">数量</th>
                      <th className="px-5 py-3 text-center">授权/服务期限</th>
                      <th className="px-5 py-3 text-right">单价</th>
                      <th className="px-5 py-3 text-right">产品金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {items.map((item, idx) => {
                      const lineNo = String(idx + 1).padStart(3, '0');
                      const itemAmount = item.priceAtPurchase * item.quantity;
                      return (
                        <tr key={idx} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4 pl-6 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">{lineNo}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {item.skuName && <span className="inline-flex px-2 py-0.5 text-xs font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                              {item.licenseType && <span className="inline-flex px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                              {item.purchaseNature && <span className="inline-flex px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">{item.purchaseNature === 'New' ? '新购' : item.purchaseNature === 'Renewal' ? '续费' : item.purchaseNature === 'AddOn' ? '增购' : item.purchaseNature === 'Upgrade' ? '升级' : item.purchaseNature}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center font-medium dark:text-white">x {item.quantity}</td>
                          <td className="px-5 py-4 text-center">
                            {item.licensePeriod && item.licensePeriod !== '永久'
                              ? <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span>
                              : <span className="text-gray-300 dark:text-gray-600">{item.licensePeriod === '永久' ? '永久' : '-'}</span>
                            }
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-sm text-gray-700 dark:text-gray-300">¥{item.priceAtPurchase.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right font-bold font-mono text-gray-900 dark:text-white">¥{itemAmount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="w-[220px] shrink-0 flex flex-col justify-center p-5 bg-gray-50/50 dark:bg-white/5 border-l border-gray-100 dark:border-white/10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400">产品总金额</span>
                    <span className="font-bold text-lg font-mono text-gray-900 dark:text-white">¥{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-white/10">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">订单应付</span>
                    <span className="font-bold text-xl font-mono text-red-600 dark:text-red-400">¥{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 基本信息 */}
            <SectionCard icon={<Layers className="w-5 h-5 text-purple-500" />} title="订单基本信息">
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                <InfoRow label="订单类型" value={buyerTypeLabels[buyerType] || buyerType || '-'} />
                <InfoRow label="订单来源" value={sourceLabels[orderSource] || orderSource} />
                <InfoRow label="制单人" value={creatorName} />
                {opportunityName && <InfoRow label="关联商机" value={opportunityName} />}
                {linkedContractNames && linkedContractNames.length > 0 && (
                  <InfoRow label="关联合同" value={linkedContractNames.join('、')} />
                )}
              </div>
            </SectionCard>

            {/* 客户信息 */}
            <SectionCard icon={<Building className="w-5 h-5 text-[#0071E3]" />} title="客户信息">
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                <InfoRow label="客户名称" value={customerName || '-'} />
                {channelName && <InfoRow label="渠道商" value={channelName} />}
                {salesRepName && <InfoRow label="销售负责人" value={salesRepName} />}
                {businessManagerName && <InfoRow label="商务负责人" value={businessManagerName} />}
                {sellerName && <InfoRow label="卖方名称" value={sellerName} />}
              </div>
              {(purchasingContactName || itContactName) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">订单联系人</div>
                  {purchasingContactName && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100/80 dark:border-blue-800/30">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{purchasingContactName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-gray-400">采购</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{purchasingContactName}</span>
                        </div>
                        {purchasingContactPhone && <div className="text-[10px] text-gray-500 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{purchasingContactPhone}</div>}
                      </div>
                    </div>
                  )}
                  {itContactName && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-purple-50/60 dark:bg-purple-900/10 border border-purple-100/80 dark:border-purple-800/30">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{itContactName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-gray-400">IT</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{itContactName}</span>
                        </div>
                        {itContactPhone && <div className="text-[10px] text-gray-500 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{itContactPhone}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* 订单备注 */}
            <SectionCard icon={<FileText className="w-4 h-4 text-amber-500" />} title="订单备注">
              {orderRemark ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{orderRemark}</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                  <FileText className="w-6 h-6 mb-1.5 opacity-50" />
                  <span className="text-xs">暂无备注</span>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 收货/交付信息 */}
            <SectionCard icon={<Truck className="w-5 h-5 text-red-500" />} title="收货与交付">
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                <InfoRow label="发货方式" value={deliveryLabels[deliveryMethod] || deliveryMethod} />
                {(deliveryMethod === 'Offline' || deliveryMethod === 'Hybrid') && (
                  <>
                    <InfoRow label="收货地址" value={shippingAddress} />
                    {shippingPhone && <InfoRow label="收货电话" value={shippingPhone} mono />}
                    {shippingEmail && <InfoRow label="收货邮箱" value={shippingEmail} mono />}
                  </>
                )}
                {(deliveryMethod === 'Online' || deliveryMethod === 'Hybrid') && onlineDeliveries && onlineDeliveries.length > 0 && (
                  <div className="py-3">
                    <span className="text-[13px] font-bold text-gray-400 block mb-2">线上交付条目</span>
                    <div className="space-y-2">
                      {onlineDeliveries.map((d, i) => (
                        <div key={d.id || i} className="flex items-center gap-3 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/60 dark:border-blue-800/30 text-xs">
                          <span className="font-bold text-gray-600 dark:text-gray-300">{d.receivingParty}</span>
                          {d.receivingCompany && <span className="text-gray-500">{d.receivingCompany}</span>}
                          {d.email && <span className="flex items-center gap-0.5 text-gray-500"><Mail className="w-3 h-3" />{d.email}</span>}
                          {d.phone && <span className="flex items-center gap-0.5 text-gray-500"><Phone className="w-3 h-3" />{d.phone}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 结算方式 */}
            <SectionCard icon={<Banknote className="w-5 h-5 text-emerald-500" />} title="结算方式">
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                <InfoRow label="结算方式" value={settlementMethod === 'cash' ? '现结销售' : settlementMethod === 'credit' ? '信用额度' : '未选择'} />
                {settlementMethod === 'credit' && (
                  <InfoRow label="付款方式" value={settlementType === 'installment' ? '分期付款' : '一次性付款'} />
                )}
                {settlementMethod === 'credit' && settlementType === 'once' && expectedPaymentDate && (
                  <InfoRow label="预计付款" value={expectedPaymentDate} mono />
                )}
                <InfoRow label="序列号策略" value={serialNumberRequirement} />
                {serialNumberRequirement !== '生成新序列号' && reuseSerialNumber && (
                  <InfoRow label="沿用序列号" value={reuseSerialNumber} mono />
                )}
              </div>
              {settlementMethod === 'credit' && settlementType === 'installment' && installmentPlans && installmentPlans.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">分期计划</div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/5">
                          <th className="px-3 py-2 font-bold text-gray-500 text-left">期数</th>
                          <th className="px-3 py-2 font-bold text-gray-500 text-right">金额</th>
                          <th className="px-3 py-2 font-bold text-gray-500 text-left">预计日期</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {installmentPlans.map((plan, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">第{idx + 1}期</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-gray-900 dark:text-white">¥{plan.amount.toLocaleString()}</td>
                            <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{plan.expectedDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 验收信息 */}
            <SectionCard icon={<ClipboardCheck className="w-5 h-5 text-teal-500" />} title="验收信息">
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {acceptanceForm.contactName && <InfoRow label="验收联系人" value={acceptanceForm.contactName} />}
                {acceptanceForm.contactPhone && <InfoRow label="联系电话" value={acceptanceForm.contactPhone} mono />}
                {acceptanceForm.email && <InfoRow label="联系邮箱" value={acceptanceForm.email} mono />}
                <InfoRow label="验收方式" value={acceptanceForm.method === 'Remote' ? '远程验收' : acceptanceForm.method === 'OnSite' ? '现场验收' : acceptanceForm.method || '-'} />
              </div>
              {productAcceptanceRows.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">产品验收计划</div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/5">
                          <th className="px-3 py-2 font-bold text-gray-500 text-left">产品</th>
                          <th className="px-3 py-2 font-bold text-gray-500">方式</th>
                          <th className="px-3 py-2 font-bold text-gray-500">条件</th>
                          <th className="px-3 py-2 font-bold text-gray-500 text-center">比例</th>
                          <th className="px-3 py-2 font-bold text-gray-500">预计日期</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {productAcceptanceRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{items[row.productIdx]?.productName || '-'}</td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.method}</td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{row.condition}</td>
                            <td className="px-3 py-2 text-center font-mono font-bold text-gray-900 dark:text-white">{row.percentage}%</td>
                            <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{row.expectedDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {!hasErrors && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold">信息校验通过</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition">
              返回修改
            </button>
            <button
              onClick={onConfirm}
              disabled={hasErrors || isSubmitting}
              className="px-8 py-2.5 bg-[#0071E3] dark:bg-[#FF2D55] text-white text-sm font-bold rounded-xl shadow-xl hover:scale-105 hover:shadow-blue-500/30 dark:hover:shadow-pink-500/30 transition disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isSubmitting ? '提交中...' : '确认提交'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default OrderConfirmModal;
