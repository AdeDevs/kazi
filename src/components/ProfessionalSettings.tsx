import React, { useState } from 'react';
import { Professional } from '../types';
import { formatCurrency } from '../utils';
import { 
  User, Mail, Phone, Sun, Moon, Bell, MessageSquare, Calendar, 
  HelpCircle, MessageCircle, LogOut, ChevronRight, Check, AlertTriangle,
  ShieldCheck, Star, MapPin, Briefcase, Award, Coins
} from 'lucide-react';

interface ProfessionalSettingsProps {
  professional: Professional;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const ProfessionalSettings: React.FC<ProfessionalSettingsProps> = ({
  professional,
  darkMode,
  onToggleDarkMode,
  onEditProfile,
  onLogout
}) => {
  // Notification states
  const [jobRequestNotifs, setJobRequestNotifs] = useState(() => {
    return localStorage.getItem(`kazihub_notif_job_request_${professional.id}`) !== 'false';
  });
  const [messageNotifs, setMessageNotifs] = useState(() => {
    return localStorage.getItem(`kazihub_notif_message_${professional.id}`) !== 'false';
  });
  const [bookingReminders, setBookingReminders] = useState(() => {
    return localStorage.getItem(`kazihub_notif_booking_reminder_${professional.id}`) !== 'false';
  });

  // Logout confirmation modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleToggleJobRequest = () => {
    const newVal = !jobRequestNotifs;
    setJobRequestNotifs(newVal);
    localStorage.setItem(`kazihub_notif_job_request_${professional.id}`, String(newVal));
  };

  const handleToggleMessage = () => {
    const newVal = !messageNotifs;
    setMessageNotifs(newVal);
    localStorage.setItem(`kazihub_notif_message_${professional.id}`, String(newVal));
  };

  const handleToggleBooking = () => {
    const newVal = !bookingReminders;
    setBookingReminders(newVal);
    localStorage.setItem(`kazihub_notif_booking_reminder_${professional.id}`, String(newVal));
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 id="settings-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage your account preferences.
        </p>
      </div>

      {/* Main Grid/List Layout */}
      <div className="space-y-6">
        
        {/* Section 1 — Personal Information (Redesigned & Enhanced) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Banner-like top highlight */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-850 p-3.5 sm:p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full sm:w-auto text-center sm:text-left">
              <div className="relative shrink-0">
                <img 
                  src={professional.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'} 
                  alt={professional.name} 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-navy-950"
                />
                {professional.isAvailableNow && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-navy-900"></span>
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-black tracking-tight">{professional.name}</h2>
                  {professional.verified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-[10px] font-black flex items-center gap-1 text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 fill-emerald-500/20" /> Verified Partner
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-300 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>{professional.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{professional.rating}</span>
                    <span className="opacity-70">({professional.reviewCount || 0} reviews)</span>
                  </span>
                </p>
                
                <p className="text-[11px] text-slate-400 leading-relaxed italic max-w-md hidden sm:block">
                  "{professional.tagline || 'Professional service partner on KaziHub'}"
                </p>
              </div>
            </div>

            <div className="relative z-10 w-full sm:w-auto flex justify-center">
              <button
                onClick={onEditProfile}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-navy-900 dark:text-navy-100 font-extrabold text-xs shadow-md transition-all hover:scale-[1.01] cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Core details list */}
          <div className="p-3.5 sm:p-4 space-y-4 bg-white dark:bg-slate-900">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
              <div className="text-center space-y-1">
                <div className="flex justify-center text-slate-400 dark:text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Experience</p>
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{professional.experienceYears} Years</p>
              </div>
              <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-800">
                <div className="flex justify-center text-slate-400 dark:text-slate-500">
                  <Award className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{professional.completedJobs} Jobs</p>
              </div>
              <div className="text-center space-y-1">
                <div className="flex justify-center text-slate-400 dark:text-slate-500">
                  <Coins className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hourly Rate</p>
                <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{formatCurrency(professional.hourlyRate)}</p>
              </div>
            </div>

            {/* Contacts and Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-navy-800/10 text-navy-850 dark:text-navy-400 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Registered Name</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate">{professional.name}</span>
                </div>
              </div>

              <a 
                href={`mailto:${professional.email}`}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-4 hover:border-navy-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{professional.email}</span>
                </div>
              </a>

              <a 
                href={`tel:${professional.phone}`}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-4 hover:border-navy-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{professional.phone}</span>
                </div>
              </a>

              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Neighborhood</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white block truncate">{professional.neighborhood || professional.location || 'Ibadan, Oyo State'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Appearance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-orange-500/10 text-brand-orange-500 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Appearance
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize how KaziHub looks on your screen.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => darkMode && onToggleDarkMode()}
              className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                !darkMode 
                  ? 'bg-navy-800 text-white border-navy-850 shadow-xs' 
                  : 'bg-slate-150/40 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-850 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Sun className="w-4 h-4 text-brand-orange-500" />
              <span>Light Mode</span>
            </button>
            <button
              onClick={() => !darkMode && onToggleDarkMode()}
              className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-navy-800 text-white border-navy-850 shadow-xs' 
                  : 'bg-slate-150/40 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-850 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Moon className="w-4 h-4 text-sky-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Section 3 — Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Notification Preferences
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control which updates and alerts you receive.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Preference 1 */}
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5 pr-4">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Job Request Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive alerts when clients book or request a repair job.</p>
              </div>
              <button
                onClick={handleToggleJobRequest}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  jobRequestNotifs ? 'bg-navy-800 dark:bg-navy-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    jobRequestNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Preference 2 */}
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5 pr-4">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Message Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Get notified when customers send you chat messages.</p>
              </div>
              <button
                onClick={handleToggleMessage}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  messageNotifs ? 'bg-navy-800 dark:bg-navy-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    messageNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Preference 3 */}
            <div className="flex items-center justify-between py-4">
              <div className="space-y-0.5 pr-4">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Booking Reminders</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive calendar alerts and timely reminders for upcoming schedules.</p>
              </div>
              <button
                onClick={handleToggleBooking}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bookingReminders ? 'bg-navy-800 dark:bg-navy-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    bookingReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4 — Help & Support */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Help & Support
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need assistance or have questions about using KaziHub?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => alert('Help Centre is coming soon! Read about KaziHub terms and services.')}
              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Help Centre</h4>
                  <p className="text-[10px] text-slate-400">Browse user tutorials & FAQs</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => alert('Contacting support: You can send us an email at partner-support@kazihub.com')}
              className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Contact Support</h4>
                  <p className="text-[10px] text-slate-400">Get helper assistance</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Section 5 — Logout */}
        <div className="flex justify-start pt-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer shadow-xs hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>

      </div>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-4 sm:p-5 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Sign Out of KaziHub?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto">
                  Are you sure you want to log out of your Babatunde partner session? You can sign back in at any time.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
