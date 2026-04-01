// components/dashboard/line-chart.tsx
type LineChartProps = {
  title: string;
  data: Array<{ label: string; value: number }>;
};

export const LineChart = ({ title, data }: LineChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-4 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">{title}</h3>
      <div className="text-neutral-900 dark:text-white">
        <div className="relative h-32">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={data
                .map((item, i) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const y = 100 - ((item.value - minValue) / range) * 80 - 10;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((item, i) => {
              const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
              const y = 100 - ((item.value - minValue) / range) * 80 - 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="currentColor"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-[var(--v-chart-muted)]">
        {data.map((item, i) => (
          <span key={i} className="truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
