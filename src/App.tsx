import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Role, Professional, Booking, ChatMessage, Category, PortfolioItem, Notification } from './types';
import { Language } from './translations';
import { INITIAL_PROFESSIONALS, INITIAL_BOOKINGS, INITIAL_MESSAGES } from './mockData';
import { AppShell } from './components/AppShell';
import { ProfessionalProfileModal } from './components/ProfessionalProfileModal';
import { BookingModal } from './components/BookingModal';
import { AuthPage } from './components/AuthPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';
import { NotFound } from './components/NotFound';
import { useAuth } from './context/AuthContext';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { useVisualViewportHeight } from './hooks/useVisualViewportHeight';
import { Toaster } from 'sonner';

// Code-split the per-role dashboards, profile/settings, and notifications screens: an
// anonymous visitor on the sign-in screen, or a customer, shouldn't have to download the
// artisan dashboard (and vice versa) just to see their own view.
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const ProfessionalDashboard = lazy(() => import('./components/ProfessionalDashboard').then(m => ({ default: m.ProfessionalDashboard })));
const ProfileView = lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const ProfessionalNotifications = lazy(() => import('./components/ProfessionalNotifications').then(m => ({ default: m.ProfessionalNotifications })));

// Tiny route-param readers, kept at module scope (not defined inside App()) so they're stable
// component identities across renders -- defining them inline inside App() would make React treat
// them as a brand-new component type on every App render and remount the whole dashboard tree.
//
// /messages/:contactId is one shared, role-neutral URL for both roles' inbox -- the role decides
// which dashboard component renders (and which prop it's threaded into as the open conversation),
// never the URL itself.
function MessagesRoute({
  currentRole,
  customerProps,
  professionalProps,
}: {
  currentRole: Role;
  customerProps: React.ComponentProps<typeof CustomerDashboard>;
  professionalProps: React.ComponentProps<typeof ProfessionalDashboard>;
}) {
  const { contactId } = useParams();
  if (currentRole === 'professional') {
    return <ProfessionalDashboard {...professionalProps} initialCustomerId={contactId} />;
  }
  return <CustomerDashboard {...customerProps} initialMessageProId={contactId} />;
}
function ProfessionalJobsRoute(props: React.ComponentProps<typeof ProfessionalDashboard>) {
  const { bookingId } = useParams();
  return <ProfessionalDashboard {...props} initialBookingId={bookingId} />;
}
function ProfessionalGigsNewRoute(props: React.ComponentProps<typeof ProfessionalDashboard>) {
  return <ProfessionalDashboard {...props} forceGigCreation />;
}
function ProfessionalProfileRoute({
  professionals,
  ...rest
}: { professionals: Professional[] } & Omit<React.ComponentProps<typeof ProfessionalProfileModal>, 'professional' | 'isOpen' | 'onClose'> & { onClose: () => void }) {
  const { id } = useParams();
  const professional = professionals.find(p => p.id === id) || null;
  useDocumentMeta(
    professional ? professional.name : 'Professional not found',
    professional ? `${professional.name} -- ${professional.category} on KaziHub. ${professional.tagline || ''}`.trim() : 'This professional profile could not be found.'
  );
  if (!professional) return <NotFound />;
  return <ProfessionalProfileModal {...rest} professional={professional} isOpen />;
}

