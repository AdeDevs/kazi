import React, { useState, useEffect } from 'react';
import { Professional, Booking, PortfolioItem, Category, ChatMessage, Notification } from '../types';
import { CATEGORIES } from '../mockData';
import { CustomDropdown } from './CustomDropdown';
import { formatCurrency } from '../utils';
import { ProfessionalMessages } from './ProfessionalMessages';
import { ProfessionalNotifications } from './ProfessionalNotifications';
import { ProfessionalGigs } from './ProfessionalGigs';
import { 
  Briefcase, DollarSign, Star, CheckCircle2, Clock, Plus, Trash2, 
  MapPin, ShieldCheck, User, Settings, Image as ImageIcon, Calendar, 
  MessageSquare, ClipboardList, ArrowRight, Eye, X, Check, AlertCircle 
} from 'lucide-react';

interface ProfessionalDashboardProps {
  professional: Professional;
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onAddPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => void;
  onUpdateProfile: (updated: Partial<Professional>) => void;
  activeTab?: string;
  onTabChange?: (tab: string, customerId?: string) => void;
  unreadCount?: number;
  messages?: ChatMessage[];
  onSendMessage?: (customerId: string, text: string, mediaProps?: Partial<ChatMessage>) => void;
  onMarkAsRead?: (customerId: string) => void;
  onLogout?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  notifications?: Notification[];
  onUpdateNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  initialCustomerId?: string;
}

