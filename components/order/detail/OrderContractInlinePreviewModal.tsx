import React from 'react';
import { Scroll, Download, X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { Order, Contract } from '../../../types';

export type OrderContractInlinePreviewModalProps = {
    contract: Contract;
    selectedOrder: Order;
    onClose: () => void;
};

export const OrderContractInlinePreviewModal: React.FC<OrderContractInlinePreviewModalProps> = ({
    contract: c,
    selectedOrder,
    onClose,
}) => (
<ModalPortal>
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in" onClick={() => onClose()}>
                  <div className="bg-white dark:bg-[#1C1C1E] shadow-2xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-white/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-white/5 shrink-0 rounded-t-2xl">
                          <div className="flex items-center gap-2">
                              <Scroll className="w-5 h-5 text-[#0071E3]" />
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition" title="下载合同"><Download className="w-4 h-4" /></button>
                              <button onClick={() => onClose()} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-600 transition"><X className="w-4 h-4"/></button>
                          </div>
                      </div>
                      <div className="overflow-y-auto flex-1 custom-scrollbar p-6">
                          <div className="bg-white dark:bg-[#2C2C2E] mx-auto shadow rounded-lg border border-gray-200 dark:border-white/10" style={{ padding: '40px 48px', maxWidth: '640px' }}>
                              <div className="text-center mb-6">
                                  <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-widest mb-1">软件产品采购合同</h1>
                                  <div className="text-xs text-gray-400 font-mono">合同编号：{c.code}</div>
                              </div>
                              <div className="mb-4 text-xs leading-7 text-gray-700 dark:text-gray-300">
                                  <p>甲方（买方）：<strong className="text-gray-900 dark:text-white">{c.partyA || selectedOrder.customerName}</strong></p>
                                  <p>乙方（卖方）：<strong className="text-gray-900 dark:text-white">{c.partyB || '北京金山办公软件股份有限公司'}</strong></p>
                                  <p className="mt-1.5 text-gray-500 dark:text-gray-400 text-[11px] leading-5">
                                      根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿、公平、诚实信用的基础上，经友好协商，就甲方购买乙方软件产品事宜，达成如下协议：
                                  </p>
                              </div>
                              <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-4" />
                              <div className="mb-4">
                                  <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-1.5">第一条　产品信息</h2>
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-[11px] border border-gray-200 dark:border-white/10 border-collapse">
                                          <thead>
                                              <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                                  <th className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-left font-bold">序号</th>
                                                  <th className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-left font-bold">产品名称</th>
                                                  <th className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-center font-bold">数量</th>
                                                  <th className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right font-bold">单价</th>
                                                  <th className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right font-bold">小计</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {selectedOrder.items.map((item, idx) => (
                                                  <tr key={idx} className="text-gray-700 dark:text-gray-300">
                                                      <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-center">{idx + 1}</td>
                                                      <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5">{item.productName}</td>
                                                      <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-center">{item.quantity}</td>
                                                      <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right font-mono">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                      <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right font-mono">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                                  </tr>
                                              ))}
                                              <tr className="bg-orange-50/60 dark:bg-orange-900/10 font-bold text-gray-900 dark:text-white">
                                                  <td colSpan={4} className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right">合计</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-2 py-1.5 text-right font-mono text-red-600 dark:text-red-400">¥{(c.amount ?? selectedOrder.total).toLocaleString()}</td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                              <div className="mb-3">
                                  <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-1">第二条　付款方式</h2>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-6">
                                      甲方应于合同签订后 <strong>30</strong> 个工作日内，将合同款项全额汇入乙方指定账户。
                                  </p>
                              </div>
                              <div className="mb-3">
                                  <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-1">第三条　交付与验收</h2>
                                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-6">
                                      乙方在收到全额货款后，通过电子方式向甲方交付产品授权码及安装介质，甲方应在 <strong>5</strong> 个工作日内签署验收确认书。
                                  </p>
                              </div>
                              <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-4" />
                              <div className="grid grid-cols-2 gap-6 text-[11px] text-gray-600 dark:text-gray-400">
                                  <div className="space-y-2">
                                      <p className="font-bold text-gray-800 dark:text-gray-200">甲方（盖章）</p>
                                      <p>{c.partyA || selectedOrder.customerName}</p>
                                      <div className="w-20 h-20 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-1 opacity-50">
                                          <div className="text-[8px] text-red-400 font-bold text-center">合同专用章</div>
                                      </div>
                                      {c.signDate && <p className="text-[10px]">签约：{c.signDate}</p>}
                                  </div>
                                  <div className="space-y-2">
                                      <p className="font-bold text-gray-800 dark:text-gray-200">乙方（盖章）</p>
                                      <p>{c.partyB || '北京金山办公软件股份有限公司'}</p>
                                      <div className="w-20 h-20 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-1 opacity-50">
                                          <div className="text-[8px] text-red-400 font-bold text-center">合同专用章</div>
                                      </div>
                                      {c.signDate && <p className="text-[10px]">签约：{c.signDate}</p>}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              </ModalPortal>

);
