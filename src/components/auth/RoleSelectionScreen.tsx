import React from 'react';
import { Role } from '../../types';
import { User, Briefcase, ArrowRight, ShieldCheck, Wrench } from 'lucide-react';

interface RoleSelectionScreenProps {
  onSelectRole: (role: Role) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  // Lock body scroll to prevent any layout scrolling
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 transition-colors overflow-hidden">
      <div className="w-full max-w-3xl space-y-6 sm:space-y-8 text-center max-h-full overflow-y-auto no-scrollbar py-4 px-2 flex flex-col justify-center">
        
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-navy-800 flex items-center justify-center text-white shadow-lg shadow-navy-800/30 mb-2">
            <Wrench className="w-6 h-6 text-brand-orange-400" />
          </div>
          <span className="px-3 py-1 rounded-full bg-navy-800/10 text-navy-800 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            Account Setup
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            How will you use <span className="text-brand-orange-500">KaziHub</span>?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
            Select your account type to personalize your experience. You can switch portal preferences anytime later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Customer Choice */}
          <button
            onClick={() => onSelectRole('customer')}
            className="group text-left p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-navy-600 dark:hover:border-blue-500 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Customer</h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Find verified local artisans, book repair appointments, and manage home maintenance securely.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-extrabold text-navy-800 dark:text-blue-400">
              <span>Select Customer Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-brand-orange-500" />
            </div>
          </button>

          {/* Professional Choice */}
          <button
            onClick={() => onSelectRole('professional')}
            className="group text-left p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-navy-600 dark:hover:border-blue-500 shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange-500/10 text-brand-orange-600 dark:text-brand-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Professional Partner</h3>
                  <span className="px-2 py-0.5 rounded-md bg-brand-orange-500/10 text-brand-orange-600 text-[10px] font-extrabold">Pro</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Showcase your trade portfolio, receive client bookings, accept job requests, and grow your local business.
                </p>
              </div>
            </div>
            <div className="pt-6 flex items-center gap-2 text-xs font-extrabold text-navy-800 dark:text-blue-400">
              <span>Select Professional Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-brand-orange-500" />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

