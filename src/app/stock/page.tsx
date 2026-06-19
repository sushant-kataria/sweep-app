'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { LineChartPro } from '@/components/dashboard/line-chart-pro';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { StockAnalysisPanel } from '@/components/stock/stock-analysis-panel';
import { StockBuilder } from '@/components/stock/stock-builder';
import { StockChat } from '@/components/stock/stock-chat';
import { StockMetricsPanel } from '@/components/stock/stock-metrics-panel';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { DEFAULT_STOCK_TICKER } from '@/lib/stock-data';
import { buildStockSession } from '@/lib/stock-session';
import { clearStockSession, loadStockSession, saveStockSession } from '@/lib/stock-storage';
import type { StockSession } from '@/lib/stock-types';

function StockPageContent() {
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSweepTheme();
  const [session, setSession] = useState<StockSession | null>(null);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'peers'>('analysis');

  const handleSession = (next: StockSession) => {
    setSession(next);
    saveStockSession(next);
    setActiveTab('analysis');
  };

  useEffect(() => {
    const paramTicker = searchParams.get('ticker')?.toUpperCase();
    const saved = loadStockSession();

    if (paramTicker) {
      const built = buildStockSession(paramTicker);
      if (built) handleSession(built);
    } else if (saved) {
      setSession(saved);
    } else {
      const built = buildStockSession(DEFAULT_STOCK_TICKER);
      if (built) handleSession(built);
    }

    setHydrated(true);
  }, [searchParams]);

  const resetView = () => {
    setSession(null);
    clearStockSession();
    setError('');
  };

  if (!hydrated) {
    return <div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />;
  }

  const chartTitle = session ? `${session.companyName} (${session.ticker}) Stock Price` : '';

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className="finance-main">
        <FinanceSplitView
          start={
            <section className="finance-report-panel finance-scroll">
              {!session ? (
                <>
                  {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
                  <StockBuilder onSession={handleSession} onError={setError} />
                </>
              ) : (
                <div className="finance-report-view space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-lg font-semibold text-[var(--v-fg)]">
                        {session.companyName} ({session.ticker})
                      </h1>
                      <p className="text-xs text-[var(--v-fg-4)]">
                        {session.sector} · USD · Equity research view
                      </p>
                    </div>
                    <button type="button" onClick={resetView} className="finance-secondary-btn">
                      New screen
                    </button>
                  </div>

                  <LineChartPro title={chartTitle} data={session.priceHistory} unit="USD" />

                  <StockMetricsPanel fundamentals={session.fundamentals} lastPrice={session.lastPrice} />

                  <div className="finance-view-tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('analysis')}
                      className={`finance-view-tab ${activeTab === 'analysis' ? 'finance-view-tab--active' : ''}`}
                    >
                      Research note
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('peers')}
                      className={`finance-view-tab ${activeTab === 'peers' ? 'finance-view-tab--active' : ''}`}
                    >
                      Peer comps
                    </button>
                  </div>

                  {activeTab === 'analysis' ? (
                    <StockAnalysisPanel analysis={session.analysis} />
                  ) : (
                    <ComparisonTable title={`${session.ticker} peer comparison`} items={session.peers} />
                  )}
                </div>
              )}
            </section>
          }
          end={
            <section className="finance-chat-panel">
              {session ? (
                <StockChat
                  context={{
                    ticker: session.ticker,
                    companyName: session.companyName,
                    sector: session.sector,
                    lastPrice: session.lastPrice,
                    currency: session.currency,
                    priceHistory: session.priceHistory,
                    fundamentals: session.fundamentals,
                    peers: session.peers,
                    analysis: session.analysis,
                  }}
                />
              ) : (
                <div className="finance-chat-placeholder">
                  <p className="text-sm text-[var(--v-fg-3)]">Load an equity profile to unlock sell-side style Q&A.</p>
                  <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                    <li>· Screen mega-cap watchlist or sector peers</li>
                    <li>· Review price action and valuation multiples</li>
                    <li>· Ask grounded questions on thesis and risks</li>
                  </ul>
                </div>
              )}
            </section>
          }
        />
      </main>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <StockPageContent />
    </Suspense>
  );
}