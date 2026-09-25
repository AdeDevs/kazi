import React, { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, MapPin } from 'lucide-react';

interface AttachmentMenuProps {
  open: boolean;
  onClose: () => void;
  onPickPhoto: (file: File) => void;
  onShareLocation: () => void;
  locating?: boolean;
}

/**
 * The paperclip's menu, anchored above the composer's left edge: take a photo, choose one, or
 * share your location. Grows from the paperclip; closes on outside tap or Escape.
 */
export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ open, onClose, onPickPhoto, onShareLocation, locating = false }) => {
  const [mounted, setMounted] = useState(open);
  const ref = useRef<HTMLDivElement>(null);

  // Stay mounted through the closing transition.
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), 160);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Any copy of this menu counts as inside: chat screens render the composer in both a mobile
      // and a desktop layout, and the hidden copy's listener must not close the visible one. The
      // paperclip toggles the menu itself.
      if (target.closest('[data-attachment-menu]') || target.closest('[aria-label="Attach a photo or location"]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onPickPhoto(file);
  };

  const item = 'flex flex-col items-center gap-1.5 w-[76px] py-2.5 rounded-xl cursor-pointer text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-[background-color,transform] duration-150 active:scale-[0.95]';
  const bubble = 'w-11 h-11 rounded-full flex items-center justify-center text-white';

  return (
    <div
      ref={ref}
      data-attachment-menu=""
      role="menu"
      aria-label="Attach"
      className={`absolute bottom-full left-3 sm:left-4 mb-2 z-20 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex gap-1 origin-bottom-left transition-[opacity,transform] duration-150 ease-out ${
        open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <label role="menuitem" className={item}>
        <span className={`${bubble} bg-navy-800`}><Camera className="w-5 h-5" /></span>
        Camera
        <input type="file" accept="image/*" capture="environment" onChange={pick} className="sr-only" />
      </label>
      <label role="menuitem" className={item}>
        <span className={`${bubble} bg-violet-600`}><ImageIcon className="w-5 h-5" /></span>
        Gallery
        <input type="file" accept="image/*" onChange={pick} className="sr-only" />
      </label>
      <button type="button" role="menuitem" onClick={onShareLocation} disabled={locating} className={`${item} disabled:opacity-60`}>
        <span className={`${bubble} bg-emerald-600`}>
          {locating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <MapPin className="w-5 h-5" />}
        </span>
        {locating ? 'Locating…' : 'Location'}
      </button>
    </div>
  );
};
