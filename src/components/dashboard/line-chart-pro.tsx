import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';

export function LineChartPro({ title, data, unit }: { title?: string; data: Array<{ label: string; value: number }>; unit?: string }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-xs text-gray-400">No chart data</div>;
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="whiteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="#fff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222"/>
          <XAxis
            dataKey="label"
            tick={{ fill: '#fff', fontSize: 12 }}
            axisLine={{ stroke: "#fff" }}
            tickLine={{ stroke: "#fff" }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickCount={7}
            width={60}
            tick={{ fill: '#fff', fontSize: 12 }}
            axisLine={{ stroke: "#fff" }}
            tickLine={{ stroke: "#fff" }}
          />
          <Tooltip
            contentStyle={{ background: '#000', border: 'none', color: '#fff' }}
            labelClassName="font-mono"
            formatter={(value) => [value, unit ?? '']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#fff"
            strokeWidth={3}
            fill="url(#whiteFill)"
            dot={{ r: 2, stroke: "#fff", fill: "#fff" }}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
