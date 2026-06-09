'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatYAxis(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v % 1 === 0 ? v.toString() : v.toFixed(2);
}

function formatDisplay(v: number, unit?: string): string {
  const u = (unit || '').toLowerCase();
  const prefix = u.includes('usd') || u.includes('$') || u.includes('price') ? '$' : '';
  const suffix = u.includes('%') || u.includes('percent') ? '%' : '';
  if (v >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(2)}B${suffix}`;
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(2)}M${suffix}`;
  if (v >= 1_000) return `${prefix}${v.toLocaleString()}${suffix}`;
  return `${prefix}${v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)}${suffix}`;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2.5 shadow-lg bg-[var(--v-chart-tooltip-bg)] border-[var(--v-chart-tooltip-border)]">
      <p className="text-[var(--v-chart-muted)] text-[11px] mb-1">{label}</p>
      <p className="text-[var(--v-chart-fg)] font-semibold text-sm">{formatDisplay(payload[0].value, unit)}</p>
    </div>
  );
};

type AreaChartProProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const AreaChartPro = ({ title, data, unit }: AreaChartProProps) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full rounded-2xl border p-5 h-48 flex items-center justify-center bg-[var(--v-chart-card-bg)] border-[var(--v-chart-card-border)]">
        <span className="text-[var(--v-chart-empty)] text-xs">No data available</span>
      </div>
    );
  }

  const gradId = `area-lg-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="w-full rounded-2xl border p-4 bg-[var(--v-chart-card-bg)] border-[var(--v-chart-card-border)]">
      {title && (
        <p className="text-[var(--v-chart-title)] text-[11px] font-medium uppercase tracking-wider mb-4">{title}</p>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--v-chart-grid)"
            strokeDasharray="0"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--v-chart-tick-dim)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--v-chart-tick-dim)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            width={52}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: 'var(--v-chart-cursor-line)', strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: 'var(--v-chart-dot-stroke)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
