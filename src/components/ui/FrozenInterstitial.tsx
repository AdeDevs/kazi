import React, { useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { SHOW_FROZEN_SHEET_EVENT, useAccountFrozen } from '../../hooks/useAccountFrozen';
import { unfreezeMe } from '../../lib/authApi';
import { FROZEN_ON_HOLD, ConsequenceSheet } from './ConsequenceSheet';

// Shown once per browser session per account, so it greets a frozen person on arrival without
// coming back on every page. After that the page-wide FrozenBanner carries the message.
const seenKey = (userId: string) => `kazihub_frozen_notice_seen_${userId}`;
const hasSeen = (userId: string) => {
  try { return sessionStorage.getItem(seenKey(userId)) === '1'; } catch { return false; }
};
/** Also used when someone freezes their own account, so the arrival notice doesn't greet them for it. */
export const markFrozenNoticeSeen = (userId: string) => {
  try { sessionStorage.setItem(seenKey(userId), '1'); } catch { /* storage blocked: it just shows again next load */ }
};

/**
 * Full-screen notice over a blurred app when a frozen account opens it. Nothing here is a lock: the
 * backend refuses every blocked action (423), and a frozen person still needs to read their
 * bookings and messages. It offers to unfreeze on the spot, or to carry on looking around.
 */
export const FrozenInterstitial: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { isFrozen } = useAccountFrozen();
  const [open, setOpen] = useState(false);
  // 'arrival': the once-per-visit greeting. 'action': they tried something that's paused.
  const [reason, setReason] = useState<'arrival' | 'action'>('arrival');
  const [isUnfreezing, setIsUnfreezing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFrozen && user && !hasSeen(user.id)) {
      markFrozenNoticeSeen(user.id);
      setReason('arrival');
      setOpen(true);
    }
    if (!isFrozen) setOpen(false);
  }, [isFrozen, user]);

  // Any gated action calls blockIfFrozen(), which asks for this sheet instead of starting.
  useEffect(() => {
    const onShow = () => {
      if (!isFrozen) return;
      if (user) markFrozenNoticeSeen(user.id);
      setError(null);
      setReason('action');
      setOpen(true);
    };
    window.addEventListener(SHOW_FROZEN_SHEET_EVENT, onShow);
    return () => window.removeEventListener(SHOW_FROZEN_SHEET_EVENT, onShow);
  }, [isFrozen, user]);

  const handleUnfreeze = async () => {
    setIsUnfreezing(true);
    setError(null);
    try {
      await unfreezeMe();
      await refreshUser();
      toast.success('Account unfrozen. Everything works again.');
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Couldn’t unfreeze your account. Try again, or use Account Settings.');
    } finally {
      setIsUnfreezing(false);
    }
  };

  return (
    <ConsequenceSheet
      theme="frost"
      icon={Snowflake}
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Your account is frozen"
      description={reason === 'action'
        ? 'Unfreeze to carry on with that. Nothing’s been deleted.'
        : `Nothing’s been deleted.${user?.role === 'artisan' ? ' Customers can’t find your profile until you unfreeze.' : ' Unfreeze any time to pick up where you left off.'}`}
      pillsLabel="On hold"
      pills={FROZEN_ON_HOLD}
      note="You can still see your bookings, payments and messages."
      primaryLabel="Unfreeze now"
      busyLabel="Unfreezing…"
      onPrimary={handleUnfreeze}
      secondaryLabel={reason === 'action' ? 'Not now' : 'Just look around'}
      closeLabel="Close and look around"
      busy={isUnfreezing}
      error={error}
    />
  );
};
