import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, Landmark, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { UnsavedChangesModal } from '../ui/UnsavedChangesModal';
import { useAuth } from '../../context/AuthContext';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { BankAccount, BankOption, getMyBankAccount, listBanks, verifyBankAccount } from '../../lib/paymentsApi';

const inputClass =
  'w-full h-12 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[15px] font-semibold text-slate-900 dark:text-slate-100 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-navy-800 dark:focus:border-navy-300';

/** Nigerian bank account numbers (NUBAN) are 10 digits. */
const NUBAN_LENGTH = 10;
const maskAccount = (n: string) => (n.length > 4 ? `•••• ${n.slice(-4)}` : n);

/**
 * Wallet page, artisans: the one bank account their share is paid into when a job is released.
 * Shown as a slim line under the wallet figures; adding or changing it opens a sheet. One account
 * per person (the backend keeps one); removing it waits for DELETE /payments/bank-account (backend ask).
 */
export const PayoutSection: React.FC = () => {
  const { isDemo } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  // undefined = loading, null = none saved.
  const [account, setAccount] = useState<BankAccount | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [banks, setBanks] = useState<BankOption[] | null>(null);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [pickingBank, setPickingBank] = useState(false);
  const [query, setQuery] = useState('');
  const [bank, setBank] = useState<BankOption | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [numberError, setNumberError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const numberRef = useRef<HTMLInputElement | null>(null);

  const load = () => {
    setLoadError(null);
    getMyBankAccount().then(setAccount).catch((err) => setLoadError(err?.message || 'Could not load your payout account.'));
  };
  useEffect(() => { if (!isDemo) load(); }, [isDemo]);

  const reset = () => {
    setIsOpen(false);
    setPickingBank(false);
    setQuery('');
    setBank(null);
    setAccountNumber('');
    setNumberError(null);
  };
  const guard = useUnsavedChangesGuard(Boolean(bank || accountNumber), reset);
  // While choosing a bank, closing the sheet (Esc, drag, backdrop) just goes back to the form.
  const sheet = useSlideUpSheet(isOpen, () => (pickingBank ? setPickingBank(false) : guard.requestClose()));

  const loadBanks = () => {
    setBanksError(null);
    listBanks().then(setBanks).catch((err) => setBanksError(err?.message || 'Could not load the list of banks.'));
  };

  const open = () => {
    if (blockIfFrozen()) return;
    setIsOpen(true);
    if (!banks) loadBanks();
  };

  const openPicker = () => {
    setPickingBank(true);
    setQuery('');
    requestAnimationFrame(() => searchRef.current?.focus());
  };
  const chooseBank = (b: BankOption) => {
    setBank(b);
    setPickingBank(false);
    requestAnimationFrame(() => numberRef.current?.focus());
  };

  const matches = useMemo(() => {
    if (!banks) return [];
    const q = query.trim().toLowerCase();
    return q ? banks.filter((b) => b.name.toLowerCase().includes(q)) : banks;
  }, [banks, query]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank) {
      openPicker();
      return;
    }
    if (accountNumber.length !== NUBAN_LENGTH) {
      setNumberError(`Account numbers have ${NUBAN_LENGTH} digits.`);
      numberRef.current?.focus();
      return;
    }
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
    <section
      aria-label="Payout account"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0" aria-hidden="true">
          <Landmark className="w-[18px] h-[18px]" />
        </span>
        <div className="min-w-0 text-sm">
          {isDemo ? (
            <p className="text-slate-500 dark:text-slate-400">Payout account isn’t available on the demo account.</p>
          ) : loadError ? (
            <p className="text-rose-600 dark:text-rose-400">
              {loadError}{' '}
              <button type="button" onClick={load} className="font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer">Try again</button>
            </p>
          ) : account === undefined ? (
            <span className="block h-4 w-56 max-w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" aria-label="Loading payout account" />
          ) : account ? (
            <p className="truncate text-slate-600 dark:text-slate-300">
              Paid to <span className="font-bold text-slate-900 dark:text-zinc-100">{account.bank_name} {maskAccount(account.account_number)}</span>
              <span className="inline-flex items-center gap-1 align-middle">
                {' · '}{account.account_name}
                {account.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified" />}
              </span>
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-zinc-100">No payout account yet.</span> Add the bank account we should pay you into.
            </p>
          )}
        </div>
      </div>
      {!isDemo && account !== undefined && !loadError && (
        <button
          type="button"
          onClick={open}
          className={account
            ? 'self-start sm:self-auto pl-12 sm:pl-0 text-sm font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer shrink-0'
            : 'self-start sm:self-auto h-10 px-4 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97] cursor-pointer shrink-0'}
        >
          {account ? 'Change' : 'Add account'}
        </button>
      )}

      {sheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
          onClick={() => (pickingBank ? setPickingBank(false) : guard.requestClose())}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative flex flex-col ${pickingBank ? 'h-[min(640px,92vh)] sm:h-[min(620px,85vh)]' : 'max-h-[92vh] overflow-y-auto'} ${sheet.sheetAnimationClasses}`}
            style={sheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={sheet.dragHandleProps} />

            {pickingBank ? (
              // Choosing a bank takes over the sheet, so the list is never cut off by it.
              <div className="flex flex-col min-h-0 flex-1 gap-3">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPickingBank(false)} aria-label="Back" className="-ml-2 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 id="bank-picker-title" className="text-lg font-black text-slate-900 dark:text-slate-100">Choose your bank</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="search"
                    aria-label="Search banks"
                    placeholder="Search banks"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && matches.length === 1) { e.preventDefault(); chooseBank(matches[0]); } }}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-1 px-1">
                  {banksError ? (
                    <p className="py-4 text-sm text-rose-600 dark:text-rose-400">
                      {banksError}{' '}
                      <button type="button" onClick={loadBanks} className="font-bold text-navy-800 dark:text-navy-300 hover:underline cursor-pointer">Try again</button>
                    </p>
                  ) : !banks ? (
                    <div className="space-y-2 py-1" aria-label="Loading banks">
                      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                    </div>
                  ) : matches.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No bank matches “{query.trim()}”.</p>
                  ) : (
                    <ul role="listbox" aria-labelledby="bank-picker-title" className="divide-y divide-slate-100 dark:divide-slate-800">
                      {matches.map((b) => (
                        <li key={b.code} role="option" aria-selected={bank?.code === b.code}>
                          <button
                            type="button"
                            onClick={() => chooseBank(b)}
                            className="w-full flex items-center justify-between gap-3 text-left px-2 py-3 text-[15px] font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <span>{b.name}</span>
                            {bank?.code === b.code && <CheckCircle2 className="w-4 h-4 text-navy-800 dark:text-navy-300 shrink-0" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={guard.requestClose}
                  aria-label="Close"
                  className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1 pr-8">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{account ? 'Change payout account' : 'Add payout account'}</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">We check the account with your bank and show the name on it. Use an account in your own name.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <span id="payout-bank-label" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">Bank</span>
                    <button
                      type="button"
                      onClick={openPicker}
                      aria-labelledby="payout-bank-label"
                      aria-haspopup="listbox"
                      className={`${inputClass} flex items-center justify-between gap-2 text-left cursor-pointer`}
                    >
                      <span className={bank ? 'truncate' : 'font-medium text-slate-400'}>{bank ? bank.name : 'Choose your bank'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="payout-account-number" className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">Account number</label>
                    <input
                      ref={numberRef}
                      id="payout-account-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={NUBAN_LENGTH}
                      placeholder="Enter your account number"
                      value={accountNumber}
                      aria-invalid={Boolean(numberError) || undefined}
                      aria-describedby={numberError ? 'payout-number-error' : undefined}
                      onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, NUBAN_LENGTH)); setNumberError(null); }}
                      className={`${inputClass} tabular-nums ${numberError ? 'border-rose-500 dark:border-rose-500' : ''}`}
                    />
                    {numberError && <p id="payout-number-error" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{numberError}</p>}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={guard.requestClose}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white text-white font-bold text-sm shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isSaving ? 'Checking with your bank…' : 'Verify & save'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <UnsavedChangesModal guard={guard} description="You haven’t saved this account yet. Closing now will discard what you’ve entered." />
    </section>
  );
};
