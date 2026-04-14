import React from 'react';
import { Search } from 'lucide-react';
import { cn, cls } from './theme';

// ── 文本输入 ──────────────────────────────────────────────

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: boolean;
}

const sizeMap: Record<InputSize, string> = {
  sm: cls.inputSm,
  md: cls.inputMd,
  lg: cls.inputLg,
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'lg', error, className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        cls.inputBase,
        sizeMap[inputSize],
        error && 'border-red-400 dark:border-red-500 focus:ring-red-400',
        className,
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';

// ── 下拉选择 ──────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: InputSize;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ inputSize = 'lg', className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(cls.selectBase, sizeMap[inputSize], className)}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// ── 搜索框 ───────────────────────────────────────────────

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  width?: string;
}

export function SearchField({ containerClassName, width = 'w-[300px]', className, ...rest }: SearchFieldProps) {
  return (
    <div className={cn(cls.searchField, width, containerClassName)}>
      <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
      <input
        className={cn('bg-transparent text-sm dark:text-white outline-none w-full min-w-0 px-2', className)}
        {...rest}
      />
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        cls.inputBase,
        cls.inputLg,
        'min-h-[80px] resize-y',
        error && 'border-red-400 dark:border-red-500 focus:ring-red-400',
        className,
      )}
      {...rest}
    />
  )
);
Textarea.displayName = 'Textarea';
