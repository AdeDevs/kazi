import React, { useState } from 'react';
import { Moon, Sun, Globe, CheckCircle2, X } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES, languageCode } from '../../translations';
import { useAuth } from '../../context/AuthContext';
import { Toggle } from '../ui/Toggle';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { toast } from 'sonner';

interface PreferencesSectionProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  darkMode = false,
  onToggleDarkMode,
  currentLanguage = 'English (Nigeria)',
  onLanguageChange,
}) => {
  const { updateUser } = useAuth();


  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const languageSheet = useSlideUpSheet(showLanguageModal, () => setShowLanguageModal(false));

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
    toast.success(`Language changed to ${lang}`);
    try {
      await updateUser({ preferred_language: languageCode(lang) });
    } catch {
      // Local language change already applied; syncing it to the account is best-effort.
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        title="Preferences"
        subtitle="Language, display mode, and notification channels."
      />

      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {/* Push Notifications */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Push Notifications
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold">Coming soon</span>
            </p>
            <p className="text-[11px] text-slate-500">Real-time alerts for booking acceptances & chats.</p>
          </div>
          <Toggle checked={false} label="Push notifications (coming soon)" onChange={() => undefined} disabled />
        </div>

        {/* Email Alerts */}
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Email Summaries
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold">Coming soon</span>
            </p>
            <p className="text-[11px] text-slate-500">Payment receipts and job completion reports.</p>
          </div>
          <Toggle checked={false} label="Email summaries (coming soon)" onChange={() => undefined} disabled />
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
      {languageSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${languageSheet.backdropAnimationClasses}`}
          onClick={() => setShowLanguageModal(false)}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${languageSheet.sheetAnimationClasses}`}
            style={languageSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={languageSheet.dragHandleProps} />
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
    </Card>
  );
};
