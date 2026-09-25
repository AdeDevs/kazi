import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export const FROZEN_ACTION_MESSAGE = 'Your account is frozen. Unfreeze it in Account Settings to do this.';

/**
 * The account's frozen state (`is_paused` from GET /auth/me) plus a guard for gated actions.
 * This is UX only -- the backend is what must refuse gated requests from a frozen account.
 */
export function useAccountFrozen() {
  const { user, isDemo } = useAuth();
  const isFrozen = Boolean(user?.is_paused) && !isDemo;

  /** Returns true (and explains why) when the action must not go ahead. */
  const blockIfFrozen = useCallback((): boolean => {
    if (!isFrozen) return false;
    toast.error(FROZEN_ACTION_MESSAGE);
    return true;
  }, [isFrozen]);

  return { isFrozen, blockIfFrozen };
}
