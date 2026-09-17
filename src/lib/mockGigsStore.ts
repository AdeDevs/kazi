import { Gig, GigInput } from '../types';

const GIGS_KEY = 'kazihub_mock_gigs';

function readGigs(): Gig[] {
  try {
    const raw = localStorage.getItem(GIGS_KEY);
    return raw ? (JSON.parse(raw) as Gig[]) : [];
  } catch {
    return [];
  }
}

function writeGigs(gigs: Gig[]): void {
  try {
    localStorage.setItem(GIGS_KEY, JSON.stringify(gigs));
  } catch (e) {
    console.warn('Unable to persist gigs', e);
  }
}

/** Gigs belonging to a specific artisan -- used both for the artisan's own management view and
 * for the customer-facing "Gigs" tab on that artisan's profile. */
export function getGigsByProfessional(professionalId: string): Gig[] {
  return readGigs().filter((g) => g.professional_id === professionalId && g.is_active);
}

export function createGig(input: GigInput, professionalId: string): Gig {
  const newGig: Gig = {
    id: `gig-${Date.now()}`,
    professional_id: professionalId,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags || [],
    price: input.price,
    delivery_time_days: input.delivery_time_days,
    images: input.images || [],
    is_active: true,
    created_at: new Date().toISOString(),
  };
  const gigs = [newGig, ...readGigs()];
  writeGigs(gigs);
  return newGig;
}

export function deleteGig(gigId: string): void {
  writeGigs(readGigs().filter((g) => g.id !== gigId));
}
