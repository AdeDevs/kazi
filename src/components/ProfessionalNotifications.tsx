import React from 'react';
import { Notification } from '../types';
import { 
  ClipboardList, CheckCircle2, XCircle, MessageSquare, Calendar, Bell, ArrowRight, Check, CheckCheck
} from 'lucide-react';

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

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Page Header - Mobile Only */}
      <div className="flex md:hidden flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 id="notifications-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-500 text-white text-xs font-bold shadow-xs flex items-center justify-center text-center">
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

      {/* Desktop Quick Action Bar */}
      {unreadCount > 0 && onMarkAllAsRead && (
        <div className="hidden md:flex items-center justify-end">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="px-4 py-2 text-xs font-bold text-navy-800 dark:text-navy-300 hover:text-white bg-white hover:bg-navy-800 dark:bg-slate-900 dark:hover:bg-navy-800 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-navy-800 dark:text-navy-400 group-hover:text-white" />
            <span>Mark all as read</span>
          </button>
        </div>
      )}

      {/* Notifications Container */}
      {notifications.length === 0 ? (
        /* Empty State */
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center mx-auto mb-4 border border-slate-200/40 dark:border-slate-800">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            You're all caught up.
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            We'll notify you when new bookings, messages, or updates arrive.
          </p>
        </div>
      ) : (
        /* List */
        <div className="space-y-3">
          {notifications.map((notification) => {
            const { icon: Icon, bgClass } = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  notification.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/30'
                    : 'bg-navy-50/20 dark:bg-navy-950/20 border-navy-200/50 dark:border-navy-900/50 shadow-xs hover:bg-navy-50/30 dark:hover:bg-navy-950/30'
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
