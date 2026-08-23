import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800',
    elevated: 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-sm',
    bordered: 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-3.5 sm:p-4',
    lg: 'p-4 sm:p-5'
  };

  return (
    <div
      className={`rounded-none transition-colors ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

