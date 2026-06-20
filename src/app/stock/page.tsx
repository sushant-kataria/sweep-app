'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { CompanySearch } from '@/components/finance/company-search';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { StockAnalysisPanel } from '@/components/stock/stock-analysis-panel';
import { StockBuilder } from '@/components/stock/stock-builder';
import { StockChat } from '@/components/stock/stock-chat';
import { StockMarketPanel } from '@/components/stock/stock-market-panel';
import { StockMetricsPanel } from '@/components/stock/stock-metrics-panel';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { toCompanySearchResult } from '@/lib/company-search-utils';
import { loadStockSessionByTicker } from '@/lib/stock-client';
import { DEFAULT_STOCK_TICKER } from '@/lib/stock-data';
import { buildStockSession } from '@/lib/stock-session';
import { clearStockSession, loadStockSession, saveStockSession } from '@/lib/stock-storage';
import type { MarketSnapshot } from '@/lib/market-types';
import type { StockSession } from '@/lib/stock-types';

function StockPageContent() {
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSweepTheme();
  const [session, setSession] = useState<StockSession | null>(null);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'peers'>('analysis');
  const [market, setMarket] = useState<MarketSnapshot | null>(null);

  const handleMarketSnapshot = useCallback((snapshot: MarketSnapshot | null) => {
    setMarket(snapshot);
  }, []);

  const handleSession = (next: StockSession) => {
    setSession(next);
    saveStockSession(next);
    setActiveTab('analysis');
    setError('');
    setMarket(null);
  };

  const loadTicker = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const preloaded = buildStockSession(symbol);
      if (preloaded) {
        handleSession(preloaded);
        return;
      }
      const loaded = await loadStockSessionByTicker(symbol);
      handleSession(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : `No equity profile for ${symbol}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTicker = searchParams.get('ticker')?.toUpperCase();
    const saved = loadStockSession();

    if (paramTicker) {
      void loadTicker(paramTicker);
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

  const chatPrice = market?.price ?? session?.lastPrice ?? 0;
  const chatHistory = market?.history ?? session?.priceHistory ?? [];

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className="finance-main">
        <FinanceSplitView
          start={
            <section className="finance-report-panel finance-scroll">
              {loading && !session ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm text-[var(--v-fg-3)]">
                  <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
                  Loading equity profile…
                </div>
              ) : !session ? (
                <>
                  {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
                  <StockBuilder onSession={handleSession} onError={setError} />
                </>
              ) : (
                <>
                  {error && <p className="mb-3 text-center text-sm text-red-500">{error}</p>}
                <div className={`finance-report-view space-y-4 ${loading ? 'finance-report-view--loading' : ''}`}>
                  {loading && (
                    <div className="finance-report-loading-overlay" aria-live="polite">
                      <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
                      Loading equity profile…
                    </div>
                  )}
                  <div className="finance-report-header">
                    <div>
                      <h1 className="text-lg font-semibold text-[var(--v-fg)]">
                        {session.companyName} ({session.ticker})
                      </h1>
                      <p className="text-xs text-[var(--v-fg-4)]">
                        {session.sector} · {session.currency} ·{' '}
                        {session.liveData ? 'Live market + SEC filer' : 'Research profile + live chart'}
                      </p>
                    </div>
                    <div className="finance-report-header-actions">
                      <CompanySearch
                        compact
                        value={toCompanySearchResult(session.ticker, session.companyName)}
                        onChange={() => {}}
                        onSelect={(company) => {
                          if (company.ticker !== session.ticker) void loadTicker(company.ticker);
                        }}
                        disabled={loading}
                        placeholder="Search another company…"
                      />
                      <button type="button" onClick={resetView} className="finance-secondary-btn">
                        New screen
                      </button>
                    </div>
                  </div>

                  <StockMarketPanel
                    ticker={session.ticker}
                    companyName={session.companyName}
                    liveProfile={session.liveData}
                    onSnapshot={handleMarketSnapshot}
                  />

                  <StockMetricsPanel session={session} market={market} />

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
                </>
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
                    lastPrice: chatPrice,
                    currency: session.currency,
                    priceHistory: chatHistory,
                    fundamentals: session.fundamentals,
                    peers: session.peers,
                    analysis: session.analysis,
                  }}
                />
              ) : (
                <div className="finance-chat-placeholder">
                  <p className="text-sm text-[var(--v-fg-3)]">Load an equity profile to unlock sell-side style Q&A.</p>
                  <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                    <li>· Search any SEC filer or use the mega-cap watchlist</li>
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