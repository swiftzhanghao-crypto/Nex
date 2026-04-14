import React from 'react';
import { cn, TagColor, tagClassMap } from './theme';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: TagColor;
  size?: 'xs' | 'sm';
  pill?: boolean;
}

export default function Badge({ color = 'blue', size = 'sm', pill, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        tagClassMap[color],
        size === 'xs' && 'unified-tag-xs',
        pill && '!rounded-full',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
