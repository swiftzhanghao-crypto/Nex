import React from 'react';
import { Order } from '../../types';
import { X, ZoomIn, ZoomOut, Download, Scroll } from 'lucide-react';

interface Props {
  isOpen: boolean;
  order: Order;
  zoom: number;
  setZoom: (v: number) => void;
  onClose: () => void;
}

const OrderContractPreview: React.FC<Props> = ({ isOpen, order, zoom, setZoom, onClose }) => {
  if (!isOpen) return null;
  const selectedOrder = order;
  const contractZoom = zoom;
  const setContractZoom = setZoom;

  return (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-gray-200/50 dark:border-white/10">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Scroll className="w-5 h-5 text-[#0071E3]" />
                          </div>
                          <div>
                              <div className="text-base font-bold text-gray-900 dark:text-white">{selectedOrder.customerName}软件产品采购合同</div>
                              <div className="text-xs text-gray-400 font-mono">HT-{new Date(selectedOrder.date).getFullYear()}-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => setZoom(Math.max(60, contractZoom - 10))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition"><ZoomOut className="w-4 h-4" /></button>
                          <span className="text-xs text-gray-500 w-10 text-center">{contractZoom}%</span>
                          <button onClick={() => setZoom(Math.min(150, contractZoom + 10))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition"><ZoomIn className="w-4 h-4" /></button>
                          <button className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition" title="下载合同"><Download className="w-4 h-4" /></button>
                          <button onClick={() => onClose()} className="ml-1 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
                      </div>
                  </div>

                  {/* Contract Document */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 dark:bg-black/30 p-6">
                      <div
                          className="bg-white dark:bg-[#2C2C2E] mx-auto shadow-xl rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-200"
                          style={{ width: `${contractZoom}%`, minWidth: '480px', padding: '60px 72px' }}
                      >
                          {/* Contract Title */}
                          <div className="text-center mb-8">
                              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-widest mb-1">软件产品采购合同</h1>
                              <div className="text-sm text-gray-400 font-mono">合同编号：HT-{new Date(selectedOrder.date).getFullYear()}-{selectedOrder.id.slice(-6).toUpperCase()}</div>
                          </div>

                          {/* Parties */}
                          <div className="mb-6 text-sm leading-8 text-gray-700 dark:text-gray-300">
                              <p>甲方（买方）：<strong className="text-gray-900 dark:text-white">{selectedOrder.customerName}</strong></p>
                              <p>乙方（卖方）：<strong className="text-gray-900 dark:text-white">北京金山办公软件股份有限公司</strong></p>
                              <p className="mt-2 text-gray-500 dark:text-gray-400 text-xs leading-6">
                                  根据《中华人民共和国合同法》及相关法律法规的规定，甲乙双方在平等、自愿、公平、诚实信用的基础上，经友好协商，就甲方购买乙方软件产品事宜，达成如下协议：
                              </p>
                          </div>

                          <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-5" />

                          {/* Article 1 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第一条　产品信息</h2>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-xs border border-gray-200 dark:border-white/10 border-collapse">
                                      <thead>
                                          <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">序号</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">产品名称</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-left font-bold">规格/版本</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center font-bold">数量</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-bold">单价（元）</th>
                                              <th className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-bold">小计（元）</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {selectedOrder.items.map((item, idx) => (
                                              <tr key={idx} className="text-gray-700 dark:text-gray-300">
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center">{idx + 1}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2">{item.productName}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2">{item.skuName || item.skuCode}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-center">{item.quantity}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono">¥{item.priceAtPurchase.toLocaleString()}</td>
                                                  <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</td>
                                              </tr>
                                          ))}
                                          <tr className="bg-orange-50/60 dark:bg-orange-900/10 font-bold text-gray-900 dark:text-white">
                                              <td colSpan={5} className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right">合计金额</td>
                                              <td className="border border-gray-200 dark:border-white/10 px-3 py-2 text-right font-mono text-red-600 dark:text-red-400">¥{selectedOrder.total.toLocaleString()}</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-6">
                                  合同总金额（大写）：<strong className="text-gray-700 dark:text-gray-300">{(() => {
                                      const units = ['', '拾', '佰', '仟'];
                                      const bigUnits = ['', '万', '亿'];
                                      const nums = '零壹贰叁肆伍陆柒捌玖';
                                      const n = Math.round(selectedOrder.total);
                                      if (n === 0) return '零元整';
                                      let result = '';
                                      const str = String(n);
                                      const len = str.length;
                                      for (let i = 0; i < len; i++) {
                                          const d = parseInt(str[i]);
                                          const pos = len - i - 1;
                                          result += nums[d];
                                          if (d !== 0) result += units[pos % 4];
                                          if (pos % 4 === 0 && pos !== 0) result += bigUnits[Math.floor(pos / 4)];
                                      }
                                      return result + '元整';
                                  })()}</strong>
                              </p>
                          </div>

                          {/* Article 2 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第二条　付款方式</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  甲方应于合同签订后 <strong className="text-gray-900 dark:text-white">30</strong> 个工作日内，将合同款项全额汇入乙方指定账户。付款方式为银行转账。乙方收到全部款项后，向甲方开具增值税专用发票。
                              </p>
                              <div className="mt-3 bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                  <p>开户行：<span className="text-gray-800 dark:text-gray-200">中国工商银行北京海淀支行</span></p>
                                  <p>账户名称：<span className="text-gray-800 dark:text-gray-200">北京金山办公软件股份有限公司</span></p>
                                  <p>银行账号：<span className="text-gray-800 dark:text-gray-200 font-mono">0200 0048 0920 0135 958</span></p>
                              </div>
                          </div>

                          {/* Article 3 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第三条　交付方式</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  乙方在收到甲方全额货款后，通过电子邮件或在线系统向甲方交付产品授权码（License Key）及相关安装介质。交付完成后，甲方应在 <strong className="text-gray-900 dark:text-white">5</strong> 个工作日内签署验收确认书。
                              </p>
                          </div>

                          {/* Article 4 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第四条　保密条款</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  双方对在合同履行过程中知悉的对方商业秘密及技术秘密，负有保密义务，未经书面同意不得向第三方披露，该义务在合同终止后仍持续有效，期限为 <strong className="text-gray-900 dark:text-white">3</strong> 年。
                              </p>
                          </div>

                          {/* Article 5 */}
                          <div className="mb-5">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第五条　违约责任</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  任何一方违反本合同规定，应向守约方支付合同总金额 <strong className="text-gray-900 dark:text-white">10%</strong> 的违约金，并赔偿由此造成的全部损失。
                              </p>
                          </div>

                          {/* Article 6 */}
                          <div className="mb-8">
                              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">第六条　争议解决</h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-7">
                                  本合同在履行过程中发生的争议，双方应友好协商解决；协商不成的，提交 <strong className="text-gray-900 dark:text-white">北京仲裁委员会</strong> 按其仲裁规则进行仲裁，仲裁裁决为终局裁决。
                              </p>
                          </div>

                          <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-6" />

                          {/* Signatures */}
                          <div className="grid grid-cols-2 gap-8 text-xs text-gray-600 dark:text-gray-400">
                              <div className="space-y-3">
                                  <p className="font-bold text-gray-800 dark:text-gray-200">甲方（盖章）</p>
                                  <p>{selectedOrder.customerName}</p>
                                  <div className="w-28 h-28 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-2 opacity-60">
                                      <div className="text-center">
                                          <div className="text-[9px] text-red-400 font-bold tracking-widest">合同专用章</div>
                                          <div className="text-[8px] text-red-400 mt-1">{selectedOrder.customerName.slice(0, 6)}</div>
                                      </div>
                                  </div>
                                  <p className="mt-2">签约日期：{new Date(selectedOrder.date).toLocaleDateString('zh-CN')}</p>
                              </div>
                              <div className="space-y-3">
                                  <p className="font-bold text-gray-800 dark:text-gray-200">乙方（盖章）</p>
                                  <p>北京金山办公软件股份有限公司</p>
                                  <div className="w-28 h-28 rounded-full border-2 border-red-300 dark:border-red-800/50 flex items-center justify-center mt-2 opacity-60">
                                      <div className="text-center">
                                          <div className="text-[9px] text-red-400 font-bold tracking-widest">合同专用章</div>
                                          <div className="text-[8px] text-red-400 mt-1">金山办公</div>
                                      </div>
                                  </div>
                                  <p className="mt-2">签约日期：{new Date(selectedOrder.date).toLocaleDateString('zh-CN')}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

  );
};

export default OrderContractPreview;
