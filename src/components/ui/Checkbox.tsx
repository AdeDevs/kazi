import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label content -- may include links/buttons (e.g. "I agree to the Terms"). */
  children: React.ReactNode;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * The design-system checkbox, for agreements and consents that gate an action. A real (visually
 * hidden) input keeps form semantics -- `required`, keyboard, screen readers -- and the box is drawn.
 */
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, children, id, required, disabled, className = '' }) => (
  <label className={`flex items-start gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
    <input
      id={id}
      type="checkbox"
      className="peer sr-only"
      checked={checked}
      required={required}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span
      aria-hidden="true"
      className={`mt-px w-[18px] h-[18px] shrink-0 rounded-md border flex items-center justify-center transition-[background-color,border-color,transform] duration-150 active:scale-90 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-500/60 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-slate-900 ${
        checked
          ? 'bg-navy-800 border-navy-800 dark:bg-navy-600 dark:border-navy-600 text-white'
          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
      }`}
    >
      <Check className={`w-3 h-3 transition-opacity duration-150 ${checked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3.5} />
    </span>
    <span className="min-w-0">{children}</span>
  </label>
);
