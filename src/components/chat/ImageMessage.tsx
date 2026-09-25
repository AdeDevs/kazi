import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageMessageProps {
  src: string;
  caption?: string;
  sending?: boolean;
  onOpen: () => void;
}

/** Text the backend or older clients store in place of a real caption. */
const PLACEHOLDER_CAPTIONS = new Set(['photo', 'photo attachment', 'image']);
export const imageCaption = (text?: string) =>
  text && !PLACEHOLDER_CAPTIONS.has(text.trim().toLowerCase()) ? text : undefined;

/**
 * A photo inside a chat bubble: a fixed-width frame that holds its place while loading (so the
 * thread doesn't jump), the photo at its own shape within limits, a spinner while sending, and
 * the caption under it.
 */
export const ImageMessage: React.FC<ImageMessageProps> = ({ src, caption, sending = false, onOpen }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="w-[232px] sm:w-[264px] max-w-full">
      <button
        type="button"
        onClick={onOpen}
        disabled={failed}
        aria-label="Open photo"
        className="relative block w-full rounded-xl overflow-hidden bg-slate-200/70 dark:bg-slate-700/60 cursor-zoom-in disabled:cursor-default"
        style={loaded ? undefined : { aspectRatio: '4 / 3' }}
      >
        {failed ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-500">
            <ImageOff className="w-5 h-5" />
            Photo couldn’t load
          </span>
        ) : (
          <img
            src={src}
            alt={caption || 'Photo'}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`w-full max-h-[320px] object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {!loaded && !failed && <span className="absolute inset-0 animate-pulse bg-slate-300/40 dark:bg-slate-600/40" aria-hidden="true" />}
        {sending && (
          <span className="absolute inset-0 bg-slate-950/35 flex items-center justify-center" aria-label="Sending photo">
            <span className="w-8 h-8 rounded-full border-[3px] border-white/35 border-t-white animate-spin" />
          </span>
        )}
      </button>
      {caption && <p className="px-1.5 pt-1.5 whitespace-pre-wrap break-words">{caption}</p>}
    </div>
  );
};
