/**
 * Uganda DDSS — Currency formatting
 * Primary currency: Uganda Shillings (UGX)
 * Secondary: USD for export/international prices
 */

const ugxFormatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ugxFormatterDecimals = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a value as Uganda Shillings (UGX).
 * e.g. 9800 → "UGX 9,800"
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  if (showDecimals) return ugxFormatterDecimals.format(amount);
  return ugxFormatter.format(amount);
}

/**
 * Format a value as USD.
 * e.g. 2.15 → "$2.15"
 */
export function formatUSD(amount: number): string {
  return usdFormatter.format(amount);
}

/**
 * Convert UGX to USD using a fixed exchange rate (refreshed daily in production).
 * Default rate: 1 USD ≈ 3,810 UGX (June 2026 approximation)
 */
export function ugxToUsd(ugx: number, rate = 3810): number {
  return ugx / rate;
}

export default formatCurrency;
