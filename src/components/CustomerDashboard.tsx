import React, { useState, useMemo, useEffect } from 'react';
import { takePendingSearch } from '../lib/pendingSearch';
import { Toggle } from './ui/Toggle';
import { Professional, Category, Booking, ChatMessage } from '../types';
import { CATEGORIES, CATEGORY_SERVICES_CATALOG } from '../mockData';
import { CustomDropdown } from './CustomDropdown';
import { CustomerMessages } from './CustomerMessages';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { bookingWhen, formatCurrency, isBookingArchived } from '../utils';
import { useAuth } from '../context/AuthContext';
import { professionalSearchScore } from '../lib/professionalSearch';
import { 
  Search, MapPin, Star, ShieldCheck, Sparkles, Filter, CheckCircle2, 
  Calendar, MessageSquare, Clock, ArrowRight, User, Bookmark, Bell, 
  Settings, Zap, Flame, Award, Tag, Eye, Heart, CheckCheck, CreditCard,
  RotateCcw, AlertCircle, ShieldAlert, X, Info, XCircle,
  Wrench, Briefcase, CheckCircle, FileText
} from 'lucide-react';

interface CustomerDashboardProps {
  professionals: Professional[];
  bookings: Booking[];
  messages?: ChatMessage[];
  onSendMessage?: (proId: string, text: string, mediaProps?: Partial<ChatMessage>) => void;
  onMarkAsRead?: (proId: string) => void;
  onSelectProForProfile: (pro: Professional) => void;
  onOpenBooking: (pro: Professional) => void;
  onOpenChat: (pro: Professional) => void;
  selectedCategoryFilter: Category | 'All';
  onSelectCategoryFilter: (cat: Category | 'All') => void;
  onCancelBooking: (bookingId: string) => void;
  onUpdateBookingStatus?: (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => void;
  onAcceptQuote?: (bookingId: string) => void;
  /** Opens a dispute on the backend; resolves to its ticket id, or null if it failed. */
  onDisputeBooking?: (bookingId: string, reason: string, details: string, evidencePhotos?: string[]) => Promise<string | null>;
  onAddReview?: (proId: string, rating: number, comment: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onDeactivateAccount?: () => void;
  customerNotifications?: any[];
  onUpdateCustomerNotifications?: (notifs: any[]) => void;
  initialMessageProId?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  savedProIds: string[];
  onToggleSavePro: (proId: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  professionals,
  bookings,
  messages = [],
  onSendMessage,
  onMarkAsRead,
  onSelectProForProfile,
  onOpenBooking,
  onOpenChat,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onCancelBooking,
  onUpdateBookingStatus,
  onAcceptQuote,
  onDisputeBooking,
  onAddReview,
  activeTab,
  onTabChange,
  onLogout,
  onDeleteAccount,
  onDeactivateAccount,
  customerNotifications,
  onUpdateCustomerNotifications,
  initialMessageProId,
  darkMode,
  onToggleDarkMode,
  savedProIds,
  onToggleSavePro
}) => {
  const { user } = useAuth();
  const clientGreetingName = user?.first_name || (user?.email ? user.email.split('@')[0] : 'Client');
  // Pre-filled from the landing page's hero search when a new client arrives through it.
  const [searchTerm, setSearchTerm] = useState(() => takePendingSearch());
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('All');
  const [searchMinRating, setSearchMinRating] = useState<number>(0);
  const [searchMinExperience, setSearchMinExperience] = useState<number>(0);
  const [searchAvailabilityOnly, setSearchAvailabilityOnly] = useState<boolean>(false);
  const [proViewFilter, setProViewFilter] = useState<'all' | 'available' | 'topRated'>('all');

  // Dedicated page-specific search & filter states for unified search banner pattern
  const [bookingsSearchTerm, setBookingsSearchTerm] = useState('');
  const [bookingsCategoryFilter, setBookingsCategoryFilter] = useState<Category | 'All'>('All');
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [savedCategoryFilter, setSavedCategoryFilter] = useState<Category | 'All'>('All');
  const [savedNeighborhoodFilter, setSavedNeighborhoodFilter] = useState<string>('All');
  const [notificationsSearchTerm, setNotificationsSearchTerm] = useState('');
  const [notificationsFilterType, setNotificationsFilterType] = useState<string>('All');

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Bookings state & modals
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'awaiting_completion' | 'completed' | 'issue_reported' | 'closed'>('all');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [rateToast, setRateToast] = useState<string | null>(null);

  const [complaintModalBooking, setComplaintModalBooking] = useState<Booking | null>(null);
  const [cachedComplaintBooking, setCachedComplaintBooking] = useState<Booking | null>(null);
  useEffect(() => {
    if (complaintModalBooking) setCachedComplaintBooking(complaintModalBooking);
  }, [complaintModalBooking]);
  const [complaintReason, setComplaintReason] = useState<string>('Poor Quality Workmanship');
  const [complaintDetails, setComplaintDetails] = useState<string>('');
  const [complaintPhoto1, setComplaintPhoto1] = useState<string>('');
  const [complaintPhoto2, setComplaintPhoto2] = useState<string>('');
  const [complaintStep, setComplaintStep] = useState<'form' | 'review'>('form');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const closeComplaintModal = () => {
    setComplaintModalBooking(null);
    setComplaintStep('form');
    setComplaintReason('Poor Quality Workmanship');
    setComplaintDetails('');
    setComplaintPhoto1('');
    setComplaintPhoto2('');
  };
  const isComplaintFormDirty = Boolean(
    complaintDetails.trim() || complaintPhoto1.trim() || complaintPhoto2.trim() ||
    complaintReason !== 'Poor Quality Workmanship'
  );
  const complaintGuard = useUnsavedChangesGuard(isComplaintFormDirty, closeComplaintModal);
  const complaintSheet = useSlideUpSheet(Boolean(complaintModalBooking), complaintGuard.requestClose);
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketId: string; bookingId: string; professionalName: string } | null>(null);
  const [cachedSubmittedTicket, setCachedSubmittedTicket] = useState<{ ticketId: string; bookingId: string; professionalName: string } | null>(null);
  useEffect(() => {
    if (submittedTicket) setCachedSubmittedTicket(submittedTicket);
  }, [submittedTicket]);
  const ticketSheet = useSlideUpSheet(Boolean(submittedTicket), () => setSubmittedTicket(null));

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Plumber leak repair',
    'Certified electrician',
    'AC maintenance',
    'Solar installation'
  ]);
  const [searchSuggestions] = useState<string[]>([
    'Plumbers',
    'Electricians',
    'AC Technicians',
    'CCTV Installers',
    'Solar Installers',
    'Carpenters',
    'Painters',
    'Mechanics'
  ]);


  const neighborhoods = ['All', 'Bodija GRA', 'Ring Road', 'Dugbe', 'UI / Agbowo', 'Samonda', 'Oluyole Estate', 'Challenge', 'Akobo', 'Iyaganku GRA', 'Ogbomoso', 'Oyo Town', 'Iseyin'];

  const toggleSavePro = (proId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSavePro(proId);
  };

  const searchTrimmed = searchTerm.trim().toLowerCase();

  const filteredProfessionals = professionals
    .map((pro) => ({ pro, score: searchTrimmed ? professionalSearchScore(pro, searchTrimmed) : 1 }))
    .filter(({ pro, score }) => {
      const matchesCategory = selectedCategoryFilter === 'All' || pro.category === selectedCategoryFilter;
      const matchesNeighborhood = selectedNeighborhood === 'All' || pro.neighborhood === selectedNeighborhood || pro.state === selectedNeighborhood;
      const matchesRating = pro.rating_average >= searchMinRating;
      const matchesExperience = pro.years_of_experience >= searchMinExperience;
      const matchesAvailability = !searchAvailabilityOnly || pro.is_available_now;
      return score > 0 && matchesCategory && matchesNeighborhood && matchesRating && matchesExperience && matchesAvailability;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ pro }) => pro);


  // Calculate catalog service matches for live auto-sync dropdown
  const matchingCatalogServices = searchTrimmed ? Object.entries(CATEGORY_SERVICES_CATALOG).flatMap(([cat, services]) => {
    return services
      .filter(srv =>
        srv.name.toLowerCase().includes(searchTrimmed) ||
        srv.description.toLowerCase().includes(searchTrimmed) ||
        cat.toLowerCase().includes(searchTrimmed)
      )
      .map(srv => ({ ...srv, category: cat as Category }));
  }) : [];

  // Per-category count matching current search term & filters
  const getCategoryMatchingCount = (cat: Category) => {
    return professionals.filter(pro => {
      if (pro.category !== cat) return false;
      const matchesNeighborhood = selectedNeighborhood === 'All' || pro.neighborhood === selectedNeighborhood || pro.state === selectedNeighborhood;
      if (!matchesNeighborhood) return false;

      return !searchTrimmed || professionalSearchScore(pro, searchTrimmed) > 0;
    }).length;
  };

  // Count total available/active professionals in each category
  const getCategoryTotalCount = (cat: Category) => {
    return professionals.filter(p => p.category === cat).length;
  };

  // Sort categories:
  // 1. If searching, prioritize search match count
  // 2. Otherwise prioritize categories with highest number of available/active professionals
  const displayCategories = useMemo(() => {
    return [...CATEGORIES].sort((a, b) => {
      if (searchTrimmed) {
        const matchA = getCategoryMatchingCount(a);
        const matchB = getCategoryMatchingCount(b);
        if (matchA > 0 && matchB === 0) return -1;
        if (matchB > 0 && matchA === 0) return 1;
        if (matchB !== matchA) return matchB - matchA;
      }
      const countA = professionals.filter(p => p.category === a).length;
      const countB = professionals.filter(p => p.category === b).length;
      return countB - countA;
    });
  }, [professionals, searchTrimmed, selectedNeighborhood]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electricians':
        return Zap;
      case 'Plumbers':
        return Wrench;
      case 'Carpenters':
        return Briefcase;
      case 'AC Technicians':
        return RotateCcw;
      case 'Appliance Repair Specialists':
        return Settings;
      case 'Mechanics':
        return Wrench;
      case 'Solar Installers':
        return Sparkles;
      case 'CCTV Installers':
        return ShieldCheck;
      case 'Painters':
        return Tag;
      case 'Welders':
        return Flame;
      case 'Cleaners':
        return Sparkles;
      case 'Tutors':
        return User;
      case 'Tailors':
        return Award;
      case 'Hair Stylists':
        return Heart;
      case 'Photographers':
        return Eye;
      case 'Event Professionals':
        return Calendar;
      default:
        return Wrench;
    }
  };

  const savedPros = professionals.filter(p => savedProIds.includes(p.id));

  const displayedPros = filteredProfessionals.filter(p => {
    if (proViewFilter === 'available') return p.is_available_now;
    if (proViewFilter === 'topRated') return p.rating_average >= 4.8;
    return true;
  });

  // ==========================================
  // RENDER PAGE BY activeTab
  // ==========================================

  if (activeTab === 'search') {
    return (
      <div className="w-full max-w-none space-y-5 animate-in fade-in duration-300">
        
        {/* Search Header Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-navy-800 text-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20 mb-2">
                <Search className="w-3.5 h-3.5" /> Professional Discovery Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Search Vetted Artisans & Specialists</h1>
              <p className="text-xs text-slate-300 mt-1">Filter by rating, distance, experience, and real-time availability across Ibadan, Ogbomoso, Oyo Town & Iseyin neighborhoods.</p>
            </div>
          </div>

          {/* Search Input & Neighborhood Selector */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search specialty, pro name, or service keyword (e.g. plumber, wire, AC)..."
                className="w-full pl-11 pr-12 py-3 rounded-2xl bg-navy-900 border border-navy-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}

              {/* Live Search Sync Floating Overlay */}
              {(isSearchFocused || searchTerm.trim() !== '') && (
                <div className="absolute z-40 left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100 space-y-3.5 animate-in fade-in duration-150">
                  {/* Category Sync Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-navy-800 dark:text-navy-400" /> Service Category Sync Matches
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Live Synced</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map(cat => {
                        const count = professionals.filter(p => p.category === cat).length;
                        const isMatch = searchTerm && (cat.toLowerCase().includes(searchTerm.toLowerCase()) || cat.toLowerCase().startsWith(searchTerm.toLowerCase().slice(0, 3)));
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              onSelectCategoryFilter(cat as any);
                              setIsSearchFocused(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              selectedCategoryFilter === cat
                                ? 'bg-navy-800 text-white border-navy-800 shadow-xs'
                                : isMatch
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span>{cat}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${selectedCategoryFilter === cat ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matching Verified Pros Quick Sync List */}
                  {searchTerm.trim() !== '' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Matching Verified Artisans ({filteredProfessionals.length})
                      </span>
                      {filteredProfessionals.slice(0, 3).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={p.profile_picture} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</h4>
                              <p className="text-[10px] text-slate-500 truncate">{p.category} • {p.neighborhood}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenBooking(p);
                              setIsSearchFocused(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-navy-800 hover:bg-navy-900 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
                          >
                            Book Now
                          </button>
                        </div>
                      ))}
                      {filteredProfessionals.length === 0 && (
                        <p className="text-xs text-slate-500 py-1 italic">No artisans directly matching "{searchTerm}". Try selecting a category above.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <CustomDropdown
              value={selectedNeighborhood}
              onChange={(val) => setSelectedNeighborhood(val)}
              icon={<MapPin className="w-4 h-4 text-slate-300" />}
              options={neighborhoods.map(n => ({ value: n, label: n === 'All' ? 'All Neighborhoods' : n }))}
              className="min-w-[210px]"
              buttonClassName="bg-navy-900 border border-navy-700 text-white hover:border-navy-600 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/50 transition-colors"
            />
          </div>

          {/* Recent Searches & Search Suggestions */}
          <div className="space-y-3 pt-2 border-t border-navy-700/80">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Recent Searches:</span>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchTerm(term)}
                  className="px-3 py-1 rounded-xl bg-navy-900 hover:bg-navy-950 text-slate-200 text-[11px] transition-colors cursor-pointer border border-navy-700/50"
                >
                  {term}
                </button>
              ))}
              <button
                onClick={() => setRecentSearches([])}
                className="text-[10px] text-slate-400 hover:text-white underline ml-2 cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Suggestions:</span>
              {searchSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectCategoryFilter(sug as any);
                    if (!recentSearches.includes(sug)) {
                      setRecentSearches([sug, ...recentSearches.slice(0, 3)]);
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Powerful Filters Toolbar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-navy-800 dark:text-navy-400" /> Powerful Filters ({filteredProfessionals.length} Pros Found)
            </h3>
            <button
              onClick={() => {
                setSearchMinRating(0);
                setSearchMinExperience(0);
                setSearchAvailabilityOnly(false);
                setSelectedNeighborhood('All');
                onSelectCategoryFilter('All');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            
            {/* Rating Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Minimum Rating</label>
              <CustomDropdown
                value={searchMinRating}
                onChange={(val) => setSearchMinRating(val)}
                options={[
                  { value: 0, label: 'Any Rating (★ All)' },
                  { value: 4.0, label: '4.0+ Stars ★' },
                  { value: 4.5, label: '4.5+ Stars ★' },
                  { value: 4.8, label: '4.8+ Stars ★ (Top Rated)' }
                ]}
                className="w-full"
                buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Experience Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Experience Level</label>
              <CustomDropdown
                value={searchMinExperience}
                onChange={(val) => setSearchMinExperience(val)}
                options={[
                  { value: 0, label: 'Any Experience' },
                  { value: 3, label: '3+ Years Experience' },
                  { value: 5, label: '5+ Years (Master)' },
                  { value: 10, label: '10+ Years (Veteran)' }
                ]}
                className="w-full"
                buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trade Category</label>
              <CustomDropdown
                value={selectedCategoryFilter}
                onChange={(val) => onSelectCategoryFilter(val as any)}
                options={[
                  { value: 'All', label: `All Categories (${professionals.length})` },
                  ...CATEGORIES.map(cat => ({ value: cat, label: cat }))
                ]}
                className="w-full"
                buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Availability Toggle */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Available Now Only</span>
                <Toggle checked={searchAvailabilityOnly} onChange={setSearchAvailabilityOnly} label="Available now only" />
              </div>
            </div>

          </div>
        </div>

        {/* Results View: Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.length === 0 ? (
            <div className="col-span-full py-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
              <Search className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No professionals match your filter criteria</h3>
              <p className="text-xs text-slate-500">Try loosening your rating, experience, or neighborhood filters.</p>
              <button
                onClick={() => {
                  setSearchMinRating(0);
                  setSearchMinExperience(0);
                  setSearchAvailabilityOnly(false);
                  setSelectedNeighborhood('All');
                  onSelectCategoryFilter('All');
                  setSearchTerm('');
                }}
                className="px-6 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredProfessionals.map(pro => (
              <div key={pro.id} onClick={() => onSelectProForProfile(pro)} className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between group cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={pro.profile_picture} alt={pro.name} className="w-14 h-14 rounded-2xl object-cover shadow-xs group-hover:scale-105 transition-transform" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-navy-800 dark:hover:text-navy-400 flex items-center gap-1.5">
                          <span>{pro.name}</span>
                          {pro.is_verified && <VerifiedBadge />}
                        </h3>
                        <p className="text-xs text-navy-800 dark:text-navy-400 font-semibold">{pro.category}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {pro.neighborhood}</p>
                      </div>
                    </div>
                    <button onClick={(e) => toggleSavePro(pro.id, e)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer" aria-label={savedProIds.includes(pro.id) ? "Remove from saved" : "Save professional"}>
                      <Bookmark className={`w-4 h-4 ${savedProIds.includes(pro.id) ? 'fill-navy-800 text-navy-800 dark:fill-navy-400 dark:text-navy-400' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{pro.bio}</p>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-bold">{pro.years_of_experience} Yrs Exp</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-bold">{pro.completed_jobs_count} Jobs</span>
                    {pro.is_available_now && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">Available Now</span>}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                      {pro.rating_average} <span className="text-slate-500 dark:text-slate-400 font-normal">({pro.review_count} reviews)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onOpenChat(pro); }} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Chat</button>
                    <button onClick={(e) => { e.stopPropagation(); onOpenBooking(pro); }} className="py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-xs font-bold text-white shadow-xs cursor-pointer transition-colors">Book Now</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    );
  }

  if (activeTab === 'bookings') {
    const activeCount = bookings.filter(b => b.status === 'pending' || b.status === 'quote_requested' || b.status === 'accepted' || b.status === 'in_progress').length;
    const awaitingCompletionCount = bookings.filter(b => b.status === 'completed_by_artisan').length;
    const completedCount = bookings.filter(b => b.status === 'paid_out').length;
    const issueReportedCount = bookings.filter(b => b.status === 'disputed').length;
    const closedCount = bookings.filter(b => isBookingArchived(b)).length;

    const bookingsSearchTrimmed = bookingsSearchTerm.trim().toLowerCase();

    const filteredBookingsList = bookings.filter(b => {
      // Filter by status tab
      if (bookingFilter === 'active') {
        if (!(b.status === 'pending' || b.status === 'quote_requested' || b.status === 'accepted' || b.status === 'in_progress')) return false;
      } else if (bookingFilter === 'awaiting_completion') {
        if (b.status !== 'completed_by_artisan') return false;
      } else if (bookingFilter === 'completed') {
        if (b.status !== 'paid_out') return false;
      } else if (bookingFilter === 'issue_reported') {
        if (b.status !== 'disputed') return false;
      } else if (bookingFilter === 'closed') {
        if (!isBookingArchived(b)) return false;
      }

      // Filter by category
      if (bookingsCategoryFilter !== 'All' && b.category !== bookingsCategoryFilter) {
        return false;
      }

      // Search matching across artisan name, service name, category, issue description, booking ID
      if (bookingsSearchTrimmed) {
        const matchesSearch =
          b.professionalName.toLowerCase().includes(bookingsSearchTrimmed) ||
          (b.title || '').toLowerCase().includes(bookingsSearchTrimmed) ||
          b.category.toLowerCase().includes(bookingsSearchTrimmed) ||
          b.description.toLowerCase().includes(bookingsSearchTrimmed) ||
          b.id.toLowerCase().includes(bookingsSearchTrimmed) ||
          (b.address && b.address.toLowerCase().includes(bookingsSearchTrimmed));
        if (!matchesSearch) return false;
      }

      return true;
    });

    return (
      <>
      <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
        {/* Toast Notification */}
        {rateToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{rateToast}</span>
            </div>
            <button onClick={() => setRateToast(null)} className="p-1 hover:bg-white/20 rounded-lg" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <h1 className="sr-only">My Service Bookings & Jobs</h1>
        <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">My Service Bookings & Jobs</p>
            <p className="text-xs text-slate-500">Track active jobs, review completed work, inspect warranty windows, or rehire past experts.</p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-navy-800/10 text-navy-800 dark:text-navy-400 text-xs font-extrabold border border-navy-800/20">
            {bookings.length} Total Job Records
          </span>
        </div>

        {/* Unified Search Banner & Filter System: Search Bar + 2 Filters (Jobs & Status) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-2">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={bookingsSearchTerm}
                onChange={(e) => setBookingsSearchTerm(e.target.value)}
                placeholder="Search bookings by artisan, service, issue, or job ID..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
              />
              {bookingsSearchTerm && (
                <button
                  onClick={() => setBookingsSearchTerm('')}
                  className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Search" aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2 Filters beside Search Bar: 1. Jobs (Category) and 2. Terms (Status) */}
            <div className="flex flex-col sm:flex-row lg:items-center gap-2 w-full lg:w-auto">
              {/* Filter 1: Jobs (Defaults to All Jobs) */}
              <CustomDropdown
                value={bookingsCategoryFilter}
                onChange={(val) => setBookingsCategoryFilter(val as Category | 'All')}
                icon={<Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={[
                  { value: 'All', label: 'All Jobs' },
                  ...CATEGORIES.map(cat => ({
                    value: cat,
                    label: cat,
                    icon: React.createElement(getCategoryIcon(cat), { className: "w-3.5 h-3.5 text-brand-orange-500" })
                  }))
                ]}
                placeholder="All Jobs"
                className="w-full sm:w-auto lg:min-w-[170px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-64"
              />

              {/* Filter 2: Terms / Status (Active, Awaiting, Completed, etc.) */}
              <CustomDropdown
                value={bookingFilter}
                onChange={(val) => setBookingFilter(val as 'all' | 'active' | 'awaiting_completion' | 'completed' | 'issue_reported' | 'closed')}
                icon={<Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={[
                  { value: 'all', label: `All Status (${bookings.length})` },
                  { value: 'active', label: `Active (${activeCount})` },
                  { value: 'awaiting_completion', label: `Awaiting Completion (${awaitingCompletionCount})` },
                  { value: 'completed', label: `Completed (${completedCount})` },
                  { value: 'issue_reported', label: `Issue Reported (${issueReportedCount})` },
                  { value: 'closed', label: `Closed (${closedCount})` },
                ]}
                placeholder="All Status"
                className="w-full sm:w-auto lg:min-w-[190px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-60"
                align="right"
              />

              {(bookingsSearchTerm || bookingsCategoryFilter !== 'All' || bookingFilter !== 'all') && (
                <button
                  onClick={() => {
                    setBookingsSearchTerm('');
                    setBookingsCategoryFilter('All');
                    setBookingFilter('all');
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white shadow-xs transition-colors cursor-pointer shrink-0 text-center"
                  title="Reset Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(bookingsSearchTerm || bookingsCategoryFilter !== 'All' || bookingFilter !== 'all') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs flex items-center flex-wrap gap-1.5">
              <span className="font-extrabold text-navy-800 dark:text-navy-400 text-[11px]">Active:</span>
              {bookingsSearchTerm && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                  "{bookingsSearchTerm}"
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setBookingsSearchTerm('')} />
                </span>
              )}
              {bookingsCategoryFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                  Job: {bookingsCategoryFilter}
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setBookingsCategoryFilter('All')} />
                </span>
              )}
              {bookingFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                  Status: {bookingFilter === 'awaiting_completion' ? 'Awaiting Completion' : bookingFilter === 'issue_reported' ? 'Issue Reported' : bookingFilter.charAt(0).toUpperCase() + bookingFilter.slice(1)}
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setBookingFilter('all')} />
                </span>
              )}
            </div>
          )}
        </div>

        {filteredBookingsList.length === 0 ? (
          <div className="text-center py-12 px-6 sm:px-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center space-y-4">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5]" />

            <div className="space-y-1.5 max-w-md">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                {bookingsSearchTerm
                  ? `No jobs matching "${bookingsSearchTerm}"`
                  : bookingFilter !== 'all'
                  ? `No ${bookingFilter.replace('_', ' ')} bookings found`
                  : bookingsCategoryFilter !== 'All'
                  ? `No ${bookingsCategoryFilter} jobs found`
                  : 'No bookings found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {bookingsSearchTerm
                  ? 'Try searching with a different artisan name, service title, or job keyword.'
                  : bookingFilter === 'active'
                  ? 'You currently have no active repairs or scheduled artisan visits.'
                  : bookingFilter === 'awaiting_completion'
                  ? 'Jobs awaiting your review will appear here once an artisan submits completion proofs.'
                  : bookingFilter === 'completed'
                  ? 'Completed jobs with active 4-day warranty windows will appear here.'
                  : bookingFilter === 'issue_reported'
                  ? 'You do not have any open dispute tickets or reported job defects.'
                  : bookingFilter === 'closed'
                  ? 'Finalized and archived jobs past their warranty period will appear here.'
                  : 'You have not booked any artisan services yet. Discover verified professionals near you to get started.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
              {(bookingsSearchTerm || bookingsCategoryFilter !== 'All' || bookingFilter !== 'all') ? (
                <button
                  type="button"
                  onClick={() => {
                    setBookingsSearchTerm('');
                    setBookingsCategoryFilter('All');
                    setBookingFilter('all');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onTabChange('home')}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-900 dark:bg-navy-700 dark:hover:bg-navy-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>Explore Verified Artisans</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookingsList.map(b => {
              const pro = professionals.find(p => p.id === b.artisan_id || p.user_id === b.artisan_id);
              const isCompleted = b.status === 'paid_out';
              const isClosed = isBookingArchived(b);
              const isAwaitingCompletion = b.status === 'completed_by_artisan';
              const isIssueReported = b.status === 'disputed';
              const isCancelled = b.status === 'cancelled';
              // Only while no price exists yet -- once quoted (quote_sent) or accepted, the amount is real.
              const isQuoteRequest = b.status === 'quote_requested' || (b.servicePricingType === 'quote_required' && b.status === 'pending');
              const isQuoteSent = b.status === 'quote_sent';

              // Status configuration for single, clean status pill
              const getStatusConfig = () => {
                if (isAwaitingCompletion) {
                  return {
                    label: 'Awaiting Your Review',
                    className: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
                    dotColor: 'bg-emerald-500 animate-pulse',
                    icon: <Clock className="w-3.5 h-3.5" />
                  };
                }
                if (isCompleted) {
                  return {
                    label: 'Completed',
                    className: 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700',
                    dotColor: null,
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  };
                }
                if (isIssueReported) {
                  return {
                    label: 'Issue Reported',
                    className: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80',
                    dotColor: null,
                    icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  };
                }
                if (isClosed) {
                  return {
                    label: 'Closed & Archived',
                    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                    dotColor: null,
                    icon: <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                  };
                }
                if (isCancelled) {
                  return {
                    label: 'Cancelled',
                    className: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                    dotColor: null,
                    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  };
                }
                if (isQuoteSent) {
                  return {
                    label: 'Quote Received',
                    className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    dotColor: 'bg-amber-500 animate-pulse',
                    icon: <FileText className="w-3.5 h-3.5 text-amber-500" />
                  };
                }
                if (b.status === 'escrow_funded') {
                  return {
                    label: 'Paid into Escrow',
                    className: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    dotColor: null,
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  };
                }
                if (b.status === 'in_progress') {
                  return {
                    label: 'Work In Progress',
                    className: 'bg-navy-50 dark:bg-navy-950/60 text-navy-800 dark:text-navy-300 border-navy-200/80 dark:border-navy-800',
                    dotColor: 'bg-brand-orange-500 animate-pulse',
                    icon: <Wrench className="w-3.5 h-3.5 text-brand-orange-500" />
                  };
                }
                if (b.status === 'accepted') {
                  return {
                    label: 'Accepted',
                    className: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    dotColor: null,
                    icon: <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  };
                }
                if (isQuoteRequest) {
                  return {
                    label: 'Quote Requested',
                    className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    dotColor: 'bg-amber-500 animate-pulse',
                    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />
                  };
                }
                return {
                  label: 'Pending Response',
                  className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                  dotColor: 'bg-amber-500 animate-pulse',
                  icon: <Clock className="w-3.5 h-3.5 text-amber-500" />
                };
              };

              const statusConfig = getStatusConfig();

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5"
                >
                  {/* Tier 1: Card Header (Identity, Trade, Price & Single Status Pill) */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {pro ? (
                        <img
                          src={pro.profile_picture}
                          alt={pro.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-navy-800/10 dark:bg-navy-400/10 text-navy-800 dark:text-navy-300 flex items-center justify-center font-black text-base shrink-0 border border-slate-200 dark:border-slate-700">
                          {b.professionalName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="truncate">{b.professionalName}</span>
                          {pro?.is_verified && <VerifiedBadge />}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {b.title || b.category}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Price & Status Badge */}
                    <div className="flex flex-col items-end justify-start gap-1.5 shrink-0 ml-auto text-right">
                      {!isQuoteRequest && b.amount && b.amount > 0 ? (
                        <div className="text-base font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(b.amount)}
                        </div>
                      ) : null}

                      {/* Unified Status Pill */}
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 border shadow-2xs ${statusConfig.className} ${(!b.amount || isQuoteRequest) ? 'mt-0.5' : ''}`}>
                        {statusConfig.dotColor && <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />}
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Dedicated Full-Width Metadata Bar (Date, Time, Location) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                      <span className={b.scheduled_date ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 font-medium'}>{bookingWhen(b)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0 sm:max-w-[55%]">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium" title={b.address}>
                        {b.address}
                      </span>
                    </div>
                  </div>

                  {/* Problem / Job Scope Description */}
                  <div className="text-xs bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/60 space-y-2">
                    <div className="leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {isQuoteRequest ? 'Job Scope Request:' : 'Job Description:'}
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">{b.description}</span>
                    </div>

                    {((b.problemImages && b.problemImages.length > 0) || b.problemImageUrl) && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-[11px] font-bold text-slate-400">Attached Photos:</span>
                        <div className="flex items-center gap-1.5">
                          {(b.problemImages || [b.problemImageUrl!]).map((img, i) => (
                            <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img
                                src={img}
                                alt="Job reference"
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quote received: the artisan's price, which the client accepts or declines (cancel). */}
                  {isQuoteSent && (
                    <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/70 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-amber-900 dark:text-amber-200">{b.professionalName.split(' ')[0] || b.professionalName} sent you a quote</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(b.amount ?? 0)}</span>
                      </div>
                      {b.quote_breakdown && (
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40 whitespace-pre-wrap">
                          {b.quote_breakdown}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Accepting doesn’t charge you. Paying into escrow is the next step.</span>
                        <button
                          type="button"
                          onClick={() => onAcceptQuote?.(b.id)}
                          className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Quote</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contextual Notification 1: Awaiting Completion Review Banner */}
                  {isAwaitingCompletion && b.completionDetails && (() => {
                    const submittedAtDate = b.completionDetails.submittedAt ? new Date(b.completionDetails.submittedAt) : new Date();
                    const deadlineDate = new Date(submittedAtDate.getTime() + 4 * 24 * 60 * 60 * 1000);
                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/70 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Work marked as done. Please check and confirm</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Deadline: <strong className="text-slate-700 dark:text-slate-300">{deadlineDate.toLocaleDateString()}</strong>
                          </span>
                        </div>

                        {b.completionDetails.description && (
                          <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                            <div><strong className="text-slate-900 dark:text-white">Summary:</strong> {b.completionDetails.description}</div>
                          </div>
                        )}

                        {b.completionDetails.photos && b.completionDetails.photos.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Proof Photos:</span>
                            {b.completionDetails.photos.map((pUrl, idx) => (
                              <a key={idx} href={pUrl} target="_blank" rel="noopener noreferrer">
                                <img src={pUrl} alt="Completion proof" className="w-12 h-12 rounded-lg object-cover border border-emerald-200 dark:border-emerald-800 hover:opacity-90 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        )}
                        {b.completionDetails.videoUrl && (
                          <div className="text-xs pt-0.5">
                            <a href={b.completionDetails.videoUrl} target="_blank" rel="noopener noreferrer" className="text-navy-800 dark:text-navy-400 font-bold hover:underline inline-flex items-center gap-1">
                              <span>🎥 View Video Walkthrough</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Contextual Notification 2: Completed Jobs 4-Day Warranty Status Strip */}
                  {isCompleted && (() => {
                    const completedAtDate = b.completedAt
                      ? new Date(b.completedAt)
                      : (b.completionDetails?.submittedAt ? new Date(b.completionDetails.submittedAt) : new Date(b.created_at));
                    const deadlineDate = new Date(completedAtDate.getTime() + 4 * 24 * 60 * 60 * 1000);
                    const msRemaining = Math.max(0, deadlineDate.getTime() - new Date().getTime());
                    const totalHours = Math.floor(msRemaining / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;

                    const timeString = days > 0
                      ? `${days}d ${hours}h`
                      : `${totalHours}h`;

                    return (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span><strong>4-Day Warranty Window:</strong> You can report any defects until {deadlineDate.toLocaleDateString()}.</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 shrink-0 self-start sm:self-auto">
                          {timeString} left
                        </span>
                      </div>
                    );
                  })()}

                  {/* Contextual Notification 3: Issue Reported Banner */}
                  {isIssueReported && (
                    <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 text-rose-800 dark:text-rose-300 font-bold">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Support Dispute Active</span>
                        </div>
                        {b.issueDetails?.reportedAt && (
                          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium">
                            Reported {new Date(b.issueDetails.reportedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {b.issueDetails && (
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                          <strong>Reason:</strong> {b.issueDetails.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Policy Footer - For active bookings / quote requests */}
                  {(b.status === 'pending' || b.status === 'quote_requested' || b.status === 'accepted' || b.status === 'in_progress') && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
                      <Info className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400 shrink-0" />
                      <p className="text-[11px] truncate">
                        {isQuoteRequest
                          ? 'The artisan is reviewing your request and will send you a price.'
                          : b.status === 'pending'
                            ? 'Waiting for the artisan to accept.'
                            : b.status === 'accepted'
                              ? 'Accepted. Paying into escrow is coming soon, so message the artisan to agree next steps.'
                              : 'Work is in progress.'}
                      </p>
                    </div>
                  )}

                  {/* Tier 3: Action Buttons Footer with Strict Visual Hierarchy */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Left: Message Artisan (Secondary Action) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (pro) onOpenChat(pro);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
                      <span>Message Artisan</span>
                    </button>

                    {/* Right: Contextual Primary & High-Priority Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                      {/* Active / Pending / Quote Request: Cancel Option */}
                      {(b.status === 'pending' || b.status === 'quote_requested' || isQuoteSent || b.status === 'accepted' || b.status === 'in_progress') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCancelModalBooking(b);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{isQuoteSent ? 'Decline Quote' : isQuoteRequest || b.status === 'pending' ? 'Cancel Request' : 'Cancel Booking'}</span>
                        </button>
                      )}

                      {/* Awaiting Completion Actions */}
                      {isAwaitingCompletion && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setComplaintModalBooking(b);
                              setComplaintDetails('');
                            }}
                            className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Report Issue</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateBookingStatus) {
                                onUpdateBookingStatus(b.id, 'paid_out', { completedAt: new Date().toISOString() });
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Release Escrow</span>
                          </button>
                        </>
                      )}

                      {/* Completed / Closed Booking Actions */}
                      {(isCompleted || isClosed) && (
                        <>
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setComplaintModalBooking(b);
                                setComplaintDetails('');
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Report Defect</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const targetPro = pro || professionals.find(p => p.id === b.artisan_id || p.user_id === b.artisan_id || p.category === b.category) || professionals[0];
                              if (targetPro) {
                                onOpenBooking(targetPro);
                              } else {
                                onTabChange('home');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-white" />
                            <span>Rehire Artisan</span>
                            {(pro?.is_available_now || (professionals.find(p => p.id === b.artisan_id || p.user_id === b.artisan_id)?.is_available_now)) && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Available Now" aria-label="Available Now" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complaint / Dispute Modal */}
      {complaintSheet.shouldRender && cachedComplaintBooking && (() => {
        const booking = cachedComplaintBooking;
        return (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${complaintSheet.backdropAnimationClasses}`}
          onClick={complaintGuard.requestClose}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 space-y-5 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto ${complaintSheet.sheetAnimationClasses}`}
            style={complaintSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={complaintSheet.dragHandleProps} className="sm:hidden -mx-4 -mt-4 mb-1 px-4 pt-4 pb-3 cursor-grab active:cursor-grabbing touch-none" />
            <button
              onClick={complaintGuard.requestClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {complaintStep === 'form' ? 'Report an Issue with Completed Work' : 'Review Your Issue Report'}
              </h2>
              <p className="text-xs text-slate-500">
                Booking #{booking.id} • Pro: <strong>{booking.professionalName}</strong>
              </p>
            </div>

            {complaintStep === 'form' ? (
              <div className="space-y-4">
                {/* Reason selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Issue Reason</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Poor Quality Workmanship',
                      'Incomplete Job / Left Unfinished',
                      'Unpunctual / Delayed Arrival',
                      'Overcharging / Unexpected Fees',
                      'Unprofessional Conduct',
                      'Property Damage / Theft Concern'
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setComplaintReason(reason)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          complaintReason === reason
                            ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Describe What Happened</label>
                  <textarea
                    rows={3}
                    value={complaintDetails}
                    onChange={(e) => setComplaintDetails(e.target.value)}
                    placeholder="Provide details about the issue, defects, or unfinished tasks..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>

                {/* Evidence Photos */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Evidence Photos / Video (Optional)</label>
                  <div>
                    <input
                      type="url"
                      value={complaintPhoto1}
                      onChange={(e) => setComplaintPhoto1(e.target.value)}
                      placeholder="Primary evidence photo URL (https://...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-hidden mb-2"
                    />
                    <input
                      type="url"
                      value={complaintPhoto2}
                      onChange={(e) => setComplaintPhoto2(e.target.value)}
                      placeholder="Secondary evidence photo / video URL (Optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={complaintGuard.requestClose}
                    className="flex-1 py-3 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!complaintDetails.trim()) {
                        alert('Please describe what happened before reviewing.');
                        return;
                      }
                      setComplaintStep('review');
                    }}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Review Report</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Service / Job</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{booking.title || booking.category}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Professional</span>
                    <strong className="text-slate-900 dark:text-white">{booking.professionalName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reason for Issue</span>
                    <span className="inline-block mt-0.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">{complaintReason}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Description</span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">{complaintDetails}</p>
                  </div>
                  {([complaintPhoto1, complaintPhoto2].filter(Boolean).length > 0) && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attached Evidence</span>
                      <div className="flex gap-2">
                        {[complaintPhoto1, complaintPhoto2].filter(Boolean).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="Evidence" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  <p className="leading-relaxed">
                    By submitting this report, the job status will change to <strong>Issue Reported</strong>. KaziHub support will review the case neutrally.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setComplaintStep('form')}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingDispute}
                    onClick={async () => {
                      const evidencePhotos = [complaintPhoto1, complaintPhoto2].map(u => u.trim()).filter(Boolean);
                      if (!complaintModalBooking || !onDisputeBooking) return;
                      // The backend opens the dispute and issues the ticket id shown next.
                      setIsSubmittingDispute(true);
                      const ticketId = await onDisputeBooking(complaintModalBooking.id, complaintReason, complaintDetails.trim(), evidencePhotos);
                      setIsSubmittingDispute(false);
                      if (!ticketId) return; // failure already explained; keep the form open
                      setSubmittedTicket({ ticketId, bookingId: complaintModalBooking.id, professionalName: complaintModalBooking.professionalName });
                      setComplaintModalBooking(null);
                      setComplaintStep('form');
                      setComplaintDetails('');
                      setComplaintPhoto1('');
                      setComplaintPhoto2('');
                    }}
                    className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" /> {isSubmittingDispute ? 'Submitting…' : 'Submit Issue Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      <UnsavedChangesModal
        guard={complaintGuard}
        description="Your issue report hasn't been submitted yet. Closing now will discard what you've entered."
      />

      {/* Ticket Submitted Success Modal */}
      {ticketSheet.shouldRender && cachedSubmittedTicket && (() => {
        const ticket = cachedSubmittedTicket;
        return (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md ${ticketSheet.backdropAnimationClasses}`}
          onClick={() => setSubmittedTicket(null)}
        >
          <div
            className={`bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 text-center space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${ticketSheet.sheetAnimationClasses}`}
            style={ticketSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={ticketSheet.dragHandleProps} className="sm:hidden -mx-4 -mt-4 mb-1 px-4 pt-4 pb-3 cursor-grab active:cursor-grabbing touch-none" />
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Support Ticket Filed</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ticket <strong>#{ticket.ticketId}</strong> for booking with <strong>{ticket.professionalName}</strong> has been assigned to a KaziHub Trust & Safety officer.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">Next Steps:</div>
              <div className="space-y-1">
                {[
                  'Payment to the artisan is paused for 48 hours.',
                  'Support officer will contact you via email/phone within 2 hours.',
                  'You can attach photos or extra details in customer support chat.'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="w-3 h-3 text-navy-800 dark:text-navy-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSubmittedTicket(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
        );
      })()}

      {/* Cancellation Confirmation Modal (Bottom Slide-Up on Mobile) */}
      <ConfirmationModal
        isOpen={Boolean(cancelModalBooking)}
        onClose={() => setCancelModalBooking(null)}
        onConfirm={() => {
          if (cancelModalBooking) {
            onCancelBooking(cancelModalBooking.id);
          }
          setCancelModalBooking(null);
        }}
        title={cancelModalBooking?.status === 'quote_sent' ? 'Decline This Quote?' : `Cancel ${cancelModalBooking?.status === 'quote_requested' ? 'Quote Request' : 'Booking'}?`}
        description={`Are you sure you want to cancel this booking with ${cancelModalBooking?.professionalName || 'the artisan'}?`}
        confirmText="Yes, Cancel Booking"
        cancelText="No, Keep Booking"
        type="danger"
        details={cancelModalBooking ? [
          `Service: ${cancelModalBooking.title || cancelModalBooking.category}`,
          `When: ${bookingWhen(cancelModalBooking)}`,
          ...(cancelModalBooking.escrow_status === 'held_in_escrow' ? ['A refund is recorded for the money held in escrow'] : []),
        ] : []}
      />
      </>
    );
  }

  if (activeTab === 'messages') {
    return (
      <CustomerMessages
        professionals={professionals}
        bookings={bookings}
        messages={messages}
        onSendMessage={onSendMessage}
        onMarkAsRead={onMarkAsRead}
        onOpenBooking={onOpenBooking}
        onSelectProForProfile={onSelectProForProfile}
        initialProId={initialMessageProId}
      />
    );
  }

  if (activeTab === 'saved') {
    const savedSearchTrimmed = savedSearchTerm.trim().toLowerCase();
    const filteredSavedPros = savedPros.filter(pro => {
      if (savedCategoryFilter !== 'All' && pro.category !== savedCategoryFilter) {
        return false;
      }
      if (savedNeighborhoodFilter !== 'All' && pro.neighborhood !== savedNeighborhoodFilter && pro.state !== savedNeighborhoodFilter) {
        return false;
      }
      if (savedSearchTrimmed) {
        const matches = 
          pro.name.toLowerCase().includes(savedSearchTrimmed) ||
          pro.category.toLowerCase().includes(savedSearchTrimmed) ||
          (pro.bio || '').toLowerCase().includes(savedSearchTrimmed) ||
          pro.neighborhood.toLowerCase().includes(savedSearchTrimmed) ||
          pro.bio.toLowerCase().includes(savedSearchTrimmed);
        if (!matches) return false;
      }
      return true;
    });

    return (
      <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
        <h1 className="sr-only">Saved Professionals</h1>
        <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Saved Professionals</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-700 text-white text-xs font-bold shadow-xs">
                {savedPros.length}
              </span>
            </p>
            <p className="text-xs text-slate-500">Your favorite artisans and home repair experts for quick booking.</p>
          </div>
        </div>

        {/* Unified Search Banner & Filter System */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={savedSearchTerm}
                onChange={(e) => setSavedSearchTerm(e.target.value)}
                placeholder="Search saved artisans by name, specialty, or area..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
              />
              {savedSearchTerm && (
                <button
                  onClick={() => setSavedSearchTerm('')}
                  className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:items-center gap-2 w-full lg:w-auto">
              <CustomDropdown
                value={savedCategoryFilter}
                onChange={(val) => setSavedCategoryFilter(val as Category | 'All')}
                icon={<Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={[
                  { value: 'All', label: 'All Categories' },
                  ...CATEGORIES.map(cat => ({
                    value: cat,
                    label: cat,
                    icon: React.createElement(getCategoryIcon(cat), { className: "w-3.5 h-3.5 text-brand-orange-500" })
                  }))
                ]}
                placeholder="All Categories"
                className="w-full sm:w-auto lg:min-w-[190px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-64"
              />

              <CustomDropdown
                value={savedNeighborhoodFilter}
                onChange={(val) => setSavedNeighborhoodFilter(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={neighborhoods.map(n => ({
                  value: n,
                  label: n === 'All' ? 'All Neighborhoods' : n
                }))}
                placeholder="All Neighborhoods"
                className="w-full sm:w-auto lg:min-w-[175px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-56 sm:w-60"
                align="right"
              />

              {(savedSearchTerm || savedCategoryFilter !== 'All' || savedNeighborhoodFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSavedSearchTerm('');
                    setSavedCategoryFilter('All');
                    setSavedNeighborhoodFilter('All');
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white shadow-xs transition-colors cursor-pointer shrink-0 text-center"
                  title="Reset Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(savedSearchTerm || savedCategoryFilter !== 'All' || savedNeighborhoodFilter !== 'All') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs flex items-center flex-wrap gap-1.5">
              <span className="font-extrabold text-navy-800 dark:text-navy-400 text-[11px]">Active:</span>
              {savedSearchTerm && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px]">
                  "{savedSearchTerm}"
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setSavedSearchTerm('')} />
                </span>
              )}
              {savedCategoryFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px]">
                  {savedCategoryFilter}
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setSavedCategoryFilter('All')} />
                </span>
              )}
              {savedNeighborhoodFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px]">
                  {savedNeighborhoodFilter}
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setSavedNeighborhoodFilter('All')} />
                </span>
              )}
            </div>
          )}
        </div>

        {filteredSavedPros.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
            <Bookmark className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
              {savedPros.length === 0 ? 'No saved professionals' : 'No matching saved professionals'}
            </h3>
            <p className="text-xs text-slate-500">
              {savedPros.length === 0 
                ? 'Click the bookmark icon on any professional card to save them here.' 
                : 'Try adjusting your search query or category filters above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSavedPros.map(pro => (
              <div key={pro.id} onClick={() => onSelectProForProfile(pro)} className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all active:scale-[0.99]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={pro.profile_picture} alt={pro.name} className="w-14 h-14 rounded-2xl object-cover" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-navy-800 dark:hover:text-navy-400">{pro.name}</h3>
                      <p className="text-xs text-navy-800 dark:text-navy-400 font-semibold">{pro.category}</p>
                      <p className="text-[11px] text-slate-500">{pro.neighborhood}</p>
                    </div>
                  </div>
                  <button onClick={(e) => toggleSavePro(pro.id, e)} className="p-2 rounded-xl bg-navy-800 text-white cursor-pointer" aria-label={savedProIds.includes(pro.id) ? "Remove from saved" : "Save professional"}>
                    <Bookmark className="w-4 h-4 fill-white" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{pro.bio}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {pro.rating_average} <span className="text-slate-400 font-normal">({pro.review_count})</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onOpenChat(pro); }} className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Chat</button>
                  <button onClick={(e) => { e.stopPropagation(); onOpenBooking(pro); }} className="py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-xs font-bold text-white shadow-xs cursor-pointer transition-colors">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'notifications') {
    const notificationsList = customerNotifications ?? [];
    const unreadCount = notificationsList.filter(n => !n.read && !n.isRead).length;

    const notifSearchTrimmed = notificationsSearchTerm.trim().toLowerCase();
    const filteredNotifications = notificationsList.filter(n => {
      // Filter by type
      if (notificationsFilterType === 'unread') {
        if (n.read || n.isRead) return false;
      } else if (notificationsFilterType !== 'All') {
        if (n.type !== notificationsFilterType) return false;
      }

      // Search matching across title, description
      if (notifSearchTrimmed) {
        const text = `${n.title} ${n.desc || n.description || ''}`.toLowerCase();
        if (!text.includes(notifSearchTrimmed)) return false;
      }

      return true;
    });

    return (
      <div className="w-full max-w-none space-y-6 animate-in fade-in duration-300">
        <div className="flex md:hidden flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-brand-orange-700 text-white text-xs font-bold shadow-xs flex items-center justify-center text-center">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">Real-time updates regarding your service bookings, quotes, payments, and warranty status.</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const updated = notificationsList.map(n => ({ ...n, read: true, isRead: true }));
                onUpdateCustomerNotifications?.(updated);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Unified Search Banner & Filter System */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={notificationsSearchTerm}
                onChange={(e) => setNotificationsSearchTerm(e.target.value)}
                placeholder="Search alerts by artisan, status, keyword, or service..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
              />
              {notificationsSearchTerm && (
                <button
                  onClick={() => setNotificationsSearchTerm('')}
                  className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:items-center gap-2 w-full lg:w-auto">
              <CustomDropdown
                value={notificationsFilterType}
                onChange={(val) => setNotificationsFilterType(val)}
                icon={<Bell className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={[
                  { value: 'All', label: 'All Notifications' },
                  { value: 'unread', label: 'Unread Only' },
                  { value: 'booking', label: 'Bookings' },
                  { value: 'completion', label: 'Completions' },
                  { value: 'payment', label: 'Payments & Escrow' },
                  { value: 'warranty', label: 'Warranties' }
                ]}
                placeholder="All Notifications"
                className="w-full sm:w-auto lg:min-w-[190px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-56"
              />

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = notificationsList.map(n => ({ ...n, read: true, isRead: true }));
                    onUpdateCustomerNotifications?.(updated);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="whitespace-nowrap">Mark all read</span>
                </button>
              )}

              {(notificationsSearchTerm || notificationsFilterType !== 'All') && (
                <button
                  onClick={() => {
                    setNotificationsSearchTerm('');
                    setNotificationsFilterType('All');
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white shadow-xs transition-colors cursor-pointer shrink-0 text-center"
                  title="Reset Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(notificationsSearchTerm || notificationsFilterType !== 'All') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs flex items-center flex-wrap gap-1.5">
              <span className="font-extrabold text-navy-800 dark:text-navy-400 text-[11px]">Active:</span>
              {notificationsSearchTerm && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px]">
                  "{notificationsSearchTerm}"
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setNotificationsSearchTerm('')} />
                </span>
              )}
              {notificationsFilterType !== 'All' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px]">
                  {notificationsFilterType === 'unread' ? 'Unread Only' : notificationsFilterType}
                  <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setNotificationsFilterType('All')} />
                </span>
              )}
            </div>
          )}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {notificationsList.length === 0 ? "You're all caught up! Updates regarding your service requests, estimates, and bookings will appear here." : "No notifications match your search query or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(n => {
              const isUnread = !n.read && !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    const updated = notificationsList.map(item => item.id === n.id ? { ...item, read: true, isRead: true } : item);
                    onUpdateCustomerNotifications?.(updated);
                    if (n.relatedTab) {
                      onTabChange(n.relatedTab);
                    } else {
                      onTabChange('bookings');
                    }
                  }}
                  className={`group p-[10px] sm:p-[15px] rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 ${
                    isUnread
                      ? 'bg-navy-800/5 dark:bg-navy-950/20 border-navy-800/30 dark:border-navy-400/30 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      n.type === 'completion' || n.type === 'completion_submitted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                      n.type === 'warranty' || n.type === 'warranty_active' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      n.type === 'payment' || n.type === 'escrow_secured' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                      n.type === 'issue_reported' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                      'bg-navy-800/10 text-navy-800 dark:text-navy-400 border-navy-800/20'
                    }`}>
                      {n.type === 'completion' || n.type === 'completion_submitted' ? <CheckCircle2 className="w-5 h-5" /> :
                       n.type === 'warranty' || n.type === 'warranty_active' ? <Clock className="w-5 h-5" /> :
                       n.type === 'payment' || n.type === 'escrow_secured' ? <CreditCard className="w-5 h-5" /> :
                       n.type === 'issue_reported' ? <ShieldAlert className="w-5 h-5" /> :
                       <Bell className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`text-sm tracking-tight truncate ${
                          isUnread
                            ? 'font-black text-slate-900 dark:text-white'
                            : 'font-bold text-slate-400 dark:text-slate-500'
                        }`}>
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="shrink-0 px-2 py-0.2 rounded-md bg-navy-800 text-white dark:bg-navy-400 dark:text-navy-950 text-[9px] font-black uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed font-medium ${
                        isUnread
                          ? 'text-slate-600 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {n.desc || n.description}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{n.time || n.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <span className="text-xs font-bold text-navy-800 dark:text-navy-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }


  // ==========================================
  // HOME / CENTER FEED (Default View)
  // ==========================================
  return (
    <div className="w-full max-w-none space-y-5 animate-in fade-in duration-300">
      
      {/* Top Greeting Row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return 'Good morning';
              if (hour < 17) return 'Good afternoon';
              return 'Good evening';
            })()}, {clientGreetingName}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onTabChange('saved')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-xs active:scale-[0.98]"
            title="View Bookmarked Artisans" aria-label="View Bookmarked Artisans"
          >
            <Bookmark className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
            <span>Saved</span>
            {savedProIds.length > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-brand-orange-700 text-white text-[9px] font-bold flex items-center justify-center text-center leading-none shadow-xs">
                <span className="flex items-center justify-center text-center">{savedProIds.length}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Unified Discovery & Artisan Feed (Search + Categories + Status Filter + Listings) */}
      <div className="space-y-4">
        
        {/* Unified Search & Discovery Console */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          
          {/* Search Input, All Categories Dropdown & Neighborhood Dropdown */}
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty, trade, or issue (e.g. Plumber, AC Repair, Electrician)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear Search" aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:items-center gap-2 w-full lg:w-auto">
              <CustomDropdown
                value={selectedCategoryFilter}
                onChange={(val) => onSelectCategoryFilter(val as Category | 'All')}
                icon={<Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={[
                  { 
                    value: 'All', 
                    label: `All Categories (${filteredProfessionals.length})`,
                    icon: <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  },
                  ...displayCategories.map((cat) => ({
                    value: cat,
                    label: `${cat} (${searchTrimmed ? getCategoryMatchingCount(cat) : getCategoryTotalCount(cat)})`,
                    icon: React.createElement(getCategoryIcon(cat), { className: "w-3.5 h-3.5 text-brand-orange-500" })
                  }))
                ]}
                placeholder="All Categories"
                className="w-full sm:w-auto lg:min-w-[190px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-64"
              />

              <CustomDropdown
                value={selectedNeighborhood}
                onChange={(val) => setSelectedNeighborhood(val)}
                icon={<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                options={neighborhoods.map((n) => ({
                  value: n,
                  label: n === 'All' ? 'All Neighborhoods' : n
                }))}
                placeholder="All Neighborhoods"
                className="w-full sm:w-auto lg:min-w-[175px]"
                buttonClassName="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
                dropdownWidth="w-56 sm:w-60"
                align="right"
              />

              {(selectedCategoryFilter !== 'All' || selectedNeighborhood !== 'All' || searchTerm || searchMinRating > 0 || searchMinExperience > 0 || searchAvailabilityOnly) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedNeighborhood('All');
                    onSelectCategoryFilter('All');
                    setSearchMinRating(0);
                    setSearchMinExperience(0);
                    setSearchAvailabilityOnly(false);
                    setProViewFilter('all');
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white shadow-xs transition-colors cursor-pointer shrink-0 text-center"
                  title="Clear Search & Filter State" aria-label="Clear Search & Filter State"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Matching Catalog Sub-Services Pills (when typing search term) */}
          {searchTrimmed !== '' && matchingCatalogServices.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Matching Services:
              </span>
              {matchingCatalogServices.slice(0, 6).map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => onSelectCategoryFilter(srv.category)}
                  className="px-2.5 py-1 rounded-lg bg-navy-800/10 dark:bg-navy-950 hover:bg-navy-800 hover:text-white text-navy-800 dark:text-navy-300 border border-navy-800/20 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>{srv.name}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-brand-orange-500/15 text-brand-orange-700 dark:text-brand-orange-300 border border-brand-orange-500/25">
                    {srv.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Filters Summary Pill Strip */}
          {(searchTerm || selectedNeighborhood !== 'All' || selectedCategoryFilter !== 'All' || searchMinRating > 0 || searchMinExperience > 0 || searchAvailabilityOnly) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center flex-wrap gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="font-extrabold text-navy-800 dark:text-navy-400 text-xs">Active:</span>
                {searchTerm && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                    "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setSearchTerm('')} />
                  </span>
                )}
                {selectedCategoryFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                    {selectedCategoryFilter}
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => onSelectCategoryFilter('All')} />
                  </span>
                )}
                {selectedNeighborhood !== 'All' && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-200">
                    {selectedNeighborhood}
                    <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-rose-500" onClick={() => setSelectedNeighborhood('All')} />
                  </span>
                )}
                {searchAvailabilityOnly && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 font-bold flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    Available Now
                    <X className="w-3 h-3 cursor-pointer text-emerald-500 hover:text-rose-500" onClick={() => setSearchAvailabilityOnly(false)} />
                  </span>
                )}
                {searchMinRating > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 font-bold flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                    {searchMinRating}+ Stars
                    <X className="w-3 h-3 cursor-pointer text-amber-500 hover:text-rose-500" onClick={() => setSearchMinRating(0)} />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section Header & View Toggles (Directly attached above cards) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedCategoryFilter === 'All' ? 'Nearby & Recommended Professionals' : `${selectedCategoryFilter} Specialists`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {displayedPros.length} vetted specialists {selectedNeighborhood === 'All' ? 'across Oyo State' : `in ${selectedNeighborhood}`}
            </p>
          </div>

          {/* Filter view pills: All / Available Now / Top Rated */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-center overflow-x-auto max-w-full">
            <button
              onClick={() => setProViewFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                proViewFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-navy-800 dark:text-navy-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({filteredProfessionals.length})
            </button>
            <button
              onClick={() => setProViewFilter('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                proViewFilter === 'available'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Available Now
            </button>
            <button
              onClick={() => setProViewFilter('topRated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                proViewFilter === 'topRated'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Top Rated
            </button>
          </div>
        </div>

        {displayedPros.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No professionals found matching your search or filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedNeighborhood('All');
                onSelectCategoryFilter('All');
                setSearchMinRating(0);
                setSearchMinExperience(0);
                setSearchAvailabilityOnly(false);
                setProViewFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold hover:bg-navy-900 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {displayedPros.map(pro => (
              <div
                key={pro.id}
                onClick={() => onSelectProForProfile(pro)}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all active:scale-[0.99] group"
              >
                <div className="space-y-2.5">
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={pro.profile_picture}
                          alt={pro.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs group-hover:scale-102 transition-transform"
                        />
                        {pro.is_available_now && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Available for immediate dispatch" aria-label="Available for immediate dispatch" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-navy-800 dark:group-hover:text-navy-400 transition-colors truncate">
                            {pro.name}
                          </h3>
                          {pro.is_verified && <VerifiedBadge title="Verified Professional" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-navy-800 dark:text-navy-300">
                            {pro.category}
                          </span>
                          <span>•</span>
                          <span>{pro.years_of_experience} yrs exp</span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {pro.neighborhood}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleSavePro(pro.id, e)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                      title={savedProIds.includes(pro.id) ? "Remove from saved" : "Save professional"} aria-label={savedProIds.includes(pro.id) ? "Remove from saved" : "Save professional"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedProIds.includes(pro.id) ? 'fill-navy-800 text-navy-800 dark:fill-navy-400 dark:text-navy-400' : ''}`} />
                    </button>
                  </div>

                  {/* Tagline / Specialty */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {pro.bio}
                  </p>

                  {/* Single Clean Trust & Rating Strip */}
                  <div className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 transition-colors">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 dark:fill-amber-400 dark:text-amber-400 stroke-1 shrink-0" />
                      <span>{pro.rating_average}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal">({pro.review_count})</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {pro.completed_jobs_count}+ jobs completed
                    </span>
                  </div>
                </div>

                {/* Bottom Pricing & Action Buttons */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Starts From</span>
                    <span className="text-xs sm:text-sm font-black text-navy-900 dark:text-white">
                      {formatCurrency(pro.base_price || 4000)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat(pro);
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> Chat
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBooking(pro);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};
