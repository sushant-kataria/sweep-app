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
            <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6}/>
              <stop offset="90%" stopColor="#1e293b" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
          <XAxis dataKey="label" tick={{ fill: '#8884d8', fontSize: 12 }} />
          <YAxis domain={['auto', 'auto']} tickCount={7} width={60} tick={{ fill: '#8884d8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#16181a', border: 'none', color: '#22d3ee' }}
            labelClassName="font-mono"
            formatter={(value) => [value, unit ?? '']}
          />
          <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} fill="url(#chartColor)" dot={{ r: 2 }} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
