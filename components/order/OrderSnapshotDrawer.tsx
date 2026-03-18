import React from 'react';
import { Order, Customer } from '../../types';
import { X, Camera, FileText, Building, Package, AlertCircle, User as UserIcon, Briefcase } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  order: Order;
  statusMap: Record<string, string>;
  fullCustomer: Customer | undefined;
}

const OrderSnapshotDrawer: React.FC<Props> = ({ isOpen, isClosing, onClose, order, statusMap, fullCustomer }) => {
  if (!isOpen) return null;
  const selectedOrder = order;

  return (
        <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
            <div
              className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
              onClick={onClose}
            />
            <div className={`relative w-full max-w-2xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-500" /> 订单快照
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 订单基础信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">订单基础信息</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: '订单编号', value: selectedOrder.id, mono: true },
                      { label: '下单时间', value: new Date(selectedOrder.date).toLocaleString(), mono: true },
                      { label: '订单总额', value: `¥${selectedOrder.total.toLocaleString()}`, className: 'text-red-600 dark:text-red-400' },
                      { label: '当前状态', value: statusMap[selectedOrder.status], className: 'text-blue-600 dark:text-blue-400' },
                    ].map(field => (
                      <div key={field.label} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">{field.label}</div>
                        <div className={`text-sm font-bold text-gray-900 dark:text-white ${field.mono ? 'font-mono' : ''} ${field.className || ''}`}>{field.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">销售负责人</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.salesRepName || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">商务经理</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedOrder.businessManagerName || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 客户信息 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">客户信息快照</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '客户名称', value: selectedOrder.customerName },
                      { label: '联系人',   value: fullCustomer?.contacts?.[0]?.name || '-' },
                      { label: '联系电话', value: fullCustomer?.contacts?.[0]?.phone || '-', mono: true },
                      { label: '收货地址', value: selectedOrder.shippingAddress || '无地址信息' },
                    ].map(field => (
                      <div key={field.label} className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{field.label}</span>
                        <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 ${field.mono ? 'font-mono' : ''}`}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 产品明细 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">产品明细快照</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5 text-left">产品</th>
                          <th className="px-4 py-2.5 text-center">数量</th>
                          <th className="px-4 py-2.5 text-right">单价</th>
                          <th className="px-4 py-2.5 text-right">小计</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">{item.productName}</div>
                              <div className="text-gray-400 font-mono mt-0.5">{item.skuName}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">×{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400">¥{item.priceAtPurchase.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/50 dark:bg-white/5">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-gray-500">合计应收金额</td>
                          <td className="px-4 py-3 text-right text-base font-bold text-red-600 dark:text-red-400 font-mono">¥{selectedOrder.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 说明 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <p className="font-bold mb-1">快照说明</p>
                    <p>订单快照展示的是订单创建时的原始信息，在订单生效后通常不可变更，用于作为合同执行和财务结算的原始依据。如需修改交付地址或物流信息，请前往「订单交付」页签操作。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>

  );
};

export default OrderSnapshotDrawer;
