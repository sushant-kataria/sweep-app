'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function formatValue(v: number, unit?: string): string {
  const u = (unit || '').toLowerCase();
  const prefix = u.includes('usd') || u.includes('$') || u.includes('price') ? '$' : '';
  const suffix = u.includes('%') || u.includes('percent') ? '%' : '';
  if (v >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(2)}B${suffix}`;
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(2)}M${suffix}`;
  if (v >= 1_000) return `${prefix}${v.toLocaleString()}${suffix}`;
  return `${prefix}${v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)}${suffix}`;
}

const CustomTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border px-3 py-2.5 shadow-lg bg-[var(--v-chart-tooltip-bg)] border-[var(--v-chart-tooltip-border)]">
      <p className="text-[var(--v-chart-muted)] text-[11px] mb-1">{item.name}</p>
      <p className="text-[var(--v-chart-fg)] font-semibold text-sm">
        {formatValue(item.value, unit)} <span className="text-[var(--v-chart-muted)] font-normal">({(item.payload.percent * 100).toFixed(1)}%)</span>
      </p>
    </div>
  );
};

const CustomLegend = ({ data, colors }: { data: Array<{ label: string; value: number; percent: number }>; colors: string[] }) => (
  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
    {data.map((item, i) => (
      <div key={i} className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
        <span className="text-[var(--v-chart-tick)] text-[11px] truncate">{item.label}</span>
        <span className="text-[var(--v-chart-muted)] text-[11px] ml-auto flex-shrink-0">{item.percent.toFixed(1)}%</span>
      </div>
    ))}
  </div>
);

type PieChartProProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const PieChartPro = ({ title, data, unit }: PieChartProProps) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full rounded-2xl border p-5 h-48 flex items-center justify-center bg-[var(--v-chart-card-bg)] border-[var(--v-chart-card-border)]">
        <span className="text-[var(--v-chart-empty)] text-xs">No data available</span>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const enriched = data.map(d => ({ ...d, percent: total > 0 ? (d.value / total) * 100 : 0 }));
  const chartData = enriched.map(d => ({ name: d.label, value: d.value, percent: d.percent / 100 }));

  return (
    <div className="w-full rounded-2xl border p-4 bg-[var(--v-chart-card-bg)] border-[var(--v-chart-card-border)]">
      {title && (
        <p className="text-[var(--v-chart-title)] text-[11px] font-medium uppercase tracking-wider mb-4">{title}</p>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="var(--v-chart-pie-stroke)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip unit={unit} />} />
        </PieChart>
      </ResponsiveContainer>

      <CustomLegend data={enriched} colors={COLORS} />
    </div>
  );
};
