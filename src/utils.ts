import { ServicePricingType } from './types';

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

