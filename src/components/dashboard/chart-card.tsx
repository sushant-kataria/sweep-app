// components/dashboard/chart-card.tsx (COMPLETE REPLACEMENT)
type ChartProps = {
    chartType: string;
    metric: string;
    title?: string;
    data: Array<{ label: string; value: number }>;
  };
  
  export const ChartCard = ({ chartType, metric, title, data }: ChartProps) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    
    // Determine unit based on value magnitude
    const getUnit = () => {
      if (maxValue >= 1000000000) return 'B'; // Billions
      if (maxValue >= 1000000) return 'M'; // Millions
      if (maxValue >= 1000) return 'K'; // Thousands
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
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-1">
          {title || `${chartType} - ${metric}`}
        </h3>
        {metric && (
          <p className="text-white/60 font-mono text-xs mb-3">
            unit: {metric}
          </p>
        )}
        
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white/80 truncate max-w-[60%]">{item.label}</span>
                <span className="text-white">{item.value.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded h-4 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-white/60 font-mono text-xs w-12 text-right">
                  {formatValue(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Scale reference */}
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-xs font-mono text-white/40">
          <span>{formatValue(minValue)}</span>
          <span>{formatValue(maxValue)}</span>
        </div>
      </div>
    );
  };
  