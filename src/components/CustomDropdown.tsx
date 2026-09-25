import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  /** Match the text inputs it sits beside in a form: bold, and 16px on touch screens like them. */
  asFormField?: boolean;
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
  align = 'auto',
  asFormField = false
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // The menu renders in a portal with fixed positioning, so no ancestor's overflow or height can
  // clip it (cards with overflow-hidden, scrolling sheets, modals). Placement is measured from the
  // trigger: below it when there's room, above it otherwise; aligned to whichever side fits.
  const [placement, setPlacement] = useState<React.CSSProperties | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPlacement(null);
      return;
    }
    const place = () => {
      const trigger = containerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const menuHeight = Math.min(256, menuRef.current?.scrollHeight ?? 256);
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
      const minWidth = dropdownWidth === 'w-full' ? Math.max(rect.width, 200) : undefined;
      const alignRight = align === 'right' || (align === 'auto' && window.innerWidth - rect.left < 240);
      setPlacement({
        position: 'fixed',
        ...(openUp ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
        ...(alignRight ? { right: Math.max(12, window.innerWidth - rect.right) } : { left: Math.max(12, rect.left) }),
        minWidth,
        maxHeight: Math.max(160, Math.min(256, (openUp ? rect.top : spaceBelow) - 12)),
      });
    };
    place();
    // Scrolling the page (not the menu's own list) closes it, like a native select.
    const onScroll = (event: Event) => {
      if (menuRef.current && event.target instanceof Node && menuRef.current.contains(event.target)) return;
      setIsOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, align, dropdownWidth]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative block text-left ${className}`}>
      {/* Trigger Button. Sizing/spacing/radius are fixed here, not part of buttonClassName --
          every dropdown in the app should be pixel-identical by construction (same padding, same
          radius, same chevron position) rather than by each caller happening to pass the same
          values; buttonClassName is for color/border/background only. */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-xl border text-xs ${asFormField ? 'font-bold form-field-text' : 'font-semibold'} focus:outline-none focus:ring-2 focus:ring-navy-500/50 dark:focus:ring-navy-400/50 transition-all cursor-pointer shadow-xs ${
          buttonClassName || 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-navy-500/50 dark:hover:border-navy-400/50'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
          {icon && <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-navy-800 dark:text-navy-400' : ''}`} strokeWidth={2} />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={placement ?? { position: 'fixed', visibility: 'hidden' }}
          className={`min-w-[200px] sm:min-w-[220px] max-w-[calc(100vw-24px)] ${dropdownWidth === 'w-full' ? '' : dropdownWidth} z-[80] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl p-1.5 space-y-0.5 overflow-y-auto overscroll-contain no-scrollbar animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
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
        </div>,
        document.body
      )}
    </div>
  );
}

