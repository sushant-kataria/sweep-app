// components/dashboard/analytics-card.tsx
type AnalyticsProps = {
  views: number;
  clicks: number;
  conversions: number;
  timeRange: string;
};

export const AnalyticsCard = ({ views, clicks, conversions, timeRange }: AnalyticsProps) => {
  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-3 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
        analytics ({timeRange})
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-[var(--v-chart-muted)]">views</span>
          <span className="text-[var(--v-chart-fg)]">{views.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-[var(--v-chart-muted)]">clicks</span>
          <span className="text-[var(--v-chart-fg)]">{clicks.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-mono text-xs">
          <span className="text-[var(--v-chart-muted)]">conversions</span>
          <span className="text-[var(--v-chart-fg)]">{conversions.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
