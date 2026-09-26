import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Role, Professional, Booking, ChatMessage, Category, Notification, Gig, SavedArtisanSummary } from './types';
import { Language, languageFromStored } from './translations';
import { INITIAL_PROFESSIONALS, INITIAL_BOOKINGS } from './mockData';
import { AppShell } from './components/AppShell';
import { ProfessionalProfileModal } from './components/ProfessionalProfileModal';
import { BookingModal, BookingRequestInput } from './components/BookingModal';
import { BuyGigSheet } from './components/BuyGigSheet';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { hasPendingSearch } from './lib/pendingSearch';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';
import { NotFound } from './components/NotFound';
import { useAuth } from './context/AuthContext';
import { useDocumentMeta } from './hooks/useDocumentMeta';
import { useAccountFrozen, FROZEN_ACTION_MESSAGE } from './hooks/useAccountFrozen';
import {
  BookingResponse, listMyBookings, bookingFromResponse, createFixedBooking, requestQuote, acceptBooking, declineBooking,
  sendQuote, submitCompletion, acceptQuote, confirmCompletion, disputeBooking, cancelBooking, createReview, buyGig,
} from './lib/bookingsApi';
import { NotificationResponse, listNotifications, markNotificationRead, markAllNotificationsRead } from './lib/notificationsApi';
import { FavoriteResponse, listFavorites, saveFavorite, removeFavorite } from './lib/favoritesApi';
import {
  ConversationResponse, MessageResponse, MessageCreate, listConversations, listMessages, startConversation, sendMessage,
  markConversationRead, uploadChatMedia,
} from './lib/chatApi';
import { timeAgo } from './utils';
import { useVisualViewportHeight } from './hooks/useVisualViewportHeight';
import { Toaster, toast } from 'sonner';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ProfessionalDashboard } from './components/ProfessionalDashboard';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { ProfessionalNotifications } from './components/ProfessionalNotifications';
import {
  listProfiles, getProfileDetail, getMyProfile, saveMyProfile, listMyServices, listMyPortfolio,
  isBrowsableProfile, profileToProfessional, profileDetailToProfessional, mapService, mapPortfolioItem,
} from './lib/profilesApi';

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
  const { view } = useParams();
  if (view && view !== 'new') return <NotFound />;
  return <ProfessionalDashboard {...props} forceGigCreation={view === 'new'} />;
}
function ProfessionalProfileRoute({
  professionals,
  onNeedDetail,
  ...rest
}: { professionals: Professional[]; onNeedDetail: (id: string) => void } & Omit<React.ComponentProps<typeof ProfessionalProfileModal>, 'professional' | 'isOpen' | 'onClose'> & { onClose: () => void }) {
  const { id } = useParams();
  const professional = professionals.find(p => p.id === id) || null;
  useEffect(() => {
    if (id) onNeedDetail(id);
  }, [id, onNeedDetail]);
  useDocumentMeta(
    professional ? professional.name : 'Professional not found',
    professional ? `${professional.name} -- ${professional.category} on KaziHub.` : 'This professional profile could not be found.'
  );
  if (!professional) return <NotFound />;
  return <ProfessionalProfileModal {...rest} professional={professional} isOpen />;
}

const errorTextOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

