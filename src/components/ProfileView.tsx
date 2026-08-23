import React, { useState, useRef } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language, t, SUPPORTED_LANGUAGES } from '../translations';
import { formatCurrency } from '../utils';
import { 
  User, Briefcase, Star, MapPin, Mail, Phone, Calendar, ShieldCheck, 
  Lock, Bell, CheckCircle2, Settings, Camera, Upload, Edit3, Check, 
  ChevronRight, Sliders, Moon, Sun, Globe, HelpCircle, MessageSquare, 
  Ticket, FileText, AlertTriangle, Trash2, X, Send, Key, LogOut, ExternalLink,
  ShieldAlert, Eye, RefreshCw
} from 'lucide-react';

import { ProProfileManagement } from './ProProfileManagement';

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
  // State for Customer Profile
  const [customerName, setCustomerName] = useState('Nneka Okonkwo');
  const [customerPhone, setCustomerPhone] = useState('+234 803 123 4567');
  const [customerEmail, setCustomerEmail] = useState('nneka.okonkwo@kazihub.ng');
  const [customerLocation, setCustomerLocation] = useState('Bodija, Ibadan');
  const customerSince = 'March 2024';

  // State for Professional Profile
  const [proName, setProName] = useState(activeProfessional.name);
  const [proPhone, setProPhone] = useState(activeProfessional.phone);
  const [proNeighborhood, setProNeighborhood] = useState(activeProfessional.neighborhood);
  const [proBio, setProBio] = useState(activeProfessional.bio);
  const [proTagline, setProTagline] = useState(activeProfessional.tagline);
  const [proHourlyRate, setProHourlyRate] = useState(activeProfessional.hourlyRate);

  // Preferences State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);

  const activeLang: Language = currentLanguage || selectedLanguage;

  // Privacy & Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('Public to Verified Artisans');

  // Modals & Drawers
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showSupportRequests, setShowSupportRequests] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  // Contact Support Form State
  const [supportMessage, setSupportMessage] = useState('');
  const [supportToast, setSupportToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleSaveProInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({ 
        name: proName, 
        phone: proPhone, 
        neighborhood: proNeighborhood, 
        bio: proBio, 
        tagline: proTagline, 
        hourlyRate: proHourlyRate 
      });
    }
    setIsEditing(false);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    setPasswordToast('Password updated successfully!');
    setTimeout(() => {
      setPasswordToast(null);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const handleContactSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportToast('Support message sent! Our KaziHub concierge will respond shortly.');
    setTimeout(() => {
      setSupportToast(null);
      setShowContactSupport(false);
      setSupportMessage('');
    }, 2000);
  };

  const currentAvatar = currentRole === 'customer' ? customerAvatar : activeProfessional.avatar;

  // Render Professional Profile Management
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

  // =========================================================================
  // CUSTOMER ACCOUNT HUB (Exact 7-section hierarchy)
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('profile.title', activeLang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('profile.subtitle', activeLang)}</p>
        </div>
      </div>

      {/* Hidden file inputs for avatar selection */}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="user" className="hidden" />

      {/* 1. PROFILE HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar container with upload hover overlay */}
            <div className="relative group shrink-0">
              <img
                src={currentAvatar}
                alt={customerName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-navy-800/10 dark:ring-navy-400/20 bg-slate-100 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title={t('profile.change_photo', activeLang)} aria-label={t('profile.change_photo', activeLang)}
              >
                <Camera className="w-6 h-6" />
              </button>
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900 shadow-xs" title={t('profile.verified_customer', activeLang)} aria-label={t('profile.verified_customer', activeLang)}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-300 text-[11px] font-bold border border-navy-100 dark:border-navy-900">
                <User className="w-3 h-3 text-navy-600 dark:text-navy-400" />
                <span>{t('profile.verified_customer', activeLang)}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{customerName}</h2>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
                <span>{customerLocation}</span>
              </p>
              <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('profile.customer_since', activeLang)} {customerSince}</span>
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
              <span>{t('profile.change_photo', activeLang)}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('profile.edit_profile', activeLang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PERSONAL INFORMATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t('personal.title', activeLang)}</h3>
              <p className="text-[11px] text-slate-400">{t('personal.subtitle', activeLang)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
          >
            {t('personal.edit', activeLang)}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">{t('personal.full_name', activeLang)}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerName}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">{t('personal.phone', activeLang)}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerPhone}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">{t('personal.email', activeLang)}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerEmail}</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="font-semibold text-slate-500">{t('personal.location', activeLang)}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{customerLocation}</span>
          </div>
        </div>
      </div>

      {/* 3. PREFERENCES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t('pref.title', activeLang)}</h3>
            <p className="text-[11px] text-slate-400">{t('pref.subtitle', activeLang)}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Notifications */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('pref.push_notif', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('pref.push_sub', activeLang)}</p>
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

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('pref.email_alerts', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('pref.email_sub', activeLang)}</p>
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

          {/* Language */}
          <div 
            onClick={() => setShowLanguageModal(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('pref.language', activeLang)}</p>
              <p className="text-[11px] text-slate-500 font-semibold text-navy-800 dark:text-navy-400">{activeLang}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400">
              <Globe className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Appearance (Theme dark or light) */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('pref.appearance', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('pref.current_theme', activeLang)}: <strong className="text-slate-700 dark:text-slate-300">{darkMode ? t('pref.dark_mode', activeLang) : t('pref.light_mode', activeLang)}</strong></p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('pref.light_mode', activeLang)}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t('pref.dark_mode', activeLang)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. PRIVACY & SECURITY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t('security.title', activeLang)}</h3>
            <p className="text-[11px] text-slate-400">{t('security.subtitle', activeLang)}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Password */}
          <div 
            onClick={() => setShowPasswordModal(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('security.password', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('security.password_sub', activeLang)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400">
              <Key className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Security */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('security.2fa', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('security.2fa_sub', activeLang)}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => setTwoFactorAuth(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Privacy */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('security.visibility', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{profileVisibility}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
              {t('security.protected', activeLang)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. HELP & SUPPORT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t('help.title', activeLang)}</h3>
            <p className="text-[11px] text-slate-400">{t('help.subtitle', activeLang)}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Help Center */}
          <div 
            onClick={() => setShowHelpCenter(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('help.center', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('help.center_sub', activeLang)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400" />
          </div>

          {/* Contact Support */}
          <div 
            onClick={() => setShowContactSupport(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('help.contact', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('help.contact_sub', activeLang)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400">
              <MessageSquare className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Support Requests */}
          <div 
            onClick={() => setShowSupportRequests(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('help.requests', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('help.requests_sub', activeLang)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">1 Active</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 6. LEGAL */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{t('legal.title', activeLang)}</h3>
            <p className="text-[11px] text-slate-400">{t('legal.subtitle', activeLang)}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Terms */}
          <div 
            onClick={() => setShowTermsModal(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('legal.terms', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('legal.terms_sub', activeLang)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400" />
          </div>

          {/* Privacy Policy */}
          <div 
            onClick={() => setShowPrivacyModal(true)}
            className="py-3 flex items-center justify-between cursor-pointer group"
          >
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors">{t('legal.privacy', activeLang)}</p>
              <p className="text-[11px] text-slate-500">{t('legal.privacy_sub', activeLang)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy-800 dark:group-hover:text-navy-400" />
          </div>
        </div>
      </div>

      {/* 7. ACCOUNT ACTIONS */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 rounded-2xl p-3.5 sm:p-4 border border-rose-500/20 dark:border-rose-900/40 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-rose-500/10 dark:border-rose-900/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-rose-700 dark:text-rose-300">{t('actions.title', activeLang)}</h3>
              <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70">{t('actions.subtitle', activeLang)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('actions.logout', activeLang)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('actions.delete', activeLang)}</span>
          </button>
        </div>
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Edit Personal Information</h3>
              <p className="text-xs text-slate-500">Update your name, phone number, and location.</p>
            </div>

            <form onSubmit={handleSaveCustomerInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Location / Neighborhood</label>
                <input
                  type="text"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-800"
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

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Change Password</h3>
                <p className="text-xs text-slate-500">Ensure your account uses a strong password.</p>
              </div>
            </div>

            {passwordToast && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passwordToast}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECTOR MODAL */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowLanguageModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{t('modal.select_language', activeLang)}</h3>
                <p className="text-xs text-slate-500">{t('modal.choose_language', activeLang)}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang);
                    if (onLanguageChange) {
                      onLanguageChange(lang);
                    }
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    activeLang === lang
                      ? 'bg-navy-800 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{lang}</span>
                  {activeLang === lang && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HELP CENTER MODAL */}
      {showHelpCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowHelpCenter(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Help Center & FAQs</h3>
                <p className="text-xs text-slate-500">Quick answers to common questions about KaziHub services.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">How does KaziHub Escrow protection work?</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  When you request a service, funds are securely locked in KaziHub escrow. Payment is only released to the artisan after you inspect and confirm job completion.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">What is the 4-day post-completion warranty?</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  After an artisan submits work completion, you have a 4-day warranty period to report any defects or issues before the job is officially closed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Are KaziHub artisans verified?</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Yes! All artisans undergo identity verification, trade skill vetting, and background checks before receiving verified badges.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpCenter(false)}
                className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Close Help Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      {showContactSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowContactSupport(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Contact KaziHub Support</h3>
                <p className="text-xs text-slate-500">Our concierge team responds within minutes.</p>
              </div>
            </div>

            {supportToast ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{supportToast}</span>
              </div>
            ) : (
              <form onSubmit={handleContactSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">How can we help you today?</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your question, booking inquiry, or platform feedback..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-navy-800 outline-none"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                  ⚡ KaziHub Trust & Safety officers are available 24/7 across Ibadan and Oyo State.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowContactSupport(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT REQUESTS MODAL */}
      {showSupportRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowSupportRequests(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Support Requests</h3>
                <p className="text-xs text-slate-500">Active and past resolution tickets.</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px]">IN REVIEW</span>
                  <span className="text-[10px] text-slate-400 font-medium">Ticket #KAZI-8842</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Solar Inverter Inspection Ticket</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  KaziHub Trust officer assigned. Escrow payout is currently paused pending technical verification.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">RESOLVED</span>
                  <span className="text-[10px] text-slate-400 font-medium">Ticket #KAZI-4102</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Plumbing Service Price Clarification</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Resolved by customer concierge. Quote estimate was adjusted and approved.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSupportRequests(false)}
                className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Terms of Service</h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. Platform Overview:</strong> KaziHub provides an artisan discovery, booking, and escrow protection platform connecting verified technicians with users across Ibadan and Oyo State.
              </p>
              <p>
                <strong>2. Escrow & Payments:</strong> All service payments are held safely in KaziHub Escrow until the job is completed and confirmed by the customer.
              </p>
              <p>
                <strong>3. Service Warranties:</strong> A 4-day warranty window applies to completed services before final escrow release.
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-extrabold text-xs cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Privacy Policy</h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>1. Data Protection:</strong> KaziHub complies strictly with the Nigeria Data Protection Regulation (NDPR). Your personal data is never sold or shared with unverified third parties.
              </p>
              <p>
                <strong>2. Location Usage:</strong> Neighborhood data is strictly used to match you with nearby trade specialists and estimate dispatch distances.
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-extrabold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Delete Account?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              Deleting your account will remove your personal details, booking records, saved artisans, and support history.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                No, Keep Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteAccount) {
                    onDeleteAccount();
                  } else if (onLogout) {
                    onLogout();
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
