import React from 'react';

// The single source of truth for card padding across the app. Every card-shaped container
// should use <Card> rather than hand-writing these classes, so padding can never drift between
// pages again -- change it once here and every card follows.
export const CARD_PADDING = 'p-[10px] sm:p-[15px]';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** 'danger' is for destructive/warning sections (e.g. account lifecycle actions). */
  tone?: 'default' | 'danger';
  as?: 'div' | 'button';
  onClick?: () => void;
  /** Lets a CTA elsewhere in the app scroll/anchor straight to this card via getElementById. */
  id?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', tone = 'default', as = 'div', onClick, id }) => {
  const toneClasses =
    tone === 'danger'
      ? 'border-rose-200 dark:border-rose-950/40'
      : 'border-slate-200 dark:border-slate-800';

  const classes = `bg-white dark:bg-slate-900 rounded-2xl ${CARD_PADDING} border ${toneClasses} shadow-xs ${className}`;

  if (as === 'button') {
    return (
      <button type="button" id={id} className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <div id={id} className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

/** A plain title + subtitle header, no decorative icon -- keep every card header this way. */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, badge }) => (
  <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{title}</h3>
        {badge}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 truncate sm:whitespace-normal">{subtitle}</p>}
    </div>
    {action}
  </div>
);
