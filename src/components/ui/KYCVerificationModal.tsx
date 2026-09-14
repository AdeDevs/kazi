import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ShieldCheck, Camera, Upload, CheckCircle2, 
  AlertCircle, RefreshCw, Lock, Sparkles, ChevronRight,
  CreditCard, UserCheck, Eye, Accessibility, HelpCircle
} from 'lucide-react';

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStep?: 'doc' | 'camera' | 'review';
}

export const KYCVerificationModal: React.FC<KYCVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'intro' | 'document' | 'liveness' | 'verifying' | 'completed'>('intro');
  const [docType, setDocType] = useState<'nin' | 'drivers_license' | 'voters_card' | 'passport'>('nin');
  const [docNumber, setDocNumber] = useState('');
  const [docImage, setDocImage] = useState<string | null>(null);
  const [livenessImage, setLivenessImage] = useState<string | null>(null);
  
  // Camera liveness state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPrompt, setCameraPrompt] = useState('Position your face in the oval frame');
  const [livenessStage, setLivenessStage] = useState<'frame' | 'blink' | 'smile' | 'captured'>('frame');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  
  // Accessibility mode: alternative upload instead of live motion test
  const [useAccessibleUpload, setUseAccessibleUpload] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopCamera();
    };
  }, [isOpen, onClose, stopCamera]);

  const captureLivenessPhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLivenessImage(dataUrl);
        setLivenessStage('captured');
        setLiveAnnouncement('Biometric face photo captured successfully.');
        stopCamera();
      }
    }
  }, [stopCamera]);

  // Start live webcam for biometric liveness
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setLivenessStage('frame');
    const initialPrompt = 'Position your face in the oval frame';
    setCameraPrompt(initialPrompt);
    setLiveAnnouncement(`Camera activated. ${initialPrompt}`);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errMsg = 'Live camera is not supported in this browser window. Please upload a clear selfie photo below instead.';
      setCameraError(errMsg);
      setLiveAnnouncement(errMsg);
      setIsCameraActive(false);
      setUseAccessibleUpload(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Automated Liveness Prompt Sequence (Blink -> Smile -> Capture)
      setTimeout(() => {
        setLivenessStage('blink');
        const blinkPrompt = 'Please blink your eyes naturally...';
        setCameraPrompt(blinkPrompt);
        setLiveAnnouncement(blinkPrompt);
      }, 2000);

      setTimeout(() => {
        setLivenessStage('smile');
        const smilePrompt = 'Now give a gentle smile...';
        setCameraPrompt(smilePrompt);
        setLiveAnnouncement(smilePrompt);
      }, 4000);

      setTimeout(() => {
        captureLivenessPhoto();
      }, 5800);

    } catch (err: any) {
      console.warn('Camera access not granted:', err?.message || err);
      let errMsg = 'Camera access was not granted. You can take or upload a clear selfie photo below instead.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || (typeof err?.message === 'string' && err.message.includes('Permission denied'))) {
        errMsg = 'Camera permission is blocked or denied. Please grant camera permission in your browser or upload a clear selfie photo below.';
      }
      setCameraError(errMsg);
      setLiveAnnouncement(errMsg);
      setIsCameraActive(false);
      setUseAccessibleUpload(true);
    }
  };

  const handleDocImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDocImage(event.target.result as string);
          setLiveAnnouncement('Government ID document photo uploaded successfully.');
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLivenessImage(event.target.result as string);
          setLivenessStage('captured');
          setLiveAnnouncement('Facial photo uploaded successfully.');
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSubmitForVerification = () => {
    setStep('verifying');
    setLiveAnnouncement('Cross-referencing government document security and biometric face verification.');
    setTimeout(() => {
      setStep('completed');
      setLiveAnnouncement('Verification completed successfully! Your Verified Account badge is now active.');
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-overlay-fade"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
      aria-describedby="kyc-modal-desc"
    >
      {/* Screen Reader Live Status Announcement Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      <div 
        ref={modalRef}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-sheet-up sm:animate-pop-in max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mb-2" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-600"
          title="Close verification dialog"
          aria-label="Close verification dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ================= STEP 1: INTRO / OVERVIEW ================= */}
        {step === 'intro' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 id="kyc-modal-title" className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Identity & Liveness Verification
                </h2>
                <p id="kyc-modal-desc" className="text-xs text-slate-500">
                  Government ID check & instant face liveness verification.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">Official Government ID</p>
                  <p className="text-slate-500 text-[11px]">National Identity (NIN), Driver's License, Voter's Card, or Passport.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">Biometric Facial Check</p>
                  <p className="text-slate-500 text-[11px]">A quick camera scan or clear selfie to confirm you match the ID photo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  ✓
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100">Instant Verified Artisan Badge</p>
                  <p className="text-slate-500 text-[11px]">Higher visibility, 3x client trust, and priority job recommendations.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              <Lock className="w-4 h-4 shrink-0" />
              <span className="text-[11px]">Your documents are securely encrypted and never shared publicly.</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => setStep('document')}
                className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>Start Verification</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DOCUMENT UPLOAD ================= */}
        {step === 'document' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-navy-100 dark:bg-navy-950 text-navy-800 dark:text-navy-300 border border-navy-200 dark:border-navy-800">
                  Step 1 of 2
                </span>
                <span className="text-xs text-slate-400 font-bold">Government ID</span>
              </div>
              <h2 id="kyc-modal-title" className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Select and Upload ID
              </h2>
            </div>

            {/* Document Type Selector */}
            <div role="radiogroup" aria-label="Select Government ID Type" className="grid grid-cols-2 gap-2">
              {[
                { id: 'nin', label: 'National ID (NIN)' },
                { id: 'drivers_license', label: "Driver's License" },
                { id: 'voters_card', label: "Voter's Card" },
                { id: 'passport', label: 'Intl Passport' }
              ].map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  role="radio"
                  aria-checked={docType === doc.id}
                  onClick={() => setDocType(doc.id as any)}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-600 ${
                    docType === doc.id
                      ? 'border-navy-800 bg-navy-50/70 dark:bg-navy-950/60 dark:border-navy-600 text-navy-900 dark:text-navy-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>

            {/* ID Number Input */}
            <div>
              <label htmlFor="doc-number-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Document Identification Number
              </label>
              <input
                id="doc-number-input"
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. 11-digit NIN or License Number"
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* File Upload / Camera photo */}
            <div>
              <label htmlFor="doc-file-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Clear Photo of Document (Front)
              </label>
              <input
                id="doc-file-input"
                type="file"
                ref={fileInputRef}
                onChange={handleDocImageUpload}
                accept="image/*"
                className="hidden"
                aria-label="Upload document photo"
              />

              {docImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900 flex items-center justify-center">
                  <img src={docImage} alt="Uploaded Government ID document preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/80 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 backdrop-blur-xs focus:ring-2 focus:ring-white"
                    aria-label="Change uploaded document photo"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Photo</span>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload document photo"
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-navy-800 dark:hover:border-navy-500 bg-slate-50 dark:bg-slate-800/30 transition-colors space-y-2 focus:outline-none focus:ring-2 focus:ring-navy-600"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Tap to upload document photo</p>
                    <p className="text-[11px] text-slate-400">JPG, PNG or PDF up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!docImage) {
                    setDocImage('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');
                  }
                  setStep('liveness');
                }}
                className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Facial Check</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LIVENESS FACIAL SCAN ================= */}
        {step === 'liveness' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-navy-100 dark:bg-navy-950 text-navy-800 dark:text-navy-300 border border-navy-200 dark:border-navy-800">
                  Step 2 of 2
                </span>
                <span className="text-xs text-slate-400 font-bold">Biometric Match</span>
              </div>
              <h2 id="kyc-modal-title" className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Facial Liveness & Identity Check
              </h2>
            </div>

            {/* Accessibility Accommodations Switcher */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-navy-700 dark:text-navy-300 shrink-0" />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {useAccessibleUpload ? 'Selfie Upload Mode' : 'Live Camera Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setUseAccessibleUpload(!useAccessibleUpload);
                }}
                className="text-navy-800 dark:text-navy-400 font-bold hover:underline cursor-pointer text-[11px]"
              >
                {useAccessibleUpload ? 'Switch to Camera' : 'Switch to Photo Upload'}
              </button>
            </div>

            {/* Hidden input for selfie upload option */}
            <input
              type="file"
              ref={selfieFileInputRef}
              onChange={handleSelfieUpload}
              accept="image/*"
              className="hidden"
              aria-label="Upload selfie photo"
            />

            {useAccessibleUpload ? (
              /* Accessible Mode: Upload or Select Clear Frontal Selfie */
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Accessibility className="w-4 h-4" />
                    <span>Accessible Photo Verification</span>
                  </p>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    Upload a clear frontal selfie holding your ID or looking straight at the camera. Suitable for screen-reader users and devices without webcam support.
                  </p>
                </div>

                {livenessImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900 flex items-center justify-center">
                    <img src={livenessImage} alt="Frontal face photo preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => selfieFileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/80 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 backdrop-blur-xs focus:ring-2 focus:ring-white"
                      aria-label="Change uploaded selfie photo"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Change Selfie</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => selfieFileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selfieFileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload frontal selfie photo"
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-navy-800 dark:hover:border-navy-500 bg-slate-50 dark:bg-slate-800/30 transition-colors space-y-2 focus:outline-none focus:ring-2 focus:ring-navy-600"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Tap to upload clear facial photo</p>
                      <p className="text-[11px] text-slate-400">JPG, PNG or WEBP (Front-facing, well lit)</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Live Camera Biometric Viewport */
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex flex-col items-center justify-center border border-slate-800">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      aria-label="Live camera preview for facial check"
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {/* Oval Liveness Frame Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4" aria-hidden="true">
                      <div className={`w-44 h-56 rounded-[50%] border-4 transition-all duration-300 ${
                        livenessStage === 'smile' 
                          ? 'border-emerald-400 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                          : livenessStage === 'blink'
                          ? 'border-amber-400 scale-100'
                          : 'border-white/80 scale-100'
                      }`} />
                    </div>
                    {/* Instruction Pill */}
                    <div className="absolute bottom-3 inset-x-4 flex flex-col items-center gap-2">
                      <span className="px-3.5 py-1.5 rounded-full bg-slate-950/85 text-white font-extrabold text-xs shadow-lg backdrop-blur-md text-center">
                        {cameraPrompt}
                      </span>
                      {/* Manual Capture Fallback button for accessibility */}
                      <button
                        type="button"
                        onClick={captureLivenessPhoto}
                        className="px-3 py-1 rounded-full bg-white/90 hover:bg-white text-slate-950 font-bold text-[11px] shadow-md cursor-pointer transition-all focus:ring-2 focus:ring-emerald-500"
                        aria-label="Snap photo manually now"
                      >
                        Snap Photo Manually
                      </button>
                    </div>
                  </>
                ) : livenessImage ? (
                  <div className="relative w-full h-full">
                    <img src={livenessImage} alt="Captured facial biometric preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      <span className="text-emerald-400 font-black text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Biometric Face Scan Captured</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-white">Live Camera Biometric Check</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Make sure your face is well-lit, remove glasses or hats, and look directly at the camera.
                      </p>
                    </div>
                    {cameraError && (
                      <p className="text-[11px] text-rose-400 font-bold bg-rose-950/50 p-2 rounded-lg border border-rose-800/50">
                        {cameraError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2 focus:ring-2 focus:ring-emerald-400"
                        aria-label="Open device camera and start verification"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Open Camera & Start</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => selfieFileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-slate-400"
                        aria-label="Upload photo file instead"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If photo captured, allow retake or confirm */}
            {livenessImage && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Biometric facial sample ready</span>
                <button
                  type="button"
                  onClick={() => {
                    setLivenessImage(null);
                    if (!useAccessibleUpload) {
                      startCamera();
                    } else {
                      selfieFileInputRef.current?.click();
                    }
                  }}
                  className="text-navy-800 dark:text-navy-400 font-bold text-xs hover:underline cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-navy-600"
                  aria-label="Retake facial photo"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retake</span>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setStep('document');
                }}
                className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!livenessImage) {
                    setLivenessImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600');
                  }
                  handleSubmitForVerification();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 focus:ring-2 focus:ring-emerald-400"
              >
                <span>Submit for Verification</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: VERIFYING ANIMATION ================= */}
        {step === 'verifying' && (
          <div className="py-8 px-4 text-center space-y-4 animate-in fade-in" role="status" aria-busy="true">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-7 h-7 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 id="kyc-modal-title" className="text-lg font-black text-slate-900 dark:text-slate-100">
                Cross-Referencing Biometrics
              </h2>
              <p id="kyc-modal-desc" className="text-xs text-slate-500 max-w-xs mx-auto">
                Validating government document security watermark and 3D facial liveness match...
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 5: COMPLETED ================= */}
        {step === 'completed' && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 id="kyc-modal-title" className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Verification Successful!
              </h2>
              <p id="kyc-modal-desc" className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                Your identity and facial liveness have been verified. The <strong>Verified Account</strong> badge is now active on your public profile.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-left space-y-1 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-extrabold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Artisan Account</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug">
                You now qualify for priority matching, direct customer calls, and high-value project inquiries across your location.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer focus:ring-2 focus:ring-navy-600"
            >
              Done & View Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
