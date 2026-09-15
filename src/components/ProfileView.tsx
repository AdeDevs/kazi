import React, { useState, useRef } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language } from '../translations';
import {
  User, MapPin, Calendar, CheckCircle2, Camera, Edit3,
  X, LogOut, ChevronRight, Bookmark, Star
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UserAvatar } from './ui/UserAvatar';
import { Card, CardHeader } from './ui/Card';
import { ProProfileManagement } from './ProProfileManagement';
import { useAuth } from '../context/AuthContext';

interface ProfileViewProps {
  currentRole: Role;
  activeProfessional: Professional;
  bookings: Booking[];
  professionals: Professional[];
  savedProIds: string[];
  customerAvatar: string;
  onUpdateCustomerAvatar: (url: string) => void;
  onUpdateProfile?: (updated: Partial<Professional>) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
  onTabChange?: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentRole,
  activeProfessional,
  bookings,
  professionals,
  savedProIds,
  customerAvatar,
  onUpdateCustomerAvatar,
  onUpdateProfile,
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  onDeleteAccount,
  currentLanguage = 'English (Nigeria)',
  onLanguageChange,
  onTabChange
}) => {
  const { user, updateUser, uploadProfilePicture } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  // Modals & UI States
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Local instant preview first
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultUrl = event.target.result as string;
        if (currentRole === 'customer') {
          onUpdateCustomerAvatar(resultUrl);
        } else if (onUpdateProfile) {
          onUpdateProfile({ profile_picture: resultUrl });
        }
      }
    };
    reader.readAsDataURL(file);

    // Call server API if user logged in
    setIsUploadingAvatar(true);
    try {
      const updated = await uploadProfilePicture(file);
      if (updated.profile_picture) {
        if (currentRole === 'customer') {
          onUpdateCustomerAvatar(updated.profile_picture);
        } else if (onUpdateProfile) {
          onUpdateProfile({ profile_picture: updated.profile_picture });
        }
      }
      triggerToast('Profile photo uploaded and saved successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Photo updated locally.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value so re-selecting same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

  // If role is professional, render the dedicated Pro management component
  if (currentRole === 'professional') {
    return (
      <ProProfileManagement
        activeProfessional={activeProfessional}
        onUpdateProfile={onUpdateProfile}
        onTabChange={onTabChange}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
      />
    );
  }

  const currentAvatar = customerAvatar;
  const completedBookingsCount = bookings.filter(b => b.status === 'paid_out').length;
  const activeBookingsCount = bookings.filter(b => ['pending', 'quote_requested', 'accepted', 'in_progress'].includes(b.status)).length;
  const savedPros = professionals.filter(p => savedProIds.includes(p.id)).slice(0, 3);

  return (
    <div className="w-full max-w-none space-y-4 animate-in fade-in duration-300">
      <h1 className="sr-only">Profile & Preferences</h1>

      {/* Page Header (Mobile Only) */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Profile & Preferences</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage your identity, language, support, and app settings.</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />

      {/* 1. IDENTITY & PROFILE HEADER CARD */}
      <Card className="relative overflow-hidden">
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
                disabled={isUploadingAvatar}
                className={`absolute inset-0 rounded-2xl bg-slate-950/60 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer ${
                  isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Change Avatar"
                aria-label="Change Avatar"
              >
                {isUploadingAvatar ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-[10px] font-bold">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Change</span>
                  </>
                )}
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
      </Card>

      {/* 2. QUICK STATS */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{completedBookingsCount}</p>
          <p className="text-[11px] font-semibold text-slate-500">Jobs Completed</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{activeBookingsCount}</p>
          <p className="text-[11px] font-semibold text-slate-500">Active Bookings</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{savedProIds.length}</p>
          <p className="text-[11px] font-semibold text-slate-500">Saved Artisans</p>
        </Card>
      </div>

      {/* 3. PERSONAL INFORMATION */}
      <Card className="space-y-4">
        <CardHeader
          title="Personal Information"
          subtitle={'Your contact info used for bookings & notifications. Use "Edit Details" above to update.'}
        />

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
      </Card>

      {/* 4. SAVED ARTISANS PREVIEW */}
      {savedPros.length > 0 && (
        <Card className="space-y-4">
          <CardHeader
            title="Saved Artisans"
            subtitle="Professionals you've bookmarked for future jobs."
            action={onTabChange && (
              <button
                type="button"
                onClick={() => onTabChange('explore')}
                className="text-xs font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer shrink-0"
              >
                See All
              </button>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savedPros.map((pro) => (
              <div key={pro.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <UserAvatar
                  src={pro.profile_picture}
                  name={pro.name}
                  sizeClassName="w-9 h-9"
                  textClassName="text-xs font-black"
                  roundedClassName="rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{pro.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    <span>{pro.rating_average} &middot; {pro.category}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. ACCOUNT SETTINGS LINK -- preferences, security, privacy, help & legal all live in the
          shared Settings page so both customer and artisan accounts get the same controls. */}
      {onTabChange && (
        <Card
          as="button"
          onClick={() => onTabChange('settings')}
          className="w-full flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer"
        >
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Account Settings</h3>
            <p className="text-[11px] text-slate-400">Preferences, security, privacy, help & legal.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </Card>
      )}

      {/* 6. SIGN OUT (With Universal Confirmation Modal) */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </Card>

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
