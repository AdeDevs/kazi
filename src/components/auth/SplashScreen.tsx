import React, { useEffect, useState } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 600);
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      
      <div className="flex flex-col items-center space-y-8 relative z-10 p-6 text-center">
        {/* Simplified Logo */}
        <div className="w-24 h-24 rounded-3xl bg-navy-800 text-white flex items-center justify-center shadow-lg">
          <Wrench className="w-10 h-10 text-white" />
        </div>
        
        {/* Clean Typographic Hierarchy */}
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">
            Kazi<span className="text-brand-orange-500">Hub</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
            Verified Professional Services
          </p>
        </div>
        
        {/* Simplified Loading Indicator */}
        <div className="w-24 h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-navy-800 dark:bg-blue-500 animate-[pulse_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

