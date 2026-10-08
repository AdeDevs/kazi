import React, { useEffect, useRef, useState } from 'react';
import { CalendarOff, MessageSquareOff, PencilOff, X } from 'lucide-react';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { formatCurrency } from '../../utils';
import { SheetDragHandle } from './SheetDragHandle';

/**
 * The sheet for actions with consequences. One anatomy (a themed band with an icon and title, one
 * sentence, pills for what's affected, a quiet line, one clear action and a quiet way out); the
 * theme says what kind of consequence it is:
 *   frost     - a reversible pause (freeze / unfreeze)
 *   money     - money moves (pay into escrow, release payment, cancel with money held)
 *   permanent - can't be undone (delete account, delete a conversation)
 *   security  - sign-in and sessions (turn off 2FA, sign out everywhere, change password)
 * Routine confirmations stay on ConfirmationModal, so these keep their weight.
 */
export type ConsequenceTheme = 'frost' | 'money' | 'permanent' | 'security';

const THEMES: Record<ConsequenceTheme, { band: string; badge: string; title: string; desc: string; close: string; primary: string; fill: string; badgeAnim: string }> = {
  frost: {
    band: 'kh-frost',
    badge: 'bg-white/80 dark:bg-white/10 ring-sky-200/80 dark:ring-sky-300/20 text-sky-600 dark:text-sky-200 shadow-[0_8px_24px_-8px_rgba(14,116,144,0.35)]',
    title: 'text-sky-950 dark:text-white',
    desc: 'text-sky-900/70 dark:text-sky-100/70',
    close: 'text-sky-900/50 hover:text-sky-950 hover:bg-white/60 dark:text-sky-100/50 dark:hover:text-white dark:hover:bg-white/10',
    primary: 'bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white',
    fill: 'bg-navy-950',
    badgeAnim: 'kh-frost-flake',
  },
  money: {
    band: 'kh-band-money',
    badge: 'bg-white/85 dark:bg-white/10 ring-emerald-200/80 dark:ring-emerald-300/20 text-emerald-700 dark:text-emerald-200 shadow-[0_8px_24px_-8px_rgba(4,120,87,0.35)]',
    title: 'text-emerald-950 dark:text-white',
    desc: 'text-emerald-900/70 dark:text-emerald-100/70',
    close: 'text-emerald-900/50 hover:text-emerald-950 hover:bg-white/60 dark:text-emerald-100/50 dark:hover:text-white dark:hover:bg-white/10',
    primary: 'bg-emerald-700 hover:bg-emerald-800 disabled:hover:bg-emerald-700 text-white',
    fill: 'bg-emerald-950',
    badgeAnim: 'kh-badge-in',
  },
  permanent: {
    band: 'kh-band-permanent',
    badge: 'bg-white/85 dark:bg-white/10 ring-rose-200/80 dark:ring-rose-300/20 text-rose-600 dark:text-rose-200 shadow-[0_8px_24px_-8px_rgba(190,18,60,0.3)]',
    title: 'text-rose-950 dark:text-white',
    desc: 'text-rose-900/70 dark:text-rose-100/70',
    close: 'text-rose-900/50 hover:text-rose-950 hover:bg-white/60 dark:text-rose-100/50 dark:hover:text-white dark:hover:bg-white/10',
    primary: 'bg-rose-600 hover:bg-rose-700 disabled:hover:bg-rose-600 text-white',
    fill: 'bg-rose-900',
    badgeAnim: 'kh-badge-in',
  },
  security: {
    band: 'kh-band-security',
    badge: 'bg-white/85 dark:bg-white/10 ring-slate-200 dark:ring-slate-300/20 text-slate-700 dark:text-slate-200 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.3)]',
    title: 'text-slate-900 dark:text-white',
    desc: 'text-slate-600 dark:text-slate-300/80',
    close: 'text-slate-500 hover:text-slate-900 hover:bg-white/60 dark:text-slate-300/60 dark:hover:text-white dark:hover:bg-white/10',
    primary: 'bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white',
    fill: 'bg-navy-950',
    badgeAnim: 'kh-badge-in',
  },
};

/** What freezing puts on hold; shared by every freeze-related sheet. */
export const FROZEN_ON_HOLD = [
  { label: 'Bookings', Icon: CalendarOff },
  { label: 'Messages', Icon: MessageSquareOff },
  { label: 'Profile changes', Icon: PencilOff },
];

type Pill = { label: string; Icon: React.ComponentType<{ className?: string }> };

export interface ConsequenceSheetProps {
  isOpen: boolean;
  /** Ignored while `busy`. */
  onClose: () => void;
  theme: ConsequenceTheme;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: React.ReactNode;
  /** Money sheets: the amount, large in the band, and who it goes to. */
  amount?: { value: number; to?: string };
  pillsLabel?: string;
  pills?: Pill[];
  /** One quiet line under the pills. */
  note?: React.ReactNode;
  /** Extra content (a short form) between the pills and the buttons. */
  children?: React.ReactNode;
  primaryLabel: string;
  busyLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** 'hold' for actions that can't be taken back: press and hold until the button fills. */
  confirm?: 'tap' | 'hold';
  secondaryLabel: string;
  closeLabel?: string;
  busy?: boolean;
  error?: string | null;
  /** When `children` is a form, its id: Enter in the form then triggers the primary action. */
  formId?: string;
}

