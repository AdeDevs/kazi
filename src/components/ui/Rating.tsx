import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  rating,
  reviewCount,
  size = 'md',
  showCount = true
}) => {
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFilled = i < Math.floor(rating);
          return (
            <Star
              key={i}
              className={`${starSizes[size]} ${isFilled ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className={`font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums ${textSizes[size]}`}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={`text-zinc-500 dark:text-zinc-400 ${textSizes[size]}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

