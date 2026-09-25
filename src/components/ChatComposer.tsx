import React, { useLayoutEffect, useRef } from 'react';
import { Mic, Paperclip, SendHorizontal } from 'lucide-react';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  /** Tap-to-send suggestions, shown only while the field is empty. */
  quickReplies?: string[];
  onQuickReply?: (text: string) => void;
  onAttach?: () => void;
  attachActive?: boolean;
  onMic?: () => void;
  /** Called when the field gains focus -- e.g. to re-scroll the thread above the keyboard. */
  onFocus?: () => void;
}

// One line of text: 44px, the same as the buttons beside it. The field grows only when the text
// wraps (up to MAX), never on focus -- so opening the keyboard can't change the bar's height.
const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

const iconButton =
  'w-11 h-11 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.96] hover:bg-slate-50 hover:text-navy-800 dark:hover:bg-slate-800 dark:hover:text-navy-300';

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value, onChange, onSend, placeholder, quickReplies = [], onQuickReply, onAttach, attachActive = false, onMic, onFocus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${MIN_HEIGHT}px`;
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (hasText) onSend();
  };

  return (
    <div>
      {!hasText && quickReplies.length > 0 && onQuickReply && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 sm:px-4 py-2.5 border-t border-slate-200/90 dark:border-slate-800 [touch-action:pan-x]">
          {quickReplies.map(reply => (
            <button
              key={reply}
              type="button"
              onClick={() => onQuickReply(reply)}
              className="shrink-0 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex items-end gap-2 sm:gap-2.5 px-3 sm:px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        {onAttach && (
          <button
            type="button"
            onClick={onAttach}
            aria-label="Attach a photo or location"
            aria-expanded={attachActive}
            className={`${iconButton} ${attachActive ? '!bg-navy-800 !text-white !border-navy-800' : ''}`}
          >
            <Paperclip className="w-[18px] h-[18px]" />
          </button>
        )}
        {onMic && (
          <button type="button" onClick={onMic} aria-label="Record a voice note" className={iconButton}>
            <Mic className="w-[18px] h-[18px]" />
          </button>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          placeholder={placeholder}
          enterKeyHint="send"
          aria-label="Message"
          style={{ height: MIN_HEIGHT }}
          className="flex-1 min-w-0 resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-[11px] text-sm leading-[22px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-800 dark:focus:border-navy-400 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!hasText}
          aria-label="Send message"
          className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-[0.96] ${
            hasText ? 'bg-navy-800 hover:bg-navy-900 text-white cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <SendHorizontal className="w-[18px] h-[18px]" />
        </button>
      </form>
    </div>
  );
};
