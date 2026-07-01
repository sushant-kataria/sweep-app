export function formatUsd(value: number | null | undefined, compact = false): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (compact && value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && value >= 10_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatYield(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}%`;
}

export function formatScore(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return String(Math.round(value));
}

export function formatDom(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}d`;
}
