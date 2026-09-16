import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  /** When provided, renders as a labeled pill (e.g. "Verified", "Verified Pro"). Omit for a bare inline glyph next to a name. */
  label?: string;
  /** Icon size classes. Defaults to a size that reads well next to body-size name text. */
  iconClassName?: string;
  /** Overrides the pill container classes -- only used with `label`. Needed for the one dark/photo-banner header where the default light-mode pill would be illegible. */
  pillClassName?: string;
  /** Extra classes on the label text itself -- e.g. "hidden sm:inline" to collapse a pill to just the icon in tight header layouts. */
  labelClassName?: string;
  /** Accessible name / tooltip. Defaults to `label` or "Verified". */
  title?: string;
}

/**
 * The single verified-identity badge used everywhere a customer or professional's name needs
 * a verification mark -- profile headers, dashboard greetings, booking rows, chat headers,
 * conversation lists, and professional cards. Always the same BadgeCheck glyph and emerald tone,
 * placed inline after the name rather than overlaid on the avatar, so "verified" reads as one
 * consistent signal across the app instead of three different badges doing the same job.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  label,
  iconClassName = 'w-3.5 h-3.5',
  pillClassName,
  labelClassName,
  title
}) => {
  const tooltip = title || label || 'Verified';

  if (label) {
    return (
      <span
        title={tooltip}
        className={
          pillClassName ||
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0'
        }
      >
        <BadgeCheck className={`${iconClassName} text-emerald-600 dark:text-emerald-400 shrink-0`} />
        <span className={labelClassName}>{label}</span>
      </span>
    );
  }

  return (
    <span title={tooltip} className="inline-flex shrink-0">
      <BadgeCheck className={`${iconClassName} text-emerald-600 dark:text-emerald-400 fill-emerald-600/10 dark:fill-emerald-400/10 shrink-0`} />
    </span>
  );
};