export default function App() {
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useVisualViewportHeight();

  // The authenticated user's role is the sole authority here -- there is no client-side override.
  // A previous iteration kept this as togglable state (a demo "preview both dashboards" feature),
  // but that let any authenticated user flip which dashboard rendered independent of their real
  // backend role, which is exactly the RBAC hole route guards below close. If a dev-only "preview
  // as the other role" tool is wanted later, it belongs in a separate dev-only mechanism, not here.
  const currentRole: Role = user?.role === 'artisan' ? 'professional' : 'customer';

  const pageScrollPositionsRef = useRef<Record<string, number>>({});
  // Set alongside a tab change by any CTA that names a specific section (e.g. "Manage Portfolio")
  // so the target page can scroll straight to that section instead of just landing at its top.
  const [profileScrollTarget, setProfileScrollTarget] = useState<string | null>(null);

  // Continuously record scroll position for the current page
  useEffect(() => {
    const handleScroll = () => {
      pageScrollPositionsRef.current[location.pathname] = window.scrollY || document.documentElement.scrollTop || 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  // Restore or reset scroll position when the route changes
  useEffect(() => {
    const targetY = pageScrollPositionsRef.current[location.pathname] ?? 0;

    // Immediately reset/restore window scroll
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });

    // Handle asynchronous DOM rendering
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
    });

    const timerId = setTimeout(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
    }, 40);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [location.pathname]);

  // Every tab is a clean, resource-oriented URL with no role segment -- the role decides what's
  // *allowed* (see RequireRole in the route tree below), never what the URL looks like. "explore"
  // is the one tab name that doesn't match its own path (it's the /home landing page).
  const TAB_TO_PATH: Record<string, string> = {
    explore: '/home',
    profile: '/profile',
    settings: '/settings',
    messages: '/messages',
    notifications: '/notifications',
    bookings: '/bookings',
    search: '/search',
    saved: '/saved',
    jobs: '/jobs',
    gigs: '/gigs',
  };

  // The single navigation entry point every nav click/CTA throughout the app already calls
  // (unchanged prop signature/call sites in AppShell, CustomerDashboard, ProfessionalDashboard,
  // ProfileView, ProProfileManagement) -- only its implementation changed, from setActiveTab to a
  // real URL navigation, so every one of those call sites is now genuine browser navigation.
  const handleTabChange = useCallback((tab: string, subId?: string) => {
    // Bell toggle: clicking notifications while already there goes back to wherever we came from,
    // using real history instead of a hand-rolled "previous tab" ref.
    if (tab === 'notifications' && location.pathname === '/notifications') {
      navigate(-1);
      return;
    }

    const base = TAB_TO_PATH[tab] || `/${tab}`;
    const target = `${base}${subId ? `/${subId}` : ''}`;
    if (target === location.pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }
    navigate(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kazihub_dark_mode_v2');
    return saved !== null ? saved === 'true' : false;
  });

  // Lets a deeply-nested sub-view (e.g. the gig-creation form) override AppShell's tab-derived
  // header title while it's open, then hand control back when it closes.
  const [pageSubtitle, setPageSubtitle] = useState<string | null>(null);
  useEffect(() => {
    setPageSubtitle(null);
  }, [location.pathname]);

  // State with localStorage persistence or fallback to mock data
  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    // Clear old cached data
    localStorage.removeItem('kazihub_professionals');
    localStorage.removeItem('kazihub_ng_professionals_v2');
    localStorage.removeItem('kazihub_ng_professionals_v5');
    localStorage.removeItem('kazihub_ng_professionals_v9');
    localStorage.removeItem('kazihub_ng_professionals_v10');
    const saved = localStorage.getItem('kazihub_ng_professionals_v11');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROFESSIONALS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    localStorage.removeItem('kazihub_bookings');
    localStorage.removeItem('kazihub_ng_bookings_v2');
    localStorage.removeItem('kazihub_ng_bookings_v5');
    localStorage.removeItem('kazihub_ng_bookings_v9');
    localStorage.removeItem('kazihub_ng_bookings_v10');
    localStorage.removeItem('kazihub_ng_bookings_v11');
    const saved = localStorage.getItem('kazihub_ng_bookings_v12');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BOOKINGS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    localStorage.removeItem('kazihub_messages');
    localStorage.removeItem('kazihub_ng_messages_v2');
    localStorage.removeItem('kazihub_ng_messages_v5');
    localStorage.removeItem('kazihub_ng_messages_v9');
    localStorage.removeItem('kazihub_ng_messages_v10');
    const saved = localStorage.getItem('kazihub_ng_messages_v11');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MESSAGES;
  });

  // Customer's saved/favorited artisans -- lifted up from CustomerDashboard so ProfileView can
  // also read it (for the saved-artisans preview) without duplicating state.
  const [savedProIds, setSavedProIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('kazihub_ng_saved_pro_ids_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ['p1', 'p3'];
  });

  useEffect(() => {
    localStorage.setItem('kazihub_ng_saved_pro_ids_v1', JSON.stringify(savedProIds));
  }, [savedProIds]);

  const toggleSaveProfessional = useCallback((proId: string) => {
    setSavedProIds(prev => prev.includes(proId) ? prev.filter(id => id !== proId) : [...prev, proId]);
  }, []);

  // Modals state -- booking creation stays a plain in-app action, not a URL (it's a transient
  // form flow, not content anyone bookmarks/shares). The professional-profile "modal" and the
  // active chat conversation are now driven by the URL instead (see the Routes tree below).
  const [bookingTargetPro, setBookingTargetPro] = useState<Professional | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'All'>('All');

  // Currently logged in professional partner view
  const [activeProId, setActiveProId] = useState<string>('p1');
  const rawPro = professionals.find(p => p.id === activeProId) || professionals[0];

  const [customerAvatar, setCustomerAvatar] = useState<string>(() => {
    if (user?.profile_picture) return user.profile_picture;
    let avatarUrl = '';
    if (user?.id) {
      avatarUrl = localStorage.getItem(`kazihub_avatar_${user.id}`) || '';
    } else {
      avatarUrl = localStorage.getItem('kazihub_customer_avatar') || '';
    }
    if (avatarUrl.includes('images.unsplash.com/photo-1531746020798-e6953c6e8e04')) {
      return '';
    }
    return avatarUrl;
  });

  useEffect(() => {
    if (user?.profile_picture) {
      setCustomerAvatar(user.profile_picture);
      return;
    }
    let stored = '';
    if (user?.id) {
      stored = localStorage.getItem(`kazihub_avatar_${user.id}`) || '';
    } else {
      stored = localStorage.getItem('kazihub_customer_avatar') || '';
    }
    if (stored.includes('images.unsplash.com/photo-1531746020798-e6953c6e8e04')) {
      stored = '';
    }
    setCustomerAvatar(stored);
  }, [user?.id, user?.profile_picture]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`kazihub_avatar_${user.id}`, customerAvatar);
    } else {
      localStorage.setItem('kazihub_customer_avatar', customerAvatar);
    }
  }, [customerAvatar, user?.id]);

  // Dynamically compute active professional details from logged-in user when in artisan mode
  const activeProfessional: Professional = React.useMemo(() => {
    if (user && user.role === 'artisan') {
      let userCustomAvatar = user.profile_picture || customerAvatar || localStorage.getItem(`kazihub_avatar_${user.id}`) || '';
      if (userCustomAvatar.includes('images.unsplash.com/photo-1531746020798-e6953c6e8e04')) {
        userCustomAvatar = '';
      }
      return {
        ...rawPro,
        id: user.id || rawPro.id,
        name: `${user.first_name} ${user.last_name}`.trim() || rawPro.name,
        email: user.email || rawPro.email,
        phone_number: user.phone_number || rawPro.phone_number,
        state: user.state ? `${user.state}, Nigeria` : rawPro.state,
        is_verified: localStorage.getItem(`kazihub_kyc_completed_${user.id}`) === 'true',
        verificationStatus: localStorage.getItem(`kazihub_kyc_completed_${user.id}`) === 'true' ? 'verified' : 'unverified',
        profile_picture: userCustomAvatar,
      };
    }
    return rawPro;
  }, [user, rawPro, customerAvatar]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`kazihub_notifications_${activeProId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'notif-1',
        type: 'new_job',
        title: 'New Job Request',
        description: 'Nneka Okonkwo requested a Kitchen Wall Socket repair.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isRead: false,
        relatedId: 'b1'
      },
      {
        id: 'notif-2',
        type: 'new_message',
        title: 'New Message Received',
        description: 'Nneka Okonkwo: "Good morning Engr. Babatunde, are you available tomorrow..."',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        relatedId: 'messages'
      },
      {
        id: 'notif-3',
        type: 'upcoming_booking',
        title: 'Upcoming Booking Reminder',
        description: 'You have a scheduled job "Kitchen Wall Socket repair" tomorrow at 10:00 AM.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        relatedId: 'b1'
      },
      {
        id: 'notif-4',
        type: 'job_accepted',
        title: 'Job Accepted',
        description: 'You accepted the job request from Nneka Okonkwo.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        relatedId: 'b1'
      },
      {
        id: 'notif-5',
        type: 'job_cancelled',
        title: 'Job Cancelled',
        description: 'Your booking request with Segun Oladipo was cancelled.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        relatedId: 'b3'
      }
    ];
  });

  const [customerNotifications, setCustomerNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem(`kazihub_customer_notifications_c1`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'cn1',
        title: 'Booking Accepted',
        desc: 'Engr. Babatunde Lawal accepted your Inverter & Solar Installation booking request.',
        time: '10 mins ago',
        read: false,
        isRead: false,
        type: 'booking',
        relatedTab: 'bookings'
      },
      {
        id: 'cn2',
        title: 'Work Completion Submitted',
        desc: 'Engr. Babatunde Lawal submitted completion details & photos for your inverter installation.',
        time: '1 hour ago',
        read: false,
        isRead: false,
        type: 'completion',
        relatedTab: 'bookings'
      },
      {
        id: 'cn3',
        title: 'Payment Secured',
        desc: 'Your payment of ₦48,000 has been received and is safely held until job confirmation.',
        time: '1 day ago',
        read: true,
        isRead: true,
        type: 'payment',
        relatedTab: 'bookings'
      },
      {
        id: 'cn4',
        title: 'Post-Completion Warranty Active',
        desc: '4-day window active to inspect solar installation and report any issues before job closure.',
        time: '2 days ago',
        read: true,
        isRead: true,
        type: 'warranty',
        relatedTab: 'bookings'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`kazihub_customer_notifications_c1`, JSON.stringify(customerNotifications));
  }, [customerNotifications]);

  useEffect(() => {
    localStorage.setItem(`kazihub_notifications_${activeProId}`, JSON.stringify(notifications));
  }, [notifications, activeProId]);

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kazihub_language');
    if (saved) return saved as Language;
    return 'English (Nigeria)';
  });

  useEffect(() => {
    localStorage.setItem('kazihub_language', currentLanguage);
  }, [currentLanguage]);

  // Automatic Availability Management: When logged in as professional, set is_available_now = true. When leaving/unloading/visibility hidden/logout/switch role, set is_available_now = false.
  useEffect(() => {
    if (currentRole === 'professional') {
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: true } : p));
    }
  }, [currentRole, activeProId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: false } : p));
      } else if (document.visibilityState === 'visible' && currentRole === 'professional') {
        setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: true } : p));
      }
    };

    const handleBeforeUnload = () => {
      const proList = JSON.parse(localStorage.getItem('kazihub_ng_professionals_v10') || '[]');
      const updated = proList.map((p: any) => p.id === activeProId ? { ...p, is_available_now: false } : p);
      localStorage.setItem('kazihub_ng_professionals_v10', JSON.stringify(updated));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: false } : p));
    };
  }, [activeProId, currentRole]);

  const handleLogout = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: false } : p));
    authLogout();
    navigate('/', { replace: true });
  };

  const handleDeleteAccount = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: false } : p));
    navigate('/', { replace: true });
  };

  const handleDeactivateAccount = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, is_available_now: false } : p));
    navigate('/home');
  };

  // Auto-completion window: completed_by_artisan -> paid_out after 4 days with no customer response
  // (mirrors the backend's auto_completion_deadline). Archiving old paid_out/cancelled bookings out of
  // the default view is a separate, purely client-side concern -- see isBookingArchived in utils.ts.
  useEffect(() => {
    const checkAutoCompletions = () => {
      const now = new Date().getTime();
      const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
      let updated = false;
      const newBookings = bookings.map(b => {
        if (b.status === 'completed_by_artisan' && b.completionDetails?.submittedAt) {
          const submittedTime = new Date(b.completionDetails.submittedAt).getTime();
          if (now - submittedTime >= FOUR_DAYS_MS) {
            updated = true;
            return {
              ...b,
              status: 'paid_out' as const,
              completedAt: b.completedAt || new Date().toISOString()
            };
          }
        }

        return b;
      });
      if (updated) {
        setBookings(newBookings);
      }
    };

    checkAutoCompletions();
    const interval = setInterval(checkAutoCompletions, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('kazihub_ng_professionals_v10', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kazihub_ng_bookings_v12', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('kazihub_ng_messages_v10', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('kazihub_dark_mode_v2', darkMode ? 'true' : 'false');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Dark mode here is a manual toggle, not the OS's prefers-color-scheme, so the status-bar
    // color (theme-color) has to follow this state directly rather than a media query.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#09090b' : '#fafafa');
  }, [darkMode]);

  // Handlers
  const handleCreateBooking = (bookingData: Omit<Booking, 'id' | 'created_at' | 'status'>) => {
    const isQuoteRequired = bookingData.servicePricingType === 'quote_required';
    const newBooking: Booking = {
      ...bookingData,
      id: isQuoteRequired ? `req-${Date.now()}` : `b-${Date.now()}`,
      status: isQuoteRequired ? 'quote_requested' : 'pending',
      created_at: new Date().toISOString()
    };
    setBookings([newBooking, ...bookings]);

    // Also add opening chat message
    const initialMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      bookingId: newBooking.id,
      senderId: 'c1',
      senderName: bookingData.customerName,
      senderRole: 'customer',
      recipientId: bookingData.artisan_id,
      message: isQuoteRequired
        ? `Hello! I have submitted a service quote request for "${bookingData.title || bookingData.category}" (Preferred date: ${bookingData.scheduled_date}, ${bookingData.timeSlot}). Scope: ${bookingData.description}. Please review and send a custom quote.`
        : `Hello! I have booked your service (${bookingData.title || bookingData.category}) for ${bookingData.scheduled_date} (${bookingData.timeSlot}). Issue: ${bookingData.description}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, initialMsg]);

    // Add notification for professional
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'new_job',
      title: isQuoteRequired ? 'New Service Quote Request' : 'New Job Booking Request',
      description: isQuoteRequired
        ? `${bookingData.customerName} submitted a quote request for "${bookingData.title || bookingData.category}".`
        : `${bookingData.customerName} requested a ${bookingData.title || bookingData.category} for ${bookingData.scheduled_date} at ${bookingData.timeSlot}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedId: newBooking.id
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updateObj: Partial<Booking> = { status, ...(extra || {}) };
        if (status === 'paid_out' && !b.completedAt && !updateObj.completedAt) {
          updateObj.completedAt = new Date().toISOString();
        }
        return { ...b, ...updateObj };
      }
      return b;
    }));
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
  };

  const handleAddReview = (proId: string, rating: number, comment: string) => {
    const clientFullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0] : 'Client';
    setProfessionals(prev => prev.map(pro => {
      if (pro.id !== proId) return pro;
      const newReview = {
        id: `rev-${Date.now()}`,
        customerId: user?.id || 'c1',
        customerName: clientFullName,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0]
      };
      const updatedReviews = [newReview, ...(pro.reviews || [])];
      const newAvgRating = Number((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));
      return {
        ...pro,
        reviews: updatedReviews,
        rating: newAvgRating,
        reviewCount: updatedReviews.length
      };
    }));
  };

  const handleUpdateProfile = (updated: Partial<Professional>) => {
    if (updated.profile_picture && user?.id) {
      localStorage.setItem(`kazihub_avatar_${user.id}`, updated.profile_picture);
      setCustomerAvatar(updated.profile_picture);
    }
    setProfessionals(prev => prev.map(p => {
      if (p.id === activeProfessional.id) {
        return { ...p, ...updated };
      }
      return p;
    }));
  };

  const handleProfessionalSendMessage = (customerId: string, text: string, mediaProps?: Partial<ChatMessage>) => {
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: activeProfessional.id,
      senderName: activeProfessional.name,
      senderRole: 'professional',
      recipientId: customerId,
      message: text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...mediaProps
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleCustomerSendMessage = (proId: string, text: string, mediaProps?: Partial<ChatMessage>) => {
    const clientFullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0] : 'Client';
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: user?.id || 'c1',
      senderName: clientFullName,
      senderRole: 'customer',
      recipientId: proId,
      message: text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...mediaProps
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleCustomerMarkAsRead = useCallback((proId: string) => {
    setMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.senderId === proId && m.recipientId === 'c1' && m.status !== 'read') {
          changed = true;
          return { ...m, status: 'read' as const };
        }
        return m;
      });
      return changed ? next : prev;
    });
  }, []);

  const handleProfessionalMarkAsRead = useCallback((customerId: string) => {
    setMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.senderId === customerId && m.recipientId === activeProfessional.id && m.status !== 'read') {
          changed = true;
          return { ...m, status: 'read' as const };
        }
        return m;
      });
      return changed ? next : prev;
    });
  }, [activeProfessional.id]);

  const roleBookings = bookings.filter(b => currentRole === 'customer' ? b.client_id === 'c1' : b.artisan_id === activeProfessional.id);

  const commonAppShellProps = {
    currentRole,
    currentLanguage,
    onOpenAuthPage: (view?: 'signin' | 'signup') => navigate(view === 'signup' ? '/signup' : '/'),
    unreadCount: messages.filter(m => m.recipientId === (currentRole === 'customer' ? 'c1' : activeProfessional.id) && m.status !== 'read').length,
    notificationsUnreadCount: currentRole === 'customer'
      ? customerNotifications.filter(n => !n.read && !n.isRead).length
      : notifications.filter(n => !n.isRead).length,
    onOpenChats: () => handleTabChange('messages'),
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    selectedCategoryFilter,
    onSelectCategoryFilter: setSelectedCategoryFilter,
    onTabChange: handleTabChange,
    pageSubtitle,
    professionals,
    bookings: roleBookings,
    activeProfessional,
    customerAvatar,
    onLogout: handleLogout,
  };

  const commonCustomerProps = {
    professionals,
    bookings: bookings.filter(b => b.client_id === 'c1'),
    messages,
    onSendMessage: handleCustomerSendMessage,
    onMarkAsRead: handleCustomerMarkAsRead,
    onSelectProForProfile: (pro: Professional) => navigate(`/professionals/${pro.id}`),
    onOpenBooking: (pro: Professional) => setBookingTargetPro(pro),
    onOpenChat: (pro: Professional) => navigate(`/messages/${pro.id}`),
    selectedCategoryFilter,
    onSelectCategoryFilter: setSelectedCategoryFilter,
    onCancelBooking: handleCancelBooking,
    onUpdateBookingStatus: handleUpdateBookingStatus,
    onAddReview: handleAddReview,
    onTabChange: handleTabChange,
    onLogout: handleLogout,
    onDeleteAccount: handleDeleteAccount,
    onDeactivateAccount: handleDeactivateAccount,
    customerNotifications,
    onUpdateCustomerNotifications: setCustomerNotifications,
    savedProIds,
    onToggleSavePro: toggleSaveProfessional,
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
  };

  const commonProfessionalProps = {
    professional: activeProfessional,
    bookings: bookings.filter(b => b.artisan_id === activeProfessional.id),
    onUpdateBookingStatus: handleUpdateBookingStatus,
    onUpdateProfile: handleUpdateProfile,
    onTabChange: handleTabChange,
    onManagePortfolio: () => {
      setProfileScrollTarget('work-portfolio');
      handleTabChange('profile');
    },
    unreadCount: messages.filter(m => m.recipientId === activeProfessional.id && m.status !== 'read').length,
    messages: messages.filter(m => m.recipientId === activeProfessional.id || m.senderId === activeProfessional.id),
    onSendMessage: handleProfessionalSendMessage,
    onMarkAsRead: handleProfessionalMarkAsRead,
    onLogout: handleLogout,
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    notifications,
    onUpdateNotifications: setNotifications,
    onPageSubtitleChange: setPageSubtitle,
  };

  const suspenseFallback = <div className="w-full py-24 flex items-center justify-center text-sm text-zinc-400">Loading&hellip;</div>;

  // After signing in, return the user to whatever protected URL they originally tried to visit
  // (preserved by RequireAuth via location state) instead of always the role home. Role itself
  // needs no handling here -- it's derived from `user` (already set by the AuthContext call that
  // resolved before this fires), not a client-side value this callback has to set.
  const handleAuthSuccess = () => {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from || '/home', { replace: true });
  };

  const profileModalProps = {
    onOpenBooking: (pro: Professional) => setBookingTargetPro(pro),
    onOpenChat: (pro: Professional) => navigate(`/messages/${pro.id}`),
    onAddReview: handleAddReview,
    onClose: () => navigate(-1),
  };

  return (
    <>
      <Toaster richColors theme={darkMode ? 'dark' : 'light'} />
      <Routes>
        {/* Public / pre-auth -- AuthPage renders regardless of auth state (matches the previous
            showFullAuthPage behavior, which let an already-signed-in user reach it manually too),
            and syncs its own internal view state with these 5 real URLs (see AuthPage.tsx). */}
        <Route path="/" element={<AuthPage initialView="signin" onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/signup" element={<AuthPage initialView="signup" onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/verify-email" element={<AuthPage initialView="verify" onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/forgot-password" element={<AuthPage initialView="forgot" onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/reset-password" element={<AuthPage initialView="reset" onAuthSuccess={handleAuthSuccess} />} />

        {/* Authenticated. Every path below is a clean, resource-oriented URL with no role segment
            -- role decides *access* (via nested RequireRole guards for the pages that are
            genuinely role-specific), never the URL shape. Shared pages (same conceptual page for
            both roles) get one route each, rendering whichever dashboard component matches the
            authenticated user's actual role -- never a client-side override. */}
        <Route element={<RequireAuth />}>
          <Route path="/home" element={
            <AppShell {...commonAppShellProps} activeTab="explore">
              <Suspense fallback={suspenseFallback}>
                {currentRole === 'professional'
                  ? <ProfessionalDashboard {...commonProfessionalProps} activeTab="explore" />
                  : <CustomerDashboard {...commonCustomerProps} activeTab="explore" />}
              </Suspense>
            </AppShell>
          } />
          <Route path="/messages" element={
            <AppShell {...commonAppShellProps} activeTab="messages">
              <Suspense fallback={suspenseFallback}>
                {currentRole === 'professional'
                  ? <ProfessionalDashboard {...commonProfessionalProps} activeTab="messages" />
                  : <CustomerDashboard {...commonCustomerProps} activeTab="messages" />}
              </Suspense>
            </AppShell>
          } />
          <Route path="/messages/:contactId" element={
            <AppShell {...commonAppShellProps} activeTab="messages">
              <Suspense fallback={suspenseFallback}>
                <MessagesRoute
                  currentRole={currentRole}
                  customerProps={{ ...commonCustomerProps, activeTab: 'messages' }}
                  professionalProps={{ ...commonProfessionalProps, activeTab: 'messages' }}
                />
              </Suspense>
            </AppShell>
          } />
          <Route path="/notifications" element={
            <AppShell {...commonAppShellProps} activeTab="notifications">
              <Suspense fallback={suspenseFallback}>
                {currentRole === 'professional' ? (
                  <ProfessionalNotifications
                    notifications={notifications}
                    onNotificationClick={(notification) => {
                      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                      if (notification.relatedId === 'messages') {
                        handleTabChange('messages');
                      } else if (notification.relatedId) {
                        handleTabChange('jobs');
                      }
                    }}
                    onMarkAllAsRead={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    }}
                    onMarkAsRead={(id) => {
                      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                    }}
                  />
                ) : (
                  <CustomerDashboard {...commonCustomerProps} activeTab="notifications" />
                )}
              </Suspense>
            </AppShell>
          } />

          {/* Customer-only: not a shared page, no customer equivalent for RequireRole to gate the
              other way. A signed-in artisan hitting these is redirected to /home (+ toast). */}
          <Route element={<RequireRole allow={['customer']} />}>
            <Route path="/search" element={
              <AppShell {...commonAppShellProps} activeTab="search">
                <Suspense fallback={suspenseFallback}>
                  <CustomerDashboard {...commonCustomerProps} activeTab="search" />
                </Suspense>
              </AppShell>
            } />
            <Route path="/bookings" element={
              <AppShell {...commonAppShellProps} activeTab="bookings">
                <Suspense fallback={suspenseFallback}>
                  <CustomerDashboard {...commonCustomerProps} activeTab="bookings" />
                </Suspense>
              </AppShell>
            } />
            <Route path="/saved" element={
              <AppShell {...commonAppShellProps} activeTab="saved">
                <Suspense fallback={suspenseFallback}>
                  <CustomerDashboard {...commonCustomerProps} activeTab="saved" />
                </Suspense>
              </AppShell>
            } />
          </Route>

          {/* Artisan-only: renders a completely different UI (accept/start/complete a job, not
              cancel-a-booking) with no customer equivalent, so these stay distinct routes -- just
              without a role prefix. A signed-in customer hitting these is redirected to /home. */}
          <Route element={<RequireRole allow={['professional']} />}>
            <Route path="/jobs" element={
              <AppShell {...commonAppShellProps} activeTab="jobs">
                <Suspense fallback={suspenseFallback}>
                  <ProfessionalDashboard {...commonProfessionalProps} activeTab="jobs" />
                </Suspense>
              </AppShell>
            } />
            <Route path="/jobs/:bookingId" element={
              <AppShell {...commonAppShellProps} activeTab="jobs">
                <Suspense fallback={suspenseFallback}>
                  <ProfessionalJobsRoute {...commonProfessionalProps} activeTab="jobs" />
                </Suspense>
              </AppShell>
            } />
            <Route path="/gigs" element={
              <AppShell {...commonAppShellProps} activeTab="gigs">
                <Suspense fallback={suspenseFallback}>
                  <ProfessionalDashboard {...commonProfessionalProps} activeTab="gigs" />
                </Suspense>
              </AppShell>
            } />
            <Route path="/gigs/new" element={
              <AppShell {...commonAppShellProps} activeTab="gigs">
                <Suspense fallback={suspenseFallback}>
                  <ProfessionalGigsNewRoute {...commonProfessionalProps} activeTab="gigs" />
                </Suspense>
              </AppShell>
            } />
          </Route>

          <Route path="/profile" element={
            <AppShell {...commonAppShellProps} activeTab="profile">
              <Suspense fallback={suspenseFallback}>
                <ProfileView
                  currentRole={currentRole}
                  activeProfessional={activeProfessional}
                  bookings={roleBookings}
                  professionals={professionals}
                  savedProIds={savedProIds}
                  customerAvatar={customerAvatar}
                  onUpdateCustomerAvatar={setCustomerAvatar}
                  onUpdateProfile={handleUpdateProfile}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  onLogout={handleLogout}
                  onTabChange={handleTabChange}
                  scrollToSection={profileScrollTarget}
                  onScrollToSectionHandled={() => setProfileScrollTarget(null)}
                  onDeleteAccount={() => {
                    if (window.confirm('Are you sure you want to permanently delete your KaziHub account? All bookings and history will be removed.')) {
                      handleLogout();
                    }
                  }}
                />
              </Suspense>
            </AppShell>
          } />
          <Route path="/settings" element={
            <AppShell {...commonAppShellProps} activeTab="settings">
              <Suspense fallback={suspenseFallback}>
                <SettingsView
                  currentRole={currentRole}
                  activeProfessional={activeProfessional}
                  bookings={roleBookings}
                  customerAvatar={customerAvatar}
                  onUpdateCustomerAvatar={setCustomerAvatar}
                  onUpdateProfile={handleUpdateProfile}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  onLogout={handleLogout}
                  onDeleteAccount={() => {
                    if (window.confirm('Are you sure you want to permanently delete your KaziHub account? All bookings and history will be removed.')) {
                      handleLogout();
                    }
                  }}
                />
              </Suspense>
            </AppShell>
          } />

          {/* Public artisan profile -- was a modal with no URL, now a real, directly-loadable
              route. Rendered inside the same AppShell chrome it always appeared over, so it looks
              identical to today; closing it (X button) uses real browser history (navigate(-1)). */}
          <Route path="/professionals/:id" element={
            <AppShell {...commonAppShellProps} activeTab="explore">
              <ProfessionalProfileRoute professionals={professionals} {...profileModalProps} />
            </AppShell>
          } />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <BookingModal
        professional={bookingTargetPro}
        isOpen={!!bookingTargetPro}
        onClose={() => setBookingTargetPro(null)}
        onSubmitBooking={handleCreateBooking}
        onOpenChatWithPro={(pro) => {
          setBookingTargetPro(null);
          navigate(`/messages/${pro.id}`);
        }}
      />
    </>
  );
}
