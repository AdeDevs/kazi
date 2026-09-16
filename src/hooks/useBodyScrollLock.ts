import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;

/**
 * Locks page scroll while `active` is true. Shared (not copy-pasted per modal) so every modal in
 * the app gets identical behavior, and stacked via a ref count so two modals open at once don't
 * unlock the page when the first of them closes.
 *
 * Uses position:fixed rather than plain overflow:hidden -- overflow:hidden alone still lets iOS
 * Safari's rubber-band gesture scroll the page behind a modal, position:fixed blocks that too --
 * and restores the exact scroll position on unlock instead of jumping to the top.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [active]);
}
