import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homePath = user ? '/home' : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-5">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-900 text-white shadow-lg">
          <Compass className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-brand-orange-600 dark:text-brand-orange-400 tracking-wide uppercase">404</p>
          <h1 className="text-2xl font-black text-navy-900 dark:text-zinc-100">Page not found</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The page you're looking for doesn't exist, or may have moved. Let's get you back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            {user ? 'Back to KaziHub' : 'Go to Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
