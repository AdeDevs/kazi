import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Role, Professional, Booking } from '../types';
import { Language } from '../translations';
import {
  Key, Download, Snowflake, Trash2, X
} from 'lucide-react';
import { changePassword, exportMyData, freezeMe, unfreezeMe } from '../lib/authApi';
import { getMyProfile, saveMyProfile } from '../lib/profilesApi';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import { EmailSection, EMAIL_SECTION_ID } from './settings/EmailSection';
import { SessionsSection } from './settings/SessionsSection';
import { TwoFactorSection } from './settings/TwoFactorSection';
import { PayoutSection } from './settings/PayoutSection';
import { FEATURES } from '../lib/features';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { Toggle } from './ui/Toggle';
import { Card, CardHeader } from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { PreferencesSection } from './settings/PreferencesSection';
import { HelpSupportSection } from './settings/HelpSupportSection';
import { LegalSection } from './settings/LegalSection';
import { toast } from 'sonner';

interface SettingsViewProps {
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

export const SettingsView: React.FC<SettingsViewProps> = ({
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
  const { user, deleteAccount, isDemo, refreshUser, updateUser } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  const location = useLocation();

  // "Change email" links elsewhere (e.g. the profile editor) land here as /settings#email.
  // Delayed past App's route-change scroll restore, which would otherwise snap back to the top.
  useEffect(() => {
    if (location.hash !== '#email') return;
    const timer = setTimeout(() => {
      document.getElementById(EMAIL_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [location.hash]);
  // Biometric login isn't backed by the backend, so it's shown disabled/"Coming soon".
  const [biometricLogin] = useState(false);

  // Privacy States
  // Artisans keep this on their profile (it hides their neighbourhood, address and map location);
  // customers have it on their account, where it hides their state on reviews they share publicly.
  // null = unavailable (demo) or still loading from GET /profiles/me.
  const isArtisan = user?.role === 'artisan';
  const [artisanShareNeighborhood, setShareNeighborhood] = useState<boolean | null>(null);
  const shareNeighborhood = isDemo ? null : isArtisan ? artisanShareNeighborhood : (user?.share_neighborhood ?? true);
  const [isSavingNeighborhood, setIsSavingNeighborhood] = useState(false);
  useEffect(() => {
    if (isDemo || user?.role !== 'artisan') return;
    let cancelled = false;
    getMyProfile()
      .then(p => { if (!cancelled) setShareNeighborhood(p.share_neighborhood ?? true); })
      .catch(() => { if (!cancelled) setShareNeighborhood(null); });
    return () => { cancelled = true; };
  }, [isDemo, user?.role]);

  const handleToggleNeighborhood = async (next: boolean) => {
    if (blockIfFrozen()) return;
    setIsSavingNeighborhood(true);
    try {
      if (isArtisan) {
        const saved = await saveMyProfile({ share_neighborhood: next });
        setShareNeighborhood(saved.share_neighborhood ?? next);
        toast.success(next ? 'Your neighbourhood is shown on your profile.' : 'Your neighbourhood is now hidden from your profile.');
      } else {
        await updateUser({ share_neighborhood: next });
        toast.success(next ? 'Your state is shown on reviews you share.' : 'Your state is now hidden on reviews you share.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not update this setting. Try again.');
    } finally {
      setIsSavingNeighborhood(false);
    }
  };

  // Account Lifecycle States
  const isFrozen = Boolean(user?.is_paused);
  const [isFreezeBusy, setIsFreezeBusy] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Modals & Confirmation States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  const isPasswordFormDirty = Boolean(currentPassword || newPassword || confirmPassword);
  const passwordGuard = useUnsavedChangesGuard(isPasswordFormDirty, closePasswordModal);
  const passwordSheet = useSlideUpSheet(showPasswordModal, passwordGuard.requestClose);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill in all three password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('The new passwords don’t match. Type the same password in both fields.');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('Your new password must be different from your current one.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      // The backend ends every session on a password change (verified live), this one included.
      toast.success('Password changed. Sign in again with your new password.');
      closePasswordModal();
      onLogout?.();
    } catch (err: any) {
      toast.error(err?.message || 'Could not change your password. Try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFreezeToggle = async () => {
    const wasFrozen = isFrozen;
    setIsFreezeBusy(true);
    try {
      await (wasFrozen ? unfreezeMe() : freezeMe());
      await refreshUser();
      toast.success(wasFrozen ? 'Account unfrozen. Bookings are open again.' : 'Account frozen. New bookings are paused.');
    } catch (err: any) {
      toast.error(err?.message || `Could not ${wasFrozen ? 'unfreeze' : 'freeze'} your account. Try again.`);
    } finally {
      setIsFreezeBusy(false);
    }
  };

  const handlePermanentDelete = async () => {
    try {
      await deleteAccount();
      toast.success('Your account is closed.');
      if (onDeleteAccount) {
        onDeleteAccount();
      } else if (onLogout) {
        onLogout();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account.');
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kazihub-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your data has downloaded.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not download your data. Try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
      {/* Always-present accessible page title; the visible copy below is mobile-only because
          the desktop app shell already shows this title in its header bar as plain text. */}
      <h1 className="sr-only">Account Settings</h1>

      {/* Title Header (Mobile Only) */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Account Settings</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Security credentials, privacy controls, and account lifecycle.</p>
        </div>
      </div>

      {/* PREFERENCES (shared across both customer and artisan roles) */}
      <PreferencesSection
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />

      <EmailSection />

      {/* Artisans only. Clients get it back with the wallet page, via FEATURES.clientPayoutAccount. */}
      {((user?.role === 'artisan' && currentRole === 'professional') || FEATURES.clientPayoutAccount) && <PayoutSection />}

      {/* 1. SECURITY & AUTHENTICATION */}
      <Card className="space-y-4">
        <CardHeader
          title="Security & Authentication"
          subtitle="Manage your passwords, two-factor authentication, and login credentials."
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Password Reset */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Account Password</p>
              <p className="text-[11px] text-slate-500">Keep your password strong and unique to this account.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              disabled={isDemo}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Key className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Change Password</span>
            </button>
          </div>

          <TwoFactorSection />

          {/* Biometric Unlock - not backed by a real auth backend yet */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Biometric Login
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold">Coming soon</span>
              </p>
              <p className="text-[11px] text-slate-500">Allow Touch ID / Face ID authentication on supported mobile devices.</p>
            </div>
            <Toggle checked={biometricLogin} label="Biometric Login (coming soon)" onChange={() => undefined} disabled />
          </div>
        </div>
      </Card>

      {/* 2. ACTIVE SESSIONS & DEVICE MANAGEMENT */}
      <SessionsSection onSignedOutEverywhere={() => onLogout?.()} />

      {/* 3. PRIVACY & DATA VISIBILITY */}
      <Card className="space-y-4">
        <CardHeader
          title="Privacy & Visibility"
          subtitle="Control who can discover your contact details and job history."
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Phone Visibility -- enforced through bookings: a number is shared on a booking once
              phone_visibility allows it. Only the default value is documented, so it's shown, not edited. */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Telephone Number Privacy</p>
              <p className="text-[11px] text-slate-500">
                {isDemo
                  ? 'Not available on the demo account.'
                  : (user?.phone_visibility ?? 'after_escrow') === 'after_escrow'
                    ? 'Your number is never on your public profile. It’s shared on a booking only once payment is held in escrow.'
                    : 'Your number is never on your public profile, and is shared on a booking only under your account’s rule.'}
              </p>
            </div>
          </div>

          {/* Neighborhood Sharing -- real for artisans (PUT /profiles/me share_neighborhood; verified the
              public listing and profile then omit neighbourhood, address and coordinates). */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Share Approximate Neighborhood</p>
              <p className="text-[11px] text-slate-500">
                {isDemo
                  ? 'Not available on the demo account.'
                  : !isArtisan
                    ? 'Show your state next to reviews you choose to share on KaziHub’s home page.'
                    : 'Show your neighbourhood on your public profile so nearby customers can find you. When off, your neighbourhood, address and map location are hidden.'}
              </p>
            </div>
            <Toggle checked={Boolean(shareNeighborhood)} label="Share approximate neighborhood" onChange={handleToggleNeighborhood} disabled={shareNeighborhood === null} busy={isSavingNeighborhood} />
          </div>

          {/* Data Export */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Download My Data</p>
              <p className="text-[11px] text-slate-500">
                {isDemo ? 'Not available on the demo account.' : 'Everything KaziHub holds about you: account, bookings, payments, reviews, messages and more, as one file.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={isDemo || isExporting}
              className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>{isExporting ? 'Preparing…' : 'Download'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* HELP & SUPPORT (shared across both customer and artisan roles) */}
      <HelpSupportSection />

      {/* LEGAL & TERMS (shared across both customer and artisan roles) */}
      <LegalSection />

      {/* ACCOUNT LIFECYCLE ACTIONS (Freeze & Delete) -- kept last on the page, since these are
          the most consequential actions here and shouldn't be something someone reaches on the
          way to something else. */}
      <Card tone="danger" className="space-y-4">
        <CardHeader
          title="Account Lifecycle Actions"
          subtitle="Pause your account for a while, or close it."
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Freeze Account */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {isFrozen ? 'Account is Currently Frozen' : 'Freeze Account'}
                </p>
                {isFrozen && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    Frozen
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                {isDemo
                  ? 'Not available on the demo account.'
                  : isFrozen
                    ? 'Your account is paused: bookings, messages and profile changes are blocked, and any artisan profile is hidden from search. Unfreeze any time.'
                    : 'Pause bookings, messages and profile changes, and hide any artisan profile from search, without deleting anything. You can still sign in.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFreezeModal(true)}
              disabled={isDemo || isFreezeBusy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFrozen
                  ? 'bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white shadow-xs'
                  : 'bg-navy-800/10 text-navy-800 dark:text-navy-300 hover:bg-navy-800/20 border border-navy-800/30'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{isFreezeBusy ? 'Saving…' : isFrozen ? 'Unfreeze Account' : 'Freeze Account'}</span>
            </button>
          </div>

          {/* Delete Account */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-rose-600 dark:text-rose-400">Delete Account</p>
              <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                Closes your account and signs you out on every device straight away. Your personal details are removed later, once KaziHub no longer has to keep records of your bookings and payments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </Card>

      {/* ================= CONFIRMATION MODALS (BOTTOM SLIDE-UP ON MOBILE) ================= */}

      {/* FREEZE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        onConfirm={handleFreezeToggle}
        title={isFrozen ? 'Unfreeze Your Account?' : 'Freeze Your Account?'}
        description={
          isFrozen
            ? 'Bookings, messages and profile changes open again straight away, and any artisan profile shows in search again.'
            : 'Bookings, messages and profile changes are blocked, and any artisan profile drops out of search, until you unfreeze.'
        }
        confirmText={isFrozen ? 'Yes, Unfreeze Account' : 'Yes, Freeze Account'}
        cancelText="Keep as is"
        type="freeze"
        details={
          isFrozen
            ? undefined
            : ['You can still sign in while frozen', 'Unfreeze any time from this page']
        }
      />

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handlePermanentDelete}
        title="Delete Your Account?"
        description="Your account closes now and you’re signed out on every device. You won’t be able to sign in with it again."
        confirmText="Yes, Delete My Account"
        cancelText="Keep My Account"
        type="danger"
        details={[
          'Your personal details are removed later, after the period KaziHub has to keep booking and payment records',
          'If money is held in escrow on one of your bookings, contact support before deleting',
          'To take a break instead, freeze your account: you can unfreeze it any time',
        ]}
      />

      {/* CHANGE PASSWORD MODAL */}
      {passwordSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${passwordSheet.backdropAnimationClasses}`}
          onClick={passwordGuard.requestClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative ${passwordSheet.sheetAnimationClasses}`}
            style={passwordSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={passwordSheet.dragHandleProps} />
            <button
              onClick={passwordGuard.requestClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Update Password</h3>
              <p className="text-xs text-slate-500">Use 8 to 128 characters.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={passwordGuard.requestClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        guard={passwordGuard}
        description="You haven't updated your password yet. Closing now will discard what you've entered."
      />

    </div>
  );
};
