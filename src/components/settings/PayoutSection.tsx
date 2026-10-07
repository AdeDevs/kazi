import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Landmark, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';
import { useAuth } from '../../context/AuthContext';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { BankAccount, BankOption, getMyBankAccount, listBanks, verifyBankAccount } from '../../lib/paymentsApi';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100';

/** Nigerian bank account numbers (NUBAN) are 10 digits. */
const NUBAN_LENGTH = 10;
const maskAccount = (n: string) => (n.length > 4 ? `•••• ${n.slice(-4)}` : n);

/** Artisans only: the bank account their escrow releases are paid into. */
export const PayoutSection: React.FC = () => {
  const { isDemo } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  // undefined = loading, null = none saved.
  const [account, setAccount] = useState<BankAccount | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [banks, setBanks] = useState<BankOption[] | null>(null);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bank, setBank] = useState<BankOption | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = () => {
    setLoadError(null);
    getMyBankAccount().then(setAccount).catch((err) => setLoadError(err?.message || 'Could not load your payout account.'));
  };
  useEffect(() => { if (!isDemo) load(); }, [isDemo]);

  const reset = () => {
    setIsOpen(false);
    setQuery('');
    setBank(null);
    setAccountNumber('');
  };
  const guard = useUnsavedChangesGuard(Boolean(bank || accountNumber), reset);
  const sheet = useSlideUpSheet(isOpen, guard.requestClose);

  const open = () => {
    if (blockIfFrozen()) return;
    setIsOpen(true);
    if (!banks) {
      setBanksError(null);
      listBanks().then(setBanks).catch((err) => setBanksError(err?.message || 'Could not load the list of banks.'));
    }
  };

  const matches = useMemo(() => {
    if (!banks) return [];
    const q = query.trim().toLowerCase();
    return q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
  }, [banks, query]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank || accountNumber.length !== NUBAN_LENGTH) return;
    setIsSaving(true);
    try {
      const saved = await verifyBankAccount(bank.code, accountNumber);
      setAccount(saved);
      toast.success(`Saved. Payouts go to ${saved.account_name} at ${saved.bank_name}.`);
      reset();
    } catch (err: any) {
      toast.error(err?.message || 'We couldn’t verify that account. Check the bank and number.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader title="Payout Account" subtitle="Where your earnings are sent when a customer confirms a job, or the 4-day window ends." />

      <div className="py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="min-w-0">
          {isDemo ? (
            <p className="text-[11px] text-slate-500">Not available on the demo account.</p>
          ) : loadError ? (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              {loadError}{' '}
              <button type="button" onClick={load} className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer">Try again</button>
            </p>
          ) : account === undefined ? (
            <p className="text-[11px] text-slate-500">Loading…</p>
          ) : account ? (
            <>
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                <span className="truncate">{account.account_name}</span>
                {account.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified" />}
              </p>
              <p className="text-[11px] text-slate-500">{account.bank_name} · {maskAccount(account.account_number)}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-slate-900 dark:text-slate-100">No payout account yet</p>
              <p className="text-[11px] text-slate-500">Add one so finished jobs can be paid out to you.</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={open}
          disabled={isDemo || account === undefined}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Landmark className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
          <span>{account ? 'Change Account' : 'Add Account'}</span>
        </button>
      </div>

      {sheet.shouldRender && (
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
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{account ? 'Change Payout Account' : 'Add Payout Account'}</h3>
              <p className="text-xs text-slate-500">We check the account with your bank and show the name on it. Use an account in your own name.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <span id="payout-bank-label" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank</span>
                {bank ? (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-navy-800/5 border border-navy-800/40 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span className="truncate">{bank.name}</span>
                    <button type="button" onClick={() => setBank(null)} className="text-navy-800 dark:text-navy-400 hover:underline cursor-pointer shrink-0">Change</button>
                  </div>
                ) : banksError ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{banksError}</p>
                ) : !banks ? (
                  <p className="text-[11px] text-slate-500">Loading banks…</p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="search"
                        aria-labelledby="payout-bank-label"
                        placeholder="Search banks"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                    <ul role="listbox" aria-labelledby="payout-bank-label" className="max-h-52 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                      {matches.length === 0 ? (
                        <li className="px-3.5 py-2.5 text-[11px] text-slate-500">No bank matches “{query.trim()}”.</li>
                      ) : (
                        matches.map((b) => (
                          <li key={b.code} role="option" aria-selected={false}>
                            <button
                              type="button"
                              onClick={() => setBank(b)}
                              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              {b.name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="payout-account-number" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                <input
                  id="payout-account-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={NUBAN_LENGTH}
                  placeholder="10 digits"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, NUBAN_LENGTH))}
                  className={`${inputClass} tracking-[0.15em] tabular-nums`}
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
                  disabled={isSaving || !bank || accountNumber.length !== NUBAN_LENGTH}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Checking with your bank…' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnsavedChangesModal guard={guard} description="You haven’t saved this account yet. Closing now will discard what you’ve entered." />
    </Card>
  );
};
