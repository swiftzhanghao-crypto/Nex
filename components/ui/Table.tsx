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
// 兼容旧 API（current / pageSize / onChange）的薄包装，内部转发到全站统一的
// `components/common/Pagination`。新代码请直接使用 `components/common/Pagination`。

import UnifiedPagination from '../common/Pagination';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ current, total, pageSize, onChange }: PaginationProps) {
  return (
    <UnifiedPagination
      page={current}
      size={pageSize}
      total={total}
      onPageChange={onChange}
    />
  );
}
