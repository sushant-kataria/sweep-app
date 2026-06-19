'use client';

import { useId, type ReactNode } from 'react';

export type ChartPoint = { label: string; value: number };

export function formatValue(v: number, unit?: string): string {
  const u = (unit || '').toLowerCase();
  const prefix = u.includes('usd') || u.includes('$') || u.includes('price') ? '$' : '';
  const suffix = u.includes('%') || u.includes('percent') ? '%' : '';
  if (v >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(2)}B${suffix}`;
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(2)}M${suffix}`;
  if (v >= 1_000) return `${prefix}${v.toLocaleString()}${suffix}`;
  return `${prefix}${v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)}${suffix}`;
}

export function formatAxisTick(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v % 1 === 0 ? v.toString() : v.toFixed(1);
}

export function extractTicker(title?: string): string | null {
  if (!title) return null;
  const match = title.match(/\(([A-Z]{1,5})\)/);
  return match?.[1] ?? null;
}

export function getSeriesStats(data: ChartPoint[]) {
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const high = Math.max(...data.map((d) => d.value));
  const low = Math.min(...data.map((d) => d.value));
  const change = last - first;
  const changePct = first !== 0 ? (change / first) * 100 : 0;
  const isPositive = change >= 0;
  return { first, last, high, low, change, changePct, isPositive };
}

export function GrokChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="grok-chart-tooltip">
      <p className="grok-chart-tooltip-label">{label}</p>
      <p className="grok-chart-tooltip-value">{formatValue(payload[0].value, unit)}</p>
    </div>
  );
}

export function GrokChartShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`grok-chart-card ${className}`.trim()}>{children}</div>;
}

export function GrokChartEmpty() {
  return (
    <GrokChartShell className="grok-chart-card--empty">
      <span className="text-[var(--v-chart-empty)] text-xs">No data available</span>
    </GrokChartShell>
  );
}

export function useChartGradientId(prefix: string) {
  const id = useId().replace(/:/g, '');
  return `${prefix}-${id}`;
}

export function DeltaBadge({
  changePct,
  isPositive,
}: {
  changePct: number;
  isPositive: boolean;
}) {
  return (
    <span className={`grok-chart-delta ${isPositive ? 'grok-chart-delta--up' : 'grok-chart-delta--down'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
    </span>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="grok-chart-stat">
      <span className="grok-chart-stat-label">{label}</span>
      <span className="grok-chart-stat-value">{value}</span>
    </div>
  );
}