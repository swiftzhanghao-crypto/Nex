import React from 'react';
import { Key, Check, Banknote, CreditCard, Calendar, Plus, X, ClipboardCheck, Truck, Mail, MapPin, Layers } from 'lucide-react';
import { FieldError } from './ValidationFeedback';
import { generateId, memoWithIgnoreCallbacks } from './wizardUtils';
import type {
  AcceptanceInfo, AcceptanceType, DeliveryMethod, InvoiceInfo,
  OnlineDeliveryEntry, OrderItem, PaymentMethod,
} from '../../../types';

type InstallmentPlan = { amount: number; expectedDate: string; actualDate: string; paidAmount: number };
type PhaseDraft = { name: string; percentage: number };
type ProductAcceptanceRow = {
  productIdx: number;
  method: '一次性验收' | '分期验收';
  condition: string;
  expectedDate: string;
  percentage: number;
  content?: string;
};

export interface Step4CommerceDeliveryProps {
  acceptanceForm: AcceptanceInfo;
  acceptanceType: AcceptanceType;
  calculateNewOrderTotal: () => number;
  deliveryMethod: DeliveryMethod;
  expectedPaymentDate: string;
  getVisibleFieldError: (field: string) => string | undefined;
  installmentPlans: InstallmentPlan[];
  invoiceForm: InvoiceInfo;
  markFieldTouched: (field: string) => void;
  newOrderItems: OrderItem[];
  onlineDeliveries: OnlineDeliveryEntry[];
  paymentMethod: PaymentMethod;
  paymentTerms: string;
  phaseDrafts: PhaseDraft[];
  productAcceptanceRows: ProductAcceptanceRow[];
  receivingCompany: string;
  receivingMethod: string;
  receivingParty: string;
  reuseSerialNumber: string;
  serialNumberRequirement: '生成新序列号' | '沿用正式序列号' | '沿用测试序列号';
  setAcceptanceForm: React.Dispatch< React.SetStateAction<AcceptanceInfo>>;
  setAcceptanceType: React.Dispatch<React.SetStateAction<AcceptanceType>>;
  setDeliveryMethod: React.Dispatch<React.SetStateAction<DeliveryMethod>>;
  setExpectedPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  setInstallmentPlans: React.Dispatch<React.SetStateAction<InstallmentPlan[]>>;
  setInvoiceForm: React.Dispatch<React.SetStateAction<InvoiceInfo>>;
  setOnlineDeliveries: React.Dispatch<React.SetStateAction<OnlineDeliveryEntry[]>>;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  setPaymentTerms: React.Dispatch<React.SetStateAction<string>>;
  setPhaseDrafts: React.Dispatch<React.SetStateAction<PhaseDraft[]>>;
  setProductAcceptanceRows: React.Dispatch<React.SetStateAction<ProductAcceptanceRow[]>>;
  setReceivingCompany: React.Dispatch<React.SetStateAction<string>>;
  setReceivingMethod: React.Dispatch<React.SetStateAction<string>>;
  setReceivingParty: React.Dispatch<React.SetStateAction<string>>;
  setReuseSerialNumber: React.Dispatch<React.SetStateAction<string>>;
  setSerialNumberRequirement: React.Dispatch<React.SetStateAction<'生成新序列号' | '沿用正式序列号' | '沿用测试序列号'>>;
  setSettlementMethod: React.Dispatch<React.SetStateAction<'cash' | 'credit' | ''>>;
  setSettlementType: React.Dispatch<React.SetStateAction<'once' | 'installment'>>;
  setShippingAddress: React.Dispatch<React.SetStateAction<string>>;
  setShippingEmail: React.Dispatch<React.SetStateAction<string>>;
  setShippingPhone: React.Dispatch<React.SetStateAction<string>>;
  settlementMethod: 'cash' | 'credit' | '';
  settlementType: 'once' | 'installment';
  shippingAddress: string;
  shippingEmail: string;
  shippingPhone: string;
}

