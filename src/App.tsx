import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, Professional, Booking, ChatMessage, Category, PortfolioItem, Notification } from './types';
import { Language } from './translations';
import { INITIAL_PROFESSIONALS, INITIAL_BOOKINGS, INITIAL_MESSAGES } from './mockData';
import { AppShell } from './components/AppShell';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ProfessionalDashboard } from './components/ProfessionalDashboard';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { ProfessionalNotifications } from './components/ProfessionalNotifications';
import { ProfessionalProfileModal } from './components/ProfessionalProfileModal';
import { BookingModal } from './components/BookingModal';
import { AuthPage } from './components/AuthPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loginAsDemo } = useAuth();

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem('kazihub_role') as Role) || 'customer';
  });

  // Track if full-page auth portal is active
  const [showFullAuthPage, setShowFullAuthPage] = useState<boolean>(false);
  const [authPageInitialView, setAuthPageInitialView] = useState<'signin' | 'signup'>('signin');

  // Sync role whenever auth user role changes
  useEffect(() => {
    if (user && user.role) {
      const mappedRole: Role = user.role === 'artisan' ? 'professional' : 'customer';
      setCurrentRole(mappedRole);
      localStorage.setItem('kazihub_role', mappedRole);
    }
  }, [user]);

  const [activeTab, setActiveTab] = useState<string>('explore');
  const previousTabRef = useRef<string>('explore');
  const pageScrollPositionsRef = useRef<Record<string, number>>({});

  // Continuously record scroll position for the current page
  useEffect(() => {
    const handleScroll = () => {
      const pageKey = `${currentRole}_${activeTab}`;
      pageScrollPositionsRef.current[pageKey] = window.scrollY || document.documentElement.scrollTop || 0;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentRole, activeTab]);

  // Restore or reset scroll position when page/tab changes
  useEffect(() => {
    const pageKey = `${currentRole}_${activeTab}`;
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
  }, [activeTab, currentRole]);

  const handleTabChange = useCallback((tab: string, customerId?: string) => {
    const currentKey = `${currentRole}_${activeTab}`;
    pageScrollPositionsRef.current[currentKey] = window.scrollY || document.documentElement.scrollTop || 0;

    // If clicking on the same tab, smooth scroll to top
    if (tab === activeTab && !customerId) {
      pageScrollPositionsRef.current[currentKey] = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    setActiveTab(current => {
      if (tab === 'notifications' && current === 'notifications') {
        return previousTabRef.current;
      }
      if (current !== 'notifications') {
        previousTabRef.current = current;
      }
      return tab;
    });
    
    if (customerId) {
      setSelectedMessageCustomerId(customerId);
    }
  }, [currentRole, activeTab]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kazihub_dark_mode_v2');
    return saved !== null ? saved === 'true' : false;
  });
  
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

  // Modals state
  const [selectedProForProfile, setSelectedProForProfile] = useState<Professional | null>(null);
  const [bookingTargetPro, setBookingTargetPro] = useState<Professional | null>(null);
  const [chatTargetPro, setChatTargetPro] = useState<Professional | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'All'>('All');
  const [selectedMessageCustomerId, setSelectedMessageCustomerId] = useState<string | undefined>(undefined);

  // Currently logged in professional partner view
  const [activeProId, setActiveProId] = useState<string>('p1');
  const rawPro = professionals.find(p => p.id === activeProId) || professionals[0];

  const [customerAvatar, setCustomerAvatar] = useState<string>(() => {
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
  }, [user?.id]);

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
      let userCustomAvatar = customerAvatar || localStorage.getItem(`kazihub_avatar_${user.id}`) || '';
      if (userCustomAvatar.includes('images.unsplash.com/photo-1531746020798-e6953c6e8e04')) {
        userCustomAvatar = '';
      }
      return {
        ...rawPro,
        id: user.id || rawPro.id,
        name: `${user.first_name} ${user.last_name}`.trim() || rawPro.name,
        email: user.email || rawPro.email,
        phone: user.phone_number || rawPro.phone,
        location: user.state ? `${user.state}, Nigeria` : rawPro.location,
        nin: user.nin || rawPro.nin,
        verified: user.is_email_verified ?? rawPro.verified,
        avatar: userCustomAvatar,
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
        title: 'Escrow Payment Secured',
        desc: 'Your payment of ₦48,000 is safely locked in escrow until job confirmation.',
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

  // Automatic Availability Management: When logged in as professional, set isAvailableNow = true. When leaving/unloading/visibility hidden/logout/switch role, set isAvailableNow = false.
  useEffect(() => {
    if (currentRole === 'professional') {
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: true } : p));
    }
  }, [currentRole, activeProId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
      } else if (document.visibilityState === 'visible' && currentRole === 'professional') {
        setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: true } : p));
      }
    };

    const handleBeforeUnload = () => {
      const proList = JSON.parse(localStorage.getItem('kazihub_ng_professionals_v10') || '[]');
      const updated = proList.map((p: any) => p.id === activeProId ? { ...p, isAvailableNow: false } : p);
      localStorage.setItem('kazihub_ng_professionals_v10', JSON.stringify(updated));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
    };
  }, [activeProId, currentRole]);

  const handleLogout = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
    setActiveTab('explore');
  };

  const handleDeleteAccount = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
    setCurrentRole('customer');
    setActiveTab('explore');
  };

  const handleDeactivateAccount = () => {
    setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
    setActiveTab('explore');
  };

  // 4-day window 1 (completion-submitted -> completed) & 4-day window 2 (completed -> closed) checks
  useEffect(() => {
    const checkAutoCompletions = () => {
      const now = new Date().getTime();
      const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
      let updated = false;
      const newBookings = bookings.map(b => {
        // Window 1: completion-submitted -> completed after 4 days
        if (b.status === 'completion-submitted' && b.completionDetails?.submittedAt) {
          const submittedTime = new Date(b.completionDetails.submittedAt).getTime();
          if (now - submittedTime >= FOUR_DAYS_MS) {
            updated = true;
            return {
              ...b,
              status: 'completed' as const,
              completedAt: b.completedAt || new Date().toISOString()
            };
          }
        }

        // Window 2: completed -> closed after 4 days from completion
        if (b.status === 'completed') {
          const completedTime = b.completedAt
            ? new Date(b.completedAt).getTime()
            : (b.completionDetails?.submittedAt ? new Date(b.completionDetails.submittedAt).getTime() : new Date(b.createdAt).getTime());
          if (now - completedTime >= FOUR_DAYS_MS) {
            updated = true;
            return { ...b, status: 'closed' as const };
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
  }, [darkMode]);

  // Handlers
  const handleSwitchRole = (newRole: Role) => {
    if (currentRole === 'professional') {
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: false } : p));
    }
    setCurrentRole(newRole);
    localStorage.setItem('kazihub_role', newRole);
    if (newRole === 'professional') {
      setProfessionals(prev => prev.map(p => p.id === activeProId ? { ...p, isAvailableNow: true } : p));
    }
  };

  const handleCreateBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const isQuoteRequired = bookingData.servicePricingType === 'quote_required';
    const newBooking: Booking = {
      ...bookingData,
      id: isQuoteRequired ? `req-${Date.now()}` : `b-${Date.now()}`,
      status: isQuoteRequired ? 'awaiting_quote' : 'pending',
      createdAt: new Date().toISOString()
    };
    setBookings([newBooking, ...bookings]);

    // Also add opening chat message
    const initialMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      bookingId: newBooking.id,
      senderId: 'c1',
      senderName: bookingData.customerName,
      senderRole: 'customer',
      recipientId: bookingData.professionalId,
      message: isQuoteRequired
        ? `Hello! I have submitted a service quote request for "${bookingData.selectedService || bookingData.category}" (Preferred date: ${bookingData.date}, ${bookingData.timeSlot}). Scope: ${bookingData.issueDescription}. Please review and send a custom quote.`
        : `Hello! I have booked your service (${bookingData.selectedService || bookingData.category}) for ${bookingData.date} (${bookingData.timeSlot}). Issue: ${bookingData.issueDescription}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, initialMsg]);

    // Add notification for professional
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      type: 'new_job',
      title: isQuoteRequired ? 'New Service Quote Request' : 'New Job Booking Request',
      description: isQuoteRequired
        ? `${bookingData.customerName} submitted a quote request for "${bookingData.selectedService || bookingData.category}".`
        : `${bookingData.customerName} requested a ${bookingData.selectedService || bookingData.category} for ${bookingData.date} at ${bookingData.timeSlot}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedId: newBooking.id
    };
    setNotifications(prev => [newNotif, ...prev]);
  };



  const handleSendMessage = (text: string, mediaProps?: Partial<ChatMessage>) => {
    if (!chatTargetPro) return;
    const isCustomer = currentRole === 'customer';
    const clientFullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email.split('@')[0] : 'Client';
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: isCustomer ? (user?.id || 'c1') : chatTargetPro.id,
      senderName: isCustomer ? clientFullName : chatTargetPro.name,
      senderRole: currentRole,
      recipientId: isCustomer ? chatTargetPro.id : (user?.id || 'c1'),
      message: text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      ...mediaProps
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleMarkMessagesAsRead = useCallback(() => {
    if (!chatTargetPro) return;
    setMessages(prev => {
      let changed = false;
      const next = prev.map(m => {
        if ((m.recipientId === chatTargetPro.id || m.senderId === chatTargetPro.id) && m.status !== 'read') {
          changed = true;
          return { ...m, status: 'read' as const };
        }
        return m;
      });
      return changed ? next : prev;
    });
  }, [chatTargetPro]);

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

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status'], extra?: Partial<Booking>) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updateObj: Partial<Booking> = { status, ...(extra || {}) };
        if (status === 'completed' && !b.completedAt && !updateObj.completedAt) {
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

  const handleAddPortfolioItem = (item: Omit<PortfolioItem, 'id'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: `port-${Date.now()}`
    };
    setProfessionals(prev => prev.map(p => {
      if (p.id === activeProfessional.id) {
        return {
          ...p,
          portfolio: [newItem, ...p.portfolio]
        };
      }
      return p;
    }));
  };

  const handleUpdateProfile = (updated: Partial<Professional>) => {
    if (updated.avatar && user?.id) {
      localStorage.setItem(`kazihub_avatar_${user.id}`, updated.avatar);
      setCustomerAvatar(updated.avatar);
    }
    setProfessionals(prev => prev.map(p => {
      if (p.id === activeProfessional.id) {
        return { ...p, ...updated };
      }
      return p;
    }));
  };

  const currentChatMessages = chatTargetPro
    ? messages.filter(m => m.senderId === chatTargetPro.id || m.recipientId === chatTargetPro.id)
    : [];

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

  // 1. Strict Authentication Check: If user is signed out, render AuthPage directly
  if (!user) {
    return (
      <AuthPage
        initialView="signin"
        onAuthSuccess={(role) => {
          const mappedRole: Role = role === 'artisan' ? 'professional' : 'customer';
          handleSwitchRole(mappedRole);
          setActiveTab('explore');
        }}
      />
    );
  }

  // 2. Explicit Full Auth Page view (if opened manually)
  if (showFullAuthPage) {
    return (
      <AuthPage
        initialView={authPageInitialView}
        onAuthSuccess={(role) => {
          const mappedRole: Role = role === 'artisan' ? 'professional' : 'customer';
          handleSwitchRole(mappedRole);
          setShowFullAuthPage(false);
          setActiveTab('explore');
        }}
      />
    );
  }

  return (
    <AppShell
      currentRole={currentRole}
      currentLanguage={currentLanguage}
      onSwitchRole={handleSwitchRole}
      onOpenAuthPage={(view) => {
        setAuthPageInitialView(view || 'signin');
        setShowFullAuthPage(true);
      }}
      unreadCount={messages.filter(m => m.recipientId === (currentRole === 'customer' ? 'c1' : activeProfessional.id) && m.status !== 'read').length}
      notificationsUnreadCount={
        currentRole === 'customer'
          ? customerNotifications.filter(n => !n.read && !n.isRead).length
          : notifications.filter(n => !n.isRead).length
      }
      onOpenChats={() => {
        handleTabChange('messages');
      }}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      selectedCategoryFilter={selectedCategoryFilter}
      onSelectCategoryFilter={setSelectedCategoryFilter}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      professionals={professionals}
      bookings={bookings.filter(b => currentRole === 'customer' ? b.customerId === 'c1' : b.professionalId === activeProfessional.id)}
      activeProfessional={activeProfessional}
      customerAvatar={customerAvatar}
      onLogout={handleLogout}
    >
      {activeTab === 'profile' ? (
        <ProfileView
          currentRole={currentRole}
          activeProfessional={activeProfessional}
          bookings={bookings.filter(b => currentRole === 'customer' ? b.customerId === 'c1' : b.professionalId === activeProfessional.id)}
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
      ) : activeTab === 'settings' ? (
        <SettingsView
          currentRole={currentRole}
          activeProfessional={activeProfessional}
          bookings={bookings.filter(b => currentRole === 'customer' ? b.customerId === 'c1' : b.professionalId === activeProfessional.id)}
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
      ) : currentRole === 'customer' ? (
        <CustomerDashboard
          professionals={professionals}
          bookings={bookings.filter(b => b.customerId === 'c1')}
          messages={messages}
          onSendMessage={handleCustomerSendMessage}
          onMarkAsRead={handleCustomerMarkAsRead}
          onSelectProForProfile={(pro) => setSelectedProForProfile(pro)}
          onOpenBooking={(pro) => setBookingTargetPro(pro)}
          onOpenChat={(pro) => {
            setChatTargetPro(pro);
            handleTabChange('messages');
          }}
          selectedCategoryFilter={selectedCategoryFilter}
          onSelectCategoryFilter={setSelectedCategoryFilter}
          onCancelBooking={handleCancelBooking}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onAddReview={handleAddReview}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onDeactivateAccount={handleDeactivateAccount}
          customerNotifications={customerNotifications}
          onUpdateCustomerNotifications={setCustomerNotifications}
          initialMessageProId={chatTargetPro?.id}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      ) : activeTab === 'notifications' ? (
        <ProfessionalNotifications
          notifications={notifications}
          onNotificationClick={(notification) => {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            if (notification.relatedId === 'messages') {
              handleTabChange('messages');
            } else if (notification.relatedId) {
              handleTabChange('bookings');
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
        <ProfessionalDashboard
          professional={activeProfessional}
          bookings={bookings.filter(b => b.professionalId === activeProfessional.id)}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onAddPortfolioItem={handleAddPortfolioItem}
          onUpdateProfile={handleUpdateProfile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadCount={messages.filter(m => m.recipientId === activeProfessional.id && m.status !== 'read').length}
          messages={messages.filter(m => m.recipientId === activeProfessional.id || m.senderId === activeProfessional.id)}
          onSendMessage={handleProfessionalSendMessage}
          onMarkAsRead={handleProfessionalMarkAsRead}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          notifications={notifications}
          onUpdateNotifications={setNotifications}
          initialCustomerId={selectedMessageCustomerId}
        />
      )}

      {/* Modals */}
      <ProfessionalProfileModal
        professional={selectedProForProfile}
        isOpen={!!selectedProForProfile}
        onClose={() => setSelectedProForProfile(null)}
        onOpenBooking={(pro) => setBookingTargetPro(pro)}
        onOpenChat={(pro) => {
          setSelectedProForProfile(null);
          setChatTargetPro(pro);
          handleTabChange('messages');
        }}
        onAddReview={handleAddReview}
      />

      <BookingModal
        professional={bookingTargetPro}
        isOpen={!!bookingTargetPro}
        onClose={() => setBookingTargetPro(null)}
        onSubmitBooking={handleCreateBooking}
        onOpenChatWithPro={(pro) => {
          setBookingTargetPro(null);
          setChatTargetPro(pro);
          handleTabChange('messages');
        }}
      />
    </AppShell>
  );
}
