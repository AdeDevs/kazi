import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Booking } from '../types';
import { formatAmount } from '../utils';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

interface SendQuoteSheetProps {
  /** The quote request being priced; null keeps the sheet closed. */
  job: Booking | null;
  onClose: () => void;
  /** POST /bookings/{id}/quote with { amount, breakdown }. */
  onSend: (job: Booking, amount: number, breakdown: string) => void;
}

export const SendQuoteSheet: React.FC<SendQuoteSheetProps> = ({ job, onClose, onSend }) => {
  const [amount, setAmount] = useState(0);
  const [breakdown, setBreakdown] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Keep the last job while the sheet animates out.
  const [cachedJob, setCachedJob] = useState<Booking | null>(job);
  useEffect(() => {
    if (job) {
      setCachedJob(job);
      setAmount(0);
      setBreakdown('');
      setError(null);
    }
  }, [job]);

  const guard = useUnsavedChangesGuard(Boolean(amount || breakdown.trim()), onClose);
  const sheet = useSlideUpSheet(Boolean(job), guard.requestClose);
  if (!sheet.shouldRender || !cachedJob) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Enter your price for this job.');
      return;
    }
    onSend(cachedJob, amount, breakdown.trim());
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 ${sheet.backdropAnimationClasses}`}
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
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Send a Quote</h3>
          <p className="text-xs text-slate-500">
            For “{cachedJob.title || 'this request'}”. The client can accept or decline it.
          </p>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
          {cachedJob.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="quote-amount" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Price (₦)</label>
            <input
              id="quote-amount"
              type="text"
              inputMode="numeric"
              value={amount ? formatAmount(amount) : ''}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
              placeholder="e.g. 25,000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="quote-breakdown" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">What’s Included (Optional)</label>
            <textarea
              id="quote-breakdown"
              rows={3}
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value)}
              placeholder="e.g. Labour ₦15,000, parts ₦10,000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
          {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400" role="alert">{error}</p>}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={guard.requestClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center"
            >
              Send Quote
            </button>
          </div>
        </form>
      </div>

      <UnsavedChangesModal guard={guard} description="Your quote hasn’t been sent. Closing now will discard it." />
    </div>
  );
};
