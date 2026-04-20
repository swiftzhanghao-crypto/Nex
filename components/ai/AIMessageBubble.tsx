import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import type { ChatMessage } from '../../services/aiAssistant';
import { SKILL_LABELS } from '../../services/aiAssistant';
import OrderCardInChat from './OrderCardInChat';
import CustomerCardInChat from './CustomerCardInChat';
import ProductCardInChat from './ProductCardInChat';
import ReportCardInChat from './ReportCardInChat';

interface AIMessageBubbleProps {
  message: ChatMessage;
  onCardNavigate?: () => void;
  onReportRegenerate?: (messageId: string) => void;
  onReportSubmit?: (messageId: string, html: string, plainText: string) => void;
}

const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({ message, onCardNavigate, onReportRegenerate, onReportSubmit }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [copied, setCopied] = useState(false);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── User: 右对齐淡灰胶囊 ──
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="bg-[#F4F4F4] dark:bg-white/[0.08] text-gray-900 dark:text-white text-[15px] leading-relaxed px-4 py-2.5 rounded-2xl max-w-[85%] whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // ── Assistant: 直接平铺，无气泡 ──
  return (
    <div className="mb-8 group">
      {/* 技能标签 */}
      {message.skillId && (
        <div className="text-[11px] font-medium text-[#0071E3] dark:text-[#0A84FF] mb-2 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]" />
          {SKILL_LABELS[message.skillId]}
        </div>
      )}

      {/* 内容（无气泡） */}
      {message.content && (
        <div className="text-[15px] leading-[1.7] text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )}

      {/* 卡片 */}
      {message.cards && message.cards.length > 0 && (
        <div className={`flex flex-col gap-3 ${message.content ? 'mt-3' : ''}`}>
          {message.cards.map((card, i) => {
            if (card.type === 'order') {
              return <OrderCardInChat key={i} orderId={card.orderId} onClose={onCardNavigate} />;
            }
            if (card.type === 'customer') {
              return <CustomerCardInChat key={i} customerId={card.customerId} onClose={onCardNavigate} />;
            }
            if (card.type === 'product') {
              return <ProductCardInChat key={i} productId={card.productId} onClose={onCardNavigate} />;
            }
            if (card.type === 'report') {
              return (
                <ReportCardInChat
                  key={i}
                  title={card.title}
                  content={card.content}
                  generatedAt={card.generatedAt}
                  onRegenerate={() => onReportRegenerate?.(message.id)}
                  onSubmit={(html, plain) => onReportSubmit?.(message.id, html, plain)}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* 操作工具栏 */}
      {message.id !== 'welcome' && (
        <div className="flex items-center gap-0.5 mt-3 -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleCopy} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition" title="复制">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition" title="赞">
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition" title="踩">
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition" title="重新生成">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AIMessageBubble;
