import { apiGet, apiPost, apiPostMultipart } from './apiClient';
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
  /** ISO date. */
  scheduled_date?: string | null;
  /** e.g. "09:00-11:00". */
  scheduled_window?: string | null;
  completion_description?: string | null;
  completion_photos?: string[];
  auto_completion_deadline?: string | null;
  lock_version?: number;
  created_at: string;
  // Both people's details, so neither side has to look them up. A phone number is only filled
  // in once the other person's phone_visibility allows it (by default, after escrow is funded).
  client_name?: string | null;
  client_avatar?: string | null;
  client_phone?: string | null;
  artisan_name?: string | null;
  artisan_avatar?: string | null;
  artisan_phone?: string | null;
  artisan_profile_id?: string | null;
  artisan_category?: string | null;
}

export interface BookingDetailResponse extends BookingResponse {
  timeline?: BookingStatusHistoryEntry[];
}

/** What both booking requests share. Photos are URLs from uploadBookingPhoto (up to 10). */
interface BookingRequestBase {
  artisan_id: string;
  description: string;
  address: string;
  landmark_hint?: string | null;
  attachments?: string[];
  scheduled_date?: string | null;
  scheduled_window?: string | null;
}

/** The title and price come from the service on the server; only "fixed" services are accepted. */
export interface FixedBookingCreate extends BookingRequestBase {
  service_id: string;
}

export interface QuoteRequestCreate extends BookingRequestBase {
  service_title: string;
}

// Create, fund-escrow, confirm-completion and dispute require an Idempotency-Key header. One key
// per user action, so a retry of the same action can't repeat it.
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
export const startJob = (id: string) => action(id, 'start');
/** Notes and photo URLs (from uploadBookingPhoto, up to 10) are optional proof of the work. */
export const submitCompletion = (id: string, proof?: { completion_description?: string; completion_photos?: string[] }) =>
  action(id, 'submit-completion', proof && (proof.completion_description || proof.completion_photos?.length) ? proof : undefined);

// Client
export const acceptQuote = (id: string) => action(id, 'quote/accept');
export const confirmCompletion = (id: string) => action(id, 'confirm-completion', undefined, idempotent());

/** POST /wallet/initialize-escrow/{id}: starts a Paystack checkout for a pending/accepted, unfunded booking. */
export interface EscrowCheckout {
  /** Send the client here to pay. */
  authorization_url: string;
  access_code: string;
  reference: string;
  /** Where Paystack returns them: our callback page with ?booking_id=…&reference=…&trxref=… */
  callback_url?: string | null;
}
export const initializeEscrow = (id: string) => apiPost<EscrowCheckout>(`/wallet/initialize-escrow/${encodeURIComponent(id)}`);
/** Called from the page Paystack returns to. Confirms the payment; safe to call more than once. */
export const fundEscrow = (id: string) => action(id, 'fund-escrow', undefined, idempotent());
export const disputeBooking = (id: string, reason: string, details: string, evidencePhotos: string[] = []) =>
  apiPost<{ ticket_id?: string }>(`/bookings/${encodeURIComponent(id)}/dispute`, { reason, details, evidence_photos: evidencePhotos }, idempotent());

// Either party
export const cancelBooking = (id: string) => action(id, 'cancel');

/** `sharePublicly`: the client agrees to the review appearing on the home page with their first name and state. */
export const createReview = (bookingId: string, rating: number, comment: string, sharePublicly = false) =>
  apiPost<unknown>('/reviews/', { booking_id: bookingId, rating, comment: comment || null, share_publicly: sharePublicly });

/** POST /bookings/upload: one JPEG, PNG or WebP (up to 10 MB). Returns its URL. */
export async function uploadBookingPhoto(file: Blob, filename = 'photo.jpg'): Promise<string> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await apiPostMultipart<{ url?: string }>('/bookings/upload', form);
  if (!res?.url) throw new Error('The photo uploaded but no link came back. Try again.');
  return res.url;
}

/** Fallbacks for bookings whose response lacks the names (older records, or the demo). */
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
    customerName: b.client_name?.trim() || names.customerName,
    customerPhone: b.client_phone || '',
    professionalName: b.artisan_name?.trim() || names.professionalName,
    professionalPhone: b.artisan_phone || undefined,
    professionalAvatar: b.artisan_avatar || undefined,
    customerAvatar: b.client_avatar || undefined,
    artisan_profile_id: b.artisan_profile_id || undefined,
    category: (b.artisan_category as Category) || names.category,
    booking_type: b.booking_type,
    gig_id: b.gig_id,
    title: b.title,
    servicePricingType: b.booking_type === 'custom_quote' ? 'quote_required' : 'fixed',
    description: b.description || '',
    attachments: b.attachments || [],
    scheduled_date: b.scheduled_date || undefined,
    timeSlot: b.scheduled_window || '',
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
    // The auto-release deadline is set 4 days after the artisan marks the job done.
    completionDetails: b.auto_completion_deadline
      ? {
          description: b.completion_description || '',
          photos: b.completion_photos || [],
          submittedAt: new Date(new Date(b.auto_completion_deadline).getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : undefined,
    auto_completion_deadline: b.auto_completion_deadline || undefined,
    lock_version: b.lock_version,
    timeline: b.timeline,
    created_at: b.created_at,
  };
}
