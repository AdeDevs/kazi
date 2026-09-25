import React from 'react';
import { formatNigerianPhone, isValidNigerianPhone } from '../../lib/inputRules';

interface PhoneFieldProps {
  id: string;
  /** Any stored or typed form ("+2348023456789", "0802…", "802 345 6789"); shown grouped. */
  value: string;
  onChange: (display: string) => void;
  required?: boolean;
}

/**
 * Nigerian mobile number input: a fixed +234 prefix and only the 10 national digits, grouped as
 * they're typed. Save it with toStoredPhone(); check it with isValidNigerianPhone().
 */
export const PhoneField: React.FC<PhoneFieldProps> = ({ id, value, onChange, required }) => {
  const display = formatNigerianPhone(value);
  const invalid = display.length > 0 && !isValidNigerianPhone(display);
  return (
    <div>
      <div
        className={`flex rounded-xl border overflow-hidden bg-slate-50 dark:bg-slate-800 focus-within:ring-2 focus-within:ring-navy-500/50 ${
          invalid ? 'border-rose-400 dark:border-rose-500/70' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <span className="inline-flex items-center px-3 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 select-none">
          +234
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={display}
          onChange={(e) => onChange(formatNigerianPhone(e.target.value))}
          placeholder="802 345 6789"
          required={required}
          aria-invalid={invalid}
          className="w-full min-w-0 px-3 py-2.5 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
        />
      </div>
      {invalid && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">Enter a valid Nigerian mobile number, e.g. 802 345 6789.</p>
      )}
    </div>
  );
};

/** "+234 802 345 6789" for read-only display, or '' when there's no number. */
export const displayPhone = (value?: string | null) => {
  const grouped = formatNigerianPhone(value || '');
  return grouped ? `+234 ${grouped}` : '';
};
