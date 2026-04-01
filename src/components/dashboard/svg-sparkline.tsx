export function SvgSparkline({ data, color = "#22d3ee", height = 200 }: {
    data: Array<{ value: number }>,
    color?: string,
    height?: number
  }) {
    if (!data || data.length < 2) {
      return (
        <div className="flex h-full items-center justify-center text-xs text-[var(--v-chart-empty)]">
          No chart data available.
        </div>
      )
    }
  
    const width = 500;
    const values = data.map(d => d.value ?? 0);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
  
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - minY) / (maxY - minY || 1)) * height;
      return `${x},${y}`;
    }).join(' ');
  
    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
        />
        {/* Optional: area fill */}
        <polygon
          points={`${points} ${width},${height} 0,${height}`}
          fill={color}
          fillOpacity={0.08}
        />
      </svg>
    );
  }
  