import React, { useEffect, useState } from 'react';
import { HeroScrim } from './ui/HeroScrim';
import { SlideTabPanel, useSlidingIndicator, useTabDirection } from './ui/SlidingTabs';
import { X, Star, MapPin, Briefcase, Award, MessageSquare, Calendar, Clock } from 'lucide-react';
import { Professional, ServiceItem, Gig } from '../types';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { getGigsByProfessional } from '../lib/mockGigsStore';
import { listPublicGigs, gigFromResponse } from '../lib/gigsApi';
import { formatCurrency } from '../utils';


interface ProfessionalProfileModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: (pro: Professional, preselectedService?: string) => void;
  onOpenChat: (pro: Professional) => void;
  /** Starts buying one of this artisan's gigs (real artisans only). */
  onBuyGig?: (gig: Gig, pro: Professional) => void;
  onAddReview?: (proId: string, rating: number, comment: string) => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  professional: professionalProp,
  isOpen,
  onClose,
  onOpenBooking,
  onOpenChat,
  onBuyGig,
  onAddReview
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'gigs' | 'reviews'>('about');
  const profileTabs = useSlidingIndicator(activeTab);
  const tabDirection = useTabDirection(activeTab, ['about', 'gigs', 'reviews'] as const);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);


  // Keeps the last real professional around while closing -- the parent typically clears its
  // `professional` state in the same tick it flips `isOpen` to false, but this component stays
  // mounted a little longer than that to play its exit animation, so it needs its own copy to
  // render from during that window instead of going blank.
  const [cachedProfessional, setCachedProfessional] = useState(professionalProp);
  useEffect(() => {
    if (professionalProp) setCachedProfessional(professionalProp);
  }, [professionalProp]);

  // Real artisans' gigs come from the public GET /gigs/ (it can't filter by artisan, so filter here);
  // the sample artisans keep their locally stored sample gigs.
  useEffect(() => {
    if (!professionalProp) return;
    if (!professionalProp.user_id) {
      setGigs(getGigsByProfessional(professionalProp.id));
      return;
    }
    let cancelled = false;
    listPublicGigs()
      .then(list => {
        if (!cancelled) setGigs(list.filter(g => g.artisan_profile_id === professionalProp.id && g.is_active).map(gigFromResponse));
      })
      .catch(() => { if (!cancelled) setGigs([]); });
    return () => { cancelled = true; };
  }, [professionalProp]);

  const sheet = useSlideUpSheet(isOpen, onClose);

  if (!sheet.shouldRender || !cachedProfessional) return null;
  const professional = cachedProfessional;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md ${sheet.backdropAnimationClasses}`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 relative flex flex-col ${sheet.sheetAnimationClasses}`}
        style={sheet.dragStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle -- small visible pill, generous invisible grab zone around it,
            matching ConfirmationModal's handle exactly so every sheet in the app behaves the same.
            Bespoke (not <SheetDragHandle>) because it sits over the photo hero, not a padded card. */}
        <div
          className="sm:hidden absolute top-0 left-0 right-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none z-20"
          {...sheet.dragHandleProps}
        >
          <div className="w-12 h-1.5 bg-white/60 rounded-full mx-auto" aria-hidden="true" />
        </div>


        {/* Cover / Header section. Desktop keeps the banner + overlapping-avatar treatment;
            mobile switches to a full-bleed portrait hero instead -- banner-plus-small-avatar
            wastes vertical space on a phone, and every professional has a real photo to show. */}

        {/* Mobile: full-bleed portrait hero */}
        <div className="sm:hidden relative h-[200px] shrink-0 rounded-t-3xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAvatarLightbox(true)}
            className="absolute inset-0 w-full h-full cursor-pointer"
            title="View photo"
            aria-label="View photo full-screen"
          >
            <img
              src={professional.profile_picture}
              alt={professional.name}
              className="w-full h-full object-cover"
            />
          </button>
          <HeroScrim src={professional.profile_picture} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
            title="Close Profile"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
          {professional.is_available_now && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              Available Now
            </span>
          )}
          <div className="absolute left-4 right-4 bottom-3.5 text-white">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h2 className="text-lg font-bold tracking-tight truncate">{professional.name}</h2>
              {professional.is_verified && <VerifiedBadge title="Verified Pro" />}
            </div>
            <p className="text-xs font-semibold text-white/85 flex items-center gap-1">
              <span>{professional.category}</span>
              <span>&middot;</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              <span>{professional.rating_average} ({professional.review_count})</span>
            </p>
          </div>
        </div>
        <div className="sm:hidden px-4 pt-2 pb-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> <span className="truncate max-w-[150px]">{professional.neighborhood}, {professional.state}</span>
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
              <Briefcase className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> {professional.completed_jobs_count} jobs
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
              <Award className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> {professional.years_of_experience} yrs exp
            </span>
            {professional.response_time && (
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 shrink-0" /> Replies {professional.response_time.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Desktop: banner + overlapping avatar */}
        <div className="hidden sm:block relative bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 h-[150px] rounded-t-2xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
            title="Close Profile"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>
          {professional.is_available_now && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              Available Now
            </span>
          )}
        </div>

        {/* relative: the banner above is `relative` (positioned), so without this the avatar --
            a non-positioned sibling -- would paint *behind* it despite coming later in the DOM,
            cutting off the top of the photo where it overlaps the banner. */}
        <div className="hidden sm:block px-6 pb-1 flow-root relative">
          <div className="flex items-end justify-start -mt-14 mb-3">
            <button
              type="button"
              onClick={() => setShowAvatarLightbox(true)}
              className="cursor-pointer rounded-2xl"
              title="View photo"
              aria-label="View photo full-screen"
            >
              <img
                src={professional.profile_picture}
                alt={professional.name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
              />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">{professional.name}</h2>
              {professional.is_verified && <VerifiedBadge label="Verified Pro" />}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-3">{professional.category}</p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> <span className="truncate max-w-[150px]">{professional.neighborhood}, {professional.state}</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" /> <strong className="text-slate-900 dark:text-slate-100">{professional.rating_average}</strong> ({professional.review_count} reviews)
              </span>
              <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
                <Briefcase className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" /> {professional.completed_jobs_count} jobs
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Horizontal Scrollable on Mobile */}
        <div ref={profileTabs.listRef} role="tablist" className="relative flex shrink-0 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 bg-slate-50 dark:bg-slate-950 overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap">
          <span aria-hidden="true" style={profileTabs.indicatorStyle} className="tab-indicator bottom-0 h-0.5 rounded-full bg-navy-800 dark:bg-navy-400" />
          <button
            data-tab="about"
            role="tab"
            aria-selected={activeTab === 'about'}
            onClick={() => setActiveTab('about')}
            className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'about'
                ? 'border-transparent text-navy-800 dark:text-navy-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            About
          </button>
          {gigs.length > 0 && (
            <button
              data-tab="gigs"
            role="tab"
            aria-selected={activeTab === 'gigs'}
            onClick={() => setActiveTab('gigs')}
              className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
                activeTab === 'gigs'
                  ? 'border-transparent text-navy-800 dark:text-navy-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Gigs ({gigs.length})
            </button>
          )}
          <button
            data-tab="reviews"
            role="tab"
            aria-selected={activeTab === 'reviews'}
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'reviews'
                ? 'border-transparent text-navy-800 dark:text-navy-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Reviews ({professional.reviews.length})
          </button>
        </div>

        {/* Tab Content -- the only scrollable region in the sheet. min-h-0 is load-bearing here:
            without it, a flex-1 child defaults to a min-height of its own content size and refuses
            to shrink, which pushed the *whole sheet* taller than its max-h and made the header and
            footer scroll away with it instead of staying pinned. */}
        <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto">
          <SlideTabPanel panelKey={activeTab} direction={tabDirection}>
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Professional Bio</h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{professional.bio}</p>
              </div>

              <div className={`grid ${professional.response_time ? 'grid-cols-3' : 'grid-cols-2'} gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800`}>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Experience</p>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{professional.years_of_experience} Years</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Category</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">{professional.category}</p>
                </div>
                {/* Only the artisan's own stated response time -- it used to be a hard-coded "~15 mins". */}
                {professional.response_time && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Response Time</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">{professional.response_time}</p>
                  </div>
                )}
              </div>

              {/* Service Areas */}
              {professional.areasServed && professional.areasServed.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Service Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {professional.areasServed.map((area, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {area}
                      </span>
                    ))}
                    {professional.serviceRadiusKm && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-orange-500/10 border border-brand-orange-500/20 text-xs font-bold text-brand-orange-600 dark:text-brand-orange-400">
                        Up to {professional.serviceRadiusKm}km away
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Service Offerings */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Service Offerings
                </h4>

                {!professional.services?.length && (
                  <p className="text-xs text-slate-500">No services listed yet. Message {professional.name.split(' ')[0]} to ask for a quote.</p>
                )}
                <div className="space-y-2.5">
                  {(professional.services || []).map((svc: ServiceItem) => (
                    <div
                      key={svc.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-navy-500/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {svc.name}
                          </span>
                          {svc.popular && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {svc.description}
                        </p>
                        {svc.duration_estimate && (
                          <span className="text-[10px] text-slate-400 block">
                            Est. duration: {svc.duration_estimate}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => onOpenBooking(professional, svc.name)}
                          className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-900 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Request Service
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>



              {/* Artisan Portfolio Showcase Directly on Profile */}
              <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Portfolio & Past Projects ({professional.portfolio.length})
                  </h4>
                </div>
                {professional.portfolio.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No portfolio items uploaded yet.</p>
                ) : (
                  <div className="flex sm:grid sm:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible overscroll-x-contain no-scrollbar snap-x snap-mandatory scroll-pl-3.5 sm:scroll-pl-0 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
                    {professional.portfolio.map((item) => (
                      <div key={item.id} className="shrink-0 w-56 snap-start sm:w-auto sm:shrink border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col">
                        <img src={item.image_url} alt={item.title} className="w-full aspect-video object-cover" />
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">{item.title}</h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">{item.description}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/40">Completed: {item.date_completed}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gigs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gigs.map((gig) => (
                <div key={gig.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs p-4 flex flex-col">
                  <span className="self-start px-2.5 py-1 bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300 rounded-lg text-[10px] font-bold border border-navy-100/50 dark:border-navy-800/50 mb-2">
                    {gig.category}
                  </span>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2">{gig.title}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2 flex-1">{gig.description}</p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Starting at</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(gig.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Delivery</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{gig.delivery_time_days} Days</p>
                    </div>
                  </div>
                  <div className={`mt-3 grid gap-2 ${onBuyGig && professional.user_id ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      type="button"
                      onClick={() => onOpenChat(professional)}
                      className="min-h-10 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Enquire</span>
                    </button>
                    {onBuyGig && professional.user_id && (
                      <button
                        type="button"
                        onClick={() => onBuyGig(gig, professional)}
                        className="min-h-10 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Buy This Gig
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviewSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                  <span>{reviewSuccessMsg}</span>
                  <button onClick={() => setReviewSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">✕</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Client Reviews ({professional.reviews.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Average rating_average: ★ {professional.rating_average.toFixed(1)} / 5.0</p>
                </div>
                {!showWriteReview && (
                  <button
                    type="button"
                    onClick={() => setShowWriteReview(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all self-stretch sm:self-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span>Leave Review</span>
                  </button>
                )}
              </div>

              {/* Write Review Form */}
              {showWriteReview && (
                <div className="p-4 sm:p-5 rounded-2xl bg-navy-800/5 dark:bg-slate-800/80 border border-navy-800/20 dark:border-slate-700 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500 flex-shrink-0" /> Rate {professional.name}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowWriteReview(false)}
                      className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Star Rating selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rating Stars</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (newHoverRating || newRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setNewHoverRating(star)}
                            onMouseLeave={() => setNewHoverRating(0)}
                            onClick={() => setNewRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${active ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
                          </button>
                        );
                      })}
                      <span className="text-xs font-bold text-navy-800 dark:text-navy-400 ml-2">
                        {newRating === 5 ? '5.0 (Excellent)' : `${newRating}.0`}
                      </span>
                    </div>
                  </div>

                  {/* Quick Compliments */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Punctual & On Time', 'High Craftsmanship', 'Clean Work Area', 'Fair & Honest Pricing', 'Polite & Professional'].map(tag => {
                        const isSel = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSel) setSelectedTags(selectedTags.filter(t => t !== tag));
                              else setSelectedTags([...selectedTags, tag]);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                              isSel ? 'bg-navy-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Feedback Details</label>
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience working with this professional..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWriteReview(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const finalComment = newComment || (selectedTags.length > 0 ? selectedTags.join(' • ') : 'Great professional service!');
                        if (onAddReview) {
                          onAddReview(professional.id, newRating, finalComment);
                        }
                        setReviewSuccessMsg(`Thank you! Your ${newRating}-star review for ${professional.name} was published.`);
                        setShowWriteReview(false);
                        setNewComment('');
                        setSelectedTags([]);
                      }}
                      className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                    >
                      Publish Review
                    </button>
                  </div>
                </div>
              )}

              {professional.reviews.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 py-12">No reviews yet.</p>
              ) : (
                professional.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-800 dark:bg-navy-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {rev.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{rev.customerName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 self-start sm:self-auto">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500 flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
          </SlideTabPanel>
        </div>

        {/* Footer actions -- square on mobile (flush with the bottom-sheet's screen edge),
            rounded to match the dialog's own corners on desktop. */}
        <div className="shrink-0 px-4 sm:px-8 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end sm:rounded-b-2xl">
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenChat(professional);
              }}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span>Message</span>
            </button>
            <button
              onClick={() => onOpenBooking(professional)}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Request Service</span>
            </button>
          </div>
        </div>


      </div>

      {/* Full-screen dismissible avatar view */}
      {showAvatarLightbox && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowAvatarLightbox(false);
          }}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={professional.profile_picture} alt={professional.name} className="w-full h-full object-contain" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAvatarLightbox(false);
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
