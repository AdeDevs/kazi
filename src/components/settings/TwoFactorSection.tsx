import React, { useEffect, useState } from 'react';
import { Copy, Download, KeyRound, ShieldCheck, X } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';
import { useAuth } from '../../context/AuthContext';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { disableTwoFactor, regenerateBackupCodes, setupTwoFactor, verifyTwoFactorSetup } from '../../lib/authApi';
import { TwoFactorSetupResponse } from '../../types/auth';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100';
const primaryClass =
  'w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed';
const cancelClass =
  'w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center';
const secondaryClass =
  'px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed';

/** An authenticator code is 6 digits; a backup code is accepted wherever the backend says so. */
const sixDigits = (value: string) => value.replace(/\D/g, '').slice(0, 6);
const codeOrBackup = (value: string) => value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 20);

type Flow =
  | { kind: 'enable'; step: 'scan'; setup: TwoFactorSetupResponse; qrSvg: string }
  | { kind: 'disable' }
  | { kind: 'regenerate' }
  | { kind: 'codes'; codes: string[]; fresh: boolean };

/** The "Two-Factor Authentication" row in Security & Authentication, plus its sheets. */
export const TwoFactorSection: React.FC = () => {
  const { user, isDemo, refreshUser } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  const enabled = Boolean(user?.two_factor_enabled);

  const [flow, setFlow] = useState<Flow | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const close = () => {
    setFlow(null);
    setCode('');
    setPassword('');
  };
  // Backup codes are shown only once, so closing that step isn't "discarding" anything, and the
  // scan step has nothing typed yet until a code is entered.
  const guard = useUnsavedChangesGuard(flow?.kind !== 'codes' && Boolean(code || password), close);
  const sheet = useSlideUpSheet(Boolean(flow), guard.requestClose);

  // Keep the last flow on screen while the sheet animates closed.
  const [shownFlow, setShownFlow] = useState<Flow | null>(null);
  useEffect(() => { if (flow) setShownFlow(flow); }, [flow]);

  const startEnable = async () => {
    if (blockIfFrozen()) return;
    setIsBusy(true);
    try {
      const setup = await setupTwoFactor();
      const qrSvg = await QRCode.toString(setup.otpauth_url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
      setFlow({ kind: 'enable', step: 'scan', setup, qrSvg });
    } catch (err: any) {
      toast.error(err?.message || 'Could not start two-factor setup. Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      const res = await verifyTwoFactorSetup(code);
      await refreshUser();
      setCode('');
      setFlow({ kind: 'codes', codes: res.backup_codes, fresh: true });
      toast.success('Two-factor sign-in is on.');
    } catch (err: any) {
      toast.error(err?.message || 'That code didn’t work. Check your app and try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      await disableTwoFactor(password, code);
      await refreshUser();
      toast.success('Two-factor sign-in is off.');
      close();
    } catch (err: any) {
      toast.error(err?.message || 'Could not turn two-factor sign-in off. Check your password and code.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      const res = await regenerateBackupCodes(code);
      setCode('');
      setFlow({ kind: 'codes', codes: res.backup_codes, fresh: false });
      toast.success('New backup codes made. The old ones no longer work.');
    } catch (err: any) {
      toast.error(err?.message || 'That code didn’t work. Check your app and try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const copyCodes = async (codes: string[]) => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      toast.success('Backup codes copied.');
    } catch {
      toast.error('Couldn’t copy. Select the codes and copy them yourself.');
    }
  };

  const downloadCodes = (codes: string[]) => {
    const text = `KaziHub backup codes for ${user?.email ?? 'your account'}\nEach code works once.\n\n${codes.join('\n')}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kazihub-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const f = flow ?? shownFlow;
  const title =
    f?.kind === 'enable' ? 'Turn On Two-Factor Sign-In'
    : f?.kind === 'disable' ? 'Turn Off Two-Factor Sign-In'
    : f?.kind === 'regenerate' ? 'New Backup Codes'
    : 'Save Your Backup Codes';

  return (
    <>
      <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Two-Factor Authentication (2FA)
            {enabled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold">On</span>
            )}
          </p>
          <p className="text-[11px] text-slate-500">
            {isDemo
              ? 'Not available on the demo account.'
              : enabled
                ? 'Signing in asks for a code from your authenticator app. A backup code works if you lose your phone.'
                : 'Ask for a code from an authenticator app (such as Google Authenticator) every time you sign in.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {enabled ? (
            <>
              <button type="button" onClick={() => { if (!blockIfFrozen()) setFlow({ kind: 'regenerate' }); }} className={secondaryClass}>
                <KeyRound className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
                <span>New Backup Codes</span>
              </button>
              <button type="button" onClick={() => { if (!blockIfFrozen()) setFlow({ kind: 'disable' }); }} className={`${secondaryClass} text-rose-600 dark:text-rose-400`}>
                <span>Turn Off</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={startEnable} disabled={isDemo || isBusy} className={secondaryClass}>
              <ShieldCheck className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>{isBusy && !flow ? 'Starting…' : 'Turn On'}</span>
            </button>
          )}
        </div>
      </div>

      {sheet.shouldRender && f && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
          onClick={guard.requestClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${sheet.sheetAnimationClasses}`}
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
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500">
                {f.kind === 'enable' && 'Scan this with your authenticator app, then enter the 6-digit code it shows.'}
                {f.kind === 'disable' && 'Enter your password and a code from your authenticator app. A backup code works too.'}
                {f.kind === 'regenerate' && 'Enter a code from your authenticator app. Your current backup codes stop working.'}
                {f.kind === 'codes' && 'Each code signs you in once if you lose your phone. This is the only time we’ll show them.'}
              </p>
            </div>

            {f.kind === 'enable' && (
              <form onSubmit={handleVerify} className="space-y-3">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-44 h-44 p-2 rounded-xl bg-white border border-slate-200 [&>svg]:w-full [&>svg]:h-full"
                    role="img"
                    aria-label="QR code for your authenticator app"
                    dangerouslySetInnerHTML={{ __html: f.qrSvg }}
                  />
                  <a href={f.setup.otpauth_url} className="text-[11px] font-bold text-navy-800 dark:text-navy-400 hover:underline md:hidden">
                    On this phone? Open in your authenticator app
                  </a>
                  <div className="w-full text-center">
                    <p className="text-[11px] text-slate-500">Can’t scan? Enter this key instead:</p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 break-all select-all">{f.setup.secret}</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="twofa-verify-code" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">6-Digit Code</label>
                  <input
                    id="twofa-verify-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(sixDigits(e.target.value))}
                    className={`${inputClass} tracking-[0.3em]`}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={guard.requestClose} className={cancelClass}>Cancel</button>
                  <button type="submit" disabled={isBusy || code.length !== 6} className={primaryClass}>
                    {isBusy ? 'Checking…' : 'Turn On'}
                  </button>
                </div>
              </form>
            )}

            {f.kind === 'disable' && (
              <form onSubmit={handleDisable} className="space-y-3">
                <div>
                  <label htmlFor="twofa-off-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                  <input
                    id="twofa-off-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="twofa-off-code" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authenticator or Backup Code</label>
                  <input
                    id="twofa-off-code"
                    type="text"
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={20}
                    value={code}
                    onChange={(e) => setCode(codeOrBackup(e.target.value))}
                    className={`${inputClass} tracking-[0.2em]`}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={guard.requestClose} className={cancelClass}>Cancel</button>
                  <button type="submit" disabled={isBusy || !password || code.length < 6} className={primaryClass}>
                    {isBusy ? 'Turning off…' : 'Turn Off'}
                  </button>
                </div>
              </form>
            )}

            {f.kind === 'regenerate' && (
              <form onSubmit={handleRegenerate} className="space-y-3">
                <div>
                  <label htmlFor="twofa-regen-code" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">6-Digit Code</label>
                  <input
                    id="twofa-regen-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(sixDigits(e.target.value))}
                    className={`${inputClass} tracking-[0.3em]`}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={guard.requestClose} className={cancelClass}>Cancel</button>
                  <button type="submit" disabled={isBusy || code.length !== 6} className={primaryClass}>
                    {isBusy ? 'Making codes…' : 'Make New Codes'}
                  </button>
                </div>
              </form>
            )}

            {f.kind === 'codes' && (
              <div className="space-y-3">
                <ul className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 select-all">
                  {f.codes.map((c) => <li key={c} className="text-center py-1">{c}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copyCodes(f.codes)} className={secondaryClass}>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button type="button" onClick={() => downloadCodes(f.codes)} className={secondaryClass}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={close} className={primaryClass}>I’ve Saved Them</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <UnsavedChangesModal guard={guard} description="You haven’t finished yet. Closing now will discard what you’ve entered." />
    </>
  );
};
