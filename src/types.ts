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

// Matches the backend's BookingType enum exactly.
export type BookingType = 'fixed_service' | 'custom_quote' | 'gig_purchase';

// Matches the backend's BookingStatus enum exactly. Note there is no 'closed' value here:
// the backend has no such state -- what the UI previously called "closed" was really just
// an old 'paid_out' booking old enough to archive from the default view, computed client-side
// (see isBookingArchived in utils.ts) rather than a status the server would ever return.
export type BookingStatus =
  | 'quote_requested'
  | 'quote_sent'
  | 'pending'
  | 'accepted'
  | 'escrow_funded'
  | 'in_progress'
  | 'completed_by_artisan'
  | 'paid_out'
  | 'cancelled'
  | 'disputed';

// Matches the backend's EscrowStatus enum exactly.
export type EscrowStatus = 'unfunded' | 'held_in_escrow' | 'released_to_artisan' | 'refunded_to_client' | 'partially_refunded';

export interface BookingStatusHistoryEntry {
  from_status?: string | null;
  to_status: string;
  changed_by?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  customerName: string; // frontend-only convenience: the backend booking response only returns client_id, not a denormalized name
  customerPhone: string; // frontend-only convenience, no backend equivalent
  artisan_id: string;
  professionalName: string; // frontend-only convenience: the backend booking response only returns artisan_id, not a denormalized name
  category: Category; // frontend-only convenience, no backend equivalent
  booking_type?: BookingType;
  gig_id?: string | null;
  title?: string; // was selectedService
  servicePricingType?: ServicePricingType; // frontend-only, no backend equivalent
  description: string; // was issueDescription
  problemImageUrl?: string; // frontend-only, no backend equivalent yet
  problemImages?: string[]; // frontend-only, no backend equivalent yet
  attachments?: string[]; // backend field: evidence photo URLs actually sent with the booking request
  scheduled_date?: string; // was `date`
  timeSlot: string; // frontend-only, no backend equivalent (backend only models a single scheduled_date)
  address: string;
  landmark_hint?: string; // was `landmark`
  landmarkImages?: string[]; // frontend-only, no backend equivalent
  coordinates?: { lat: number; lng: number; addressName?: string }; // frontend-only, no backend equivalent
  status: BookingStatus;
  escrow_status?: EscrowStatus;
  amount?: number; // was totalPrice
  quote_breakdown?: string | null;
  payment_reference?: string | null;
  reference_code?: string | null;
  escrow_amount?: number;
  platform_fee?: number;
  gateway_fee?: number;
  artisan_earnings?: number;
  platform_commission_rate?: number;
  completedAt?: string; // frontend-only convenience timestamp
  completion_description?: string;
  completion_photos?: string[];
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
  auto_completion_deadline?: string;
  lock_version?: number;
  timeline?: BookingStatusHistoryEntry[];
  created_at: string; // was createdAt
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

