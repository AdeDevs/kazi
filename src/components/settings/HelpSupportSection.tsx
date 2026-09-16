import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, PhoneCall, X, Send } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';

interface HelpSupportSectionProps {
  triggerToast: (msg: string) => void;
}

const FAQS = [
  {
    q: 'How does KaziHub secure escrow payments?',
    a: 'When you book a service, your funds are securely held in the KaziHub Escrow Vault. Funds are only released to the artisan once you confirm completion or after our 4-day inspection window.'
  },
  {
    q: 'What happens if an artisan does not arrive?',
    a: 'You can cancel with zero penalty or reassign the request to another verified pro nearby. Our support concierge is also available 24/7 to resolve disputes.'
  },
  {
    q: 'How are artisans verified?',
    a: 'All KaziHub artisans undergo National Identity verification, trade certification audit, and local neighborhood endorsement checks before receiving a Verified Pro badge.'
  },
  {
    q: 'Can I change my service address?',
    a: 'Yes, update your primary location under Personal Information, or specify custom delivery coordinates during booking.'
  }
];

export const HelpSupportSection: React.FC<HelpSupportSectionProps> = ({ triggerToast }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [supportSubject, setSupportSubject] = useState('General Inquiry');
  const [supportMessage, setSupportMessage] = useState('');

  const handleContactSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    triggerToast('Support request submitted! Ticket #KZ-' + Math.floor(1000 + Math.random() * 9000) + ' created.');
    setShowContactSupport(false);
    setSupportMessage('');
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        title="Help & Support"
        subtitle="Help center FAQs, live concierge, and escalation hotlines."
      />

      {/* FAQs Accordion */}
      <div className="space-y-2">
        {FAQS.map((faq, idx) => {
          const isExp = expandedFaq === idx;
          return (
            <div key={idx} className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setExpandedFaq(isExp ? null : idx)}
                className="w-full p-3 text-left font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />}
              </button>
              {isExp && (
                <div className="p-3 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/40 dark:border-slate-800 leading-relaxed bg-white dark:bg-slate-900">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setShowContactSupport(true)}
          className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Contact Support Concierge</span>
        </button>
        <a
          href="tel:+2348000005294"
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Emergency Toll-Free Helpline</span>
        </a>
      </div>

      {/* CONTACT SUPPORT MODAL */}
      {showContactSupport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowContactSupport(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowContactSupport(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">KaziHub Support Concierge</h3>
              <p className="text-xs text-slate-500">Send an inquiry or raise an issue regarding your bookings.</p>
            </div>

            <form onSubmit={handleContactSupportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Booking & Artisan Issue">Booking & Artisan Issue</option>
                  <option value="Payment & Escrow Question">Payment & Escrow Question</option>
                  <option value="Account & Security">Account & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your request or issue with full details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactSupport(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
