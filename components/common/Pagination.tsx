import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  /** 当前页号（从 1 开始） */
  page: number;
  /** 每页大小 */
  size: number;
  /** 总条数 */
  total: number;
  /** 翻页回调 */
  onPageChange: (page: number) => void;
  /** 改变每页大小回调（不传则不展示 size 选择器） */
  onSizeChange?: (size: number) => void;
  /** 可选的 page size 列表，默认 [10, 20, 50, 100] */
  sizeOptions?: number[];
  /** 是否显示「跳至第 X 页」 */
  showJumper?: boolean;
  /** 紧凑模式（隐藏中间页码、size 选择器） */
  compact?: boolean;
  className?: string;
  loading?: boolean;
}

/** 生成显示的页码序列：1 ... cur-2 cur-1 cur cur+1 cur+2 ... last */
function buildPageList(current: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  const left = Math.max(2, current - 2);
  const right = Math.min(totalPages - 1, current + 2);
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('...');
  pages.push(totalPages);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
  sizeOptions = [10, 20, 50, 100],
  showJumper = false,
  compact = false,
  className = '',
  loading = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);

  const goto = (p: number) => {
    if (loading) return;
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-sm ${className}`}>
      <div className="text-gray-500 dark:text-gray-400">
        {total === 0 ? '暂无数据' : <>共 <span className="font-medium text-gray-700 dark:text-gray-200">{total}</span> 条 · 第 {start}-{end} 条</>}
      </div>

      <div className="flex items-center gap-2">
        {!compact && onSizeChange && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span>每页</span>
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              disabled={loading}
              className="rounded border border-gray-200 dark:border-white/10 bg-transparent px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {sizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>条</span>
          </div>
        )}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => goto(page - 1)}
            disabled={loading || page <= 1}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!compact && pageList.map((p, idx) =>
            p === '...' ? (
              <span key={`gap-${idx}`} className="px-1.5 text-gray-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goto(p)}
                disabled={loading}
                className={`min-w-[28px] px-2 py-1 rounded text-xs font-medium transition ${
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ),
          )}

          {compact && (
            <span className="px-2 text-xs text-gray-500">
              {page} / {totalPages}
            </span>
          )}

          <button
            type="button"
            onClick={() => goto(page + 1)}
            disabled={loading || page >= totalPages}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {showJumper && totalPages > 1 && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              key={page}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(v)) goto(v);
                }
              }}
              className="w-12 rounded border border-gray-200 dark:border-white/10 bg-transparent px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 outline-none focus:border-blue-500"
            />
            <span>页</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
