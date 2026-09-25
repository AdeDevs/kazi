import { ApiError, apiGet, apiPost, apiPostMultipart } from './apiClient';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/** VerificationResponse. The image URLs are 15-minute signed links, never permanent. */
export interface VerificationResponse {
  id: string;
  user_id: string;
  document_type: string;
  document_number_masked: string;
  document_image_url: string;
  liveness_selfie_url: string;
  status: VerificationStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

/** POST /verification/upload -- docs declare `{}`; verified live as { public_id, format, upload_token }. */
export interface VerificationUpload {
  public_id: string;
  format?: string;
  upload_token: string;
}

export async function uploadVerificationFile(file: Blob, filename: string): Promise<VerificationUpload> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await apiPostMultipart<Partial<VerificationUpload>>('/verification/upload', form);
  if (!res?.public_id || !res.upload_token) throw new Error('The photo uploaded but the server didn’t confirm it. Try again.');
  return { public_id: res.public_id, format: res.format, upload_token: res.upload_token };
}

export interface VerificationSubmit {
  document_type: string;
  document_number: string;
  document_image_public_id: string;
  document_image_format?: string;
  liveness_selfie_public_id: string;
  liveness_selfie_format?: string;
  document_image_upload_token: string;
  liveness_selfie_upload_token: string;
  biometric_consent: boolean;
}

export const submitVerification = (body: VerificationSubmit) => apiPost<VerificationResponse>('/verification/submit', body);

/** The latest submission, or null when the artisan hasn't submitted one (the endpoint 404s). */
export async function getVerificationStatus(): Promise<VerificationResponse | null> {
  try {
    return await apiGet<VerificationResponse>('/verification/status');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
