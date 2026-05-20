import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalPortal from '../../common/ModalPortal';

export const ConfirmDialog: React.FC<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ open, title, description, confirmLabel = '确认', cancelLabel = '取消', variant = 'primary', onConfirm, onCancel }) => {
    if (!open) return null;
    const isDanger = variant === 'danger';
    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[700] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onCancel}>
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-white/10 animate-modal-enter" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                            <AlertTriangle className={`w-6 h-6 ${isDanger ? 'text-red-500' : 'text-[#0071E3] dark:text-[#0A84FF]'}`} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                    </div>
                    <div className="flex border-t border-gray-100 dark:border-white/10">
                        <button onClick={onCancel} className="flex-1 py-3.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition rounded-bl-2xl">{cancelLabel}</button>
                        <div className="w-px bg-gray-100 dark:bg-white/10" />
                        <button onClick={onConfirm} className={`flex-1 py-3.5 text-sm font-bold transition rounded-br-2xl ${isDanger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-[#0071E3] dark:text-[#0A84FF] hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}>{confirmLabel}</button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};
