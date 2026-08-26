import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, tokenStorage, getApiErrorMessage } from '../lib/apiClient';
import {
  LoginCredentials,
  UserCreate,
  UserResponse,
  UserUpdate,
  VerifyEmailSchema,
  ResendOTPSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../types/api';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export function useAuthMe() {
  const token = tokenStorage.getToken();

  return useQuery<UserResponse, Error>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getMe,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 Unauthorized
      if ((error as { response?: { status: number } }).response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: async () => {
      // Fetch and populate me profile immediately
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: UserCreate) => authApi.register(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailSchema) => authApi.verifyEmail(payload),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (payload: ResendOTPSchema) => authApi.resendOtp(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordSchema) => authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordSchema) => authApi.resetPassword(payload),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserUpdate) => authApi.updateMe(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
    },
  });
}

export function useDeleteMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.deleteMe(),
    onSuccess: () => {
      authApi.logout();
      queryClient.clear();
    },
  });
}
