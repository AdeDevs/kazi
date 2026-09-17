import React, { useState, useRef, useEffect } from 'react';
import { Professional, ServiceItem, PortfolioItem, ServicePricingType, Category } from '../types';
import { formatCurrency } from '../utils';
import { CATEGORIES } from '../mockData';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { KYCVerificationModal } from './ui/KYCVerificationModal';
import { UserAvatar, getInitials, getAvatarColor } from './ui/UserAvatar';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { Card, CardHeader } from './ui/Card';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { CustomDropdown } from './CustomDropdown';
import { useAuth } from '../context/AuthContext';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import {
  Phone, MapPin,
  CheckCircle2, Edit3, Trash2, X,
  Plus, Clock, ChevronRight
} from 'lucide-react';

interface ProProfileManagementProps {
  activeProfessional: Professional;
  onUpdateProfile?: (updated: Partial<Professional>) => void;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  /** Section id to scroll to on mount/update -- lets a CTA elsewhere in the app (e.g. Home's
   *  "Manage Portfolio") land directly on a specific section here instead of just the page top. */
  scrollToSection?: string | null;
  onScrollToSectionHandled?: () => void;
}

export const ProProfileManagement: React.FC<ProProfileManagementProps> = ({
  activeProfessional,
  onUpdateProfile,
  onTabChange,
  onLogout,
  scrollToSection,
  onScrollToSectionHandled
}) => {
  const { uploadProfilePicture } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [heroPhotoFailed, setHeroPhotoFailed] = useState(false);
  const hasHeroPhoto = Boolean(activeProfessional.profile_picture && activeProfessional.profile_picture.trim().length > 0 && !heroPhotoFailed);

  // Basic Pro Info State
  const [name, setName] = useState(activeProfessional.name);
  const [tagline, setTagline] = useState(activeProfessional.tagline);
  const [bio, setBio] = useState(activeProfessional.bio);
  const [phone, setPhone] = useState(activeProfessional.phone_number);
  const [email, setEmail] = useState(activeProfessional.email);
  const [category, setCategory] = useState<Category>(activeProfessional.category);
  const [primaryLocation, setPrimaryLocation] = useState(
    activeProfessional.neighborhood ? `${activeProfessional.neighborhood}, ${activeProfessional.state}` : activeProfessional.state
  );

  // Services State
  const [services, setServices] = useState<ServiceItem[]>(
    activeProfessional.services || [
      {
        id: 'srv-pro-1',
        name: 'Socket & Switch Replacement',
        category: activeProfessional.category,
        description: 'Single or multi-gang socket/switch rewiring, earthing check, and circuit safety test.',
        pricing_type: 'fixed',
        price: 5000,
        duration_estimate: '1 hr'
      },
      {
        id: 'srv-pro-2',
        name: 'Distribution Board (DB Box) Inspection & Overhaul',
        category: activeProfessional.category,
        description: 'Breaker replacement, phase balancing, short circuit tracing, and fuse maintenance.',
        pricing_type: 'fixed',
        price: 15000,
        duration_estimate: '2-3 hrs'
      },
      {
        id: 'srv-pro-3',
        name: 'Inverter & Changeover Installation',
        category: activeProfessional.category,
        description: 'Complete battery rack, inverter hookup, and manual/auto changeover switch wiring.',
        pricing_type: 'starting',
        price: 25000,
        duration_estimate: '3-5 hrs'
      }
    ]
  );

  // Portfolio State
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(activeProfessional.portfolio || []);

  // Modals & UI States
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  // Snapshot of the editable fields taken when the modal opens, so we can tell whether anything
  // changed (the fields below are live-bound to the same state the page displays outside the
  // modal, with no separate draft copy) and revert to it if the user discards.
  const [editInfoBaseline, setEditInfoBaseline] = useState({ name, tagline, bio, phone, email, category, primaryLocation });
  const openEditInfoModal = () => {
    setEditInfoBaseline({ name, tagline, bio, phone, email, category, primaryLocation });
    setShowEditInfoModal(true);
  };
  const isEditInfoDirty =
    name !== editInfoBaseline.name ||
    tagline !== editInfoBaseline.tagline ||
    bio !== editInfoBaseline.bio ||
    phone !== editInfoBaseline.phone ||
    email !== editInfoBaseline.email ||
    category !== editInfoBaseline.category ||
    primaryLocation !== editInfoBaseline.primaryLocation;
  const closeEditInfoModal = () => {
    setName(editInfoBaseline.name);
    setTagline(editInfoBaseline.tagline);
    setBio(editInfoBaseline.bio);
    setPhone(editInfoBaseline.phone);
    setEmail(editInfoBaseline.email);
    setCategory(editInfoBaseline.category);
    setPrimaryLocation(editInfoBaseline.primaryLocation);
    setShowEditInfoModal(false);
  };
  const editInfoGuard = useUnsavedChangesGuard(isEditInfoDirty, closeEditInfoModal);
  const editInfoSheet = useSlideUpSheet(showEditInfoModal, editInfoGuard.requestClose);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Service Modal & Deletion State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePricingType, setServicePricingType] = useState<ServicePricingType>('fixed');
  const [servicePrice, setServicePrice] = useState<number>(10000);
  const [serviceDuration, setServiceDuration] = useState('1-2 hrs');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [serviceBaseline, setServiceBaseline] = useState({
    name: serviceName, pricingType: servicePricingType, price: servicePrice, duration: serviceDuration, desc: serviceDesc
  });
  const isServiceDirty =
    serviceName !== serviceBaseline.name ||
    servicePricingType !== serviceBaseline.pricingType ||
    servicePrice !== serviceBaseline.price ||
    serviceDuration !== serviceBaseline.duration ||
    serviceDesc !== serviceBaseline.desc;
  const closeServiceModal = () => setShowServiceModal(false);
  const serviceGuard = useUnsavedChangesGuard(isServiceDirty, closeServiceModal);
  const serviceSheet = useSlideUpSheet(showServiceModal, serviceGuard.requestClose);

  // Portfolio Modal & Deletion State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portTitle, setPortTitle] = useState('');
  const [portCategory, setPortCategory] = useState<Category>(activeProfessional.category);
  const [portImage, setPortImage] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portDate, setPortDate] = useState(new Date().toISOString().split('T')[0]);
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioItem | null>(null);
  const [portfolioBaseline, setPortfolioBaseline] = useState({
    title: portTitle, category: portCategory, image: portImage, desc: portDesc, date: portDate
  });
  const isPortfolioDirty =
    portTitle !== portfolioBaseline.title ||
    portCategory !== portfolioBaseline.category ||
    portImage !== portfolioBaseline.image ||
    portDesc !== portfolioBaseline.desc ||
    portDate !== portfolioBaseline.date;
  const closePortfolioModal = () => setShowPortfolioModal(false);
  const portfolioGuard = useUnsavedChangesGuard(isPortfolioDirty, closePortfolioModal);
  const portfolioSheet = useSlideUpSheet(showPortfolioModal, portfolioGuard.requestClose);

  // Real KYC Submission status
  const [kycSubmitted, setKycSubmitted] = useState<boolean>(() => {
    const stored = localStorage.getItem(`kazihub_kyc_completed_${activeProfessional.id}`);
    if (stored !== null) {
      return stored === 'true';
    }
    return activeProfessional.verificationStatus === 'verified';
  });

  const isVerified = kycSubmitted;

  // Notifications
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Sync state with activeProfessional prop
  React.useEffect(() => {
    setName(activeProfessional.name);
    setBio(activeProfessional.bio);
    setPhone(activeProfessional.phone_number);
    setEmail(activeProfessional.email);
    setCategory(activeProfessional.category);
    setPrimaryLocation(
      activeProfessional.neighborhood ? `${activeProfessional.neighborhood}, ${activeProfessional.state}` : activeProfessional.state
    );
    if (activeProfessional.services) setServices(activeProfessional.services);
    if (activeProfessional.portfolio) setPortfolio(activeProfessional.portfolio);
  }, [activeProfessional]);

  // Profile Completion Calculation
  const calculateCompletion = () => {
    let score = 0;
    if (activeProfessional.profile_picture) score += 30;
    if (name && bio && primaryLocation) score += 30;
    if (services.length > 0) score += 20;
    if (portfolio.length > 0) score += 20;
    return Math.min(score, 100);
  };

  const completionPct = calculateCompletion();

  // Handlers
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && onUpdateProfile) {
        onUpdateProfile({ profile_picture: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);

    // Backend upload
    setIsUploadingAvatar(true);
    try {
      const updatedUser = await uploadProfilePicture(file);
      if (updatedUser.profile_picture && onUpdateProfile) {
        onUpdateProfile({ profile_picture: updatedUser.profile_picture });
      }
      triggerToast('Profile photo updated and saved!');
    } catch (err: any) {
      triggerToast(err.message || 'Profile photo updated.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name,
        tagline,
        bio,
        phone_number: phone,
        email,
        category,
        state: primaryLocation
      });
    }
    setEditInfoBaseline({ name, tagline, bio, phone, email, category, primaryLocation });
    setShowEditInfoModal(false);
    triggerToast('Profile updated successfully!');
  };

  // Service CRUD
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePricingType('fixed');
    setServicePrice(10000);
    setServiceDuration('1-2 hrs');
    setServiceDesc('');
    setServiceBaseline({ name: '', pricingType: 'fixed', price: 10000, duration: '1-2 hrs', desc: '' });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setServiceName(s.name);
    setServicePricingType(s.pricing_type);
    setServicePrice(s.price || 10000);
    setServiceDuration(s.duration_estimate || '1-2 hrs');
    setServiceDesc(s.description);
    setServiceBaseline({ name: s.name, pricingType: s.pricing_type, price: s.price || 10000, duration: s.duration_estimate || '1-2 hrs', desc: s.description });
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedServices: ServiceItem[];
    if (editingServiceId) {
      updatedServices = services.map(s => s.id === editingServiceId ? {
        ...s,
        name: serviceName,
        pricing_type: servicePricingType,
        price: servicePricingType === 'quote_required' ? undefined : servicePrice,
        duration_estimate: serviceDuration,
        description: serviceDesc
      } : s);
    } else {
      const newService: ServiceItem = {
        id: `srv-custom-${Date.now()}`,
        name: serviceName,
        category: category,
        description: serviceDesc,
        pricing_type: servicePricingType,
        price: servicePricingType === 'quote_required' ? undefined : servicePrice,
        duration_estimate: serviceDuration
      };
      updatedServices = [newService, ...services];
    }
    setServices(updatedServices);
    if (onUpdateProfile) onUpdateProfile({ services: updatedServices });
    setShowServiceModal(false);
    triggerToast(editingServiceId ? 'Service updated!' : 'New service added!');
  };

  const confirmDeleteService = () => {
    if (!serviceToDelete) return;
    const updated = services.filter(s => s.id !== serviceToDelete.id);
    setServices(updated);
    if (onUpdateProfile) onUpdateProfile({ services: updated });
    triggerToast('Service removed.');
    setServiceToDelete(null);
  };

  // Portfolio CRUD
  const handleOpenAddPortfolio = () => {
    setEditingPortfolioId(null);
    const defaultImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800';
    const defaultDate = new Date().toISOString().split('T')[0];
    setPortTitle('');
    setPortCategory(category);
    setPortImage(defaultImage);
    setPortDesc('');
    setPortDate(defaultDate);
    setPortfolioBaseline({ title: '', category, image: defaultImage, desc: '', date: defaultDate });
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (p: PortfolioItem) => {
    setEditingPortfolioId(p.id);
    setPortTitle(p.title);
    setPortCategory(p.category);
    setPortImage(p.image_url);
    setPortDesc(p.description);
    setPortDate(p.date_completed);
    setPortfolioBaseline({ title: p.title, category: p.category, image: p.image_url, desc: p.description, date: p.date_completed });
    setShowPortfolioModal(true);
  };

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPortfolio: PortfolioItem[];
    if (editingPortfolioId) {
      updatedPortfolio = portfolio.map(p => p.id === editingPortfolioId ? {
        ...p,
        title: portTitle,
        category: portCategory,
        image_url: portImage,
        description: portDesc,
        date_completed: portDate
      } : p);
    } else {
      const newPort: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: portTitle,
        category: portCategory,
        image_url: portImage || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
        description: portDesc,
        date_completed: portDate
      };
      updatedPortfolio = [newPort, ...portfolio];
    }
    setPortfolio(updatedPortfolio);
    if (onUpdateProfile) onUpdateProfile({ portfolio: updatedPortfolio });
    setShowPortfolioModal(false);
    triggerToast(editingPortfolioId ? 'Portfolio item updated!' : 'Project added to portfolio!');
  };

  const confirmDeletePortfolio = () => {
    if (!portfolioToDelete) return;
    const updated = portfolio.filter(p => p.id !== portfolioToDelete.id);
    setPortfolio(updated);
    if (onUpdateProfile) onUpdateProfile({ portfolio: updated });
    triggerToast('Portfolio item removed.');
    setPortfolioToDelete(null);
  };

  const handleKYCSuccess = () => {
    setKycSubmitted(true);
    localStorage.setItem(`kazihub_kyc_completed_${activeProfessional.id}`, 'true');
    if (onUpdateProfile) {
      onUpdateProfile({ is_verified: true, verificationStatus: 'verified' });
    }
    triggerToast('Account identity and liveness check verified!');
  };

  useEffect(() => {
    if (!scrollToSection) return;
    const el = document.getElementById(scrollToSection);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onScrollToSectionHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToSection]);

  return (
    <div className="w-full max-w-none space-y-4 animate-in fade-in">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* 1. PRIMARY ARTISAN IDENTITY CARD. No space-y-* at the top level here: Tailwind's space-y
          selector only excludes elements carrying the literal `hidden` HTML attribute, not ones
          hidden via a responsive class like sm:hidden -- so it can't tell the mobile-only and
          desktop-only blocks below apart from any other sibling, and would add its margin-top
          onto whichever one happens to render, regardless of breakpoint. Each block below is
          self-spaced instead. */}
      <Card className="relative overflow-hidden">

        {/* Mobile: full-bleed hero -- the real photo if there is one, otherwise the same
            deterministic color + initials UserAvatar falls back to everywhere else, just at
            full-bleed scale. Tapping anywhere on it still opens the photo picker. */}
        <div className="sm:hidden -mx-[15px] -mt-[15px] relative h-[220px] rounded-t-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 w-full h-full cursor-pointer"
            title="Tap to change your photo"
            aria-label="Change profile photo"
          >
            {hasHeroPhoto ? (
              <img
                src={activeProfessional.profile_picture}
                alt={activeProfessional.name}
                className="w-full h-full object-cover"
                onError={() => setHeroPhotoFailed(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(activeProfessional.name)}`}>
                <span className="text-[110px] font-black leading-none opacity-20 select-none">{getInitials(activeProfessional.name)}</span>
              </div>
            )}
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent pointer-events-none" />
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute left-4 right-4 bottom-3.5 text-white pointer-events-none">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tight truncate">{name}</h1>
              {isVerified && <VerifiedBadge title="Verified" />}
            </div>
            <p className="text-xs font-semibold text-white/85 flex items-center gap-1">
              <span>{category}</span>
              <span>&middot;</span>
              <span className="text-amber-400">★</span>
              <span>{activeProfessional.rating_average} ({activeProfessional.review_count})</span>
            </p>
          </div>
        </div>
        <div className="sm:hidden pt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {primaryLocation}
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg font-bold">
              {activeProfessional.completed_jobs_count || 34} jobs
            </span>
          </div>

          {!isVerified && (
            <button
              type="button"
              onClick={() => setShowKYCModal(true)}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Pending Verification</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {(phone || email) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-navy-800 dark:hover:text-navy-400 transition-colors">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="hover:text-navy-800 dark:hover:text-navy-400 transition-colors">
                  {email}
                </a>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={openEditInfoModal}
            className="w-full px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center"
          >
            Edit Profile
          </button>
        </div>

        {/* Desktop: banner + overlapping avatar. Banner + avatar overlap live in one wrapper so
            the internal -mt-11 overlap only has to reckon with its one sibling (the banner right
            above it), not fight anything else for control of its own margin-top. */}
        <div className="hidden sm:block">
          <div className="-mx-[15px] -mt-[15px]">
            <div className="h-[104px] rounded-t-2xl bg-gradient-to-br from-navy-900 to-navy-950" />
            <div className="flex items-end justify-between gap-3.5 px-[15px] -mt-11">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="relative shrink-0 cursor-pointer rounded-2xl border-4 border-white dark:border-slate-900 shadow-lg"
                title="Tap to change your photo"
                aria-label="Change profile photo"
              >
                <UserAvatar
                  src={activeProfessional.profile_picture}
                  name={activeProfessional.name}
                  sizeClassName="w-20 h-20"
                  textClassName="text-2xl font-black"
                  roundedClassName="rounded-2xl"
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-950/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={openEditInfoModal}
                className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Identity Hierarchy: Name + Verified Badge -> Category & Location -> Phone/Email */}
          <div className="space-y-1.5 mt-4">

            {/* Name & Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {name}
              </h1>
              {isVerified ? (
                <VerifiedBadge label="Verified" />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowKYCModal(true)}
                  className="px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <span>Pending Verification</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Trade Category & Location */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                {category}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{primaryLocation}</span>
              </span>
            </div>

            {/* Direct Contact Details */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-navy-800 dark:hover:text-navy-400 transition-colors">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="hover:text-navy-800 dark:hover:text-navy-400 transition-colors">
                  {email}
                </a>
              )}
            </div>

            {/* Key Trust Stats */}
            <div className="flex items-center gap-2.5 text-xs font-bold pt-0.5 text-slate-600 dark:text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                {activeProfessional.completed_jobs_count || 34} Jobs Completed
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-amber-600 dark:text-amber-400">
                ★ {activeProfessional.rating_average} <span className="text-slate-500 font-medium">({activeProfessional.review_count} Reviews)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio Description */}
        {bio && (
          <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
              {bio}
            </p>
          </div>
        )}
      </Card>

      {/* 2. CONDITIONAL PROFILE COMPLETION BANNER (Padding: 15px) */}
      {completionPct < 100 && (
        <div className="p-[15px] rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-extrabold text-slate-900 dark:text-slate-100">
              Profile {completionPct}% Complete
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Upload your portfolio photos and services to improve client booking rates.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddPortfolio}
            className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Add Portfolio
          </button>
        </div>
      )}

      {/* 3. SERVICES & PRICING */}
      {/* overflow-hidden: the horizontal-scroll row below bleeds edge-to-edge via a negative
          margin, and its own overflow-x-auto clips as a plain rectangle -- without this, that
          clip doesn't follow the card's rounded-2xl corners, so scrolled cards visibly bleed
          past the curve at the right edge instead of being masked by it. */}
      <Card className="space-y-3.5 overflow-hidden">
        <CardHeader
          title="Services & Pricing"
          subtitle="Fixed rates, starting prices, and custom quotes."
          badge={
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold shrink-0">
              {services.length} Listed
            </span>
          }
          action={
            <button
              type="button"
              onClick={handleOpenAddService}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title="Add Service"
              aria-label="Add Service"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add Service</span>
            </button>
          }
        />

        {services.length === 0 ? (
          <div className="text-center py-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-xs text-slate-500 font-medium">No custom services listed yet.</p>
            <button
              type="button"
              onClick={handleOpenAddService}
              className="px-3 py-1.5 rounded-xl bg-navy-800 text-white text-xs font-bold cursor-pointer"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible overscroll-x-contain no-scrollbar snap-x snap-mandatory scroll-pl-[15px] sm:scroll-pl-0 -mx-[15px] px-[15px] sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="shrink-0 w-64 snap-start sm:w-auto sm:shrink p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2 group hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      srv.pricing_type === 'fixed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : srv.pricing_type === 'starting'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {srv.pricing_type === 'fixed' ? 'Fixed Price' : srv.pricing_type === 'starting' ? 'Starting Base' : 'Quote Required'}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        title="Edit Service"
                        aria-label="Edit Service"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceToDelete(srv)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete Service"
                        aria-label="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">{srv.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{srv.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {srv.duration_estimate || '1 hr'}
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-black text-xs">
                    {srv.pricing_type === 'quote_required'
                      ? 'Custom Quote'
                      : `${srv.pricing_type === 'starting' ? 'From ' : ''}${formatCurrency(srv.price || 0)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. WORK PORTFOLIO */}
      {/* overflow-hidden: same reason as Services & Pricing above -- masks the horizontal-scroll
          row's bleed to the card's own rounded corners instead of a plain rectangular clip. */}
      <Card id="work-portfolio" className="space-y-3.5 overflow-hidden">
        <CardHeader
          title="Work Portfolio"
          subtitle="Photos of completed installations and job sites."
          badge={
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold shrink-0">
              {portfolio.length} Projects
            </span>
          }
          action={
            <button
              type="button"
              onClick={handleOpenAddPortfolio}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title="Add Project"
              aria-label="Add Project"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add Project</span>
            </button>
          }
        />

        {portfolio.length === 0 ? (
          <div className="text-center py-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-xs text-slate-500 font-medium">No past projects uploaded yet.</p>
            <button
              type="button"
              onClick={handleOpenAddPortfolio}
              className="px-3 py-1.5 rounded-xl bg-navy-800 text-white text-xs font-bold cursor-pointer"
            >
              Upload Project Photo
            </button>
          </div>
        ) : (
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible overscroll-x-contain no-scrollbar snap-x snap-mandatory scroll-pl-[15px] sm:scroll-pl-0 -mx-[15px] px-[15px] sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="shrink-0 w-64 snap-start sm:w-auto sm:shrink group rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPortfolio(item)}
                      className="p-1.5 rounded-md bg-slate-950/70 text-white hover:bg-slate-900 cursor-pointer backdrop-blur-xs"
                      title="Edit Project"
                      aria-label="Edit Project"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioToDelete(item)}
                      className="p-1.5 rounded-md bg-rose-600/80 text-white hover:bg-rose-700 cursor-pointer backdrop-blur-xs"
                      title="Delete Project"
                      aria-label="Delete Project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[9px] font-bold backdrop-blur-xs">
                    {item.category}
                  </span>
                </div>

                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                    Completed: {item.date_completed}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. IDENTITY & KYC VERIFICATION */}
      <Card className="space-y-3.5">
        <CardHeader
          title="Identity & Verification"
          subtitle="Government ID check & biometric face liveness match."
          badge={
            isVerified ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 shrink-0">
                Verified Pro
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-500/20 shrink-0">
                KYC Pending
              </span>
            )
          }
        />

        {/* KYC Verification Breakdown Items - Clean without icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Document Verification Item */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Government ID Check</p>
              {isVerified ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Approved</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                  Not Submitted
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isVerified 
                ? 'Government ID document verified and on file.' 
                : 'Upload NIN, Driver’s License, or Voter’s Card'}
            </p>
          </div>

          {/* Facial Liveness Biometric Item */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Face Liveness Match</p>
              {isVerified ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Matched</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                  Not Submitted
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isVerified 
                ? '3D biometric face liveness matched successfully.' 
                : 'Camera blink & smile biometric selfie check'}
            </p>
          </div>
        </div>

        {/* KYC Action Banner */}
        <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isVerified
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="space-y-0.5">
            <p className="font-extrabold text-xs">
              {isVerified 
                ? 'Your Verified Badge is Active' 
                : 'Complete KYC to Unlock Verified Pro Badge'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isVerified
                ? 'Clients see your official Verified badge on search results, quotes, and direct bookings.'
                : 'Verified artisans get 3.8x more client bookings and prioritized search rankings.'}
            </p>
          </div>

          {!isVerified && (
            <button
              type="button"
              onClick={() => setShowKYCModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              Complete Verification
            </button>
          )}
        </div>
      </Card>

      {/* 6. ACCOUNT SETTINGS LINK -- preferences, security, privacy, help & legal all live in the
          shared Settings page so both customer and artisan accounts get the same controls. */}
      {onTabChange && (
        <Card
          as="button"
          onClick={() => onTabChange('settings')}
          className="w-full flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-left cursor-pointer"
        >
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Account Settings</h3>
            <p className="text-[11px] text-slate-400">Preferences, security, privacy, help & legal.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </Card>
      )}

      {/* 7. SIGN OUT */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Sign Out</h3>
          <p className="text-[11px] text-slate-500">Securely sign out of your current session on this device.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer shrink-0 flex items-center justify-center self-start sm:self-auto"
        >
          <span>Sign Out of KaziHub</span>
        </button>
      </Card>

      {/* ================= MODALS ================= */}

      {/* EDIT PROFILE MODAL (Mobile Bottom Sheet Slide-Up / Desktop Centered Modal) */}
      {editInfoSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 ${editInfoSheet.backdropAnimationClasses}`}
          onClick={editInfoGuard.requestClose}
        >
          <div
            className={`w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${editInfoSheet.sheetAnimationClasses}`}
            style={editInfoSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={editInfoSheet.dragHandleProps} />

            <button
              onClick={editInfoGuard.requestClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">Edit Profile</h3>
              <p className="text-xs text-slate-500">Update your name, trade, operating location, contact details, and bio.</p>
            </div>

            <form onSubmit={handleSaveBasicInfo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Professional Title</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Master Electrician & Smart Home Wiring Expert"
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Trade Category</label>
                  <CustomDropdown
                    value={category}
                    onChange={(cat) => setCategory(cat as Category)}
                    options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                    className="w-full"
                    buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Location / City</label>
                  <input
                    type="text"
                    value={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.value)}
                    placeholder="e.g. Ikeja, Lagos"
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Overview</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your trade experience, specialties, and standard work guarantee..."
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={editInfoGuard.requestClose}
                  className="px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={editInfoGuard.showDiscardConfirm}
        onClose={() => editInfoGuard.setShowDiscardConfirm(false)}
        onConfirm={editInfoGuard.confirmDiscard}
        title="Discard Unsaved Changes?"
        description="Your edits to this profile info haven't been saved. Closing now will discard them."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
      />

      {/* SERVICE MODAL (ADD / EDIT) */}
      {serviceSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 ${serviceSheet.backdropAnimationClasses}`}
          onClick={serviceGuard.requestClose}
        >
          <div
            className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${serviceSheet.sheetAnimationClasses}`}
            style={serviceSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={serviceSheet.dragHandleProps} />

            <button
              onClick={serviceGuard.requestClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                {editingServiceId ? 'Edit Service' : 'Add Service'}
              </h3>
              <p className="text-xs text-slate-500">Specify service scope, pricing format, and estimate.</p>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Title</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Inverter Installation & Wiring"
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Pricing Model</label>
                  <CustomDropdown
                    value={servicePricingType}
                    onChange={(val) => setServicePricingType(val as ServicePricingType)}
                    options={[
                      { value: 'fixed', label: 'Fixed Price' },
                      { value: 'starting', label: 'Starting Base' },
                      { value: 'quote_required', label: 'Quote Required' }
                    ]}
                    className="w-full"
                    buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    placeholder="e.g. 1-2 hrs"
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              {servicePricingType !== 'quote_required' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₦)</label>
                  <input
                    type="number"
                    step="500"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
                <textarea
                  rows={3}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="What is included in this service..."
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={serviceGuard.requestClose}
                  className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={serviceGuard.showDiscardConfirm}
        onClose={() => serviceGuard.setShowDiscardConfirm(false)}
        onConfirm={serviceGuard.confirmDiscard}
        title="Discard Unsaved Changes?"
        description="This service hasn't been saved. Closing now will discard your changes."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
      />

      {/* PORTFOLIO MODAL (ADD / EDIT) */}
      {portfolioSheet.shouldRender && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 ${portfolioSheet.backdropAnimationClasses}`}
          onClick={portfolioGuard.requestClose}
        >
          <div
            className={`w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-4 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto ${portfolioSheet.sheetAnimationClasses}`}
            style={portfolioSheet.dragStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <SheetDragHandle dragHandleProps={portfolioSheet.dragHandleProps} />

            <button
              onClick={portfolioGuard.requestClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                {editingPortfolioId ? 'Edit Project' : 'Add Past Project'}
              </h3>
              <p className="text-xs text-slate-500">Showcase your completed job to potential clients.</p>
            </div>

            <form onSubmit={handleSavePortfolio} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g. Duplex 5kVA Solar Inverter Setup"
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Photo URL</label>
                <input
                  type="url"
                  value={portImage}
                  onChange={(e) => setPortImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <CustomDropdown
                    value={portCategory}
                    onChange={(c) => setPortCategory(c as Category)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                    className="w-full"
                    buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date Completed</label>
                  <input
                    type="date"
                    value={portDate}
                    onChange={(e) => setPortDate(e.target.value)}
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Notes / Details</label>
                <textarea
                  rows={3}
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  placeholder="Details of materials installed, challenges resolved..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={portfolioGuard.requestClose}
                  className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={portfolioGuard.showDiscardConfirm}
        onClose={() => portfolioGuard.setShowDiscardConfirm(false)}
        onConfirm={portfolioGuard.confirmDiscard}
        title="Discard Unsaved Changes?"
        description="This portfolio project hasn't been saved. Closing now will discard your changes."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
      />

      {/* SERVICE DELETION CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        onConfirm={confirmDeleteService}
        title="Delete Service"
        description={`Are you sure you want to remove "${serviceToDelete?.name}" from your service offerings?`}
        confirmText="Delete Service"
        type="danger"
      />

      {/* PORTFOLIO DELETION CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(portfolioToDelete)}
        onClose={() => setPortfolioToDelete(null)}
        onConfirm={confirmDeletePortfolio}
        title="Delete Portfolio Project"
        description={`Are you sure you want to delete "${portfolioToDelete?.title}" from your portfolio?`}
        confirmText="Delete Project"
        type="danger"
      />

      {/* KYC DOCUMENT & LIVENESS VERIFICATION MODAL */}
      <KYCVerificationModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onSuccess={handleKYCSuccess}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          if (onLogout) onLogout();
        }}
        title="Sign Out of KaziHub"
        description="Are you sure you want to sign out? You will need to enter your phone number or credentials to log back in."
        confirmText="Sign Out"
        type="logout"
      />
    </div>
  );
};
