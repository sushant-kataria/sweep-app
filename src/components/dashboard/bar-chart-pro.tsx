'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function formatValue(v: number, unit?: string): string {
  const u = (unit || '').toLowerCase();
  const prefix = u.includes('usd') || u.includes('$') || u.includes('price') ? '$' : '';
  const suffix = u.includes('%') || u.includes('percent') ? '%' : '';
  if (v >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(2)}B${suffix}`;
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(2)}M${suffix}`;
  if (v >= 1_000) return `${prefix}${v.toLocaleString()}${suffix}`;
  return `${prefix}${v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)}${suffix}`;
}

function formatAxisTick(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v % 1 === 0 ? v.toString() : v.toFixed(1);
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-white/40 text-[11px] mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{formatValue(payload[0].value, unit)}</p>
    </div>
  );
};

type BarChartProProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const BarChartPro = ({ title, data, unit }: BarChartProProps) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 h-48 flex items-center justify-center">
        <span className="text-white/25 text-xs">No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      {/* Header */}
      {title && (
        <div className="mb-4">
          <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider">{title}</p>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
        <BarChart
          layout="vertical"
          data={data.map(d => ({ name: d.label, value: d.value }))}
          margin={{ top: 2, right: 16, left: 0, bottom: 2 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="0"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 'auto']}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatAxisTick}
            tickCount={5}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value === maxValue ? '#3b82f6' : 'rgba(59,130,246,0.4)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
