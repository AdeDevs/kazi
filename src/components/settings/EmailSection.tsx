import React, { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';
import { useAuth } from '../../context/AuthContext';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';
import { confirmEmailChange, requestEmailChange } from '../../lib/authApi';

export const EMAIL_SECTION_ID = 'email-address';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100';

export const EmailSection: React.FC = () => {
  const { user, isDemo, refreshUser } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const reset = () => {
    setIsOpen(false);
    setStep('request');
    setNewEmail('');
    setCurrentPassword('');
    setCode('');
  };
  const guard = useUnsavedChangesGuard(Boolean(newEmail || currentPassword || code), reset);
  const sheet = useSlideUpSheet(isOpen, guard.requestClose);

  const sendCode = async () => {
    await requestEmailChange({ new_email: newEmail.trim(), current_password: currentPassword });
    toast.success(`We sent a code to ${newEmail.trim()}.`);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      toast.error('That’s already your email address. Enter a different one.');
      return;
    }
    setIsBusy(true);
    try {
      await sendCode();
      setStep('confirm');
    } catch (err: any) {
      toast.error(err?.message || 'Could not start the email change. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleResend = async () => {
    setIsBusy(true);
    try {
      await sendCode();
    } catch (err: any) {
      toast.error(err?.message || 'Could not send a new code. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      await confirmEmailChange(code.trim());
      await refreshUser();
      toast.success('Email address updated. Use it the next time you sign in.');
      reset();
    } catch (err: any) {
      toast.error(err?.message || 'That code didn’t work. Check it and try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card id={EMAIL_SECTION_ID} className="space-y-4 scroll-mt-24">
      <CardHeader title="Email Address" subtitle="The address you sign in with and receive KaziHub emails at." />

      <div className="py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
          <p className="text-[11px] text-slate-500">
            {isDemo ? 'Not available on the demo account.' : 'We’ll send a code to the new address to confirm it’s yours.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { if (!blockIfFrozen()) setIsOpen(true); }}
          disabled={isDemo}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
          <span>Change Email</span>
        </button>
      </div>

      {sheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
          onClick={guard.requestClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative ${sheet.sheetAnimationClasses}`}
            style={sheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />
            <button
              type="button"
              onClick={guard.requestClose}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Change Email</h3>
              <p className="text-xs text-slate-500">
                {step === 'request'
                  ? 'Enter your new email and your current password.'
                  : `Enter the code we sent to ${newEmail.trim()}. Your email changes once it’s confirmed.`}
              </p>
            </div>

            {step === 'request' ? (
              <form onSubmit={handleRequest} className="space-y-3">
                <div>
                  <label htmlFor="new-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Email</label>
                  <input
                    id="new-email"
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email-change-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                  <input
                    id="email-change-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={guard.requestClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBusy ? 'Sending…' : 'Send Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirm} className="space-y-3">
                <div>
                  <label htmlFor="email-change-code" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirmation Code</label>
                  <input
                    id="email-change-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`${inputClass} tracking-[0.3em]`}
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Didn’t get it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isBusy}
                    className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Send a new code
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={() => { setStep('request'); setCode(''); }}
                    className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
                  >
                    use a different email
                  </button>
                  .
                </p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={guard.requestClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBusy ? 'Confirming…' : 'Confirm New Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <UnsavedChangesModal
        guard={guard}
        description="Your email hasn’t been changed yet. Closing now will discard what you’ve entered."
      />
    </Card>
  );
};
