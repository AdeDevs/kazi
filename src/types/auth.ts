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
