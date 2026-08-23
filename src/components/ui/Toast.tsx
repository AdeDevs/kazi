import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />,
    info: <Info className="w-4 h-4 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
  };

  const borders = {
    success: 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
    error: 'border-rose-300 dark:border-rose-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
    info: 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
  };

  const type = toast.type || 'success';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-2 duration-150">
      <div className={`flex items-start gap-2.5 p-3.5 rounded-none border shadow-lg ${borders[type]}`}>
        <div className="shrink-0 pt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{toast.title}</h4>
          {toast.message && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{toast.message}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded-none text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

