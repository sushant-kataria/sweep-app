'use client';

import type { FinanceMetrics } from '@/lib/finance-types';

function formatMillions(v: number) {
  return v.toLocaleString('en-US');
}

function formatRatio(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(2);
}

export function FinanceMetricsPanel({ metrics }: { metrics: FinanceMetrics }) {
  const items = [
    { label: 'Total assets', value: `$${formatMillions(metrics.totalAssets)}M`, group: 'scale' },
    { label: 'Total liabilities', value: `$${formatMillions(metrics.totalLiabilities)}M`, group: 'scale' },
    { label: 'Total equity', value: `$${formatMillions(metrics.totalEquity)}M`, group: 'scale' },
    { label: 'Cash & equivalents', value: `$${formatMillions(metrics.cashAndEquivalents)}M`, group: 'liquidity' },
    { label: 'Working capital', value: `$${formatMillions(metrics.workingCapital)}M`, group: 'liquidity' },
    { label: 'Current ratio', value: formatRatio(metrics.currentRatio), group: 'liquidity' },
    { label: 'Quick ratio', value: formatRatio(metrics.quickRatio), group: 'liquidity' },
    { label: 'Cash ratio', value: formatRatio(metrics.cashRatio), group: 'liquidity' },
    { label: 'Total debt', value: `$${formatMillions(metrics.totalDebt)}M`, group: 'leverage' },
    { label: 'Net debt', value: `$${formatMillions(metrics.netDebt)}M`, group: 'leverage' },
    { label: 'Debt / equity', value: formatRatio(metrics.debtToEquity), group: 'leverage' },
    { label: 'Debt / assets', value: formatRatio(metrics.debtToAssets), group: 'leverage' },
    { label: 'Equity ratio', value: formatRatio(metrics.equityRatio), group: 'structure' },
    {
      label: 'Balance check',
      value: metrics.balanceCheckOk ? 'Balanced' : `$${formatMillions(metrics.balanceCheck)}M gap`,
      group: 'structure',
    },
  ];

  return (
    <div className="finance-metrics">
      {items.map((item) => (
        <div key={item.label} className="finance-metric-card">
          <span className="finance-metric-label">{item.label}</span>
          <span className={`finance-metric-value ${item.label === 'Balance check' && !metrics.balanceCheckOk ? 'text-amber-600 dark:text-amber-400' : ''}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}