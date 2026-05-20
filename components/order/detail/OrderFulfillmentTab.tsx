import React from 'react';
import { Package, Hash, Award } from 'lucide-react';
import type { Order, OrderItem } from '../../../types';
import { EmptyState } from './EmptyState';

export type OrderFulfillmentTabProps = {
    selectedOrder: Order;
    hasPermission: (perm: string) => boolean;
    onPreviewCertificate: (item: OrderItem) => void;
};

export const OrderFulfillmentTab: React.FC<OrderFulfillmentTabProps> = ({
    selectedOrder,
    hasPermission,
    onPreviewCertificate,
}) => (
<div className="space-y-2.5">
          {/* 订单交付列表 */}
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">订单交付列表</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                      <thead className="unified-table-header">
                          <tr>
                              <th className="px-5 py-4 pl-6 whitespace-nowrap">交付编号</th>
                              <th className="px-5 py-4 text-center whitespace-nowrap">购买数量</th>
                              <th className="px-5 py-4 whitespace-nowrap">被授权方</th>
                              <th className="px-5 py-4 whitespace-nowrap">客户名称/编号</th>
                              <th className="px-5 py-4 whitespace-nowrap">授权类型</th>
                              <th className="px-5 py-4 whitespace-nowrap">产品名称</th>
                              <th className="px-5 py-4 whitespace-nowrap">电子授权</th>
                              {(hasPermission('order_delivery_auth_change') || hasPermission('order_delivery_redelivery')) && (
                              <th className="px-5 py-4 text-right pr-6 whitespace-nowrap">操作</th>
                              )}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {selectedOrder.items.map((item, idx) => {
                              const deliveryNo = `JF${selectedOrder.id.replace(/[^0-9]/g, '').padStart(5, '0')}${String(idx + 1).padStart(3, '0')}`;
                              const productCode = `AB${String(item.productId).replace(/[^0-9]/g, '').padStart(7, '0')}`;
                              return (
                              <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-5 py-5 pl-6">
                                      <span className="font-mono font-bold text-[#0071E3] dark:text-[#0A84FF]">{deliveryNo}</span>
                                  </td>
                                  <td className="px-5 py-5 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</td>
                                  <td className="px-5 py-5 text-gray-700 dark:text-gray-300">{selectedOrder.customerName}</td>
                                  <td className="px-5 py-5">
                                      <div className="text-gray-900 dark:text-white font-medium">{selectedOrder.customerName}</div>
                                      <div className="text-xs text-gray-400 mt-0.5 font-mono">C-{selectedOrder.id.replace(/[^0-9]/g, '').padStart(8, '0')}</div>
                                  </td>
                                  <td className="px-5 py-5 text-gray-700 dark:text-gray-300">{item.licenseType || '-'}</td>
                                  <td className="px-5 py-5">
                                      <div className="text-gray-900 dark:text-white font-medium">{item.productName}</div>
                                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{productCode}</div>
                                  </td>
                                  <td className="px-5 py-5">
                                      {selectedOrder.isPaid && selectedOrder.confirmedDate && (
                                          <button
                                            onClick={() => { onPreviewCertificate(item); }}
                                            className="text-xs font-bold text-[#0071E3] hover:text-blue-700 dark:text-[#0A84FF] hover:underline flex items-center gap-1"
                                          >
                                              <Award className="w-3.5 h-3.5"/> 电子授权
                                          </button>
                                      )}
                                  </td>
                                  {(hasPermission('order_delivery_auth_change') || hasPermission('order_delivery_redelivery')) && (
                                  <td className="px-5 py-5 text-right pr-6">
                                      <div className="flex items-center justify-end gap-3">
                                          {hasPermission('order_delivery_auth_change') && (
                                          <button className="text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline whitespace-nowrap">授权信息变更</button>
                                          )}
                                          {hasPermission('order_delivery_redelivery') && (
                                          <button className="text-xs font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline whitespace-nowrap">二次交付申请</button>
                                          )}
                                      </div>
                                  </td>
                                  )}
                              </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* 序列号信息 */}
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">序列号信息</h3>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-mono">共 {selectedOrder.serialNumbers?.length || 0} 条</span>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[900px]">
                      <thead className="unified-table-header">
                          <tr>
                              <th className="px-5 py-4 pl-6 whitespace-nowrap">序列号</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号来源</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号生成方式</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号生成明组</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号类型</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号状态</th>
                              <th className="px-5 py-4 whitespace-nowrap">序列号生成时间</th>
                              <th className="px-5 py-4 pr-6 whitespace-nowrap">序列号截止时间</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {selectedOrder.serialNumbers && selectedOrder.serialNumbers.length > 0 ? selectedOrder.serialNumbers.map((sn, idx) => (
                              <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-5 py-4 pl-6">
                                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{sn.serialNo}</span>
                                  </td>
                                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{sn.source}</td>
                                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{sn.generateMethod}</td>
                                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{sn.generateGroup}</td>
                                  <td className="px-5 py-4">
                                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                                          sn.type === '正式' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30'
                                          : sn.type === '试用' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'
                                          : 'bg-gray-50 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700/30'
                                      }`}>{sn.type}</span>
                                  </td>
                                  <td className="px-5 py-4">
                                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                                          sn.status === '已生效' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/30'
                                          : sn.status === '待生效' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800/30'
                                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/30'
                                      }`}>{sn.status}</span>
                                  </td>
                                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">{sn.generateTime}</td>
                                  <td className="px-5 py-4 pr-6 text-gray-600 dark:text-gray-300 font-mono text-xs">{sn.expireTime}</td>
                              </tr>
                          )) : (
                              <tr>
                                  <td colSpan={8}><EmptyState icon={<Hash className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="暂无序列号数据" /></td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
          </div>
);
