import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { fundEscrow, BookingResponse } from '../lib/bookingsApi';
import { formatCurrency } from '../utils';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

/**
 * Where Paystack sends the client after checkout: /payment/callback?booking_id=…&reference=…&trxref=….
 * Confirms the payment with POST /bookings/{id}/fund-escrow (safe to repeat), which moves the
 * booking to escrow_funded. The Paystack webhook also funds it, so a closed tab doesn't lose a payment.
 */
export const PaymentCallback: React.FC<{ onFunded?: () => void }> = ({ onFunded }) => {
  useDocumentMeta('Payment', 'Confirming your payment into escrow.');
  const [params] = useSearchParams();
  const bookingId = params.get('booking_id');
  const [state, setState] = useState<{ kind: 'checking' } | { kind: 'done'; booking: BookingResponse } | { kind: 'error'; message: string }>(
    bookingId ? { kind: 'checking' } : { kind: 'error', message: 'This link is missing its booking. Open the booking from your Bookings page.' }
  );
  const started = useRef(false);

  const confirm = () => {
    if (!bookingId) return;
    setState({ kind: 'checking' });
    fundEscrow(bookingId)
      .then((booking) => {
        setState({ kind: 'done', booking });
        onFunded?.();
      })
      .catch((err) => setState({ kind: 'error', message: err?.message || 'We couldn’t confirm the payment yet.' }));
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3">
        {state.kind === 'checking' && (
          <>
            <span className="inline-block w-8 h-8 border-[3px] border-slate-200 border-t-navy-800 rounded-full animate-spin" aria-hidden="true" />
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Confirming your payment…</h1>
            <p className="text-xs text-slate-500">This takes a few seconds. Please don’t close this page.</p>
          </>
        )}
        {state.kind === 'done' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">Payment held in escrow</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {formatCurrency(state.booking.escrow_amount || state.booking.amount)} for “{state.booking.title}” is held safely. It’s released to
              {state.booking.artisan_name ? ` ${state.booking.artisan_name}` : ' the artisan'} only when you confirm the job is done.
            </p>
            <Link to="/bookings" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white font-bold text-xs">
              View My Bookings
            </Link>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">We couldn’t confirm the payment</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">{state.message}</p>
            <p className="text-[11px] text-slate-500">If you were charged, the payment is still recorded and your booking updates on its own shortly.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 pt-2">
              {bookingId && (
                <button type="button" onClick={confirm} className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white font-bold text-xs cursor-pointer">
                  Try Again
                </button>
              )}
              <Link to="/bookings" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
                Go to Bookings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
