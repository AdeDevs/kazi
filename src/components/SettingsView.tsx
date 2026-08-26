import React, { useState } from 'react';
import { Role, Professional, Booking } from '../types';
import { Language } from '../translations';
import { 
  Lock, Key, ShieldCheck, Smartphone, Eye, Globe2, 
  Download, Database, Snowflake, Trash2, CheckCircle2, 
  X, AlertTriangle, ShieldAlert, Laptop, Radio
} from 'lucide-react';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

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
  const { user, deleteAccount, resetPassword, logout: authLogout } = useAuth();
  // Security States
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30_days');
  const [biometricLogin, setBiometricLogin] = useState(true);

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
  const [showRevokeSessionsModal, setShowRevokeSessionsModal] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        phone: user?.phone_number || (currentRole === 'customer' ? '' : activeProfessional.phone),
        state: user?.state || activeProfessional.location,
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
      
      {/* Title Header (Mobile Only) */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Account Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Security credentials, privacy controls, and account lifecycle.</p>
        </div>
      </div>

      {/* 1. SECURITY & AUTHENTICATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Security & Authentication</h3>
            <p className="text-[11px] text-slate-400">Manage your passwords, two-factor authentication, and login credentials.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Password Reset */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Account Password</p>
              <p className="text-[11px] text-slate-500">Last updated 42 days ago. Strong password recommended.</p>
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

          {/* 2-Factor Authentication */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-500">Require an SMS/Authenticator OTP code on every login attempt.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => {
                  setTwoFactorAuth(e.target.checked);
                  triggerToast(e.target.checked ? '2FA enabled' : '2FA disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Biometric Unlock */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Biometric Login</p>
              <p className="text-[11px] text-slate-500">Allow Touch ID / Face ID authentication on supported mobile devices.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biometricLogin}
                onChange={(e) => {
                  setBiometricLogin(e.target.checked);
                  triggerToast(e.target.checked ? 'Biometrics enabled' : 'Biometrics disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE SESSIONS & DEVICE MANAGEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Active Devices & Sessions</h3>
              <p className="text-[11px] text-slate-400">Devices currently logged into this KaziHub account.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRevokeSessionsModal(true)}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Log Out Other Devices
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Chrome on macOS <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">Current Device</span>
                </p>
                <p className="text-[11px] text-slate-500">Ibadan, Nigeria • Active right now</p>
              </div>
            </div>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">KaziHub Mobile App on iPhone 15 Pro</p>
                <p className="text-[11px] text-slate-500">Lagos, Nigeria • 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIVACY & DATA VISIBILITY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Privacy & Visibility</h3>
            <p className="text-[11px] text-slate-400">Control who can discover your contact details and job history.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Phone Visibility */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Telephone Number Privacy</p>
              <p className="text-[11px] text-slate-500">Determine when verified artisans can view your direct telephone number.</p>
            </div>
            <select
              value={phoneVisibility}
              onChange={(e) => {
                setPhoneVisibility(e.target.value as any);
                triggerToast('Privacy rule updated.');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0"
            >
              <option value="after_escrow">Only After Escrow Payment (Recommended)</option>
              <option value="verified_only">Any Verified Artisan in Chat</option>
              <option value="hidden">Keep Hidden (In-App Calling Only)</option>
            </select>
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
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Data Export */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Download Account Data Archive</p>
              <p className="text-[11px] text-slate-500">Export your booking logs, escrow receipts, and profile history in JSON format.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Export JSON Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ACCOUNT LIFECYCLE ACTIONS ONLY (Freeze & Delete) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-rose-200 dark:border-rose-950/40 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Account Lifecycle Actions</h3>
            <p className="text-[11px] text-slate-400">Freeze account visibility temporarily or delete permanently.</p>
          </div>
        </div>

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
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
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
                Permanently erase your identity, booking records, and stored payment profiles from KaziHub. This operation is irreversible.
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
      </div>

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
          'All past transaction receipts remain securely archived in your vault',
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
          'This action CANNOT be reversed or restored'
        ]}
      />

      {/* REVOKE SESSIONS CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showRevokeSessionsModal}
        onClose={() => setShowRevokeSessionsModal(false)}
        onConfirm={() => {
          triggerToast('All other device sessions have been revoked.');
        }}
        title="Revoke All Other Sessions?"
        description="This will sign out all active sessions on other phones, tablets, or desktop browsers."
        confirmText="Log Out Other Devices"
        cancelText="Cancel"
        type="warning"
      />

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowPasswordModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mb-2" />
            <button
              onClick={() => setShowPasswordModal(false)}
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
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

    </div>
  );
};
