export type UserRole = 'client' | 'artisan' | string;

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  nin?: string | null;
  state: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  profile_picture?: string | null;
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
}

export interface LoginCredentials {
  username: string;
  password: string;
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
