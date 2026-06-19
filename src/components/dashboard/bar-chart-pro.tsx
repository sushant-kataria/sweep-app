'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  GrokChartEmpty,
  GrokChartShell,
  GrokChartTooltip,
  formatAxisTick,
  useChartGradientId,
} from './chart-utils';

type BarChartProProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const BarChartPro = ({ title, data, unit }: BarChartProProps) => {
  if (!Array.isArray(data) || data.length === 0) return <GrokChartEmpty />;

  const maxValue = Math.max(...data.map((d) => d.value));
  const gradId = useChartGradientId('grok-bar');

  return (
    <GrokChartShell>
      {title && <p className="grok-chart-title mb-4">{title}</p>}

      <div className="grok-chart-plot">
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
          <BarChart
            layout="vertical"
            data={data.map((d) => ({ name: d.label, value: d.value }))}
            margin={{ top: 2, right: 12, left: 0, bottom: 2 }}
            barCategoryGap="24%"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--v-chart-bar)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--v-chart-bar)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--v-chart-grid)" strokeDasharray="3 6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tick={{ fill: 'var(--v-chart-tick-dim)', fontSize: 10, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisTick}
              tickCount={5}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={{ fill: 'var(--v-chart-tick)', fontSize: 11, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<GrokChartTooltip unit={unit} />} cursor={{ fill: 'var(--v-chart-cursor)' }} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value === maxValue ? `url(#${gradId})` : 'var(--v-chart-bar-muted)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GrokChartShell>
  );
};