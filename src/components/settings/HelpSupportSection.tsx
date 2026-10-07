import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, PhoneCall, X, Send } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { CustomDropdown } from '../CustomDropdown';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useAccountFrozen } from '../../hooks/useAccountFrozen';
import { SupportTicket, createSupportTicket, listMySupportTickets } from '../../lib/supportApi';

const MESSAGE_MAX = 5000;
const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const statusLabel = (status: string) => status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const FAQS = [
  {
    q: 'How does KaziHub secure payments?',
    a: 'When you book a service, your funds are held securely by KaziHub. They\'re only released to the artisan once you confirm the job is done, or after our 4-day inspection window.'
  },
  {
    q: 'What happens if an artisan does not arrive?',
    a: 'You can cancel the booking from your Bookings page and book another artisan. If you’d already paid into escrow, the cancellation records a refund. You can also contact our support team for help.'
  },
  {
    q: 'How are artisans verified?',
    a: 'Artisans submit a government ID (such as a NIN slip, driver’s licence or voter’s card) and a live selfie. Our team reviews both before the artisan gets a Verified badge.'
  },
  {
    q: 'Can I change my service address?',
    a: 'Yes, update your primary location under Personal Information, or specify custom delivery coordinates during booking.'
  }
];

export const HelpSupportSection: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [supportSubject, setSupportSubject] = useState('General Inquiry');
  const [supportMessage, setSupportMessage] = useState('');
  const closeContactSupport = () => {
    setShowContactSupport(false);
    setSupportSubject('General Inquiry');
    setSupportMessage('');
  };
  const isContactFormDirty = Boolean(supportMessage.trim()) || supportSubject !== 'General Inquiry';
  const contactGuard = useUnsavedChangesGuard(isContactFormDirty, closeContactSupport);
  const contactSheet = useSlideUpSheet(showContactSupport, contactGuard.requestClose);

  const { isDemo } = useAuth();
  const { blockIfFrozen } = useAccountFrozen();
  const [isSending, setIsSending] = useState(false);
  // null = demo or not loaded.
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const loadTickets = useCallback(() => {
    listMySupportTickets().then(setTickets).catch(() => setTickets(null));
  }, []);
  useEffect(() => { if (!isDemo) loadTickets(); }, [isDemo, loadTickets]);

  const handleContactSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setIsSending(true);
    try {
      const ticket = await createSupportTicket({ subject: supportSubject, message: supportMessage.trim() });
      toast.success(`Request sent. Your ticket number is ${ticket.ticket_number}.`);
      setTickets((prev) => [ticket, ...(prev ?? [])]);
      closeContactSupport();
    } catch (err: any) {
      toast.error(err?.message || 'Could not send your request. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        title="Help & Support"
        subtitle="Answers to common questions, plus ways to reach us."
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
          onClick={() => { if (!blockIfFrozen()) setShowContactSupport(true); }}
          disabled={isDemo}
          className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Contact Support</span>
        </button>
        <a
          href="tel:+2348000005294"
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Call Us (Toll-Free)</span>
        </a>
      </div>

      {tickets && tickets.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Your Requests</p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {tickets.slice(0, 5).map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{t.subject}</p>
                  <p className="text-[11px] text-slate-500">{t.ticket_number} · {dateFormat.format(new Date(t.created_at))}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold shrink-0">{statusLabel(t.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      {contactSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${contactSheet.backdropAnimationClasses}`}
          onClick={contactGuard.requestClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${contactSheet.sheetAnimationClasses}`}
            style={contactSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={contactSheet.dragHandleProps} />
            <button
              onClick={contactGuard.requestClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Contact Support</h3>
              <p className="text-xs text-slate-500">Send an inquiry or raise an issue regarding your bookings.</p>
            </div>

            <form onSubmit={handleContactSupportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <CustomDropdown
                  value={supportSubject}
                  onChange={(val) => setSupportSubject(val)}
                  options={[
                    { value: 'General Inquiry', label: 'General Inquiry' },
                    { value: 'Booking & Artisan Issue', label: 'Booking & Artisan Issue' },
                    { value: 'Payment & Escrow Question', label: 'Payment & Escrow Question' },
                    { value: 'Account & Security', label: 'Account & Security' }
                  ]}
                  className="w-full"
                  buttonClassName="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={4}
                  value={supportMessage}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setSupportMessage(e.target.value.slice(0, MESSAGE_MAX))}
                  placeholder="Describe your request or issue with full details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={contactGuard.requestClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !supportMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-brand-orange-500 hover:text-navy-950 disabled:hover:bg-navy-800 disabled:hover:text-white disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending…' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={contactGuard.showDiscardConfirm}
        onClose={() => contactGuard.setShowDiscardConfirm(false)}
        onConfirm={contactGuard.confirmDiscard}
        title="Discard Unsaved Changes?"
        description="Your support request hasn't been submitted yet. Closing now will discard it."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
      />
    </Card>
  );
};
