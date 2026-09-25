import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

/** Full-screen photo viewer. Tap anywhere outside the photo, the ×, or press Escape to close. */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [src, onClose]);

  if (!src) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-slate-950/95 flex items-center justify-center p-3 sm:p-8 animate-in fade-in duration-150"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt="Photo"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95 duration-200"
      />
    </div>
  );
};
