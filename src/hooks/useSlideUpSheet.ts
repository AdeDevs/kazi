import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useBodyScrollLock } from './useBodyScrollLock';

const EXIT_ANIMATION_MS = 200;
const DRAG_DISMISS_THRESHOLD = 96;

export interface SlideUpSheet {
  /** False once the exit animation has fully finished -- gate your `return null` on this, not `isOpen`. */
  shouldRender: boolean;
  /** True for the ~200ms exit-animation window between isOpen going false and shouldRender going false. */
  isClosing: boolean;
  isDragging: boolean;
  /** Live downward drag offset in px, 0 when not dragging. */
  dragY: number;
  /** Spread onto the drag-handle element (or the whole sheet, for a full-surface grab zone). */
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  /** Spread onto the sheet element's `style` -- applies the live drag offset, if any. */
  dragStyle: React.CSSProperties | undefined;
  /** Compose with your own layout/color/radius classes on the sheet element. */
  sheetAnimationClasses: string;
  /** Compose with your own color classes on the backdrop element. */
  backdropAnimationClasses: string;
}

/**
 * Shared state machine behind every slide-up sheet / modal in the app: mount-for-one-more-frame
 * exit animation (React doesn't animate unmounts on its own), real pointer-based drag-to-dismiss,
 * and body scroll lock for as long as the sheet is visible (including its exit animation).
 *
 * This owns state and behavior only, not markup -- every sheet's content differs too much (a
 * two-line confirmation vs. a tabbed detail view vs. a multi-step form) to share one wrapper
 * component, but the open/close/drag mechanics underneath should never be hand-rolled a third
 * time. Compose `sheetAnimationClasses`/`backdropAnimationClasses` with each modal's own layout
 * classes, and spread `dragHandleProps` onto a drag-handle element (see `SheetDragHandle` below
 * for the common case, or build a bespoke one when the handle needs to sit somewhere unusual,
 * e.g. over a photo).
 */
export function useSlideUpSheet(isOpen: boolean, onClose: () => void): SlideUpSheet {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, EXIT_ANIMATION_MS);
    }
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useBodyScrollLock(shouldRender);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const delta = e.clientY - dragStartYRef.current;
    setDragY(delta > 0 ? delta : 0);
  };
  const endDrag = () => {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    setIsDragging(false);
    if (dragY > DRAG_DISMISS_THRESHOLD) {
      onClose();
    }
    setDragY(0);
  };

  return {
    shouldRender,
    isClosing,
    isDragging,
    dragY,
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag
    },
    dragStyle: dragY ? { transform: `translateY(${dragY}px)` } : undefined,
    // Both enter and exit use ease-out (not ease-in for the exit) -- ease-in starts slow, which
    // reads as sluggish right when the user's eye is on the movement most closely.
    sheetAnimationClasses: `${isDragging ? '' : 'transition-transform duration-200 ease-out'} ${
      isClosing
        ? 'animate-out slide-out-to-bottom-full sm:slide-out-to-bottom-0 sm:zoom-out-95 duration-200 ease-out'
        : 'animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250 ease-out'
    }`,
    backdropAnimationClasses: `transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`
  };
}
