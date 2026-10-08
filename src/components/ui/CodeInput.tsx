import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

/**
 * Inputs for two-step sign-in codes: a 6-digit authenticator code (one box per digit) and a backup
 * code (two 4-character boxes around a fixed hyphen). Shared by the sign-in page ("auth" look) and
 * Settings ("app" look).
 */
export type CodeInputAppearance = 'auth' | 'app';

/** Backup codes look like "469E-EE06": two groups of four hex characters. Taken from real codes;
 * the backend hasn't documented the format yet (backend ask 46). */
const BACKUP_IN_TEXT = /\b[0-9A-F]{4}-[0-9A-F]{4}\b/gi;
const BACKUP_BARE = /^[0-9A-F]{8}$/i;
const SEGMENT_CHARS = /[^A-Z0-9]/g;
export const isCompleteBackupCode = (v: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v);

const boxClass = (appearance: CodeInputAppearance) =>
  appearance === 'auth'
    ? "kh-otp text-center font-['Bricolage_Grotesque',sans-serif] font-extrabold"
    : 'text-center font-bold rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-navy-800 focus:ring-2 focus:ring-navy-800/20 aria-[invalid=true]:border-rose-500 transition-[border-color,box-shadow] duration-150';

export interface CodeInputHandle {
  focus: () => void;
}

// ───────────────────────── Authenticator digits ─────────────────────────

interface DigitCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when typing, pasting or autofill completes the last digit. */
  onComplete?: (value: string) => void;
  length?: number;
  invalid?: boolean;
  disabled?: boolean;
  appearance?: CodeInputAppearance;
  /** Accessible name for the group, e.g. "6-digit code". */
  label: string;
  idPrefix: string;
}

export const DigitCodeInput = forwardRef<CodeInputHandle, DigitCodeInputProps>(function DigitCodeInput(
  { value, onChange, onComplete, length = 6, invalid = false, disabled = false, appearance = 'auth', label, idPrefix },
  ref,
) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const focusBox = (i: number) => boxes.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  useImperativeHandle(ref, () => ({ focus: () => focusBox(value.length >= length ? length - 1 : value.length) }));

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length && value.length < length) onComplete?.(clean);
    return clean;
  };

  // Writes `incoming` digits starting at box `start` (several at once for paste and autofill).
  const fillFrom = (start: number, incoming: string) => {
    const chars = incoming.replace(/\D/g, '');
    if (!chars) return;
    // A full code pasted anywhere replaces the whole thing.
    const base = chars.length >= length ? '' : digits.slice(0, start).join('');
    const next = commit((base + chars).slice(0, length));
    focusBox(Math.min(next.length, length - 1));
  };

  const handleChange = (i: number, raw: string) => {
    const chars = raw.replace(/\D/g, '');
    if (!chars) {
      // The box was cleared; keep the digits before it.
      commit(digits.slice(0, i).join('') + digits.slice(i + 1).join(''));
      return;
    }
    // Typing over a filled box gives two characters; keep the new one.
    const typed = chars.length === 2 && digits[i] ? chars.replace(digits[i], '') || chars[1] : chars;
    if (typed.length > 1) return fillFrom(i, typed);
    const arr = [...digits];
    arr[i] = typed;
    // Keep digits contiguous: a box past the first gap fills the gap instead.
    const next = commit(arr.join(''));
    focusBox(Math.min(next.length, length - 1));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      commit(digits.slice(0, i - 1).join(''));
      focusBox(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const size = appearance === 'auth'
    ? 'w-[46px] h-[58px] text-[26px] sm:w-[54px] sm:h-[64px] sm:text-[28px]'
    : 'w-10 h-12 text-lg';

  return (
    <div role="group" aria-label={label} className={`flex ${appearance === 'auth' ? 'gap-2 sm:gap-2.5' : 'gap-1.5 sm:gap-2'}`}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`${idPrefix}-${i}`}
          ref={(el) => { boxes.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          maxLength={length}
          value={d}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => { e.preventDefault(); fillFrom(i, e.clipboardData.getData('text')); }}
          className={`${boxClass(appearance)} ${size} tabular-nums disabled:opacity-60`}
        />
      ))}
    </div>
  );
});

// ───────────────────────── Backup code ─────────────────────────

