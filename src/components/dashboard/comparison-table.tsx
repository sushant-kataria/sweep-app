// components/dashboard/comparison-table.tsx
type ComparisonProps = {
  title: string;
  items: Array<{
    name: string;
    metrics: Record<string, number | string>;
  }>;
};

export const ComparisonTable = ({ title, items }: ComparisonProps) => {
  if (!items.length) return null;

  const metricKeys = Object.keys(items[0].metrics);

  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-3 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-[var(--v-chart-card-border)]">
              <th className="py-2 pr-2 text-left text-[var(--v-chart-fg)]">Name</th>
              {metricKeys.map((key) => (
                <th key={key} className="px-2 py-2 text-right text-[var(--v-chart-muted)]">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-[var(--v-chart-card-border)]">
                <td className="py-2 pr-2 text-[var(--v-chart-fg)]">{item.name}</td>
                {metricKeys.map((key) => (
                  <td key={key} className="px-2 py-2 text-right text-[var(--v-chart-tick)]">
                    {typeof item.metrics[key] === 'number'
                      ? (item.metrics[key] as number).toLocaleString()
                      : item.metrics[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
