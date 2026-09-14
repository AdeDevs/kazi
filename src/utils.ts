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

/**
 * Formats a numeric price into Naira currency format using the en-NG locale.
 * E.g., 5000 => '₦5,000'
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
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

