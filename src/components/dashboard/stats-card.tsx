// components/dashboard/stats-card.tsx
type StatsProps = {
  title: string;
  stats: Array<{
    label: string;
    value: string;
    change?: string;
  }>;
};

export const StatsCard = ({ title, stats }: StatsProps) => {
  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-3 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="rounded border border-[var(--v-chart-card-border)] bg-neutral-100/70 p-2 dark:bg-white/[0.06]"
          >
            <div className="mb-1 font-mono text-xs text-[var(--v-chart-muted)]">{stat.label}</div>
            <div className="font-mono text-sm text-[var(--v-chart-fg)]">{stat.value}</div>
            {stat.change && (
              <div className="mt-1 font-mono text-xs text-[var(--v-chart-muted)]">{stat.change}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
