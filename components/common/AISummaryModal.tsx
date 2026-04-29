import React from 'react';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';

export interface AISummaryHighlight {
    /** 文案内容，调用方组装好；支持简单 emoji */
    text: string;
    /** 可选语义色：normal / risk */
    tone?: 'normal' | 'risk';
}

interface Props {
    open: boolean;
    onClose: () => void;
    /** 第一段醒目摘要 */
    headline: string;
    /** 关键亮点列表 */
    highlights: AISummaryHighlight[];
    /** 风险 / 待改进列表 */
    risks: AISummaryHighlight[];
    title?: string;
}

/**
 * AI 总结弹窗：通过 ModalPortal 渲染到 body 层，
 * 避免被父级 transform（如 drawer 动画）破坏 fixed 定位。
 */
const AISummaryModal: React.FC<Props> = ({ open, onClose, headline, highlights, risks, title = '✨ AI 总结' }) => {
    if (!open) return null;
    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[700] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
                <div
                    className="relative bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                    style={{ animation: 'empCardIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                >
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10 shrink-0">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{title}</span>
                        <button onClick={onClose} aria-label="关闭" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                        <p className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed pb-4 border-b border-gray-100 dark:border-white/10">
                            {headline}
                        </p>
                        {highlights.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">关键亮点</div>
                                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed list-disc pl-5">
                                    {highlights.map((h, i) => <li key={i}>{h.text}</li>)}
                                </ul>
                            </div>
                        )}
                        {risks.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">风险 / 待改进</div>
                                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed list-disc pl-5">
                                    {risks.map((h, i) => <li key={i}>{h.text}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
};

export default React.memo(AISummaryModal);
