import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const FROZEN_ACTION_MESSAGE = 'Your account is frozen. Unfreeze it to do this.';

/** Event the frozen-account sheet (FrozenInterstitial, mounted once in the app shell) listens for. */
export const SHOW_FROZEN_SHEET_EVENT = 'kazihub:show-frozen-sheet';

/** Opens the frozen-account sheet from anywhere. */
export const showFrozenSheet = () => window.dispatchEvent(new Event(SHOW_FROZEN_SHEET_EVENT));

/**
 * The account's frozen state (`is_paused` from GET /auth/me) plus a guard for gated actions.
 * Call `blockIfFrozen()` where an action STARTS (opening a form, sheet or editor), not only where
 * it's submitted, so a frozen person never begins something they can't finish. It opens the frozen
 * sheet (with "Unfreeze now") instead of the action. This is UX only: the backend refuses gated
 * requests from a frozen account with 423.
 */
export function useAccountFrozen() {
  const { user, isDemo } = useAuth();
  const isFrozen = Boolean(user?.is_paused) && !isDemo;

  /** Returns true (and shows the frozen sheet) when the action must not go ahead. */
  const blockIfFrozen = useCallback((): boolean => {
    if (!isFrozen) return false;
    showFrozenSheet();
    return true;
  }, [isFrozen]);

  return { isFrozen, blockIfFrozen };
}
