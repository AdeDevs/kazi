import React from 'react';
import { FolderSearch, Plus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 sm:p-12 bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800">
      <div className="w-12 h-12 rounded-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mb-3.5 border border-zinc-200 dark:border-zinc-700">
        {icon || <FolderSearch className="w-6 h-6" strokeWidth={1.5} />}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

