// components/dashboard/map-visualization.tsx (SIMPLER VERSION)
'use client';

type MapVisualizationProps = {
  title: string;
  mapType: string;
  markers: Array<{
    name: string;
    coordinates: [number, number];
    value?: number;
  }>;
  highlightedRegions: Array<{
    countryCode: string;
    value: number;
    label?: string;
  }>;
};

export const MapVisualization = ({ title, markers, highlightedRegions }: MapVisualizationProps) => {
  const maxValue = Math.max(...highlightedRegions.map((r) => r.value), 1);

  return (
    <div className="rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <h3 className="mb-3 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">{title}</h3>

      <div className="space-y-2">
        {highlightedRegions.length > 0 ? (
          highlightedRegions.map((region, i) => {
            const width = (region.value / maxValue) * 100;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-mono text-xs text-[var(--v-chart-tick)]">
                  <span>{region.label || region.countryCode}</span>
                  <span>{region.value.toLocaleString()}</span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded bg-neutral-200 dark:bg-white/10">
                  <div
                    className="h-full bg-neutral-800 transition-all dark:bg-white"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center font-mono text-xs text-[var(--v-chart-empty)]">
            no data to display
          </div>
        )}
      </div>

      {markers.length > 0 && (
        <div className="mt-4 border-t border-[var(--v-chart-card-border)] pt-4">
          <div className="mb-2 font-mono text-xs text-[var(--v-chart-muted)]">locations:</div>
          <div className="space-y-1">
            {markers.map((marker, i) => (
              <div key={i} className="flex justify-between font-mono text-xs">
                <span className="text-[var(--v-chart-tick)]">{marker.name}</span>
                {marker.value != null && (
                  <span className="text-[var(--v-chart-fg)]">{marker.value.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
