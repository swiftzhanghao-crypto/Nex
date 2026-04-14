import React from 'react';
import { cn, cls } from './theme';

// ── 表格组件 ──────────────────────────────────────────────

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  minWidth?: string;
}

export function Table({ minWidth = 'min-w-full', className, children, ...rest }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-left text-sm', minWidth, className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, children, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn(cls.tableHeader, className)} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-50 dark:divide-white/5', className)} {...rest}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export function TableRow({ hoverable = true, className, children, ...rest }: TableRowProps) {
  return (
    <tr
      className={cn(
        'text-sm transition-colors',
        hoverable && 'group hover:bg-gray-50 dark:hover:bg-white/[0.03]',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  first?: boolean;
  last?: boolean;
}

export function Th({ first, last, className, children, ...rest }: ThProps) {
  return (
    <th className={cn('px-5 py-4 whitespace-nowrap', first && 'pl-6', last && 'pr-6', className)} {...rest}>
      {children}
    </th>
  );
}

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  first?: boolean;
  last?: boolean;
}

export function Td({ first, last, className, children, ...rest }: TdProps) {
  return (
    <td className={cn('px-5 py-4', first && 'pl-6', last && 'pr-6', className)} {...rest}>
      {children}
    </td>
  );
}

// ── 空状态 ────────────────────────────────────────────────

interface EmptyStateProps {
  message?: string;
  colSpan?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message = '暂无数据', colSpan, icon, className }: EmptyStateProps) {
  const content = (
    <div className={cn(cls.emptyState, 'flex flex-col items-center gap-2', className)}>
      {icon}
      <span>{message}</span>
    </div>
  );

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }

  return content;
}

// ── 分页条 ────────────────────────────────────────────────

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
      <span>共 <strong className="text-gray-700 dark:text-gray-200">{total}</strong> 条</span>
      <div className="flex items-center gap-2">
        <button
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
          className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed"
        >上一页</button>
        <span className="text-gray-600 dark:text-gray-300 font-medium">
          {current} / {totalPages}
        </span>
        <button
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1)}
          className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed"
        >下一页</button>
      </div>
    </div>
  );
}
