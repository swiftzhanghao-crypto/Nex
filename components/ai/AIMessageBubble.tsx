import React from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../../services/aiAssistant';
import { SKILL_LABELS } from '../../services/aiAssistant';

interface AIMessageBubbleProps {
  message: ChatMessage;
}

const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const timeStr = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-2.5 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-[#0071E3] to-[#34AADC]'
          : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* 消息体 */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 技能标签（仅 AI 回复时显示） */}
        {!isUser && message.skillId && (
          <span className="text-[10px] font-medium text-purple-500 dark:text-purple-400 mb-1 px-1">
            {SKILL_LABELS[message.skillId]}
          </span>
        )}

        {/* 气泡 */}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#0071E3] text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-md'
        }`}>
          {message.content}
        </div>

        {/* 时间戳 */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
          {timeStr}
        </span>
      </div>
    </div>
  );
};

export default AIMessageBubble;
