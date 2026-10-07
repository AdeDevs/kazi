import { apiGet } from './apiClient';

/** GET /reviews/featured: public reviews whose client agreed to share them, from paid-out bookings. */
export interface FeaturedReview {
  id: string;
  rating: number;
  comment?: string | null;
  client_first_name: string;
  /** The client's state, or null when they've turned off share_neighborhood. */
  client_area?: string | null;
  category?: string | null;
  photo_url?: string | null;
  is_featured: boolean;
  created_at: string;
}

export const listFeaturedReviews = (limit = 6) =>
  apiGet<FeaturedReview[]>(`/reviews/featured?limit=${limit}`, { auth: false });
