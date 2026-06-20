'use client';

import type { StockScreenerData } from '@/lib/stock-screener-types';
import type { MarketSnapshot } from '@/lib/market-types';

function formatTimestamp(ms: number) {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatIso(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Props = {
  screener: StockScreenerData | null;
  market: MarketSnapshot | null;
};

export function StockDataFreshness({ screener, market }: Props) {
  if (!screener) return null;

  const items = [
    {
      label: 'Financials',
      value: formatTimestamp(screener.loadedAt),
      hint: screener.fromCache ? 'Cached · refreshes daily' : 'Live fetch · cached 24h',
    },
    {
      label: 'Market price',
      value: formatIso(market?.asOf ?? screener.marketAsOf) ?? 'Loading…',
      hint: 'Last close from Yahoo Finance',
    },
    {
      label: 'Latest SEC filing',
      value: screener.latestFilingDate ?? '—',
      hint: 'Most recent 10-K/10-Q in documents',
    },
    {
      label: 'Next refresh',
      value: formatTimestamp(screener.expiresAt),
      hint: 'Or sooner when a new SEC filing is detected',
    },
  ];

  return (
    <div className="stock-freshness">
      {items.map((item) => (
        <div key={item.label} className="stock-freshness-item" title={item.hint}>
          <span className="stock-freshness-label">{item.label}</span>
          <span className="stock-freshness-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
