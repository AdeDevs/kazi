import React, { useState, useRef, useEffect } from 'react';
import { Professional, ServiceItem, PortfolioItem, ServicePricingType, Category } from '../types';
import { formatAmount, formatCurrency, localDateISO } from '../utils';
import { CATEGORIES } from '../mockData';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { UnsavedChangesModal } from './ui/UnsavedChangesModal';
import { KYCVerificationModal, VerificationSubmission } from './ui/KYCVerificationModal';
import { getVerificationStatus, submitVerification, uploadVerificationFile, VerificationResponse, VerificationStatus } from '../lib/verificationApi';
import { UserAvatar, getInitials, getAvatarColor } from './ui/UserAvatar';
import { VerifiedBadge } from './ui/VerifiedBadge';
import { Card, CardHeader } from './ui/Card';
import { SheetDragHandle } from './ui/SheetDragHandle';
import { CustomDropdown } from './CustomDropdown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  saveMyProfile, createService, updateService, deleteService,
  createPortfolioItem, deletePortfolioItem, uploadPortfolioImage, mapService, mapPortfolioItem,
} from '../lib/profilesApi';
import { toast } from 'sonner';
import { useSlideUpSheet } from '../hooks/useSlideUpSheet';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { useAccountFrozen } from '../hooks/useAccountFrozen';
import {
  MapPin,
  CheckCircle2, Edit3, Trash2, X,
  Plus, Clock, ChevronRight, ImagePlus
} from 'lucide-react';

const PRICING_LABELS: Record<ServicePricingType, string> = {
  starting: 'Starting from',
  fixed: 'Fixed price',
  quote_required: 'Quote only',
};

interface WorkDraft {
  years: number;
  skills: string;
  responseTime: string;
  pricingType: ServicePricingType;
  basePrice: number;
  accepting: boolean;
}

