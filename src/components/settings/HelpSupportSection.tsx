import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, PhoneCall, X, Send } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { CustomDropdown } from '../CustomDropdown';
import { toast } from 'sonner';

const FAQS = [
  {
    q: 'How does KaziHub secure payments?',
    a: 'When you book a service, your funds are held securely by KaziHub. They\'re only released to the artisan once you confirm the job is done, or after our 4-day inspection window.'
  },
  {
    q: 'What happens if an artisan does not arrive?',
    a: 'You can cancel with zero penalty or reassign the request to another verified pro nearby. Our support team is also available 24/7 to help sort out any issues.'
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

  const handleContactSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    toast.success('Support request submitted! Ticket #KZ-' + Math.floor(1000 + Math.random() * 9000) + ' created.');
    setShowContactSupport(false);
    setSupportMessage('');
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
          onClick={() => setShowContactSupport(true)}
          className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
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
                  onChange={(e) => setSupportMessage(e.target.value)}
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
