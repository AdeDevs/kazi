import React, { useState } from 'react';
import { Image, MessageSquare, MessageSquareX, Mic, Trash2 } from 'lucide-react';
import { ConsequenceSheet } from '../ui/ConsequenceSheet';
import { firstNameOf } from '../../lib/people';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';

interface DeleteChatButtonProps {
  /** Who the conversation is with, for the confirmation text. */
  name: string;
  /** Deletes it on the backend; resolves true on success (failures are reported by the caller). */
  onDelete: () => Promise<boolean>;
  /** Runs after a successful delete, e.g. to go back to the inbox. */
  onDeleted: () => void;
}

/** DELETE /conversations/{id} removes the chat for this person only; the other side keeps theirs. */
export const DeleteChatButton: React.FC<DeleteChatButtonProps> = ({ name, onDelete, onDeleted }) => {
  const { blockIfFrozen } = useAccountFrozen();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const who = name ? firstNameOf(name) : 'They';

  const handleConfirm = async () => {
    setBusy(true);
    const ok = await onDelete();
    setBusy(false);
    if (ok) {
      setConfirming(false);
      onDeleted();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!blockIfFrozen()) setConfirming(true); }}
        disabled={busy}
        title="Delete conversation"
        aria-label="Delete conversation"
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
      >
        <Trash2 className="w-4.5 h-4.5" />
      </button>
      <ConsequenceSheet
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        theme="permanent"
        icon={MessageSquareX}
        title="Delete this conversation?"
        description={`It’s removed from your inbox for good. ${who} keeps their copy.`}
        pillsLabel="Removed for you"
        pills={[
          { label: 'Messages', Icon: MessageSquare },
          { label: 'Photos', Icon: Image },
          { label: 'Voice notes', Icon: Mic },
        ]}
        note="If either of you writes again, the chat starts fresh from that message."
        primaryLabel="Delete conversation"
        busyLabel="Deleting…"
        onPrimary={handleConfirm}
        secondaryLabel="Keep it"
        busy={busy}
      />
    </>
  );
};
