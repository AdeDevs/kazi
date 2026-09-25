import React, { useEffect, useState } from 'react';
import { SendHorizontal, X } from 'lucide-react';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { SheetDragHandle } from '../ui/SheetDragHandle';

interface PhotoPreviewSheetProps {
  /** The (already compressed) photo to confirm, or null when closed. */
  photo: string | null;
  recipientName: string;
  onCancel: () => void;
  onSend: (caption: string) => void;
}

const CAPTION_LIMIT = 500;

/** Shows the photo you picked, with an optional caption, before it's sent. */
export const PhotoPreviewSheet: React.FC<PhotoPreviewSheetProps> = ({ photo, recipientName, onCancel, onSend }) => {
  const [caption, setCaption] = useState('');
  const [shown, setShown] = useState<string | null>(photo);
  const sheet = useSlideUpSheet(Boolean(photo), onCancel);

  // Keep the last photo on screen through the closing animation.
  useEffect(() => {
    if (photo) {
      setShown(photo);
      setCaption('');
    }
  }, [photo]);

  if (!sheet.shouldRender || !shown) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 ${sheet.backdropAnimationClasses}`}
      onClick={onCancel}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(caption.trim()); }}
        onClick={(e) => e.stopPropagation()}
        style={sheet.dragStyle}
        className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-3.5 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92dvh] flex flex-col ${sheet.sheetAnimationClasses}`}
      >
        <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">Send photo to {recipientName}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="p-2 -m-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          <img src={shown} alt="Photo to send" className="max-h-[52dvh] w-full object-contain" />
        </div>

        <div>
          <label htmlFor="photo-caption" className="sr-only">Caption</label>
          <textarea
            id="photo-caption"
            rows={2}
            maxLength={CAPTION_LIMIT}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend(caption.trim());
              }
            }}
            placeholder="Add a caption (optional)"
            enterKeyHint="send"
            className="w-full resize-none px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Send photo</span>
          </button>
        </div>
      </form>
    </div>
  );
};
