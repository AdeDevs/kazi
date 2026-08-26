/**
 * KaziHub Backend API TypeScript Interfaces
 * Generated from OpenAPI 3.1.0 specification (https://kazihub-52ph.onrender.com/openapi.json)
 */

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string; // Email or username
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface UserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;
  nin?: string | null;
  state: string;
  role: 'client' | 'artisan' | string;
}

export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  nin?: string | null;
  state: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
}

export interface UserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  state?: string | null;
  nin?: string | null;
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

export interface ProfileCreate {
  category: string;
  skills: string[];
  bio?: string | null;
  hourly_rate?: number | null;
  years_of_experience?: number;
  address?: string | null;
  city?: string | null;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  category: string;
  skills: string[];
  bio?: string | null;
  hourly_rate?: number | null;
  years_of_experience: number;
  address?: string | null;
  city?: string | null;
  state: string;
  is_available: boolean;
  is_verified: boolean;
}

export interface ProfileUpdate {
  category?: string | null;
  skills?: string[] | null;
  bio?: string | null;
  hourly_rate?: number | null;
  years_of_experience?: number | null;
  address?: string | null;
  city?: string | null;
  is_available?: boolean | null;
}

export interface GigCreate {
  title: string;
  description: string;
  category: string;
  tags?: string[] | null;
  price: number;
  delivery_time_days: number;
  images?: string[] | null;
}

export interface GigResponse {
  id: string;
  artisan_id: string;
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

export interface GigUpdate {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  price?: number | null;
  delivery_time_days?: number | null;
  images?: string[] | null;
  is_active?: boolean | null;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationSubmit {
  nin: string;
  id_type: string;
  id_number: string;
  id_card_image: string;
  selfie_image: string;
}

export interface VerificationResponse {
  id: string;
  user_id: string;
  nin: string;
  id_type: string;
  id_number: string;
  id_card_image: string;
  selfie_image: string;
  status: VerificationStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationReview {
  status: VerificationStatus;
  rejection_reason?: string | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface ApiFilterParams {
  category?: string;
  tag?: string;
  limit?: number;
  skip?: number;
}
