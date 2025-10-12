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

export const MapVisualization = ({ 
  title, 
  markers, 
  highlightedRegions 
}: MapVisualizationProps) => {
  const maxValue = Math.max(...highlightedRegions.map(r => r.value), 1);

  return (
    <div className="bg-black border border-white/20 rounded p-4">
      <h3 className="text-white font-mono text-sm mb-3">{title}</h3>
      
      {/* Simple bar chart representation of regions */}
      <div className="space-y-2">
        {highlightedRegions.length > 0 ? (
          highlightedRegions.map((region, i) => {
            const width = (region.value / maxValue) * 100;
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-white/80">
                  <span>{region.label || region.countryCode}</span>
                  <span>{region.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 rounded h-6 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-white/60 font-mono text-xs text-center py-8">
            no data to display
          </div>
        )}
      </div>

      {/* Markers list if available */}
      {markers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="text-xs font-mono text-white/60 mb-2">locations:</div>
          <div className="space-y-1">
            {markers.map((marker, i) => (
              <div key={i} className="flex justify-between text-xs font-mono">
                <span className="text-white/80">{marker.name}</span>
                {marker.value && (
                  <span className="text-white">{marker.value.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
