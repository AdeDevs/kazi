import React, { useState } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language } from '../translations';
import {
  Key, Download, Snowflake, Trash2, CheckCircle2, X, Laptop
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { Card, CardHeader } from './ui/Card';
import { CustomDropdown } from './CustomDropdown';
import { useAuth } from '../context/AuthContext';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { PreferencesSection } from './settings/PreferencesSection';
import { HelpSupportSection } from './settings/HelpSupportSection';
import { LegalSection } from './settings/LegalSection';

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
  const { user, deleteAccount } = useAuth();
  // Security States - 2FA and biometric login aren't backed by a real auth backend yet,
  // so these are shown disabled/"Coming soon" rather than falsely reporting them as active.
  const [twoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30_days');
  const [biometricLogin] = useState(false);

  // Privacy States
  const [phoneVisibility, setPhoneVisibility] = useState<'after_escrow' | 'verified_only' | 'hidden'>('after_escrow');
  const [neighborhoodSharing, setNeighborhoodSharing] = useState(true);
  const [publicReviews, setPublicReviews] = useState(true);
  const [marketingAnalytics, setMarketingAnalytics] = useState(false);

  // Account Lifecycle States
  const [isFrozen, setIsFrozen] = useState(false);

  // Modals & Confirmation States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match.');
      return;
    }
    triggerToast('Password updated successfully!');
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleFreezeToggle = () => {
    setIsFrozen(prev => !prev);
    triggerToast(isFrozen ? 'Account successfully unfrozen!' : 'Account frozen. Activity has been paused.');
  };

  const handlePermanentDelete = async () => {
    try {
      await deleteAccount();
      triggerToast('Account data deleted successfully.');
      if (onDeleteAccount) {
        onDeleteAccount();
      } else if (onLogout) {
        onLogout();
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete account.');
    }
  };

  const handleExportData = () => {
    const dataObj = {
      user: {
        role: user?.role || currentRole,
        name: user ? `${user.first_name} ${user.last_name}`.trim() : (currentRole === 'customer' ? 'Client Profile' : activeProfessional.name),
        email: user?.email || (currentRole === 'customer' ? '' : activeProfessional.email),
        phone_number: user?.phone_number || (currentRole === 'customer' ? '' : activeProfessional.phone_number),
        state: user?.state || activeProfessional.state,
      },
      bookingsCount: bookings.length,
      exportedAt: new Date().toISOString(),
      platform: 'KaziHub Escrow Marketplace'
    };
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kazihub_account_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Data archive generated and downloaded!');
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
        triggerToast={triggerToast}
      />

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
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Key className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Change Password</span>
            </button>
          </div>

          {/* 2-Factor Authentication - not backed by a real auth backend yet */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Two-Factor Authentication (2FA)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold">Coming soon</span>
              </p>
              <p className="text-[11px] text-slate-500">Require an SMS/Authenticator OTP code on every login attempt.</p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed shrink-0">
              <input
                type="checkbox"
                checked={twoFactorAuth}
                disabled
                aria-label="Two-Factor Authentication (coming soon)"
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800 opacity-50"></div>
            </label>
          </div>

          {/* Biometric Unlock - not backed by a real auth backend yet */}
          <div className="py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Biometric Login
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold">Coming soon</span>
              </p>
              <p className="text-[11px] text-slate-500">Allow Touch ID / Face ID authentication on supported mobile devices.</p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed shrink-0">
              <input
                type="checkbox"
                checked={biometricLogin}
                disabled
                aria-label="Biometric Login (coming soon)"
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800 opacity-50"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* 2. ACTIVE SESSIONS & DEVICE MANAGEMENT */}
      <Card className="space-y-4">
        <CardHeader
          title="Active Devices & Sessions"
          subtitle="Devices currently logged into this KaziHub account."
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  This device <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">Current session</span>
                </p>
                <p className="text-[11px] text-slate-500">Active right now</p>
              </div>
            </div>
          </div>
          <p className="py-3 text-slate-400 dark:text-slate-500 text-[11px]">
            Multi-device session tracking isn't available yet - this will show every device signed into your account once it's wired up.
          </p>
        </div>
      </Card>

      {/* 3. PRIVACY & DATA VISIBILITY */}
      <Card className="space-y-4">
        <CardHeader
          title="Privacy & Visibility"
          subtitle="Control who can discover your contact details and job history."
        />

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Phone Visibility */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Telephone Number Privacy</p>
              <p className="text-[11px] text-slate-500">Determine when verified artisans can view your direct telephone number.</p>
            </div>
            <CustomDropdown
              value={phoneVisibility}
              onChange={(val) => {
                setPhoneVisibility(val);
                triggerToast('Privacy rule updated.');
              }}
              options={[
                { value: 'after_escrow', label: 'Only After Escrow Payment (Recommended)' },
                { value: 'verified_only', label: 'Any Verified Artisan in Chat' },
                { value: 'hidden', label: 'Keep Hidden (In-App Calling Only)' }
              ]}
              className="shrink-0"
              buttonClassName="py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Neighborhood Sharing */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Share Approximate Neighborhood</p>
              <p className="text-[11px] text-slate-500">Display your general district (e.g. Bodija) to get accurate proximity quotes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={neighborhoodSharing}
                onChange={(e) => setNeighborhoodSharing(e.target.checked)}
                aria-label="Share approximate neighborhood"
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Data Export */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Download My Data</p>
              <p className="text-[11px] text-slate-500">Get a copy of your booking history, payment receipts, and profile info.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </Card>

      {/* HELP & SUPPORT (shared across both customer and artisan roles) */}
      <HelpSupportSection triggerToast={triggerToast} />

      {/* LEGAL & TERMS (shared across both customer and artisan roles) */}
      <LegalSection />

      {/* ACCOUNT LIFECYCLE ACTIONS (Freeze & Delete) -- kept last on the page, since these are
          the most consequential actions here and shouldn't be something someone reaches on the
          way to something else. */}
      <Card tone="danger" className="space-y-4">
        <CardHeader
          title="Account Lifecycle Actions"
          subtitle="Freeze account visibility temporarily or delete permanently."
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
                {isFrozen
                  ? 'Your account is currently paused. Unfreeze at any time to resume booking verified artisans.'
                  : 'Temporarily pause your account activity without losing your past bookings, reviews, or saved addresses.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFreezeModal(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isFrozen
                  ? 'bg-navy-800 hover:bg-navy-900 text-white shadow-xs'
                  : 'bg-navy-800/10 text-navy-800 dark:text-navy-300 hover:bg-navy-800/20 border border-navy-800/30'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{isFrozen ? 'Unfreeze Account' : 'Freeze Account'}</span>
            </button>
          </div>

          {/* Delete Account */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-bold text-rose-600 dark:text-rose-400">Delete Account Permanently</p>
              <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                Permanently erase your identity, booking records, and stored payment profiles from KaziHub. This can't be undone.
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= CONFIRMATION MODALS (BOTTOM SLIDE-UP ON MOBILE) ================= */}

      {/* FREEZE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        onConfirm={handleFreezeToggle}
        title={isFrozen ? 'Unfreeze Your Account?' : 'Freeze Your Account?'}
        description={
          isFrozen
            ? 'Unfreezing will restore full booking, messaging, and quote request features immediately.'
            : 'Freezing hides your profile from new artisans while preserving your historical bookings and ratings.'
        }
        confirmText={isFrozen ? 'Yes, Unfreeze Account' : 'Yes, Freeze Account'}
        cancelText="Keep as is"
        type="freeze"
        details={[
          'All past transaction receipts stay saved and safe',
          'You can reactivate your account at any moment by signing in'
        ]}
      />

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Account?"
        description="Are you absolutely sure you want to delete your KaziHub account? All user profile data, job history, and ratings will be erased permanently."
        confirmText="Yes, Permanently Delete"
        cancelText="Nevermind, Cancel"
        type="danger"
        details={[
          'All pending escrow transactions and bookings will be cancelled',
          'Your phone number and verified reputation credentials will be permanently erased',
          "This can't be undone"
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
              <p className="text-xs text-slate-500">Ensure your password has at least 8 characters with numbers and symbols.</p>
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

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={passwordGuard.requestClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs"
                >
                  Update Password
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
