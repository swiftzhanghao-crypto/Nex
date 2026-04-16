import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import AIAssistantDialog from './AIAssistantDialog';

/**
 * AI 业务助手浮动入口按钮
 * 放置在 Layout 的右下角，点击后弹出对话框
 */
const AIAssistantButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮动入口按钮 — 位于反馈按钮上方 */}
      {!isOpen && (
        <div className="fixed bottom-[148px] right-0 z-[60]">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white pl-4 pr-5 py-2.5 rounded-l-full shadow-lg translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 ease-in-out active:scale-95 hover:shadow-xl"
          >
            <Bot className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">AI 助手</span>
          </button>
        </div>
      )}

      {/* 对话框 */}
      <AIAssistantDialog open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIAssistantButton;
