'use client';

import type { RealEstateMetrics, RealEstateSession } from '@/lib/real-estate-types';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}

export function RealEstateMetricsPanel({ session }: { session: RealEstateSession }) {
  const { metrics, mode } = session;

  const items =
    mode === 'portfolio'
      ? [
          { label: 'Portfolio value', value: formatCurrency(metrics.totalValue) },
          { label: 'Monthly rent', value: formatCurrency(metrics.totalIncome) },
          { label: 'Blended cap rate', value: `${metrics.avgCapRate.toFixed(1)}%` },
          { label: 'Occupancy', value: `${metrics.occupancyRate.toFixed(0)}%` },
          { label: 'Properties', value: String(metrics.propertyCount) },
          { label: 'Since-acquisition gain', value: `${metrics.yoyAppreciation.toFixed(1)}%` },
        ]
      : [
          { label: 'Median price', value: formatCurrency(session.market.medianPrice) },
          { label: 'Median rent', value: formatCurrency(session.market.medianRent) },
          { label: 'Avg cap rate', value: `${metrics.avgCapRate.toFixed(1)}%` },
          { label: 'Active listings', value: String(metrics.propertyCount) },
          { label: 'Days on market', value: String(metrics.avgDaysOnMarket) },
          { label: 'YoY change', value: `${metrics.yoyAppreciation >= 0 ? '+' : ''}${metrics.yoyAppreciation.toFixed(1)}%` },
        ];

  return (
    <div className="finance-metrics">
      {items.map((item) => (
        <div key={item.label} className="finance-metric-card">
          <span className="finance-metric-label">{item.label}</span>
          <span className="finance-metric-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}