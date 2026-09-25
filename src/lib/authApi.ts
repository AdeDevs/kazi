import { apiDelete, apiGet, apiPost, apiPostForm, apiPostMultipart, apiPut, clearTokens, setTokens } from './apiClient';
import {
  AuthUser,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  RequestEmailChangeSchema,
  SessionInfo,
  LoginCredentials,
  ResendOTPSchema,
  ResetPasswordSchema,
  TokenPair,
  TwoFactorSetupResponse,
  UserCreate,
  UserUpdate,
  VerifyEmailSchema,
} from '../types/auth';

export async function register(payload: UserCreate): Promise<void> {
  await apiPost<unknown>('/auth/register', payload, { auth: false });
}

export async function verifyEmail(payload: VerifyEmailSchema): Promise<AuthUser> {
  return apiPost<AuthUser>('/auth/verify-email', payload, { auth: false });
}

export async function resendOtp(payload: ResendOTPSchema): Promise<void> {
  await apiPost<unknown>('/auth/resend-otp', payload, { auth: false });
}

/** Logs in and stores the returned token pair; callers still need to fetch the profile via getMe(). */
export async function login(credentials: LoginCredentials): Promise<TokenPair> {
  const pair = await apiPostForm<TokenPair>('/auth/login', {
    username: credentials.username,
    password: credentials.password,
    totp_code: credentials.totp_code,
  });
  setTokens(pair.access_token, pair.refresh_token);
  return pair;
}

export async function revokeSessions(): Promise<void> {
  await apiPost<unknown>('/auth/revoke-sessions');
}

export function logoutLocally(): void {
  clearTokens();
}

export async function forgotPassword(payload: ForgotPasswordSchema): Promise<void> {
  await apiPost<unknown>('/auth/forgot-password', payload, { auth: false });
}

export async function resetPassword(payload: ResetPasswordSchema): Promise<void> {
  await apiPost<unknown>('/auth/reset-password', payload, { auth: false });
}

export async function getMe(): Promise<AuthUser> {
  return apiGet<AuthUser>('/auth/me');
}

export async function updateMe(payload: UserUpdate): Promise<AuthUser> {
  return apiPut<AuthUser>('/auth/me', payload);
}

export async function deleteMe(): Promise<void> {
  await apiDelete<unknown>('/auth/me');
}

export async function uploadProfilePicture(file: File | Blob): Promise<AuthUser> {
  const form = new FormData();
  form.append('file', file, file instanceof File ? file.name : 'profile-picture');
  return apiPostMultipart<AuthUser>('/auth/me/picture', form);
}

export async function deactivateMe(): Promise<void> {
  await apiPost<unknown>('/auth/deactivate-me');
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  return apiPost<TwoFactorSetupResponse>('/auth/2fa/setup');
}

export async function changePassword(payload: ChangePasswordSchema): Promise<void> {
  await apiPost<unknown>('/auth/change-password', payload);
}

/** Sends a code to the NEW address; the email only changes once confirmEmailChange succeeds. */
export async function requestEmailChange(payload: RequestEmailChangeSchema): Promise<void> {
  await apiPost<unknown>('/auth/change-email', payload);
}

export async function confirmEmailChange(otp: string): Promise<AuthUser> {
  return apiPost<AuthUser>('/auth/change-email/confirm', { otp });
}

export async function freezeMe(): Promise<void> {
  await apiPost<unknown>('/auth/freeze-me');
}

export async function unfreezeMe(): Promise<void> {
  await apiPost<unknown>('/auth/unfreeze-me');
}

export async function listSessions(): Promise<SessionInfo[]> {
  return apiGet<SessionInfo[]>('/auth/sessions');
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiDelete<unknown>(`/auth/sessions/${encodeURIComponent(sessionId)}`);
}

export async function verifyTwoFactorSetup(totpCode: string): Promise<void> {
  await apiPost<unknown>('/auth/2fa/verify', { totp_code: totpCode });
}
