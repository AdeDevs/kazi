import React, { createContext, useContext, useState, useCallback } from 'react';
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
import {
  authenticate,
  startRegistration,
  resendRegistrationOtp,
  completeRegistration,
  startPasswordReset,
  completePasswordReset,
  updateUserRecord,
  deleteUserRecord,
} from '../lib/mockAuthStore';

export type AuthModalView = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

const SESSION_KEY = 'kazihub_access_token';
const USER_KEY = 'kazihub_auth_user';

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

  // Auth operations (mock, local-only until a real backend is wired in)
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

// Demo mock profiles for instant preview testing
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

function persistSession(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, `mock-session-${user.id}`);
  } catch (e) {
    console.warn('Unable to persist session', e);
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Unable to clear session', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');

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
      const authedUser = authenticate(credentials.username, credentials.password);
      persistSession(authedUser);
      setUser(authedUser);
      setToken(`mock-session-${authedUser.id}`);
      closeAuthModal();
      return authedUser;
    } catch (err: any) {
      const errMsg = err.message || 'Unable to sign in. Please check your credentials.';
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
      startRegistration(payload);
      setPendingEmail(payload.email);
      setAuthModalView('verify');
      return { message: `Verification code sent to ${payload.email}` };
    } catch (err: any) {
      const errMsg = err.message || 'Unable to register. Please try again.';
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
      const verifiedUser = completeRegistration(payload.email, payload.otp);
      persistSession(verifiedUser);
      setUser(verifiedUser);
      setToken(`mock-session-${verifiedUser.id}`);
      setAuthModalView('login');
      return verifiedUser;
    } catch (err: any) {
      const errMsg = err.message || 'Verification failed. Please try again.';
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
      const otp = resendRegistrationOtp(payload.email);
      if (!otp) throw new Error('No pending registration found for this email.');
      return { message: `New verification code sent to ${payload.email}` };
    } catch (err: any) {
      const errMsg = err.message || 'Unable to resend code.';
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
      const otp = startPasswordReset(payload.email);
      if (!otp) throw new Error('No account found with that email address.');
      setPendingEmail(payload.email);
      setAuthModalView('reset');
      return { message: `Password reset code sent to ${payload.email}` };
    } catch (err: any) {
      const errMsg = err.message || 'Unable to send reset code.';
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
      completePasswordReset(payload.email, payload.otp, payload.new_password);
      setAuthModalView('login');
      return { message: 'Password reset successfully! Please sign in with your new password.' };
    } catch (err: any) {
      const errMsg = err.message || 'Unable to reset password.';
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
      const updated = updateUserRecord(user.email, payload) || { ...user, ...payload };
      persistSession(updated);
      setUser(updated);
      return updated;
    } catch (err: any) {
      const errMsg = err.message || 'Unable to update profile.';
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
      const reader = new FileReader();
      const base64Url = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      });
      const updated = updateUserRecord(user.email, { profile_picture: base64Url }) || {
        ...user,
        profile_picture: base64Url,
      };
      persistSession(updated);
      setUser(updated);
      return updated;
    } catch (err: any) {
      const errMsg = err.message || 'Unable to upload profile picture.';
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
      if (user) deleteUserRecord(user.email);
      logout();
    } catch (err: any) {
      const errMsg = err.message || 'Unable to delete account.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const loginAsDemo = useCallback((role: 'client' | 'artisan' | 'customer') => {
    const demoProfile = role === 'artisan' ? DEMO_ARTISAN_USER : DEMO_CUSTOMER_USER;
    persistSession(demoProfile);
    setUser(demoProfile);
    setToken(`mock-session-${demoProfile.id}`);
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
