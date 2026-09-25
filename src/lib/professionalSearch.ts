import { Professional } from '../types';

// Field weights: a hit on a stronger field always outranks any hit on a weaker one.
const WEIGHTS = {
  nameLeading: 120,
  name: 100,
  category: 60,
  servicesOrSkills: 40,
  location: 30,
  tagline: 20,
  bio: 10,
} as const;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-start matching: "ade" matches "Adebayo" but not "upgrade", so short fragments stop
// matching inside unrelated words.
function wordStartMatcher(token: string): RegExp {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(token)}`, 'iu');
}

function tokenScore(pro: Professional, token: string): number {
  const re = wordStartMatcher(token);
  const name = pro.name || '';
  if (name.toLowerCase().startsWith(token)) return WEIGHTS.nameLeading;
  if (re.test(name)) return WEIGHTS.name;
  if (re.test(pro.category || '')) return WEIGHTS.category;
  const ownOfferings = [...(pro.services || []).map(s => s.name), ...(pro.skills || [])];
  if (ownOfferings.some(text => re.test(text))) return WEIGHTS.servicesOrSkills;
  if (re.test(pro.neighborhood || '') || re.test(pro.state || '')) return WEIGHTS.location;
  if (re.test(pro.tagline || '')) return WEIGHTS.tagline;
  if (re.test(pro.bio || '')) return WEIGHTS.bio;
  return 0;
}

/**
 * Relevance of a professional to a search query; 0 means no match. Every word of the query must
 * match somewhere (so "plumber bodija" narrows rather than widens), and each word scores by the
 * strongest field it hits.
 */
export function professionalSearchScore(pro: Professional, query: string): number {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;
  let total = 0;
  for (const token of tokens) {
    const score = tokenScore(pro, token);
    if (score === 0) return 0;
    total += score;
  }
  return total;
}
