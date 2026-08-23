import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-none border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 ${
            icon ? 'pl-9' : ''
          } ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
};