const Step4CommerceDelivery: React.FC<Step4CommerceDeliveryProps> = ({
  acceptanceForm,
  acceptanceType,
  calculateNewOrderTotal,
  deliveryMethod,
  expectedPaymentDate,
  getVisibleFieldError,
  installmentPlans,
  invoiceForm,
  markFieldTouched,
  newOrderItems,
  onlineDeliveries,
  paymentMethod,
  paymentTerms,
  phaseDrafts,
  productAcceptanceRows,
  receivingCompany,
  receivingMethod,
  receivingParty,
  reuseSerialNumber,
  serialNumberRequirement,
  setAcceptanceForm,
  setAcceptanceType,
  setDeliveryMethod,
  setExpectedPaymentDate,
  setInstallmentPlans,
  setInvoiceForm,
  setOnlineDeliveries,
  setPaymentMethod,
  setPaymentTerms,
  setPhaseDrafts,
  setProductAcceptanceRows,
  setReceivingCompany,
  setReceivingMethod,
  setReceivingParty,
  setReuseSerialNumber,
  setSerialNumberRequirement,
  setSettlementMethod,
  setSettlementType,
  setShippingAddress,
  setShippingEmail,
  setShippingPhone,
  settlementMethod,
  settlementType,
  shippingAddress,
  shippingEmail,
  shippingPhone,
}) => {
  return (
                    <div className="space-y-2.5 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Key className="w-4 h-4 text-amber-500"/> 序列号需求</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['生成新序列号', '沿用正式序列号', '沿用测试序列号'] as const).map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setSerialNumberRequirement(opt); if (opt === '生成新序列号') setReuseSerialNumber(''); }}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                                serialNumberRequirement === opt
                                                    ? 'border-amber-500 dark:border-amber-400 bg-amber-50/60 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                                            }`}
                                        >
                                            {serialNumberRequirement === opt && <Check className="w-4 h-4 shrink-0" />}
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {serialNumberRequirement !== '生成新序列号' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <Key className="w-3 h-3"/> 请输入沿用的序列号（20位）
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={20}
                                            value={reuseSerialNumber}
                                            onChange={e => setReuseSerialNumber(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                                            className={`w-full p-3 bg-white dark:bg-[#1C1C1E] border rounded-xl text-sm outline-none dark:text-white font-mono tracking-widest focus:ring-2 transition ${
                                                reuseSerialNumber.length === 20
                                                    ? 'border-green-300 dark:border-green-700 focus:ring-green-500/20'
                                                    : reuseSerialNumber.length > 0
                                                        ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500/20'
                                                        : 'border-gray-200 dark:border-white/10 focus:ring-blue-500/20'
                                            }`}
                                            placeholder="例如：A1B2C3D4E5F6G7H8I9J0"
                                        />
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className={`font-bold ${reuseSerialNumber.length === 20 ? 'text-green-600' : reuseSerialNumber.length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                                                {reuseSerialNumber.length}/20 位
                                                {reuseSerialNumber.length === 20 && ' ✓'}
                                            </span>
                                            <span className="text-gray-400">仅支持字母和数字</span>
                                        </div>
                                        <FieldError error={getVisibleFieldError('reuseSerialNumber')} />
                                    </div>
                                )}
                            </div>

                            {/* 结算方式 */}
                            <div className={`bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border shadow-apple space-y-4 ${getVisibleFieldError('settlementMethod') ? 'border-red-300 dark:border-red-800' : 'border-gray-100 dark:border-white/5'}`}>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-500"/> 结算方式 <span className="text-red-500 text-sm">*</span></h4>
                                    {getVisibleFieldError('settlementMethod') && <span className="text-xs text-red-500 font-medium">{getVisibleFieldError('settlementMethod')}</span>}
                                </div>

                                {/* 第一层：现结销售 vs 信用额度 */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setSettlementMethod('cash'); setSettlementType('once'); setInstallmentPlans([]); setExpectedPaymentDate(''); }}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                            settlementMethod === 'cash'
                                                ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settlementMethod === 'cash' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                            <Banknote className="w-4 h-4"/>
                                        </div>
                                        <div className="text-left">
                                            <div className={`text-sm font-bold ${settlementMethod === 'cash' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-300'}`}>现结销售</div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">款到发货，一次性结清</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setSettlementMethod('credit'); setSettlementType('once'); setInstallmentPlans([]); }}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                            settlementMethod === 'credit'
                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50/60 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settlementMethod === 'credit' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                            <CreditCard className="w-4 h-4"/>
                                        </div>
                                        <div className="text-left">
                                            <div className={`text-sm font-bold ${settlementMethod === 'credit' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>信用额度</div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">先货后款，支持分期</div>
                                        </div>
                                    </button>
                                </div>

                                {/* 现结销售提示 */}
                                {settlementMethod === 'cash' && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-xs text-emerald-600 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 leading-relaxed flex items-center gap-2">
                                        <Check className="w-4 h-4 shrink-0"/>
                                        <span>现结销售：订单全部款项将在发货前一次性结清，无需分期。</span>
                                    </div>
                                )}

                                {/* 信用额度：第二层 - 一次性付款 vs 分期付款 */}
                                {settlementMethod === 'credit' && (
                                    <div className="space-y-4">
                                        <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                            <button
                                                onClick={() => { setSettlementType('once'); setInstallmentPlans([]); }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'once' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                            >
                                                一次性付款
                                            </button>
                                            <button
                                                onClick={() => { setSettlementType('installment'); setExpectedPaymentDate(''); if (installmentPlans.length < 2) { const total = calculateNewOrderTotal(); const half = Math.round(total / 2 * 100) / 100; setInstallmentPlans([{ amount: half, expectedDate: '', actualDate: '', paidAmount: 0 }, { amount: Math.round((total - half) * 100) / 100, expectedDate: '', actualDate: '', paidAmount: 0 }]); } }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${settlementType === 'installment' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                            >
                                                分期付款
                                            </button>
                                        </div>

                                        {/* 一次性付款：填写预计付款时间 */}
                                        {settlementType === 'once' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500">预计付款时间</label>
                                                <input
                                                    type="date"
                                                    value={expectedPaymentDate}
                                                    onChange={e => setExpectedPaymentDate(e.target.value)}
                                                    className="w-full md:w-64 p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition text-sm"
                                                />
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">信用额度模式下，全部款项将在上述日期前一次性付清。</p>
                                            </div>
                                        )}

                                        {/* 分期付款：填写每期金额与预计付款时间 */}
                                        {settlementType === 'installment' && (
                                            <div className="space-y-3">
                                                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
                                                    <table className="w-full text-left text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">分期计划</th>
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">分期金额</th>
                                                                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 whitespace-nowrap">预计付款时间</th>
                                                                <th className="px-4 py-2.5 w-10"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                            {installmentPlans.map((plan, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/3">
                                                                    <td className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">第{idx + 1}期</td>
                                                                    <td className="px-4 py-2.5">
                                                                        <input
                                                                            type="number"
                                                                            value={plan.amount || ''}
                                                                            onChange={e => { const next = [...installmentPlans]; next[idx] = { ...next[idx], amount: Number(e.target.value) }; setInstallmentPlans(next); }}
                                                                            className="w-28 p-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 text-right font-mono"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        <input
                                                                            type="date"
                                                                            value={plan.expectedDate}
                                                                            onChange={e => { const next = [...installmentPlans]; next[idx] = { ...next[idx], expectedDate: e.target.value }; setInstallmentPlans(next); }}
                                                                            className="w-36 p-1.5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        {installmentPlans.length > 2 && (
                                                                            <button onClick={() => setInstallmentPlans(installmentPlans.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1 transition"><X className="w-3.5 h-3.5"/></button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => setInstallmentPlans([...installmentPlans, { amount: 0, expectedDate: '', actualDate: '', paidAmount: 0 }])}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition"
                                                    >
                                                        <Plus className="w-3.5 h-3.5"/> 添加分期
                                                    </button>
                                                    <div className="text-xs text-gray-500">
                                                        分期合计：<span className={`font-bold font-mono ${Math.abs(installmentPlans.reduce((s, p) => s + p.amount, 0) - calculateNewOrderTotal()) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>¥{installmentPlans.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
                                                        <span className="mx-1.5">/</span>
                                                        订单总额：<span className="font-bold font-mono text-gray-700 dark:text-gray-300">¥{calculateNewOrderTotal().toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <FieldError error={getVisibleFieldError('installmentPlans') || getVisibleFieldError('installmentPlansTotal')} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-[#2C2C2E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500"/> 收货信息</h4>

                                {/* 发货方式切换 */}
                                <div className="flex bg-gray-100 dark:bg-white/10 p-1.5 rounded-xl">
                                    <button
                                        onClick={() => setDeliveryMethod('Online')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Online' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Mail className="w-3.5 h-3.5"/> 线上发货
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('Offline')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Offline' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Truck className="w-3.5 h-3.5"/> 线下发货
                                    </button>
                                    <button
                                        onClick={() => setDeliveryMethod('Hybrid')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${deliveryMethod === 'Hybrid' ? 'bg-white dark:bg-[#2C2C2E] shadow text-[#0071E3] dark:text-white' : 'text-gray-500'}`}
                                    >
                                        <Layers className="w-3.5 h-3.5"/> 混合发货
                                    </button>
                                </div>

                                {/* 线上发货 - 多条记录 */}
                                {(deliveryMethod === 'Online' || deliveryMethod === 'Hybrid') && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3"/> 线上发货信息</span>
                                            <span className="text-[10px] text-gray-400">{onlineDeliveries.length} 条记录</span>
                                        </div>
                                        <div className="space-y-2">
                                            {onlineDeliveries.map((entry, idx) => (
                                                <div key={entry.id} className="relative p-4 bg-blue-50/40 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-blue-500">#{idx + 1}</span>
                                                        {onlineDeliveries.length > 1 && (
                                                            <button onClick={() => setOnlineDeliveries(onlineDeliveries.filter(e => e.id !== entry.id))} className="text-gray-400 hover:text-red-500 p-0.5 transition"><X className="w-3.5 h-3.5"/></button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货方</label>
                                                            <select
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.receivingParty}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], receivingParty: e.target.value }; setOnlineDeliveries(next); }}
                                                            >
                                                                <option value="买方">买方</option>
                                                                <option value="代理商">代理商</option>
                                                                <option value="最终用户">最终用户</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货单位名称</label>
                                                            <input
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.receivingCompany}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], receivingCompany: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="收货单位全称..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货邮箱 <span className="text-red-400">*</span></label>
                                                            <input
                                                                type="email"
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.email}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], email: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="接收开通通知的邮箱..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">联系电话</label>
                                                            <input
                                                                type="tel"
                                                                className="w-full p-2 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                                value={entry.phone || ''}
                                                                onChange={e => { const next = [...onlineDeliveries]; next[idx] = { ...next[idx], phone: e.target.value }; setOnlineDeliveries(next); }}
                                                                placeholder="联系电话..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setOnlineDeliveries([...onlineDeliveries, { id: generateId(), receivingParty: '买方', receivingCompany: '', email: '', phone: '' }])}
                                            className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition"
                                        >
                                            <Plus className="w-3.5 h-3.5"/> 添加线上发货记录
                                        </button>
                                    </div>
                                )}

                                {/* 线下发货 - 单条收货信息 */}
                                {(deliveryMethod === 'Offline' || deliveryMethod === 'Hybrid') && (
                                    <div className="space-y-3">
                                        {deliveryMethod === 'Hybrid' && (
                                            <span className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1"><Truck className="w-3 h-3"/> 线下发货信息</span>
                                        )}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货方</label>
                                            <select
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingParty}
                                                onChange={e => setReceivingParty(e.target.value)}
                                            >
                                                <option value="买方">买方</option>
                                                <option value="代理商">代理商</option>
                                                <option value="最终用户">最终用户</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货单位名称</label>
                                            <input
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                value={receivingCompany}
                                                onChange={e => setReceivingCompany(e.target.value)}
                                                placeholder="请输入收货单位全称..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 block mb-1">联系电话</label>
                                                <input
                                                    type="tel"
                                                    className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={shippingPhone}
                                                    onChange={e => setShippingPhone(e.target.value)}
                                                    placeholder="请输入收货联系电话..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 block mb-1">联系邮箱</label>
                                                <input
                                                    type="email"
                                                    className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={shippingEmail}
                                                    onChange={e => setShippingEmail(e.target.value)}
                                                    placeholder="请输入收货联系邮箱..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 block mb-1">收货地址</label>
                                            <textarea
                                                className="w-full p-3 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                                                value={shippingAddress}
                                                onChange={e => setShippingAddress(e.target.value)}
                                                placeholder="请输入详细收货地址..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* 验收计划 - 整行展示 */}
                    <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 shadow-apple overflow-hidden">
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-green-500"/> 验收计划</h4>
                            {newOrderItems.length > 0 && (
                                <div className="relative group/add-accept">
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
                                        <Plus className="w-3.5 h-3.5"/> 添加验收条目
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-1 z-20 min-w-[200px] opacity-0 invisible group-hover/add-accept:opacity-100 group-hover/add-accept:visible transition-all">
                                        {newOrderItems.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    const existingRows = productAcceptanceRows.filter(r => r.productIdx === idx);
                                                    const totalPct = existingRows.reduce((s, r) => s + r.percentage, 0);
                                                    setProductAcceptanceRows(prev => [...prev, {
                                                        productIdx: idx,
                                                        method: '分期验收' as const,
                                                        condition: '视同验收',
                                                        expectedDate: '',
                                                        percentage: Math.max(0, 100 - totalPct),
                                                        content: '',
                                                    }]);
                                                    if (existingRows.length === 1 && existingRows[0].method === '一次性验收') {
                                                        setProductAcceptanceRows(prev => prev.map(r =>
                                                            r.productIdx === idx ? { ...r, method: '分期验收' as const } : r
                                                        ));
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2"
                                            >
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-50 dark:bg-green-900/20 text-[10px] font-bold text-green-600 dark:text-green-400">{idx + 1}</span>
                                                <span className="truncate">{item.productName}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {newOrderItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="unified-table-header">
                                        <tr>
                                            <th className="px-4 py-3 pl-5 text-center w-16">明细编号</th>
                                            <th className="px-4 py-3">产品名称</th>
                                            <th className="px-4 py-3 text-center w-16">验收期数</th>
                                            <th className="px-4 py-3">验收方式</th>
                                            <th className="px-4 py-3">验收内容</th>
                                            <th className="px-4 py-3">验收条件</th>
                                            <th className="px-4 py-3">预计验收时间</th>
                                            <th className="px-4 py-3 text-center">验收比例</th>
                                            <th className="px-4 py-3 text-right">验收金额</th>
                                            <th className="px-4 py-3 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {newOrderItems.map((item, itemIdx) => {
                                            const rows = productAcceptanceRows.filter(r => r.productIdx === itemIdx);
                                            const itemAmount = item.priceAtPurchase * item.quantity;
                                            return rows.map((row, rowIdx) => {
                                                const globalIdx = productAcceptanceRows.indexOf(row);
                                                const isFirst = rowIdx === 0;
                                                const rowAmount = Math.round(itemAmount * row.percentage / 100 * 100) / 100;
                                                return (
                                                    <tr key={`${itemIdx}-${rowIdx}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        {isFirst && (
                                                            <td className="px-4 py-3 pl-5 text-center align-top" rowSpan={rows.length}>
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 text-xs font-bold font-mono text-green-600 dark:text-green-400">{itemIdx + 1}</span>
                                                            </td>
                                                        )}
                                                        {isFirst && (
                                                            <td className="px-4 py-3 align-top" rowSpan={rows.length}>
                                                                <div className="font-bold text-gray-900 dark:text-white text-sm">{item.productName}</div>
                                                                {item.skuName && <div className="text-xs text-gray-500 mt-0.5">{item.skuName}</div>}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 dark:bg-white/10 text-xs font-bold font-mono text-gray-600 dark:text-gray-300">{rowIdx + 1}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.method} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                const newMethod = e.target.value as '一次性验收' | '分期验收';
                                                                next[globalIdx] = { ...next[globalIdx], method: newMethod };
                                                                if (newMethod === '一次性验收') {
                                                                    const filtered = next.filter(r => !(r.productIdx === itemIdx && next.indexOf(r) !== globalIdx));
                                                                    filtered[filtered.indexOf(next[globalIdx])] = { ...next[globalIdx], percentage: 100 };
                                                                    setProductAcceptanceRows(filtered);
                                                                } else {
                                                                    setProductAcceptanceRows(next);
                                                                }
                                                            }} className="text-xs font-medium border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition cursor-pointer">
                                                                <option value="一次性验收">一次性验收</option>
                                                                <option value="分期验收">分期验收</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input type="text" value={row.content || ''} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                next[globalIdx] = { ...next[globalIdx], content: e.target.value };
                                                                setProductAcceptanceRows(next);
                                                            }} placeholder="请输入验收内容" className="text-xs border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition w-full min-w-[120px]"/>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select value={row.condition} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                next[globalIdx] = { ...next[globalIdx], condition: e.target.value };
                                                                setProductAcceptanceRows(next);
                                                            }} className="text-xs font-medium border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition cursor-pointer">
                                                                <option value="视同验收">视同验收</option>
                                                                <option value="签字验收">签字验收</option>
                                                                <option value="系统验收">系统验收</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input type="date" value={row.expectedDate} onChange={e => {
                                                                const next = [...productAcceptanceRows];
                                                                next[globalIdx] = { ...next[globalIdx], expectedDate: e.target.value };
                                                                setProductAcceptanceRows(next);
                                                            }} className="text-xs border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition w-32"/>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                <input type="number" min={0} max={100} value={row.percentage} onChange={e => {
                                                                    const next = [...productAcceptanceRows];
                                                                    next[globalIdx] = { ...next[globalIdx], percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) };
                                                                    setProductAcceptanceRows(next);
                                                                }} className="w-14 text-center text-xs font-mono border border-gray-200 dark:border-white/10 rounded-lg px-1 py-1.5 bg-white dark:bg-black/30 dark:text-white outline-none focus:border-[#0071E3] transition"/>
                                                                <span className="text-xs text-gray-400">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white text-xs">¥{rowAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {rows.length > 1 ? (
                                                                <button onClick={() => {
                                                                    setProductAcceptanceRows(prev => {
                                                                        const next = prev.filter((_, i) => i !== globalIdx);
                                                                        const remaining = next.filter(r => r.productIdx === itemIdx);
                                                                        if (remaining.length === 1) {
                                                                            return next.map(r => r.productIdx === itemIdx ? { ...r, method: '一次性验收' as const, percentage: 100 } : r);
                                                                        }
                                                                        return next;
                                                                    });
                                                                }} className="text-gray-400 hover:text-red-500 p-0.5 transition" title="删除此验收条目"><X className="w-3.5 h-3.5"/></button>
                                                            ) : null}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </tbody>
                                </table>
                                <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">快速添加：</span>
                                    {newOrderItems.map((item, idx) => {
                                        const rows = productAcceptanceRows.filter(r => r.productIdx === idx);
                                        const totalPct = rows.reduce((s, r) => s + r.percentage, 0);
                                        return (
                                            <button key={idx} onClick={() => {
                                                setProductAcceptanceRows(prev => {
                                                    const next = [...prev, { productIdx: idx, method: '分期验收' as const, condition: '视同验收', expectedDate: '', percentage: Math.max(0, 100 - totalPct), content: '' }];
                                                    return next.map(r => r.productIdx === idx ? { ...r, method: '分期验收' as const } : r);
                                                });
                                            }} className="flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                                                <Plus className="w-3 h-3"/> {item.productName}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="px-5 pb-4 pt-1">
                                <div className="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600">
                                    <ClipboardCheck className="w-8 h-8 mb-2 opacity-50"/>
                                    <p className="text-sm font-medium">请先添加产品后配置验收计划</p>
                                </div>
                            </div>
                        )}
                    </div>
                    </div>
  );
};

export default memoWithIgnoreCallbacks(Step4CommerceDelivery);