export default function App() {
  const { user, logout: authLogout, isDemo } = useAuth();
  // Frozen accounts can't take state-changing actions; every mutating handler below checks this first.
  const { isFrozen, blockIfFrozen } = useAccountFrozen();
  const navigate = useNavigate();
  const location = useLocation();
  useVisualViewportHeight();

  // The authenticated user's role is the sole authority here -- there is no client-side override.
  // A previous iteration kept this as togglable state (a demo "preview both dashboards" feature),
  // but that let any authenticated user flip which dashboard rendered independent of their real
  // backend role, which is exactly the RBAC hole route guards below close. If a dev-only "preview
  // as the other role" tool is wanted later, it belongs in a separate dev-only mechanism, not here.
  const currentRole: Role = user?.role === 'artisan' ? 'professional' : 'customer';

  // Set when an overlay route (the artisan profile) was opened over another page, which keeps
  // rendering underneath -- so scroll bookkeeping and the main <Routes> follow that page instead.
  const backgroundLocation = (location.state as { backgroundLocation?: ReturnType<typeof useLocation> } | null)?.backgroundLocation;
  // Keyed by page, not full URL: /jobs and /jobs/:id are the same page with a sheet open.
  const pageKey = '/' + (backgroundLocation || location).pathname.split('/')[1];
  const pageScrollPositionsRef = useRef<Record<string, number>>({});
  // Set alongside a tab change by any CTA that names a specific section (e.g. "Manage Portfolio")
  // so the target page can scroll straight to that section instead of just landing at its top.
  const [profileScrollTarget, setProfileScrollTarget] = useState<string | null>(null);

  // Continuously record scroll position for the current page
  useEffect(() => {
    const handleScroll = () => {
      pageScrollPositionsRef.current[pageKey] = window.scrollY || document.documentElement.scrollTop || 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageKey]);

  // Restore or reset scroll position when the route changes
  useEffect(() => {
    const targetY = pageScrollPositionsRef.current[pageKey] ?? 0;

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
  }, [pageKey]);

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

  // Real, signed-up artisans fetched from the backend's public directory (GET /profiles/), merged
  // alongside the mock roster above so the catalog looks fuller while few real artisans have
  // signed up. Not persisted to localStorage -- this is server-owned data, refetched each load.
  const [realProfessionals, setRealProfessionals] = useState<Professional[]>([]);
  const realProfileIdsRef = useRef<Set<string>>(new Set());
  const fetchedDetailIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    // No available_only: the backend reads it as "online right now" (availability_status), not
    // "accepting work", so it hides every artisan who isn't currently online.
    listProfiles({ limit: 100 })
      .then(({ data }) => {
        if (cancelled) return;
        const mapped = data.filter(isBrowsableProfile).map(profileToProfessional);
        realProfileIdsRef.current = new Set(mapped.map(p => p.id));
        setRealProfessionals(mapped);
      })
      .catch((err) => console.warn('Could not load professionals from the server', err));
    return () => { cancelled = true; };
  }, []);

  // The directory listing above has no services/portfolio/reviews -- fetched lazily the first time
  // a real artisan's profile is actually opened (see ProfessionalProfileRoute's onNeedDetail).
  const loadProfessionalDetail = useCallback((id: string) => {
    if (!realProfileIdsRef.current.has(id) || fetchedDetailIdsRef.current.has(id)) return;
    fetchedDetailIdsRef.current.add(id);
    getProfileDetail(id)
      .then((detail) => {
        const enriched = profileDetailToProfessional(detail);
        setRealProfessionals(prev => prev.map(p => (p.id === id ? enriched : p)));
      })
      .catch((err) => {
        fetchedDetailIdsRef.current.delete(id);
        console.warn('Could not load professional detail', err);
      });
  }, []);

  const allProfessionals = useMemo(
    () => [...professionals, ...realProfessionals],
    [professionals, realProfessionals]
  );

  // Sample bookings for the demo account only (it has no backend session). Real accounts use
  // serverBookings below, loaded from GET /bookings/me.
  const [demoBookings, setDemoBookings] = useState<Booking[]>(() => {
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
    // v11 held the old sample conversation; chats now start empty, even on the demo account.
    localStorage.removeItem('kazihub_ng_messages_v11');
    const saved = localStorage.getItem('kazihub_ng_messages_v12');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
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
    if (blockIfFrozen()) return;
    setSavedProIds(prev => prev.includes(proId) ? prev.filter(id => id !== proId) : [...prev, proId]);
  }, [blockIfFrozen]);

  // Modals state -- booking creation stays a plain in-app action, not a URL (it's a transient
  // form flow, not content anyone bookmarks/shares). The professional-profile "modal" and the
  // active chat conversation are now driven by the URL instead (see the Routes tree below).
  const [bookingTargetPro, setBookingTargetPro] = useState<Professional | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'All'>('All');

  // Currently logged in professional partner view
  const [activeProId] = useState<string>('p1');
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

  // The logged-in artisan's own backend profile (GET /profiles/me). Services/portfolio edits aren't
  // wired to their endpoints yet, so those are merged into this state locally (handleUpdateProfile).
  const isArtisan = user?.role === 'artisan';
  const artisanFullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const [myProfessional, setMyProfessional] = useState<Professional | null>(null);
  useEffect(() => {
    if (!isArtisan || !user) {
      setMyProfessional(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      getMyProfile(),
      listMyServices().catch((err) => { console.warn('Could not load your services', err); return []; }),
      listMyPortfolio().catch((err) => { console.warn('Could not load your portfolio', err); return []; }),
    ])
      .then(([profile, services, portfolio]) => {
        if (cancelled) return;
        setMyProfessional({
          ...profileToProfessional(profile),
          services: services.map(mapService),
          portfolio: portfolio.map(mapPortfolioItem),
        });
        // The public directory's only name field is business_name, and the product has no
        // business-name concept -- so it carries the artisan's own name. Backfill it for
        // profiles created before this existed.
        if (!profile.business_name?.trim() && artisanFullName) {
          saveMyProfile({ business_name: artisanFullName }).catch((err) => console.warn('Could not sync public name', err));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Could not load your artisan profile', err);
        setMyProfessional(profileToProfessional({
          id: user.id, user_id: user.id, category: '', skills: [], years_of_experience: 0,
          state: user.state, is_available: true, is_verified: false,
        }));
      });
    return () => { cancelled = true; };
  }, [isArtisan, user?.id]);

  const activeProfessional: Professional = React.useMemo(() => {
    if (user && user.role === 'artisan') {
      let userCustomAvatar = user.profile_picture || customerAvatar || localStorage.getItem(`kazihub_avatar_${user.id}`) || '';
      if (userCustomAvatar.includes('images.unsplash.com/photo-1531746020798-e6953c6e8e04')) {
        userCustomAvatar = '';
      }
      const base = myProfessional ?? profileToProfessional({
        id: user.id, user_id: user.id, category: '', skills: [], years_of_experience: 0,
        state: user.state, is_available: true, is_verified: false,
      });
      return {
        ...base,
        id: user.id,
        name: artisanFullName || base.name,
        email: user.email,
        phone_number: user.phone_number,
        state: user.state ? `${user.state}, Nigeria` : base.state,
        // Real accounts: the backend profile's is_verified (set when an admin approves verification).
        // The demo account keeps its local sample flag.
        is_verified: isDemo ? localStorage.getItem(`kazihub_kyc_completed_${user.id}`) === 'true' : base.is_verified,
        verificationStatus: (isDemo ? localStorage.getItem(`kazihub_kyc_completed_${user.id}`) === 'true' : base.is_verified) ? 'verified' : 'unverified',
        profile_picture: userCustomAvatar,
      };
    }
    return rawPro;
  }, [user, rawPro, customerAvatar, myProfessional, artisanFullName, isDemo]);

  const usesBackendBookings = Boolean(user) && !isDemo;
  const [serverBookings, setServerBookings] = useState<BookingResponse[]>([]);
  const reloadBookings = useCallback(async () => {
    setServerBookings(await listMyBookings());
  }, []);
  useEffect(() => {
    if (!usesBackendBookings) {
      setServerBookings([]);
      return;
    }
    reloadBookings().catch((err) => console.warn('Could not load your bookings', err));
  }, [usesBackendBookings, user?.id, reloadBookings]);

  // A booking only carries client_id / artisan_id. The artisan's name comes from the directory;
  // a client's name isn't available to anyone but that client yet (no endpoint returns it).
  const bookingNames = (b: { artisan_id: string; client_id: string }) => {
    const ownArtisanBooking = isArtisan && user?.id === b.artisan_id;
    const pro = allProfessionals.find(p => p.user_id === b.artisan_id);
    return {
      professionalName: ownArtisanBooking ? artisanFullName : pro?.name || 'Artisan',
      category: ((ownArtisanBooking ? myProfessional?.category : pro?.category) || '') as Category,
      customerName: user?.id === b.client_id ? artisanFullName || 'You' : 'Client',
    };
  };
  const liveBookings = serverBookings.map(b => bookingFromResponse(b, bookingNames(b)));
  const bookings = usesBackendBookings ? liveBookings : demoBookings;

  // Notifications for real accounts come from GET /notifications/; the sample lists above are for
  // the demo account only. (Verified live: the backend doesn't create notifications for booking
  // events yet, so this stays empty until it does -- but it's the real list, not a stand-in.)
  const [serverNotifications, setServerNotifications] = useState<NotificationResponse[]>([]);
  const reloadNotifications = useCallback(async () => {
    setServerNotifications(await listNotifications());
  }, []);

  // No push channel yet, so refresh bookings and notifications every 30s and whenever the app
  // comes back to the foreground -- otherwise a new booking only shows up after a reload.
  useEffect(() => {
    if (!usesBackendBookings) {
      setServerNotifications([]);
      return;
    }
    const refresh = () => {
      reloadBookings().catch(() => undefined);
      reloadNotifications().catch(() => undefined);
    };
    reloadNotifications().catch((err) => console.warn('Could not load notifications', err));
    const interval = setInterval(refresh, 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [usesBackendBookings, user?.id, reloadBookings, reloadNotifications]);

  const notificationKind = (type: string): Notification['type'] => {
    const t = type.toLowerCase();
    if (t.includes('message')) return 'new_message';
    if (t.includes('cancel') || t.includes('decline')) return 'job_cancelled';
    if (t.includes('accept')) return 'job_accepted';
    return 'new_job';
  };
  const liveProNotifications: Notification[] = serverNotifications.map(n => ({
    id: n.id,
    type: notificationKind(n.type),
    title: n.title,
    description: n.message,
    timestamp: n.created_at,
    isRead: n.is_read,
    relatedId: n.booking_id || undefined,
  }));
  const liveCustomerNotifications = serverNotifications.map(n => ({
    id: n.id,
    title: n.title,
    desc: n.message,
    time: timeAgo(n.created_at),
    read: n.is_read,
    isRead: n.is_read,
    type: n.type,
    relatedTab: n.booking_id ? 'bookings' : undefined,
  }));

  /** Marks the given notifications read on the backend (read-all when that's every unread one). */
  const markNotificationsRead = (readIds: string[]) => {
    const unread = serverNotifications.filter(n => !n.is_read).map(n => n.id);
    const toMark = readIds.filter(id => unread.includes(id));
    if (toMark.length === 0) return;
    setServerNotifications(prev => prev.map(n => (toMark.includes(n.id) ? { ...n, is_read: true } : n)));
    const request = toMark.length === unread.length && unread.length > 1
      ? markAllNotificationsRead()
      : Promise.all(toMark.map(markNotificationRead));
    request.catch(() => {
      toast.error('Could not mark that as read. Try again.');
      reloadNotifications().catch(() => undefined);
    });
  };
  const setLiveProNotifications: React.Dispatch<React.SetStateAction<Notification[]>> = (action) => {
    const next = typeof action === 'function' ? action(liveProNotifications) : action;
    markNotificationsRead(next.filter(n => n.isRead).map(n => n.id));
  };
  const setLiveCustomerNotifications = (next: { id: string; read?: boolean; isRead?: boolean }[]) => {
    markNotificationsRead(next.filter(n => n.read || n.isRead).map(n => n.id));
  };


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

  const shownProNotifications = usesBackendBookings ? liveProNotifications : notifications;

  // Saved artisans for real accounts live on the backend (keyed by the artisan's user id); the
  // local list above is the demo account's only.
  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>([]);
  // The full favourites as the backend returns them (name, trade, rating, photo), so saved artisans
  // show even when they aren't in the loaded directory (paused, or beyond the first page).
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const reloadFavorites = useCallback(() => listFavorites()
    .then(list => {
      setFavorites(list);
      setFavoriteUserIds(list.map(f => f.artisan_id));
    })
    .catch((err) => console.warn('Could not load saved artisans', err)), []);
  useEffect(() => {
    if (!usesBackendBookings) {
      setFavoriteUserIds([]);
      setFavorites([]);
      return;
    }
    reloadFavorites();
  }, [usesBackendBookings, user?.id, reloadFavorites]);
  const shownSavedProIds = usesBackendBookings
    ? allProfessionals.filter(p => p.user_id && favoriteUserIds.includes(p.user_id)).map(p => p.id)
    : savedProIds;
  const savedArtisans: SavedArtisanSummary[] = usesBackendBookings
    ? favorites.map(f => {
        const pro = allProfessionals.find(p => p.user_id === f.artisan_id);
        return {
          key: f.artisan_id,
          profileId: pro?.id,
          name: f.business_name?.trim() || pro?.name || 'Artisan',
          category: f.category || pro?.category,
          rating: f.rating_average ?? pro?.rating_average ?? 0,
          avatar: f.avatar_url || pro?.profile_picture,
        };
      })
    : allProfessionals.filter(p => savedProIds.includes(p.id)).map(p => ({
        key: p.id, profileId: p.id, name: p.name, category: p.category, rating: p.rating_average, avatar: p.profile_picture,
      }));

  const handleToggleSavePro = (proId: string) => {
    if (!usesBackendBookings) {
      toggleSaveProfessional(proId);
      return;
    }
    if (blockIfFrozen()) return;
    const artisanUserId = allProfessionals.find(p => p.id === proId)?.user_id;
    if (!artisanUserId) {
      toast.error('This is a sample artisan, so it can’t be saved. Real artisans can be.');
      return;
    }
    const wasSaved = favoriteUserIds.includes(artisanUserId);
    setFavoriteUserIds(prev => (wasSaved ? prev.filter(id => id !== artisanUserId) : [...prev, artisanUserId]));
    (wasSaved ? removeFavorite(artisanUserId) : saveFavorite(artisanUserId)).then(() => reloadFavorites(), (err) => {
      setFavoriteUserIds(prev => (wasSaved ? [...prev, artisanUserId] : prev.filter(id => id !== artisanUserId)));
      toast.error(errorTextOf(err, wasSaved ? 'Could not remove this artisan. Try again.' : 'Could not save this artisan. Try again.'));
    });
  };
  const updateProNotifications = usesBackendBookings ? setLiveProNotifications : setNotifications;
  const shownCustomerNotifications = usesBackendBookings ? liveCustomerNotifications : customerNotifications;
  const updateCustomerNotifications = usesBackendBookings ? setLiveCustomerNotifications : setCustomerNotifications;

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

  // Theme and language are saved on the account (PUT /auth/me), so a sign-in on another device
  // must adopt them rather than whatever this browser last had in localStorage.
  useEffect(() => {
    if (!user) return;
    if (user.theme === 'dark' || user.theme === 'light') {
      setDarkMode(user.theme === 'dark');
    } else if (user.theme === 'system') {
      setDarkMode(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    }
    const lang = languageFromStored(user.preferred_language);
    if (lang) setCurrentLanguage(lang);
  }, [user?.id, user?.theme, user?.preferred_language]);

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

  // Demo only -- for real bookings the backend's own cron does this (auto_completion_deadline).
  // Auto-completion window: completed_by_artisan -> paid_out after 4 days with no customer response
  // (mirrors the backend's auto_completion_deadline). Archiving old paid_out/cancelled bookings out of
  // the default view is a separate, purely client-side concern -- see isBookingArchived in utils.ts.
  useEffect(() => {
    const checkAutoCompletions = () => {
      const now = new Date().getTime();
      const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
      let updated = false;
      const newBookings = demoBookings.map(b => {
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
        setDemoBookings(newBookings);
      }
    };

    checkAutoCompletions();
    const interval = setInterval(checkAutoCompletions, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [demoBookings]);

  useEffect(() => {
    localStorage.setItem('kazihub_ng_professionals_v10', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('kazihub_ng_bookings_v12', JSON.stringify(demoBookings));
  }, [demoBookings]);

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
    // Same for native form chrome (autofill, scrollbars, date pickers): left as "light dark", the
    // browser follows the OS and paints dark autofill onto the light theme.
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Handlers
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  /** Runs a booking action on the backend, then reloads the list either way -- on failure that
   *  also undoes any optimistic change a dashboard already showed. */
  const runBookingAction = async (fn: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await fn();
      toast.success(success);
    } catch (err) {
      toast.error(errorText(err, failure));
    } finally {
      await reloadBookings().catch(() => undefined);
      reloadNotifications().catch(() => undefined);
    }
  };

  const handleCreateBooking = async (input: BookingRequestInput): Promise<Booking> => {
    if (isFrozen) throw new Error(FROZEN_ACTION_MESSAGE);
    if (!usesBackendBookings) throw new Error('Booking isn’t available on the demo account.');
    const artisanId = input.professional.user_id;
    if (!artisanId) throw new Error('This is a sample artisan, so it can’t be booked.');
    const service = input.service;
    const request = {
      artisan_id: artisanId,
      service_title: service?.name || 'General request',
      description: input.description.trim(),
      address: input.address.trim(),
      // Omitted rather than null when empty: an explicit null crashed /bookings/buy-gig when tested.
      ...(input.landmark.trim() ? { landmark_hint: input.landmark.trim() } : {}),
    };
    // Only a fixed-price service is booked at a set amount. "Starting from" and quote-only services
    // go through a quote request, so the artisan sets the final price.
    const created = service?.pricing_type === 'fixed' && (service.price ?? 0) > 0
      ? await createFixedBooking({ ...request, amount: service.price as number })
      : await requestQuote(request);
    setServerBookings(prev => [created, ...prev]);
    return bookingFromResponse(created, bookingNames(created));
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => {
    if (blockIfFrozen()) {
      if (usesBackendBookings) reloadBookings().catch(() => undefined);
      return;
    }
    if (!usesBackendBookings) {
      setDemoBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        const updateObj: Partial<Booking> = { status, ...(extra || {}) };
        if (status === 'paid_out' && !b.completedAt && !updateObj.completedAt) {
          updateObj.completedAt = new Date().toISOString();
        }
        return { ...b, ...updateObj };
      }));
      return;
    }
    const current = bookings.find(b => b.id === bookingId);
    switch (status) {
      case 'accepted':
        return runBookingAction(() => acceptBooking(bookingId), 'Booking accepted. The client can now pay into escrow.', 'Could not accept this booking.');
      case 'quote_sent':
        return runBookingAction(() => sendQuote(bookingId, extra?.amount ?? 0, extra?.quote_breakdown || undefined), 'Quote sent to the client.', 'Could not send this quote.');
      case 'cancelled':
        return current?.status === 'pending'
          ? runBookingAction(() => declineBooking(bookingId), 'Booking declined.', 'Could not decline this booking.')
          : runBookingAction(() => cancelBooking(bookingId), 'Request cancelled.', 'Could not cancel this request.');
      case 'completed_by_artisan':
        return runBookingAction(() => submitCompletion(bookingId), 'Marked as done. The client has 4 days to confirm.', 'Could not mark this job as done.');
      case 'paid_out':
        return runBookingAction(() => confirmCompletion(bookingId), 'Job confirmed. Payment released to the artisan.', 'Could not confirm this job.');
      default:
        toast.error('That step isn’t available yet.');
        reloadBookings().catch(() => undefined);
    }
  };

  const handleAcceptQuote = (bookingId: string) => {
    if (blockIfFrozen()) return;
    runBookingAction(() => acceptQuote(bookingId), 'Quote accepted.', 'Could not accept this quote.');
  };

  /** Resolves to the backend's dispute ticket id, or null when it failed (already explained in a toast). */
  const handleDisputeBooking = async (bookingId: string, reason: string, details: string, evidencePhotos: string[] = []): Promise<string | null> => {
    if (blockIfFrozen()) return null;
    if (!usesBackendBookings) {
      toast.error('Disputes aren’t available on the demo account.');
      return null;
    }
    try {
      const dispute = await disputeBooking(bookingId, reason, details, evidencePhotos);
      return dispute?.ticket_id || null;
    } catch (err) {
      toast.error(errorText(err, 'Could not open a dispute. Try again.'));
      return null;
    } finally {
      await reloadBookings().catch(() => undefined);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (blockIfFrozen()) return;
    if (!usesBackendBookings) {
      setDemoBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b));
      return;
    }
    runBookingAction(() => cancelBooking(bookingId), 'Booking cancelled.', 'Could not cancel this booking.');
  };

  const handleAddReview = (proId: string, rating: number, comment: string) => {
    if (blockIfFrozen()) return;
    if (usesBackendBookings) {
      // Reviews attach to a completed booking (POST /reviews/ needs booking_id).
      const pro = allProfessionals.find(p => p.id === proId);
      const completed = pro?.user_id ? bookings.find(b => b.artisan_id === pro.user_id && b.status === 'paid_out') : undefined;
      if (!completed) {
        toast.error('You can review an artisan once they’ve completed a booking for you.');
        return;
      }
      createReview(completed.id, rating, comment)
        .then(() => {
          toast.success('Thanks, your review is posted.');
          fetchedDetailIdsRef.current.delete(proId);
          loadProfessionalDetail(proId);
        })
        .catch((err) => toast.error(errorText(err, 'Could not post your review.')));
      return;
    }
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
    if (isArtisan) {
      setMyProfessional(prev => (prev ? { ...prev, ...updated } : prev));
      return;
    }
    setProfessionals(prev => prev.map(p => {
      if (p.id === activeProfessional.id) {
        return { ...p, ...updated };
      }
      return p;
    }));
  };

  // ---- Chat. Real accounts use the backend over REST (its WebSocket isn't documented yet), so it
  // refreshes every 30s, and every 5s while a conversation is open. The demo keeps sample messages.
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, MessageResponse[]>>({});
  const [openChatPeer, setOpenChatPeer] = useState<string | null>(null);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    const list = await listMessages(conversationId);
    setChatMessages(prev => ({ ...prev, [conversationId]: list }));
  }, []);
  const reloadChat = useCallback(async () => {
    const convs = await listConversations();
    setConversations(convs);
    await Promise.all(convs.map(c => loadConversationMessages(c.id).catch(() => undefined)));
  }, [loadConversationMessages]);

  useEffect(() => {
    if (!usesBackendBookings) {
      setConversations([]);
      setChatMessages({});
      return;
    }
    reloadChat().catch((err) => console.warn('Could not load chats', err));
    const interval = setInterval(() => reloadChat().catch(() => undefined), 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') reloadChat().catch(() => undefined); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [usesBackendBookings, user?.id, reloadChat]);

  // The chat screens key a conversation by the other person: the artisan's directory (profile) id on
  // the client's screen, the client's user id on the artisan's screen.
  const peerUserIdFor = (peer: string): string | null =>
    isArtisan ? peer : allProfessionals.find(p => p.id === peer)?.user_id ?? null;
  const conversationWith = (peerUserId: string) =>
    conversations.find(c => (isArtisan ? c.client_id : c.artisan_id) === peerUserId);

  const openPeerUserId = openChatPeer ? peerUserIdFor(openChatPeer) : null;
  const openConversationId = openPeerUserId ? conversationWith(openPeerUserId)?.id ?? null : null;
  useEffect(() => {
    if (!usesBackendBookings || !openConversationId) return;
    const interval = setInterval(() => loadConversationMessages(openConversationId).catch(() => undefined), 5_000);
    return () => clearInterval(interval);
  }, [usesBackendBookings, openConversationId, loadConversationMessages]);
  useEffect(() => {
    if (!location.pathname.startsWith('/messages')) setOpenChatPeer(null);
  }, [location.pathname]);

  const utcTimestamp = (v: string) => (/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`);
  const liveChatMessages: ChatMessage[] = conversations.flatMap(conv => {
    const artisanPro = allProfessionals.find(p => p.user_id === conv.artisan_id);
    // No endpoint returns a client's name yet; the job title at least tells an artisan's chats apart.
    const clientLabel = conv.active_job_title ? `Client · ${conv.active_job_title}` : 'Client';
    const screenId = (userId: string) => {
      if (userId === user?.id) return isArtisan ? userId : 'c1';
      if (userId === conv.artisan_id) return artisanPro?.id ?? userId;
      return userId;
    };
    return (chatMessages[conv.id] || []).map((m): ChatMessage => {
      const fromClient = m.sender_id === conv.client_id;
      const kind = m.message_type === 'image' || m.message_type === 'audio' || m.message_type === 'location' ? m.message_type : 'text';
      const recipient = m.recipient_id || (fromClient ? conv.artisan_id : conv.client_id);
      const loc = m.location_data;
      return {
        id: m.id,
        bookingId: conv.active_booking_id || undefined,
        senderId: screenId(m.sender_id),
        recipientId: screenId(recipient),
        senderName: fromClient
          ? (m.sender_id === user?.id ? artisanFullName || 'You' : clientLabel)
          : (m.sender_id === user?.id ? artisanFullName : artisanPro?.name || 'Artisan'),
        senderRole: fromClient ? 'customer' : 'professional',
        message: m.content || (kind === 'image' ? 'Photo' : kind === 'audio' ? 'Voice note' : kind === 'location' ? 'Shared location' : ''),
        timestamp: utcTimestamp(m.created_at),
        mediaType: kind,
        mediaUrl: kind === 'image' ? m.attachments?.[0] : kind === 'audio' ? m.audio_url || undefined : undefined,
        duration: m.audio_duration ?? undefined,
        waveform: m.audio_wave_data?.length ? m.audio_wave_data : undefined,
        locationData: loc ? { lat: loc.lat, lng: loc.lng, address: loc.address || `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`, landmark: loc.landmark } : undefined,
        status: m.read_at || m.status === 'read' ? 'read' : 'sent',
      };
    });
  });
  // Messages you've sent that the server hasn't confirmed yet ('sending'), or that failed ('failed',
  // with a retry). They show in the thread straight away and are replaced by the server's copy.
  const [pendingChat, setPendingChat] = useState<ChatMessage[]>([]);
  useEffect(() => { if (!usesBackendBookings) setPendingChat([]); }, [usesBackendBookings, user?.id]);
  const shownMessages = usesBackendBookings ? [...liveChatMessages, ...pendingChat] : messages;

  const sendChat = async (peer: string, text: string, media?: Partial<ChatMessage>) => {
    const peerUserId = peerUserIdFor(peer);
    if (!peerUserId) {
      toast.error('This is a sample artisan, so you can’t message them. Real artisans can be messaged.');
      return;
    }
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPendingChat(prev => [...prev, {
      id: tempId,
      senderId: isArtisan ? (user?.id ?? '') : 'c1',
      recipientId: peer,
      senderName: 'You',
      senderRole: isArtisan ? 'professional' : 'customer',
      message: text,
      timestamp: new Date().toISOString(),
      status: 'sending',
      ...media,
    }]);
    try {
      let conv = conversationWith(peerUserId);
      if (!conv) {
        // StartConversationSchema only takes artisan_id: conversations are opened by the client.
        if (isArtisan) throw new Error('This client hasn’t started a conversation with you yet.');
        const created = await startConversation(peerUserId);
        setConversations(prev => [created, ...prev]);
        conv = created;
      }
      const kind = media?.mediaType ?? 'text';
      const body: MessageCreate = { conversation_id: conv.id, content: text, message_type: 'text' };
      if (kind === 'image' || kind === 'audio') {
        if (!media?.mediaUrl?.startsWith('data:')) throw new Error('That attachment can’t be sent.');
        const raw = await (await fetch(media.mediaUrl)).blob();
        // The upload checks the bare type ("audio/webm"), so drop parameters like ";codecs=opus".
        const type = raw.type.split(';')[0];
        const blob = type === raw.type ? raw : new Blob([raw], { type });
        const ext = type.split('/')[1] || 'bin';
        const url = await uploadChatMedia(blob, `${kind}-${Date.now()}.${ext}`);
        if (kind === 'image') Object.assign(body, { message_type: 'image', media_type: 'image', attachments: [url] });
        else Object.assign(body, {
          message_type: 'audio', media_type: 'audio', audio_url: url,
          ...(media.duration ? { audio_duration: media.duration } : {}),
          ...(media.waveform?.length ? { audio_wave_data: media.waveform } : {}),
        });
      } else if (kind === 'location' && media?.locationData) {
        const { lat, lng, address } = media.locationData;
        Object.assign(body, { message_type: 'location', media_type: 'location', location_data: { lat, lng, address } });
      } else if (kind !== 'text') {
        throw new Error('That kind of message can’t be sent yet.');
      }
      await sendMessage(body);
      await loadConversationMessages(conv.id).catch(() => undefined);
      setPendingChat(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      toast.error(errorText(err, 'Could not send your message. Try again.'));
      setPendingChat(prev => prev.map(m => m.id !== tempId ? m : {
        ...m,
        status: 'failed',
        retry: () => {
          setPendingChat(p => p.filter(x => x.id !== tempId));
          sendChat(peer, text, media);
        },
      }));
    }
  };

  const markChatRead = (peer: string) => {
    setOpenChatPeer(peer);
    const peerUserId = peerUserIdFor(peer);
    const conv = peerUserId ? conversationWith(peerUserId) : undefined;
    if (!conv) return;
    const unread = (chatMessages[conv.id] || []).some(m => m.sender_id !== user?.id && !m.read_at && m.status !== 'read');
    if (!unread) return;
    setChatMessages(prev => ({
      ...prev,
      [conv.id]: (prev[conv.id] || []).map(m => (m.sender_id !== user?.id ? { ...m, status: 'read', read_at: m.read_at || new Date().toISOString() } : m)),
    }));
    markConversationRead(conv.id).catch(() => undefined);
  };

  const handleProfessionalSendMessage = (customerId: string, text: string, mediaProps?: Partial<ChatMessage>) => {
    if (blockIfFrozen()) return;
    if (usesBackendBookings) {
      sendChat(customerId, text, mediaProps);
      return;
    }
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
    if (blockIfFrozen()) return;
    if (usesBackendBookings) {
      sendChat(proId, text, mediaProps);
      return;
    }
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
    if (usesBackendBookings) {
      markChatRead(proId);
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usesBackendBookings, conversations, chatMessages, allProfessionals, user?.id]);

  const handleProfessionalMarkAsRead = useCallback((customerId: string) => {
    if (usesBackendBookings) {
      markChatRead(customerId);
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfessional.id, usesBackendBookings, conversations, chatMessages, user?.id]);

  // GET /bookings/me is already scoped to the signed-in user; the demo's sample data needs filtering.
  const roleBookings = usesBackendBookings
    ? bookings
    : bookings.filter(b => currentRole === 'customer' ? b.client_id === 'c1' : b.artisan_id === activeProfessional.id);

  const commonAppShellProps = {
    currentRole,
    currentLanguage,
    onOpenAuthPage: (view?: 'signin' | 'signup') => navigate(view === 'signup' ? '/signup' : '/'),
    unreadCount: shownMessages.filter(m => m.recipientId === (currentRole === 'customer' ? 'c1' : activeProfessional.id) && m.status !== 'read').length,
    notificationsUnreadCount: currentRole === 'customer'
      ? shownCustomerNotifications.filter(n => !n.read && !n.isRead).length
      : shownProNotifications.filter(n => !n.isRead).length,
    onOpenChats: () => handleTabChange('messages'),
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    selectedCategoryFilter,
    onSelectCategoryFilter: setSelectedCategoryFilter,
    onTabChange: handleTabChange,
    pageSubtitle,
    professionals: allProfessionals,
    bookings: roleBookings,
    activeProfessional,
    customerAvatar,
    onLogout: handleLogout,
  };

  const commonCustomerProps = {
    professionals: allProfessionals,
    bookings: usesBackendBookings ? bookings : bookings.filter(b => b.client_id === 'c1'),
    onAcceptQuote: handleAcceptQuote,
    onDisputeBooking: handleDisputeBooking,
    messages: shownMessages,
    onSendMessage: handleCustomerSendMessage,
    onMarkAsRead: handleCustomerMarkAsRead,
    onSelectProForProfile: (pro: Professional) => navigate(`/professionals/${pro.id}`, { state: { backgroundLocation: location } }),
    onOpenBooking: (pro: Professional) => {
      if (blockIfFrozen()) return;
      if (!usesBackendBookings) {
        toast.error('Booking isn’t available on the demo account.');
        return;
      }
      if (!pro.user_id) {
        toast.error('This is a sample artisan, so it can’t be booked. Real artisans can be.');
        return;
      }
      loadProfessionalDetail(pro.id);
      setBookingTargetPro(allProfessionals.find(p => p.id === pro.id) || pro);
    },
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
    customerNotifications: shownCustomerNotifications,
    onUpdateCustomerNotifications: updateCustomerNotifications,
    savedProIds: shownSavedProIds,
    onToggleSavePro: handleToggleSavePro,
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
  };

  const commonProfessionalProps = {
    professional: activeProfessional,
    bookings: usesBackendBookings ? bookings : bookings.filter(b => b.artisan_id === activeProfessional.id),
    onUpdateBookingStatus: handleUpdateBookingStatus,
    onUpdateProfile: handleUpdateProfile,
    onTabChange: handleTabChange,
    onManagePortfolio: () => {
      setProfileScrollTarget('work-portfolio');
      handleTabChange('profile');
    },
    unreadCount: shownMessages.filter(m => m.recipientId === activeProfessional.id && m.status !== 'read').length,
    messages: shownMessages.filter(m => m.recipientId === activeProfessional.id || m.senderId === activeProfessional.id),
    onSendMessage: handleProfessionalSendMessage,
    onMarkAsRead: handleProfessionalMarkAsRead,
    onLogout: handleLogout,
    darkMode,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    notifications: shownProNotifications,
    onUpdateNotifications: updateProNotifications,
    onPageSubtitleChange: setPageSubtitle,
  };

  // After signing in, return the user to whatever protected URL they originally tried to visit
  // (preserved by RequireAuth via location state) instead of always the role home. Role itself
  // needs no handling here -- it's derived from `user` (already set by the AuthContext call that
  // resolved before this fires), not a client-side value this callback has to set.
  const handleAuthSuccess = () => {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    // A client who searched on the landing page goes straight to the artisan search, pre-filled.
    navigate(from || (hasPendingSearch() ? '/search' : '/home'), { replace: true });
  };

  const [buyGigTarget, setBuyGigTarget] = useState<{ gig: Gig; artisanName: string } | null>(null);
  const handleBuyGig = async (gig: Gig, address: string, landmark: string): Promise<boolean> => {
    if (blockIfFrozen()) return false;
    const pro = allProfessionals.find(p => p.id === gig.professional_id);
    if (!usesBackendBookings || !pro?.user_id) {
      toast.error('This gig can’t be bought from this account.');
      return false;
    }
    try {
      await buyGig({
        artisan_id: pro.user_id,
        gig_id: gig.id,
        item_title: gig.title,
        delivery_address: address,
        // Omitted when empty: an explicit null crashes this endpoint (verified live).
        ...(landmark ? { landmark_hint: landmark } : {}),
      });
      toast.success('Gig bought. You’ll find it under Bookings.');
      reloadBookings().catch(() => undefined);
      return true;
    } catch (err) {
      toast.error(errorText(err, 'Could not buy this gig. Try again.'));
      return false;
    }
  };

  const profileModalProps = {
    // Same checks as every other Book button (frozen, demo, sample artisans).
    onOpenBooking: (pro: Professional) => commonCustomerProps.onOpenBooking(pro),
    onBuyGig: (gig: Gig, pro: Professional) => {
      if (blockIfFrozen()) return;
      if (isArtisan) {
        toast.error('Gigs are bought from a client account.');
        return;
      }
      setBuyGigTarget({ gig, artisanName: pro.name });
    },
    onOpenChat: (pro: Professional) => navigate(`/messages/${pro.id}`),
    onAddReview: handleAddReview,
    onClose: () => navigate(-1),
  };

  return (
    <>
      <Toaster richColors theme={darkMode ? 'dark' : 'light'} />
      <Routes location={backgroundLocation || location}>
        {/* Public / pre-auth -- AuthPage renders regardless of auth state (matches the previous
            showFullAuthPage behavior, which let an already-signed-in user reach it manually too),
            and syncs its own internal view state with these 5 real URLs (see AuthPage.tsx). */}
        {/* The public landing page; signed-in visitors go straight to their home. */}
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
        <Route path="/signin" element={<AuthPage initialView="signin" onAuthSuccess={handleAuthSuccess} />} />
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
              {currentRole === 'professional'
                ? <ProfessionalDashboard {...commonProfessionalProps} activeTab="explore" />
                : <CustomerDashboard {...commonCustomerProps} activeTab="explore" />}
            </AppShell>
          } />
          {/* One route per screen, with optional segments: /messages vs /messages/:id (and /jobs,
              /gigs below) would otherwise be two different routes, so React would tear the whole
              page down and rebuild it -- mid-animation for any sheet that was opening. */}
          <Route path="/messages/:contactId?" element={
            <AppShell {...commonAppShellProps} activeTab="messages">
              <MessagesRoute
                currentRole={currentRole}
                customerProps={{ ...commonCustomerProps, activeTab: 'messages' }}
                professionalProps={{ ...commonProfessionalProps, activeTab: 'messages' }}
              />
            </AppShell>
          } />
          <Route path="/notifications" element={
            <AppShell {...commonAppShellProps} activeTab="notifications">
              {currentRole === 'professional' ? (
                <ProfessionalNotifications
                  notifications={shownProNotifications}
                  onNotificationClick={(notification) => {
                    updateProNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                    if (notification.relatedId === 'messages') {
                      handleTabChange('messages');
                    } else if (notification.relatedId) {
                      handleTabChange('jobs');
                    }
                  }}
                  onMarkAllAsRead={() => {
                    updateProNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  }}
                  onMarkAsRead={(id) => {
                    updateProNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                  }}
                />
              ) : (
                <CustomerDashboard {...commonCustomerProps} activeTab="notifications" />
              )}
            </AppShell>
          } />

          {/* Customer-only: not a shared page, no customer equivalent for RequireRole to gate the
              other way. A signed-in artisan hitting these is redirected to /home (+ toast). */}
          <Route element={<RequireRole allow={['customer']} />}>
            <Route path="/search" element={
              <AppShell {...commonAppShellProps} activeTab="search">
                <CustomerDashboard {...commonCustomerProps} activeTab="search" />
              </AppShell>
            } />
            <Route path="/bookings" element={
              <AppShell {...commonAppShellProps} activeTab="bookings">
                <CustomerDashboard {...commonCustomerProps} activeTab="bookings" />
              </AppShell>
            } />
            <Route path="/saved" element={
              <AppShell {...commonAppShellProps} activeTab="saved">
                <CustomerDashboard {...commonCustomerProps} activeTab="saved" />
              </AppShell>
            } />
          </Route>

          {/* Artisan-only: renders a completely different UI (accept/start/complete a job, not
              cancel-a-booking) with no customer equivalent, so these stay distinct routes -- just
              without a role prefix. A signed-in customer hitting these is redirected to /home. */}
          <Route element={<RequireRole allow={['professional']} />}>
            <Route path="/jobs/:bookingId?" element={
              <AppShell {...commonAppShellProps} activeTab="jobs">
                <ProfessionalJobsRoute {...commonProfessionalProps} activeTab="jobs" />
              </AppShell>
            } />
            <Route path="/gigs/:view?" element={
              <AppShell {...commonAppShellProps} activeTab="gigs">
                <ProfessionalGigsNewRoute {...commonProfessionalProps} activeTab="gigs" />
              </AppShell>
            } />
          </Route>

          <Route path="/profile" element={
            <AppShell {...commonAppShellProps} activeTab="profile">
              <ProfileView
                currentRole={currentRole}
                activeProfessional={activeProfessional}
                bookings={roleBookings}
                savedArtisans={savedArtisans}
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
            </AppShell>
          } />
          <Route path="/settings" element={
            <AppShell {...commonAppShellProps} activeTab="settings">
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
            </AppShell>
          } />

          {/* Public artisan profile, loaded directly (shared link / refresh): there's no page to
              show underneath, so it renders inside the shell. Opened from within the app it's drawn
              over the page it came from instead -- see the second <Routes> below. */}
          <Route path="/professionals/:id" element={
            <AppShell {...commonAppShellProps} activeTab="explore">
              <ProfessionalProfileRoute professionals={allProfessionals} onNeedDetail={loadProfessionalDetail} {...profileModalProps} />
            </AppShell>
          } />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/professionals/:id" element={
              <ProfessionalProfileRoute professionals={allProfessionals} onNeedDetail={loadProfessionalDetail} {...profileModalProps} />
            } />
          </Route>
        </Routes>
      )}

      <BuyGigSheet target={buyGigTarget} onClose={() => setBuyGigTarget(null)} onBuy={handleBuyGig} />

      <BookingModal
        professional={bookingTargetPro}
        isOpen={!!bookingTargetPro}
        onClose={() => setBookingTargetPro(null)}
        onSubmitBooking={handleCreateBooking}
        onViewBookings={() => navigate('/bookings')}
        onOpenChatWithPro={(pro) => {
          setBookingTargetPro(null);
          navigate(`/messages/${pro.id}`);
        }}
      />
    </>
  );
}
