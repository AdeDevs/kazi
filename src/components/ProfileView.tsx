import React, { useState, useRef } from 'react';
import { HeroScrim } from './ui/HeroScrim';
import { NIGERIAN_STATES, digitsOnly, isValidNigerianPhone, sanitizeName, toStoredPhone } from '../lib/inputRules';
import { PhoneField, displayPhone } from './ui/PhoneField';
import { CustomDropdown } from './CustomDropdown';
import { Role, Professional, Booking, SavedArtisanSummary } from '../types';
import { Language } from '../translations';
import {
  MapPin, Edit3,
  ChevronRight, Star
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UserAvatar, getInitials, getAvatarColor } from './ui/UserAvatar';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { Card, CardHeader } from './ui/Card';
import { ProProfileManagement } from './ProProfileManagement';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { toast } from 'sonner';

const ACTIVE_STATUSES: Booking['status'][] = [
  'quote_requested', 'quote_sent', 'pending', 'accepted', 'escrow_funded', 'in_progress', 'completed_by_artisan', 'disputed',
];

interface ProfileViewProps {
  currentRole: Role;
  activeProfessional: Professional;
  bookings: Booking[];
  /** Saved artisans (GET /favorites/ for real accounts). */
  savedArtisans: SavedArtisanSummary[];
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
  scrollToSection?: string | null;
  onScrollToSectionHandled?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentRole,
  activeProfessional,
  bookings,
  savedArtisans,
  customerAvatar,
  onUpdateCustomerAvatar,
  onUpdateProfile,
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  onDeleteAccount,
  currentLanguage = 'English (Nigeria)',
  onLanguageChange,
  onTabChange,
  scrollToSection,
  onScrollToSectionHandled
}) => {
  const { user, updateUser, uploadProfilePicture } = useAuth();
  const navigate = useNavigate();
  const { blockIfFrozen } = useAccountFrozen();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [heroPhotoFailed, setHeroPhotoFailed] = useState(false);

  // Customer Profile Information initialized with backend user data
  const [customerFirstName, setCustomerFirstName] = useState(() => user?.first_name || (user?.email ? user.email.split('@')[0] : 'Client'));
  const [customerLastName, setCustomerLastName] = useState(() => user?.last_name || '');
  const [customerPhone, setCustomerPhone] = useState(() => user?.phone_number || '');
  const [customerEmail, setCustomerEmail] = useState(() => user?.email || '');
  // The client's location is their account's state (UserUpdate.state); there's no address field.
  const customerState = user?.state || '';
  const customerLocation = customerState ? `${customerState}, Nigeria` : 'Location not set';

  React.useEffect(() => {
    if (user) {
      setCustomerFirstName(user.first_name || '');
      setCustomerLastName(user.last_name || '');
      setCustomerPhone(user.phone_number || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  const customerName = `${customerFirstName} ${customerLastName}`.trim() || user?.email?.split('@')[0] || 'User Profile';
  const customerSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  // Edit-mode draft state: the form edits these, NOT the display values above, so nothing
  // appears to "save" until Save Changes actually runs -- and Cancel just discards the draft
  // instead of needing to unwind changes that were never applied to the real display state.
  const [draftFirstName, setDraftFirstName] = useState('');
  const [draftLastName, setDraftLastName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  // Empty means "keep what's on file"; only a full new 11-digit NIN is sent.
  const [draftNin, setDraftNin] = useState('');

  // Modals & UI States
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isDraftDirty =
    draftFirstName !== customerFirstName ||
    draftLastName !== customerLastName ||
    draftPhone !== customerPhone ||
    draftEmail !== customerEmail ||
    draftLocation !== customerState ||
    draftNin !== '';

  const startEditing = () => {
    if (blockIfFrozen()) return;
    setDraftFirstName(customerFirstName);
    setDraftLastName(customerLastName);
    setDraftPhone(customerPhone);
    setDraftEmail(customerEmail);
    setDraftLocation(customerState);
    setDraftNin('');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (blockIfFrozen()) return;
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
      toast.success('Profile photo uploaded and saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Photo updated locally.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value so re-selecting same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveCustomerInfo = async (e: React.FormEvent) => {
    if (blockIfFrozen()) return;
    e.preventDefault();
    if (!draftFirstName.trim() || !draftLastName.trim()) {
      toast.error('Enter your first and last name.');
      return;
    }
    if (!isValidNigerianPhone(draftPhone)) {
      toast.error('Enter a valid Nigerian mobile number, e.g. 802 345 6789.');
      return;
    }
    if (draftNin && !/^\d{11}$/.test(draftNin)) {
      toast.error('Your NIN is 11 digits.');
      return;
    }
    setIsSavingProfile(true);
    try {
      if (user) {
        await updateUser({
          first_name: draftFirstName.trim(),
          last_name: draftLastName.trim(),
          phone_number: toStoredPhone(draftPhone),
          ...(draftLocation ? { state: draftLocation } : {}),
          ...(draftNin ? { nin: draftNin } : {}),
        });
      }
      setIsEditing(false);
      toast.success('Profile details updated and saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
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
        scrollToSection={scrollToSection}
        onScrollToSectionHandled={onScrollToSectionHandled}
      />
    );
  }

  const currentAvatar = customerAvatar;
  const hasHeroPhoto = Boolean(currentAvatar && currentAvatar.trim().length > 0 && !heroPhotoFailed);
  const completedBookingsCount = bookings.filter(b => b.status === 'paid_out').length;
  // Every status where the job is still open: waiting on a quote or a reply, paid, underway,
  // awaiting your confirmation, or in dispute. (Not paid_out or cancelled.)
  const activeBookingsCount = bookings.filter(b => ACTIVE_STATUSES.includes(b.status)).length;
  const savedPreview = savedArtisans.slice(0, 3);
  // The backend returns the NIN masked (e.g. "*******8291"); only the last digits are ever shown.
  const ninOnFile = user?.nin_masked ? `•••••••${user.nin_masked.replace(/\D/g, '').slice(-4)}` : '';

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
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <HeroScrim src={hasHeroPhoto ? currentAvatar : undefined} textClassName="absolute left-4 right-4 bottom-3.5 text-white pointer-events-none">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-black truncate">{customerName}</h2>
              {Boolean(user?.is_email_verified) && <VerifiedBadge title="Verified Customer" />}
            </div>
            <p className="text-xs font-semibold text-white/85 truncate">Client &middot; {customerLocation}</p>
          </HeroScrim>
        </div>
        <div className="sm:hidden pt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-slate-400">
            {customerSince ? `Customer since ${customerSince}` : 'KaziHub customer'}
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
                className="relative shrink-0 cursor-pointer rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg"
                title="Tap to change your photo"
                aria-label="Change profile photo"
              >
                <UserAvatar
                  src={currentAvatar}
                  name={customerName}
                  sizeClassName="w-24 h-24"
                  textClassName="text-3xl font-black"
                  roundedClassName="rounded-none"
                  bordered={false}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
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
              {customerSince ? `Customer since ${customerSince}` : 'KaziHub customer'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {!isEditing ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">Phone Number</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{displayPhone(customerPhone) || 'Not set'}</span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">Email Address</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 break-all sm:break-normal">{customerEmail}</span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">State</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{customerLocation}</span>
              </div>
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                <span className="font-semibold text-slate-500">NIN</span>
                <span className={`font-bold tabular-nums ${ninOnFile ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>{ninOnFile || 'Not added'}</span>
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
                    onChange={(e) => setDraftFirstName(sanitizeName(e.target.value))}
                    autoComplete="given-name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={draftLastName}
                    onChange={(e) => setDraftLastName(sanitizeName(e.target.value))}
                    autoComplete="family-name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="client-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <PhoneField id="client-phone" value={draftPhone} onChange={setDraftPhone} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={draftEmail}
                  disabled
                  readOnly
                  title="Change your email in Account Settings"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Change your email in{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/settings#email')}
                    className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
                  >
                    Account Settings
                  </button>
                  .
                </p>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State</span>
                <CustomDropdown
                  value={draftLocation}
                  onChange={(v) => setDraftLocation(String(v))}
                  options={NIGERIAN_STATES.map(st => ({ value: st, label: st }))}
                  placeholder="Choose your state"
                  asFormField
                  className="w-full"
                  buttonClassName="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label htmlFor="client-nin" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIN <span className="font-medium text-slate-400">(optional)</span>
                </label>
                <input
                  id="client-nin"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  value={draftNin}
                  onChange={(e) => setDraftNin(digitsOnly(e.target.value, 11))}
                  placeholder={ninOnFile ? 'New 11-digit NIN' : '11-digit NIN'}
                  aria-invalid={draftNin.length > 0 && draftNin.length !== 11}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs tracking-wider text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50 ${
                    draftNin.length > 0 && draftNin.length !== 11 ? 'border-rose-400 dark:border-rose-500/70' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {ninOnFile ? `${ninOnFile} is on file. Leave this empty to keep it. ` : ''}Stored privately; only the last 4 digits are ever shown.
                </p>
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
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{savedArtisans.length}</p>
          <p className="text-[11px] font-semibold text-slate-500">Saved Artisans</p>
        </Card>
      </div>

      {/* 3. SAVED ARTISANS PREVIEW */}
      {savedPreview.length > 0 && (
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
            {savedPreview.map((pro) => (
              <button
                key={pro.key}
                type="button"
                onClick={() => pro.profileId && navigate(`/professionals/${pro.profileId}`)}
                disabled={!pro.profileId}
                title={pro.profileId ? `View ${pro.name}` : 'This artisan isn’t taking new jobs right now'}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-left cursor-pointer disabled:cursor-default hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:active:scale-100"
              >
                <UserAvatar
                  src={pro.avatar}
                  name={pro.name}
                  sizeClassName="w-9 h-9"
                  textClassName="text-xs font-black"
                  roundedClassName="rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{pro.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">{pro.rating}{pro.category ? ` · ${pro.category}` : ''}</span>
                  </p>
                </div>
              </button>
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
