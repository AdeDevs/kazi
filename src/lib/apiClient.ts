import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Token,
  LoginCredentials,
  UserCreate,
  UserResponse,
  UserUpdate,
  VerifyEmailSchema,
  ResendOTPSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ProfileCreate,
  ProfileResponse,
  ProfileUpdate,
  GigCreate,
  GigResponse,
  GigUpdate,
  VerificationSubmit,
  VerificationResponse,
  VerificationReview,
  ApiFilterParams,
  HTTPValidationError,
} from '../types/api';

// Base API URL configuration
export const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_API_BASE_URL) ||
  'https://kazihub-52ph.onrender.com';


const TOKEN_KEY = 'kazihub_access_token';
const USER_KEY = 'kazihub_auth_user';

// Token Management Utilities
export const tokenStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Unable to persist token to localStorage', e);
    }
  },
  clearToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Unable to clear token', e);
    }
  },
  getStoredUser: (): UserResponse | null => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setStoredUser: (user: UserResponse): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Unable to persist user', e);
    }
  }
};

// Create configured Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s for cold start tolerance
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & Format Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<HTTPValidationError | { detail?: string }>) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      tokenStorage.clearToken();
      window.dispatchEvent(new CustomEvent('kazihub:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Helper to extract human-readable error messages from FastAPI responses
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as HTTPValidationError | { detail?: string } | undefined;
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.msg).join(', ');
      }
      if (typeof data.detail === 'string') {
        return data.detail;
      }
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'The backend server is waking up from sleep. Please retry in a few moments.';
    }
    if (error.message === 'Network Error') {
      return 'Network connection error. Please check your internet or retry.';
    }
    return error.message || 'An unexpected API error occurred.';
  }
  return (error as Error)?.message || 'An unexpected error occurred.';
}

// -------------------------------------------------------------
// 1. Authentication Endpoints (/api/auth)
// -------------------------------------------------------------
export const authApi = {
  /** Register a new user */
  register: async (payload: UserCreate): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/api/auth/register', payload);
    return response.data;
  },

  /** Login user and receive Bearer Token */
  login: async (credentials: LoginCredentials): Promise<Token> => {
    // FastAPI OAuth2PasswordBearer expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    if (credentials.grant_type) formData.append('grant_type', credentials.grant_type);
    if (credentials.scope) formData.append('scope', credentials.scope);
    if (credentials.client_id) formData.append('client_id', credentials.client_id);
    if (credentials.client_secret) formData.append('client_secret', credentials.client_secret);

    const response = await apiClient.post<Token>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data.access_token) {
      tokenStorage.setToken(response.data.access_token);
    }
    return response.data;
  },

  /** Verify Email with OTP */
  verifyEmail: async (payload: VerifyEmailSchema): Promise<{ message?: string; detail?: string }> => {
    const response = await apiClient.post('/api/auth/verify-email', payload);
    return response.data;
  },

  /** Resend OTP */
  resendOtp: async (payload: ResendOTPSchema): Promise<{ message?: string; detail?: string }> => {
    const response = await apiClient.post('/api/auth/resend-otp', payload);
    return response.data;
  },

  /** Request password reset OTP */
  forgotPassword: async (payload: ForgotPasswordSchema): Promise<{ message?: string; detail?: string }> => {
    const response = await apiClient.post('/api/auth/forgot-password', payload);
    return response.data;
  },

  /** Reset password using OTP */
  resetPassword: async (payload: ResetPasswordSchema): Promise<{ message?: string; detail?: string }> => {
    const response = await apiClient.post('/api/auth/reset-password', payload);
    return response.data;
  },

  /** Get currently authenticated user */
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/api/auth/me');
    tokenStorage.setStoredUser(response.data);
    return response.data;
  },

  /** Update currently authenticated user */
  updateMe: async (payload: UserUpdate): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>('/api/auth/me', payload);
    tokenStorage.setStoredUser(response.data);
    return response.data;
  },

  /** Delete authenticated user account */
  deleteMe: async (): Promise<{ message?: string }> => {
    const response = await apiClient.delete('/api/auth/me');
    tokenStorage.clearToken();
    return response.data;
  },

  /** Sign out */
  logout: (): void => {
    tokenStorage.clearToken();
  },
};