export const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({
  professional,
  bookings,
  onUpdateBookingStatus,
  onAddPortfolioItem,
  onUpdateProfile,
  activeTab = 'explore',
  onTabChange,
  unreadCount = 2,
  messages = [],
  onSendMessage,
  onMarkAsRead,
  onLogout,
  darkMode = false,
  onToggleDarkMode = () => {},
  notifications,
  onUpdateNotifications,
  initialCustomerId
}) => {
  // Sub-tabs for home view or jobs page
  const [homeSubTab, setHomeSubTab] = useState<'overview' | 'portfolio' | 'profile'>('overview');
  const [jobsSubTab, setJobsSubTab] = useState<'requests' | 'active' | 'completed'>('requests');
  const [activeJobFilter, setActiveJobFilter] = useState<'all' | 'in_progress' | 'completion_submitted' | 'issue_reported'>('all');
  
  // Selected booking for View Details modal
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  // Job completion modal state
  const [completingJob, setCompletingJob] = useState<Booking | null>(null);
  const [completionDesc, setCompletionDesc] = useState('');
  const [completionPhoto1, setCompletionPhoto1] = useState('');
  const [completionPhoto2, setCompletionPhoto2] = useState('');
  const [completionVideoUrl, setCompletionVideoUrl] = useState('');

  // New portfolio form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(professional.category);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Profile edit state
  const [bio, setBio] = useState(professional.bio);
  const [hourlyRate, setHourlyRate] = useState(professional.hourlyRate);
  const [tagline, setTagline] = useState(professional.tagline);
  const [availabilityState, setAvailabilityState] = useState<'Available' | 'Busy' | 'Offline'>(
    professional.isAvailableNow ? 'Available' : 'Offline'
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);

  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const activeNotifications = notifications !== undefined ? notifications : localNotifications;
  const activeSetNotifications = onUpdateNotifications !== undefined ? onUpdateNotifications : setLocalNotifications;

  // Auto-completion helper (4 days = 345600000 ms)
  const isJobAutoCompleted = (job: Booking): boolean => {
    if (job.status === 'completion-submitted' && job.completionDetails?.submittedAt) {
      const submittedTime = new Date(job.completionDetails.submittedAt).getTime();
      const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
      return (Date.now() - submittedTime) >= fourDaysMs;
    }
    return false;
  };

  const getTimeRemainingForCustomerResponse = (submittedAtStr?: string) => {
    if (!submittedAtStr) return null;
    const submittedTime = new Date(submittedAtStr).getTime();
    const deadline = submittedTime + (4 * 24 * 60 * 60 * 1000);
    const diff = deadline - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      days,
      hours,
      minutes,
      expired: false,
      deadlineDate: new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };

  const handleNotificationClick = (notif: Notification) => {
    activeSetNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (onTabChange) {
      if (notif.type === 'new_job') {
        setJobsSubTab('requests');
        onTabChange('jobs');
      } else if (notif.type === 'job_accepted') {
        setJobsSubTab('active');
        onTabChange('jobs');
      } else if (notif.type === 'job_cancelled') {
        setJobsSubTab('completed');
        onTabChange('jobs');
      } else if (notif.type === 'new_message') {
        onTabChange('messages');
      } else if (notif.type === 'upcoming_booking') {
        onTabChange('bookings');
      }
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    activeSetNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    activeSetNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  const handleOptimisticUpdateStatus = (jobId: string, status: Booking['status'], extra?: Partial<Booking>) => {
    setLocalBookings(prev => prev.map(b => b.id === jobId ? { ...b, status, ...(extra || {}) } : b));
    onUpdateBookingStatus(jobId, status, extra);
  };

  const myBookings = localBookings.filter(b => b.professionalId === professional.id);
  const pendingRequests = myBookings.filter(b => b.status === 'pending' || b.status === 'awaiting_quote');

  const activeJobs = myBookings.filter(b => 
    b.status === 'accepted' || 
    b.status === 'in-progress' || 
    (b.status === 'completion-submitted' && !isJobAutoCompleted(b)) || 
    b.status === 'issue-reported'
  );

  const completedJobs = myBookings.filter(b => 
    b.status === 'completed' || 
    b.status === 'closed' || 
    isJobAutoCompleted(b)
  );

  const filteredActiveJobs = activeJobs.filter(b => {
    if (activeJobFilter === 'in_progress') return b.status === 'accepted' || b.status === 'in-progress';
    if (activeJobFilter === 'completion_submitted') return b.status === 'completion-submitted' && !isJobAutoCompleted(b);
    if (activeJobFilter === 'issue_reported') return b.status === 'issue-reported';
    return true;
  });

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newImageUrl) {
      alert('Please provide a title and image URL for your portfolio item.');
      return;
    }

    onAddPortfolioItem({
      title: newTitle,
      category: newCategory,
      imageUrl: newImageUrl,
      description: newDesc,
      dateCompleted: new Date().toISOString().split('T')[0]
    });

    setNewTitle('');
    setNewImageUrl('');
    setNewDesc('');
    alert('Portfolio item added successfully!');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      bio,
      hourlyRate: Number(hourlyRate),
      tagline,
      isAvailableNow: availabilityState === 'Available'
    });
    alert('Profile updated successfully!');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('en-GB', options);
  };

  const firstName = professional.name.split(' ')[0] || professional.name;

  // ================= RENDER DEDICATED MESSAGES PAGE =================
  if (activeTab === 'messages') {
    return (
      <ProfessionalMessages 
        professional={professional} 
        messages={messages} 
        bookings={bookings} 
        onSendMessage={onSendMessage} 
        onMarkAsRead={onMarkAsRead} 
        initialCustomerId={initialCustomerId}
      />
    );
  }


  // ================= RENDER DEDICATED NOTIFICATIONS PAGE =================
  if (activeTab === 'notifications') {
    return (
      <ProfessionalNotifications 
        notifications={activeNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onMarkAsRead={handleMarkNotificationAsRead}
      />
    );
  }


  // ================= RENDER DEDICATED GIGS PAGE =================
  if (activeTab === 'gigs') {
    return <ProfessionalGigs />;
  }

  // ================= RENDER DEDICATED JOBS PAGE =================
  if (activeTab === 'jobs') {
    return (
      <div className="w-full max-w-none space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Jobs</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage all your customer jobs from one place.</p>
        </div>

        {/* Page Navigation Tabs (Requests, Active, Completed) */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 w-full gap-1">
          <button
            onClick={() => setJobsSubTab('requests')}
            className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap select-none active:scale-95 shrink-0 ${
              jobsSubTab === 'requests'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {jobsSubTab === 'requests' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
            )}
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-brand-orange-500 text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setJobsSubTab('active')}
            className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap select-none active:scale-95 shrink-0 ${
              jobsSubTab === 'active'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {jobsSubTab === 'active' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
            )}
            <span>Active</span>
            {activeJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-navy-800 dark:bg-navy-600 text-white">
                {activeJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setJobsSubTab('completed')}
            className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap select-none active:scale-95 shrink-0 ${
              jobsSubTab === 'completed'
                ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {jobsSubTab === 'completed' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
            )}
            <span>Completed</span>
            {completedJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {completedJobs.length}
              </span>
            )}
          </button>
        </div>

        {/* Requests Tab Content */}
        {jobsSubTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No pending job requests.</h4>
                <p className="text-xs text-slate-500 mt-1">New incoming requests from customers will appear here immediately.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((job) => {
                  const isQuote = job.status === 'awaiting_quote' || job.servicePricingType === 'quote_required';
                  return (
                  <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          isQuote
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400'
                            : 'bg-brand-orange-500/10 text-brand-orange-600 border border-brand-orange-500/20 dark:text-brand-orange-400'
                        }`}>
                          {isQuote ? 'Awaiting Quote' : 'Pending Booking'}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold truncate">Customer: {job.customerName} ({job.customerPhone})</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {job.selectedService || job.category}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        "{job.issueDescription}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {job.date} ({job.timeSlot})</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.address}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                      <div className="text-right sm:mr-4 hidden sm:block">
                        <p className="text-xs text-slate-400">{isQuote ? 'Quote Status' : 'Est. Payout'}</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {isQuote ? (job.totalPrice && job.totalPrice > 0 ? formatCurrency(job.totalPrice) : 'Quote Required') : formatCurrency(job.totalPrice || 0)}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedBookingForDetails(job)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to decline and cancel this job request?")) {
                            handleOptimisticUpdateStatus(job.id, 'cancelled');
                          }
                        }}
                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleOptimisticUpdateStatus(job.id, 'accepted')}
                        className="px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-xs"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* Active Tab Content */}
        {jobsSubTab === 'active' && (
          <div className="space-y-4">
            {/* Active Sub-Filters */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                onClick={() => setActiveJobFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeJobFilter === 'all'
                    ? 'bg-navy-800 text-white dark:bg-navy-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Active ({activeJobs.length})
              </button>
              <button
                onClick={() => setActiveJobFilter('in_progress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeJobFilter === 'in_progress'
                    ? 'bg-navy-800 text-white dark:bg-navy-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>In Progress</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {activeJobs.filter(j => j.status === 'accepted' || j.status === 'in-progress').length}
                </span>
              </button>
              {activeJobs.filter(j => j.status === 'completion-submitted' && !isJobAutoCompleted(j)).length > 0 && (
                <button
                  onClick={() => setActiveJobFilter('completion_submitted')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeJobFilter === 'completion_submitted'
                      ? 'bg-navy-800 text-white dark:bg-navy-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span>Completion Submitted</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold">
                    {activeJobs.filter(j => j.status === 'completion-submitted' && !isJobAutoCompleted(j)).length}
                  </span>
                </button>
              )}
              {activeJobs.filter(j => j.status === 'issue-reported').length > 0 && (
                <button
                  onClick={() => setActiveJobFilter('issue_reported')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeJobFilter === 'issue_reported'
                      ? 'bg-navy-800 text-white dark:bg-navy-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>Issue Reported</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold">
                    {activeJobs.filter(j => j.status === 'issue-reported').length}
                  </span>
                </button>
              )}
            </div>

            {filteredActiveJobs.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No active jobs found for this filter.</h4>
                <p className="text-xs text-slate-500 mt-1">Select a different filter above or accept new incoming requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActiveJobs.map((job) => {
                  const timeRem = getTimeRemainingForCustomerResponse(job.completionDetails?.submittedAt);
                  const isSubmitted = job.status === 'completion-submitted' && !isJobAutoCompleted(job);
                  const isIssue = job.status === 'issue-reported';

                  return (
                    <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-3">
                      {/* Top Header Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                              isSubmitted
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : isIssue
                                ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                                : job.status === 'accepted'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-navy-800/10 text-navy-800 dark:text-navy-400'
                            }`}>
                              {isSubmitted && <Clock className="w-3.5 h-3.5" />}
                              {isIssue && <AlertCircle className="w-3.5 h-3.5" />}
                              <span>
                                {isSubmitted ? 'Completion Submitted' : isIssue ? 'Issue Reported' : job.status === 'accepted' ? 'Accepted' : 'In Progress'}
                              </span>
                            </span>

                            <span className="text-xs text-slate-400 font-semibold truncate">
                              Customer: <strong className="text-slate-700 dark:text-slate-300">{job.customerName}</strong> ({job.customerPhone})
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-1">
                            {job.selectedService || job.category}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            "{job.issueDescription}"
                          </p>
                        </div>

                        <div className="text-left md:text-right shrink-0">
                          <p className="text-xs text-slate-400">Total Payout</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {formatCurrency(job.totalPrice || 0)}
                          </p>
                        </div>
                      </div>

                      {/* State Specific Banners */}
                      {isSubmitted && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl text-xs space-y-2">
                          <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-extrabold flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Awaiting Customer Response</span>
                            </div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                              4-Day Review Period
                            </span>
                          </div>
                          <p className="text-amber-800 dark:text-amber-300/90 font-medium">
                            You submitted work completion proof. The customer has up to 4 days to inspect and confirm completion or submit an issue report.
                          </p>
                          {timeRem && !timeRem.expired && (
                            <div className="flex items-center gap-2 pt-1 font-bold text-amber-900 dark:text-amber-200 text-[11px] flex-wrap">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/50">
                                ⏳ Customer Response Time Remaining: {timeRem.days}d {timeRem.hours}h {timeRem.minutes}m
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                (Auto-completes on {timeRem.deadlineDate} if no response)
                              </span>
                            </div>
                          )}
                          {job.completionDetails?.description && (
                            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-slate-900 dark:text-slate-100">Work Description:</span> "{job.completionDetails.description}"
                            </div>
                          )}
                        </div>
                      )}

                      {isIssue && (
                        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl text-xs space-y-2.5">
                          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-extrabold">
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            <span>Customer Reported an Issue</span>
                          </div>
                          <p className="text-rose-900 dark:text-rose-200 font-bold bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
                            "{job.issueDetails?.description || 'Customer noted an issue during inspection.'}"
                          </p>
                          {job.issueDetails?.evidencePhotos && job.issueDetails.evidencePhotos.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-1">Customer Evidence Photos:</span>
                              <div className="flex flex-wrap gap-2">
                                {job.issueDetails.evidencePhotos.map((photo, idx) => (
                                  <img key={idx} src={photo} alt={`Evidence ${idx + 1}`} className="w-14 h-14 rounded-lg object-cover border border-rose-300 dark:border-rose-800" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clear Next Action Indicator */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-navy-800 dark:text-navy-400 block">
                          Next Action Required:
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isSubmitted ? (
                            "Awaiting customer review. No further action needed. If the customer does not respond within 4 days, the job will automatically transition to Completed and escrow payout will be released."
                          ) : isIssue ? (
                            "Contact customer via direct message below to resolve reported details, clarify work performed, or arrange a follow-up fix."
                          ) : job.status === 'accepted' ? (
                            "Head to customer location at the scheduled time and click 'Start Job'."
                          ) : (
                            "Perform the repair work, then click 'Complete Job' to submit work completion proof photos."
                          )}
                        </p>
                      </div>

                      {/* Footer Metadata & Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {job.date} ({job.timeSlot})</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.address}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => setSelectedBookingForDetails(job)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => {
                              if (onTabChange) {
                                onTabChange('messages', job.customerId);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 ${
                              isIssue
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                : 'bg-navy-800/10 hover:bg-navy-800/20 text-navy-800 dark:text-navy-300'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message Customer</span>
                          </button>

                          {job.status === 'accepted' && (
                            <button
                              onClick={() => handleOptimisticUpdateStatus(job.id, 'in-progress')}
                              className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none shadow-xs"
                            >
                              Start Job
                            </button>
                          )}

                          {job.status === 'in-progress' && (
                            <button
                              onClick={() => {
                                setCompletingJob(job);
                                setCompletionDesc('');
                                setCompletionPhoto1('');
                                setCompletionPhoto2('');
                                setCompletionVideoUrl('');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete Job</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed Tab Content */}
        {jobsSubTab === 'completed' && (
          <div className="space-y-4">
            {completedJobs.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No completed jobs yet.</h4>
                <p className="text-xs text-slate-500 mt-1">Jobs you successfully complete or that auto-complete after 4 days will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((job) => {
                  const autoCompleted = isJobAutoCompleted(job);

                  return (
                    <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                              {autoCompleted && <span className="text-[10px] lowercase font-normal">(Auto-finalized)</span>}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold truncate min-w-0">Customer: {job.customerName}</span>
                          </div>

                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {job.selectedService || job.category}
                          </h4>
                        </div>

                        <div className="text-left md:text-right shrink-0">
                          <p className="text-xs text-slate-400">Paid Payout</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(job.totalPrice || 0)}</p>
                        </div>
                      </div>

                      {/* Completion status description */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-3.5 rounded-2xl text-xs space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            {autoCompleted
                              ? 'Job Auto-Completed (4-Day Window Concluded)'
                              : job.status === 'completed'
                              ? 'Job Confirmed & Escrow Released'
                              : 'Job Finalized & Closed'}
                          </span>
                        </div>
                        <p className="text-emerald-800 dark:text-emerald-300 font-medium">
                          {autoCompleted
                            ? 'The customer did not report an issue within the 4-day response window. The job automatically transitioned to Completed.'
                            : job.status === 'completed'
                            ? 'The customer confirmed work completion and escrow payout was released.'
                            : 'This job has been finalized.'}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Next Action:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Job successfully finished and archived in work history.</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> Scheduled/Completed Date: {job.date}
                        </span>

                        <button
                          onClick={() => setSelectedBookingForDetails(job)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View Details Modal */}
        {selectedBookingForDetails && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setSelectedBookingForDetails(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-bold text-navy-800 dark:text-navy-400 uppercase tracking-wider">Job Details & Status</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedBookingForDetails.selectedService || selectedBookingForDetails.category}
                </h3>
                <p className="text-xs text-slate-500">Booking ID: {selectedBookingForDetails.id}</p>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Customer Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBookingForDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Phone:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBookingForDetails.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Scheduled Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBookingForDetails.date} ({selectedBookingForDetails.timeSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Location / Address:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{selectedBookingForDetails.address}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-500">Job Status:</span>
                  <span className="font-extrabold uppercase px-2.5 py-1 rounded-full text-xs bg-navy-800 text-white">
                    {selectedBookingForDetails.status === 'completion-submitted'
                      ? 'Completion Submitted'
                      : selectedBookingForDetails.status === 'issue-reported'
                      ? 'Issue Reported'
                      : selectedBookingForDetails.status}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Total Payout:</span>
                  <span className="font-black text-base text-slate-900 dark:text-white">{formatCurrency(selectedBookingForDetails.totalPrice || 0)}</span>
                </div>
              </div>

              {selectedBookingForDetails.completionDetails && (
                <div className="space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">Submitted Completion Proof:</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">"{selectedBookingForDetails.completionDetails.description}"</p>
                  {selectedBookingForDetails.completionDetails.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedBookingForDetails.completionDetails.photos.map((p, i) => (
                        <img key={i} src={p} alt={`Proof ${i+1}`} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedBookingForDetails.issueDetails && (
                <div className="space-y-2 bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-xs">
                  <span className="font-extrabold text-rose-800 dark:text-rose-300 block">Customer Reported Issue:</span>
                  <p className="text-rose-900 dark:text-rose-200 font-bold">"{selectedBookingForDetails.issueDetails.description}"</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">Initial Issue Description</span>
                <p className="text-xs sm:text-sm bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedBookingForDetails.issueDescription}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="px-6 py-2.5 rounded-xl bg-navy-800 text-white font-bold text-xs hover:bg-navy-900 cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Completion Submission Modal */}
        {completingJob && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setCompletingJob(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setCompletingJob(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Job Completion Step
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Submit Work Completion Proof
                </h3>
                <p className="text-xs text-slate-500">
                  Provide a description and mandatory proof photo(s) for "{completingJob.selectedService || completingJob.category}" with {completingJob.customerName}.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!completionDesc.trim()) {
                    alert('Please provide a short description of the work completed.');
                    return;
                  }
                  if (!completionPhoto1.trim()) {
                    alert('Please provide at least one completion photo.');
                    return;
                  }

                  const photos = [completionPhoto1, completionPhoto2].filter(Boolean);

                  // Update job status to completion-submitted
                  const updated: Booking = {
                    ...completingJob,
                    status: 'completion-submitted',
                    completionDetails: {
                      description: completionDesc,
                      photos,
                      videoUrl: completionVideoUrl || undefined,
                      submittedAt: new Date().toISOString()
                    }
                  };

                  handleOptimisticUpdateStatus(updated.id, 'completion-submitted', {
                    completionDetails: updated.completionDetails
                  });
                  setCompletingJob(null);
                  alert('Job completion proof submitted successfully! Status changed to Completion Submitted.');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Completed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={completionDesc}
                    onChange={(e) => setCompletionDesc(e.target.value)}
                    placeholder="Summarize the repair work done, parts replaced, or testing results..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Completion Photo (Image URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={completionPhoto1}
                    onChange={(e) => setCompletionPhoto1(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">At least 1 completion photo is required.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Completion Photo (Optional)
                  </label>
                  <input
                    type="url"
                    value={completionPhoto2}
                    onChange={(e) => setCompletionPhoto2(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Video Walkthrough / Demo URL
                  </label>
                  <input
                    type="url"
                    value={completionVideoUrl}
                    onChange={(e) => setCompletionVideoUrl(e.target.value)}
                    placeholder="https://example.com/video-walkthrough.mp4"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCompletingJob(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Completion Proof</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER HOME / EXPLORE DASHBOARD =================
  return (
    <div className="w-full max-w-none space-y-6">
      
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {firstName}.
            </h1>
            {professional.verified && <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            {getFormattedDate()}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 font-medium">
            "Ready to help more customers today?"
          </p>
        </div>

        {/* Right Section: Availability Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online & Available</span>
          </div>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Overview
          </h2>
          <span className="text-xs font-medium text-slate-400">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Today's Jobs */}
          <div
            onClick={() => setHomeSubTab('overview')}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Today's Jobs</span>
                <div className="w-8 h-8 rounded-xl bg-navy-800/10 dark:bg-navy-800/30 text-navy-800 dark:text-navy-300 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {activeJobs.length}
                </p>
                {activeJobs.length > 0 && (
                  <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    +{activeJobs.length} today
                  </span>
                )}
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-navy-800 dark:text-navy-400 group-hover:underline">
              <span>View Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2 — Pending Requests */}
          <div
            onClick={() => {
              setJobsSubTab('requests');
              onTabChange && onTabChange('jobs');
            }}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending Requests</span>
                <div className="w-8 h-8 rounded-xl bg-brand-orange-500/10 text-brand-orange-600 dark:text-brand-orange-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {pendingRequests.length}
                </p>
                <span className="text-xs text-brand-orange-600 dark:text-brand-orange-400 font-bold bg-brand-orange-500/10 border border-brand-orange-500/20 px-1.5 py-0.5 rounded-md">
                  Awaiting reply
                </span>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-navy-800 dark:text-navy-400 group-hover:underline">
              <span>Review Requests</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3 — Unread Messages */}
          <div
            onClick={() => onTabChange && onTabChange('messages')}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Unread Messages</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{unreadCount}</p>
                {unreadCount > 0 && (
                  <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    New chats
                  </span>
                )}
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-navy-800 dark:text-navy-400 group-hover:underline">
              <span>Open Messages</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 4 — Average Rating */}
          <div
            onClick={() => setHomeSubTab('profile')}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Average Rating</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{professional.rating.toFixed(1)}</p>
                  <span className="text-xs text-slate-400 font-semibold">({professional.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 w-full gap-1">
        <button
          onClick={() => setHomeSubTab('overview')}
          className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap select-none active:scale-95 shrink-0 flex items-center gap-2 ${
            homeSubTab === 'overview'
              ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          {homeSubTab === 'overview' && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
          )}
          <span>Assigned Job Bookings ({activeJobs.length})</span>
        </button>
        <button
          onClick={() => setHomeSubTab('portfolio')}
          className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap select-none active:scale-95 shrink-0 flex items-center gap-2 ${
            homeSubTab === 'portfolio'
              ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          {homeSubTab === 'portfolio' && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
          )}
          <span>Portfolio Showcase ({professional.portfolio.length})</span>
        </button>
        <button
          onClick={() => setHomeSubTab('profile')}
          className={`pb-3 pt-2.5 px-5 font-bold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap select-none active:scale-95 shrink-0 flex items-center gap-2 ${
            homeSubTab === 'profile'
              ? 'border-navy-800 text-navy-800 dark:border-navy-400 dark:text-navy-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          {homeSubTab === 'profile' && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 shrink-0" />
          )}
          <span>Profile & Rates</span>
        </button>
      </div>

      {/* Tab 1: Overview / Bookings */}
      {homeSubTab === 'overview' && (
        <div className="space-y-6">


          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assigned Job Bookings</h3>
            <p className="text-xs text-slate-500">Accept requests, schedule visits, and complete jobs to grow your rating</p>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No active job requests</h4>
              <p className="text-xs text-slate-500 mt-1">Completed jobs are archived. Make sure your availability is set to "Available Now" for new requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        job.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                        job.status === 'in-progress' ? 'bg-navy-800/10 text-navy-800 dark:text-navy-400' :
                        job.status === 'pending' ? 'bg-brand-orange-500/10 text-brand-orange-600 border border-brand-orange-500/20 dark:text-brand-orange-400 dark:border-brand-orange-500/30' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold truncate">Customer: {job.customerName} ({job.customerPhone})</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Issue: {job.issueDescription}</h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" /> {job.date} ({job.timeSlot})</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="text-right sm:mr-4 hidden sm:block">
                      <p className="text-xs text-slate-400">Est. Payout</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(job.totalPrice || 0)}</p>
                    </div>

                    {job.status === 'pending' || job.status === 'accepted' ? (
                      <button
                        onClick={() => handleOptimisticUpdateStatus(job.id, 'in-progress')}
                        className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-xs"
                      >
                        Start Job
                      </button>
                    ) : job.status === 'in-progress' ? (
                      <button
                        onClick={() => {
                          setCompletingJob(job);
                          setCompletionDesc('');
                          setCompletionPhoto1('');
                          setCompletionPhoto2('');
                          setCompletionVideoUrl('');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Job</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl">Completed ✅</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Portfolio */}
      {homeSubTab === 'portfolio' && (
        <div className="space-y-8">
          {/* Add Portfolio Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Portfolio Project</h3>
            <form onSubmit={handleAddPortfolio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Commercial 3-Phase Rewiring"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <CustomDropdown
                  value={newCategory}
                  onChange={(val) => setNewCategory(val as Category)}
                  options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                  className="w-full"
                  buttonClassName="py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Photo Image URL</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the scope of work and materials used..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-navy-800 hover:bg-navy-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Portfolio Item</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Portfolio Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {professional.portfolio.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                  <span className="text-[10px] text-slate-400">Completed on {item.dateCompleted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {homeSubTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-4">Edit Professional Profile & Pricing</h3>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline / Professional Title</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hourly Rate (₦)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
