import React from 'react';
import { Role } from '../types';
import { Wrench, User, Briefcase, MessageSquare } from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  onSwitchRole: (role: Role) => void;
  unreadCount?: number;
  onOpenChats?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  unreadCount = 0,
  onOpenChats
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-navy-900 dark:bg-navy-100 flex items-center justify-center text-white dark:text-navy-900 border border-navy-900 dark:border-navy-100">
            <Wrench className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-navy-900 dark:text-navy-100">
                Kazi<span className="text-brand-orange-600">Hub</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                Trade Marketplace
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* Messages Button */}
          <button
            onClick={onOpenChats}
            className="relative p-2 rounded-none border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Messages" aria-label="Messages"
          >
            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-brand-orange-500 text-white text-[9px] flex items-center justify-center text-center font-bold leading-none shadow-xs">
                <span className="flex items-center justify-center text-center">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700">
            <button
              onClick={() => onSwitchRole('customer')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer rounded-none ${
                currentRole === 'customer'
                  ? 'bg-navy-900 dark:bg-navy-100 text-white dark:text-navy-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-navy-900 dark:hover:text-navy-200'
              }`}
            >
              <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Customer</span>
            </button>
            <button
              onClick={() => onSwitchRole('professional')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer rounded-none ${
                currentRole === 'professional'
                  ? 'bg-navy-900 dark:bg-navy-100 text-white dark:text-navy-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-navy-900 dark:hover:text-navy-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Pro Partner</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};

