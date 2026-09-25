import { Booking, ServicePricingType } from './types';

const ARCHIVE_AFTER_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

/**
 * A 'paid_out' or 'cancelled' booking is archived (what the UI used to call the 'closed'
 * status) once it's old enough -- there's no such state on the backend, so this is computed
 * client-side from `completedAt`/`created_at` rather than stored on the booking itself.
 */
export function isBookingArchived(booking: Booking): boolean {
  if (booking.status === 'cancelled') return true;
  if (booking.status !== 'paid_out') return false;
  const referenceTime = booking.completedAt || booking.created_at;
  if (!referenceTime) return false;
  return Date.now() - new Date(referenceTime).getTime() >= ARCHIVE_AFTER_MS;
}

// Every monetary value in the UI goes through these two -- never `₦${n}` or n.toLocaleString(),
// which follow the viewer's browser locale (a German phone would show "150.000").
const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});
const GROUPED_NUMBER = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

/** "just now", "5 min ago", "3 hrs ago", "2 days ago". */
export function timeAgo(value: string | Date): string {
  // Backend timestamps are UTC but sent without a timezone suffix.
  const date = typeof value === 'string' && !/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? new Date(`${value}Z`) : new Date(value);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** When a booking is for. Bookings from the backend carry no date or time slot yet. */
export function bookingWhen(booking: Pick<Booking, 'scheduled_date' | 'timeSlot'>): string {
  if (!booking.scheduled_date) return 'Date not set yet';
  return booking.timeSlot ? `${booking.scheduled_date} (${booking.timeSlot})` : booking.scheduled_date;
}

/** "Name (phone)", leaving out the phone when there isn't one -- the backend never shares it. */
export function customerLabel(booking: Pick<Booking, 'customerName' | 'customerPhone'>): string {
  return booking.customerPhone ? `${booking.customerName} (${booking.customerPhone})` : booking.customerName;
}

/** Today as YYYY-MM-DD in the device's own timezone (toISOString() would give the UTC date). */
export function localDateISO(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 5000 => '₦5,000' */
export function formatCurrency(value: number): string {
  return NAIRA.format(value);
}

/** 150000 => '150,000' -- for amounts shown without the ₦ sign, such as a price input's value. */
export function formatAmount(value: number): string {
  return GROUPED_NUMBER.format(value);
}

/**
 * Returns formatted pricing label based on ServicePricingType:
 * - fixed: "₦15,000" + label "Fixed price"
 * - quote_required: "Request a quote"
 * - starting: "From ₦10,000"
 */
export function formatServicePrice(pricingType?: ServicePricingType, price?: number, fallbackRate?: number): {
  primaryText: string;
  badgeLabel?: string;
  type: ServicePricingType;
} {
  const actualType = pricingType || (price ? 'starting' : 'quote_required');
  const amount = price ?? fallbackRate ?? 0;

  if (actualType === 'fixed') {
    return {
      primaryText: formatCurrency(amount),
      badgeLabel: 'Fixed price',
      type: 'fixed'
    };
  }

  if (actualType === 'quote_required') {
    return {
      primaryText: 'Request a quote',
      badgeLabel: 'Quote required',
      type: 'quote_required'
    };
  }

  // 'starting'
  return {
    primaryText: `From ${formatCurrency(amount)}`,
    badgeLabel: 'Starting price',
    type: 'starting'
  };
}

