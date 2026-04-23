import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen, ExternalLink, ChevronRight, Search, FileText } from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  icon: string;
  content?: string;
  link?: string;
}

interface DocCenterDrawerProps {
  docs: DocItem[];
  onClose: () => void;
}

const mdComponents = {
  h1: ({children}: any) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-4 pb-2 border-b border-gray-100 dark:border-white/10">{children}</h1>,
  h2: ({children}: any) => <h2 id={typeof children === 'string' ? children : undefined} className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-3 flex items-center gap-2 before:content-[''] before:w-1 before:h-4 before:bg-[#0071E3] before:rounded-full before:shrink-0 scroll-mt-4">{children}</h2>,
  h3: ({children}: any) => <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-5 mb-2">{children}</h3>,
  h4: ({children}: any) => <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-1.5">{children}</h4>,
  p: ({children}: any) => <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{children}</p>,
  ul: ({children}: any) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
  ol: ({children}: any) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
  li: ({children}: any) => <li className="text-sm text-gray-600 dark:text-gray-300">{children}</li>,
  strong: ({children}: any) => <strong className="font-semibold text-gray-800 dark:text-gray-100">{children}</strong>,
  em: ({children}: any) => <em className="italic text-gray-600 dark:text-gray-300">{children}</em>,
  code: ({children, className}: any) => {
    const isBlock = className?.includes('language-');
    return isBlock
      ? <code className="block text-xs font-mono text-gray-700 dark:text-gray-200">{children}</code>
      : <code className="text-xs font-mono text-[#0071E3] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{children}</code>;
  },
  pre: ({children}: any) => <pre className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-xs overflow-x-auto mb-4">{children}</pre>,
  table: ({children}: any) => <div className="overflow-x-auto mb-4"><table className="w-full text-sm border-collapse">{children}</table></div>,
  thead: ({children}: any) => <thead className="bg-gray-50 dark:bg-white/5">{children}</thead>,
  th: ({children}: any) => <th className="text-left text-xs font-semibold text-gray-700 dark:text-gray-200 px-3 py-2 border-b border-gray-200 dark:border-white/10">{children}</th>,
  td: ({children}: any) => <td className="text-xs text-gray-600 dark:text-gray-300 px-3 py-2 border-b border-gray-100 dark:border-white/5">{children}</td>,
  tr: ({children}: any) => <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">{children}</tr>,
  blockquote: ({children}: any) => <blockquote className="border-l-2 border-[#0071E3] pl-4 my-3 text-sm text-gray-500 dark:text-gray-400 italic">{children}</blockquote>,
  hr: () => <hr className="my-6 border-gray-100 dark:border-white/10" />,
  a: ({children, href}: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0071E3] dark:text-blue-400 hover:underline">{children}</a>,
};

function extractHeadings(markdown: string): { level: number; text: string }[] {
  const lines = markdown.split('\n');
  const headings: { level: number; text: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2].replace(/[`*_]/g, '').trim() });
    }
  }
  return headings;
}

const DocCenterDrawer: React.FC<DocCenterDrawerProps> = ({ docs, onClose }) => {
  const [activeDocId, setActiveDocId] = useState(docs[0]?.id || '');
  const [tocSearch, setTocSearch] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeDoc = docs.find(d => d.id === activeDocId);
  const headings = useMemo(() => {
    if (!activeDoc?.content) return [];
    return extractHeadings(activeDoc.content);
  }, [activeDoc]);

  const filteredHeadings = useMemo(() => {
    if (!tocSearch.trim()) return headings;
    const q = tocSearch.toLowerCase();
    return headings.filter(h => h.text.toLowerCase().includes(q));
  }, [headings, tocSearch]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 280);
  };

  const scrollToHeading = (text: string) => {
    if (!contentRef.current) return;
    const headingEls = contentRef.current.querySelectorAll('h1, h2, h3');
    for (const el of headingEls) {
      if (el.textContent?.trim() === text) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
  };

  const handleDocSwitch = (docId: string) => {
    const doc = docs.find(d => d.id === docId);
    if (doc?.link) {
      window.open(doc.link, '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveDocId(docId);
    setTocSearch('');
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[500] ${isClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full z-[500] flex flex-col bg-white dark:bg-[#1C1C1E] shadow-2xl border-l border-gray-200 dark:border-white/10 ${isClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}
        style={{ width: 'calc(100vw - 80px)', maxWidth: 1400 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-gray-100 dark:border-white/10 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#0071E3]" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">文档中心</h2>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 min-h-0">

          {/* Left Sidebar */}
          <div className="w-[280px] shrink-0 border-r border-gray-100 dark:border-white/10 flex flex-col bg-gray-50/30 dark:bg-black/20">

            {/* Doc List */}
            <div className="p-3 border-b border-gray-100 dark:border-white/10">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">文档列表</div>
              <div className="space-y-0.5">
                {docs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSwitch(doc.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-medium transition-all ${
                      activeDocId === doc.id && !doc.link
                        ? 'bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#0A84FF]/15 dark:text-[#0A84FF]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base leading-none">{doc.icon}</span>
                    <span className="flex-1 truncate">{doc.title}</span>
                    {doc.link && <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* TOC */}
            {activeDoc?.content && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-3 pt-3 pb-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">目录</div>
                  <div className="flex items-center gap-2 bg-white dark:bg-[#2C2C2E] rounded-lg px-2.5 h-8 border border-gray-200/60 dark:border-white/10">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      value={tocSearch}
                      onChange={e => setTocSearch(e.target.value)}
                      placeholder="搜索目录..."
                      className="flex-1 bg-transparent text-xs outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
                  <div className="space-y-0.5">
                    {filteredHeadings.map((h, i) => (
                      <button
                        key={`${h.text}-${i}`}
                        onClick={() => scrollToHeading(h.text)}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white truncate flex items-center gap-1"
                        style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                      >
                        {h.level === 1 && <FileText className="w-3 h-3 text-[#0071E3] shrink-0" />}
                        {h.level === 2 && <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
                        {h.level >= 3 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0 ml-1 mr-0.5" />}
                        <span className={`truncate ${h.level === 1 ? 'font-bold text-gray-800 dark:text-gray-200' : h.level === 2 ? 'font-medium' : ''}`}>
                          {h.text}
                        </span>
                      </button>
                    ))}
                    {filteredHeadings.length === 0 && tocSearch && (
                      <div className="px-2 py-4 text-xs text-gray-400 text-center">未找到匹配项</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
            {activeDoc?.content ? (
              <div className="max-w-4xl mx-auto px-8 py-6">
                <ReactMarkdown components={mdComponents}>
                  {activeDoc.content}
                </ReactMarkdown>
              </div>
            ) : activeDoc?.link ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                <ExternalLink className="w-12 h-12 opacity-30" />
                <p className="text-sm">此文档为外部链接，已在新标签页打开</p>
                <a href={activeDoc.link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0071E3] hover:underline flex items-center gap-1">
                  重新打开 <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">选择左侧文档查看内容</div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes docDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes docDrawerOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes docBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes docBackdropOut { from { opacity: 1; } to { opacity: 0; } }
        .animate-drawer-enter { animation: docDrawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-drawer-exit { animation: docDrawerOut 0.28s cubic-bezier(0.4, 0, 1, 1) forwards; }
        .animate-backdrop-enter { animation: docBackdropIn 0.25s ease-out forwards; }
        .animate-backdrop-exit { animation: docBackdropOut 0.25s ease-in forwards; }
      `}</style>
    </>
  );
};

export default DocCenterDrawer;
