import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Briefcase, Target, Building, Users, FileText, Phone, Mail,
    Scroll, History, Plus, Eye, Banknote, ClipboardCheck,
} from 'lucide-react';
import type { Order, Product, Customer, Contract, Opportunity, LinkedService } from '../../../types';
import { EmptyState } from './EmptyState';
import type { ServiceDetailItem } from './types';

export type OrderManagementTabProps = {
    selectedOrder: Order;
    products: Product[];
    customers: Customer[];
    contracts: Contract[];
    opportunities: Opportunity[];
    hasPermission: (perm: string) => boolean;
    onOpenItemDetails: (item: Order['items'][number], index: number, tab: 'INFO' | 'SUBUNIT') => void;
    onOpenServiceDetail: (item: ServiceDetailItem) => void;
    onOpenContractPicker: () => void;
    onPreviewContract: (contractId: string) => void;
};

export const OrderManagementTab: React.FC<OrderManagementTabProps> = ({
    selectedOrder,
    products,
    customers,
    contracts,
    opportunities,
    hasPermission,
    onOpenItemDetails,
    onOpenServiceDetail,
    onOpenContractPicker,
    onPreviewContract,
}) => {
    const navigate = useNavigate();
    return (
      <>
      {/* Order Items Table + Summary Side-by-Side */}
          {hasPermission('order_detail_product') && (
          <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
              <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">订单产品明细</h3>
              </div>
              {(
              <div className="flex items-stretch">
                  <div className="flex-1 min-w-0 overflow-x-auto border-r border-gray-100 dark:border-white/10">
                      <table className="w-full text-left min-w-[520px]">
                          <thead className="unified-table-header">
                              <tr>
                                  <th className="px-5 py-4 pl-6 text-center w-16 whitespace-nowrap">明细编号</th>
                                  <th className="px-5 py-4">产品信息</th>
                                  <th className="px-5 py-4">下级单位授权</th>
                                  <th className="px-5 py-4 text-center">数量</th>
                                  <th className="px-5 py-4 text-center">授权/服务期限</th>
                                  <th className="px-5 py-4 text-right">单价</th>
                                  <th className="px-5 py-4 text-right">产品金额</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {selectedOrder.items.map((item, idx) => {
                                  const lineNo = String(idx + 1).padStart(3, '0');
                                  const itemAmount = item.priceAtPurchase * item.quantity;
                                  return (
                                  <tr
                                    key={idx}
                                    className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                      <td className="px-5 py-5 pl-6 text-center">
                                          <button
                                              onClick={() => { onOpenItemDetails(item, idx, 'INFO'); }}
                                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF] transition-all"
                                          >
                                              {lineNo}
                                          </button>
                                      </td>
                                      <td className="px-5 py-5">
                                          <button
                                            onClick={() => navigate(`/catalog/${item.productId}/preview`)}
                                            className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline text-left text-sm"
                                          >
                                              {item.productName}
                                          </button>
                                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                              {item.skuName && <span className="inline-flex px-2 py-0.5 text-xs font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                                              {item.licenseType && <span className="inline-flex px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                                          </div>
                                      </td>
                                      <td className="px-5 py-5">
                                          {item.subUnitAuthMode && item.subUnitAuthMode !== 'none' && item.subUnits && item.subUnits.length > 0 ? (
                                              <button
                                                  onClick={() => { onOpenItemDetails(item, idx, 'SUBUNIT'); }}
                                                  className="flex items-center gap-1.5 cursor-pointer group/sub"
                                              >
                                                  <span className="inline-flex flex-col px-2 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-left leading-relaxed group-hover/sub:bg-indigo-100 dark:group-hover/sub:bg-indigo-900/40 transition-colors">
                                                      {item.subUnitAuthMode === 'separate_auth_separate_eid' ? <><span>授权分别呈现</span><span>企业ID分别管理</span></>
                                                        : item.subUnitAuthMode === 'separate_auth_unified_eid' ? <><span>授权分别呈现</span><span>企业ID统一管理</span></>
                                                        : item.subUnitAuthMode === 'unified_auth_with_list' ? <><span>授权和企业ID统一管理</span><span>并提供下级清单</span></>
                                                        : item.subUnitAuthMode}
                                                  </span>
                                                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-full shrink-0 group-hover/sub:bg-purple-100 dark:group-hover/sub:bg-purple-900/40 transition-colors" title="下级单位数量">{item.subUnits.length}</span>
                                              </button>
                                          ) : (
                                              <span className="text-gray-300 dark:text-gray-600">-</span>
                                          )}
                                      </td>
                                      <td className="px-5 py-5 text-center dark:text-white font-medium">x {item.quantity}</td>
                                      <td className="px-5 py-5 text-center">
                                          {item.licensePeriod && item.licensePeriod !== '永久'
                                              ? <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{item.licensePeriod}</span>
                                              : <span className="text-gray-300 dark:text-gray-600">-</span>
                                          }
                                      </td>
                                      <td className="px-5 py-5 text-right font-mono text-sm text-gray-700 dark:text-gray-300">¥{item.priceAtPurchase.toLocaleString()}</td>
                                      <td className="px-5 py-5 text-right font-bold font-mono text-gray-900 dark:text-white">¥{itemAmount.toLocaleString()}</td>
                                  </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  <div className="w-[27%] shrink-0 flex flex-col justify-between p-6 bg-gray-50/50 dark:bg-white/5">
                      {(() => {
                          const productTotal = selectedOrder.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
                          const discountAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 1000 ? Math.floor(lineTotal * 0.05 / 10) * 10 : 0);
                          }, 0);
                          const rebateAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 5000 ? Math.floor(lineTotal * 0.02 / 10) * 10 : 0);
                          }, 0);
                          const convDeductAmt = selectedOrder.conversionDeductionAmount ?? 0;
                          const totalDiscount = discountAmt + rebateAmt + convDeductAmt;
                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                          return (
                      <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                              <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">产品总金额</span>
                              <span className="font-bold text-xl font-mono text-gray-900 dark:text-white">{fmt(productTotal)}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-3">
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">优惠折扣金额</span>
                                  <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">{fmt(discountAmt)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">返利折扣金额</span>
                                  <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">{fmt(rebateAmt)}</span>
                              </div>
                              {convDeductAmt > 0 && (
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">折算抵扣金额</span>
                                      <span className="font-bold text-sm font-mono text-red-600 dark:text-red-400">{fmt(convDeductAmt)}</span>
                                  </div>
                              )}
                          </div>
                          {selectedOrder.conversionAmount != null && (
                              <div className="border-t border-gray-200 dark:border-white/10 pt-3 space-y-3">
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500">折算金额</span>
                                      <span className="font-bold text-sm font-mono text-blue-600 dark:text-blue-400">{fmt(selectedOrder.conversionAmount)}</span>
                                  </div>
                              </div>
                          )}
                      </div>
                          );
                      })()}
                      {(() => {
                          const productTotal = selectedOrder.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
                          const discountAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 1000 ? Math.floor(lineTotal * 0.05 / 10) * 10 : 0);
                          }, 0);
                          const rebateAmt = selectedOrder.items.reduce((sum, item) => {
                              const lineTotal = item.priceAtPurchase * item.quantity;
                              return sum + (item.priceAtPurchase > 5000 ? Math.floor(lineTotal * 0.02 / 10) * 10 : 0);
                          }, 0);
                          const convDeductAmt2 = selectedOrder.conversionDeductionAmount ?? 0;
                          const amountDue = convDeductAmt2 > 0 ? 0 : productTotal - discountAmt - rebateAmt;
                          const fmt = (n: number) => `¥${n.toLocaleString()}`;
                          return (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2">
                                  <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">订单应付金额</span>
                                      <span className="font-bold text-xl text-red-600 dark:text-red-400 font-mono">{fmt(amountDue)}</span>
                                  </div>
                                  {selectedOrder.isPaid && (
                                      <div className="flex justify-between items-center">
                                          <span className="font-bold text-gray-900 dark:text-white text-sm">订单实付金额</span>
                                          <span className="font-bold text-xl text-green-600 dark:text-green-400 font-mono">{fmt(convDeductAmt2 > 0 ? convDeductAmt2 : amountDue)}</span>
                                      </div>
                                  )}
                              </div>
                          );
                      })()}
                  </div>
              </div>
              )}

          </div>
          )}

          {/* 服务明细 */}
          {hasPermission('order_detail_product') && (() => {
              const serviceItems: { id: string; productType: string; productSpec: string; productName: string; serviceMethod: string; servicePeriod: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
              selectedOrder.items.forEach((orderItem, idx) => {
                  const product = products.find(p => p.id === orderItem.productId);
                  if (!product) return;
                  const linkedServices = product.linkedServices || [];
                  linkedServices.forEach((svc: LinkedService, sIdx: number) => {
                      const svcProduct = products.find(p => p.id === svc.productId);
                      if (!svcProduct) return;
                      const svcSku = svc.skuId
                          ? svcProduct.skus.find(s => s.id === svc.skuId)
                          : svcProduct.skus.find(s => s.status === 'Active');
                      const svcOption = svcSku?.pricingOptions?.[0];
                      const unitPrice = svcOption?.price ?? svcSku?.price ?? 0;
                      const period = svcOption
                          ? (svcOption.license?.periodUnit === 'Forever' ? '永久' : `${svcOption.license?.periodNum || svcOption.license?.period || 1}${svcOption.license?.periodUnit === 'Year' ? '年' : '月'}`)
                          : orderItem.licensePeriod || '1年';
                      serviceItems.push({
                          id: `svc_${idx}_${sIdx}`,
                          productType: svcProduct.productType || svcProduct.subCategory || '-',
                          productSpec: svcSku?.name || '-',
                          productName: svcProduct.name,
                          serviceMethod: svcProduct.activationMethods?.[0] || '在线服务',
                          servicePeriod: period,
                          quantity: orderItem.quantity,
                          unitPrice,
                          subtotal: unitPrice * orderItem.quantity,
                      });
                  });
              });
              if (serviceItems.length === 0) return null;
              const isChannel = selectedOrder.buyerType === 'Channel';
              return (
                  <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                      <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-teal-500" />
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">服务明细</h3>
                          <span className="text-xs text-gray-400 dark:text-gray-500">共 {serviceItems.length} 项</span>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm min-w-[600px]">
                              <thead className="unified-table-header">
                                  <tr>
                                      <th className="px-5 py-4 pl-6 text-center w-14">编号</th>
                                      <th className="px-5 py-4">产品类型</th>
                                      <th className="px-5 py-4">产品规格</th>
                                      <th className="px-5 py-4">产品名称</th>
                                      <th className="px-5 py-4">授权方式/服务方式</th>
                                      <th className="px-5 py-4 text-center">授权或服务期限</th>
                                      <th className="px-5 py-4 text-center">数量</th>
                                      {!isChannel && <th className="px-5 py-4 text-right">服务成本预提单价</th>}
                                      {!isChannel && <th className="px-5 py-4 text-right">服务成本预提金额小计(含税)</th>}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                  {serviceItems.map((svc, idx) => (
                                      <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                          <td className="px-5 py-4 pl-6 text-center">
                                              <button
                                                  type="button"
                                                  onClick={() => onOpenServiceDetail(svc)}
                                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/40 text-xs font-bold font-mono text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:border-teal-200 dark:hover:border-teal-700 cursor-pointer transition"
                                              >{idx + 1}</button>
                                          </td>
                                          <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{svc.productType}</td>
                                          <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{svc.productSpec}</td>
                                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{svc.productName}</td>
                                          <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{svc.serviceMethod}</td>
                                          <td className="px-5 py-4 text-center">
                                              <span className="inline-flex px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">{svc.servicePeriod}</span>
                                          </td>
                                          <td className="px-5 py-4 text-center font-medium dark:text-white">x {svc.quantity}</td>
                                          {!isChannel && <td className="px-5 py-4 text-right font-mono text-gray-700 dark:text-gray-300">¥{svc.unitPrice.toLocaleString()}</td>}
                                          {!isChannel && <td className="px-5 py-4 text-right font-bold font-mono text-gray-900 dark:text-white">¥{svc.subtotal.toLocaleString()}</td>}
                                      </tr>
                                  ))}
                              </tbody>
                              {!isChannel && (
                                  <tfoot className="border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
                                      <tr>
                                          <td colSpan={7} className="px-5 py-3 text-right font-bold text-sm text-gray-700 dark:text-gray-300">合计</td>
                                          <td colSpan={2} className="px-5 py-3 text-right font-bold font-mono text-red-600 dark:text-red-400">¥{serviceItems.reduce((sum, s) => sum + s.subtotal, 0).toLocaleString()}</td>
                                      </tr>
                                  </tfoot>
                              )}
                          </table>
                      </div>
                  </div>
              );
          })()}

          {/* Opportunity Information — table format consistent with order product details */}
          {hasPermission('order_detail_opportunity') && (() => {
              const opp = selectedOrder.opportunityId ? opportunities.find(o => o.id === selectedOrder.opportunityId) : null;
              if (!opp) return null;
              const stageClass = opp.stage === '赢单' ? 'unified-tag-green !rounded-full' : opp.stage === '输单' ? 'unified-tag-gray !rounded-full' : opp.stage === '需求判断' ? 'unified-tag-blue !rounded-full' : opp.stage === '确认商机' ? 'unified-tag-indigo !rounded-full' : opp.stage === '确认渠道' ? 'unified-tag-purple !rounded-full' : 'unified-tag-yellow !rounded-full';
              return (
                  <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                          <Target className="w-5 h-5 text-orange-500" />
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">商机信息</h3>
                      </div>
                      <div className="p-5">
                          <div className="grid grid-cols-3 gap-x-6">
                              {[
                                  { label: '商机名称', value: opp.name },
                                  { label: '商机编号', value: opp.id, mono: true },
                                  { label: '客户名称', value: opp.customerName },
                                  { label: '商机阶段', tag: true },
                                  { label: '所属部门', value: opp.department || '-' },
                                  { label: '负责人', value: opp.ownerName || '-' },
                                  { label: '商机金额', value: `¥${(opp.amount || opp.expectedRevenue || 0).toLocaleString()}`, isAmount: true },
                                  { label: '结单日期', value: opp.closeDate ? new Date(opp.closeDate).toLocaleDateString('zh-CN') : '-', mono: true },
                              ].map((f, idx) => (
                                  <div key={idx} className="flex items-center gap-3 py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0">
                                      <span className="text-[13px] font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-20 shrink-0 whitespace-nowrap">{f.label}</span>
                                      {f.tag ? (
                                          <span className={`${stageClass} text-[13px]`}>{opp.stage}</span>
                                      ) : (
                                          <span className={`text-[13px] font-medium flex-1 truncate ${f.isAmount ? 'font-mono font-bold text-red-600 dark:text-red-400' : f.mono ? 'font-mono text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`} title={f.value}>{f.value}</span>
                                      )}
                                  </div>
                              ))}
                          </div>
                          {opp.products && opp.products.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                  <div className="flex items-center gap-3">
                                      <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-20 shrink-0 whitespace-nowrap">产品信息</span>
                                      <div className="flex-1 flex flex-col gap-2">
                                          {opp.products.map((p, pi) => (
                                              <div key={pi} className="flex flex-col">
                                                  <div className="flex items-center gap-2">
                                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-50 dark:bg-orange-900/20 text-[10px] font-bold font-mono text-orange-600 dark:text-orange-400 shrink-0">{pi + 1}</span>
                                                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.productName}</span>
                                                  </div>
                                                  {(p.skuName || p.licenseType) && (
                                                      <div className="flex items-center gap-1.5 mt-1 ml-7 flex-wrap">
                                                          {p.skuName && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{p.skuName}</span>}
                                                          {p.licenseType && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{p.licenseType}</span>}
                                                      </div>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* 客户信息 (1/3 卡片，含订单联系人) */}
              {hasPermission('order_detail_customer') && (
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 shrink-0">
                      <Building className="w-5 h-5 text-[#0071E3]" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">客户信息</h3>
                  </div>
                  <div className="p-5 flex-1">
                      <div className="divide-y divide-gray-50 dark:divide-white/5">
                          {[
                              { label: '客户名称', value: selectedOrder.customerName, link: `/customers/${selectedOrder.customerId}` },
                              { label: '客户类型', value: selectedOrder.customerType },
                              { label: '行业条线', value: selectedOrder.industryLine },
                              { label: '所在地区', value: [selectedOrder.province, selectedOrder.city, selectedOrder.district].filter(Boolean).join(' / ') || undefined },
                              { label: '报备标签', value: selectedOrder.reportTag },
                              { label: '授权覆盖客户', value: selectedOrder.customerStatus },
                          ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 py-3.5">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{item.label}</span>
                                  {item.link ? (
                                      <button onClick={() => navigate(item.link!)} className="text-sm font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline truncate flex-1 text-left" title={item.value || '-'}>
                                          {item.value || '-'}
                                      </button>
                                  ) : (
                                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1" title={item.value || '-'}>{item.value || '-'}</span>
                                  )}
                              </div>
                          ))}
                      </div>
                      {/* 订单联系人（内嵌） */}
                      {(() => {
                          const cust = customers.find(c => c.id === selectedOrder.customerId);
                          const pct = selectedOrder.purchasingContactId ? cust?.contacts.find(c => c.id === selectedOrder.purchasingContactId) : undefined;
                          const ict = selectedOrder.itContactId ? cust?.contacts.find(c => c.id === selectedOrder.itContactId) : undefined;
                          if (!pct && !ict) return null;
                          const renderContact = (contact: typeof pct, label: string, colorClass: { bg: string; ring: string; badge: string }) => {
                              if (!contact) return null;
                              return (
                                  <div className={`p-3 rounded-xl ${colorClass.bg} border ${colorClass.ring}`}>
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorClass.badge}`}>{label}</span>
                                          <span className="text-[14px] font-bold text-gray-900 dark:text-white truncate">{contact.name}</span>
                                      </div>
                                      <div className="space-y-1">
                                          {contact.phone && (
                                              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                  <Phone className="w-3 h-3 text-gray-400 shrink-0"/><span className="font-mono">{contact.phone}</span>
                                              </div>
                                          )}
                                          {contact.email && (
                                              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                  <Mail className="w-3 h-3 text-gray-400 shrink-0"/><span className="truncate">{contact.email}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          };
                          return (
                              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                  <div className="text-[14px] font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-2">订单联系人</div>
                                  <div className="space-y-2">
                                      {renderContact(pct, '采购联系人', { bg: 'bg-blue-50/60 dark:bg-blue-900/10', ring: 'border-blue-100/80 dark:border-blue-800/30', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' })}
                                      {renderContact(ict, 'IT联系人', { bg: 'bg-purple-50/60 dark:bg-purple-900/10', ring: 'border-purple-100/80 dark:border-purple-800/30', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' })}
                                  </div>
                              </div>
                          );
                      })()}
                  </div>
              </div>
              )}

              {/* 交易双方信息 (1/3 卡片) */}
              {hasPermission('order_detail_trader') && (
              <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 shrink-0">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">交易双方信息</h3>
                  </div>
                  <div className="p-5 flex-1">
                      <div className="divide-y divide-gray-50 dark:divide-white/5">
                          {[
                              { label: '买方名称', value: selectedOrder.buyerName },
                              { label: '卖方名称', value: selectedOrder.sellerName },
                              { label: '直接下级渠道', value: selectedOrder.directChannel },
                              { label: '终端渠道', value: selectedOrder.terminalChannel },
                              { label: '渠道服务', value: selectedOrder.channelService },
                          ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 py-3.5">
                                  <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{item.label}</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1" title={item.value || '-'}>{item.value || '-'}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              )}

              {/* 订单备注 (1/3 卡片) */}
              {hasPermission('order_detail_remark') && <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 shrink-0">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">订单备注</h3>
                  </div>
                  <div className="px-4 py-3 flex-1 overflow-y-auto">
                      {selectedOrder.orderRemark ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{selectedOrder.orderRemark}</p>
                      ) : (
                          <EmptyState icon={<FileText className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="暂无备注" className="py-6" />
                      )}
                  </div>
              </div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* 合同信息 (moved before original order) */}
              <div className="unified-card md:col-span-2 dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                          <Scroll className="w-5 h-5 text-blue-500" />
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">合同信息</h3>
                          {(selectedOrder.linkedContractIds?.length ?? 0) > 0 && (
                              <span className="text-xs text-gray-400 font-mono">({selectedOrder.linkedContractIds!.length})</span>
                          )}
                      </div>
                      <button
                          onClick={(e) => { e.stopPropagation(); onOpenContractPicker(); }}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                      >
                          <Plus className="w-3.5 h-3.5"/> 添加合同
                      </button>
                  </div>
                  {(() => {
                      const ids = selectedOrder.linkedContractIds;
                      if (!ids || ids.length === 0) return (
                          <EmptyState icon={<Scroll className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="暂未关联合同" className="py-8" />
                      );
                      const linkedContracts = ids.map(cid => contracts.find(c => c.id === cid)).filter(Boolean);
                      if (linkedContracts.length === 0) return (
                          <EmptyState icon={<Scroll className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="暂未关联合同" className="py-8" />
                      );
                      return (
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                  <thead className="unified-table-header">
                                      <tr>
                                          <th className="px-5 py-4 pl-6 whitespace-nowrap">合同编号</th>
                                          <th className="px-5 py-4">合同名称</th>
                                          <th className="px-5 py-4 whitespace-nowrap">合同类型</th>
                                          <th className="px-5 py-4 text-right whitespace-nowrap">合同金额</th>
                                          <th className="px-5 py-4 text-center whitespace-nowrap">操作</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                      {linkedContracts.map(contract => {
                                          const c = contract!;
                                          return (
                                          <tr key={c.id} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                              <td className="px-5 py-5 pl-6 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{c.code}</td>
                                              <td className="px-5 py-5 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                              <td className="px-5 py-5 text-gray-700 dark:text-gray-300">{c.contractType || '-'}</td>
                                              <td className="px-5 py-5 text-right font-mono font-bold text-gray-900 dark:text-white">{c.amount != null ? `¥${c.amount.toLocaleString()}` : '-'}</td>
                                              <td className="px-5 py-5 text-center">
                                                  <button
                                                      onClick={() => onPreviewContract(c.id)}
                                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition border bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] dark:text-[#0A84FF] hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-100 dark:border-blue-800/40"
                                                  >
                                                      <Eye className="w-3 h-3" />
                                                      预览
                                                  </button>
                                              </td>
                                          </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      );
                  })()}
              </div>

              {/* Original Order Numbers (small card) */}
              {hasPermission('order_detail_original') && (
              <div className="unified-card md:col-span-1 dark:bg-[#1C1C1E] p-4 border-gray-100/50 dark:border-white/10 space-y-3">
                  <div className="border-b border-gray-100 dark:border-white/10 pb-2.5 flex items-center">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-1"><History className="w-5 h-5 text-purple-500"/> 原订单编号</h4>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/5">
                      {[
                          { label: 'SMS订单编号', value: selectedOrder.smsOriginalOrderId || 'S00713162' },
                          { label: 'SaaS订单编号', value: selectedOrder.saasOriginalOrderId || 'P20260303195755000001' },
                      ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-8 py-3.5">
                              <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-44 shrink-0 whitespace-nowrap">{item.label}</span>
                              <span className="text-sm font-medium font-mono text-gray-900 dark:text-white flex-1 break-all">{item.value}</span>
                          </div>
                      ))}
                  </div>
              </div>
              )}
            </div>

            {/* Settlement Method */}
            {hasPermission('order_detail_settlement') && (
            <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">结算方式</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                    {selectedOrder.settlementMethod ? (<>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">结算方式：</span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                selectedOrder.settlementMethod === 'credit'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40'
                                    : selectedOrder.settlementMethod === 'prepaid'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40'
                                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/40'
                            }`}>
                                {selectedOrder.settlementMethod === 'credit' ? '信用额度' : selectedOrder.settlementMethod === 'prepaid' ? '预付款' : '现结销售'}
                            </span>
                        </div>
                        {selectedOrder.settlementMethod === 'credit' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">付款方式：</span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    selectedOrder.settlementType === 'installment'
                                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/40'
                                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40'
                                }`}>
                                    {selectedOrder.settlementType === 'installment' ? '分期付款' : '一次性付款'}
                                </span>
                            </div>
                        )}
                        {selectedOrder.settlementMethod === 'credit' && selectedOrder.settlementType !== 'installment' && selectedOrder.expectedPaymentDate && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">预计付款时间：</span>
                                <span className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200">{selectedOrder.expectedPaymentDate}</span>
                            </div>
                        )}
                    </div>
                    {selectedOrder.settlementMethod === 'cash' && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-lg">现结销售：订单全部款项将在发货前一次性结清，无需分期。</div>
                    )}
                    {selectedOrder.settlementMethod === 'prepaid' && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 rounded-lg">预付款：客户已预付全款或部分款项，订单将优先安排发货。</div>
                    )}
                    {selectedOrder.settlementMethod === 'credit' && selectedOrder.settlementType === 'installment' && selectedOrder.installmentPlans && selectedOrder.installmentPlans.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="unified-table-header">
                                    <tr>
                                        <th className="px-5 py-4 pl-6 whitespace-nowrap">分期计划</th>
                                        <th className="px-5 py-4 text-right whitespace-nowrap">分期金额</th>
                                        <th className="px-5 py-4 whitespace-nowrap">预计付款时间</th>
                                        <th className="px-5 py-4 whitespace-nowrap">实际付款时间</th>
                                        <th className="px-5 py-4 text-right whitespace-nowrap">付款金额</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {selectedOrder.installmentPlans?.map((plan, idx) => (
                                        <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-5 pl-6 text-gray-700 dark:text-gray-300 font-medium">第{idx + 1}期</td>
                                            <td className="px-5 py-5 text-right font-mono font-bold text-gray-900 dark:text-white">¥{plan.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-5 py-5 font-mono text-gray-700 dark:text-gray-300">{plan.expectedDate || '-'}</td>
                                            <td className="px-5 py-5 font-mono text-gray-700 dark:text-gray-300">{plan.actualDate || '-'}</td>
                                            <td className="px-5 py-5 text-right font-mono text-gray-700 dark:text-gray-300">{plan.paidAmount > 0 ? `¥${plan.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    </>) : (
                        <EmptyState icon={<Banknote className="w-6 h-6 text-gray-300 dark:text-gray-600" />} title="未设置结算方式" className="py-6" />
                    )}
                </div>
            </div>
            )}

            {/* Acceptance Information Table */}
            {hasPermission('order_detail_acceptance') && (
            <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10">
                    <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="w-5 h-5 text-green-500" />
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">验收信息</h3>
                        </div>
                        {selectedOrder.acceptanceConfig && (
                            <span className={`text-xs px-3 py-1 rounded-lg font-bold border ${
                                selectedOrder.acceptanceConfig.status === 'Completed'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                                    : selectedOrder.acceptanceConfig.status === 'In Progress'
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                    : 'bg-gray-50 dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                            }`}>
                                {selectedOrder.acceptanceConfig.type === 'Phased' ? '分期验收' : '一次性验收'}
                                {' · '}
                                {selectedOrder.acceptanceConfig.status === 'Completed' ? '已完成' : selectedOrder.acceptanceConfig.status === 'In Progress' ? '进行中' : '待验收'}
                            </span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="unified-table-header">
                                <tr>
                                    <th className="px-5 py-4 pl-6 text-center w-16 whitespace-nowrap">阶段编号</th>
                                    <th className="px-5 py-4">产品名称</th>
                                    <th className="px-5 py-4">验收方式</th>
                                    <th className="px-5 py-4">验收内容</th>
                                    <th className="px-5 py-4">验收比例</th>
                                    <th className="px-5 py-4 text-right">验收金额</th>
                                    <th className="px-5 py-4 text-center">验收状态</th>
                                    <th className="px-5 py-4 pr-8">验收时间</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {selectedOrder.acceptanceConfig?.phases && selectedOrder.acceptanceConfig.phases.length > 0
                                    ? selectedOrder.acceptanceConfig.phases.map((phase, idx) => (
                                    <tr key={phase.id} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-5 pl-6 text-center">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">
                                                {String(idx + 1).padStart(3, '0')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 font-bold text-gray-900 dark:text-white">{phase.name}</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">
                                            {selectedOrder.acceptanceConfig?.type === 'Phased' ? '分期验收' : '一次性验收'}
                                        </td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">{phase.content || '-'}</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">{phase.percentage}%</td>
                                        <td className="px-5 py-5 text-right font-bold text-gray-900 dark:text-white">
                                            ¥{phase.amount.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                                                phase.status === 'Accepted'
                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                            }`}>
                                                {phase.status === 'Accepted' ? '✓ 已验收' : '待验收'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 pr-8 text-gray-500 dark:text-gray-400 text-xs">
                                            {phase.acceptedDate ? new Date(phase.acceptedDate).toLocaleDateString('zh-CN') : '-'}
                                        </td>
                                    </tr>
                                    ))
                                    : selectedOrder.items.map((item, idx) => (
                                    <tr key={idx} className="group text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-5 pl-6 text-center">
                                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs font-bold font-mono text-[#0071E3] dark:text-[#0A84FF]">
                                                {String(idx + 1).padStart(3, '0')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">一次性验收</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">-</td>
                                        <td className="px-5 py-5 text-gray-600 dark:text-gray-300">100%</td>
                                        <td className="px-5 py-5 text-right font-bold text-gray-900 dark:text-white">
                                            ¥{(item.priceAtPurchase * item.quantity).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-5 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                                待验收
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 pr-8 text-gray-500 dark:text-gray-400 text-xs">-</td>
                                    </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    {selectedOrder.acceptanceConfig?.phases && selectedOrder.acceptanceConfig.phases.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                共 {selectedOrder.acceptanceConfig.phases.length} 个验收阶段，
                                已完成 {selectedOrder.acceptanceConfig.phases.filter(p => p.status === 'Accepted').length} 个
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                验收金额合计: ¥{selectedOrder.acceptanceConfig.phases.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            )}
      </>
    );
};
