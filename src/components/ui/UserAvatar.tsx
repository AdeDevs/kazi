import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
  alt?: string;
  verified?: boolean;
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return '';
  const clean = name.trim().replace(/^(Engr\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = '',
  sizeClassName = 'w-8 h-8',
  textClassName = 'text-xs font-bold',
  roundedClassName = 'rounded-lg',
  alt,
  verified = false
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);
  const hasValidSrc = Boolean(src && src.trim().length > 0 && !hasError);

  const getBgColor = (n?: string) => {
    if (!n) return 'bg-navy-900 text-white';
    const charCode = (n.charCodeAt(0) + (n.charCodeAt(1) || 0)) % 3;
    switch (charCode) {
      case 0: return 'bg-navy-900 text-white';
      case 1: return 'bg-slate-800 text-white dark:bg-slate-700';
      default: return 'bg-brand-orange-600 text-white';
    }
  };

  return (
    <div className={`relative shrink-0 ${sizeClassName} ${className}`}>
      <div className={`w-full h-full ${roundedClassName} overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-zinc-700/80 select-none ${
        hasValidSrc ? 'bg-zinc-100 dark:bg-zinc-800' : getBgColor(name)
      }`}>
        {hasValidSrc ? (
          <img
            src={src!}
            alt={alt || name || 'User Avatar'}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : initials ? (
          <span className={`${textClassName} tracking-wider select-none uppercase font-black leading-none`}>
            {initials}
          </span>
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-zinc-300 dark:text-zinc-400" />
        )}
      </div>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"
          title="Verified"
        />
      )}
    </div>
  );
};
