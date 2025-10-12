// components/dashboard/bar-chart-pro.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type BarChartProProps = {
  title: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

export const BarChartPro = ({ title, data, unit = '' }: BarChartProProps) => {
  // Transform data for Recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
  }));

  return (
    <div className="bg-black border border-white/20 rounded p-4">
      <h3 className="text-white font-mono text-sm mb-3">{title}</h3>
      {unit && (
        <p className="text-white/60 font-mono text-xs mb-3">Unit: {unit}</p>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.6)"
            style={{ fontSize: '10px', fontFamily: 'monospace' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.6)"
            style={{ fontSize: '10px', fontFamily: 'monospace' }}
            label={{ 
              value: unit, 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'rgba(255,255,255,0.6)', fontSize: '10px', fontFamily: 'monospace' }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            labelStyle={{ color: 'white' }}
            itemStyle={{ color: 'white' }}
          />
          <Legend 
            wrapperStyle={{ 
              fontFamily: 'monospace', 
              fontSize: '10px',
              color: 'rgba(255,255,255,0.8)'
            }}
          />
          <Bar dataKey="value" fill="white" name={unit || 'Value'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
