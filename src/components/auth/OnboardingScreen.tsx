import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Star, MapPin, CheckCircle2, MessageSquare, ArrowRight, ArrowLeft, Wrench } from 'lucide-react';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const ONBOARDING_STEPS = [
  {
    id: 1,
    badge: "Verified Local Experts",
    title: "Find Trusted Professionals Near You",
    description: "Discover skilled local artisans and professionals based on your exact neighborhood, ratings, reviews, and availability.",
    previewType: 'discovery'
  },
  {
    id: 2,
    badge: "Transparent Quality",
    title: "Choose With Complete Confidence",
    description: "Compare verified portfolios, customer reviews, completed jobs, and pricing before making your booking decision.",
    previewType: 'comparison'
  },
  {
    id: 3,
    badge: "Seamless Workflow",
    title: "From Search to Satisfied Service",
    description: "Book trusted professionals, share photos of the job, chat directly, and manage all your home services in one place.",
    previewType: 'journey'
  }
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Lock body scroll to make onboarding screen completely unscrollable across all devices
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('kazihub_onboarding_seen', 'true');
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('kazihub_onboarding_seen', 'true');
    onFinish();
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-8 md:p-12 transition-colors duration-300 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto shrink-0 mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-navy-800 flex items-center justify-center text-white font-black shadow-lg shadow-navy-800/30 shrink-0">
            K
          </div>
          <span className="font-extrabold text-lg tracking-tight shrink-0">Kazi<span className="text-brand-orange-500">Hub</span></span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="w-full max-w-xl mx-auto my-auto py-4 sm:py-6 flex-1 flex flex-col justify-center shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 text-center flex flex-col items-center justify-center w-full"
          >
            {/* Visual Direction / Interactive Preview Card */}
            <div className="relative mx-auto w-full max-w-sm h-48 sm:h-60 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center p-4 sm:p-6 shrink-0">
              
              {step.previewType === 'discovery' && (
                <div className="w-full space-y-2.5 sm:space-y-3 text-left relative z-10">
                  <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                        alt="Pro"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">Ibrahim Musa</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">Master Electrician</div>
                      </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-orange-500/10 text-brand-orange-600 flex items-center justify-center font-bold shrink-0">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">Local Radar</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">Within 2km</div>
                      </div>
                  </div>
                </div>
              )}

              {step.previewType === 'comparison' && (
                <div className="w-full space-y-2.5 sm:space-y-3 text-left relative z-10">
                  <div className="p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-navy-800 dark:text-blue-400 uppercase tracking-wider">Portfolio</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">148 Jobs</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 sm:h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80" alt="Work" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-10 sm:h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80" alt="Work" className="w-full h-full object-cover" />
                      </div>
                      <div className="h-10 sm:h-12 rounded-lg bg-navy-800 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-xs">
                        +12 More
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step.previewType === 'journey' && (
                <div className="w-full space-y-2.5 sm:space-y-3 text-left relative z-10">
                  <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Booking Confirmed</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">Tomorrow, 10:00 AM</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-navy-800/10 text-navy-800 flex items-center justify-center font-bold shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Secure Chat</div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">Chat instantly</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Headline and Supporting Copy */}
            <div className="space-y-2 sm:space-y-4 px-2">
              <span className="inline-block px-2.5 sm:px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-navy-800 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest shrink-0">
                {step.badge}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {step.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm sm:max-w-md mx-auto font-medium">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step Pagination Indicators */}
        <div className="flex items-center justify-center gap-2 pt-4 sm:pt-8 shrink-0">
          {ONBOARDING_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-navy-800 dark:bg-blue-500' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-xl mx-auto flex flex-col gap-4 shrink-0 mt-6 sm:mt-8">
        <button
          onClick={handleNext}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-navy-800 text-white font-bold text-xs sm:text-sm shadow-md hover:bg-navy-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

