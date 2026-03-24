import React from 'react';
import { Trash2 } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

interface DeleteConfirmModalProps {
  orderId: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ orderId, onCancel, onConfirm }) => (
  <ModalPortal>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-sm animate-modal-enter overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">确认删除草稿</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">删除后将无法恢复，确定要删除订单 <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{orderId}</span> 吗？</p>
        </div>
        <div className="flex border-t border-gray-100 dark:border-white/10">
          <button onClick={onCancel} className="flex-1 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-l border-gray-100 dark:border-white/10">删除</button>
        </div>
      </div>
    </div>
  </ModalPortal>
);

export default React.memo(DeleteConfirmModal);
