import React from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

interface UnsavedChangesModalProps {
  /** The object returned by useUnsavedChangesGuard() for this form. */
  guard: ReturnType<typeof useUnsavedChangesGuard>;
  /** What specifically will be lost -- the only thing that should vary between forms. */
  description: string;
}

/**
 * The single discard-confirmation dialog every form in the app renders when
 * useUnsavedChangesGuard's requestClose intercepts a dirty close. Title, button labels, and type
 * are fixed here so no screen re-implements or drifts from this copy -- only `description` (what
 * specifically gets discarded) changes per form.
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ guard, description }) => (
  <ConfirmationModal
    isOpen={guard.showDiscardConfirm}
    onClose={() => guard.setShowDiscardConfirm(false)}
    onConfirm={guard.confirmDiscard}
    title="Discard Unsaved Changes?"
    description={description}
    confirmText="Discard Changes"
    cancelText="Keep Editing"
    type="warning"
  />
);
