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

export function LineChartPro({
  title,
  data,
  unit,
}: {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 h-48 flex items-center justify-center">
        <span className="text-white/25 text-xs">No data available</span>
      </div>
    );
  }

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const changePct = first !== 0 ? ((change / first) * 100) : 0;
  const isPositive = change >= 0;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';
  const gradId = `lg-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {title && (
            <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1.5">
              {title}
            </p>
          )}
          <div className="flex items-baseline gap-2.5">
            <span className="text-white text-2xl font-semibold tracking-tight">
              {formatDisplay(last, unit)}
            </span>
            <span
              className={`text-sm font-medium px-1.5 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isPositive ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
            </span>
          </div>
          <p className="text-white/25 text-[11px] mt-1">
            {isPositive ? '+' : ''}{formatDisplay(change, unit)} all time
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
              <stop offset="85%" stopColor={lineColor} stopOpacity={0} />
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
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: '#000', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
