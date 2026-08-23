import React, { useState, useRef } from 'react';
import { Professional, ServiceItem, PortfolioItem, ServicePricingType, Category } from '../types';
import { Language, t, SUPPORTED_LANGUAGES } from '../translations';
import { formatCurrency } from '../utils';
import { CATEGORIES } from '../mockData';
import { 
  User, Briefcase, Star, MapPin, Mail, Phone, Calendar, ShieldCheck, 
  Lock, Bell, CheckCircle2, Settings, Camera, Upload, Edit3, Check, 
  ChevronRight, Sliders, Moon, Sun, Globe, AlertTriangle, Trash2, X, Key, LogOut,
  Plus, Eye, Award, Sparkles, Layers, DollarSign, Clock, Navigation, Shield, Radio,
  ToggleLeft, ToggleRight, CheckSquare, RefreshCw, Image, FileText, Smartphone
} from 'lucide-react';

interface ProProfileManagementProps {
  activeProfessional: Professional;
  onUpdateProfile?: (updated: Partial<Professional>) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const ProProfileManagement: React.FC<ProProfileManagementProps> = ({
  activeProfessional,
  onUpdateProfile,
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  onDeleteAccount,
  currentLanguage = 'English (Nigeria)' as Language,
  onLanguageChange
}) => {
  const activeLang = currentLanguage;

  // ---------------- STATE MANAGEMENT ---------------- //

  // Basic Pro Info
  const [name, setName] = useState(activeProfessional.name);
  const [title, setTitle] = useState(activeProfessional.tagline || `${activeProfessional.category} Specialist`);
  const [tagline, setTagline] = useState(activeProfessional.tagline);
  const [bio, setBio] = useState(activeProfessional.bio);
  const [experienceYears, setExperienceYears] = useState(activeProfessional.experienceYears || 5);
  const [hourlyRate, setHourlyRate] = useState(activeProfessional.hourlyRate || 15000);
  const [phone, setPhone] = useState(activeProfessional.phone);
  const [email, setEmail] = useState(activeProfessional.email);
  const [category, setCategory] = useState<Category>(activeProfessional.category);

  // Skills
  const [skills, setSkills] = useState<string[]>(
    activeProfessional.skills || [
      'Inverter Wiring', 'DB Box Balancing', 'Troubleshooting', 'Solar Panel Mounting', 'Conduit Trunking', 'Safety Audits'
    ]
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Services
  const [services, setServices] = useState<ServiceItem[]>(
    activeProfessional.services || [
      {
        id: 'srv-pro-1',
        name: 'Socket & Switch Replacement',
        category: activeProfessional.category,
        description: 'Single or multi-gang socket/switch rewiring, earthing check, and circuit safety test.',
        pricingType: 'fixed',
        price: 5000,
        durationEstimate: '1 hr'
      },
      {
        id: 'srv-pro-2',
        name: 'Distribution Board (DB Box) Inspection & Overhaul',
        category: activeProfessional.category,
        description: 'Breaker replacement, phase balancing, short circuit tracing, and fuse maintenance.',
        pricingType: 'fixed',
        price: 15000,
        durationEstimate: '2-3 hrs'
      },
      {
        id: 'srv-pro-3',
        name: 'Inverter & Changeover Installation',
        category: activeProfessional.category,
        description: 'Complete battery rack, inverter hookup, and manual/auto changeover switch wiring.',
        pricingType: 'starting',
        price: 25000,
        durationEstimate: '3-5 hrs'
      }
    ]
  );

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(activeProfessional.portfolio || []);

  // Service Area
  const [primaryLocation, setPrimaryLocation] = useState(
    activeProfessional.neighborhood ? `${activeProfessional.neighborhood}, ${activeProfessional.location}` : activeProfessional.location
  );
  const [areasServed, setAreasServed] = useState<string[]>(
    activeProfessional.areasServed || ['Bodija', 'Agodi', 'Ring Road', 'Challenge', 'UI', 'Jericho', 'Dugbe', 'Iyaganku']
  );
  const [newAreaInput, setNewAreaInput] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(activeProfessional.serviceRadiusKm || 15);

  // Credentials / Certifications
  const [certifications, setCertifications] = useState<{ id: string; name: string; issuer: string; year: string; verified: boolean }[]>(
    activeProfessional.certifications || [
      { id: 'cert-1', name: 'COREN Electrical Competency Certificate', issuer: 'Council for Regulation of Engineering in Nigeria', year: '2020', verified: true },
      { id: 'cert-2', name: 'NABTEB Solar & Renewable Energy Master Certification', issuer: 'National Business and Technical Examinations Board', year: '2022', verified: true }
    ]
  );

  // Settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'verified_only'>('public');
  const [hidePhoneUntilBooked, setHidePhoneUntilBooked] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [accountDeactivated, setAccountDeactivated] = useState(false);

  // Availability
  const [isAvailable, setIsAvailable] = useState(activeProfessional.isAvailableNow);

  // Modals & UI States
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);
  
  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePricingType, setServicePricingType] = useState<ServicePricingType>('fixed');
  const [servicePrice, setServicePrice] = useState<number>(10000);
  const [serviceDuration, setServiceDuration] = useState('1-2 hrs');
  const [serviceDesc, setServiceDesc] = useState('');

