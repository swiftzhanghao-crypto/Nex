import React from 'react';
import { cn } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:   'unified-button-primary',
  secondary: 'unified-button-secondary',
  ghost:     'unified-button-ghost',
  danger:    'unified-button-danger',
  link:      'unified-button-link',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, iconRight, loading, className, children, disabled, ...rest }, ref) => {
    const isLink = variant === 'link';
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          isLink ? variantClass.link : variantClass[variant],
          !isLink && sizeClass[size],
          loading && 'opacity-70 pointer-events-none',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
