import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserResponse,
  UserCreate,
  UserUpdate,
  LoginCredentials,
  VerifyEmailSchema,
  ResendOTPSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  Token
} from '../types/api';
import { authApi, tokenStorage, getApiErrorMessage, API_BASE_URL } from '../lib/apiClient';

export type AuthModalView = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export interface AuthContextType {
  user: UserResponse | null;
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

  // Auth Operations matching Backend Schema
  login: (credentials: LoginCredentials) => Promise<Token>;
  register: (payload: UserCreate) => Promise<any>;
  verifyEmail: (payload: VerifyEmailSchema) => Promise<UserResponse>;
  resendOtp: (payload: ResendOTPSchema) => Promise<{ message?: string; detail?: string }>;
  forgotPassword: (payload: ForgotPasswordSchema) => Promise<{ message?: string; detail?: string }>;
  resetPassword: (payload: ResetPasswordSchema) => Promise<{ message?: string; detail?: string }>;
  updateUser: (payload: UserUpdate) => Promise<UserResponse>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  loginAsDemo: (role: 'client' | 'artisan' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo mock profiles for instant preview testing
export const DEMO_CUSTOMER_USER: UserResponse = {
  id: 'c1',
  first_name: 'Nneka',
  last_name: 'Okonkwo',
  email: 'nneka.okonkwo@kazihub.ng',
  phone_number: '+234 803 123 4567',
  nin: '78291048291',
  state: 'Oyo',
  role: 'client',
  is_active: true,
  is_email_verified: true,
  created_at: '2024-03-15T10:00:00Z',
};

export const DEMO_ARTISAN_USER: UserResponse = {
  id: 'p1',
  first_name: 'Babatunde',
  last_name: 'Adebayo',
  email: 'babatunde.adebayo@kazihub.ng',
  phone_number: '+234 802 345 6789',
  nin: '91827364510',
  state: 'Lagos',
  role: 'artisan',
  is_active: true,
  is_email_verified: true,
  created_at: '2024-01-10T08:30:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => tokenStorage.getStoredUser() || null);
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken());
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

  // Fetch /api/auth/me on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = tokenStorage.getToken();
      if (!storedToken) return;

      try {
        setIsLoading(true);
        const userData = await authApi.getMe();
        setUser(userData);
        setToken(storedToken);
      } catch (err: any) {
        console.warn('Could not restore session from backend:', getApiErrorMessage(err));
        // If 401, clear token
        if (err.response?.status === 401) {
          tokenStorage.clearToken();
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  // Listen for 401 unauthorized events dispatched by Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please log in again.');
      openAuthModal('login');
    };

    window.addEventListener('kazihub:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('kazihub:unauthorized', handleUnauthorized);
    };
  }, [openAuthModal]);

  /**
   * 1. Login (/api/auth/login)
   */
  const login = async (credentials: LoginCredentials): Promise<Token> => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenData = await authApi.login(credentials);
      setToken(tokenData.access_token);
      
      // Fetch authenticated user details immediately
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        // Fallback user constructed from login credentials
        const fallbackUser: UserResponse = {
          id: `usr-${Date.now()}`,
          first_name: credentials.username.split('@')[0] || 'User',
          last_name: '',
          email: credentials.username,
          phone_number: '+234 800 000 0000',
          state: 'Lagos',
          role: 'customer',
          is_active: true,
          is_email_verified: true,
          created_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        tokenStorage.setStoredUser(fallbackUser);
      }

      closeAuthModal();
      return tokenData;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2. Register (/api/auth/register)
   */
  const register = async (payload: UserCreate): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.register(payload);
      setPendingEmail(payload.email);
      // Advance directly to verify email OTP view
      setAuthModalView('verify');
      return result;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 3. Verify Email (/api/auth/verify-email)
   */
  const verifyEmail = async (payload: VerifyEmailSchema): Promise<UserResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result: any = await authApi.verifyEmail(payload);
      
      // The backend returns the verified UserResponse
      let verifiedUser: UserResponse;
      if (result && result.id) {
        verifiedUser = result as UserResponse;
      } else {
        verifiedUser = {
          id: `usr-${Date.now()}`,
          first_name: payload.email.split('@')[0],
          last_name: '',
          email: payload.email,
          phone_number: '+234 800 000 0000',
          state: 'Lagos',
          role: 'customer',
          is_active: true,
          is_email_verified: true,
          created_at: new Date().toISOString()
        };
      }

      setUser(verifiedUser);
      tokenStorage.setStoredUser(verifiedUser);
      
      // Auto transition to login view or close if token acquired
      setAuthModalView('login');
      return verifiedUser;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 4. Resend OTP (/api/auth/resend-otp)
   */
  const resendOtp = async (payload: ResendOTPSchema): Promise<{ message?: string; detail?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.resendOtp(payload);
      return result;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 5. Forgot Password (/api/auth/forgot-password)
   */
  const forgotPassword = async (payload: ForgotPasswordSchema): Promise<{ message?: string; detail?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.forgotPassword(payload);
      setPendingEmail(payload.email);
      setAuthModalView('reset');
      return result;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 6. Reset Password (/api/auth/reset-password)
   */
  const resetPassword = async (payload: ResetPasswordSchema): Promise<{ message?: string; detail?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.resetPassword(payload);
      setAuthModalView('login');
      return result;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 7. Update User Profile (/api/auth/me PUT)
   */
  const updateUser = async (payload: UserUpdate): Promise<UserResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      let updatedUser: UserResponse;
      if (token) {
        updatedUser = await authApi.updateMe(payload);
      } else if (user) {
        updatedUser = {
          ...user,
          ...payload,
        } as UserResponse;
      } else {
        throw new Error('No user is currently authenticated.');
      }
      
      setUser(updatedUser);
      tokenStorage.setStoredUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 8. Delete Account (/api/auth/me DELETE)
   */
  const deleteAccount = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      if (token) {
        await authApi.deleteMe();
      }
      logout();
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 9. Sign Out
   */
  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  /**
   * 10. Demo Quick Login
   */
  const loginAsDemo = useCallback((role: 'client' | 'artisan' | 'customer') => {
    const demoProfile = role === 'artisan' ? DEMO_ARTISAN_USER : DEMO_CUSTOMER_USER;
    setUser(demoProfile);
    tokenStorage.setStoredUser(demoProfile);
    tokenStorage.setToken(`demo-jwt-token-${role}`);
    setToken(`demo-jwt-token-${role}`);
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
