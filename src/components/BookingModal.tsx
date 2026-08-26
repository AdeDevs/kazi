import React, { useState, useEffect } from 'react';
import { CustomDropdown } from './CustomDropdown';
import { formatCurrency, formatServicePrice } from '../utils';
import { 
  X, Calendar, Clock, MapPin, FileText, CheckCircle2, 
  Upload, Navigation, Sparkles, 
  ShieldCheck, Camera, Phone, Wrench, AlertCircle, Trash2, Edit3, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Professional, Booking, ServiceItem, ServicePricingType } from '../types';

interface BookingModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  onOpenChatWithPro?: (pro: Professional) => void;
  preselectedService?: string;
}

const SAMPLE_PROBLEM_PHOTOS = [
  { name: 'Pipe Leak', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80' },
  { name: 'Wiring Issue', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80' },
  { name: 'AC Unit', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80' }
];

const SAMPLE_LANDMARK_PHOTOS = [
  { name: 'Estate Gate', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80' },
  { name: 'Street Landmark', url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop&q=80' }
];

export const BookingModal: React.FC<BookingModalProps> = ({
  professional,
  isOpen,
  onClose,
  onSubmitBooking,
  onOpenChatWithPro,
  preselectedService
}) => {
  // Steps: 'form' (input) -> 'review' (summary before submit) -> 'confirmed' (post submit)
  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');

  // Available services catalog for this specific professional
  const servicesList: ServiceItem[] = professional?.services && professional.services.length > 0
    ? professional.services
    : professional
      ? [{
          id: `custom-srv-${professional.id}`,
          name: `${professional.category} Standard Service`,
          category: professional.category,
          description: professional.tagline || professional.bio,
          pricingType: professional.pricingType || 'starting',
          price: professional.basePrice || professional.hourlyRate,
          durationEstimate: '1-2 hrs'
        }]
      : [];

  // Form State
  const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceItem | null>(null);
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [problemImages, setProblemImages] = useState<string[]>([]);
  const [landmarkImages, setLandmarkImages] = useState<string[]>([]);
  const [landmark, setLandmark] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM - 11:00 AM');
  const [customerName, setCustomerName] = useState<string>('Nneka Okonkwo');
  const [customerPhone, setCustomerPhone] = useState<string>('+234 803 123 4567');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; addressName?: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Confirmed State
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [bookingRefId, setBookingRefId] = useState<string>('');

  // Default initial service selection on opening
  useEffect(() => {
    if (professional) {
      const list = professional.services && professional.services.length > 0
        ? professional.services
        : [{
            id: `custom-srv-${professional.id}`,
            name: `${professional.category} Standard Service`,
            category: professional.category,
            description: professional.tagline || professional.bio,
            pricingType: professional.pricingType || 'starting',
            price: professional.basePrice || professional.hourlyRate,
            durationEstimate: '1-2 hrs'
          }];

      if (preselectedService) {
        const found = list.find(s => s.name.toLowerCase() === preselectedService.toLowerCase());
        if (found) {
          setSelectedServiceItem(found);
        } else if (list.length > 0) {
          setSelectedServiceItem(list[0]);
        }
      } else if (list.length > 0) {
        setSelectedServiceItem(list[0]);
      }

      setAddress(`${professional.neighborhood}, Oyo State`);
      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [professional, isOpen, preselectedService]);

  if (!isOpen || !professional) return null;

  const currentPricingType: ServicePricingType = selectedServiceItem?.pricingType || professional.pricingType || 'starting';
  const isQuoteService = currentPricingType === 'quote_required';

  // Image Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'problem' | 'landmark') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          if (target === 'problem') {
            setProblemImages(prev => [...prev, resultStr]);
          } else {
            setLandmarkImages(prev => [...prev, resultStr]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const addSampleImage = (url: string, target: 'problem' | 'landmark') => {
    if (target === 'problem') {
      if (!problemImages.includes(url)) setProblemImages([...problemImages, url]);
    } else {
      if (!landmarkImages.includes(url)) setLandmarkImages([...landmarkImages, url]);
    }
  };

  const removeImage = (index: number, target: 'problem' | 'landmark') => {
    if (target === 'problem') {
      setProblemImages(problemImages.filter((_, i) => i !== index));
    } else {
      setLandmarkImages(landmarkImages.filter((_, i) => i !== index));
    }
  };

  // Live Location Trigger
  const handleGetLiveLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsCoords({ lat, lng, addressName: `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
          setAddress(`Live Location: ${professional.neighborhood}, Ibadan, Oyo State (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setIsLocating(false);
        },
        () => {
          const mockLat = 7.3775;
          const mockLng = 3.9470;
          setGpsCoords({ lat: mockLat, lng: mockLng, addressName: 'Live GPS Pin (Ibadan, Oyo State)' });
          setAddress(`Live GPS: ${professional.neighborhood}, Ibadan, Oyo State (7.3775, 3.9470)`);
          setIsLocating(false);
        },
        { timeout: 6000 }
      );
    } else {
      setGpsCoords({ lat: 7.3775, lng: 3.9470, addressName: 'Live GPS Pin (Ibadan, Oyo State)' });
      setAddress(`Live GPS: ${professional.neighborhood}, Ibadan, Oyo State (7.3775, 3.9470)`);
      setIsLocating(false);
    }
  };

  // Proceed to Request Summary review before submission
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!issueDescription.trim()) {
      setValidationError('Please describe the problem or scope of work required.');
      return;
    }
    if (!address.trim()) {
      setValidationError('Please specify your address or location.');
      return;
    }
    if (!date) {
      setValidationError('Please select a preferred date for the service.');
      return;
    }

    setStep('review');
  };

  // Final submission of the request or booking
  const handleFinalSubmit = () => {
    const svcPricingType: ServicePricingType = selectedServiceItem?.pricingType || professional.pricingType || 'starting';
    const svcBasePrice = selectedServiceItem?.price ?? professional.basePrice ?? (professional.hourlyRate * 2);
    const calculatedPrice = svcPricingType === 'fixed' 
      ? svcBasePrice 
      : svcPricingType === 'quote_required' 
        ? 0 
        : svcBasePrice;

    const refPrefix = svcPricingType === 'quote_required' ? 'REQ' : 'KAZI';
    const refId = `${refPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const bookingPayload: Omit<Booking, 'id' | 'createdAt' | 'status'> = {
      customerId: 'c1',
      customerName,
      customerPhone,
      professionalId: professional.id,
      professionalName: professional.name,
      category: professional.category,
      selectedService: selectedServiceItem?.name || 'General Technical Work',
      servicePricingType: svcPricingType,
      issueDescription,
      problemImages,
      problemImageUrl: problemImages[0] || undefined,
      date,
      timeSlot,
      address,
      landmark,
      landmarkImages,
      coordinates: gpsCoords || undefined,
      totalPrice: calculatedPrice
    };

    onSubmitBooking(bookingPayload);

    // Set summary view state
    setConfirmedBooking({
      ...bookingPayload,
      id: refId,
      status: svcPricingType === 'quote_required' ? 'awaiting_quote' : 'pending',
      createdAt: new Date().toISOString()
    });
    setBookingRefId(refId);
    setStep('confirmed');
  };

  const handleResetModal = () => {
    setStep('form');
    setIssueDescription('');
    setProblemImages([]);
    setLandmarkImages([]);
    setLandmark('');
    setGpsCoords(null);
    setConfirmedBooking(null);
    setValidationError(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleResetModal}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[calc(100vh-1rem)] sm:max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <img src={professional.avatar} alt={professional.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover shadow-xs border border-navy-800/30" />
              {professional.verified && (
                <ShieldCheck className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-navy-800 dark:text-navy-400 bg-white dark:bg-slate-900 rounded-full" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{professional.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-navy-800/10 text-navy-800 dark:text-navy-400 font-bold text-[10px] border border-navy-800/20">
                  ★ {professional.rating} ({professional.reviewCount})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {professional.category} • <span className="font-bold text-navy-800 dark:text-navy-400">{professional.neighborhood}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: FORM INPUTS & SCOPE DETAILS                       */}
        {/* ========================================================= */}
        {step === 'form' && (
          <form onSubmit={handleProceedToReview} className="p-3.5 sm:p-4 space-y-4">
            
            {/* Quote-Based Service Explicit Notice Banner */}
            {isQuoteService ? (
              <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-950/70 border border-navy-200 dark:border-navy-800 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-navy-800 dark:text-navy-400 shrink-0" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-navy-950 dark:text-navy-200">
                    Quote-Based Custom Service
                  </h4>
                  <span className="text-[10px] font-bold text-navy-800 dark:text-navy-400 bg-navy-100 dark:bg-navy-900 px-2 py-0.5 rounded-full border border-navy-200 dark:border-navy-800">
                    Request a quote
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>The final price will be provided by {professional.name.split(' ')[0]}.</strong> Describe your requirements, attach photos if available, and choose your preferred date. The professional will review your scope and provide a custom quote.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>No payment required now • Free request submission</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2 text-navy-800 dark:text-navy-400">
                  <Wrench className="w-4 h-4" /> Professional Job Scope & Schedule
                </span>
                <span className="text-[11px] text-slate-400">Escrow Protected</span>
              </div>
            )}

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* 1. CHOOSE SERVICE REQUIREMENT */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>1. Select Service Requirement</span>
                <span className="text-[10px] font-semibold text-navy-800 dark:text-navy-400">Required</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {servicesList.map((svc, idx) => {
                  const isSelected = selectedServiceItem?.id === svc.id || selectedServiceItem?.name === svc.name;
                  const priceInfo = formatServicePrice(svc.pricingType, svc.price);

                  return (
                    <button
                      type="button"
                      key={svc.id || idx}
                      onClick={() => setSelectedServiceItem(svc)}
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
                      
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {priceInfo.type === 'fixed' && (
                          <>
                            <span className="font-black text-slate-900 dark:text-slate-100">{priceInfo.primaryText}</span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200/60">
                              Fixed price
                            </span>
                          </>
                        )}
                        {priceInfo.type === 'quote_required' && (
                          <span className="text-[11px] font-bold text-navy-800 dark:text-navy-400 bg-navy-50 dark:bg-navy-950 px-2 py-0.5 rounded border border-navy-200/60 dark:border-navy-800">
                            Request a quote
                          </span>
                        )}
                        {priceInfo.type === 'starting' && (
                          <>
                            <span className="font-black text-slate-900 dark:text-slate-100">{priceInfo.primaryText}</span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              Starting
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. DESCRIBE ISSUE OR WORK REQUIRED */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>2. Describe Problem / Work Required</span>
                <span className="text-[10px] font-semibold text-navy-800 dark:text-navy-400">Required</span>
              </label>
              <textarea
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder={
                  isQuoteService
                    ? "Describe the job requirements, dimensions, specifications, or materials needed for your custom quote..."
                    : "Explain the problem in detail (e.g., Water leaking under bathroom sink, fuse box tripping continuously, AC leaking water, etc.)..."
                }
                required
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-800 transition-colors"
              />
            </div>

            {/* 3. UPLOAD PROBLEM / SPECIFICATION PHOTOS */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>3. Attach Photos & References (Optional)</span>
                <span className="text-[10px] text-slate-400">Helps artisan prepare an accurate estimate</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {/* File Upload Button */}
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-navy-800/10 hover:bg-navy-800/20 text-navy-800 dark:text-navy-400 border border-navy-800/30 font-bold text-xs cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'problem')}
                    className="hidden"
                  />
                </label>

                {/* Quick Preset Buttons */}
                <span className="text-[11px] text-slate-400 font-medium">Quick add sample:</span>
                {SAMPLE_PROBLEM_PHOTOS.map((sample, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => addSampleImage(sample.url, 'problem')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-navy-800/20 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    + {sample.name}
                  </button>
                ))}
              </div>

              {/* Uploaded Thumbnails Preview */}
              {problemImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {problemImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square">
                      <img src={imgUrl} alt="Attached Problem" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx, 'problem')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. CHOOSE LOCATION & LANDMARK */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  4. Location & Landmark
                </label>
                <button
                  type="button"
                  onClick={handleGetLiveLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Use Phone GPS'}</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-navy-800 dark:text-navy-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, house/apt number, area..."
                  required
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                />
              </div>

              {gpsCoords && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> GPS Pin: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Captured</span>
                </div>
              )}

              {/* Landmark Input & Photos */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Landmark Hint & Photo (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Total Filling Station, black gate next to pharmacy..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
                    <span>Attach Landmark Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'landmark')}
                      className="hidden"
                    />
                  </label>

                  {SAMPLE_LANDMARK_PHOTOS.map((lm, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => addSampleImage(lm.url, 'landmark')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-navy-800/20 text-slate-600 dark:text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      + {lm.name}
                    </button>
                  ))}
                </div>

                {landmarkImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {landmarkImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square">
                        <img src={imgUrl} alt="Landmark" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx, 'landmark')}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. PREFERRED DATE & TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  5. Preferred Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  6. Preferred Time Slot
                </label>
                <CustomDropdown
                  value={timeSlot}
                  onChange={(val) => setTimeSlot(val)}
                  icon={<Clock className="w-4 h-4 text-slate-400" />}
                  options={[
                    { value: '08:00 AM - 10:00 AM', label: '08:00 AM - 10:00 AM' },
                    { value: '10:00 AM - 12:00 PM', label: '10:00 AM - 12:00 PM' },
                    { value: '01:00 PM - 03:00 PM', label: '01:00 PM - 03:00 PM' },
                    { value: '03:00 PM - 05:00 PM', label: '03:00 PM - 05:00 PM' },
                    { value: '05:00 PM - 07:00 PM', label: '05:00 PM - 07:00 PM' }
                  ]}
                  className="w-full"
                  buttonClassName="py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* CUSTOMER CONTACT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone (for Artisan SMS / Calls)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                />
              </div>
            </div>

            {/* Pricing Summary Callout */}
            {(() => {
              const svcPrice = selectedServiceItem?.price ?? professional.basePrice ?? (professional.hourlyRate * 2);
              const priceInfo = formatServicePrice(currentPricingType, svcPrice, professional.hourlyRate);

              return (
                <div className="p-4 rounded-2xl bg-navy-800/10 border border-navy-800/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-navy-800 dark:text-navy-400" />
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-navy-800 dark:text-navy-300 text-sm">
                          {currentPricingType === 'fixed' && `Fixed Price: ${priceInfo.primaryText}`}
                          {currentPricingType === 'quote_required' && `Price: Quote to be provided by pro`}
                          {currentPricingType === 'starting' && `Starting Rate: ${priceInfo.primaryText}`}
                        </p>
                        {currentPricingType === 'fixed' && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200/60">
                            Fixed price
                          </span>
                        )}
                        {currentPricingType === 'quote_required' && (
                          <span className="text-[10px] font-bold text-navy-800 dark:text-navy-400 bg-navy-50 dark:bg-navy-950 px-1.5 py-0.2 rounded border border-navy-200/60 dark:border-navy-800">
                            Quote required
                          </span>
                        )}
                        {currentPricingType === 'starting' && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            Starting price
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {currentPricingType === 'fixed' && 'Guaranteed fixed rate. Escrow protected.'}
                      {currentPricingType === 'quote_required' && 'Final price will be provided by the professional after reviewing your request scope.'}
                      {currentPricingType === 'starting' && 'Base inspection & starter fee. Final scope determined after review.'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-navy-800 text-white font-extrabold text-xs shadow-xs shrink-0">
                    {isQuoteService ? 'Quote Flow' : 'Escrow Protected'}
                  </span>
                </div>
              );
            })()}

            {/* FORM FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetModal}
                className="w-full sm:w-auto px-5 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>{isQuoteService ? 'Review Quote Request' : 'Review Booking Summary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: REQUEST / BOOKING SUMMARY BEFORE SUBMISSION       */}
        {/* ========================================================= */}
        {step === 'review' && (
          <div className="p-3.5 sm:p-4 space-y-4 animate-in fade-in duration-200">
            
            {/* Header review banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-navy-800 text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-navy-200 uppercase tracking-wider">
                  Step 2 of 2: Pre-Submission Review
                </span>
                <span className="text-[10px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full">
                  {isQuoteService ? 'Quote Request' : 'Fixed Booking'}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                {isQuoteService ? 'Review Your Quote Request' : 'Review Booking Details'}
              </h2>
              <p className="text-xs text-navy-100">
                {isQuoteService
                  ? 'Please review your job scope and requirements before submitting your request to the artisan.'
                  : 'Please double-check your booking information and schedule before final confirmation.'}
              </p>
            </div>

            {/* Explanation box for quote service */}
            {isQuoteService && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="leading-snug">
                  <strong>Notice:</strong> This is a <strong>quote-based service</strong>. Submitting this form sends a request to the professional. The professional will evaluate your specifications and reply with a custom price quote.
                </p>
              </div>
            )}

            {/* Summary Details Grid */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Selected Service</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedServiceItem?.name || 'General Technical Work'}
                  </p>
                  <p className="text-navy-800 dark:text-navy-400 font-semibold">{professional.category}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Assigned Professional</span>
                  <div className="flex items-center gap-2">
                    <img src={professional.avatar} alt={professional.name} className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{professional.name}</p>
                      <p className="text-[11px] text-slate-500">{professional.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Preferred Date & Time</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {date}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {timeSlot}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Location & Landmark</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
                    <span className="truncate">{address}</span>
                  </p>
                  {landmark && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Landmark: {landmark}</p>
                  )}
                  {gpsCoords && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      ✓ GPS Pin coordinates verified
                    </p>
                  )}
                </div>
              </div>

              {/* Work Scope / Description */}
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Problem / Job Scope
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {issueDescription}
                </p>
              </div>

              {/* Attached Photos */}
              {(problemImages.length > 0 || landmarkImages.length > 0) && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-slate-400 font-bold text-[11px] block">
                    Attached Photos ({problemImages.length + landmarkImages.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {problemImages.map((img, i) => (
                      <img key={i} src={img} alt="Problem Reference" className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                    ))}
                    {landmarkImages.map((img, i) => (
                      <img key={i} src={img} alt="Landmark Reference" className="w-14 h-14 rounded-xl object-cover border border-navy-800/40" />
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing breakdown summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-bold block">Pricing Model</span>
                  <p className="font-extrabold text-navy-800 dark:text-navy-300">
                    {isQuoteService ? 'Custom Quote by Artisan' : 'Fixed Guaranteed Rate'}
                  </p>
                </div>
                <div className="text-right">
                  {isQuoteService ? (
                    <span className="text-xs sm:text-sm font-black text-navy-800 dark:text-navy-400 bg-navy-50 dark:bg-navy-950 px-2.5 py-1 rounded-lg border border-navy-200 dark:border-navy-800 inline-block">
                      Quote to be provided
                    </span>
                  ) : (
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      ₦{(selectedServiceItem?.price || professional.basePrice || (professional.hourlyRate * 2)).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Review actions buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-5 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Details</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-7 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isQuoteService ? 'Submit Quote Request' : 'Confirm & Book Service'}</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SUBMISSION SUCCESS CONFIRMATION                   */}
        {/* ========================================================= */}
        {step === 'confirmed' && (
          <div className="p-3.5 sm:p-4 space-y-4 animate-in zoom-in-95 duration-300">
            
            {/* Header Banner - Differentiated for Quote vs Fixed */}
            {isQuoteService ? (
              <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-950/80 border border-navy-200 dark:border-navy-800 text-center space-y-2">
                <div className="w-14 h-14 bg-navy-800 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <FileText className="w-8 h-8 text-brand-orange-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Quote Request Submitted!</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Your request has been dispatched to <span className="font-bold text-slate-900 dark:text-slate-100">{professional.name}</span>. The professional will evaluate your specifications and send you a custom quote.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-navy-800 text-white font-mono text-xs font-black shadow-xs">
                    REF: #{bookingRefId}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                    Awaiting quote
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-emerald-900 dark:text-emerald-300">Booking Confirmed!</h2>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                  Your booking request has been dispatched to <span className="font-bold">{professional.name}</span>. You will receive an SMS and in-app updates as soon as they accept.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-navy-800 text-white font-mono text-xs font-black shadow-xs">
                    REF: #{bookingRefId}
                  </span>
                </div>
              </div>
            )}

            {/* Detailed Booking / Request Summary Details Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                {isQuoteService ? 'Request Summary Details' : 'Booking Summary Details'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Service & Trade</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {confirmedBooking?.selectedService || selectedServiceItem?.name || 'General Service'}
                  </p>
                  <p className="text-navy-800 dark:text-navy-400 font-semibold">{professional.category}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Assigned Artisan</span>
                  <div className="flex items-center gap-2">
                    <img src={professional.avatar} alt={professional.name} className="w-8 h-8 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{professional.name}</p>
                      <p className="text-[11px] text-slate-500">{professional.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Preferred Date & Time Slot</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {date}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {timeSlot}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Location & Landmark</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> <span className="truncate">{address}</span>
                  </p>
                  {landmark && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Landmark: {landmark}</p>
                  )}
                </div>

              </div>

              {/* Description & Uploaded Images */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">Job Description</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  "{issueDescription}"
                </p>

                {(problemImages.length > 0 || landmarkImages.length > 0) && (
                  <div className="space-y-2 pt-2">
                    <span className="text-slate-400 font-bold text-[11px] block">Attached Photos ({problemImages.length + landmarkImages.length}):</span>
                    <div className="flex flex-wrap gap-2">
                      {problemImages.map((img, i) => (
                        <img key={i} src={img} alt="Attached Problem" className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                      ))}
                      {landmarkImages.map((img, i) => (
                        <img key={i} src={img} alt="Attached Landmark" className="w-14 h-14 rounded-xl object-cover border border-navy-800/40" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Escrow / Quote Status Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Status</span>
                  <p className="font-extrabold text-navy-800 dark:text-navy-300">
                    {isQuoteService ? 'Request Under Review by Artisan' : 'Escrow Held Safely'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block">
                    {isQuoteService ? 'Pricing Status' : 'Total Price'}
                  </span>
                  {isQuoteService ? (
                    <span className="text-xs sm:text-sm font-black text-navy-800 dark:text-navy-400 bg-navy-50 dark:bg-navy-950 px-2 py-0.5 rounded border border-navy-200 dark:border-navy-800 inline-block mt-0.5">
                      Awaiting quote
                    </span>
                  ) : (
                    <span className="text-lg font-black text-navy-800 dark:text-navy-400">
                      ₦{confirmedBooking?.totalPrice?.toLocaleString() || '0'}
                    </span>
                  )}
                </div>
              </div>

              {/* Policy Disclaimer */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-navy-800/10 border border-navy-800/20 p-2.5 rounded-xl">
                <span className="font-bold text-navy-800 dark:text-navy-400">
                  {isQuoteService ? 'Quote Process:' : 'Cancellation Policy:'}
                </span>{' '}
                {isQuoteService
                  ? 'The professional will evaluate your request and provide a price quote in your messages / requests tab. You can accept or decline without obligation.'
                  : 'Free cancellation is available up to 45 minutes prior to your scheduled appointment time.'}
              </p>

            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {onOpenChatWithPro && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetModal();
                    onOpenChatWithPro(professional);
                  }}
                  className="w-full sm:w-auto px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-navy-800 dark:text-navy-400" />
                  <span>Start Live Chat with {professional.name.split(' ')[0]}</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleResetModal}
                className="w-full sm:w-auto px-8 py-3 bg-navy-800 hover:bg-navy-900 text-white rounded-2xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
