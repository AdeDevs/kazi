import React from 'react';
import { showFrozenSheet } from '../../hooks/useAccountFrozen';
import { Snowflake } from 'lucide-react';

/** Page-wide notice shown above every signed-in screen while the account is frozen. */
export const FrozenBanner: React.FC = () => {
  return (
    <div
      role="status"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-3.5 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
    >
      <p className="flex items-start gap-2 text-xs font-bold leading-relaxed">
        <Snowflake className="w-4 h-4 shrink-0 mt-px" />
        <span>Your account is frozen. Messaging, bookings and profile changes are paused until you unfreeze it.</span>
      </p>
      <button
        type="button"
        onClick={showFrozenSheet}
        className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shrink-0"
      >
        Unfreeze
      </button>
    </div>
  );
};

/** Takes the place of a chat composer while the account is frozen. */
export const FrozenComposerNotice: React.FC = () => (
  <div className="pt-3 px-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shrink-0">
    <button
      type="button"
      onClick={showFrozenSheet}
      className="w-full flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 text-center cursor-pointer transition-colors"
    >
      <Snowflake className="w-4 h-4 shrink-0" />
      <span>Your account is frozen, so you can’t send messages. <span className="underline underline-offset-2">Unfreeze</span></span>
    </button>
  </div>
);
