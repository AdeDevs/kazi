import React, { useState } from 'react';
import { Role, Professional, Booking, Category } from '../types';
import { Language, t } from '../translations';
import { 
  Wrench, Home, Calendar, MessageSquare,
  Moon, Sun, Bell, Settings, Briefcase, LogOut,
  Menu, Search
} from 'lucide-react';

interface AppShellProps {
  currentRole: Role;
  onSwitchRole: (role: Role) => void;
  unreadCount: number;
  notificationsUnreadCount?: number;
  onOpenChats: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  selectedCategoryFilter: Category | 'All';
  onSelectCategoryFilter: (cat: Category | 'All') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  professionals: Professional[];
  bookings: Booking[];
  activeProfessional: Professional;
  customerAvatar: string;
  onLogout?: () => void;
  currentLanguage?: Language;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRole,
  onSwitchRole,
  unreadCount,
  notificationsUnreadCount = 0,
  onOpenChats,
  darkMode,
  onToggleDarkMode,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  activeTab,
  onTabChange,
  professionals,
  bookings,
  activeProfessional,
  customerAvatar,
  onLogout,
  currentLanguage = 'English (Nigeria)' as Language,
  children
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const activeCount = bookings.filter(b => b.status === 'accepted' || b.status === 'in-progress').length;

