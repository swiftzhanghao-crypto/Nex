import React from 'react';
import { X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';

export type OrderFulfillmentModalProps = {
    fulfillmentContent: string;
    onContentChange: (v: string) => void;
    onClose: () => void;
    onSave: () => void;
};

export const OrderFulfillmentModal: React.FC<OrderFulfillmentModalProps> = ({
    fulfillmentContent,
    onContentChange,
    onClose,
    onSave,
}) => (
          <ModalPortal>
          <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="unified-card dark:bg-[#1C1C1E] shadow-2xl w-full max-w-md animate-modal-enter border-white/10">
                  <div className="p-6 border-b dark:border-white/10 flex justify-between items-center"><h3 className="font-bold dark:text-white">配置交付内容</h3><button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div>
                  <div className="p-6 space-y-4">
                      <label className="text-xs font-bold text-gray-400 uppercase block">授权码 / 链接 (每行一个)</label>
                      <textarea value={fulfillmentContent} onChange={e => onContentChange(e.target.value)} placeholder="例如：XXXXX-XXXXX-XXXXX" className="w-full p-4 bg-gray-50 dark:bg-black border border-transparent dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 dark:text-white min-h-[160px] resize-none font-mono" />
                      <button onClick={onSave} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-80 transition">保存</button>
                  </div>
              </div>
          </div>
          </ModalPortal>
);
