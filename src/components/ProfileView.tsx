import React, { useState, useRef } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language, t, SUPPORTED_LANGUAGES } from '../translations';
import { 
  User, MapPin, Mail, Phone, Calendar, CheckCircle2, Camera, Edit3, 
  Sliders, Moon, Sun, Globe, HelpCircle, MessageSquare, 
  Ticket, FileText, AlertTriangle, X, Send, LogOut, ExternalLink,
  ChevronDown, ChevronUp, Clock, PhoneCall, ShieldCheck
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UserAvatar } from './ui/UserAvatar';
import { ProProfileManagement } from './ProProfileManagement';
import { useAuth } from '../context/AuthContext';

interface ProfileViewProps {
  currentRole: Role;
  activeProfessional: Professional;
  bookings: Booking[];
  customerAvatar: string;
  onUpdateCustomerAvatar: (url: string) => void;
  onUpdateProfile?: (updated: Partial<Professional>) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentRole,
  activeProfessional,
  bookings,
  customerAvatar,
  onUpdateCustomerAvatar,
  onUpdateProfile,
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  onDeleteAccount,
  currentLanguage = 'English (Nigeria)',
  onLanguageChange
}) => {
  const { user, updateUser, logout: authLogout } = useAuth();

  // Customer Profile Information initialized with backend user data
  const [customerFirstName, setCustomerFirstName] = useState(() => user?.first_name || (user?.email ? user.email.split('@')[0] : 'Client'));
  const [customerLastName, setCustomerLastName] = useState(() => user?.last_name || '');
  const [customerPhone, setCustomerPhone] = useState(() => user?.phone_number || '');
  const [customerEmail, setCustomerEmail] = useState(() => user?.email || '');
  const [customerLocation, setCustomerLocation] = useState(() => user?.state ? `${user.state}, Nigeria` : 'Oyo, Nigeria');

  React.useEffect(() => {
    if (user) {
      setCustomerFirstName(user.first_name || '');
      setCustomerLastName(user.last_name || '');
      setCustomerPhone(user.phone_number || '');
      setCustomerEmail(user.email || '');
      if (user.state) {
        setCustomerLocation(`${user.state}, Nigeria`);
      }
    }
  }, [user]);

  const customerName = `${customerFirstName} ${customerLastName}`.trim() || user?.email?.split('@')[0] || 'User Profile';
  const customerSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2024';

  // Preferences
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const activeLang: Language = currentLanguage || selectedLanguage;

  // Modals & UI States
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showSupportRequests, setShowSupportRequests] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Support Form State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubject, setSupportSubject] = useState('General Inquiry');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultUrl = event.target.result as string;
        if (currentRole === 'customer') {
          onUpdateCustomerAvatar(resultUrl);
        } else if (onUpdateProfile) {
          onUpdateProfile({ avatar: resultUrl });
        }
        triggerToast('Profile photo updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await updateUser({
          first_name: customerFirstName,
          last_name: customerLastName,
          phone_number: customerPhone,
          state: customerLocation.split(',')[0].trim() || user.state
        });
      }
      setIsEditing(false);
      triggerToast('Profile details updated and saved successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update profile.');
    }
  };

  const handleContactSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    triggerToast('Support request submitted! Ticket #KZ-' + Math.floor(1000 + Math.random() * 9000) + ' created.');
    setShowContactSupport(false);
    setSupportMessage('');
  };

  const faqs = [
    {
      q: 'How does KaziHub secure escrow payments?',
      a: 'When you book a service, your funds are securely held in the KaziHub Escrow Vault. Funds are only released to the artisan once you confirm completion or after our 4-day inspection window.'
    },
    {
      q: 'What happens if an artisan does not arrive?',
      a: 'You can cancel with zero penalty or reassign the request to another verified pro nearby. Our support concierge is also available 24/7 to resolve disputes.'
    },
    {
      q: 'How are artisans verified?',
      a: 'All KaziHub artisans undergo National Identity verification, trade certification audit, and local neighborhood endorsement checks before receiving a Verified Pro badge.'
    },
    {
      q: 'Can I change my service address?',
      a: 'Yes, click "Edit Profile" above to modify your primary location or specify custom delivery coordinates during booking.'
    }
  ];

  // If role is professional, render the dedicated Pro management component
  if (currentRole === 'professional') {
    return (
      <ProProfileManagement
        activeProfessional={activeProfessional}
        onUpdateProfile={onUpdateProfile}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />
    );
  }

  const currentAvatar = customerAvatar;

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header (Mobile Only) */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Profile & Preferences</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage your identity, language, support, and app settings.</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

      {/* 1. IDENTITY & PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              <UserAvatar
                src={currentAvatar}
                name={customerName}
                sizeClassName="w-24 h-24 sm:w-28 sm:h-28"
                textClassName="text-3xl font-black"
                roundedClassName="rounded-2xl"
                verified={Boolean(user?.is_email_verified)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Change Avatar"
                aria-label="Change Avatar"
              >
                <Camera className="w-6 h-6" />
              </button>
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900 shadow-xs" title="Verified Customer">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-300 text-[11px] font-bold border border-navy-100 dark:border-navy-900">
                <User className="w-3 h-3 text-navy-600 dark:text-navy-400" />
                <span>Verified Customer</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{customerName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
                <span>{customerLocation}</span>
              </p>
              <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Customer since {customerSince}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Change Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PERSONAL INFORMATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Personal Information</h3>
              <p className="text-[11px] text-slate-400">Your contact info used for bookings & notifications.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">Full Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerName}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">Phone Number</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerPhone}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">Email Address</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerEmail}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">Primary Location</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerLocation}</span>
          </div>
        </div>
      </div>

      {/* 3. PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Preferences</h3>
            <p className="text-[11px] text-slate-400">Language, display mode, and notification channels.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Push Notifications */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Push Notifications</p>
              <p className="text-[11px] text-slate-500">Real-time alerts for booking acceptances & chats.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Email Alerts */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Email Summaries</p>
              <p className="text-[11px] text-slate-500">Escrow payment receipts and job completion reports.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Theme Toggle */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Display Theme</p>
              <p className="text-[11px] text-slate-500">{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </div>

          {/* Language Selection */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Interface Language</p>
              <p className="text-[11px] text-slate-500">{activeLang}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLanguageModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Change</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. HELP & SUPPORT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Help & Support</h3>
            <p className="text-[11px] text-slate-400">Help center FAQs, live concierge, and escalation hotlines.</p>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isExp = expandedFaq === idx;
            return (
              <div key={idx} className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExp ? null : idx)}
                  className="w-full p-3 text-left font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />}
                </button>
                {isExp && (
                  <div className="p-3 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800 leading-relaxed bg-white dark:bg-slate-900">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowContactSupport(true)}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Support Concierge</span>
          </button>
          <a
            href="tel:+2348000005294"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Emergency Toll-Free Helpline</span>
          </a>
        </div>
      </div>

      {/* 5. LEGAL & COMPLIANCE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Legal & Terms</h3>
            <p className="text-[11px] text-slate-400">Terms of service, escrow agreements, and data privacy.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Terms of Service</p>
              <p className="text-[11px] text-slate-500">Rules of the platform and service level guarantees.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-navy-800 dark:text-navy-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Privacy Policy</p>
              <p className="text-[11px] text-slate-500">How your personal details and location data are handled.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-navy-800 dark:text-navy-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. LOGOUT BUTTON ONLY (With Universal Confirmation Modal) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Sign Out</h3>
          <p className="text-[11px] text-slate-500">Securely sign out of your current session on this device.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of KaziHub</span>
        </button>
      </div>

      {/* Toast notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsEditing(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-5 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Edit Personal Details</h3>
              <p className="text-xs text-slate-500">Update your name, telephone, and delivery address.</p>
            </div>

            <form onSubmit={handleSaveCustomerInfo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={customerFirstName}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Neighborhood / Address</label>
                <input
                  type="text"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECTION MODAL */}
      {showLanguageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowLanguageModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLanguageModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Select Interface Language</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang);
                    if (onLanguageChange) onLanguageChange(lang);
                    setShowLanguageModal(false);
                    triggerToast(`Language changed to ${lang}`);
                  }}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    activeLang === lang 
                      ? 'bg-navy-800 text-white' 
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{lang}</span>
                  {activeLang === lang && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      {showContactSupport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowContactSupport(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactSupport(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">KaziHub Support Concierge</h3>
              <p className="text-xs text-slate-500">Send an inquiry or raise an issue regarding your bookings.</p>
            </div>

            <form onSubmit={handleContactSupportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Booking & Artisan Issue">Booking & Artisan Issue</option>
                  <option value="Payment & Escrow Question">Payment & Escrow Question</option>
                  <option value="Account & Security">Account & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your request or issue with full details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactSupport(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">KaziHub Terms of Service</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>Welcome to KaziHub. By utilizing our marketplace and booking artisans, you agree to our escrow safety commitments and fair mediation policy.</p>
              <p><strong>1. Escrow Protection:</strong> All booking deposits remain locked until customer sign-off or resolution of inspected milestones.</p>
              <p><strong>2. Artisan Conduct:</strong> Artisans must maintain verified credentials, adhere to scheduled timelines, and respect client premises.</p>
              <p><strong>3. Cancellation Policy:</strong> Flexible cancellations are permitted up to 2 hours prior to scheduled arrival with zero penalty.</p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Privacy Policy</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>KaziHub treats your location and personal contact data with bank-grade encryption standards under NDPR and GDPR requirements.</p>
              <p>• Your phone number is only revealed to an artisan after an escrow booking is confirmed.</p>
              <p>• We never sell or share customer contact records with third-party advertisers.</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL SLIDE-UP LOGOUT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          if (onLogout) onLogout();
        }}
        title="Sign Out of KaziHub"
        description="Are you sure you want to log out of your customer account? You can log back in anytime with your credentials."
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        type="logout"
      />

    </div>
  );
};
