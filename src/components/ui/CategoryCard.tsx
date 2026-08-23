import React from 'react';
import { Category } from '../../types';
import { Wrench, Zap, Droplet, Hammer, Wind, Settings, Truck, Sun, Shield, Palette, Flame, Sparkles, Scissors, Camera, Calendar, Users } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onClick: () => void;
  count?: number;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  'Electricians': <Zap className="w-4 h-4" strokeWidth={1.5} />,
  'Plumbers': <Droplet className="w-4 h-4" strokeWidth={1.5} />,
  'Carpenters': <Hammer className="w-4 h-4" strokeWidth={1.5} />,
  'AC Technicians': <Wind className="w-4 h-4" strokeWidth={1.5} />,
  'Appliance Repair Specialists': <Settings className="w-4 h-4" strokeWidth={1.5} />,
  'Mechanics': <Truck className="w-4 h-4" strokeWidth={1.5} />,
  'Solar Installers': <Sun className="w-4 h-4" strokeWidth={1.5} />,
  'CCTV Installers': <Shield className="w-4 h-4" strokeWidth={1.5} />,
  'Painters': <Palette className="w-4 h-4" strokeWidth={1.5} />,
  'Welders': <Flame className="w-4 h-4" strokeWidth={1.5} />,
  'Cleaners': <Sparkles className="w-4 h-4" strokeWidth={1.5} />,
  'Tutors': <Users className="w-4 h-4" strokeWidth={1.5} />,
  'Tailors': <Scissors className="w-4 h-4" strokeWidth={1.5} />,
  'Hair Stylists': <Users className="w-4 h-4" strokeWidth={1.5} />,
  'Photographers': <Camera className="w-4 h-4" strokeWidth={1.5} />,
  'Event Professionals': <Calendar className="w-4 h-4" strokeWidth={1.5} />
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onClick,
  count
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 rounded-none border transition-colors text-left cursor-pointer group select-none ${
        isSelected
          ? 'bg-navy-900 text-white border-navy-900 dark:bg-navy-100 dark:text-navy-900 dark:border-navy-100'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-navy-900 dark:hover:border-navy-400'
      }`}
    >
      <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 border ${
        isSelected
          ? 'bg-navy-800 text-white border-navy-700 dark:bg-navy-200 dark:text-navy-900 dark:border-navy-300'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 group-hover:border-navy-400 dark:group-hover:border-navy-600 group-hover:text-navy-900 dark:group-hover:text-navy-300'
      }`}>
        {categoryIcons[category] || <Wrench className="w-4 h-4" strokeWidth={1.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-xs sm:text-sm truncate transition-colors ${isSelected ? 'text-white dark:text-navy-900' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-navy-900 dark:group-hover:text-navy-300'}`}>
          {category}
        </h4>
        {count !== undefined && (
          <p className={`text-[11px] transition-colors ${isSelected ? 'text-navy-300 dark:text-navy-600' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-navy-600 dark:group-hover:text-navy-400'}`}>
            {count} {count === 1 ? 'pro' : 'pros'}
          </p>
        )}
      </div>
    </button>
  );
};

