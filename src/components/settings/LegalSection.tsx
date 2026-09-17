import React, { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { SheetDragHandle } from '../ui/SheetDragHandle';
import { useSlideUpSheet } from '../../hooks/useSlideUpSheet';

export const LegalSection: React.FC = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const termsSheet = useSlideUpSheet(showTermsModal, () => setShowTermsModal(false));
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const privacySheet = useSlideUpSheet(showPrivacyModal, () => setShowPrivacyModal(false));

  return (
    <Card className="space-y-4">
      <CardHeader
        title="Legal & Terms"
        subtitle="Terms of service, payment protections, and data privacy."
      />

      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Terms of Service</p>
            <p className="text-[11px] text-slate-500">Rules of the platform and service level guarantees.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-navy-800 dark:text-navy-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="py-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">Privacy Policy</p>
            <p className="text-[11px] text-slate-500">How your personal details and location data are handled.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-navy-800 dark:text-navy-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* TERMS OF SERVICE MODAL */}
      {termsSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${termsSheet.backdropAnimationClasses}`}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl p-5 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto ${termsSheet.sheetAnimationClasses}`}
            style={termsSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={termsSheet.dragHandleProps} />
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">KaziHub Terms of Service</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>Welcome to KaziHub. By using our marketplace to book artisans, you agree to our escrow protections and dispute resolution process.</p>
              <p><strong>1. Escrow Protection:</strong> All booking deposits remain locked until customer sign-off or resolution of inspected milestones.</p>
              <p><strong>2. Artisan Conduct:</strong> Artisans must maintain verified credentials, adhere to scheduled timelines, and respect client premises.</p>
              <p><strong>3. Cancellation Policy:</strong> Flexible cancellations are permitted up to 2 hours prior to scheduled arrival with zero penalty.</p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {privacySheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${privacySheet.backdropAnimationClasses}`}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl p-5 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto ${privacySheet.sheetAnimationClasses}`}
            style={privacySheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={privacySheet.dragHandleProps} />
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Privacy Policy</h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>We protect your location and personal contact data with strong encryption, in line with NDPR and GDPR data protection rules.</p>
              <p>• Your phone number is only revealed to an artisan after an escrow booking is confirmed.</p>
              <p>• We never sell or share customer contact records with third-party advertisers.</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
