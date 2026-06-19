'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DeltaBadge,
  GrokChartEmpty,
  GrokChartShell,
  GrokChartTooltip,
  formatAxisTick,
  formatValue,
  getSeriesStats,
  useChartGradientId,
} from './chart-utils';

type AreaChartProProps = {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const AreaChartPro = ({ title, data, unit }: AreaChartProProps) => {
  if (!Array.isArray(data) || data.length === 0) return <GrokChartEmpty />;

  const { last, changePct, isPositive } = getSeriesStats(data);
  const gradId = useChartGradientId('grok-area');

  return (
    <GrokChartShell>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        {title && <p className="grok-chart-title">{title}</p>}
        <div className="flex items-baseline gap-2">
          <span className="grok-chart-price text-xl">{formatValue(last, unit)}</span>
          <DeltaBadge changePct={changePct} isPositive={isPositive} />
        </div>
      </div>

      <div className="grok-chart-plot">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--v-chart-line)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--v-chart-line)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--v-chart-grid)" strokeDasharray="3 6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--v-chart-tick-dim)', fontSize: 10, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--v-chart-tick-dim)', fontSize: 10, fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
              width={48}
              tickFormatter={formatAxisTick}
            />
            <Tooltip
              content={<GrokChartTooltip unit={unit} />}
              cursor={{ stroke: 'var(--v-chart-cursor-line)', strokeWidth: 1, strokeDasharray: '4 3' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--v-chart-line)"
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: 'var(--v-chart-line)',
                stroke: 'var(--v-chart-dot-stroke)',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GrokChartShell>
  );
};