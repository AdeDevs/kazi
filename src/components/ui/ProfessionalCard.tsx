import React from 'react';
import { Professional } from '../../types';
import { ShieldCheck, Star, MapPin, MessageSquare, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface ProfessionalCardProps {
  professional: Professional;
  onBook: (pro: Professional) => void;
  onChat: (pro: Professional) => void;
  onViewProfile: (pro: Professional) => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onBook,
  onChat,
  onViewProfile
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="p-4 pb-3 flex items-start gap-3.5">
          <div className="relative cursor-pointer shrink-0" onClick={() => onViewProfile(professional)}>
            <img
              src={professional.avatar}
              alt={professional.name}
              className="w-12 h-12 rounded-none object-cover border border-zinc-200 dark:border-zinc-800"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                onClick={() => onViewProfile(professional)}
                className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate hover:underline cursor-pointer"
              >
                {professional.name}
              </h3>
              {professional.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-navy-600 dark:text-brand-orange-500 shrink-0" strokeWidth={1.5} title="Verified Professional" aria-label="Verified Professional" />
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{professional.category}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{professional.neighborhood}</span>
            </p>
          </div>
        </div>

        {/* Tagline & Rates */}
        <div className="px-4 pb-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-3 leading-relaxed">{professional.tagline}</p>
          
          <div className="flex items-center justify-between gap-2 py-2 px-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-none text-xs border border-zinc-200 dark:border-zinc-700/60">
            <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" strokeWidth={1.5} />
              {professional.rating} <span className="text-zinc-400 font-normal">({professional.reviewCount})</span>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">{professional.completedJobs} jobs</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(professional.hourlyRate)}/hr</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onChat(professional)}
          className="py-2 px-3 rounded-none border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => onBook(professional)}
          className="py-2 px-3 rounded-none bg-brand-orange-600 hover:bg-brand-orange-700 text-white border border-brand-orange-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Book Now</span>
        </button>
      </div>
    </div>
  );
};

