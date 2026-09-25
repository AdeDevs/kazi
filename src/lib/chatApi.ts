import { apiGet, apiPatch, apiPost, apiPostMultipart } from './apiClient';

// Chat over REST (the WebSocket handshake behind /chat/ws-ticket isn't documented yet).
// Shapes verified against the live API: GET /conversations items, MessageResponse.

export interface ConversationResponse {
  id: string;
  client_id: string;
  artisan_id: string;
  active_booking_id?: string | null;
  active_job_title?: string | null;
  active_job_amount?: number | null;
  last_message?: string | null;
  updated_at: string;
}

/** message_type seen live: text, image, audio, location, plus backend-posted booking_update / quote_offer. */
export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id?: string | null;
  content?: string | null;
  attachments?: string[];
  audio_url?: string | null;
  media_type?: string | null;
  audio_duration?: number | null;
  audio_wave_data?: number[];
  location_data?: { lat: number; lng: number; address?: string; landmark?: string } | null;
  message_type: string;
  status?: string;
  read_at?: string | null;
  created_at: string;
}

export interface MessageCreate {
  conversation_id: string;
  content?: string | null;
  attachments?: string[];
  audio_url?: string | null;
  audio_duration?: number | null;
  /** 0–1 per bar; the schema declares it as a list of numbers. */
  audio_wave_data?: number[];
  location_data?: { lat: number; lng: number; address?: string } | null;
  media_type?: string | null;
  message_type: 'text' | 'image' | 'audio' | 'location';
}

export const listConversations = () => apiGet<ConversationResponse[]>('/conversations?limit=50');
/** Get-or-create: returns the existing conversation with this artisan if there is one. */
export const startConversation = (artisanUserId: string) =>
  apiPost<ConversationResponse>('/conversations', { artisan_id: artisanUserId });
export const listMessages = (conversationId: string) =>
  apiGet<MessageResponse[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
export const sendMessage = (body: MessageCreate) =>
  apiPost<MessageResponse>(`/conversations/${encodeURIComponent(body.conversation_id)}/messages`, body);
export const markConversationRead = (conversationId: string) =>
  apiPatch<unknown>(`/conversations/${encodeURIComponent(conversationId)}/read`);

/** Uploads a photo or voice note; the docs declare `{}`, verified live as `{ "url": "…" }`. */
export async function uploadChatMedia(file: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await apiPostMultipart<{ url?: string }>('/chat/upload-media', form);
  if (!res?.url) throw new Error('The file uploaded but no link came back. Try again.');
  return res.url;
}
