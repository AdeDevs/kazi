import React from 'react';
import { AlertTriangle, Info, HelpCircle, Trash2, Snowflake, LogOut, CheckCircle2, X } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'logout' | 'freeze';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  details?: string[];
  isLoading?: boolean;
  showIcon?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  details,
  isLoading = false,
  showIcon
}) => {
  if (!isOpen) return null;

  const shouldRenderIcon = showIcon !== undefined ? showIcon : type !== 'logout';

  const getIcon = () => {
    if (!shouldRenderIcon) return null;
    switch (type) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'freeze':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Snowflake className="w-6 h-6" />
          </div>
        );
      case 'logout':
        return null;
      case 'info':
        return (
          <div className="w-12 h-12 rounded-2xl bg-navy-800/10 dark:bg-navy-400/20 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs';
      case 'freeze':
        return 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs';
      case 'logout':
        return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs';
      case 'info':
        return 'bg-navy-900 hover:bg-navy-950 text-white shadow-xs';
      case 'warning':
      default:
        return 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200 p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250 ease-out max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mb-2" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Dismiss"
          aria-label="Dismiss modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pr-6">
          {getIcon()}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Optional Bulleted Details */}
        {details && details.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium">
            {details.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-transform active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
