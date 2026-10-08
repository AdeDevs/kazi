import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart, apiPut } from './apiClient';
import { Category, PortfolioItem, Professional, Review, ServiceItem, ServicePricingType } from '../types';
import { CATEGORIES } from '../catalog';

// Shapes returned by the backend's public artisan-directory endpoints (GET /profiles/ and
// GET /profiles/{id}). The artisan's name and photo are copied from their user account.
export interface ProfileResponse {
  id: string;
  user_id: string;
  category: string;
  skills: string[];
  years_of_experience: number;
  state: string;
  is_available: boolean;
  is_verified: boolean;
  first_name?: string | null;
  last_name?: string | null;
  /** Legacy: the frontend used to copy the artisan's name here before the name fields existed. */
  business_name?: string | null;
  profile_picture?: string | null;
  tagline?: string | null;
  bio?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  pricing_type?: string;
  base_price?: number;
  hourly_rate?: number | null;
  rating_average?: number;
  review_count?: number;
  completed_jobs_count?: number;
  is_available_now?: boolean;
  is_paused?: boolean;
  share_neighborhood?: boolean;
  availability_status?: string;
  insurance_backed?: boolean;
  response_time?: string | null;
}

export interface ServiceResponse {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  pricing_type: string;
  price: number;
  duration_estimate?: string | null;
  is_active: boolean;
}

export interface PortfolioItemResponse {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description?: string | null;
  date_completed?: string | null;
}

export interface ReviewResponse {
  id: string;
  booking_id: string;
  artisan_id: string;
  rating: number;
  client_name: string;
  comment?: string | null;
  created_at: string;
}

export interface PublicProfileDetailResponse extends ProfileResponse {
  services: ServiceResponse[];
  portfolio: PortfolioItemResponse[];
  reviews: ReviewResponse[];
}

export interface ProfileListMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ProfileListResponse {
  data: ProfileResponse[];
  meta: ProfileListMeta;
}

export interface ListProfilesParams {
  category?: string;
  neighborhood?: string;
  state?: string;
  min_rating?: number;
  min_experience?: number;
  /** Accepting new work (is_available), online or not. */
  available_only?: boolean;
  /** Online right now (availability_status 'Available'). */
  online_now?: boolean;
  verified_only?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/** Public endpoint -- no auth needed to browse the artisan directory. */
export function listProfiles(params: ListProfilesParams = {}): Promise<ProfileListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return apiGet<ProfileListResponse>(`/profiles/${qs ? `?${qs}` : ''}`, { auth: false });
}

/** Writable fields of the logged-in artisan's own profile (PUT /profiles/me is a partial update). */
export interface ProfileUpdate {
  category?: string | null;
  tagline?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  neighborhood?: string | null;
  city?: string | null;
  pricing_type?: string | null;
  base_price?: number | null;
  years_of_experience?: number | null;
  is_available?: boolean | null;
  share_neighborhood?: boolean | null;
  response_time?: string | null;
}

export function getMyProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('/profiles/me');
}

/**
 * Saves the artisan's own profile. Signup normally creates the profile document, but if it's
 * missing the partial update 404s, so fall back to create-or-update (which requires a category).
 */
export async function saveMyProfile(update: ProfileUpdate): Promise<ProfileResponse> {
  try {
    return await apiPut<ProfileResponse>('/profiles/me', update);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && update.category) {
      return apiPost<ProfileResponse>('/profiles/', update);
    }
    throw err;
  }
}

// --- The logged-in artisan's own services (ServiceCreate / ServiceUpdate in the backend docs) ---

export interface ServiceCreate {
  name: string;
  category: string;
  pricing_type: string;
  description?: string | null;
  /** Backend defaults this to 0; send 0 for quote_required services, which have no set price. */
  price?: number;
  duration_estimate?: string | null;
}

export type ServiceUpdate = Partial<ServiceCreate> & { is_active?: boolean | null };

/** Includes inactive services -- the owner sees their whole catalog. */
export function listMyServices(): Promise<ServiceResponse[]> {
  return apiGet<ServiceResponse[]>('/profiles/me/services/');
}

export function createService(body: ServiceCreate): Promise<ServiceResponse> {
  return apiPost<ServiceResponse>('/profiles/me/services/', body);
}

export function updateService(serviceId: string, body: ServiceUpdate): Promise<ServiceResponse> {
  return apiPatch<ServiceResponse>(`/profiles/me/services/${encodeURIComponent(serviceId)}`, body);
}

export function deleteService(serviceId: string): Promise<void> {
  return apiDelete<void>(`/profiles/me/services/${encodeURIComponent(serviceId)}`);
}

// --- The logged-in artisan's own portfolio (PortfolioItemCreate / PortfolioItemUpdate) ---

export interface PortfolioItemCreate {
  title: string;
  category: string;
  image_url: string;
  description?: string | null;
  /** ISO date, YYYY-MM-DD. */
  date_completed?: string | null;
}

/** Uploads a project photo (JPEG, PNG or WebP, up to 10 MB) and returns its URL, for image_url. */
export async function uploadPortfolioImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await apiPostMultipart<{ url?: string }>('/profiles/me/portfolio/upload', form);
  if (!res?.url) throw new Error('The photo uploaded but no link came back. Try again.');
  return res.url;
}

