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
  align?: 'left' | 'right' | 'auto';
}

export function CustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  icon,
  className = '',
  buttonClassName = '',
  dropdownWidth = 'w-full',
  align = 'auto'
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(align === 'right');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        // If the right edge of container plus menu buffer overflows viewport or is in right 40% of screen
        const spaceOnRight = window.innerWidth - rect.left;
        if (spaceOnRight < 240 || rect.right > window.innerWidth - 60) {
          setAlignRight(true);
        } else {
          setAlignRight(false);
        }
      }
    }
  }, [isOpen, align]);

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
    <div ref={containerRef} className={`relative block text-left ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      {/* Trigger Button with Rounded Corners & Brand Styling */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 dark:focus:ring-brand-orange-400/50 transition-all cursor-pointer shadow-xs ${
          buttonClassName || 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-brand-orange-500/50 dark:hover:border-brand-orange-400/50'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-navy-800 dark:text-navy-400' : ''}`} strokeWidth={1.75} />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className={`absolute ${alignRight ? 'right-0 left-auto' : 'left-0 right-auto'} mt-1.5 min-w-[200px] sm:min-w-[220px] max-w-[calc(100vw-24px)] ${dropdownWidth} z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl p-1.5 space-y-0.5 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100`}>
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

