import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  AuthUser,
  UserCreate,
  UserUpdate,
  LoginCredentials,
  VerifyEmailSchema,
  ResendOTPSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../types/auth';
import * as authApi from '../lib/authApi';
import { getAccessToken, clearTokens } from '../lib/apiClient';

export type AuthModalView = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

const USER_KEY = 'kazihub_auth_user';
const DEMO_TOKEN_KEY = 'kazihub_demo_session'; // marks a loginAsDemo() session, which has no real backend token

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Modal state
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  pendingEmail: string;
  openAuthModal: (view?: AuthModalView, email?: string) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
  setPendingEmail: (email: string) => void;
  clearError: () => void;

  // Auth operations, backed by the real KaziHub API
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (payload: UserCreate) => Promise<{ message: string }>;
  verifyEmail: (payload: VerifyEmailSchema) => Promise<AuthUser>;
  resendOtp: (payload: ResendOTPSchema) => Promise<{ message: string }>;
  forgotPassword: (payload: ForgotPasswordSchema) => Promise<{ message: string }>;
  resetPassword: (payload: ResetPasswordSchema) => Promise<{ message: string }>;
  updateUser: (payload: UserUpdate) => Promise<AuthUser>;
  uploadProfilePicture: (file: File | Blob) => Promise<AuthUser>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  loginAsDemo: (role: 'client' | 'artisan' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo profiles for instant preview testing -- local-only, never touch the real backend.
export const DEMO_CUSTOMER_USER: AuthUser = {
  id: 'c1',
  first_name: 'Nneka',
  last_name: 'Okonkwo',
  email: 'nneka.okonkwo@kazihub.ng',
  phone_number: '+234 803 123 4567',
  nin_masked: '*******8291',
  state: 'Oyo',
  role: 'client',
  roles: ['client'],
  is_admin: false,
  is_active: true,
  is_email_verified: true,
  theme: 'system',
  preferred_language: 'en',
  created_at: '2024-03-15T10:00:00Z',
};

export const DEMO_ARTISAN_USER: AuthUser = {
  id: 'p1',
  first_name: 'Babatunde',
  last_name: 'Adebayo',
  email: 'babatunde.adebayo@kazihub.ng',
  phone_number: '+234 802 345 6789',
  nin_masked: '*******4510',
  state: 'Lagos',
  role: 'artisan',
  roles: ['artisan'],
  is_admin: false,
  is_active: true,
  is_email_verified: true,
  theme: 'system',
  preferred_language: 'en',
  created_at: '2024-01-10T08:30:00Z',
};

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('Unable to persist user profile', e);
  }
}

function isDemoSession(): boolean {
  try {
    return localStorage.getItem(DEMO_TOKEN_KEY) === 'true';
  } catch {
    return false;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DEMO_TOKEN_KEY);
  } catch (e) {
    console.warn('Unable to clear session', e);
  }
  clearTokens();
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // On mount, if we have a real (non-demo) access token, re-sync the profile from the server --
  // it may have changed since the cached copy was written, or the token may no longer be valid.
  useEffect(() => {
    if (isDemoSession() || !getAccessToken()) return;
    authApi
      .getMe()
      .then((freshUser) => {
        setUser(freshUser);
        persistUser(freshUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
        setToken(null);
      });
  }, []);

  const openAuthModal = useCallback((view: AuthModalView = 'login', email?: string) => {
    setAuthModalView(view);
    if (email) setPendingEmail(email);
    setError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      try {
        localStorage.removeItem(DEMO_TOKEN_KEY);
      } catch {
        // ignore
      }
      const pair = await authApi.login(credentials);
      const authedUser = await authApi.getMe();
      persistUser(authedUser);
      setUser(authedUser);
      setToken(pair.access_token);
      closeAuthModal();
      return authedUser;
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to sign in. Please check your credentials.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: UserCreate): Promise<{ message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(payload);
      setPendingEmail(payload.email);
      setAuthModalView('verify');
      return { message: `Verification code sent to ${payload.email}` };
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to register. Please try again.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (payload: VerifyEmailSchema): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      // Verifying the email confirms the account but does not log it in -- the backend issues
      // tokens only from POST /auth/login, so the user still needs to sign in afterwards.
      const verifiedUser = await authApi.verifyEmail(payload);
      setAuthModalView('login');
      return verifiedUser;
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Verification failed. Please try again.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (payload: ResendOTPSchema): Promise<{ message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resendOtp(payload);
      return { message: `New verification code sent to ${payload.email}` };
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to resend code.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (payload: ForgotPasswordSchema): Promise<{ message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(payload);
      setPendingEmail(payload.email);
      setAuthModalView('reset');
      return { message: `Password reset code sent to ${payload.email}` };
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to send reset code.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (payload: ResetPasswordSchema): Promise<{ message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(payload);
      setAuthModalView('login');
      return { message: 'Password reset successfully! Please sign in with your new password.' };
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to reset password.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (payload: UserUpdate): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('No user is currently authenticated.');
      const updated = await authApi.updateMe(payload);
      persistUser(updated);
      setUser(updated);
      return updated;
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to update profile.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File | Blob): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) throw new Error('No user is currently authenticated.');
      const updated = await authApi.uploadProfilePicture(file);
      persistUser(updated);
      setUser(updated);
      return updated;
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to upload profile picture.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isDemoSession()) {
        await authApi.deleteMe();
      }
      logout();
    } catch (err) {
      const errMsg = extractErrorMessage(err, 'Unable to delete account.');
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    if (!isDemoSession()) {
      // Best-effort: revoke the refresh token server-side, but don't block logging out locally on it.
      authApi.revokeSessions().catch(() => undefined);
    }
    clearSession();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const loginAsDemo = useCallback((role: 'client' | 'artisan' | 'customer') => {
    const demoProfile = role === 'artisan' ? DEMO_ARTISAN_USER : DEMO_CUSTOMER_USER;
    clearTokens();
    try {
      localStorage.setItem(DEMO_TOKEN_KEY, 'true');
    } catch {
      // ignore
    }
    persistUser(demoProfile);
    setUser(demoProfile);
    setToken(null);
    closeAuthModal();
  }, [closeAuthModal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        isAuthModalOpen,
        authModalView,
        pendingEmail,
        openAuthModal,
        closeAuthModal,
        setAuthModalView,
        setPendingEmail,
        clearError,
        login,
        register,
        verifyEmail,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateUser,
        uploadProfilePicture,
        deleteAccount,
        logout,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