export function listMyPortfolio(): Promise<PortfolioItemResponse[]> {
  return apiGet<PortfolioItemResponse[]>('/profiles/me/portfolio/');
}

export function createPortfolioItem(body: PortfolioItemCreate): Promise<PortfolioItemResponse> {
  return apiPost<PortfolioItemResponse>('/profiles/me/portfolio/', body);
}

export function updatePortfolioItem(itemId: string, body: Partial<PortfolioItemCreate>): Promise<PortfolioItemResponse> {
  return apiPatch<PortfolioItemResponse>(`/profiles/me/portfolio/${encodeURIComponent(itemId)}`, body);
}

export function deletePortfolioItem(itemId: string): Promise<void> {
  return apiDelete<void>(`/profiles/me/portfolio/${encodeURIComponent(itemId)}`);
}

/** Public endpoint -- full detail (services, portfolio, reviews) for one artisan profile. */
export function getProfileDetail(profileId: string): Promise<PublicProfileDetailResponse> {
  return apiGet<PublicProfileDetailResponse>(`/profiles/${encodeURIComponent(profileId)}`, { auth: false });
}

// Artisans without a photo would otherwise get an empty src, and the rest of the UI renders
// professional avatars as plain <img> tags (no missing-image fallback), so an empty src would show
// a broken-image icon on their card. Generate a same-style initials avatar
// (matching UserAvatar's own palette/logic) as a local data URI instead -- no network dependency,
// and every existing <img src={pro.profile_picture}> site keeps working unchanged.
// Same neutral look as PersonAvatar's initials fallback (slate-200 / slate-700).
const PLACEHOLDER_AVATAR_COLORS = ['#e2e8f0'];

function initialsFor(name: string): string {
  const clean = name.trim().replace(/^(Engr\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function placeholderAvatarDataUri(name: string): string {
  const initials = initialsFor(name);
  const color = PLACEHOLDER_AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % PLACEHOLDER_AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="700" fill="#334155">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function baseProfessionalFields(p: ProfileResponse): Omit<Professional, 'services' | 'portfolio' | 'reviews'> {
  const name = displayName(p);
  return {
    id: p.id,
    user_id: p.user_id,
    name,
    profile_picture: p.profile_picture?.trim() || placeholderAvatarDataUri(name),
    category: p.category as Category,
    tagline: p.tagline || '',
    bio: p.bio || '',
    state: p.state,
    neighborhood: p.neighborhood || p.city || '',
    pricing_type: (p.pricing_type as ServicePricingType) || 'starting',
    base_price: p.base_price ?? p.hourly_rate ?? undefined,
    rating_average: p.rating_average ?? 0,
    review_count: p.review_count ?? 0,
    completed_jobs_count: p.completed_jobs_count ?? 0,
    years_of_experience: p.years_of_experience,
    is_available_now: p.is_available_now ?? p.is_available,
    is_verified: p.is_verified,
    phone_number: '',
    email: '',
    skills: p.skills,
    verificationStatus: p.is_verified ? 'verified' : 'unverified',
    response_time: p.response_time?.trim() || undefined,
    is_available: p.is_available,
  };
}

function displayName(p: ProfileResponse): string {
  const full = [p.first_name, p.last_name].map((n) => n?.trim()).filter(Boolean).join(' ');
  return full || p.business_name?.trim() || '';
}

/**
 * Whether a directory entry can be shown to a customer: it needs a name and one of the known
 * categories. The backend already leaves out unfinished profiles and now rejects unknown
 * categories, but one older profile still has a misspelled category and no account name.
 */
export function isBrowsableProfile(p: ProfileResponse): boolean {
  return Boolean(displayName(p)) && (CATEGORIES as readonly string[]).includes(p.category);
}

/** Maps a directory-listing entry, which has no services/portfolio/reviews yet -- see profileDetailToProfessional. */
export function profileToProfessional(p: ProfileResponse): Professional {
  return { ...baseProfessionalFields(p), services: [], portfolio: [], reviews: [] };
}

export function mapService(s: ServiceResponse): ServiceItem {
  return {
    id: s.id,
    name: s.name,
    category: s.category as Category,
    description: s.description || '',
    pricing_type: s.pricing_type as ServicePricingType,
    price: s.pricing_type === 'quote_required' ? undefined : s.price,
    duration_estimate: s.duration_estimate || undefined,
  };
}

export function mapPortfolioItem(item: PortfolioItemResponse): PortfolioItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category as Category,
    image_url: item.image_url,
    description: item.description || '',
    date_completed: item.date_completed || '',
  };
}

function mapReview(r: ReviewResponse): Review {
  return {
    id: r.id,
    customerId: '',
    customerName: r.client_name,
    rating: r.rating,
    comment: r.comment || '',
    date: r.created_at,
  };
}

/** Maps the full detail response (GET /profiles/{id}), which includes services/portfolio/reviews. */
export function profileDetailToProfessional(p: PublicProfileDetailResponse): Professional {
  return {
    ...baseProfessionalFields(p),
    services: p.services.map(mapService),
    portfolio: p.portfolio.map(mapPortfolioItem),
    reviews: p.reviews.map(mapReview),
  };
}
