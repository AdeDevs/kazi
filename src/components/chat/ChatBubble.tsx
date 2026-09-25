import React from 'react';
import { AlertCircle, Check, CheckCheck, Clock3 } from 'lucide-react';

export type BubbleStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface ChatBubbleProps {
  isMine: boolean;
  timestamp: string;
  /** Only shown on your own messages. */
  status?: BubbleStatus;
  onRetry?: () => void;
  /** Photo/voice/location bubbles get less padding around their media. */
  media?: boolean;
  /** Put the time and ticks over the content (a photo with no caption), not under it. */
  overlayFooter?: boolean;
  /** The content renders the time and ticks itself (a voice note puts them on its own second line). */
  hideFooter?: boolean;
  children: React.ReactNode;
}

export const formatChatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** "Today", "Yesterday", a weekday within the last week, else a date -- for the separators between days. */
export function formatChatDay(iso: string): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export const ChatDaySeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex justify-center py-1.5" role="separator" aria-label={label}>
    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400">
      {label}
    </span>
  </div>
);

const StatusIcon: React.FC<{ status: BubbleStatus }> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <Clock3 className="w-3 h-3" aria-label="Sending" />;
    case 'read':
      return <CheckCheck className="w-3.5 h-3.5 text-sky-300" aria-label="Read" />;
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5" aria-label="Delivered" />;
    case 'failed':
      return <AlertCircle className="w-3.5 h-3.5 text-rose-300" aria-label="Not sent" />;
    default:
      return <Check className="w-3.5 h-3.5" aria-label="Sent" />;
  }
};

/** The time and (on your own messages) the read ticks -- for content that lays out its own footer. */
export const BubbleMeta: React.FC<{ isMine: boolean; timestamp: string; status?: BubbleStatus }> = ({ isMine, timestamp, status }) => (
  <span className={`flex items-center gap-1 text-[10px] leading-none ${isMine ? 'text-white/65' : 'text-slate-400'}`}>
    <span>{formatChatTime(timestamp)}</span>
    {isMine && status && <StatusIcon status={status} />}
  </span>
);

/** One chat message bubble, shared by the client and artisan chat screens so they look identical. */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ isMine, timestamp, status, onRetry, media = false, overlayFooter = false, hideFooter = false, children }) => (
  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
    <div
      className={`relative max-w-[82%] sm:max-w-[65%] rounded-2xl ${media ? 'p-1.5' : 'px-3 py-2'} text-[13px] sm:text-sm leading-[1.45] ${
        isMine
          ? 'bg-navy-900 text-white rounded-br-md'
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-md'
      } ${status === 'sending' ? 'opacity-80' : ''}`}
    >
      {children}
      {!hideFooter && <div className={overlayFooter
        ? 'absolute right-3 bottom-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/55 text-white text-[10px] leading-none'
        : `flex items-center justify-end gap-1 mt-0.5 text-[10px] leading-none ${media ? 'px-1.5 pb-0.5' : ''} ${isMine ? 'text-white/65' : 'text-slate-400'}`}>
        <span>{formatChatTime(timestamp)}</span>
        {isMine && status && <StatusIcon status={status} />}
      </div>}
    </div>
    {isMine && status === 'failed' && (
      <button
        type="button"
        onClick={onRetry}
        disabled={!onRetry}
        className="mt-1 px-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer disabled:cursor-default"
      >
        {onRetry ? 'Not sent. Tap to retry' : 'Not sent'}
      </button>
    )}
  </div>
);
