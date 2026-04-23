import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, RefreshCcw, Copy, Send, Check } from 'lucide-react';

interface ReportCardInChatProps {
  title: string;
  content: string;
  generatedAt: number;
  onRegenerate?: () => void;
  onSubmit?: (html: string, plainText: string) => void;
}

const MAX_CHARS = 5000;

const ReportCardInChat: React.FC<ReportCardInChatProps> = ({ title, content, generatedAt, onRegenerate, onSubmit }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateCharCount = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
  }, []);

  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
      updateCharCount();
    }
  }, [content, updateCharCount]);

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    updateCharCount();
  };

  const handleCopy = () => {
    const plain = editorRef.current?.innerText || '';
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSubmit = () => {
    if (submitted) return;
    const html = editorRef.current?.innerHTML || '';
    const plain = editorRef.current?.innerText || '';
    onSubmit?.(html, plain);
    setSubmitted(true);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const toolbarBtn = "w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-gray-100 transition";

  return (
    <div className="bg-gradient-to-b from-[#F5F7FB] to-white dark:from-[#1F2025] dark:to-[#1C1C1E] rounded-2xl border border-[#E3E7EF] dark:border-white/10 overflow-hidden shadow-sm w-full max-w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#E3E7EF] dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
        <button onClick={() => exec('bold')} className={toolbarBtn} title="加粗"><Bold className="w-4 h-4" /></button>
        <button onClick={() => exec('italic')} className={toolbarBtn} title="斜体"><Italic className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
        <button onClick={() => exec('formatBlock', 'H1')} className={toolbarBtn} title="标题 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => exec('formatBlock', 'H2')} className={toolbarBtn} title="标题 2"><Heading2 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
        <button onClick={() => exec('insertUnorderedList')} className={toolbarBtn} title="无序列表"><List className="w-4 h-4" /></button>
        <button onClick={() => exec('insertOrderedList')} className={toolbarBtn} title="有序列表"><ListOrdered className="w-4 h-4" /></button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={updateCharCount}
        spellCheck={false}
        className="report-editor px-10 py-8 min-h-[360px] text-[15px] leading-[1.75] text-gray-800 dark:text-gray-100 focus:outline-none"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif' }}
      />

      {/* Footer */}
      <div className="flex items-end justify-between gap-3 px-4 py-3 border-t border-[#E3E7EF] dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
        <div className="flex flex-col gap-0.5 min-w-0 text-[11px] text-gray-400 dark:text-gray-500">
          <div>字数 <span className="tabular-nums text-gray-500 dark:text-gray-400">{charCount}/{MAX_CHARS}</span></div>
          <div>数据生成时间 <span className="text-gray-500 dark:text-gray-400">{formatTimestamp(generatedAt)}</span>，如需最新数据请手动刷新</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRegenerate}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            title="重新生成"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 text-[13px] font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制内容'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium shadow-sm transition ${
              submitted
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-[#0071E3] hover:bg-[#0062CC] text-white'
            }`}
          >
            {submitted ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            {submitted ? '已提交至周报日报' : '提交 CRM'}
          </button>
        </div>
      </div>

      {/* Editor styles */}
      <style>{`
        .report-editor h1 { font-size: 20px; font-weight: 700; margin: 0 0 12px; color: inherit; }
        .report-editor h2 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(0,0,0,0.06); color: inherit; }
        .dark .report-editor h2 { border-bottom-color: rgba(255,255,255,0.08); }
        .report-editor ul { list-style: disc; padding-left: 24px; margin: 8px 0; }
        .report-editor ol { list-style: decimal; padding-left: 24px; margin: 8px 0; }
        .report-editor li { margin: 4px 0; }
        .report-editor blockquote { border-left: 3px solid #CBD5E0; padding-left: 12px; margin: 12px 0; color: #718096; font-size: 13px; }
        .dark .report-editor blockquote { border-left-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); }
        .report-editor strong { font-weight: 600; }
      `}</style>
    </div>
  );
};

export default ReportCardInChat;
