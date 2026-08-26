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
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'escrow' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
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
                KaziHub Legal, Escrow & Privacy Framework
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Governing Artisan Operations, Client Protections & NDPR Compliance across Nigeria
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

        {/* Tab Navigation */}
        <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('terms')}
              className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-brand-orange-600 text-brand-orange-600 dark:text-brand-orange-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              1. Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'escrow'
                  ? 'border-brand-orange-600 text-brand-orange-600 dark:text-brand-orange-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              2. Escrow Settlement Rules
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-brand-orange-600 text-brand-orange-600 dark:text-brand-orange-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              3. Privacy Policy (NDPR)
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
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
                  KaziHub Nigeria operates a verified skilled trades marketplace facilitating secure transactions between independent clients ("Clients") and certified technicians/craftsmen ("Artisans" or "Pros"). KaziHub serves as an intermediary protocol ensuring identity verification, milestone tracking, and dispute-moderated escrow settlements.
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
          )}

          {/* ESCROW SETTLEMENT RULES */}
          {activeTab === 'escrow' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Financial Protection Protocol
                </span>
                <h3 className="text-xl font-black text-navy-900 dark:text-zinc-100">
                  Escrow Settlement & Payment Rules
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Governed by Nigerian Commercial Trust Guidelines</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1">
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-200">1. Deposit & Lock</div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Client deposits 100% of the agreed contract sum into the secure KaziHub escrow vault prior to work commencement.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
                  <div className="font-bold text-xs text-amber-900 dark:text-amber-200">2. Milestone Proof</div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Artisan completes the job and submits photo/video inspection proof directly on the KaziHub dashboard.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                  <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">3. Release & Payout</div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Client inspects and approves completion, triggering instant automated disbursement into the Artisan's Nigerian bank account.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">Dispute Arbitration</h4>
                <p>
                  If a job is contested (e.g. incomplete electrical wiring or substandard plumbing fittings), funds remain securely held in escrow. Both parties may submit photographic evidence to the KaziHub Arbitration Desk, which reviews complaints within 24–48 hours for fair resolution or partial refund allocations.
                </p>

                <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">Service Fees & Nigerian Banking Transfers</h4>
                <p>
                  All transactions are denominated in Nigerian Naira (₦). Disbursements are routed directly through licensed NIBSS-compatible Nigerian commercial banking switches.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Data Governance & Security
                </span>
                <h3 className="text-xl font-black text-navy-900 dark:text-zinc-100">
                  Privacy Policy & NDPR Compliance
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Nigeria Data Protection Regulation (NDPR) Standard</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">1. Data We Collect</h4>
                <p>
                  We collect user profile details (Name, Nigerian Phone Number, Email, State of Residence), KYC verification records (NIN numbers for artisan trust verification), voice portfolio recordings, chat logs between parties, and transaction records.
                </p>

                <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">2. Purpose of Processing</h4>
                <p>
                  Your information is processed strictly to provide geolocation artisan matching, facilitate phone verification via OTP, power voice-note portfolio playback, authenticate escrow funding, and prevent fraudulent claims.
                </p>

                <h4 className="font-bold text-navy-900 dark:text-zinc-100 text-sm">3. Security & Data Sovereignty</h4>
                <p>
                  We employ industry-grade encryption for passwords and sensitive tokens. Your credentials and National Identification records are never sold or shared with third-party advertising networks.
                </p>
              </div>
            </div>
          )}
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
