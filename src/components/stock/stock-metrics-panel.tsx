'use client';

import type { MarketSnapshot } from '@/lib/market-types';
import type { StockFundamentals, StockSession } from '@/lib/stock-types';

function formatPe(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}x`;
}

function formatUsd(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

type MetricItem = { label: string; value: string };

function MetricGroup({ title, items }: { title: string; items: MetricItem[] }) {
  if (!items.length) return null;
  return (
    <div className="stock-metric-group">
      <h3 className="stock-metric-group-title">{title}</h3>
      <div className="finance-metrics">
        {items.map((item) => (
          <div key={item.label} className="finance-metric-card">
            <span className="finance-metric-label">{item.label}</span>
            <span className="finance-metric-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  session: StockSession;
  market?: MarketSnapshot | null;
};

export function StockMetricsPanel({ session, market }: Props) {
  const { fundamentals, liveData } = session;
  const pe = market?.peRatio ?? fundamentals.peRatio;

  const valuation: MetricItem[] = [
    { label: 'Market cap', value: fundamentals.marketCap },
    { label: 'P/E (TTM)', value: formatPe(pe) },
    { label: 'Forward P/E', value: formatPe(fundamentals.forwardPe) },
    { label: 'EPS', value: fundamentals.eps > 0 ? `$${fundamentals.eps.toFixed(2)}` : '—' },
    { label: 'Revenue', value: fundamentals.revenue },
  ];

  const trading: MetricItem[] = [
    {
      label: 'Dividend yield',
      value: fundamentals.dividendYield != null ? `${fundamentals.dividendYield.toFixed(2)}%` : '—',
    },
    { label: 'Beta', value: fundamentals.beta > 0 ? fundamentals.beta.toFixed(2) : '—' },
    { label: 'Avg volume', value: fundamentals.avgVolume },
  ];

  const range: MetricItem[] = market
    ? [
        { label: '52W high', value: formatUsd(market.fiftyTwoWeekHigh) },
        { label: '52W low', value: formatUsd(market.fiftyTwoWeekLow) },
        { label: 'Prev close', value: formatUsd(market.previousClose) },
        {
          label: 'Range position',
          value:
            market.fiftyTwoWeekHigh != null &&
            market.fiftyTwoWeekLow != null &&
            market.fiftyTwoWeekHigh > market.fiftyTwoWeekLow
              ? `${(((market.price - market.fiftyTwoWeekLow) / (market.fiftyTwoWeekHigh - market.fiftyTwoWeekLow)) * 100).toFixed(0)}% of 52W range`
              : '—',
        },
      ]
    : [
        { label: '52W high', value: formatUsd(fundamentals.fiftyTwoWeekHigh) },
        { label: '52W low', value: formatUsd(fundamentals.fiftyTwoWeekLow) },
      ];

  return (
    <div className="stock-metrics space-y-4">
      {liveData && (
        <p className="text-[11px] text-[var(--v-fg-4)]">
          Valuation rows marked — need a full filing. Open the SEC balance sheet link above for audited financials.
        </p>
      )}
      <MetricGroup title="Valuation" items={valuation} />
      <MetricGroup title="52-week range" items={range} />
      <MetricGroup title="Trading profile" items={trading} />
    </div>
  );
}
