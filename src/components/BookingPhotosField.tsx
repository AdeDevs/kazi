import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '../lib/imageCompress';
import { uploadBookingPhoto } from '../lib/bookingsApi';

interface BookingPhotosFieldProps {
  /** Uploaded photo URLs. */
  photos: string[];
  onChange: (photos: string[]) => void;
  /** Lets the form hold its submit button while a photo is still uploading. */
  onUploadingChange?: (uploading: boolean) => void;
  max: number;
  hint?: string;
}

/** Picks photos, shrinks them, uploads each to POST /bookings/upload and keeps the returned URLs. */
export const BookingPhotosField: React.FC<BookingPhotosFieldProps> = ({ photos, onChange, onUploadingChange, max, hint }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(0);
  // Read through a ref so uploads finishing out of order append to the latest list.
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - photos.length - pending;
    const chosen = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, Math.max(0, room));
    if (files.length > chosen.length) toast.error(`You can add up to ${max} photos.`);
    if (!chosen.length) return;
    setPending((n) => n + chosen.length);
    onUploadingChange?.(true);
    let left = chosen.length;
    await Promise.all(chosen.map(async (file) => {
      try {
        const dataUrl = await compressImage(file);
        const blob = await (await fetch(dataUrl)).blob();
        const url = await uploadBookingPhoto(blob, file.name.replace(/\.[^.]+$/, '') + '.jpg');
        onChange([...photosRef.current, url]);
      } catch (err: any) {
        toast.error(err?.message || 'A photo didn’t upload. Try again.');
      } finally {
        setPending((n) => n - 1);
        left -= 1;
        if (left === 0) onUploadingChange?.(false);
      }
    }));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="relative w-16 h-16">
            <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((p) => p !== url))}
              aria-label="Remove photo"
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:bg-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {Array.from({ length: pending }).map((_, i) => (
          <div key={`pending-${i}`} className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center" aria-label="Uploading photo">
            <span className="w-4 h-4 border-2 border-slate-300 border-t-navy-800 rounded-full animate-spin" />
          </div>
        ))}
        {photos.length + pending < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-navy-800 hover:text-navy-800 dark:hover:text-navy-400 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
};
