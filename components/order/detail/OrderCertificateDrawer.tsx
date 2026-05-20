import React from 'react';
import { X, Award, Printer, ShieldCheck } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';
import type { Order, OrderItem } from '../../../types';

export type OrderCertificateDrawerProps = {
    selectedOrder: Order;
    selectedCertificateItem: OrderItem;
    isCertDrawerClosing: boolean;
    isCertPreviewMode: boolean;
    certView: 'paper' | 'structured';
    onClose: () => void;
    onCertViewChange: (view: 'paper' | 'structured') => void;
    onConfirmAuth: () => void;
};

export const OrderCertificateDrawer: React.FC<OrderCertificateDrawerProps> = ({
    selectedOrder,
    selectedCertificateItem,
    isCertDrawerClosing,
    isCertPreviewMode,
    certView,
    onClose,
    onCertViewChange,
    onConfirmAuth,
}) => (
          <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isCertDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose}></div>
              <div className={`relative w-full max-w-4xl h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isCertDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                   {/* Cert Header */}
                   <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center print:hidden bg-white dark:bg-white/5">
                       <div className="flex items-center gap-6">
                           <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                               <Award className="w-5 h-5 text-orange-500"/> {isCertPreviewMode ? '授权证书预览与确认' : '软件授权证书'}
                           </h3>
                           
                           <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                               <button 
                                   onClick={() => onCertViewChange('paper')}
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'paper' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                               >
                                   纸质排版
                               </button>
                               <button 
                                   onClick={() => onCertViewChange('structured')}
                                   className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${certView === 'structured' ? 'bg-white dark:bg-white/20 shadow-apple text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                               >
                                   结构化展示
                               </button>
                           </div>
                       </div>
                       <div className="flex gap-2">
                           {!isCertPreviewMode && (
                               <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition"><Printer className="w-4 h-4"/> 打印证书</button>
                           )}
                           <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300"><X className="w-5 h-5"/></button>
                       </div>
                   </div>
                   
                   {/* Cert Content */}
                   <div className="flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-black/50 flex justify-center">
                        {certView === 'paper' ? (
                            /* Certificate Paper */
                            <div id="cert-content" className="relative bg-white text-gray-900 border-[12px] border-white shadow-2xl w-[800px] h-[1100px] p-16 flex flex-col justify-between overflow-hidden">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                                    <ShieldCheck className="w-[600px] h-[600px]" />
                                </div>
                                
                                <div className="relative z-10 text-center space-y-12 mt-8">
                                     <div className="flex flex-col items-center gap-4">
                                         <div className="unified-button-primary w-20 h-20 rounded-3xl text-3xl font-black italic shadow-xl">W</div>
                                         <div className="text-sm font-bold tracking-[0.4em] text-blue-600 uppercase">WPS Enterprise Systems</div>
                                     </div>
                                     
                                     <div className="space-y-2">
                                        <h2 className="text-5xl font-serif text-gray-900 font-medium tracking-wide">软件产品授权证书</h2>
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.3em]">Certificate of Software License</div>
                                     </div>

                                     <div className="text-left text-lg leading-loose text-gray-700 space-y-10 pt-10 border-t border-gray-100">
                                         <div>
                                             <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">授权用户 (Licensee)</p>
                                             <h3 className="text-3xl font-bold text-gray-900 underline underline-offset-8 decoration-blue-500/30 decoration-4">{selectedOrder.customerName}</h3>
                                         </div>
                                         
                                         <div className="grid grid-cols-2 gap-y-8 gap-x-12 text-left bg-gray-50 p-8 rounded-3xl border border-gray-100">
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">产品名称 (Product)</div>
                                                 <div className="text-xl font-bold text-gray-900">{selectedCertificateItem.productName}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">规格型号 (SKU)</div>
                                                 <div className="text-lg font-medium text-gray-900">{selectedCertificateItem.skuName}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">授权数量 (Quantity)</div>
                                                 <div className="text-lg font-mono font-bold text-gray-900">{selectedCertificateItem.quantity}</div>
                                             </div>
                                             <div>
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">生效日期 (Date)</div>
                                                 <div className="text-lg font-mono font-medium text-gray-900">{new Date(selectedOrder.confirmedDate || Date.now()).toLocaleDateString()}</div>
                                             </div>
                                             <div className="col-span-2 pt-4 border-t border-gray-200/50">
                                                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">授权许可码 (License Key)</div>
                                                 <div className="font-mono text-base text-blue-700 bg-blue-50 p-4 rounded-xl border border-blue-100 break-all shadow-apple">
                                                     {selectedCertificateItem.deliveredContent?.[0] || 'PREVIEW-LICENSE-KEY-GENERATED-001'}
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                </div>

                                <div className="flex justify-between items-end pb-8 relative z-10">
                                     <div className="space-y-1 text-left">
                                         <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Authorized Signature</div>
                                         <div className="h-16 w-48 border-b border-gray-300 relative flex items-end pb-2">
                                             <span className="text-4xl font-serif italic text-blue-900 opacity-90 rotate-[-5deg]">WPS Inc.</span>
                                         </div>
                                         <div className="text-sm font-bold mt-2">WPS Systems Ltd.</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="w-32 h-32 border-4 border-blue-600 rounded-full flex items-center justify-center relative rotate-[-12deg] opacity-80 mask-stamp">
                                             <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute top-4">Official Seal</div>
                                             <ShieldCheck className="w-12 h-12 text-blue-600" />
                                             <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 absolute bottom-4">Verified</div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            /* Structured Layout */
                            <div className="unified-card dark:bg-[#1C1C1E] w-full max-w-5xl flex flex-col">
                                <div className="p-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCertificateItem.productName}授权信息</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-5 bg-gray-200 dark:bg-white/10 rounded-full relative cursor-pointer">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-apple"></div>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">未生效</span>
                                        </div>
                                    </div>
                                    <button className="unified-button-primary">编辑</button>
                                </div>
                                
                                <div className="p-10 space-y-12">
                                    {/* 授权信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">授权信息</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">被授权方:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedOrder.customerName}</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权类型:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">随机数量授权</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权数量:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedCertificateItem.quantity}</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">购买单位:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">套</span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权范围:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium leading-relaxed">
                                                    {selectedOrder.customerName}2026年3月1日（{selectedOrder.customerName}项目）新购{selectedCertificateItem.quantity}台计算机设备
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权地址:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    中华人民共和国范围内（香港及澳门特别行政区、台湾地区除外）
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权/服务期限:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    同授权范围中所包含计算机设备的使用年限。
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4 col-span-2">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权说明:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    授权编号一致的电子授权或纸版授权（如有）为同一授权，不重复累加。
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权编号:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">20260228216000_712187</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">订单编号:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">{selectedOrder.id}</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 产品信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">产品信息</h3>
                                        <div className="flex items-start gap-4">
                                            <span className="text-gray-400 text-sm min-w-[100px]">授权产品/服务:</span>
                                            <span className="text-gray-900 dark:text-white text-sm font-medium">{selectedCertificateItem.productName}</span>
                                        </div>
                                    </section>

                                    {/* 服务信息 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">服务信息</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障期限:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">1年</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障开始时间:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">2026-03-05</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">升级保障结束时间:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium font-mono">2027-03-05</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 序列号 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">序列号</h3>
                                        <div className="flex items-start gap-4">
                                            <span className="text-gray-400 text-sm min-w-[100px]">安装序列号:</span>
                                            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold font-mono">7H*****TH</span>
                                        </div>
                                    </section>

                                    {/* 其他 */}
                                    <section className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">其他</h3>
                                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">下级单位清单:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                                    {(() => { const totalSubs = selectedOrder.items.reduce((s, it) => s + (it.subUnits?.length || 0), 0); return totalSubs > 0 ? `${totalSubs} 个下级单位（分布于 ${selectedOrder.items.filter(it => it.subUnits && it.subUnits.length > 0).length} 个明细行）` : '-'; })()}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="text-gray-400 text-sm min-w-[100px]">授权备注:</span>
                                                <span className="text-gray-900 dark:text-white text-sm font-medium">-</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                   </div>

                   {/* Footer Actions for Preview Mode */}
                   {isCertPreviewMode && (
                        <div className="unified-card p-6 dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 shrink-0 shadow-[-5px_0_30px_rgba(0,0,0,0.1)] z-20">
                            <button onClick={onClose} className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-bold text-sm">取消</button>
                            <button onClick={() => onConfirmAuth()} className="unified-button-primary bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0A84FF]/80">确认授权无误</button>
                        </div>
                   )}
              </div>
          </div>
          </ModalPortal>
);
