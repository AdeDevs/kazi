import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular'
}) => {
  const variantStyles = {
    rectangular: 'rounded-2xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  };

  return (
    <div
      className={`bg-slate-200 dark:bg-slate-800 animate-pulse ${variantStyles[variant]} ${className}`}
    />
  );
};
