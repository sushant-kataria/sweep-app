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
    <div className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{formatDisplay(payload[0].value, unit)}</p>
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
      <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 h-48 flex items-center justify-center">
        <span className="text-white/25 text-xs">No data available</span>
      </div>
    );
  }

  const gradId = `area-lg-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      {title && (
        <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-4">{title}</p>
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
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="0"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            width={52}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#000', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
