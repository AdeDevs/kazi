import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A tab indicator that slides from the old tab to the new one instead of popping. Put `listRef` on
 * the tab list (which must be `relative`), `data-tab={key}` on each tab button, and render
 * `<span style={indicatorStyle} className="tab-indicator ..." />` inside the list.
 */
export function useSlidingIndicator(active: string) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const activeRef = useRef(active);
  activeRef.current = active;

  const place = useCallback((animate: boolean) => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-tab="${activeRef.current}"]`);
    if (!tab) return;
    setIndicatorStyle({
      width: tab.offsetWidth,
      transform: `translateX(${tab.offsetLeft}px)`,
      opacity: 1,
      // The very first placement jumps there; tab changes and later size changes slide.
      transition: animate ? undefined : 'none',
    });
  }, []);

  const hasPlaced = useRef(false);
  useLayoutEffect(() => {
    place(hasPlaced.current);
    hasPlaced.current = true;
    // Keep the active tab visible in a horizontally scrolling tab row.
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active, place]);

  // One observer for the component's lifetime. Its first callback (fired on observe) is skipped so
  // it can't cancel a slide that's in progress; later ones are genuine size changes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) { first = false; return; }
      place(true);
    });
    // Each tab too: a count in a label ("Services 3") can change a tab's width without the row's.
    [list, ...list.querySelectorAll<HTMLElement>('[data-tab]')].forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [place]);

  return { listRef, indicatorStyle };
}

/** +1 when moving to a tab later in `order`, -1 when moving back -- so content slides the same way. */
export function useTabDirection<T>(active: T, order: readonly T[]) {
  const previous = useRef(active);
  const direction = order.indexOf(active) >= order.indexOf(previous.current) ? 1 : -1;
  useEffect(() => {
    previous.current = active;
  }, [active]);
  return direction;
}

interface TabPanelProps {
  /** Changes whenever the tab changes, so the panel remounts and plays its entrance. */
  panelKey: string;
  direction: number;
  className?: string;
  id?: string;
  labelledBy?: string;
  children: React.ReactNode;
}

/** The active tab's content, sliding in from the side of the tab you moved to. */
export const SlideTabPanel: React.FC<TabPanelProps> = ({ panelKey, direction, className = '', id, labelledBy, children }) => (
  <div className="tab-panels">
    <div key={panelKey} role="tabpanel" id={id} aria-labelledby={labelledBy} className={`${direction > 0 ? 'tab-panel-from-right' : 'tab-panel-from-left'} ${className}`}>
      {children}
    </div>
  </div>
);
