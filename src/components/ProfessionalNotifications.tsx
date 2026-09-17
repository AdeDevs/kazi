import React, { useState } from 'react';
import { Notification } from '../types';
import {
  ClipboardList, CheckCircle2, XCircle, MessageSquare, Calendar, Bell, ArrowRight, Check, CheckCheck, Search, X
} from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';

interface ProfessionalNotificationsProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
  onMarkAsRead?: (id: string) => void;
}

export const ProfessionalNotifications: React.FC<ProfessionalNotificationsProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onMarkAsRead
}) => {
  // Helper to format/get the relative or simple timestamp
  const formatTimestamp = (ts: string) => {
    // If it's already a clean string like "Today, 10:30 AM", return it.
    if (ts.includes(',') || ts.includes('ago') || ts.includes('Today') || ts.includes('Yesterday')) {
      return ts;
    }
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (date.toDateString() === today.toDateString()) {
        return `Today, ${timeStr}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${timeStr}`;
      } else {
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
      }
    } catch {
      return ts;
    }
  };

  // Helper to get correct icon and container style based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_job':
        return {
          icon: ClipboardList,
          bgClass: 'bg-brand-orange-500/10 text-brand-orange-600 dark:text-brand-orange-400 border-brand-orange-500/20',
        };
      case 'job_accepted':
        return {
          icon: CheckCircle2,
          bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'job_cancelled':
        return {
          icon: XCircle,
          bgClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'new_message':
        return {
          icon: MessageSquare,
          bgClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        };
      case 'upcoming_booking':
        return {
          icon: Calendar,
          bgClass: 'bg-navy-800/10 text-navy-800 dark:text-navy-300 dark:bg-navy-950/40 border-navy-800/20',
        };
      default:
        return {
          icon: Bell,
          bgClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
        };
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'unread' | Notification['type']>('All');

  const searchTrimmed = searchTerm.trim().toLowerCase();
  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') {
      if (n.isRead) return false;
    } else if (filterType !== 'All') {
      if (n.type !== filterType) return false;
    }
    if (searchTrimmed) {
      const text = `${n.title} ${n.description}`.toLowerCase();
      if (!text.includes(searchTrimmed)) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-none space-y-6">
      <h1 className="sr-only">Notifications</h1>
      {/* Page Header - Mobile Only */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <p id="notifications-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Notifications
            </p>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-700 text-white text-xs font-bold shadow-xs flex items-center justify-center text-center">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Stay updated with important activity on your account.
          </p>
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="self-start sm:self-center px-4 py-2 text-xs font-bold text-navy-800 dark:text-navy-300 hover:text-white bg-slate-100 hover:bg-navy-800 dark:bg-slate-900 dark:hover:bg-navy-800 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-navy-800 dark:text-navy-400 group-hover:text-white" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alerts by keyword, job, or customer..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row lg:items-center gap-2 w-full lg:w-auto">
            <CustomDropdown
              value={filterType}
              onChange={(val) => setFilterType(val)}
              icon={<Bell className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              options={[
                { value: 'All', label: 'All Notifications' },
                { value: 'unread', label: 'Unread Only' },
                { value: 'new_job', label: 'New Job Requests' },
                { value: 'job_accepted', label: 'Job Accepted' },
                { value: 'job_cancelled', label: 'Job Cancelled' },
                { value: 'new_message', label: 'Messages' },
                { value: 'upcoming_booking', label: 'Upcoming Bookings' }
              ]}
              placeholder="All Notifications"
              className="w-full sm:w-auto lg:min-w-[190px]"
              buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
              dropdownWidth="w-56"
            />

            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="whitespace-nowrap">Mark all read</span>
              </button>
            )}

            {(searchTerm || filterType !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('All');
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer text-center"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Container */}
      {notifications.length === 0 ? (
        /* Empty State */
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200/40 dark:border-slate-800">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            You're all caught up.
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            We'll notify you when new bookings, messages, or updates arrive.
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* No Search/Filter Results */
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200/40 dark:border-slate-800">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No matching notifications.
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Try a different search term or clear the active filter.
          </p>
        </div>
      ) : (
        /* List */
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const { icon: Icon, bgClass } = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
                className={`group flex items-start gap-4 p-[10px] sm:p-[15px] rounded-2xl border transition-all duration-200 cursor-pointer ${
                  notification.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 border-l-4 border-l-brand-orange-500 dark:border-l-brand-orange-500 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Icon Column */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${bgClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm tracking-tight truncate ${
                      notification.isRead 
                        ? 'font-bold text-slate-800 dark:text-slate-200' 
                        : 'font-black text-slate-900 dark:text-white'
                    }`}>
                      {notification.title}
                    </h3>
                    
                    {/* Unread Indicator & Mark as Read Action */}
                    {!notification.isRead && (
                      <div className="flex items-center gap-2 shrink-0">
                        {onMarkAsRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(notification.id);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-navy-800 dark:text-navy-300 hover:text-white bg-navy-100/80 hover:bg-navy-800 dark:bg-navy-950 dark:hover:bg-navy-800 border border-navy-200 dark:border-navy-800 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Mark as read" aria-label="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as read</span>
                          </button>
                        )}
                        <span className="w-2.5 h-2.5 rounded-full bg-navy-800 dark:bg-navy-400 shrink-0" title="Unread" aria-label="Unread" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {notification.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      {formatTimestamp(notification.timestamp)}
                    </span>

                    <span className="text-[10px] font-bold text-navy-800 dark:text-navy-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
