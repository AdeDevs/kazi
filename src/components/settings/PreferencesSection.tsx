import React, { useState } from 'react';
import { Sliders, Moon, Sun, Globe, CheckCircle2, X } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../../translations';
import { useAuth } from '../../context/AuthContext';

interface PreferencesSectionProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
  triggerToast: (msg: string) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  darkMode = false,
  onToggleDarkMode,
  currentLanguage = 'English (Nigeria)',
  onLanguageChange,
  triggerToast,
}) => {
  const { updateUser } = useAuth();

  // Not backed by a real backend endpoint yet -- notification preferences have no API support,
  // so these stay local-only rather than falsely implying they're saved server-side.
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleToggleTheme = async () => {
    const willBeDark = !darkMode;
    onToggleDarkMode?.();
    try {
      await updateUser({ theme: willBeDark ? 'dark' : 'light' });
    } catch {
      // Local theme toggle already applied; syncing it to the account is best-effort.
    }
  };

  const handleSelectLanguage = async (lang: Language) => {
    onLanguageChange?.(lang);
    setShowLanguageModal(false);
    triggerToast(`Language changed to ${lang}`);
    try {
      await updateUser({ preferred_language: lang });
    } catch {
      // Local language change already applied; syncing it to the account is best-effort.
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Preferences</h3>
          <p className="text-[11px] text-slate-400">Language, display mode, and notification channels.</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Push Notifications */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Push Notifications</p>
            <p className="text-[11px] text-slate-500">Real-time alerts for booking acceptances & chats.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              aria-label="Push notifications"
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
          </label>
        </div>

        {/* Email Alerts */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Email Summaries</p>
            <p className="text-[11px] text-slate-500">Escrow payment receipts and job completion reports.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              aria-label="Email summaries"
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-800"></div>
          </label>
        </div>

        {/* Theme Toggle */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Display Theme</p>
            <p className="text-[11px] text-slate-500">{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleTheme}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>

        {/* Language Selection */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Interface Language</p>
            <p className="text-[11px] text-slate-500">{currentLanguage}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowLanguageModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
            <span>Change</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECTION MODAL */}
      {showLanguageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowLanguageModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLanguageModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Select Interface Language</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleSelectLanguage(lang)}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    currentLanguage === lang
                      ? 'bg-navy-800 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{lang}</span>
                  {currentLanguage === lang && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
