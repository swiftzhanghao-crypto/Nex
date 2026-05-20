import React from 'react';
import { Truck, Box, Package, MapPin } from 'lucide-react';
import type { Order } from '../../../types';

export type OrderShippingTabProps = {
    selectedOrder: Order;
    selectedDeliveryNo: string | null;
    onSelectDeliveryNo: (no: string | null) => void;
};

export const OrderShippingTab: React.FC<OrderShippingTabProps> = ({
    selectedOrder,
    selectedDeliveryNo,
    onSelectDeliveryNo,
}) => (
<div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
            {(() => {
              // ── Shared delivery record data ──────────────────────────────────
              const expressList = ['顺丰速运', '中通快递', '圆通速递', 'EMS邮政'];
              const senderNames = ['王明', '李静', '张伟', '赵敏'];
              const senderPhones = ['0756-8888001', '021-6666002', '010-5555003', '027-4444004'];
              const receiverPhones = [
                '138' + selectedOrder.id.slice(-8),
                '139' + selectedOrder.id.slice(-8),
                '136' + selectedOrder.id.slice(-8),
              ];
              const deliveryRecords = [
                {
                  no: '001',
                  type: '线下发货',
                  receiver: '买方',
                  unitName: selectedOrder.buyerName || selectedOrder.customerName,
                  item: selectedOrder.items[0],
                  method: '快递',
                  email: undefined as string | undefined,
                  address: selectedOrder.shippingAddress || '上海市浦东新区张江高科技园区',
                  senderName: '陈晓',
                  senderUnit: '珠海金山办公软件有限公司',
                  senderAddress: '广东省珠海市香洲区金山软件园8号楼',
                  senderPhone: '0756-8888099',
                  receiverName: selectedOrder.customerName.slice(0, 3) + '采购部',
                  receiverUnit: selectedOrder.buyerName || selectedOrder.customerName,
                  receiverAddress: selectedOrder.shippingAddress || '上海市浦东新区张江高科技园区',
                  receiverPhone: '021-8888' + selectedOrder.id.slice(-4),
                  expressCompany: '顺丰速运',
                  expressNo: `SF${selectedOrder.id.replace(/[^0-9]/g, '').slice(0, 6)}9999`,
                },
                ...selectedOrder.items.map((item, idx) => {
                  const receiver = idx % 3 === 0 ? '最终用户' : '买方';
                  const unitName = receiver === '最终用户'
                    ? selectedOrder.customerName
                    : (selectedOrder.buyerName || selectedOrder.customerName);
                  return {
                    no: String(idx + 2).padStart(3, '0'),
                    type: '线上发货',
                    receiver, unitName, item,
                    method: '账号分发',
                    email: `service@${selectedOrder.customerName.slice(0, 4).replace(/\s/g, '')}.com` as string | undefined,
                    address: undefined as string | undefined,
                    senderName: senderNames[idx % senderNames.length],
                    senderUnit: '珠海金山办公软件有限公司',
                    senderAddress: '广东省珠海市香洲区金山软件园8号楼',
                    senderPhone: senderPhones[idx % senderPhones.length],
                    receiverName: selectedOrder.customerName.slice(0, 3) + '负责人',
                    receiverUnit: unitName,
                    receiverAddress: selectedOrder.shippingAddress || '北京市海淀区中关村大街1号',
                    receiverPhone: receiverPhones[idx % receiverPhones.length],
                    expressCompany: expressList[idx % expressList.length],
                    expressNo: `SF${selectedOrder.id.replace(/[^0-9]/g, '').slice(0, 6)}${String(idx + 2).padStart(4, '0')}`,
                  };
                }),
              ];

              const active = deliveryRecords.find(r => r.no === (selectedDeliveryNo ?? deliveryRecords[0]?.no)) ?? deliveryRecords[0] ?? null;

              return (
                <>
                  {/* ── Left: Delivery Cards ─────────────────────────────── */}
                  <div className="w-[460px] shrink-0 space-y-3 pr-6 overflow-y-auto">
                    <div className="flex items-center gap-2 px-1 mb-4">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">发货记录</span>
                      <span className="ml-auto text-xs font-mono"><span className="text-[#0071E3] dark:text-[#0A84FF]">{deliveryRecords.length}</span><span className="text-gray-400 dark:text-gray-500"> 条</span></span>
                    </div>
                    {deliveryRecords.map((rec) => {
                      const isOnline = rec.type === '线上发货';
                      const isSelected = (selectedDeliveryNo ?? deliveryRecords[0]?.no) === rec.no;
                      return (
                        <div
                          key={rec.no}
                          onClick={() => onSelectDeliveryNo(isSelected ? null : rec.no)}
                          className={`rounded-2xl shadow-apple border p-4 space-y-3 transition-all cursor-pointer ${
                            isSelected
                              ? isOnline
                                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 ring-2 ring-blue-200 dark:ring-blue-800'
                                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-800'
                              : 'bg-white dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border text-xs font-bold font-mono transition-colors ${
                              isSelected
                                ? isOnline
                                  ? 'bg-[#0071E3] border-blue-500 text-white'
                                  : 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40 text-[#0071E3] dark:text-[#0A84FF]'
                            }`}>{rec.no}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                {new Date(new Date(selectedOrder.date).getTime() + (rec.no.charCodeAt(2) - 48 + 1) * 86400000).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOnline
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                                  : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-100 dark:border-orange-800'
                              }`}>
                                {isOnline ? <Box className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                {rec.type}
                              </span>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-50 dark:divide-white/5 text-sm">
                            {[
                              { label: '收货方', value: rec.receiver },
                              { label: '收货单位名称', value: rec.unitName },
                              ...(isOnline
                                ? [{ label: '收货邮箱', value: rec.email }]
                                : [{ label: '收货地址', value: rec.address }]
                              ),
                            ].map((field, fi) => (
                              <div key={fi} className="flex items-center gap-8 py-3.5">
                                <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-28 shrink-0 whitespace-nowrap">{field.label}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white break-all flex-1">{field.value || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Divider ──────────────────────────────────────────── */}
                  <div className="w-px bg-gray-200 dark:bg-white/10 mx-6 self-stretch" />

                  {/* ── Right: Detail Card ────────────────────────────────── */}
                  <div className="unified-card flex-1 dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 flex flex-col overflow-hidden">
                    {!active ? (
                      <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] gap-4 text-gray-400 dark:text-gray-600">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center">
                          <Truck className="w-8 h-8 text-blue-300 dark:text-blue-700" />
                        </div>
                        <p className="text-sm font-medium">请点击左侧发货卡片查看详情</p>
                      </div>
                    ) : active.type === '线上发货' ? (
                      /* Online: email preview */
                      <div key={active.no} className="animate-page-enter flex flex-col flex-1 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">【金山办公】订购服务开通通知</h2>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">{active.receiver}</span>
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">#{active.no}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                          <div className="space-y-2">
                            <p>尊敬的用户： 您好！</p>
                            <p>请查阅贵组织订购信息并按照本邮件中指引操作后开始使用所订购产品/服务</p>
                          </div>
                          <div className="space-y-3 bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">收货方:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.receiver}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">单位/企业:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.unitName}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">收货邮箱:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.email || '-'}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">产品:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.productName}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">购买套数/用户数:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.quantity}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">授权类型:</span><span className="font-bold text-blue-600 dark:text-blue-400">{active.item?.licenseType || '用户订阅许可'}</span></div>
                            <div className="flex gap-4"><span className="text-gray-400 min-w-[120px]">授权时长:</span><span className="font-bold text-blue-600 dark:text-blue-400">{new Date(selectedOrder.date).toLocaleDateString()} 至 {new Date(new Date(selectedOrder.date).setFullYear(new Date(selectedOrder.date).getFullYear() + 1)).toLocaleDateString()}</span></div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-red-600 font-bold">【重要-获取授权信息说明】 欢迎您使用金山办公产品/服务的电子交付，享WPS Office 正版权益。请您按照以下账号、密码或兑换码链接方式获取电子授权信息：</p>
                            <p>您的初始组织名称是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">{active.unitName}(企业ID: {active.item?.enterpriseId || '658057387'})</span>，登录信息是：<span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">该组织为用户自创建，请用该组织的企业管理员账号登录查看，https://365.wps.cn/home（请您首次登录后尽快修改初始密码）</span>，请您按照如下操作指引获取贵组织本次所订购产品/服务电子授权信息。【升级、增减购、续费订单金山办公会按照订单信息直接在您管理后台增加权益，不再发送兑换码】</p>
                          </div>
                          <div>
                            <p className="font-bold">获取电子授权的操作步骤指引，详情请阅 <a href="https://365.kdocs.cn/l/cstq9xkV34VW" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.kdocs.cn/l/cstq9xkV34VW</a></p>
                          </div>
                          <div className="pt-6 border-t border-gray-100 dark:border-white/10 text-[10px] text-gray-400 space-y-3 italic">
                            <p>*本邮件仅为确认订购信息、交付电子授权的通知函，贵组织具有向本次订购的销售方支付全部款项的义务。</p>
                            <p>为便捷用户授权管理，【授权与保障】信息页面会持续升级，您可随时进入金山办公官网 <a href="https://365.wps.cn/authentication/list" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">https://365.wps.cn/authentication/list</a> 查看授权信息。</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Offline: courier info */
                      <div key={active.no} className="animate-page-enter overflow-y-auto flex-1">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-3 bg-gray-50 dark:bg-white/5 shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <Package className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">线下发货快递信息</h3>
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded">#{active.no}</span>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{new Date(selectedOrder.date).toLocaleString()}</div>
                        </div>
                        <div className="p-6 space-y-5">
                          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Truck className="w-6 h-6 text-orange-500 shrink-0" />
                              <div>
                                <div className="text-xs text-orange-400 font-bold mb-1">快递公司</div>
                                <div className="text-base font-bold text-gray-900 dark:text-white">{active.expressCompany}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400 font-bold mb-1">快递单号</div>
                              <div className="text-base font-bold font-mono text-orange-600 dark:text-orange-400 tracking-widest">{active.expressNo}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">寄件信息</span>
                              </div>
                              <div className="divide-y divide-gray-50 dark:divide-white/5 px-5 text-sm">
                                {[
                                  { label: '寄件人姓名', value: active.senderName },
                                  { label: '寄件单位', value: active.senderUnit },
                                  { label: '寄件地址', value: active.senderAddress },
                                  { label: '寄件人电话', value: active.senderPhone },
                                ].map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-8 py-3.5">
                                    <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{f.label}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 break-all">{f.value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">收件信息</span>
                              </div>
                              <div className="divide-y divide-gray-50 dark:divide-white/5 px-5 text-sm">
                                {[
                                  { label: '收件人姓名', value: active.receiverName },
                                  { label: '收件单位', value: active.receiverUnit },
                                  { label: '收件地址', value: active.receiverAddress },
                                  { label: '收件人电话', value: active.receiverPhone },
                                ].map((f, fi) => (
                                  <div key={fi} className="flex items-center gap-8 py-3.5">
                                    <span className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 text-right w-24 shrink-0 whitespace-nowrap">{f.label}</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 break-all">{f.value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
);
