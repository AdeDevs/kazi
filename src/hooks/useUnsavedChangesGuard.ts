import { useState } from 'react';

/**
 * Intercepts a close/cancel action when a form has unsaved changes, showing a discard
 * confirmation first instead of silently dropping typed input. Pass `requestClose` everywhere
 * the raw close handler used to go (backdrop click, X button, Cancel button, and as the `onClose`
 * given to useSlideUpSheet so a drag-dismiss is guarded too) -- that one substitution covers every
 * dismiss path at once.
 */
export function useUnsavedChangesGuard(isDirty: boolean, close: () => void) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const requestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      close();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    close();
  };

  return { requestClose, showDiscardConfirm, setShowDiscardConfirm, confirmDiscard };
}
