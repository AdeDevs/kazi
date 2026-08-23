export type Role = 'customer' | 'professional';

export type ServicePricingType = 'fixed' | 'quote_required' | 'starting';

export interface ServiceItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  pricingType: ServicePricingType;
  price?: number; // Exact amount for 'fixed', starting base amount for 'starting'
  durationEstimate?: string; // e.g. "1-2 hrs", "2-4 hrs", "Custom"
  popular?: boolean;
}

export type Category =
  | 'Electricians'
  | 'Plumbers'
  | 'Carpenters'
  | 'AC Technicians'
  | 'Appliance Repair Specialists'
  | 'Mechanics'
  | 'Solar Installers'
  | 'CCTV Installers'
  | 'Painters'
  | 'Welders'
  | 'Cleaners'
  | 'Tutors'
  | 'Tailors'
  | 'Hair Stylists'
  | 'Photographers'
  | 'Event Professionals';

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: Category;
  imageUrl: string;
  description: string;
  dateCompleted: string;
}

export interface Professional {
  id: string;
  name: string;
  avatar: string;
  category: Category;
  tagline: string;
  bio: string;
  location: string;
  neighborhood: string;
  hourlyRate: number;
  pricingType?: ServicePricingType; // default pricing model for this pro's primary offerings
  basePrice?: number; // Starting or fixed base price if applicable
  services?: ServiceItem[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  experienceYears: number;
  isAvailableNow: boolean;
  verified: boolean;
  phone: string;
  email: string;
  portfolio: PortfolioItem[];
  reviews: Review[];
  earningsTotal?: number;
  skills?: string[];
  areasServed?: string[];
  serviceRadiusKm?: number;
  certifications?: { id: string; name: string; issuer: string; year: string; verified: boolean }[];
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  professionalId: string;
  professionalName: string;
  category: Category;
  selectedService?: string;
  servicePricingType?: ServicePricingType;
  issueDescription: string;
  problemImageUrl?: string;
  problemImages?: string[];
  date: string;
  timeSlot: string;
  address: string;
  landmark?: string;
  landmarkImages?: string[];
  coordinates?: { lat: number; lng: number; addressName?: string };
  status: 'pending' | 'awaiting_quote' | 'accepted' | 'in-progress' | 'completion-submitted' | 'completed' | 'issue-reported' | 'cancelled' | 'closed';
  totalPrice?: number;
  completedAt?: string;
  completionDetails?: {
    description: string;
    photos: string[];
    videoUrl?: string;
    submittedAt: string;
  };
  issueDetails?: {
    description: string;
    evidencePhotos: string[];
    reportedAt: string;
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId?: string;
  senderId: string; // customerId or professionalId
  senderName: string;
  senderRole: 'customer' | 'professional';
  recipientId: string;
  message: string;
  timestamp: string;
  imageUrl?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'location';
  mediaUrl?: string;
  duration?: number; // Voice note duration in seconds
  locationData?: { lat: number; lng: number; address: string; landmark?: string };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface AIDiagnosisResult {
  summary: string;
  category: Category;
  severity: 'Low' | 'Medium' | 'High' | 'Emergency';
  estimatedCostRange: string;
  recommendedAction: string;
  questionsToAsk: string[];
}

export interface Notification {
  id: string;
  type: 'new_job' | 'job_accepted' | 'job_cancelled' | 'new_message' | 'upcoming_booking';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string; // bookingId or senderId
}

