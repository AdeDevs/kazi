import { apiGet, apiPost } from './apiClient';
import { Booking, BookingStatus, BookingStatusHistoryEntry, BookingType, Category, EscrowStatus } from '../types';

// Shapes from the backend's /bookings endpoints (BookingResponse / BookingDetailResponse).

export interface BookingResponse {
  id: string;
  client_id: string;
  artisan_id: string;
  gig_id?: string | null;
  booking_type: BookingType;
  title: string;
  description?: string | null;
  attachments?: string[];
  amount: number;
  quote_breakdown?: string | null;
  address?: string | null;
  landmark_hint?: string | null;
  status: BookingStatus;
  escrow_status?: EscrowStatus;
  payment_reference?: string | null;
  reference_code?: string | null;
  escrow_amount?: number;
  platform_fee?: number;
  gateway_fee?: number;
  artisan_earnings?: number;
  platform_commission_rate?: number;
  scheduled_date?: string | null;
  completion_description?: string | null;
  completion_photos?: string[];
  auto_completion_deadline?: string | null;
  lock_version?: number;
  created_at: string;
}

export interface BookingDetailResponse extends BookingResponse {
  timeline?: BookingStatusHistoryEntry[];
}

export interface FixedBookingCreate {
  artisan_id: string;
  service_title: string;
  amount: number;
  description: string;
  address: string;
  landmark_hint?: string | null;
}

export interface QuoteRequestCreate {
  artisan_id: string;
  service_title: string;
  description: string;
  address: string;
  landmark_hint?: string | null;
}

// Create, confirm-completion and dispute are documented as "Requires Idempotency-Key" (the header
// isn't declared in the OpenAPI params). One key per user action, so a retry of the same action
// can't create a second booking.
const idempotent = () => ({ headers: { 'Idempotency-Key': crypto.randomUUID() } });

export const listMyBookings = () => apiGet<BookingResponse[]>('/bookings/me?limit=100');
export const getBooking = (id: string) => apiGet<BookingDetailResponse>(`/bookings/${encodeURIComponent(id)}`);

export const createFixedBooking = (body: FixedBookingCreate) =>
  apiPost<BookingResponse>('/bookings/fixed', body, idempotent());
export const requestQuote = (body: QuoteRequestCreate) =>
  apiPost<BookingResponse>('/bookings/quote-request', body, idempotent());

export interface GigPurchaseCreate {
  artisan_id: string;
  gig_id: string;
  item_title: string;
  delivery_address: string;
  landmark_hint?: string | null;
}
export const buyGig = (body: GigPurchaseCreate) => apiPost<BookingResponse>('/bookings/buy-gig', body, idempotent());

const action = (id: string, path: string, body?: unknown, opts?: { headers: Record<string, string> }) =>
  apiPost<BookingResponse>(`/bookings/${encodeURIComponent(id)}/${path}`, body, opts);

// Artisan
export const sendQuote = (id: string, amount: number, breakdown?: string) => action(id, 'quote', { amount, breakdown: breakdown || null });
export const acceptBooking = (id: string) => action(id, 'accept');
export const declineBooking = (id: string) => action(id, 'decline');
export const submitCompletion = (id: string) => action(id, 'submit-completion');

// Client
export const acceptQuote = (id: string) => action(id, 'quote/accept');
export const confirmCompletion = (id: string) => action(id, 'confirm-completion', undefined, idempotent());
export const disputeBooking = (id: string, reason: string, details: string, evidencePhotos: string[] = []) =>
  apiPost<{ ticket_id?: string }>(`/bookings/${encodeURIComponent(id)}/dispute`, { reason, details, evidence_photos: evidencePhotos }, idempotent());

// Either party
export const cancelBooking = (id: string) => action(id, 'cancel');

export const createReview = (bookingId: string, rating: number, comment: string) =>
  apiPost<unknown>('/reviews/', { booking_id: bookingId, rating, comment: comment || null });

/** Names the backend doesn't return with a booking, resolved by the caller. */
export interface BookingNames {
  professionalName: string;
  category: Category;
  customerName: string;
}

export function bookingFromResponse(b: BookingDetailResponse, names: BookingNames): Booking {
  return {
    id: b.id,
    client_id: b.client_id,
    artisan_id: b.artisan_id,
    customerName: names.customerName,
    customerPhone: '',
    professionalName: names.professionalName,
    category: names.category,
    booking_type: b.booking_type,
    gig_id: b.gig_id,
    title: b.title,
    servicePricingType: b.booking_type === 'custom_quote' ? 'quote_required' : 'fixed',
    description: b.description || '',
    attachments: b.attachments || [],
    scheduled_date: b.scheduled_date || undefined,
    timeSlot: '',
    address: b.address || '',
    landmark_hint: b.landmark_hint || undefined,
    status: b.status,
    escrow_status: b.escrow_status,
    amount: b.amount,
    quote_breakdown: b.quote_breakdown,
    payment_reference: b.payment_reference,
    reference_code: b.reference_code,
    escrow_amount: b.escrow_amount,
    platform_fee: b.platform_fee,
    gateway_fee: b.gateway_fee,
    artisan_earnings: b.artisan_earnings,
    platform_commission_rate: b.platform_commission_rate,
    completion_description: b.completion_description || undefined,
    completion_photos: b.completion_photos || [],
    auto_completion_deadline: b.auto_completion_deadline || undefined,
    lock_version: b.lock_version,
    timeline: b.timeline,
    created_at: b.created_at,
  };
}
