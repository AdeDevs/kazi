import { apiGet, apiPatch, apiPut } from './apiClient';

/** GET /notifications/ item (NotificationResponse). */
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  booking_id?: string | null;
  is_read: boolean;
  channel: string;
  created_at: string;
}

export const listNotifications = () => apiGet<NotificationResponse[]>('/notifications/');
export const markNotificationRead = (id: string) => apiPatch<unknown>(`/notifications/${encodeURIComponent(id)}/read`);
export const markAllNotificationsRead = () => apiPatch<unknown>('/notifications/read-all');

/** `email_summaries`: a daily email listing unread notifications. `push_enabled` is only stored
 * until the backend can send push notifications, so the app doesn't offer it yet. */
export interface NotificationPreferences {
  push_enabled: boolean;
  email_summaries: boolean;
}

export const getNotificationPreferences = () => apiGet<NotificationPreferences>('/notifications/preferences');
export const updateNotificationPreferences = (patch: Partial<NotificationPreferences>) =>
  apiPut<NotificationPreferences>('/notifications/preferences', patch);
