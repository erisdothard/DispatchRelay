import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRate(ratePerMile: number): string {
  return `$${ratePerMile.toFixed(2)}/mi`;
}

export function formatWeight(lbs: number): string {
  return `${(lbs / 1000).toFixed(0)}k lbs`;
}

export function formatDate(dateStr: string): string {
  // Append T12:00:00 so date-only strings are parsed as local noon, not UTC midnight.
  // Without this, "2026-04-01" parses as UTC 00:00 and shows as Mar 31 in US timezones.
  const safe = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
  const date = new Date(safe);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