  const navItems = [
    { id: 'explore', label: t('nav.home', currentLanguage), icon: Home },
    ...(currentRole === 'professional' ? [{ id: 'jobs', label: t('nav.jobs', currentLanguage), icon: Briefcase, badge: pendingCount > 0 ? pendingCount : undefined }] : []),
    ...(currentRole === 'customer' ? [{ id: 'bookings', label: t('nav.bookings', currentLanguage), icon: Calendar }] : []),
    { id: 'messages', label: t('nav.messages', currentLanguage), icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'notifications', label: t('nav.notifications', currentLanguage), icon: Bell, badge: notificationsUnreadCount > 0 ? notificationsUnreadCount : undefined },
    { id: 'settings', label: t('nav.settings', currentLanguage), icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-zinc-100 dark' : 'bg-zinc-50 text-zinc-900'} antialiased`}>
      
      {/* Shell Layout Wrapper */}
      <div className="w-full flex min-h-screen">
        
        {/* ================= OVERLAY FOR MOBILE SIDEBAR ================= */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ================= LEFT SIDEBAR ================= */}
        <aside
          className={`flex flex-col transition-[width,transform] duration-300 ease-in-out border-r border-zinc-200 dark:border-zinc-800 fixed md:sticky top-0 h-screen overflow-hidden shrink-0 z-50 md:z-30 bg-white dark:bg-zinc-950 group ${
            isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-[68px] md:hover:w-64'
          }`}
        >
          
          {/* Brand Logo (Matches Top Navbar Height & Padding) */}
          <div className="h-[65px] md:h-[73px] w-full shrink-0 flex items-center px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
            <div
              onClick={() => {
                onTabChange('explore');
                if (window.innerWidth < 768) {
                  setIsMobileSidebarOpen(false);
                }
              }}
              className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-navy-100 flex items-center justify-center text-white dark:text-navy-900 border border-navy-900 dark:border-navy-100 shrink-0 cursor-pointer"
              title="KaziHub Home"
              aria-label="KaziHub Home"
            >
              <Wrench className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className={`pl-2.5 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
              isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
            }`}>
              <h1 className="text-[17px] font-bold tracking-tight text-navy-900 dark:text-navy-100">
                Kazi<span className="text-brand-orange-600">Hub</span>
              </h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between p-3.5">
            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (window.innerWidth < 768) {
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full relative flex items-center h-10 rounded-xl font-medium text-sm transition-colors cursor-pointer group/link ${
                      isActive
                        ? 'bg-navy-900 text-white dark:bg-navy-100 dark:text-navy-900 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-navy-900 dark:hover:text-navy-100'
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 absolute left-0 top-0">
                      <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    </div>
                    <span className={`pl-12 whitespace-nowrap overflow-hidden text-left flex-1 transition-opacity duration-200 ${
                      isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                    }`}>
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-opacity duration-200 ${
                        isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                      } bg-brand-orange-600 text-white`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Controls & Profile */}
            <div className="pt-3 mt-auto border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 shrink-0 overflow-hidden">
              <div className="md:hidden space-y-1.5">
                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="w-full relative flex items-center h-10 rounded-xl font-medium text-sm transition-colors cursor-pointer text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-navy-900 dark:hover:text-navy-100"
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle Dark Mode"
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 absolute left-0 top-0">
                    {darkMode ? <Sun className="w-5 h-5 text-amber-500" strokeWidth={1.5} /> : <Moon className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />}
                  </div>
                  <span className={`pl-12 whitespace-nowrap overflow-hidden text-left flex-1 transition-opacity duration-200 ${
                    isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                  }`}>
                    {darkMode ? 'Light Theme' : 'Dark Theme'}
                  </span>
                </button>
              </div>
  
              {/* Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full relative flex items-center h-10 rounded-xl font-medium text-sm transition-colors cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 absolute left-0 top-0">
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className={`pl-12 whitespace-nowrap overflow-hidden text-left flex-1 transition-opacity duration-200 ${
                    isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                  }`}>
                    Sign Out
                  </span>
                </button>
              )}

              {/* User Profile Info Navigator Button */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('profile');
                  if (window.innerWidth < 768) {
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className={`w-full relative flex items-center h-10 rounded-xl transition-all cursor-pointer select-none group/profile ${
                  activeTab === 'profile'
                    ? 'bg-navy-900 text-white dark:bg-navy-100 dark:text-navy-900 font-semibold shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                title="View Profile"
                aria-label="View Profile"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0 absolute left-0 top-0">
                  <img
                    src={currentRole === 'customer' ? customerAvatar : activeProfessional.avatar}
                    alt="User"
                    className="w-7 h-7 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                </div>
                <div className={`pl-12 pr-2 whitespace-nowrap overflow-hidden text-left transition-opacity duration-200 ${
                  isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                }`}>
                  <h4 className={`font-semibold text-xs truncate ${
                    activeTab === 'profile' ? 'text-white dark:text-navy-900' : 'text-navy-900 dark:text-navy-100'
                  }`}>
                    {currentRole === 'customer' ? 'Nneka Okonkwo' : activeProfessional.name}
                  </h4>
                  {currentRole === 'professional' ? (
                    <p className={`text-[10px] capitalize truncate ${
                      activeTab === 'profile' ? 'text-zinc-300 dark:text-navy-700' : 'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {activeProfessional.category}
                    </p>
                  ) : (
                    <p className={`text-[10px] truncate ${
                      activeTab === 'profile' ? 'text-zinc-300 dark:text-navy-700' : 'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      Customer Profile
                    </p>
                  )}
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* ================= SCROLLABLE CENTER MAIN FEED ================= */}
        <main className="flex-1 min-w-0 min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
          
          {/* Unified Glassmorphic Top Header */}
          <header className="h-[65px] md:h-[73px] shrink-0 sticky top-0 z-30 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-3.5 sm:px-4 flex items-center justify-between">
            {/* Mobile View: Hamburger + Logo */}
            <div className="flex md:hidden items-center gap-2.5">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1 -ml-1 text-zinc-900 dark:text-white cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                title="Open Navigation"
                aria-label="Open Navigation"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[17px] text-navy-900 dark:text-navy-100">Kazi<span className="text-brand-orange-600">Hub</span></span>
              </div>
            </div>

            {/* Desktop View: Dynamic Title */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <h2 className="text-[19px] sm:text-xl font-bold tracking-tight text-navy-900 dark:text-navy-100 capitalize">
                {activeTab === 'explore' ? t('nav.home', currentLanguage) : activeTab}
              </h2>
            </div>

            {/* Desktop View: Search Bar directly beside Dark Mode & Notifications (Same Parent) */}
            <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
              {activeTab !== 'explore' && (
                <div className="relative w-60 lg:w-72 group">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-orange-600 transition-colors" strokeWidth={2} />
                  <input 
                    type="text" 
                    placeholder={`Search in ${activeTab}...`}
                    aria-label={`Search in ${activeTab}`}
                    className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm px-9 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-orange-500 focus:bg-white dark:focus:bg-zinc-950 transition-all text-navy-900 dark:text-navy-100"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Toggle Theme"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} /> : <Moon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />}
              </button>
              
              <button
                type="button"
                className="relative p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => onTabChange('notifications')}
              >
                <Bell className="w-4 h-4" strokeWidth={1.5} />
                {(notificationsUnreadCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-brand-orange-600 text-white font-bold text-[9px] flex items-center justify-center">
                    {notificationsUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Main Feed Content Area */}
          <div className="p-3.5 sm:p-4 pb-4 w-full max-w-none flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
