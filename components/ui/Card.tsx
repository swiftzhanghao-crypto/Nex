import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './theme';

// ── 基础卡片 ──────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ className, children, noPadding, ...rest }: CardProps) {
  return (
    <div className={cn('unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10', !noPadding && 'p-5', className)} {...rest}>
      {children}
    </div>
  );
}

// ── 可折叠模块卡片（订单详情等场景） ─────────────────────────

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}

export function CollapsibleCard({ title, icon, defaultCollapsed = false, className, headerClassName, children }: CollapsibleCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden', className)}>
      <div
        className={cn(
          'p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2 cursor-pointer select-none',
          headerClassName,
        )}
        onClick={() => setCollapsed(prev => !prev)}
      >
        {icon}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-1">{title}</h3>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', collapsed && '-rotate-90')} />
      </div>
      {!collapsed && children}
    </div>
  );
}
