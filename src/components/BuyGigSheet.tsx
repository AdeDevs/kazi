import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Gig } from '../types';
import { formatCurrency } from '../utils';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

interface BuyGigSheetProps {
  /** The gig being bought, with the artisan's display name; null keeps the sheet closed. */
  target: { gig: Gig; artisanName: string } | null;
  onClose: () => void;
  /** POST /bookings/buy-gig. Resolves true on success; failures are reported by the caller. */
  onBuy: (gig: Gig, address: string, landmark: string) => Promise<boolean>;
}

export const BuyGigSheet: React.FC<BuyGigSheetProps> = ({ target, onClose, onBuy }) => {
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const [cached, setCached] = useState(target);
  useEffect(() => {
    if (target) {
      setCached(target);
      setAddress('');
      setLandmark('');
      setError(null);
    }
  }, [target]);

  const guard = useUnsavedChangesGuard(Boolean(address.trim() || landmark.trim()) && !isBuying, onClose);
  const sheet = useSlideUpSheet(Boolean(target), guard.requestClose);
  if (!sheet.shouldRender || !cached) return null;
  const { gig, artisanName } = cached;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Enter the address for this job.');
      return;
    }
    setIsBuying(true);
    const ok = await onBuy(gig, address.trim(), landmark.trim());
    setIsBuying(false);
    if (ok) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 ${sheet.backdropAnimationClasses}`}
      onClick={guard.requestClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
        <button
          type="button"
          onClick={guard.requestClose}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Buy This Gig</h3>
          <p className="text-xs text-slate-500">From {artisanName}. You pay into escrow next, and it’s held until you confirm the job is done.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{gig.title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Delivered in {gig.delivery_time_days} day{gig.delivery_time_days === 1 ? '' : 's'}</p>
          </div>
          <span className="text-base font-black text-slate-900 dark:text-white shrink-0 tabular-nums">{formatCurrency(gig.price)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="gig-address" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
            <input
              id="gig-address"
              type="text"
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, house number, area, city"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="gig-landmark" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Landmark (Optional)</label>
            <input
              id="gig-landmark"
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. opposite the filling station"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={guard.requestClose}
              disabled={isBuying}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBuying}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-wait"
            >
              {isBuying ? 'Buying…' : `Buy for ${formatCurrency(gig.price)}`}
            </button>
          </div>
        </form>
      </div>

      <UnsavedChangesModal guard={guard} description="You haven’t bought this gig yet. Closing now will discard the address you entered." />
    </div>
  );
};
