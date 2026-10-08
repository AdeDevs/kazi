/**
 * Switches for features that are built but not offered to everyone yet. Flip one here to bring the
 * feature back; the components stay in the codebase either way.
 */
export const FEATURES = {
  /** Payout account on clients' Wallet page. Off until the backend says refunds can go to a bank (ask 51). */
  clientPayoutAccount: false,
} as const;
