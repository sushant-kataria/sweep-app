// components/dashboard/chart-card.tsx
type ChartProps = {
  chartType: string;
  metric: string;
  title?: string;
  data: Array<{ label: string; value: number }>;
};

export const ChartCard = ({ chartType, metric, title, data }: ChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  const getUnit = () => {
    if (maxValue >= 1000000000) return 'B';
    if (maxValue >= 1000000) return 'M';
    if (maxValue >= 1000) return 'K';
    return '';
  };

  const formatValue = (value: number) => {
    const unit = getUnit();
    if (unit === 'B') return (value / 1000000000).toFixed(1) + 'B';
    if (unit === 'M') return (value / 1000000).toFixed(1) + 'M';
    if (unit === 'K') return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-1 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
        {title || `${chartType} - ${metric}`}
      </h3>
      {metric && <p className="mb-3 font-mono text-xs text-[var(--v-chart-muted)]">unit: {metric}</p>}

      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between font-mono text-xs">
              <span className="max-w-[60%] truncate text-[var(--v-chart-tick)]">{item.label}</span>
              <span className="text-[var(--v-chart-fg)]">{item.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 flex-1 overflow-hidden rounded bg-neutral-200 dark:bg-white/10">
                <div
                  className="h-full bg-neutral-800 transition-all dark:bg-white"
                  style={{ width: `${maxValue ? (item.value / maxValue) * 100 : 0}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-xs text-[var(--v-chart-muted)]">
                {formatValue(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between border-t border-[var(--v-chart-card-border)] pt-2 font-mono text-xs text-[var(--v-chart-empty)]">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
};
