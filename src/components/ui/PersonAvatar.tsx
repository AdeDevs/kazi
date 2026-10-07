import React from 'react';
import { UserAvatar } from './UserAvatar';
import { UNKNOWN_PERSON } from '../../lib/people';

interface PersonAvatarProps {
  /** Resolved with personName(); '' while it's still loading. */
  name: string;
  src?: string | null;
  loading?: boolean;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
  className?: string;
}

/**
 * A person's photo, else their initials on a neutral background. While the name is loading it's a
 * skeleton, never a generic role icon.
 */
export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  name, src, loading = false, sizeClassName = 'w-10 h-10', textClassName = 'text-xs font-bold', roundedClassName = 'rounded-xl', className = '',
}) => {
  if (loading && !src) {
    return <div className={`shrink-0 ${sizeClassName} ${roundedClassName} bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} aria-hidden="true" />;
  }
  return (
    <UserAvatar
      src={src}
      name={name || UNKNOWN_PERSON}
      alt={name || UNKNOWN_PERSON}
      neutral
      sizeClassName={sizeClassName}
      textClassName={textClassName}
      roundedClassName={roundedClassName}
      className={className}
    />
  );
};

/** A person's name, or a text-shaped skeleton while it loads. */
export const PersonName: React.FC<{ name: string; loading?: boolean; className?: string }> = ({ name, loading = false, className = '' }) =>
  loading && !name
    ? <span className={`inline-block h-[0.9em] w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse align-middle ${className}`} aria-label="Loading name" />
    : <span className={className}>{name || UNKNOWN_PERSON}</span>;

/** Small inline avatar + name, for "Customer: …" lines on cards. */
export const PersonChip: React.FC<{ name: string; src?: string | null; loading?: boolean; className?: string }> = ({ name, src, loading = false, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 min-w-0 align-middle ${className}`}>
    <PersonAvatar name={name} src={src} loading={loading} sizeClassName="w-5 h-5" roundedClassName="rounded-full" textClassName="text-[8px] font-bold" />
    <PersonName name={name} loading={loading} className="truncate" />
  </span>
);
