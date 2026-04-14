import React from 'react';
import { Order } from '../../types';
import { X, History, CheckCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  order: Order;
}

const OrderLogDrawer: React.FC<Props> = ({ isOpen, isClosing, onClose, order }) => {
  if (!isOpen) return null;
  const selectedOrder = order;

  return (
          <ModalPortal>
          <div className="fixed inset-0 z-[500] flex justify-end">
              <div className={`absolute inset-0 bg-black/30 backdrop-blur-sm ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={onClose}></div>
              <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
                  <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-blue-500"/> 订单流转记录
                      </h3>
                      <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {selectedOrder.approvalRecords.map((log, idx) => (
                          <div key={idx} className="relative pl-6 border-l border-gray-200 dark:border-white/10 pb-6 last:pb-0">
                              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0071E3] border-2 border-white dark:border-[#1C1C1E]"></div>
                              <div className="text-sm font-bold dark:text-white flex justify-between">
                                  <span>{log.actionType}</span>
                                  <span className="text-[10px] text-gray-400 font-normal">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                      <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${log.operatorName}`} className="w-5 h-5 rounded-full" alt="" />
                                      <span className="font-bold text-gray-700 dark:text-gray-300">{log.operatorName}</span>
                                      <span className="text-[10px] text-gray-400 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/5">{log.operatorRole}</span>
                                  </div>
                                  <p className="leading-relaxed">{log.comment || '无备注'}</p>
                                  <div className="mt-2 text-[10px] text-green-600 font-bold flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3"/> {log.result}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          </ModalPortal>

  );
};

export default OrderLogDrawer;
