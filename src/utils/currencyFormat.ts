import { getCurrentLanguage } from '../i18n/currentLanguage';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function locale(): string {
  return getCurrentLanguage() === 'bn' ? 'bn-BD' : 'en-US';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return formatAmount(n);
}

// For raw in-progress input (e.g. an amount being typed digit-by-digit) where
// Intl.NumberFormat can't be used since the string may not be a complete
// number yet (trailing '.', etc.) — just localizes the digit glyphs.
export function formatDigits(raw: string): string {
  if (getCurrentLanguage() !== 'bn') return raw;
  return raw.replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}