// -------------------------------------------------------------
// 2. Profiles Endpoints (/api/profiles)
// -------------------------------------------------------------
export const profileApi = {
  /** Create or Update Artisan Profile */
  createOrUpdateProfile: async (payload: ProfileCreate): Promise<ProfileResponse> => {
    const response = await apiClient.post<ProfileResponse>('/api/profiles/', payload);
    return response.data;
  },

  /** Get currently authenticated artisan's profile */
  getMyProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/api/profiles/me');
    return response.data;
  },

  /** Partial update to artisan profile */
  updateMyProfile: async (payload: ProfileUpdate): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ProfileResponse>('/api/profiles/me', payload);
    return response.data;
  },

  /** Delete artisan profile */
  deleteMyProfile: async (): Promise<{ message?: string }> => {
    const response = await apiClient.delete('/api/profiles/me');
    return response.data;
  },

  /** List all public artisan profiles */
  listProfiles: async (params?: { category?: string; limit?: number }): Promise<ProfileResponse[]> => {
    const response = await apiClient.get<ProfileResponse[]>('/api/profiles/all', { params });
    return response.data;
  },
};

// -------------------------------------------------------------
// 3. Gigs & Services Endpoints (/api/gigs)
// -------------------------------------------------------------
export const gigApi = {
  /** Create a new gig/service */
  createGig: async (payload: GigCreate): Promise<GigResponse> => {
    const response = await apiClient.post<GigResponse>('/api/gigs/', payload);
    return response.data;
  },

  /** List public gigs with filters */
  listGigs: async (params?: ApiFilterParams): Promise<GigResponse[]> => {
    const response = await apiClient.get<GigResponse[]>('/api/gigs/', { params });
    return response.data;
  },

  /** Get artisan's own gigs */
  getMyGigs: async (): Promise<GigResponse[]> => {
    const response = await apiClient.get<GigResponse[]>('/api/gigs/my-gigs');
    return response.data;
  },

  /** Get single gig by ID */
  getGigById: async (gigId: string): Promise<GigResponse> => {
    const response = await apiClient.get<GigResponse>(`/api/gigs/${gigId}`);
    return response.data;
  },

  /** Update gig */
  updateGig: async (gigId: string, payload: GigUpdate): Promise<GigResponse> => {
    const response = await apiClient.patch<GigResponse>(`/api/gigs/${gigId}`, payload);
    return response.data;
  },

  /** Delete gig */
  deleteGig: async (gigId: string): Promise<{ message?: string }> => {
    const response = await apiClient.delete(`/api/gigs/${gigId}`);
    return response.data;
  },
};

// -------------------------------------------------------------
// 4. Verification Endpoints (/api/verification)
// -------------------------------------------------------------
export const verificationApi = {
  /** Submit ID & selfie for verification */
  submitVerification: async (payload: VerificationSubmit): Promise<VerificationResponse> => {
    const response = await apiClient.post<VerificationResponse>('/api/verification/submit', payload);
    return response.data;
  },

  /** Get current user's verification status */
  getVerificationStatus: async (): Promise<VerificationResponse> => {
    const response = await apiClient.get<VerificationResponse>('/api/verification/status');
    return response.data;
  },

  /** Review verification submission (Admin only) */
  reviewVerification: async (
    verificationId: string,
    payload: VerificationReview
  ): Promise<VerificationResponse> => {
    const response = await apiClient.patch<VerificationResponse>(
      `/api/verification/${verificationId}/review`,
      payload
    );
    return response.data;
  },
};
