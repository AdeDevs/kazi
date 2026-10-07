export type UserRole = 'client' | 'artisan' | string;

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  nin_masked?: string | null;
  state: string;
  role: UserRole;
  roles: string[];
  is_admin: boolean;
  is_active: boolean;
  is_email_verified: boolean;
  /** Frozen via /auth/freeze-me: hidden from search and blocked from new bookings, login still works. */
  is_paused?: boolean;
  two_factor_enabled?: boolean;
  profile_picture?: string | null;
  theme: string;
  preferred_language: string;
  /** Who can see this person's phone number: 'after_escrow' (default) or 'verified_only'. */
  phone_visibility?: string;
  /** Whether their area (state/neighbourhood) is shown to others. */
  share_neighborhood?: boolean;
  terms_version?: string | null;
  terms_accepted_at?: string | null;
  created_at: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  nin?: string | null;
  state: string;
  role: UserRole;
  /** Which version of the Terms the person ticked (TERMS_VERSION). */
  terms_version: string;
}

export interface UserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  state?: string | null;
  nin?: string | null;
  profile_picture?: string | null;
  theme?: string | null;
  preferred_language?: string | null;
  phone_visibility?: string | null;
  share_neighborhood?: boolean | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  totp_code?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauth_url: string;
}

/** From /auth/2fa/verify and /auth/2fa/backup-codes. The codes are shown once and never again. */
export interface TwoFactorEnabledResponse {
  detail: string;
  backup_codes: string[];
}

export interface ChangePasswordSchema {
  current_password: string;
  new_password: string;
}

export interface RequestEmailChangeSchema {
  new_email: string;
  current_password: string;
}

/** One active (non-revoked, unexpired) refresh-token session, from GET /auth/sessions. */
export interface SessionInfo {
  id: string;
  session_id: string;
  /** True for the session of the device making the request. */
  is_current: boolean;
  user_agent?: string | null;
  ip_address?: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
}

export interface VerifyEmailSchema {
  email: string;
  otp: string;
}

export interface ResendOTPSchema {
  email: string;
}

export interface ForgotPasswordSchema {
  email: string;
}

export interface ResetPasswordSchema {
  email: string;
  otp: string;
  new_password: string;
}
