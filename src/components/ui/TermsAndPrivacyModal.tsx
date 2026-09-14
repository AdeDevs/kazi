import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, ArrowLeft, Lock, Scale, 
  HelpCircle, CheckCircle2, ChevronRight, AlertTriangle, 
  Building2, ExternalLink
} from 'lucide-react';

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'escrow' | 'privacy';
}

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-brand-orange-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-navy-900 dark:text-zinc-100 tracking-tight">
                Terms of Service
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                KaziHub Platform Terms & Operating Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div>
            <span className="text-[11px] font-bold text-brand-orange-600 dark:text-brand-orange-400 uppercase tracking-wider block mb-1">
              Agreement Overview
            </span>
            <h3 className="text-xl font-black text-navy-900 dark:text-zinc-100">
              KaziHub Nigeria Terms of Service
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Last Updated: August 2026</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
            <h4 className="font-bold text-navy-900 dark:text-zinc-100">1. Platform Scope & Parties</h4>
            <p>
              KaziHub Nigeria operates a verified skilled trades marketplace facilitating secure transactions between independent clients ("Clients") and certified technicians/craftsmen ("Artisans" or "Pros"). KaziHub serves as an intermediary protocol ensuring identity verification, milestone tracking, and dispute-moderated settlements.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">2. Account Registration & Role Separation</h4>
            <p>
              Users must register either as a <strong>Client</strong> (to discover, book, and fund trade jobs) or as an <strong>Artisan</strong> (to submit bids, publish voice/video work portfolios, and receive direct bank disbursements). All users must provide authentic details, including a valid Nigerian phone number and National Identification Number (NIN) for verification.
            </p>

            <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">3. Artisan Standards & Verification</h4>
            <p>
              Artisans registered on KaziHub must undergo identity vetting, trade credential review, and community peer evaluation. Artisans agree to maintain professional craftsmanship, supply honest labor and material breakdown estimates, arrive punctually at job locations across Nigeria, and adhere to safety standards.
            </p>

            <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">4. Off-Platform Circumvention Prohibited</h4>
            <p>
              To protect both parties with escrow insurance and guaranteed arbitration, Clients and Artisans strictly agree not to transact off-platform or bypass the KaziHub escrow engine for any job initiated through KaziHub discovery channels.
            </p>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between shrink-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            By using KaziHub, you agree to comply with all platform protocols.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