interface BackupCodeInputProps {
  /** "AAAA-BBBB", possibly partial. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  appearance?: CodeInputAppearance;
  idPrefix: string;
}

const splitValue = (v: string): [string, string] => {
  const [a = '', b = ''] = v.split('-');
  return [a, b];
};
const joinValue = (a: string, b: string) => (a || b ? `${a}-${b}` : '');

export const BackupCodeInput = forwardRef<CodeInputHandle, BackupCodeInputProps>(function BackupCodeInput(
  { value, onChange, invalid = false, disabled = false, appearance = 'auth', idPrefix },
  ref,
) {
  const first = useRef<HTMLInputElement | null>(null);
  const second = useRef<HTMLInputElement | null>(null);
  const [a, b] = splitValue(value);
  // Several codes pasted at once (the whole saved list): let the person pick one they haven't used.
  const [found, setFound] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({ focus: () => (a.length === 4 ? second.current : first.current)?.focus() }));

  const clean = (s: string) => s.toUpperCase().replace(SEGMENT_CHARS, '');

  const choose = (code: string) => {
    const [x, y] = splitValue(code.toUpperCase());
    onChange(joinValue(x, y));
    setFound([]);
    second.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const codes = Array.from(new Set((text.match(BACKUP_IN_TEXT) || []).map((c) => c.toUpperCase())));
    const bare = text.trim().replace(/\s/g, '');
    if (codes.length > 1) {
      e.preventDefault();
      setFound(codes);
    } else if (codes.length === 1) {
      e.preventDefault();
      choose(codes[0]);
    } else if (BACKUP_BARE.test(bare)) {
      e.preventDefault();
      choose(`${bare.slice(0, 4)}-${bare.slice(4)}`);
    }
    // Anything else pastes normally into the box it landed in.
  };

  const changeFirst = (raw: string) => {
    const v = clean(raw);
    if (v.length > 4) {
      // Typed or autofilled straight through: carry the rest into the second box.
      onChange(joinValue(v.slice(0, 4), (v.slice(4) + b).slice(0, 4)));
      second.current?.focus();
      return;
    }
    onChange(joinValue(v, b));
    if (v.length === 4) second.current?.focus();
  };

  const changeSecond = (raw: string) => onChange(joinValue(a, clean(raw).slice(0, 4)));

  const segment = appearance === 'auth'
    ? 'w-[120px] h-[58px] text-[24px] sm:w-[132px] sm:h-[64px] sm:text-[26px] tracking-[0.18em]'
    : 'w-24 h-12 text-base tracking-[0.18em]';

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Backup code" className="flex items-center gap-2.5">
        <input
          ref={first}
          id={`${idPrefix}-a`}
          type="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Backup code, first four characters"
          aria-invalid={invalid || undefined}
          disabled={disabled}
          maxLength={9}
          placeholder="XXXX"
          value={a}
          onFocus={(e) => e.target.select()}
          onPaste={handlePaste}
          onChange={(e) => changeFirst(e.target.value)}
          className={`${boxClass(appearance)} ${segment} font-mono uppercase placeholder:opacity-30 disabled:opacity-60`}
        />
        <span aria-hidden="true" className="text-2xl font-black opacity-50">–</span>
        <input
          ref={second}
          id={`${idPrefix}-b`}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Backup code, last four characters"
          aria-invalid={invalid || undefined}
          disabled={disabled}
          maxLength={4}
          placeholder="XXXX"
          value={b}
          onFocus={(e) => e.target.select()}
          onPaste={handlePaste}
          onChange={(e) => changeSecond(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !b) { e.preventDefault(); first.current?.focus(); } }}
          className={`${boxClass(appearance)} ${segment} font-mono uppercase placeholder:opacity-30 disabled:opacity-60`}
        />
      </div>

      {found.length > 0 && (
        <div className="flex flex-col gap-2" role="group" aria-label="Codes found in what you pasted">
          <p className="text-[13px] font-semibold">
            Found {found.length} codes. Pick one you haven’t used yet; each works once.
          </p>
          <div className="flex flex-wrap gap-2">
            {found.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => choose(code)}
                className={appearance === 'auth'
                  ? 'kh-role px-3 py-1.5 rounded-xl border-2 font-mono text-sm font-bold cursor-pointer'
                  : 'px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-navy-800 font-mono text-xs font-bold cursor-pointer'}
              >
                {code}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setFound([])} className="self-start text-[13px] font-bold underline underline-offset-2 cursor-pointer">
            Clear list
          </button>
        </div>
      )}
    </div>
  );
});
