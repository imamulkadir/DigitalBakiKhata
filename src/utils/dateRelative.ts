import { getCurrentLanguage } from '../i18n/currentLanguage';
import { translations } from '../i18n/translations';
import { formatNumber } from './currencyFormat';

function locale(): string {
  return getCurrentLanguage() === 'bn' ? 'bn-BD' : 'en-US';
}

function dict() {
  return translations[getCurrentLanguage()].dateRelative;
}

function interpolate(str: string, n: number): string {
  return str.replace('{n}', formatNumber(n));
}

export function relativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const d = dict();

  if (diffSeconds < 60) return d.justNow;
  if (diffMinutes < 60) return interpolate(d.minutesAgo, diffMinutes);
  if (diffHours < 24) return interpolate(d.hoursAgo, diffHours);
  if (diffDays === 1) return d.yesterday;
  if (diffDays < 7) return interpolate(d.daysAgo, diffDays);
  if (diffWeeks < 4) return interpolate(d.weeksAgo, diffWeeks);
  if (diffMonths < 12) return interpolate(d.monthsAgo, diffMonths);
  return interpolate(d.yearsAgo, Math.floor(diffMonths / 12));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(locale(), {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
