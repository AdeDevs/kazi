import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name when there's no visible label wired via aria-labelledby. */
  label: string;
  disabled?: boolean;
  /** Shows a spinner in the thumb while the change is being saved. */
  busy?: boolean;
  className?: string;
}

/** The design-system on/off switch. Use it for settings that take effect on change. */
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false, busy = false, className = '' }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    aria-busy={busy || undefined}
    disabled={disabled || busy}
    onClick={() => onChange(!checked)}
    // The visible track is 40x24; the padding brings the tap target up to 44px tall.
    className={`group relative inline-flex items-center shrink-0 p-2.5 -m-2.5 rounded-full cursor-pointer disabled:cursor-not-allowed focus:outline-none ${className}`}
  >
    <span
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-navy-500/60 group-focus-visible:ring-offset-2 dark:group-focus-visible:ring-offset-slate-900 ${
        checked ? 'bg-navy-800 dark:bg-navy-600' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-95 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      >
        {busy && <span className="w-3 h-3 border-2 border-slate-300 border-t-navy-800 rounded-full animate-spin" />}
      </span>
    </span>
  </button>
);
