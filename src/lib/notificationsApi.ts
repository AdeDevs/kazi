import { apiGet, apiPatch } from './apiClient';

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
