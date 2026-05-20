import React from 'react';
import { X } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';

type NewContactFormState = { name: string; phone: string; email: string; position: string };

export interface NewContactModalProps {
  handleSaveNewContact: () => void;
  newContactForm: NewContactFormState;
  setNewContactForm: React.Dispatch<React.SetStateAction<NewContactFormState>>;
  setShowNewContactModal: React.Dispatch<React.SetStateAction<'Purchasing' | 'IT' | null>>;
  showNewContactModal: 'Purchasing' | 'IT' | null;
}

const NewContactModal: React.FC<NewContactModalProps> = ({
  handleSaveNewContact,
  newContactForm,
  setNewContactForm,
  setShowNewContactModal,
  showNewContactModal,
}) => {
  if (!showNewContactModal) return null;
  return (
            <ModalPortal>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[600] animate-fade-in" onClick={() => setShowNewContactModal(null)}>
                <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-[440px] animate-modal-enter" onClick={e => e.stopPropagation()}>
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            新建{showNewContactModal === 'Purchasing' ? '采购' : 'IT'}联系人
                        </h3>
                        <button onClick={() => setShowNewContactModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">姓名 <span className="text-red-500">*</span></label>
                            <input
                                value={newContactForm.name}
                                onChange={e => setNewContactForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                placeholder="请输入联系人姓名"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">职位</label>
                            <input
                                value={newContactForm.position}
                                onChange={e => setNewContactForm(f => ({ ...f, position: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                placeholder="请输入职位"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">手机号</label>
                                <input
                                    value={newContactForm.phone}
                                    onChange={e => setNewContactForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                    placeholder="请输入手机号"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">邮箱</label>
                                <input
                                    value={newContactForm.email}
                                    onChange={e => setNewContactForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1C1C1E] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
                                    placeholder="请输入邮箱"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-2">
                        <button onClick={() => setShowNewContactModal(null)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">取消</button>
                        <button
                            onClick={handleSaveNewContact}
                            disabled={!newContactForm.name.trim()}
                            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            确定创建
                        </button>
                    </div>
                </div>
            </div>
            </ModalPortal>
  );
};

export default NewContactModal;
