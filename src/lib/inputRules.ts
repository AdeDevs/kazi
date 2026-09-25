// Input rules shared by every form. The backend accepts any string for these fields (no length,
// pattern or enum constraints in its OpenAPI schemas), so the UI is what keeps values well-formed:
// each field only lets through characters it can use, and fixed-shape values are picked, not typed.

export const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Oyo', 'Rivers', 'Ogun', 'Kano', 'Kaduna',
  'Edo', 'Delta', 'Enugu', 'Anambra', 'Abia', 'Akwa Ibom', 'Ondo',
  'Osun', 'Kwara', 'Plateau', 'Imo', 'Cross River', 'Benue', 'Bauchi',
  'Borno', 'Adamawa', 'Bayelsa', 'Ebonyi', 'Ekiti', 'Gombe', 'Jigawa',
  'Katsina', 'Kebbi', 'Kogi', 'Nasarawa', 'Niger', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

export const LIMITS = {
  name: 40,
  bio: 500,
  neighborhood: 50,
  skill: 30,
  skillsCount: 12,
  years: 60,
} as const;

/** Digits only, capped at `max` characters. */
export const digitsOnly = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

/** Personal names: letters (any script), spaces, hyphens, apostrophes and dots. No digits or symbols. */
export const sanitizeName = (value: string) =>
  value.replace(/[^\p{L}\p{M}\s'’.-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.name);

/** A neighbourhood / area name: letters, digits, spaces and simple punctuation. */
export const sanitizePlace = (value: string) =>
  value.replace(/[^\p{L}\p{M}\d\s'’.,-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, LIMITS.neighborhood);

// ---- Nigerian phone numbers. Typed as the 10 digits after +234 ("802 345 6789"); signup sends
// "+234" + those digits, while older accounts may hold "0802…" or "+234 802…", so read any of them.

/** The 10 national digits of a stored or typed number ("08023456789", "+234 802 345 6789", …). */
export function nationalDigits(value: string): string {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('234')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Groups the national digits for display in the field: "802 345 6789". */
export function formatNigerianPhone(value: string): string {
  const d = nationalDigits(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Nigerian mobile numbers: 10 digits after the country code, starting 7, 8 or 9. */
export const isValidNigerianPhone = (value: string) => /^[789]\d{9}$/.test(nationalDigits(value));

/** The format signup sends to the backend. */
export const toStoredPhone = (value: string) => `+234${nationalDigits(value)}`;

// ---- Fixed-choice values the backend stores as free text.

export const RESPONSE_TIME_OPTIONS = [
  'Within 15 minutes',
  'Within 30 minutes',
  'Within 1 hour',
  'Within 3 hours',
  'Within 6 hours',
  'Within a day',
] as const;

/** A stored response time we can show, or '' for anything that isn't one of the choices. */
export const knownResponseTime = (value?: string | null) =>
  (RESPONSE_TIME_OPTIONS as readonly string[]).includes(value || '') ? (value as string) : '';

export const DURATION_OPTIONS = [
  'Under 1 hr',
  '1 hr',
  '1-2 hrs',
  '2-3 hrs',
  '3-5 hrs',
  'Half a day',
  'Full day',
  '2-3 days',
  '1 week+',
] as const;

// ---- Identity documents (KYC). Formats of the Nigerian documents the modal offers.

export type DocumentType = 'nin' | 'drivers_license' | 'voters_card' | 'passport';

export const DOCUMENT_RULES: Record<DocumentType, {
  label: string;
  placeholder: string;
  inputMode: 'numeric' | 'text';
  maxLength: number;
  sanitize: (v: string) => string;
  isValid: (v: string) => boolean;
  hint: string;
}> = {
  nin: {
    label: 'NIN',
    placeholder: '11-digit NIN',
    inputMode: 'numeric',
    maxLength: 11,
    sanitize: (v) => digitsOnly(v, 11),
    isValid: (v) => /^\d{11}$/.test(v),
    hint: 'Your National Identification Number is 11 digits.',
  },
  drivers_license: {
    label: 'Licence number',
    placeholder: 'e.g. ABC12345DE67',
    inputMode: 'text',
    maxLength: 12,
    sanitize: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12),
    isValid: (v) => /^[A-Z]{3}[A-Z0-9]{8,9}$/.test(v),
    hint: 'Driver’s licence numbers start with 3 letters and are 11–12 characters long.',
  },
  voters_card: {
    label: 'VIN',
    placeholder: '19-character VIN',
    inputMode: 'text',
    maxLength: 19,
    sanitize: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 19),
    isValid: (v) => /^[A-Z0-9]{19}$/.test(v),
    hint: 'The Voter Identification Number on your PVC is 19 letters and digits.',
  },
  passport: {
    label: 'Passport number',
    placeholder: 'e.g. A12345678',
    inputMode: 'text',
    maxLength: 9,
    sanitize: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9),
    isValid: (v) => /^[A-Z]\d{8}$/.test(v),
    hint: 'Nigerian passport numbers are a letter followed by 8 digits.',
  },
};
