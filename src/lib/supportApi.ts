import { apiGet, apiPost } from './apiClient';

/** SupportTicketResponse. `ticket_number` (e.g. "SUP-7F3A9C") is the one to show the user. */
export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  booking_id?: string | null;
  status: string;
  created_at: string;
}

export interface SupportTicketCreate {
  /** 1–150 characters. */
  subject: string;
  /** 1–5000 characters. */
  message: string;
  /** Optional; must be one of the user's own bookings. */
  booking_id?: string | null;
}

/** The user's own requests, newest first. */
export const listMySupportTickets = () => apiGet<SupportTicket[]>('/support/tickets');
export const createSupportTicket = (body: SupportTicketCreate) => apiPost<SupportTicket>('/support/tickets', body);
