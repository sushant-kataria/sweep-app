'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  DeltaBadge,
  GrokChartEmpty,
  GrokChartShell,
  GrokChartTooltip,
  StatPill,
  extractTicker,
  formatValue,
  formatAxisTick,
  getSeriesStats,
  useChartGradientId,
} from './chart-utils';
import { StockLogo } from '@/components/stock/stock-logo';

export function LineChartPro({
  title,
  data,
  unit,
}: {
  title?: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
}) {
  if (!Array.isArray(data) || data.length === 0) return <GrokChartEmpty />;

  const { first, last, high, low, change, changePct, isPositive } = getSeriesStats(data);
  const ticker = extractTicker(title);
  const gradId = useChartGradientId('grok-line');
  const period = `${data[0].label} – ${data[data.length - 1].label}`;
  const isStock = (unit || '').toLowerCase().match(/usd|\$|price|stock/) || !!ticker;

  return (
    <GrokChartShell>
      <div className="grok-chart-header">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {ticker && (
              <span className="grok-chart-ticker grok-chart-ticker--with-logo">
                <StockLogo ticker={ticker} size="sm" plain />
                <span>{ticker}</span>
              </span>
            )}
            {title && (
              <p className="grok-chart-title truncate">{title}</p>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="grok-chart-price">{formatValue(last, unit)}</span>
            <DeltaBadge changePct={changePct} isPositive={isPositive} />
          </div>
          <p className="grok-chart-subcopy">
            {isPositive ? '+' : ''}{formatValue(change, unit)} over period
          </p>
        </div>
      </div>

      <div className="grok-chart-stats">
        <StatPill label="High" value={formatValue(high, unit)} />
        <StatPill label="Low" value={formatValue(low, unit)} />
        <StatPill label={isStock ? 'Range' : 'Period'} value={period} />
      </div>

      <div className="grok-chart-plot">
        <ResponsiveContainer width="100%" height={isStock ? 200 : 180}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--v-chart-line)" stopOpacity={0.22} />
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
              dy={6}
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
            <ReferenceLine
              y={first}
              stroke="var(--v-chart-ref)"
              strokeDasharray="4 4"
              strokeWidth={1}
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
}