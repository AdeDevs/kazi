import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'stripe';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors border rounded-none focus:outline-none focus:ring-1 focus:ring-navy-900 dark:focus:ring-navy-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none';
  
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[32px]',
    md: 'px-3.5 py-2 text-xs font-semibold gap-2 min-h-[38px]',
    lg: 'px-5 py-2.5 text-sm font-semibold gap-2.5 min-h-[44px]'
  };

  const variantStyles = {
    primary: 'bg-navy-900 dark:bg-navy-100 text-white dark:text-navy-900 border-navy-900 dark:border-navy-100 hover:bg-navy-800 dark:hover:bg-navy-200',
    accent: 'bg-brand-orange-600 text-white border-brand-orange-600 hover:bg-brand-orange-700',
    secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700',
    outline: 'border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
    ghost: 'border-transparent bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
    danger: 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700',
    stripe: 'bg-navy-900 dark:bg-navy-100 text-white dark:text-navy-900 border-navy-900 dark:border-navy-100 hover:bg-navy-800 dark:hover:bg-navy-200'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.5} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

