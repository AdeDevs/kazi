import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from './apiClient';
import { Gig, GigInput } from '../types';

/** GigResponse from the backend. Note it carries the artisan's *profile* id, not their user id. */
export interface GigResponse {
  id: string;
  artisan_profile_id: string;
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

export const gigFromResponse = (g: GigResponse): Gig => ({
  id: g.id,
  professional_id: g.artisan_profile_id,
  title: g.title,
  description: g.description,
  category: g.category,
  tags: g.tags || [],
  price: g.price,
  delivery_time_days: g.delivery_time_days,
  images: g.images || [],
  is_active: g.is_active,
  created_at: g.created_at,
});

export const listMyGigs = () => apiGet<GigResponse[]>('/gigs/my-gigs');

/** Public, active gigs. The endpoint can't filter by artisan, so callers filter by artisan_profile_id. */
export const listPublicGigs = () => apiGet<GigResponse[]>('/gigs/?limit=100', { auth: false });

export const createGig = (input: GigInput) => apiPost<GigResponse>('/gigs/', input);
export const updateGig = (id: string, patch: Partial<GigInput> & { is_active?: boolean }) =>
  apiPatch<GigResponse>(`/gigs/${encodeURIComponent(id)}`, patch);
export const deleteGig = (id: string) => apiDelete<unknown>(`/gigs/${encodeURIComponent(id)}`);

/** POST /gigs/upload -- the docs declare `{}`; the other upload endpoints return `{ "url": "…" }`. */
export async function uploadGigImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await apiPostMultipart<{ url?: string }>('/gigs/upload', form);
  if (!res?.url) throw new Error('The photo uploaded but no link came back. Try again.');
  return res.url;
}