const workDraftFrom = (p: Pick<Professional, 'years_of_experience' | 'skills' | 'response_time' | 'pricing_type' | 'base_price' | 'is_available'>): WorkDraft => ({
  years: p.years_of_experience || 0,
  skills: (p.skills || []).join(', '),
  responseTime: p.response_time || '',
  pricingType: p.pricing_type || 'starting',
  basePrice: p.base_price || 0,
  accepting: p.is_available ?? true,
});

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50';

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
  const { updateUser, uploadProfilePicture, isDemo } = useAuth();
  const navigate = useNavigate();
  const { blockIfFrozen } = useAccountFrozen();
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

  // Work details: the PUT /profiles/me fields customers see about experience and pricing.
  const [work, setWork] = useState<WorkDraft>(() => workDraftFrom(activeProfessional));
  const setWorkField = <K extends keyof WorkDraft>(key: K, value: WorkDraft[K]) => setWork(prev => ({ ...prev, [key]: value }));

  // Inline edit mode. The fields are live-bound to the same state the card displays, so a
  // snapshot taken on entry tells us whether anything changed and lets Cancel revert to it.
  const [isEditing, setIsEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState({ name, tagline, bio, phone, category, primaryLocation, work });
  const startEditing = () => {
    if (blockIfFrozen()) return;
    setEditBaseline({ name, tagline, bio, phone, category, primaryLocation, work });
    setIsEditing(true);
  };
  const isEditDirty =
    name !== editBaseline.name ||
    tagline !== editBaseline.tagline ||
    bio !== editBaseline.bio ||
    phone !== editBaseline.phone ||
    category !== editBaseline.category ||
    primaryLocation !== editBaseline.primaryLocation ||
    JSON.stringify(work) !== JSON.stringify(editBaseline.work);
  const discardEdits = () => {
    setName(editBaseline.name);
    setTagline(editBaseline.tagline);
    setBio(editBaseline.bio);
    setPhone(editBaseline.phone);
    setCategory(editBaseline.category);
    setPrimaryLocation(editBaseline.primaryLocation);
    setWork(editBaseline.work);
    setIsEditing(false);
  };
  const editGuard = useUnsavedChangesGuard(isEditDirty, discardEdits);
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);

  // The artisan's profile arrives from the backend after mount, so re-seed the form whenever the
  // underlying values change -- but never mid-edit, which would clobber what they're typing.
  const {
    name: proName, tagline: proTagline, bio: proBio, phone_number: proPhone, email: proEmail,
    category: proCategory, neighborhood: proNeighborhood, state: proState,
    services: proServices, portfolio: proPortfolio,
  } = activeProfessional;
  useEffect(() => {
    if (isEditing) return;
    setName(proName);
    setTagline(proTagline);
    setBio(proBio);
    setPhone(proPhone);
    setEmail(proEmail);
    setCategory(proCategory);
    setPrimaryLocation(proNeighborhood ? `${proNeighborhood}, ${proState}` : proState);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isEditing only gates, it isn't a trigger
  }, [proName, proTagline, proBio, proPhone, proEmail, proCategory, proNeighborhood, proState]);
  const {
    years_of_experience: proYears, skills: proSkills, response_time: proResponseTime,
    pricing_type: proPricingType, base_price: proBasePrice, is_available: proAvailable,
  } = activeProfessional;
  const proSkillsKey = (proSkills || []).join(', ');
  useEffect(() => {
    if (isEditing) return;
    setWork(workDraftFrom({
      years_of_experience: proYears, skills: proSkills, response_time: proResponseTime,
      pricing_type: proPricingType, base_price: proBasePrice, is_available: proAvailable,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isEditing only gates; skills compared by value
  }, [proYears, proSkillsKey, proResponseTime, proPricingType, proBasePrice, proAvailable]);
  useEffect(() => {
    if (proServices) setServices(proServices);
  }, [proServices]);
  useEffect(() => {
    setPortfolio(proPortfolio || []);
  }, [proPortfolio]);

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
  const [isSavingService, setIsSavingService] = useState(false);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [isUploadingPortfolioPhoto, setIsUploadingPortfolioPhoto] = useState(false);
  const portfolioPhotoInputRef = useRef<HTMLInputElement>(null);

  const handlePortfolioPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('That file isn’t an image. Choose a JPG, PNG or similar photo.');
      return;
    }
    setIsUploadingPortfolioPhoto(true);
    try {
      setPortImage(await uploadPortfolioImage(file));
    } catch (err: any) {
      toast.error(err?.message || 'Could not upload this photo. Try again.');
    } finally {
      setIsUploadingPortfolioPhoto(false);
    }
  };

  // Portfolio Modal & Deletion State
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portTitle, setPortTitle] = useState('');
  const [portCategory, setPortCategory] = useState<Category>(activeProfessional.category);
  const [portImage, setPortImage] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portDate, setPortDate] = useState(localDateISO());
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

  // Verification status comes from GET /verification/status -- the Verified badge only shows once an
  // admin has approved it. The demo account (no backend) keeps its local sample flag.
  const [kycSubmitted, setKycSubmitted] = useState<boolean>(
    () => localStorage.getItem(`kazihub_kyc_completed_${activeProfessional.id}`) === 'true'
  );
  const [verification, setVerification] = useState<VerificationResponse | null>(null);
  useEffect(() => {
    if (isDemo) return;
    getVerificationStatus().then(setVerification).catch(() => undefined);
  }, [isDemo]);
  const verificationState: 'none' | VerificationStatus = isDemo
    ? (kycSubmitted ? 'approved' : 'none')
    : verification?.status ?? 'none';
  const isVerified = verificationState === 'approved';
  const verificationLabel = {
    none: 'Get Verified',
    pending: 'Verification Under Review',
    approved: 'Verified',
    rejected: 'Verification Not Approved',
  }[verificationState];

  const openVerification = () => {
    if (verificationState === 'pending') {
      toast.info('Your documents are under review. The result will show on your profile.');
      return;
    }
    if (verificationState === 'approved' || blockIfFrozen()) return;
    setShowKYCModal(true);
  };

  const handleSubmitVerification = async (sub: VerificationSubmission) => {
    const toBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();
    const [docBlob, selfieBlob] = await Promise.all([toBlob(sub.docImage), toBlob(sub.selfie)]);
    const ext = (b: Blob) => (b.type.split('/')[1] || 'jpg').split(';')[0];
    const docUpload = await uploadVerificationFile(docBlob, `id-document.${ext(docBlob)}`);
    const selfieUpload = await uploadVerificationFile(selfieBlob, `selfie.${ext(selfieBlob)}`);
    const result = await submitVerification({
      document_type: sub.docType,
      document_number: sub.docNumber,
      document_image_public_id: docUpload.public_id,
      document_image_format: docUpload.format,
      liveness_selfie_public_id: selfieUpload.public_id,
      liveness_selfie_format: selfieUpload.format,
      document_image_upload_token: docUpload.upload_token,
      liveness_selfie_upload_token: selfieUpload.upload_token,
      biometric_consent: true,
    });
    setVerification(result);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (blockIfFrozen()) return;
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
      toast.success('Profile photo updated and saved!');
    } catch (err: any) {
      toast.error(err.message || 'Profile photo updated.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBasicInfo(true);
    try {
      // Name/phone live on the user account; tagline/bio/category on the artisan profile.
      // `primaryLocation` is a free-text "Neighborhood, State" string -- only the neighborhood
      // half is sent (and only when both halves are present), never a parsed guess at user.state.
      const [firstName, ...rest] = name.trim().split(/\s+/);
      await updateUser({
        first_name: firstName || name,
        last_name: rest.join(' '),
        phone_number: phone,
      });
      // Untouched, this field shows "State, Nigeria" when no neighbourhood is set -- sending its
      // first half would save the state as the neighbourhood, so only send an actual edit.
      const locationEdited = primaryLocation !== editBaseline.primaryLocation;
      const locationParts = locationEdited ? primaryLocation.split(',').map(s => s.trim()).filter(Boolean) : [];
      const skills = work.skills.split(',').map(s => s.trim()).filter(Boolean);
      const basePrice = work.pricingType === 'quote_required' ? 0 : work.basePrice;
      await saveMyProfile({
        business_name: name.trim(),
        tagline,
        bio,
        ...(category ? { category } : {}),
        ...(locationParts.length >= 2 ? { neighborhood: locationParts[0] } : {}),
        years_of_experience: work.years,
        skills,
        response_time: work.responseTime.trim() || null,
        pricing_type: work.pricingType,
        base_price: basePrice,
        is_available: work.accepting,
      });
      if (onUpdateProfile) {
        onUpdateProfile({
          name,
          tagline,
          bio,
          phone_number: phone,
          email,
          category,
          state: primaryLocation,
          years_of_experience: work.years,
          skills,
          response_time: work.responseTime.trim() || undefined,
          pricing_type: work.pricingType,
          base_price: basePrice,
          is_available: work.accepting,
        });
      }
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingBasicInfo(false);
    }
  };

  // Service CRUD
  const handleOpenAddService = () => {
    if (blockIfFrozen()) return;
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
    if (blockIfFrozen()) return;
    setEditingServiceId(s.id);
    setServiceName(s.name);
    setServicePricingType(s.pricing_type);
    setServicePrice(s.price || 10000);
    setServiceDuration(s.duration_estimate || '1-2 hrs');
    setServiceDesc(s.description);
    setServiceBaseline({ name: s.name, pricingType: s.pricing_type, price: s.price || 10000, duration: s.duration_estimate || '1-2 hrs', desc: s.description });
    setShowServiceModal(true);
  };

  const commitServices = (updated: ServiceItem[]) => {
    setServices(updated);
    if (onUpdateProfile) onUpdateProfile({ services: updated });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error('Choose your trade in Edit info before adding services.');
      return;
    }
    const payload = {
      name: serviceName.trim(),
      category,
      pricing_type: servicePricingType,
      description: serviceDesc,
      price: servicePricingType === 'quote_required' ? 0 : servicePrice,
      duration_estimate: serviceDuration,
    };
    setIsSavingService(true);
    try {
      if (editingServiceId) {
        const saved = mapService(await updateService(editingServiceId, payload));
        commitServices(services.map(s => (s.id === editingServiceId ? saved : s)));
      } else {
        const saved = mapService(await createService(payload));
        commitServices([saved, ...services]);
      }
      setShowServiceModal(false);
      toast.success(editingServiceId ? 'Service updated.' : 'Service added.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save this service. Try again.');
    } finally {
      setIsSavingService(false);
    }
  };

  const confirmDeleteService = async () => {
    if (blockIfFrozen()) return;
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete.id);
      commitServices(services.filter(s => s.id !== serviceToDelete.id));
      toast.success('Service removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not remove this service. Try again.');
    } finally {
      setServiceToDelete(null);
    }
  };

  // Portfolio CRUD
  const handleOpenAddPortfolio = () => {
    if (blockIfFrozen()) return;
    setEditingPortfolioId(null);
    const defaultImage = '';
    const defaultDate = localDateISO();
    setPortTitle('');
    setPortCategory(category);
    setPortImage(defaultImage);
    setPortDesc('');
    setPortDate(defaultDate);
    setPortfolioBaseline({ title: '', category, image: defaultImage, desc: '', date: defaultDate });
    setShowPortfolioModal(true);
  };

  const handleOpenEditPortfolio = (p: PortfolioItem) => {
    if (blockIfFrozen()) return;
    setEditingPortfolioId(p.id);
    setPortTitle(p.title);
    setPortCategory(p.category);
    setPortImage(p.image_url);
    setPortDesc(p.description);
    setPortDate(p.date_completed);
    setPortfolioBaseline({ title: p.title, category: p.category, image: p.image_url, desc: p.description, date: p.date_completed });
    setShowPortfolioModal(true);
  };

  const commitPortfolio = (updated: PortfolioItem[]) => {
    setPortfolio(updated);
    if (onUpdateProfile) onUpdateProfile({ portfolio: updated });
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portImage) {
      toast.error('Add a photo of this project.');
      return;
    }
    if (!portCategory) {
      toast.error('Choose a category for this project.');
      return;
    }
    // `max` on the date input stops the picker, but a typed date can still get past it.
    if (portDate && portDate > localDateISO()) {
      toast.error('A past project can’t be completed after today. Pick today or an earlier date.');
      return;
    }
    const payload = {
      title: portTitle.trim(),
      category: portCategory,
      image_url: portImage.trim(),
      description: portDesc,
      date_completed: portDate || null,
    };
    setIsSavingPortfolio(true);
    try {
      const saved = mapPortfolioItem(await createPortfolioItem(payload));
      if (editingPortfolioId) {
        // No update endpoint exists for portfolio items, so an edit saves the new version first
        // and only then removes the old one -- a failure never leaves the project missing.
        const oldId = editingPortfolioId;
        commitPortfolio(portfolio.map(p => (p.id === oldId ? saved : p)));
        try {
          await deletePortfolioItem(oldId);
        } catch (err) {
          console.warn('Saved the edited project but could not remove the old copy', err);
          toast.error('Project updated, but the old version is still on your profile. Remove it manually.');
        }
      } else {
        commitPortfolio([saved, ...portfolio]);
      }
      setShowPortfolioModal(false);
      toast.success(editingPortfolioId ? 'Project updated.' : 'Project added to your portfolio.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save this project. Try again.');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const confirmDeletePortfolio = async () => {
    if (blockIfFrozen()) return;
    if (!portfolioToDelete) return;
    try {
      await deletePortfolioItem(portfolioToDelete.id);
      commitPortfolio(portfolio.filter(p => p.id !== portfolioToDelete.id));
      toast.success('Project removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not remove this project. Try again.');
    } finally {
      setPortfolioToDelete(null);
    }
  };

  const handleKYCSuccess = () => {
    if (!isDemo) return; // real submissions stay pending until an admin reviews them
    setKycSubmitted(true);
    localStorage.setItem(`kazihub_kyc_completed_${activeProfessional.id}`, 'true');
    onUpdateProfile?.({ is_verified: true, verificationStatus: 'verified' });
  };

  useEffect(() => {
    if (!scrollToSection) return;
    const el = document.getElementById(scrollToSection);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onScrollToSectionHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToSection]);


  const detailRows: { label: string; value: string }[] = [
    { label: 'Tagline', value: tagline || 'Not set' },
    { label: 'Phone Number', value: phone || 'Not set' },
    { label: 'Email Address', value: email || 'Not set' },
    { label: 'Base Location', value: primaryLocation || 'Not set' },
  ];
  const workRows: { label: string; value: string }[] = [
    { label: 'Accepting new jobs', value: work.accepting ? 'Yes' : 'No, paused' },
    { label: 'Experience', value: work.years ? `${work.years} year${work.years === 1 ? '' : 's'}` : 'Not set' },
    { label: 'Skills', value: work.skills || 'Not set' },
    { label: 'Response time', value: work.responseTime || 'Not set' },
    {
      label: 'Pricing',
      value: work.pricingType === 'quote_required'
        ? 'Quote only'
        : work.basePrice ? `${PRICING_LABELS[work.pricingType]} ${formatCurrency(work.basePrice)}` : 'Not set',
    },
  ];
  return (
    <div className="w-full max-w-none space-y-4 animate-in fade-in">
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
          <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 min-w-0">
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {primaryLocation}
            </span>
            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg font-bold">
              {activeProfessional.completed_jobs_count ?? 0} jobs
            </span>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="px-3.5 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-[11px] shadow-xs transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
          </div>

          {!isVerified && (
            <button
              type="button"
              onClick={openVerification}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>{verificationLabel}</span>
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
                className="relative shrink-0 cursor-pointer rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg"
                title="Tap to change your photo"
                aria-label="Change profile photo"
              >
                <UserAvatar
                  src={activeProfessional.profile_picture}
                  name={activeProfessional.name}
                  sizeClassName="w-20 h-20"
                  textClassName="text-2xl font-black"
                  roundedClassName="rounded-none"
                  bordered={false}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
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
                  onClick={openVerification}
                  className="px-2.5 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 cursor-pointer inline-flex items-center gap-1 transition-colors"
                >
                  <span>{verificationLabel}</span>
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
                {activeProfessional.completed_jobs_count ?? 0} Jobs Completed
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-amber-600 dark:text-amber-400">
                ★ {activeProfessional.rating_average} <span className="text-slate-500 font-medium">({activeProfessional.review_count} Reviews)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Details + work details, read-only or edited inline in the same place */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {!isEditing ? (
            <>
              {bio && (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pb-3">{bio}</p>
              )}
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {detailRows.map(row => (
                  <div key={row.label} className="py-3 flex items-start justify-between gap-4">
                    <dt className="font-semibold text-slate-500 shrink-0">{row.label}</dt>
                    <dd className={`text-right font-bold min-w-0 break-words ${row.value === 'Not set' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 dark:border-slate-800">Work details</p>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {workRows.map(row => (
                  <div key={row.label} className="py-3 flex items-start justify-between gap-4">
                    <dt className="font-semibold text-slate-500 shrink-0">{row.label}</dt>
                    <dd className={`text-right font-bold min-w-0 break-words ${row.value === 'Not set' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <form onSubmit={handleSaveBasicInfo} className="space-y-3.5">
              <div>
                <label htmlFor="pp-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input id="pp-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
              </div>

              <div>
                <label htmlFor="pp-tagline" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Professional Title</label>
                <input
                  id="pp-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Master Electrician & Smart Home Wiring Expert"
                  className={fieldClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Trade Category</span>
                  <CustomDropdown
                    value={category}
                    onChange={(cat) => setCategory(cat as Category)}
                    options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Choose your trade"
                    className="w-full"
                    asFormField
                    buttonClassName="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="pp-location" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Location / City</label>
                  <input
                    id="pp-location"
                    type="text"
                    value={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.value)}
                    placeholder="e.g. Ikeja, Lagos"
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pp-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input id="pp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} required />
                </div>
                <div>
                  <label htmlFor="pp-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    id="pp-email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    title="Change your email in Account Settings"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Change your email in{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/settings#email')}
                      className="font-bold text-navy-800 dark:text-navy-400 hover:underline cursor-pointer"
                    >
                      Account Settings
                    </button>
                    .
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="pp-bio" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Overview</label>
                <textarea
                  id="pp-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your trade experience, specialties, and standard work guarantee..."
                  className={fieldClass}
                  required
                />
              </div>

              <p className="pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 dark:border-slate-800">Work details</p>

              <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
                <span>
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">Accepting new jobs</span>
                  <span className="block text-[11px] text-slate-500">Turn off to pause new requests without freezing your account.</span>
                </span>
                <input
                  type="checkbox"
                  checked={work.accepting}
                  onChange={(e) => setWorkField('accepting', e.target.checked)}
                  className="w-5 h-5 accent-navy-800 shrink-0"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pp-years" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Years of Experience</label>
                  <input
                    id="pp-years"
                    type="text"
                    inputMode="numeric"
                    value={work.years ? String(work.years) : ''}
                    onChange={(e) => setWorkField('years', Math.min(80, Number(e.target.value.replace(/\D/g, '')) || 0))}
                    placeholder="e.g. 5"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="pp-response" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Response Time</label>
                  <input
                    id="pp-response"
                    type="text"
                    value={work.responseTime}
                    onChange={(e) => setWorkField('responseTime', e.target.value)}
                    placeholder="e.g. within 1 hour"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pp-skills" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Skills</label>
                <input
                  id="pp-skills"
                  type="text"
                  value={work.skills}
                  onChange={(e) => setWorkField('skills', e.target.value)}
                  placeholder="Separate with commas, e.g. Wiring, Inverters, CCTV"
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Pricing</span>
                  <CustomDropdown
                    value={work.pricingType}
                    onChange={(v) => setWorkField('pricingType', v as ServicePricingType)}
                    options={[
                      { value: 'starting', label: 'Starting from' },
                      { value: 'fixed', label: 'Fixed price' },
                      { value: 'quote_required', label: 'Quote only' },
                    ]}
                    asFormField
                    className="w-full"
                    buttonClassName="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                {work.pricingType !== 'quote_required' && (
                  <div>
                    <label htmlFor="pp-price" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₦)</label>
                    <input
                      id="pp-price"
                      type="text"
                      inputMode="numeric"
                      value={work.basePrice ? formatAmount(work.basePrice) : ''}
                      onChange={(e) => setWorkField('basePrice', Number(e.target.value.replace(/\D/g, '')) || 0)}
                      placeholder="e.g. 5,000"
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={editGuard.requestClose}
                  disabled={isSavingBasicInfo}
                  className="px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBasicInfo}
                  className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-extrabold text-xs shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[7.5rem]"
                >
                  {isSavingBasicInfo && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isSavingBasicInfo ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
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
          subtitle="An ID photo and a selfie, reviewed by the KaziHub team."
          badge={
            isVerified ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 shrink-0">
                Verified
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-500/20 shrink-0">
                {verificationState === 'pending' ? 'Under Review' : verificationState === 'rejected' ? 'Not Approved' : 'Not Verified'}
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
                  {verificationState === 'pending' ? 'Submitted' : verificationState === 'rejected' ? 'Not Approved' : 'Not Submitted'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {verification?.document_number_masked
                ? `${verification.document_type.replace(/_/g, ' ')} · ${verification.document_number_masked}`
                : 'A NIN slip, driver’s licence, voter’s card or passport.'}
            </p>
          </div>

          {/* Facial Liveness Biometric Item */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Selfie Check</p>
              {isVerified ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Approved</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                  {verificationState === 'pending' ? 'Submitted' : verificationState === 'rejected' ? 'Not Approved' : 'Not Submitted'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {'A selfie taken with your camera, compared with your ID photo.'}
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
                ? 'Your Verified badge is active'
                : verificationState === 'pending'
                  ? 'Your documents are under review'
                  : verificationState === 'rejected'
                    ? 'Your verification wasn’t approved'
                    : 'Get the Verified badge'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isVerified
                ? 'Clients see the Verified badge on your profile.'
                : verificationState === 'pending'
                  ? 'The team checks your ID and selfie. The result shows here.'
                  : verificationState === 'rejected'
                    ? (verification?.rejection_reason || 'Check your photos are clear and match, then submit again.')
                    : 'Submit a photo of your ID and a selfie. The badge appears once the team approves them.'}
            </p>
          </div>

          {(verificationState === 'none' || verificationState === 'rejected') && (
            <button
              type="button"
              onClick={() => { if (!blockIfFrozen()) setShowKYCModal(true); }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              {verificationState === 'rejected' ? 'Submit Again' : 'Get Verified'}
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

      <UnsavedChangesModal
        guard={editGuard}
        description="Your profile edits haven't been saved. Leaving now will discard them."
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
                    asFormField
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
                    type="text"
                    inputMode="numeric"
                    value={servicePrice ? formatAmount(servicePrice) : ''}
                    onChange={(e) => setServicePrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
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
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingService ? 'Saving…' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        guard={serviceGuard}
        description="This service hasn't been saved. Closing now will discard your changes."
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
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Project Photo</span>
                <input
                  ref={portfolioPhotoInputRef}
                  id="portfolio-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePortfolioPhotoSelected}
                />
                <button
                  type="button"
                  onClick={() => portfolioPhotoInputRef.current?.click()}
                  disabled={isUploadingPortfolioPhoto}
                  className="relative w-full aspect-video rounded-xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer disabled:cursor-wait"
                  aria-label={portImage ? 'Replace project photo' : 'Add project photo'}
                >
                  {portImage ? (
                    <>
                      <img src={portImage} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/70 text-white text-[11px] font-bold">
                        Replace photo
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-xs font-bold">Choose a photo</span>
                    </span>
                  )}
                  {isUploadingPortfolioPhoto && (
                    <span className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
                      <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <CustomDropdown
                    value={portCategory}
                    onChange={(c) => setPortCategory(c as Category)}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                    className="w-full"
                    asFormField
                    buttonClassName="px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date Completed</label>
                  <input
                    type="date"
                    value={portDate}
                    max={localDateISO()}
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
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPortfolio || isUploadingPortfolioPhoto}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-xs cursor-pointer text-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingPortfolio ? 'Saving…' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        guard={portfolioGuard}
        description="This portfolio project hasn't been saved. Closing now will discard your changes."
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
        onSubmit={isDemo ? undefined : handleSubmitVerification}
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
