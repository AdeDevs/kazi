// The landing page's hero search, carried through sign-up so a new client lands on the artisan
// search with it already filled in. Session-only: it's a one-time hand-off, not a preference.
const KEY = 'kazihub_pending_search';

export function savePendingSearch(query: string) {
  try {
    if (query.trim()) sessionStorage.setItem(KEY, query.trim());
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked (private mode): the search simply isn't carried over.
  }
}

export function hasPendingSearch(): boolean {
  try {
    return Boolean(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}

/** Reads the pending search once and clears it. */
export function takePendingSearch(): string {
  try {
    const value = sessionStorage.getItem(KEY) || '';
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return '';
  }
}
