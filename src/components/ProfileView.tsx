import React, { useState, useRef } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language } from '../translations';
import {
  MapPin, CheckCircle2, Edit3,
  ChevronRight, Star
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UserAvatar, getInitials, getAvatarColor } from './ui/UserAvatar';
import { VerifiedBadge } from './ui/VerifiedBadge';
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [heroPhotoFailed, setHeroPhotoFailed] = useState(false);

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

  // Edit-mode draft state: the form edits these, NOT the display values above, so nothing
  // appears to "save" until Save Changes actually runs -- and Cancel just discards the draft
  // instead of needing to unwind changes that were never applied to the real display state.
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  // Modals & UI States
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const isDraftDirty =
    draftFirstName !== customerFirstName ||
    draftLastName !== customerLastName ||
    draftPhone !== customerPhone ||
    draftEmail !== customerEmail ||
    draftLocation !== customerLocation;

  const startEditing = () => {
    setDraftFirstName(customerFirstName);
    setDraftLastName(customerLastName);
    setDraftPhone(customerPhone);
    setDraftEmail(customerEmail);
    setDraftLocation(customerLocation);
    setIsEditing(true);
  };

  const requestCancelEdit = () => {
    if (isSavingProfile) return;
    if (isDraftDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditing(false);
    }
  };

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
    setIsSavingProfile(true);
    try {
      if (user) {
        await updateUser({
          first_name: draftFirstName,
          last_name: draftLastName,
          phone_number: draftPhone,
          state: draftLocation.split(',')[0].trim() || user.state
        });
      }
      setIsEditing(false);
      triggerToast('Profile details updated and saved successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
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
  const hasHeroPhoto = Boolean(currentAvatar && currentAvatar.trim().length > 0 && !heroPhotoFailed);
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

      {/* 1. IDENTITY & PERSONAL INFORMATION -- one card, single source of truth. Editing happens
          in place (the read-only rows below become a form) instead of a popup, and the only way
          to change the photo is tapping the avatar itself -- no separate "Change Photo" button
          duplicating that action, and no icon overlaid on the photo. */}
      {/* This card intentionally doesn't use space-y-* for its top-level sections: Tailwind's
          space-y selector only excludes elements carrying the literal `hidden` HTML attribute,
          not ones hidden via a responsive class like sm:hidden -- so it can't tell the mobile-only
          and desktop-only blocks below apart from any other sibling, and would add its margin-top
          onto whichever one happens to render, regardless of breakpoint. Each block below is
          self-spaced instead, and the rows/form block carries its own mt-4. */}
      <Card className="relative overflow-hidden">
        {/* Mobile: full-bleed hero -- the real photo if there is one, otherwise the same
            deterministic color + initials UserAvatar falls back to everywhere else, just at
            full-bleed scale. Tapping anywhere on it still opens the photo picker. */}
        <div className="sm:hidden -mx-[15px] -mt-[15px] relative h-[220px] rounded-t-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 w-full h-full cursor-pointer"
            title="Tap to change your photo"
            aria-label="Change profile photo"
          >
            {hasHeroPhoto ? (
              <img
                src={currentAvatar}
                alt={customerName}
                className="w-full h-full object-cover"
                onError={() => setHeroPhotoFailed(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(customerName)}`}>
                <span className="text-[110px] font-black leading-none opacity-20 select-none">{getInitials(customerName)}</span>
              </div>
            )}
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent pointer-events-none" />
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute left-4 right-4 bottom-3.5 text-white pointer-events-none">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-black truncate">{customerName}</h2>
              {Boolean(user?.is_email_verified) && <VerifiedBadge title="Verified Customer" />}
            </div>
            <p className="text-xs font-semibold text-white/85 truncate">Client &middot; {customerLocation}</p>
          </div>
        </div>
        <div className="sm:hidden pt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-slate-400">
            Customer since {customerSince}
          </p>
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="px-3.5 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-[11px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Desktop: banner + overlapping avatar. Banner + avatar overlap live in one wrapper so
            the internal -mt-11 overlap only has to reckon with its one sibling (the banner right
            above it), not fight anything else for control of its own margin-top. */}
        <div className="hidden sm:block">
          <div className="-mx-[15px] -mt-[15px]">
            <div className="h-[104px] rounded-t-2xl bg-gradient-to-br from-navy-900 to-navy-950" />
            <div className="flex items-end justify-between gap-3.5 px-[15px] -mt-11">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="relative shrink-0 cursor-pointer rounded-2xl border-4 border-white dark:border-slate-900 shadow-lg"
                title="Tap to change your photo"
                aria-label="Change profile photo"
              >
                <UserAvatar
                  src={currentAvatar}
                  name={customerName}
                  sizeClassName="w-24 h-24"
                  textClassName="text-3xl font-black"
                  roundedClassName="rounded-2xl"
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-950/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{customerName}</h2>
              {Boolean(user?.is_email_verified) && <VerifiedBadge label="Verified Customer" />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
              <span>{customerLocation}</span>
            </p>
            <p className="text-[11px] font-medium text-slate-400 pt-0.5">
              Customer since {customerSince}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isEditing ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">Phone Number</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{customerPhone}</span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">Email Address</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 break-all sm:break-normal">{customerEmail}</span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">Primary Location</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{customerLocation}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomerInfo} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={draftFirstName}
                    onChange={(e) => setDraftFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={draftLastName}
                    onChange={(e) => setDraftLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Neighborhood / Address</label>
                <input
                  type="text"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={requestCancelEdit}
                  disabled={isSavingProfile}
                  className="px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[7.5rem]"
                >
                  {isSavingProfile && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}
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

      {/* 3. SAVED ARTISANS PREVIEW */}
      {savedPros.length > 0 && (
        <Card className="space-y-4">
          <CardHeader
            title="Saved Artisans"
            subtitle="Professionals you've bookmarked for future jobs."
            action={onTabChange && (
              <button
                type="button"
                onClick={() => onTabChange('saved')}
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

      {/* 4. ACCOUNT SETTINGS LINK -- preferences, security, privacy, help & legal all live in the
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

      {/* 5. SIGN OUT (With Universal Confirmation Modal) */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Sign Out</h3>
          <p className="text-[11px] text-slate-500">Securely sign out of your current session on this device.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
        >
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

      {/* DISCARD UNSAVED CHANGES CONFIRMATION */}
      <ConfirmationModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => setIsEditing(false)}
        title="Discard Unsaved Changes?"
        description="You've made changes to your personal information that haven't been saved. If you leave now, they'll be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="danger"
      />

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
