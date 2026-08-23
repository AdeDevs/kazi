import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block select-none">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeStyles[size]} rounded-none object-cover border border-zinc-200 dark:border-zinc-800`}
        />
      ) : (
        <div className={`${sizeStyles[size]} rounded-none bg-zinc-900 dark:bg-zinc-800 text-zinc-100 font-medium flex items-center justify-center border border-zinc-900 dark:border-zinc-700`}>
          {initials}
        </div>
      )}
    </div>
  );
};

