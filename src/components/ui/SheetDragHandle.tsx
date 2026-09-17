import React from 'react';

interface SheetDragHandleProps {
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  /** Overrides the default padded grab-zone -- use when the sheet's own padding isn't p-5 (the
      default assumes -mx-5 -mt-5 cancels a p-5 sheet, matching most of the app's modals). */
  className?: string;
}

/**
 * The visible pill is small on purpose, but the actual grab zone is the full-width padded area
 * around it, so it's an easy target to grab on a phone -- matching every sheet in the app.
 */
export const SheetDragHandle: React.FC<SheetDragHandleProps> = ({ dragHandleProps, className }) => (
  <div
    className={className ?? 'sm:hidden -mx-5 -mt-5 mb-1 px-5 pt-4 pb-3 cursor-grab active:cursor-grabbing touch-none'}
    {...dragHandleProps}
  >
    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" aria-hidden="true" />
  </div>
);
