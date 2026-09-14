export type Role = 'customer' | 'professional';

export type ServicePricingType = 'fixed' | 'quote_required' | 'starting';

export interface ServiceItem {
  id: string;
  name: string;
  category: Category;
  description: string;
  pricing_type: ServicePricingType;
  price?: number; // Exact amount for 'fixed', starting base amount for 'starting'
  duration_estimate?: string; // e.g. "1-2 hrs", "2-4 hrs", "Custom"
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
  image_url: string;
  description: string;
  date_completed: string;
}

export interface Professional {
  id: string;
  name: string;
  profile_picture: string;
  category: Category;
  tagline: string;
  bio: string;
  state: string;
  neighborhood: string;
  hourly_rate: number;
  pricing_type?: ServicePricingType; // default pricing model for this pro's primary offerings
  base_price?: number; // Starting or fixed base price if applicable
  services?: ServiceItem[];
  rating_average: number;
  review_count: number;
  completed_jobs_count: number;
  years_of_experience: number;
  is_available_now: boolean;
  is_verified: boolean;
  phone_number: string;
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

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  delivery_time_days: number;
  images: string[];
  is_active: boolean;
  created_at: string;
}

export interface GigInput {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  price: number;
  delivery_time_days: number;
  images?: string[];
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

