'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PropertyPortfolio } from '@/components/dashboard/property-portfolio';
import { ZillowListings } from '@/components/dashboard/zillow-listings';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { RealEstateAnalysisPanel } from '@/components/real-estate/real-estate-analysis-panel';
import { RealEstateBuilder } from '@/components/real-estate/real-estate-builder';
import { RealEstateChat } from '@/components/real-estate/real-estate-chat';
import { RealEstateMetricsPanel } from '@/components/real-estate/real-estate-metrics-panel';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { DEFAULT_MARKET_ID } from '@/lib/real-estate-data';
import { buildMarketSession, buildPortfolioSession } from '@/lib/real-estate-session';
import { clearRealEstateSession, loadRealEstateSession, saveRealEstateSession } from '@/lib/real-estate-storage';
import type { RealEstateSession } from '@/lib/real-estate-types';

function RealEstatePageContent() {
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSweepTheme();
  const [session, setSession] = useState<RealEstateSession | null>(null);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'assets'>('analysis');

  const handleSession = (next: RealEstateSession) => {
    setSession(next);
    saveRealEstateSession(next);
    setActiveTab('analysis');
  };

  useEffect(() => {
    const marketParam = searchParams.get('market');
    const modeParam = searchParams.get('mode');
    const saved = loadRealEstateSession();

    if (modeParam === 'portfolio') {
      handleSession(buildPortfolioSession());
    } else if (marketParam) {
      const built = buildMarketSession(marketParam);
      if (built) handleSession(built);
    } else if (saved) {
      setSession(saved);
    } else {
      const built = buildMarketSession(DEFAULT_MARKET_ID);
      if (built) handleSession(built);
    }

    setHydrated(true);
  }, [searchParams]);

  const resetView = () => {
    setSession(null);
    clearRealEstateSession();
    setError('');
  };

  if (!hydrated) {
    return <div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />;
  }

  const reportContext = session
    ? {
        mode: session.mode,
        market: session.market,
        listings: session.listings,
        portfolio: session.portfolio,
        metrics: session.metrics,
        analysis: session.analysis,
      }
    : null;

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
                  <RealEstateBuilder onSession={handleSession} onError={setError} />
                </>
              ) : (
                <div className="finance-report-view space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-lg font-semibold text-[var(--v-fg)]">
                        {session.mode === 'portfolio'
                          ? 'Sweep Capital Portfolio'
                          : `${session.market.name} Market Scan`}
                      </h1>
                      <p className="text-xs text-[var(--v-fg-4)]">
                        {session.mode === 'portfolio'
                          ? 'Multi-market rental portfolio · 4 assets'
                          : session.market.metro}
                      </p>
                    </div>
                    <button type="button" onClick={resetView} className="finance-secondary-btn">
                      New scan
                    </button>
                  </div>

                  <RealEstateMetricsPanel session={session} />

                  <div className="finance-view-tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('analysis')}
                      className={`finance-view-tab ${activeTab === 'analysis' ? 'finance-view-tab--active' : ''}`}
                    >
                      Market note
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('assets')}
                      className={`finance-view-tab ${activeTab === 'assets' ? 'finance-view-tab--active' : ''}`}
                    >
                      {session.mode === 'portfolio' ? 'Properties' : 'Listings'}
                    </button>
                  </div>

                  {activeTab === 'analysis' ? (
                    <RealEstateAnalysisPanel analysis={session.analysis} />
                  ) : session.mode === 'portfolio' && session.portfolio ? (
                    <PropertyPortfolio properties={session.portfolio} />
                  ) : session.listings ? (
                    <ZillowListings
                      properties={session.listings.map((l) => ({
                        id: l.id,
                        address: l.address,
                        price: l.price,
                        beds: l.beds,
                        baths: l.baths,
                        sqft: l.sqft,
                        propertyType: l.propertyType,
                        url: l.url,
                      }))}
                      totalResults={session.listings.length}
                      searchCriteria={{
                        location: session.market.name,
                        listingType: 'forSale',
                      }}
                    />
                  ) : null}
                </div>
              )}
            </section>
          }
          end={
            <section className="finance-chat-panel">
              {session && reportContext ? (
                <RealEstateChat context={reportContext} />
              ) : (
                <div className="finance-chat-placeholder">
                  <p className="text-sm text-[var(--v-fg-3)]">Scan a market or load the portfolio to unlock property Q&A.</p>
                  <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                    <li>· Compare cap rates across major metros</li>
                    <li>· Review listings and rental yield metrics</li>
                    <li>· Ask grounded questions on portfolio risk</li>
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

export default function RealEstatePage() {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <RealEstatePageContent />
    </Suspense>
  );
}