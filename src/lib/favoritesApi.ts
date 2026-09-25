import { apiDelete, apiGet, apiPost } from './apiClient';

/** GET /favorites/ item -- keyed by the artisan's *user* id (verified live; the profile id 404s). */
export interface FavoriteResponse {
  artisan_id: string;
  business_name?: string | null;
  category?: string | null;
  rating_average?: number;
  avatar_url?: string | null;
  created_at: string;
}

export const listFavorites = () => apiGet<FavoriteResponse[]>('/favorites/');
export const saveFavorite = (artisanUserId: string) => apiPost<unknown>(`/favorites/${encodeURIComponent(artisanUserId)}`);
export const removeFavorite = (artisanUserId: string) => apiDelete<unknown>(`/favorites/${encodeURIComponent(artisanUserId)}`);