  // Portfolio Modal State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portTitle, setPortTitle] = useState('');
  const [portCategory, setPortCategory] = useState<Category>(activeProfessional.category);
  const [portImage, setPortImage] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portDate, setPortDate] = useState(new Date().toISOString().split('T')[0]);

  // Certification Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('2023');

  // Other Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form notifications
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const portFileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Profile Completion Calculation
  const calculateCompletion = () => {
    let score = 0;
    if (activeProfessional.avatar) score += 15;
    if (name && tagline && bio) score += 20;
    if (services.length > 0) score += 20;
    if (portfolio.length > 0) score += 15;
    if (skills.length >= 3) score += 10;
    if (areasServed.length > 0) score += 10;
    if (certifications.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completionPct = calculateCompletion();

  // Handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && onUpdateProfile) {
        onUpdateProfile({ avatar: event.target.result as string });
        triggerToast('Profile photo updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleAvailability = () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    if (onUpdateProfile) {
      onUpdateProfile({ isAvailableNow: nextVal });
    }
    triggerToast(nextVal ? 'You are now LIVE & Available for job requests!' : 'Availability set to Offline.');
  };

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name,
        tagline,
        bio,
        experienceYears,
        hourlyRate,
        phone,
        email,
        category
      });
    }
    setShowEditInfoModal(false);
    triggerToast('Professional information updated successfully!');
  };

  // Skill Add / Remove
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const updated = [...skills, newSkillInput.trim()];
    setSkills(updated);
    setNewSkillInput('');
    if (onUpdateProfile) onUpdateProfile({ skills: updated });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    if (onUpdateProfile) onUpdateProfile({ skills: updated });
  };

  // Area Add / Remove
  const handleAddArea = () => {
    if (!newAreaInput.trim()) return;
    const updated = [...areasServed, newAreaInput.trim()];
    setAreasServed(updated);
    setNewAreaInput('');
    if (onUpdateProfile) onUpdateProfile({ areasServed: updated });
  };

  const handleRemoveArea = (areaToRemove: string) => {
    const updated = areasServed.filter(a => a !== areaToRemove);
    setAreasServed(updated);
    if (onUpdateProfile) onUpdateProfile({ areasServed: updated });
  };

  const handleRadiusChange = (newRadius: number) => {
    setServiceRadiusKm(newRadius);
    if (onUpdateProfile) onUpdateProfile({ serviceRadiusKm: newRadius });
  };

  // Service CRUD
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePricingType('fixed');
    setServicePrice(10000);
    setServiceDuration('1-2 hrs');
    setServiceDesc('');
    setShowServiceModal(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setServiceName(s.name);
    setServicePricingType(s.pricingType);
    setServicePrice(s.price || 10000);
    setServiceDuration(s.durationEstimate || '1-2 hrs');
    setServiceDesc(s.description);
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedServices: ServiceItem[];
    if (editingServiceId) {
      updatedServices = services.map(s => s.id === editingServiceId ? {
        ...s,
        name: serviceName,
        pricingType: servicePricingType,
        price: servicePricingType === 'quote_required' ? undefined : servicePrice,
        durationEstimate: serviceDuration,
        description: serviceDesc
      } : s);
    } else {
      const newService: ServiceItem = {
        id: `srv-custom-${Date.now()}`,
        name: serviceName,
        category: category,
        description: serviceDesc,
        pricingType: servicePricingType,
        price: servicePricingType === 'quote_required' ? undefined : servicePrice,
        durationEstimate: serviceDuration
      };
      updatedServices = [newService, ...services];
    }
    setServices(updatedServices);
    if (onUpdateProfile) onUpdateProfile({ services: updatedServices });
    setShowServiceModal(false);
    triggerToast(editingServiceId ? 'Service updated!' : 'New service added to your catalog!');
  };

  const handleDeleteService = (idToDelete: string) => {
    const updated = services.filter(s => s.id !== idToDelete);
    setServices(updated);
    if (onUpdateProfile) onUpdateProfile({ services: updated });
    triggerToast('Service removed.');
  };

  // Portfolio CRUD
  const handleOpenAddPortfolio = () => {
    setEditingPortfolioId(null);
    setPortTitle('');
    setPortCategory(category);
    setPortImage('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800');
    setPortDesc('');
    setPortDate(new Date().toISOString().split('T')[0]);
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (p: PortfolioItem) => {
    setEditingPortfolioId(p.id);
    setPortTitle(p.title);
    setPortCategory(p.category);
    setPortImage(p.imageUrl);
    setPortDesc(p.description);
    setPortDate(p.dateCompleted);
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
        imageUrl: portImage,
        description: portDesc,
        dateCompleted: portDate
      } : p);
    } else {
      const newPort: PortfolioItem = {
        id: `port-${Date.now()}`,
        title: portTitle,
        category: portCategory,
        imageUrl: portImage || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
        description: portDesc,
        dateCompleted: portDate
      };
      updatedPortfolio = [newPort, ...portfolio];
    }
    setPortfolio(updatedPortfolio);
    if (onUpdateProfile) onUpdateProfile({ portfolio: updatedPortfolio });
    setShowPortfolioModal(false);
    triggerToast(editingPortfolioId ? 'Portfolio item updated!' : 'New project added to your portfolio!');
  };

  const handleDeletePortfolio = (idToDelete: string) => {
    const updated = portfolio.filter(p => p.id !== idToDelete);
    setPortfolio(updated);
    if (onUpdateProfile) onUpdateProfile({ portfolio: updated });
    triggerToast('Portfolio item removed.');
  };

  // Certification CRUD
  const handleSaveCert = (e: React.FormEvent) => {
    e.preventDefault();
    const newCert = {
      id: `cert-${Date.now()}`,
      name: certName,
      issuer: certIssuer,
      year: certYear,
      verified: true
    };
    const updated = [...certifications, newCert];
    setCertifications(updated);
    if (onUpdateProfile) onUpdateProfile({ certifications: updated });
    setShowCertModal(false);
    setCertName('');
    setCertIssuer('');
    triggerToast('Certification added!');
  };

  const handleDeleteCert = (idToDelete: string) => {
    const updated = certifications.filter(c => c.id !== idToDelete);
    setCertifications(updated);
    if (onUpdateProfile) onUpdateProfile({ certifications: updated });
    triggerToast('Certification removed.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in">
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

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800/10 text-navy-800 dark:text-navy-300 text-xs font-bold mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Artisan Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Professional Profile Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Customize how customers see your services, pricing, portfolio, and credentials across KaziHub.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPublicProfileModal(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-navy-800 dark:text-navy-400" />
            <span>View Public Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEditInfoModal(true)}
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Left: Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5">
            {/* Avatar with Upload */}
            <div className="relative group shrink-0">
              <img
                src={activeProfessional.avatar}
                alt={activeProfessional.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-navy-800/10 dark:ring-slate-700 shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                title="Change Profile Photo" aria-label="Change Profile Photo"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change Photo</span>
              </button>
              {activeProfessional.verified && (
                <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900 shadow-md" title="Verified Professional" aria-label="Verified Professional">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Title & Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-navy-50 dark:bg-navy-950 text-navy-800 dark:text-navy-300 text-xs font-bold border border-navy-100 dark:border-navy-900">
                  {category}
                </span>
                {activeProfessional.verified && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified KaziHub Partner</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{name}</h2>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{tagline}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
                  {primaryLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
                  {experienceYears} Years Experience
                </span>
                <span className="flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {activeProfessional.rating} ({activeProfessional.reviewCount} Reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Availability Toggle & Quick Status */}
          <div className="w-full md:w-auto bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  {isAvailable ? 'Available Now' : 'Offline Mode'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleAvailability}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAvailable
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isAvailable ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span>Go Offline</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span>Go Online</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAvailable
                ? 'Your profile is highlighted in customer nearby searches for immediate emergency & scheduled bookings.'
                : 'Turn online to receive live customer booking notifications and quotes.'}
            </p>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold text-slate-900 dark:text-slate-100">Profile Strength & Completeness</span>
            </div>
            <span className="font-black text-navy-800 dark:text-navy-400">{completionPct}% Complete</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${completionPct}%` }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-500">
            {completionPct === 100
              ? '🎉 Outstanding! Your profile is 100% optimized for maximum customer trust and search visibility.'
              : 'Tip: Add missing portfolio photos, services, and trade certifications to reach 100% profile strength.'}
          </p>
        </div>
      </div>

      {/* 2. PROFESSIONAL INFORMATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Professional Information</h2>
              <p className="text-xs text-slate-500">Bio, work history, tagline, and specialized skill tags</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEditInfoModal(true)}
            className="text-xs font-bold text-navy-800 dark:text-navy-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Full Display Name</span>
              <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{name}</p>
            </div>

            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Trade Category & Professional Title</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{category} • {title}</p>
            </div>

            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Tagline / Catchphrase</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 italic">"{tagline}"</p>
            </div>

            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Years of Field Experience</span>
              <p className="font-black text-slate-900 dark:text-slate-100">{experienceYears} Years Active Experience</p>
            </div>

            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Standard Hourly Rate</span>
              <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(hourlyRate)} / hour</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">Professional Bio</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {bio}
              </p>
            </div>

            {/* Skills & Specialties Tags */}
            <div className="space-y-2">
              <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider">Skills & Specialties</span>
              
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-navy-50 dark:bg-navy-950 text-navy-900 dark:text-navy-200 border border-navy-100 dark:border-navy-900 text-xs font-bold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove skill" aria-label="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Skill Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill (e.g. Solar Conduit, Generator Interlock)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 rounded-xl bg-navy-800 text-white font-bold text-xs hover:bg-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SERVICES & PRICING */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Services & Pricing Catalog</h2>
              <p className="text-xs text-slate-500">Manage fixed rates, starting prices, and quote offerings for customers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddService}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No custom services added yet.</p>
            <button
              type="button"
              onClick={handleOpenAddService}
              className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold cursor-pointer"
            >
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3 group hover:border-navy-800/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      srv.pricingType === 'fixed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : srv.pricingType === 'starting'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {srv.pricingType === 'fixed' ? 'Fixed Price' : srv.pricingType === 'starting' ? 'Starting Base' : 'Quote Required'}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="p-1 rounded-lg text-slate-400 hover:text-navy-800 dark:hover:text-navy-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        title="Edit Service" aria-label="Edit Service"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete Service" aria-label="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">{srv.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{srv.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {srv.durationEstimate || '1 hr'}
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-black">
                    {srv.pricingType === 'quote_required'
                      ? 'Custom Quote'
                      : `${srv.pricingType === 'starting' ? 'From ' : ''}${formatCurrency(srv.price || 0)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PORTFOLIO GALLERY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Work Portfolio Gallery</h2>
              <p className="text-xs text-slate-500">Showcase past completed projects, before/after photos, and site descriptions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddPortfolio}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Work Project</span>
          </button>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
            <Image className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No portfolio items uploaded yet.</p>
            <button
              type="button"
              onClick={handleOpenAddPortfolio}
              className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold cursor-pointer"
            >
              Upload Project Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPortfolio(item)}
                      className="p-1.5 rounded-lg bg-slate-950/70 text-white hover:bg-slate-900 cursor-pointer backdrop-blur-xs"
                      title="Edit Project" aria-label="Edit Project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePortfolio(item.id)}
                      className="p-1.5 rounded-lg bg-rose-600/80 text-white hover:bg-rose-700 cursor-pointer backdrop-blur-xs"
                      title="Delete Project" aria-label="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold backdrop-blur-xs">
                    {item.category}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    Completed: {item.dateCompleted}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. SERVICE AREA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Service Coverage Area</h2>
            <p className="text-xs text-slate-500">Primary location base, coverage radius, and neighborhoods served</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Primary Location */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                Primary Base Location
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={primaryLocation}
                  onChange={(e) => setPrimaryLocation(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProfile) onUpdateProfile({ location: primaryLocation });
                    triggerToast('Primary base location updated!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-navy-800 text-white font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Service Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Service Radius</span>
                <span className="font-black text-navy-800 dark:text-navy-400">{serviceRadiusKm} km coverage</span>
              </div>

              <input
                type="range"
                min="3"
                max="50"
                step="1"
                value={serviceRadiusKm}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full accent-navy-800 dark:accent-navy-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>3 km (Local)</span>
                <span>15 km (City)</span>
                <span>50 km (Statewide)</span>
              </div>
            </div>
          </div>

          {/* Neighborhoods / Areas Served Tags */}
          <div className="space-y-3">
            <span className="block font-bold text-slate-400 text-[11px] uppercase tracking-wider">Areas & Neighborhoods Served</span>
            
            <div className="flex flex-wrap gap-2">
              {areasServed.map((area, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold"
                >
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveArea(area)}
                    className="hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove area" aria-label="Remove area"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Area Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddArea())}
                placeholder="Add neighborhood (e.g. Jericho, Akobo, Oluyole)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 focus:border-brand-orange-500"
              />
              <button
                type="button"
                onClick={handleAddArea}
                className="px-3 py-2 rounded-xl bg-navy-800 text-white font-bold text-xs hover:bg-navy-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. CREDENTIALS & VERIFICATION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Trade Credentials & Verification</h2>
              <p className="text-xs text-slate-500">Government identity verification, guild certificates, and licenses</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCertModal(true)}
            className="px-4 py-2 rounded-xl bg-navy-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </button>
        </div>

        {/* Verification Status Banner Placeholder */}
        <div className="p-4 rounded-2xl bg-navy-50 dark:bg-navy-950/60 border border-navy-100 dark:border-navy-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900 dark:text-slate-100">National Identity & NIN Verification</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px]">VERIFIED</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Identity verified by KaziHub Trust & Safety via NIMC database. Verified shield attached to your public listing.
              </p>
            </div>
          </div>
        </div>

        {/* Certifications List */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">Uploaded Trade Certifications</h3>

          {certifications.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No trade certifications added yet.</p>
          ) : (
            <div className="space-y-2.5">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-100">{cert.name}</p>
                      <p className="text-[11px] text-slate-500">{cert.issuer} • Issued {cert.year}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold text-[10px] border border-teal-500/20">
                      Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCert(cert.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete Certification" aria-label="Delete Certification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. PROFILE SETTINGS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-slate-800/10 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">Profile & Notification Settings</h2>
            <p className="text-xs text-slate-500">Notifications, security preferences, language, and display mode</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Notifications */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Push Notifications</p>
              <p className="text-[11px] text-slate-500">Alerts for new customer booking requests and instant chat messages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Email Alerts</p>
              <p className="text-[11px] text-slate-500">Weekly earnings summaries and escrow payout notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-800"></div>
            </label>
          </div>

          {/* Privacy */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Profile Visibility</p>
              <p className="text-[11px] text-slate-500">Control who can discover your professional listing</p>
            </div>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="public">Public to All Customers</option>
              <option value="verified_only">Verified Customers Only</option>
            </select>
          </div>

          {/* Security & Password */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Account Password</p>
              <p className="text-[11px] text-slate-500">Update login password and security key</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-navy-800 dark:text-navy-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Change Password
            </button>
          </div>

          {/* Language Selector */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">{t('pref.language', activeLang)}</p>
              <p className="text-[11px] text-slate-500 font-semibold text-navy-800 dark:text-navy-400">{activeLang}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLanguageModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-navy-800 dark:text-navy-400" />
              <span>Change Language</span>
            </button>
          </div>

          {/* Appearance Toggle */}
          <div className="py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Appearance Theme</p>
              <p className="text-[11px] text-slate-500">Currently: <strong className="text-slate-700 dark:text-slate-300">{darkMode ? 'Dark Mode' : 'Light Mode'}</strong></p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 9. ACCOUNT ACTIONS */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 rounded-2xl p-3.5 sm:p-4 border border-rose-500/20 dark:border-rose-900/40 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-500/10 dark:border-rose-900/30">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <div>
            <h2 className="font-black text-base text-rose-700 dark:text-rose-300">Account Management & Deactivation</h2>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70">Pause or permanently remove your professional account on KaziHub</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDeactivateConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-xs border border-amber-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ToggleLeft className="w-3.5 h-3.5" />
            <span>Deactivate Account</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* EDIT BASIC INFORMATION MODAL */}
      {showEditInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditInfoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Edit Professional Information</h3>
              <p className="text-xs text-slate-500">Update your name, title, tagline, bio, and hourly rate.</p>
            </div>

            <form onSubmit={handleSaveBasicInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Trade Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Master electrician & certified solar engineer in Ibadan"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Years Experience</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hourly Rate (₦)</label>
                  <input
                    type="number"
                    step="1000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Overview</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditInfoModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  Save Profile Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE MODAL (ADD / EDIT) */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {editingServiceId ? 'Edit Service Offering' : 'Add New Service Offering'}
              </h3>
              <p className="text-xs text-slate-500">Define service title, pricing model, rate, and estimated duration.</p>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Automatic Generator Changeover Switch Fitting"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pricing Model</label>
                <select
                  value={servicePricingType}
                  onChange={(e) => setServicePricingType(e.target.value as ServicePricingType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="fixed">Fixed Price (Customer pays exact amount)</option>
                  <option value="starting">Starting From (Base rate, final quote on site)</option>
                  <option value="quote_required">Request Custom Quote (Estimate on request)</option>
                </select>
              </div>

              {servicePricingType !== 'quote_required' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {servicePricingType === 'fixed' ? 'Fixed Price (₦)' : 'Starting Price (₦)'}
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder="e.g. 1-2 hrs, 3-5 hrs, 1 day"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Description</label>
                <textarea
                  rows={3}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Explain what is included in this service..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORTFOLIO MODAL (ADD / EDIT) */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPortfolioModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {editingPortfolioId ? 'Edit Portfolio Project' : 'Add Work Portfolio Project'}
              </h3>
              <p className="text-xs text-slate-500">Add photos and details of completed job sites.</p>
            </div>

            <form onSubmit={handleSavePortfolio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  placeholder="e.g. 10KVA Solar Hybrid Inverter Site at Jericho"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                <input
                  type="text"
                  value={portImage}
                  onChange={(e) => setPortImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date Completed</label>
                <input
                  type="date"
                  value={portDate}
                  onChange={(e) => setPortDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Description</label>
                <textarea
                  rows={3}
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  placeholder="Describe the scope of work, materials used, and problem solved..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CERTIFICATION MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Add Trade Certification</h3>
              <p className="text-xs text-slate-500">Provide official certification details for review.</p>
            </div>

            <form onSubmit={handleSaveCert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Certification Name</label>
                <input
                  type="text"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. COREN Registered Engineer, NABTEB Solar Tech"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Issuing Body / Institution</label>
                <input
                  type="text"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  placeholder="e.g. Council for Regulation of Engineering in Nigeria"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Year Issued</label>
                <input
                  type="text"
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value)}
                  placeholder="2022"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  Add Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC PROFILE PREVIEW MODAL */}
      {showPublicProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPublicProfileModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <Eye className="w-3.5 h-3.5" />
              <span>Customer Public View Preview</span>
            </div>

            {/* Public Card Preview */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-6">
              <div className="flex items-start gap-4">
                <img
                  src={activeProfessional.avatar}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-navy-800"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{name}</h3>
                    {activeProfessional.verified && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <p className="text-xs font-extrabold text-navy-800 dark:text-navy-300">{category}</p>
                  <p className="text-xs text-slate-500">{tagline}</p>
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="font-extrabold text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {activeProfessional.rating} ({activeProfessional.reviewCount} reviews)
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-300 font-bold">{primaryLocation}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100">About Artisan</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{bio}</p>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Featured Offerings</h4>
                <div className="space-y-1.5">
                  {services.slice(0, 3).map((s) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {s.price ? formatCurrency(s.price) : 'Quote'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPublicProfileModal(false)}
                className="px-6 py-2.5 rounded-xl bg-navy-800 text-white font-black text-xs shadow-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECTOR MODAL */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowLanguageModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{t('modal.select_language', activeLang)}</h3>
                <p className="text-xs text-slate-500">{t('modal.choose_language', activeLang)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (onLanguageChange) onLanguageChange(lang);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    activeLang === lang
                      ? 'bg-navy-800 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{lang}</span>
                  {activeLang === lang && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy-800/10 text-navy-800 dark:text-navy-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Change Password</h3>
                <p className="text-xs text-slate-500">Ensure your artisan account uses a strong password.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerToast('Password updated successfully!');
                setShowPasswordModal(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE ACCOUNT CONFIRM MODAL */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowDeactivateConfirm(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ToggleLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Deactivate Professional Account</h3>
                <p className="text-xs text-slate-500">Temporarily pause customer booking requests.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deactivating your account will temporarily remove your profile from customer search results and pause incoming quotes. You can reactivate anytime by logging back in.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAvailable(false);
                  if (onUpdateProfile) onUpdateProfile({ isAvailableNow: false });
                  setShowDeactivateConfirm(false);
                  triggerToast('Profile deactivated. You can re-enable availability anytime.');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-700 dark:text-rose-400">Permanently Delete Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deleting your KaziHub Artisan Account will permanently erase your job history, customer reviews, ratings, and active quote records.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
