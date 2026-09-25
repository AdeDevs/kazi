import React, { useState, useEffect } from 'react';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { formatCurrency, formatServicePrice } from '../utils';
import {
  X, MapPin, FileText, CheckCircle2, ShieldCheck, Wrench, AlertCircle, ArrowLeft, ArrowRight, MessageSquare, Info,
} from 'lucide-react';
import { Professional, Booking, ServiceItem } from '../types';

/** What the form collects -- exactly what POST /bookings/fixed and /bookings/quote-request accept. */
export interface BookingRequestInput {
  professional: Professional;
  service: ServiceItem | null;
  description: string;
  address: string;
  landmark: string;
}

interface BookingModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
  /** Creates the booking on the backend; rejects with a user-facing message on failure. */
  onSubmitBooking: (input: BookingRequestInput) => Promise<Booking>;
  onOpenChatWithPro?: (pro: Professional) => void;
  onViewBookings?: () => void;
  preselectedService?: string;
}

// A fixed-price service is booked at its set price; everything else ("starting from", quote-only,
// or an artisan with no services listed) becomes a quote request the artisan prices.
const isFixedPrice = (svc: ServiceItem | null) => svc?.pricing_type === 'fixed' && (svc.price ?? 0) > 0;

export const BookingModal: React.FC<BookingModalProps> = ({
  professional: professionalProp,
  isOpen,
  onClose,
  onSubmitBooking,
  onOpenChatWithPro,
  onViewBookings,
  preselectedService,
}) => {
  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Booking | null>(null);

  const services: ServiceItem[] = professionalProp?.services || [];

  useEffect(() => {
    if (!professionalProp) return;
    const list = professionalProp.services || [];
    const preselected = preselectedService
      ? list.find(s => s.name.toLowerCase() === preselectedService.toLowerCase())
      : undefined;
    setSelectedService(preselected || list[0] || null);
  }, [professionalProp, isOpen, preselectedService]);

  // Keeps the last real professional while the sheet plays its exit animation (the parent clears
  // its selected professional in the same tick it closes the sheet).
  const [cachedProfessional, setCachedProfessional] = useState(professionalProp);
  useEffect(() => {
    if (professionalProp) setCachedProfessional(professionalProp);
  }, [professionalProp]);

  const handleReset = () => {
    setStep('form');
    setDescription('');
    setAddress('');
    setLandmark('');
    setValidationError(null);
    setSubmitError(null);
    setCreated(null);
    onClose();
  };

  const isDirty = step !== 'confirmed' && Boolean(description.trim() || address.trim() || landmark.trim());
  const closeGuard = useUnsavedChangesGuard(isDirty, handleReset);
  const sheet = useSlideUpSheet(isOpen, closeGuard.requestClose);

  if (!sheet.shouldRender || !cachedProfessional) return null;
  const professional = cachedProfessional;
  const firstName = professional.name.split(' ')[0] || professional.name;
  const fixed = isFixedPrice(selectedService);
  const serviceTitle = selectedService?.name || 'General request';

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!description.trim()) {
      setValidationError('Describe the problem or the work you need done.');
      return;
    }
    if (!address.trim()) {
      setValidationError('Enter the address where the work will happen.');
      return;
    }
    setSubmitError(null);
    setStep('review');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await onSubmitBooking({ professional, service: selectedService, description, address, landmark });
      setCreated(booking);
      setStep('confirmed');
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not send this request. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceLine = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
        <span>{fixed ? 'Fixed price · paid into escrow after the artisan accepts' : `${firstName} will send you a price`}</span>
      </div>
      {fixed ? (
        <span className="text-base font-black text-slate-900 dark:text-white shrink-0">{formatCurrency(selectedService?.price ?? 0)}</span>
      ) : (
        <span className="text-xs font-black text-navy-800 dark:text-navy-400 bg-navy-50 dark:bg-navy-950 px-2.5 py-1 rounded-lg border border-navy-200 dark:border-navy-800 shrink-0">
          Quote to come
        </span>
      )}
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
      onClick={closeGuard.requestClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header -- drag handle and artisan row share one sticky container. */}
        <div className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="sm:hidden pt-3 pb-1.5 cursor-grab active:cursor-grabbing touch-none" {...sheet.dragHandleProps}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <img src={professional.profile_picture} alt={professional.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover shadow-xs border border-navy-800/30 shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">{professional.name}</h3>
                  {professional.is_verified && <VerifiedBadge />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                  {professional.category}{professional.neighborhood ? ` • ${professional.neighborhood}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={closeGuard.requestClose}
              aria-label="Close"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <form onSubmit={handleProceedToReview} className="p-3.5 sm:p-4 space-y-4">
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">1. Service</span>
              {services.length === 0 ? (
                <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  {firstName} hasn’t listed services yet. Describe what you need and they’ll send you a quote.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {services.map((svc) => {
                    const isSelected = selectedService?.id === svc.id;
                    const priceInfo = formatServicePrice(svc.pricing_type, svc.price);
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        aria-pressed={isSelected}
                        className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-navy-800/10 border-navy-800 text-navy-950 dark:text-navy-200 shadow-xs ring-1 ring-navy-800/20'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-navy-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold">{svc.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-navy-800 dark:text-navy-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 dark:text-slate-100">{priceInfo.primaryText}</span>
                          {priceInfo.badgeLabel && <span className="text-[10px] font-medium text-slate-500">{priceInfo.badgeLabel}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="booking-description" className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. What do you need done?
              </label>
              <textarea
                id="booking-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={fixed
                  ? 'Explain the problem, e.g. water leaking under the bathroom sink.'
                  : 'Describe the job: what, where, sizes or materials, so the artisan can price it.'}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-800 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="booking-address" className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-navy-800 dark:text-navy-400" />
                <input
                  id="booking-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, house number, area, city"
                  autoComplete="street-address"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                />
              </div>
              <input
                aria-label="Landmark (optional)"
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Landmark (optional), e.g. opposite the filling station, black gate"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
              />
            </div>

            <p className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>Choosing a date and time, and attaching photos, are coming soon. Agree the timing with {firstName} in messages for now.</span>
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">{priceLine}</div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={closeGuard.requestClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Review {fixed ? 'Booking' : 'Request'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW */}
        {step === 'review' && (
          <div className="p-3.5 sm:p-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{fixed ? 'Check your booking' : 'Check your quote request'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fixed
                  ? `${firstName} will be asked to accept this booking at the price below.`
                  : `${firstName} will review this and send you a price. Nothing is charged until you accept a quote.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Service</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{serviceTitle}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">What you need</span>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{description.trim()}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Address</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{address.trim()}</p>
                {landmark.trim() && <p className="text-[11px] text-slate-500 mt-0.5">Landmark: {landmark.trim()}</p>}
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">{priceLine}</div>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Details</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Sending…' : fixed ? 'Send Booking' : 'Send Quote Request'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SENT */}
        {step === 'confirmed' && created && (
          <div className="p-3.5 sm:p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-950/70 border border-navy-200 dark:border-navy-800 text-center space-y-2">
              <div className="w-12 h-12 bg-navy-800 text-white rounded-2xl flex items-center justify-center mx-auto">
                {fixed ? <Wrench className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{fixed ? 'Booking sent' : 'Quote request sent'}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {fixed
                  ? `Waiting for ${firstName} to accept. Once they do, you’ll pay the ${formatCurrency(created.amount ?? 0)} into escrow. It’s held until you confirm the job is done.`
                  : `${firstName} will send you a price. You’ll find it under Bookings, where you can accept it.`}
              </p>
              <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                Reference {created.reference_code || created.id}
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              {onOpenChatWithPro && (
                <button
                  type="button"
                  onClick={() => { handleReset(); onOpenChatWithPro(professional); }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-navy-800 dark:text-navy-400" />
                  <span>Message {firstName}</span>
                </button>
              )}
              {onViewBookings && (
                <button
                  type="button"
                  onClick={() => { handleReset(); onViewBookings(); }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  View My Bookings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <UnsavedChangesModal
        guard={closeGuard}
        description="You haven't sent this request yet. Closing now will discard what you've entered."
      />
    </div>
  );
};
