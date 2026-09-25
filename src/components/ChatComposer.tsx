import React, { useLayoutEffect, useRef } from 'react';
import { Mic, Paperclip, Pause, SendHorizontal, Trash2 } from 'lucide-react';
import { formatClock } from './chat/VoiceNotePlayer';

/** While a voice note is being recorded, the composer becomes the recorder in place. */
export interface ComposerRecording {
  seconds: number;
  /** Live meter, 0–1 per bar, oldest first. */
  levels: number[];
  paused: boolean;
  /** True between tapping send and the recording being handed over. */
  sending: boolean;
  onPause: () => void;
  onResume: () => void;
  onDiscard: () => void;
  onSend: () => void;
}

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
  /** Set while recording: the row's controls turn into the recorder's, without moving. */
  recording?: ComposerRecording | null;
  /** Called when the field gains focus -- e.g. to re-scroll the thread above the keyboard. */
  onFocus?: () => void;
}

// One line of text: 40px, the same as the buttons beside it. The field grows only when the text
// wraps (up to MAX), never on focus -- so opening the keyboard can't change the bar's height.
// (Touch screens render the text at 16px so iOS doesn't zoom; the 20px line box still fits.)
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 120;

const EASE = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

const iconButton =
  `w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.94] hover:bg-slate-50 hover:text-navy-800 dark:hover:bg-slate-800 dark:hover:text-navy-300`;

/** Two controls sharing one 40px slot; the one for the current mode fades and scales in. */
const Swap: React.FC<{ showSecond: boolean; first: React.ReactNode; second: React.ReactNode }> = ({ showSecond, first, second }) => (
  <div className="relative w-10 h-10 shrink-0">
    <div className={`absolute inset-0 transition-[opacity,transform] duration-200 ${EASE} ${showSecond ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}>
      {first}
    </div>
    <div className={`absolute inset-0 transition-[opacity,transform] duration-200 ${EASE} ${showSecond ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
      {second}
    </div>
  </div>
);

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value, onChange, onSend, placeholder, quickReplies = [], onQuickReply, onAttach, attachActive = false, onMic, recording, onFocus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;
  const isRecording = Boolean(recording);
  const canSend = recording ? !recording.sending : hasText;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = `${MIN_HEIGHT}px`;
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [value]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (recording) recording.onSend();
    else if (hasText) onSend();
  };

  return (
    <div>
      {!hasText && quickReplies.length > 0 && onQuickReply && (
        <div
          className={`flex gap-1.5 overflow-x-auto no-scrollbar px-3 sm:px-4 py-2 border-t border-slate-200/90 dark:border-slate-800 [touch-action:pan-x] transition-opacity duration-200 ${isRecording ? 'opacity-40 pointer-events-none' : ''}`}
          aria-hidden={isRecording || undefined}
        >
          {quickReplies.map(reply => (
            <button
              key={reply}
              type="button"
              tabIndex={isRecording ? -1 : undefined}
              onClick={() => onQuickReply(reply)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.97] hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex items-end gap-2 px-3 sm:px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        {/* Paperclip ↔ discard: the destructive action sits furthest from send. */}
        {onAttach && (
          <Swap
            showSecond={isRecording}
            first={
              <button
                type="button"
                onClick={onAttach}
                tabIndex={isRecording ? -1 : undefined}
                aria-label="Attach a photo or location"
                aria-expanded={attachActive}
                className={`${iconButton} ${attachActive ? '!bg-navy-800 !text-white !border-navy-800' : ''}`}
              >
                <Paperclip className="w-[17px] h-[17px]" />
              </button>
            }
            second={
              <button
                type="button"
                onClick={recording?.onDiscard}
                disabled={recording?.sending}
                tabIndex={isRecording ? undefined : -1}
                aria-label="Discard recording"
                className={`${iconButton} !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/40`}
              >
                <Trash2 className="w-[17px] h-[17px]" />
              </button>
            }
          />
        )}

        {/* Mic ↔ pause/resume: the recording control stays where recording started. */}
        {onMic && (
          <Swap
            showSecond={isRecording}
            first={
              <button type="button" onClick={onMic} tabIndex={isRecording ? -1 : undefined} aria-label="Record a voice note" className={iconButton}>
                <Mic className="w-[17px] h-[17px]" />
              </button>
            }
            second={
              <button
                type="button"
                onClick={recording?.paused ? recording.onResume : recording?.onPause}
                disabled={recording?.sending}
                tabIndex={isRecording ? undefined : -1}
                aria-label={recording?.paused ? 'Resume recording' : 'Pause recording'}
                className={`${iconButton} ${recording?.paused ? '!text-rose-600 dark:!text-rose-400' : ''}`}
              >
                {recording?.paused ? <Mic className="w-[17px] h-[17px]" /> : <Pause className="w-[17px] h-[17px] fill-current" />}
              </button>
            }
          />
        )}

        {/* The text field stays in the layout while recording (just invisible), so the row keeps
            its exact height; the recording field fades in over it. */}
        <div className="relative flex-1 min-w-0">
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
            aria-hidden={isRecording || undefined}
            tabIndex={isRecording ? -1 : undefined}
            readOnly={isRecording}
            style={{ height: MIN_HEIGHT }}
            className={`block w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-[9px] text-sm leading-5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-800 dark:focus:border-navy-400 overflow-y-auto transition-opacity duration-200 ${isRecording ? 'opacity-0' : 'opacity-100'}`}
          />
          <div
            role="status"
            aria-hidden={!isRecording || undefined}
            aria-label={recording ? `${recording.paused ? 'Paused' : 'Recording'}, ${formatClock(recording.seconds)}` : undefined}
            className={`absolute inset-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden transition-[opacity,transform] duration-200 ${EASE} ${
              isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none'
            }`}
          >
            {/* The meter spans the whole field, edge to edge, and dissolves as it runs under the
                timer: faint behind the dot and digits, full strength from just past them. Newest bar
                on the right; older bars overflow off the left edge and are clipped. */}
            <div
              className="absolute inset-y-0 left-0 right-3 flex items-center justify-end gap-[2px] overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0, transparent 44px, rgba(0,0,0,0.06) 72px, rgba(0,0,0,0.3) 150px, black 250px)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0, transparent 44px, rgba(0,0,0,0.06) 72px, rgba(0,0,0,0.3) 150px, black 250px)',
              }}
              aria-hidden="true"
            >
              {(recording?.levels ?? []).map((level, i) => (
                <span
                  key={i}
                  className={`w-[3px] shrink-0 rounded-full transition-colors duration-200 ${recording?.paused ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-400'}`}
                  style={{ height: `${Math.max(3, Math.round(level * 24))}px` }}
                />
              ))}
            </div>
            <div className="relative h-full inline-flex items-center gap-2 pl-3.5">
              <span className="relative flex w-2 h-2 shrink-0" aria-hidden="true">
                {recording && !recording.paused && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60" />}
                <span className={`relative w-2 h-2 rounded-full ${recording?.paused ? 'bg-slate-400' : 'bg-rose-500'}`} />
              </span>
              <span className={`text-xs font-bold tabular-nums ${recording?.paused ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatClock(recording?.seconds ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSend}
          aria-label={isRecording ? 'Send voice note' : 'Send message'}
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-[background-color,color,transform] duration-200 active:scale-[0.94] ${
            canSend || recording?.sending ? 'bg-navy-800 hover:bg-navy-900 text-white cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {recording?.sending
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <SendHorizontal className="w-[17px] h-[17px]" />}
        </button>
      </form>
    </div>
  );
};
