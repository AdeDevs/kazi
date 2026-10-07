import { ApiError, apiGet, apiPost } from './apiClient';

export interface BankOption {
  code: string;
  name: string;
}

/** The artisan's payout account, as saved after Paystack resolved it. */
export interface BankAccount {
  id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  /** The name Paystack found on the account. */
  account_name: string;
  is_verified: boolean;
  created_at: string;
}

/** Banks an artisan can be paid into, A–Z (sourced from Paystack, cached by the backend). */
export const listBanks = () => apiGet<BankOption[]>('/payments/banks');

/** Null when no payout account has been saved yet (the endpoint answers 404). */
export async function getMyBankAccount(): Promise<BankAccount | null> {
  try {
    return await apiGet<BankAccount>('/payments/bank-account');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Resolves the account with Paystack and saves it as the payout account; nothing is saved if that fails. */
export const verifyBankAccount = (bankCode: string, accountNumber: string) =>
  apiPost<BankAccount>('/payments/verify-bank-account', { bank_code: bankCode, account_number: accountNumber });
