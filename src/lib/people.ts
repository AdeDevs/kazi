/**
 * The one place that decides what name to show for a person (client or artisan). Order: a display
 * name, then first + last name, then a username. It never falls back to a role word like "Client"
 * or "Artisan": callers show a loading skeleton while the name is still coming, and
 * UNKNOWN_PERSON only when the API has nothing at all.
 */
export interface PersonFields {
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}

export const UNKNOWN_PERSON = 'KaziHub member';

export function personName(p: PersonFields | null | undefined): string {
  if (!p) return '';
  const display = (p.display_name ?? p.name)?.trim();
  if (display) return display;
  const full = [p.first_name, p.last_name].map((n) => n?.trim()).filter(Boolean).join(' ');
  if (full) return full;
  return p.username?.trim() || '';
}

/** First word of a name, for "Message Tolu" style labels. */
export const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;