export const ConsequenceSheet: React.FC<ConsequenceSheetProps> = ({
  isOpen, onClose, theme, icon: Icon, title, description, amount, pillsLabel, pills, note, children,
  primaryLabel, busyLabel, onPrimary, primaryDisabled = false, confirm = 'tap', secondaryLabel, closeLabel = 'Close',
  busy = false, error = null, formId,
}) => {
  const t = THEMES[theme];
  const close = () => { if (!busy) onClose(); };
  const sheet = useSlideUpSheet(isOpen, close);
  if (!sheet.shouldRender) return null;

  const primaryClass = `w-full px-5 py-3 rounded-xl font-bold text-sm shadow-xs transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${t.primary}`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/55 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consequence-title"
        aria-describedby="consequence-desc"
        className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto overflow-x-hidden ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${t.band} relative px-5 sm:px-6 pt-2 sm:pt-7 pb-6 text-center`}>
          <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label={closeLabel}
            className={`absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full transition-colors cursor-pointer ${t.close}`}
          >
            <X className="w-4 h-4" />
          </button>
          <span className={`${t.badgeAnim} mx-auto mt-3 sm:mt-0 w-16 h-16 rounded-2xl ring-1 flex items-center justify-center ${t.badge}`} aria-hidden="true">
            <Icon className="w-8 h-8" strokeWidth={1.75} />
          </span>
          <h2 id="consequence-title" className={`mt-4 text-[22px] leading-tight font-black tracking-tight text-balance ${t.title}`}>{title}</h2>
          {amount && (
            <p className={`mt-2 tabular-nums ${t.title}`}>
              <span className="text-[32px] leading-none font-black tracking-tight">{formatCurrency(amount.value)}</span>
              {amount.to && <span className={`block mt-1.5 text-[13px] font-bold ${t.desc}`}>to {amount.to}</span>}
            </p>
          )}
          <p id="consequence-desc" className={`mt-2 text-[13px] leading-relaxed max-w-xs mx-auto text-pretty ${t.desc}`}>{description}</p>
        </div>

        <div className="px-5 sm:px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 space-y-5">
          {(pills?.length || note) && (
            <div className="space-y-2.5">
              {pillsLabel && <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 text-center">{pillsLabel}</p>}
              {pills && pills.length > 0 && (
                <ul className="flex flex-wrap justify-center gap-2">
                  {pills.map(({ label, Icon: PillIcon }) => (
                    <li key={label} className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <PillIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {note && <p className="text-xs text-slate-500 dark:text-slate-400 text-center text-pretty">{note}</p>}
            </div>
          )}

          {children}

          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center" role="alert">{error}</p>}

          <div className="space-y-1">
            {confirm === 'hold' ? (
              <HoldToConfirmButton
                label={primaryLabel}
                busyLabel={busyLabel}
                busy={busy}
                disabled={primaryDisabled}
                onConfirm={onPrimary}
                className={primaryClass}
                fillClassName={t.fill}
              />
            ) : (
              <button
                type={formId ? 'submit' : 'button'}
                form={formId}
                onClick={formId ? undefined : onPrimary}
                disabled={busy || primaryDisabled}
                className={primaryClass}
              >
                {busy && <Spinner />}
                <span>{busy ? busyLabel : primaryLabel}</span>
              </button>
            )}
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-bold text-xs transition-[color,transform] duration-150 active:scale-[0.97] cursor-pointer disabled:opacity-50"
            >
              {secondaryLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Spinner = () => <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />;

/** How long the button must be held. Long enough to be deliberate, short enough not to annoy. */
export const HOLD_MS = 1500;

/**
 * Press and hold until the button fills; letting go early snaps it back. Works with a pointer or by
 * holding Space/Enter. Assistive tech that activates with a single synthetic click confirms directly,
 * so the friction never locks anyone out.
 */
const HoldToConfirmButton: React.FC<{
  label: string; busyLabel: string; busy: boolean; disabled: boolean; onConfirm: () => void; className: string; fillClassName: string;
}> = ({ label, busyLabel, busy, disabled, onConfirm, className, fillClassName }) => {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const keyHeld = useRef(false);

  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    if (busy || disabled || timer.current !== null) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, HOLD_MS);
  };
  useEffect(() => stop, []);

  return (
    <button
      type="button"
      disabled={busy || disabled}
      data-holding={holding || undefined}
      aria-describedby="hold-hint"
      onPointerDown={(e) => { if (e.button === 0) { e.currentTarget.setPointerCapture(e.pointerId); start(); } }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); keyHeld.current = true; start(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { keyHeld.current = false; stop(); } }}
      onBlur={stop}
      onClick={(e) => {
        // A click with no pointer and no held key comes from assistive tech: confirm straight away.
        if (e.detail === 0 && !keyHeld.current && timer.current === null && !busy && !disabled) onConfirm();
      }}
      className={`kh-hold relative overflow-hidden select-none touch-none ${className}`}
    >
      <span className={`kh-hold-fill absolute inset-0 ${fillClassName}`} aria-hidden="true" />
      <span className="relative flex items-center justify-center gap-2">
        {busy && <Spinner />}
        <span>{busy ? busyLabel : holding ? 'Keep holding…' : label}</span>
      </span>
      <span id="hold-hint" className="sr-only">Press and hold to confirm.</span>
    </button>
  );
};
