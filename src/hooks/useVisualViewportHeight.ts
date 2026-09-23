import { useEffect } from 'react';

/**
 * Keeps a `--vvh` CSS custom property on the root element in sync with `window.visualViewport`'s
 * actual height. Mounted once near the app root so any component can size against it.
 *
 * Why this exists: CSS's `100dvh` is keyboard-aware on Android Chrome (with
 * `interactive-widget=resizes-content` set, which this app does) but NOT on iOS Safari -- there,
 * the on-screen keyboard just overlaps a `dvh`-sized box instead of shrinking it, so a bottom-
 * pinned element (the message composer, most visibly) ends up hidden behind the keyboard instead
 * of sitting right above it. `window.visualViewport.height` is the one measurement that reliably
 * shrinks on keyboard-open across both platforms, so components size against `var(--vvh)` (with a
 * `100dvh` fallback for the instant before this effect runs, and for browsers without
 * `visualViewport` at all) instead of `100dvh` directly wherever the keyboard can appear.
 */
export function useVisualViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    };

    update();
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);
}
