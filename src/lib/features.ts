/**
 * Switches for features that are built but not offered to everyone yet. Flip one here to bring the
 * feature back; the components stay in the codebase either way.
 */
export const FEATURES = {
  /** Payout account for clients. Hidden until the client wallet page exists; artisans always have it. */
  clientPayoutAccount: false,
} as const;
