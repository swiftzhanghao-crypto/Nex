import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Quote, Heading1, Heading2,
  ListOrdered, List, Subscript, Superscript, IndentDecrease, IndentIncrease,
  AlignLeft, AlignCenter, AlignRight, Eraser,
} from 'lucide-react';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  /** 可插入的变量列表（点击会插入到光标位置，以高亮 chip 展示） */
  variables?: string[];
  variablesLabel?: string;
  /** 字符数上限，超过后内容会被截断（按纯文本计） */
  maxLength?: number;
  /** 编辑区最小高度，默认 240 */
  minHeight?: number;
  /** 字段名称：如果传入会展示在变量区上方 */
  fieldName?: string;
  className?: string;
}

const FONT_FAMILIES = ['Sans Serif', 'Serif', 'Monospace', '微软雅黑', '宋体', '黑体'];
const FONT_SIZES = [
  { label: 'Normal', value: '3' },
  { label: '小', value: '2' },
  { label: '中', value: '4' },
  { label: '大', value: '5' },
  { label: '特大', value: '6' },
];
const LINE_HEIGHTS = ['1', '1.15', '1.5', '1.75', '2', '2.5'];
const TEXT_COLORS = ['#1f2937', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
const HIGHLIGHT_COLORS = ['transparent', '#fef08a', '#fde68a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fbcfe8'];

/**
 * 轻量富文本编辑器 - 基于 contentEditable + document.execCommand
 * 注：execCommand 已被标记 deprecated，但在主流浏览器仍可用。这里用于内部管理后台编辑场景，足够。
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容',
  variables = [],
  variablesLabel = '插入变量',
  maxLength = 10000,
  minHeight = 240,
  fieldName,
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [textLen, setTextLen] = useState(0);
  const [lineHeight, setLineHeight] = useState('1.5');

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);
    handleInput();
  }, []);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else if (editorRef.current) {
      // 没有已保存光标时，把光标放到编辑器末尾
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    setTextLen(text.length);
    onChange(html, text);
  }, [onChange]);

  // 初始化内容（仅当外部 value 与 DOM 不一致时同步，避免输入时光标跳动）
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
      setTextLen((editorRef.current.innerText || '').length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertVariable = useCallback((variable: string) => {
    editorRef.current?.focus();
    restoreSelection();
    // 用一个不可编辑的高亮 chip 表示变量
    const chipHTML = `<span class="rte-var-chip" contenteditable="false" data-variable="${variable}">{{${variable}}}</span>&nbsp;`;
    document.execCommand('insertHTML', false, chipHTML);
    handleInput();
  }, [handleInput, restoreSelection]);

  const setColor = useCallback((color: string) => exec('foreColor', color), [exec]);
  const setHighlight = useCallback((color: string) => exec('hiliteColor', color === 'transparent' ? 'transparent' : color), [exec]);
  const setFontSize = useCallback((size: string) => exec('fontSize', size), [exec]);
  const setFontFamily = useCallback((family: string) => exec('fontName', family), [exec]);
  const setAlignment = useCallback((align: 'Left' | 'Center' | 'Right') => exec(`justify${align}`), [exec]);

  const applyLineHeight = useCallback((lh: string) => {
    setLineHeight(lh);
    if (!editorRef.current) return;
    editorRef.current.style.lineHeight = lh;
    handleInput();
  }, [handleInput]);

  const clearFormat = useCallback(() => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('removeFormat');
    document.execCommand('unlink');
    handleInput();
  }, [handleInput, restoreSelection]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // 粘贴为纯文本，避免外部样式污染
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const overLimit = textLen > maxLength;

  const btnClass = 'inline-flex items-center justify-center w-7 h-7 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition disabled:opacity-30';
  const sepClass = 'w-px h-5 bg-gray-200 dark:bg-white/10 mx-1 self-center';

  return (
    <div className={`rich-text-editor ${className || ''}`}>
      {fieldName && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">字段名称：</span>
          <span className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200">{fieldName}</span>
        </div>
      )}

      {variables.length > 0 && (
        <div className="mb-3">
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1.5 shrink-0">{variablesLabel}：</span>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <button
                  key={v}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); saveSelection(); }}
                  onClick={() => insertVariable(v)}
                  className="px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition"
                  title={`插入变量：${v}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 编辑器容器 */}
      <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-black">
        {/* 工具栏 */}
        <div
          className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03]"
          onMouseDown={e => { saveSelection(); /* 防止点击工具栏丢失选区 */ if ((e.target as HTMLElement).tagName === 'BUTTON') e.preventDefault(); }}
        >
          <button type="button" className={btnClass} title="加粗" onClick={() => exec('bold')}><Bold className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="斜体" onClick={() => exec('italic')}><Italic className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="下划线" onClick={() => exec('underline')}><Underline className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="删除线" onClick={() => exec('strikeThrough')}><Strikethrough className="w-3.5 h-3.5" /></button>
          <span className={sepClass} />
          <button type="button" className={btnClass} title="引用" onClick={() => exec('formatBlock', 'BLOCKQUOTE')}><Quote className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="标题1" onClick={() => exec('formatBlock', 'H1')}><Heading1 className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="标题2" onClick={() => exec('formatBlock', 'H2')}><Heading2 className="w-3.5 h-3.5" /></button>
          <span className={sepClass} />
          <button type="button" className={btnClass} title="有序列表" onClick={() => exec('insertOrderedList')}><ListOrdered className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="无序列表" onClick={() => exec('insertUnorderedList')}><List className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="下标" onClick={() => exec('subscript')}><Subscript className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="上标" onClick={() => exec('superscript')}><Superscript className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="减少缩进" onClick={() => exec('outdent')}><IndentDecrease className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="增加缩进" onClick={() => exec('indent')}><IndentIncrease className="w-3.5 h-3.5" /></button>
          <span className={sepClass} />
          <button type="button" className={btnClass} title="左对齐" onClick={() => setAlignment('Left')}><AlignLeft className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="居中" onClick={() => setAlignment('Center')}><AlignCenter className="w-3.5 h-3.5" /></button>
          <button type="button" className={btnClass} title="右对齐" onClick={() => setAlignment('Right')}><AlignRight className="w-3.5 h-3.5" /></button>
          <span className={sepClass} />
          <select
            defaultValue="3"
            onChange={e => setFontSize(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            title="字号"
          >
            {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={lineHeight}
            onChange={e => applyLineHeight(e.target.value)}
            className="ml-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            title="行高"
          >
            {LINE_HEIGHTS.map(lh => <option key={lh} value={lh}>{`行高 ${lh}`}</option>)}
          </select>
          <span className={sepClass} />
          {/* 文字颜色 */}
          <div className="relative group">
            <button type="button" className={btnClass} title="文字颜色"><span className="w-3.5 h-3.5 inline-flex items-end justify-center font-bold text-[10px] leading-none">A<span className="block w-3.5 h-0.5 bg-red-500 -mt-0.5" /></span></button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-md p-1.5 shadow-lg z-10 gap-1">
              {TEXT_COLORS.map(c => (
                <button key={c} type="button" onMouseDown={e => { e.preventDefault(); saveSelection(); }} onClick={() => setColor(c)} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
          {/* 高亮 */}
          <div className="relative group">
            <button type="button" className={btnClass} title="高亮"><span className="w-3.5 h-3.5 inline-flex items-end justify-center font-bold text-[10px] leading-none bg-yellow-200 rounded">A</span></button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-md p-1.5 shadow-lg z-10 gap-1">
              {HIGHLIGHT_COLORS.map(c => (
                <button key={c} type="button" onMouseDown={e => { e.preventDefault(); saveSelection(); }} onClick={() => setHighlight(c)} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: c === 'transparent' ? 'white' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%)' : undefined, backgroundSize: '6px 6px', backgroundPosition: '0 0, 3px 3px' }} title={c === 'transparent' ? '清除高亮' : c} />
              ))}
            </div>
          </div>
          <span className={sepClass} />
          <select
            defaultValue="Sans Serif"
            onChange={e => setFontFamily(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
            title="字体"
          >
            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button type="button" className={btnClass + ' ml-1'} title="清除格式" onClick={clearFormat}><Eraser className="w-3.5 h-3.5" /></button>
        </div>

        {/* 编辑区 */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onPaste={handlePaste}
            className="rte-content w-full px-4 py-3 text-sm text-gray-800 dark:text-gray-100 outline-none custom-scrollbar overflow-y-auto"
            style={{ minHeight, lineHeight }}
            data-placeholder={placeholder}
          />
          {/* 字符数 */}
          <div className={`absolute right-3 bottom-2 text-[11px] tabular-nums ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {textLen}/{maxLength}
          </div>
        </div>
      </div>

      {/* placeholder + 变量 chip 样式 */}
      <style>{`
        .rte-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rte-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 12px;
          color: #6b7280;
          margin: 6px 0;
        }
        .rte-content h1 { font-size: 1.4rem; font-weight: 700; margin: 8px 0; }
        .rte-content h2 { font-size: 1.2rem; font-weight: 700; margin: 6px 0; }
        .rte-content ul { list-style: disc; padding-left: 24px; }
        .rte-content ol { list-style: decimal; padding-left: 24px; }
        .rte-var-chip {
          display: inline-flex;
          align-items: center;
          padding: 1px 8px;
          margin: 0 1px;
          border-radius: 9999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 600;
          line-height: 1.4;
          user-select: all;
        }
        .dark .rte-var-chip {
          background: rgba(59, 130, 246, 0.18);
          color: #93c5fd;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
