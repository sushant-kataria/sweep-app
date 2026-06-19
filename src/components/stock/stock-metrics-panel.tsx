'use client';

import type { StockFundamentals } from '@/lib/stock-types';

function formatPe(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(1);
}

export function StockMetricsPanel({ fundamentals, lastPrice }: { fundamentals: StockFundamentals; lastPrice: number }) {
  const items = [
    { label: 'Last price', value: `$${lastPrice.toFixed(2)}` },
    { label: 'Market cap', value: fundamentals.marketCap },
    { label: 'P/E (TTM)', value: formatPe(fundamentals.peRatio) },
    { label: 'Forward P/E', value: formatPe(fundamentals.forwardPe) },
    { label: 'Revenue', value: fundamentals.revenue },
    { label: 'EPS', value: `$${fundamentals.eps.toFixed(2)}` },
    {
      label: 'Dividend yield',
      value: fundamentals.dividendYield != null ? `${fundamentals.dividendYield.toFixed(2)}%` : '—',
    },
    { label: 'Beta', value: fundamentals.beta.toFixed(2) },
    { label: '52W high', value: `$${fundamentals.fiftyTwoWeekHigh}` },
    { label: '52W low', value: `$${fundamentals.fiftyTwoWeekLow}` },
    { label: 'Avg volume', value: fundamentals.avgVolume },
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