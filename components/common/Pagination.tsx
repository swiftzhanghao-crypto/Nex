import React from 'react';

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
  /** 可选的 page size 列表，默认 [20, 50, 100] */
  sizeOptions?: number[];
  /** 总数描述后缀，默认「条」，如「条订阅」「条商机」 */
  totalLabel?: string;
  /** 已选中信息，传入后会在总数后面追加显示 */
  selectedCount?: number;
  /** 自定义外层 className（覆盖默认的 padding/border 等） */
  className?: string;
  /** loading 中禁用全部按钮 */
  loading?: boolean;
  /** 隐藏左侧「共 N 条」，用于调用方自行渲染总数 */
  hideTotal?: boolean;
}

/**
 * 全站统一分页器：
 * 左侧显示总条数（含可选「已选 N 条」），右侧依次为：每页大小选择器、当前页指示、上一页 / 下一页。
 *
 * 默认外层使用列表表脚的灰底分隔线样式，调用方一般无需再包一层。
 * 如需嵌入到自定义容器中，可传入 `className=""` 覆盖默认样式。
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
  sizeOptions = [20, 50, 100],
  totalLabel = '条',
  selectedCount,
  className,
  loading = false,
  hideTotal = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const goto = (p: number) => {
    if (loading) return;
    if (p < 1 || p > totalPages || p === safePage) return;
    onPageChange(p);
  };

  const wrapperCls = className ?? 'flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5';

  return (
    <div className={wrapperCls}>
      {!hideTotal && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{total}</span> {totalLabel}
          {selectedCount != null && selectedCount > 0 && (
            <span className="ml-2">（已选 <span className="font-semibold text-[#0071E3]">{selectedCount}</span> 条）</span>
          )}
        </span>
      )}

      <div className="flex items-center gap-3">
        {onSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              disabled={loading}
              className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer hover:border-[#0071E3]/50 transition disabled:opacity-50"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 6px center',
              }}
            >
              {sizeOptions.map((s) => (
                <option key={s} value={s}>{s} 条</option>
              ))}
            </select>
          </div>
        )}

        <span className="text-xs text-gray-400 dark:text-gray-500">第 {safePage} / {totalPages} 页</span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goto(safePage - 1)}
            disabled={loading || safePage <= 1}
            className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            type="button"
            onClick={() => goto(safePage + 1)}
            disabled={loading || safePage >= totalPages}
            className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
