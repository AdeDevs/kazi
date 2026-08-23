import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  dropdownWidth?: string;
}

export function CustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  icon,
  className = '',
  buttonClassName = '',
  dropdownWidth = 'w-full'
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      {/* Trigger Button with Rounded Corners & Brand Styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-navy-800/40 dark:focus:ring-navy-400/40 transition-all cursor-pointer shadow-xs ${
          buttonClassName || 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-navy-700/50 dark:hover:border-navy-400/50'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-navy-800 dark:text-navy-400' : ''}`} strokeWidth={1.75} />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className={`absolute left-0 right-0 sm:right-auto mt-1.5 min-w-[210px] ${dropdownWidth} z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl p-1.5 space-y-0.5 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100`}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-navy-800 text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

