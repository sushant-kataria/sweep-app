'use client';

import { useEffect, useState } from 'react';
import { LineChartPro } from '@/components/dashboard/line-chart-pro';
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

export function FinanceMarketPanel({ ticker }: { ticker: string }) {
  const [range, setRange] = useState<MarketRange>('1y');
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const res = await fetch(`/api/market/snapshot?ticker=${encodeURIComponent(ticker)}&range=${range}`);
        const data = (await res.json()) as MarketSnapshot & { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Market data unavailable.');
        if (!cancelled) setSnapshot(data);
      } catch (e) {
        if (!cancelled) {
          setSnapshot(null);
          setError(e instanceof Error ? e.message : 'Market data unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker, range]);

  return (
    <section className="finance-market-panel space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--v-fg-5)]">Market</p>
          {loading && !snapshot ? (
            <p className="text-sm text-[var(--v-fg-4)]">Loading price data…</p>
          ) : snapshot ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--v-fg)]">{formatUsd(snapshot.price)}</span>
              <span
                className={`text-sm font-medium ${snapshot.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}
              >
                {formatPct(snapshot.changePct)}
              </span>
              <span className="text-[11px] text-[var(--v-fg-4)]">
                {snapshot.source === 'finnhub' ? 'Live' : 'Last close'} · {formatAsOf(snapshot.asOf)}
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

      {snapshot && (
        <>
          <div className="finance-market-stats">
            <div>
              <span className="finance-market-stat-label">52W high</span>
              <span className="finance-market-stat-value">{formatUsd(snapshot.fiftyTwoWeekHigh)}</span>
            </div>
            <div>
              <span className="finance-market-stat-label">52W low</span>
              <span className="finance-market-stat-value">{formatUsd(snapshot.fiftyTwoWeekLow)}</span>
            </div>
            <div>
              <span className="finance-market-stat-label">Prev close</span>
              <span className="finance-market-stat-value">{formatUsd(snapshot.previousClose)}</span>
            </div>
          </div>

          <LineChartPro
            title={`${snapshot.ticker} Stock Price`}
            data={snapshot.history}
            unit="USD"
          />
        </>
      )}
    </section>
  );
}
