// components/dashboard/pie-chart-pro.tsx (COMPLETE REPLACEMENT)
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PieChartProProps = {
  title: string;
  data: Array<{ label: string; value: number }>;
  unit?: string;
};

const COLORS = ['#FFFFFF', '#E0E0E0', '#C0C0C0', '#A0A0A0', '#808080', '#606060', '#404040'];

export const PieChartPro = ({ title, data, unit = '' }: PieChartProProps) => {
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            style={{ fontSize: '10px', fontFamily: 'monospace', fill: 'white' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
            ))}
          </Pie>
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
              color: 'white'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
