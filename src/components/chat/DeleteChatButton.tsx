import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';

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
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    const ok = await onDelete();
    setBusy(false);
    setConfirming(false);
    if (ok) onDeleted();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        title="Delete conversation"
        aria-label="Delete conversation"
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
      >
        <Trash2 className="w-4.5 h-4.5" />
      </button>
      <ConfirmationModal
        isOpen={confirming}
        onClose={() => { if (!busy) setConfirming(false); }}
        onConfirm={handleConfirm}
        isLoading={busy}
        title="Delete This Conversation?"
        description={`The messages with ${name} are removed from your inbox for good. ${name} keeps their copy. If either of you writes again, the chat starts fresh from that message.`}
        confirmText="Yes, Delete"
        cancelText="Keep Conversation"
        type="danger"
      />
    </>
  );
};
