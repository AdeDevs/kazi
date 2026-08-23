import React, { useState } from 'react';
import { X, Star, ShieldCheck, MapPin, Briefcase, Award, Phone, Mail, CheckCircle2, MessageSquare, Calendar, AlertCircle, ShieldAlert, Check, Tag } from 'lucide-react';
import { Professional, ServiceItem } from '../types';


interface ProfessionalProfileModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: (pro: Professional, preselectedService?: string) => void;
  onOpenChat: (pro: Professional) => void;
  onAddReview?: (proId: string, rating: number, comment: string) => void;
}

export const ProfessionalProfileModal: React.FC<ProfessionalProfileModalProps> = ({
  professional,
  isOpen,
  onClose,
  onOpenBooking,
  onOpenChat,
  onAddReview
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Complaint modal state
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintReason, setComplaintReason] = useState('Unpunctual / Delayed Arrival (Lateness)');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [complaintSubmittedTicket, setComplaintSubmittedTicket] = useState<{ id: string; reason: string } | null>(null);

  if (!isOpen || !professional) return null;

  const handleOpenRateForm = () => {
    setActiveTab('reviews');
    setShowWriteReview(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col">
        
        {/* Cover / Header section */}
        <div className="relative bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white p-4 sm:p-5 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-4 sm:mt-0">
            <div className="relative flex-shrink-0">
              <img
                src={professional.avatar}
                alt={professional.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 dark:border-slate-800/80 shadow-xl"
              />
              {professional.isAvailableNow && (
                <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow">
                  Available Now
                </span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap justify-center sm:justify-start gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">{professional.name}</h2>
                {professional.verified && (
                  <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full bg-navy-800/80 text-navy-200 text-[10px] sm:text-xs font-semibold border border-navy-700 self-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-navy-300" /> Verified Pro
                  </span>
                )}
              </div>
              <p className="text-navy-300 font-medium text-xs sm:text-sm mb-3 line-clamp-2">{professional.tagline}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] sm:text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" /> <span className="truncate max-w-[150px]">{professional.neighborhood}, {professional.location}</span>
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" /> <strong className="text-white">{professional.rating}</strong> ({professional.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                  <Briefcase className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" /> {professional.completedJobs} jobs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Horizontal Scrollable on Mobile */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 bg-slate-50 dark:bg-slate-950 overflow-x-auto scrollbar-none whitespace-nowrap flex-nowrap">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'about'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'portfolio'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Portfolio ({professional.portfolio.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex-shrink-0 ${
              activeTab === 'reviews'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Reviews ({professional.reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto">
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Professional Bio</h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{professional.bio}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Experience</p>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{professional.experienceYears} Years</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Category</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">{professional.category}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Response Time</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">~15 mins</p>
                </div>
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
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Service Offerings
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Escrow Protected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(professional.services && professional.services.length > 0
                    ? professional.services
                    : [{
                        id: `custom-srv-${professional.id}`,
                        name: `${professional.category} Standard Service`,
                        category: professional.category,
                        description: professional.tagline || professional.bio,
                        durationEstimate: '1-2 hrs'
                      }]
                  ).map((svc: ServiceItem) => (
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
                        {svc.durationEstimate && (
                          <span className="text-[10px] text-slate-400 block">
                            Est. duration: {svc.durationEstimate}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenBooking(professional, svc.name);
                          }}
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
                    Artisan Portfolio & Past Projects ({professional.portfolio.length})
                  </h4>
                </div>
                {professional.portfolio.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No portfolio items uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {professional.portfolio.map((item) => (
                      <div key={item.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col">
                        <img src={item.imageUrl} alt={item.title} className="w-full aspect-video sm:h-36 object-cover" />
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-1">{item.title}</h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/40">Completed: {item.dateCompleted}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-200">
              {professional.portfolio.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 dark:text-slate-500 py-12">No portfolio items uploaded yet.</p>
              ) : (
                professional.portfolio.map((item) => (
                  <div key={item.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col">
                    <img src={item.imageUrl} alt={item.title} className="w-full aspect-video sm:h-40 object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{item.title}</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{item.description}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/40">Completed on {item.dateCompleted}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviewSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span>{reviewSuccessMsg}</span>
                  <button onClick={() => setReviewSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">✕</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Client Reviews ({professional.reviews.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Average rating: ★ {professional.rating.toFixed(1)} / 5.0</p>
                </div>
                {!showWriteReview && (
                  <button
                    type="button"
                    onClick={() => setShowWriteReview(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all self-stretch sm:self-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span>Rate / Write Review</span>
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
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
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
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                      className="px-4 py-2 rounded-xl bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-extrabold text-xs shadow-xs cursor-pointer"
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
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-b-2xl">
          <div className="flex items-center justify-between sm:block">
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Response & Booking</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Ready to Help
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200/60">
                  Secure Escrow
                </span>
              </div>
            </div>
            {professional.isAvailableNow && (
              <span className="sm:hidden px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20">
                Online
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5">
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
              onClick={() => {
                onClose();
                onOpenBooking(professional);
              }}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Request Service</span>
            </button>
          </div>
        </div>

        {/* Complaint / Dispute Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowComplaintModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {complaintSubmittedTicket ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Dispute Ticket Logged</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ticket <strong>#{complaintSubmittedTicket.id}</strong> regarding <strong>{professional.name}</strong> has been logged with KaziHub Trust & Safety.
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100">Report Summary:</div>
                    <p>• <strong>Reason:</strong> {complaintSubmittedTicket.reason}</p>
                    <p>• <strong>Status:</strong> Escrow frozen / Under 2-hour Priority Review</p>
                  </div>
                  <button
                    onClick={() => setShowComplaintModal(false)}
                    className="w-full py-3 rounded-2xl bg-navy-800 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Report / File Complaint</h2>
                    <p className="text-xs text-slate-500">
                      Report an issue with <strong>{professional.name}</strong> ({professional.category})
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-navy-800/10 border border-navy-800/20 text-xs text-navy-800 dark:text-navy-300">
                    <p className="font-extrabold flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-navy-800 dark:text-navy-400" /> KaziHub Escrow Protection
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Filing a complaint immediately pauses escrow payouts and flags the artisan's profile for admin review.
                    </p>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nature of Concern</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Unpunctual / Delayed Arrival (Lateness)',
                        'Poor Quality Workmanship',
                        'Incomplete Job / Abandoned Work',
                        'Overcharging / Unexpected Fees',
                        'Unprofessional Conduct',
                        'Property Concern'
                      ].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setComplaintReason(r)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            complaintReason === r
                              ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Incident Details</label>
                    <textarea
                      rows={3}
                      value={complaintDetails}
                      onChange={(e) => setComplaintDetails(e.target.value)}
                      placeholder="Describe what happened (e.g., artisan arrived 3 hours late, work was left half-done)..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-hidden"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowComplaintModal(false)}
                      className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ticketId = `KAZI-DISPUTE-${Math.floor(1000 + Math.random() * 9000)}`;
                        setComplaintSubmittedTicket({ id: ticketId, reason: complaintReason });
                      }}
                      className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" /> Submit Complaint
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
