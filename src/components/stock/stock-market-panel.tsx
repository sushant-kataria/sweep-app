'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChartPro } from '@/components/dashboard/line-chart-pro';
import { useMarketSnapshot } from '@/hooks/use-market-snapshot';
import type { MarketRange, MarketSnapshot } from '@/lib/market-types';

const RANGES: { id: MarketRange; label: string }[] = [
  { id: '6mo', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: '5y', label: '5Y' },
];

function formatUsd(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPct(v: number) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function formatAsOf(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'last close';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type Props = {
  ticker: string;
  companyName: string;
  liveProfile?: boolean;
  onSnapshot?: (snapshot: MarketSnapshot | null) => void;
};

export function StockMarketPanel({ ticker, companyName, liveProfile = false, onSnapshot }: Props) {
  const [range, setRange] = useState<MarketRange>('1y');
  const { displaySnapshot, loading, error } = useMarketSnapshot(ticker, range);

  useEffect(() => {
    onSnapshot?.(displaySnapshot);
  }, [displaySnapshot, onSnapshot]);

  return (
    <section className="finance-market-panel space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--v-fg-5)]">Price chart</p>
          {loading && !displaySnapshot ? (
            <p className="text-sm text-[var(--v-fg-4)]">Loading price data…</p>
          ) : displaySnapshot ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--v-fg)]">{formatUsd(displaySnapshot.price)}</span>
              <span
                className={`text-sm font-medium ${displaySnapshot.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
              >
                {formatPct(displaySnapshot.changePct)}
              </span>
              <span className="text-[11px] text-[var(--v-fg-4)]">
                Last close · {formatAsOf(displaySnapshot.asOf)}
                {displaySnapshot.source === 'finnhub' ? ' · Finnhub' : ''}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--v-fg-4)]">{error || 'No market data'}</p>
          )}
        </div>

        <div className="finance-market-ranges">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`finance-market-range ${range === r.id ? 'finance-market-range--active' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {displaySnapshot && (
        <>
          <div className="finance-market-stats">
            <div>
              <span className="finance-market-stat-label">52W high</span>
              <span className="finance-market-stat-value">{formatUsd(displaySnapshot.fiftyTwoWeekHigh)}</span>
            </div>
            <div>
              <span className="finance-market-stat-label">52W low</span>
              <span className="finance-market-stat-value">{formatUsd(displaySnapshot.fiftyTwoWeekLow)}</span>
            </div>
            <div>
              <span className="finance-market-stat-label">Prev close</span>
              <span className="finance-market-stat-value">{formatUsd(displaySnapshot.previousClose)}</span>
            </div>
            <div>
              <span className="finance-market-stat-label">Day change</span>
              <span
                className={`finance-market-stat-value ${displaySnapshot.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
              >
                {formatUsd(displaySnapshot.change)}
              </span>
            </div>
          </div>

          <LineChartPro title={`${companyName} (${ticker})`} data={displaySnapshot.history} unit="USD" />
        </>
      )}

      <p className="text-[11px] text-[var(--v-fg-4)]">
        {liveProfile
          ? 'Live market data for this SEC filer. '
          : 'Live price chart with pre-loaded research fundamentals below. '}
        <Link href={`/finance?ticker=${encodeURIComponent(ticker)}`} className="text-[var(--v-fg-3)] underline-offset-2 hover:underline">
          View SEC balance sheet →
        </Link>
      </p>
    </section>
  );
}
