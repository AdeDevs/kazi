import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { art } from '../assets/landing';

const display = "font-['Bricolage_Grotesque',sans-serif] font-extrabold";

/**
 * "This page no dey." Uses the public pages' palette (cream, ink navy) in both themes. Standalone
 * for unknown URLs; `embedded` drops its own header when it's shown inside the app's layout.
 */
export const NotFound: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { user } = useAuth();
  const homePath = user ? '/home' : '/';

  return (
    <div
      className={`kh-auth flex flex-col font-['Plus_Jakarta_Sans',system-ui,sans-serif] ${embedded ? 'min-h-full rounded-3xl' : 'min-h-dvh'}`}
      style={{ background: '#FFF6EC', color: '#0B1B3A' }}
    >
      {!embedded && (
        <header className="h-16 lg:h-24 shrink-0 px-5 lg:px-[72px] flex items-center">
          <Link to={homePath} aria-label="KaziHub home" className={`${display} text-2xl lg:text-[32px] tracking-[-0.04em]`}>
            <span style={{ color: '#3B35C9' }}>Kazi</span><span style={{ color: '#FF6A2B' }}>Hub</span>
          </Link>
        </header>
      )}
      <main className="flex-1 px-5 lg:px-6 pt-4 pb-12 lg:pb-20 flex flex-col items-center justify-center text-center gap-4 lg:gap-5">
        <img
          src={art('not-found')}
          alt="An artisan shining a torch at a signpost that reads 404, with another sign pointing home"
          className="kh-fade block w-full max-w-[350px] lg:max-w-[500px] h-auto"
          style={{ animationDuration: '700ms' }}
        />
        <p className="text-sm font-extrabold uppercase tracking-[0.08em]">Error 404</p>
        <h1 className={`kh-rise ${display} text-[44px] lg:text-[72px] leading-[0.9] tracking-[-0.055em]`} style={{ animationDuration: '700ms' }}>
          This page no dey.
        </h1>
        <p className="max-w-[320px] lg:max-w-[460px] text-base lg:text-lg leading-normal font-medium" style={{ color: '#3A4458' }}>
          We couldn’t find the page you’re looking for. It may have moved, or the link is broken.
        </p>
        <Link
          to={homePath}
          className="kh-btn mt-2 self-stretch sm:self-auto px-7 py-[17px] lg:py-[18px] rounded-2xl text-[17px] font-extrabold"
        >
          Back to home <span className="kh-arrow" aria-hidden="true">→</span>
        </Link>
      </main>
    </div>
  );
};
