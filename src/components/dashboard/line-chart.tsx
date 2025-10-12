// components/dashboard/line-chart.tsx
type LineChartProps = {
    title: string;
    data: Array<{ label: string; value: number }>;
  };
  
  export const LineChart = ({ title, data }: LineChartProps) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-4">{title}</h3>
        <div className="relative h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={data.map((item, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((item.value - minValue) / range) * 80 - 10;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((item, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 80 - 10;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="white"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-white/60">
          {data.map((item, i) => (
            <span key={i} className="truncate">{item.label}</span>
          ))}
        </div>
      </div>
    );
  };
  