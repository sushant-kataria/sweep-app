'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BalanceSheet } from '@/components/dashboard/balance-sheet';
import { FinanceAnalysisPanel } from '@/components/finance/finance-analysis-panel';
import { FinanceBuilder } from '@/components/finance/finance-builder';
import { FinanceChat } from '@/components/finance/finance-chat';
import { FinanceDownloadButton } from '@/components/finance/finance-download-button';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { FinanceMarketPanel } from '@/components/finance/finance-market-panel';
import { FinanceMetricsPanel } from '@/components/finance/finance-metrics-panel';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import { getDefaultPeriod } from '@/lib/finance-data';
import { buildPreloadedFinanceSession } from '@/lib/finance-session';
import { clearFinanceSession, loadFinanceSession, saveFinanceSession } from '@/lib/finance-storage';
import type { FinanceSession } from '@/lib/finance-types';

function FinancePageContent() {
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useSweepTheme();
  const [session, setSession] = useState<FinanceSession | null>(null);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'statements'>('analysis');

  const handleSession = (next: FinanceSession) => {
    setSession(next);
    saveFinanceSession(next);
    setActiveTab('analysis');
  };

  useEffect(() => {
    const paramTicker = searchParams.get('ticker')?.toUpperCase();
    const shouldGenerate = searchParams.get('generate') === '1';
    const saved = loadFinanceSession();

    if (shouldGenerate && paramTicker) {
      const session = buildPreloadedFinanceSession(paramTicker, getDefaultPeriod(paramTicker));
      if (session) handleSession(session);
    } else if (saved) {
      setSession(saved);
    }

    setHydrated(true);
  }, [searchParams]);

  const resetReport = () => {
    setSession(null);
    clearFinanceSession();
    setError('');
  };

  if (!hydrated) {
    return <div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />;
  }

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
                  <FinanceBuilder onSession={handleSession} onError={setError} />
                </>
              ) : (
                <div className="finance-report-view space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="text-lg font-semibold text-[var(--v-fg)]">
                        {session.report.companyName} ({session.report.ticker})
                      </h1>
                      <p className="text-xs text-[var(--v-fg-4)]">
                        {session.report.period} · {session.report.source}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <FinanceDownloadButton session={session} />
                      <button type="button" onClick={resetReport} className="finance-secondary-btn">
                        New report
                      </button>
                    </div>
                  </div>

                  <FinanceMarketPanel ticker={session.report.ticker} />

                  <FinanceMetricsPanel metrics={session.metrics} />

                  <div className="finance-view-tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('analysis')}
                      className={`finance-view-tab ${activeTab === 'analysis' ? 'finance-view-tab--active' : ''}`}
                    >
                      Analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('statements')}
                      className={`finance-view-tab ${activeTab === 'statements' ? 'finance-view-tab--active' : ''}`}
                    >
                      Balance sheet
                    </button>
                  </div>

                  {activeTab === 'analysis' ? (
                    <FinanceAnalysisPanel analysis={session.analysis} />
                  ) : (
                    <BalanceSheet
                      title={session.report.title}
                      period={session.report.period}
                      currency={session.report.currency}
                      assets={session.report.assets}
                      liabilities={session.report.liabilities}
                      equity={session.report.equity}
                    />
                  )}
                </div>
              )}
            </section>
          }
          end={
            <section className="finance-chat-panel">
              {session ? (
                <FinanceChat
                  context={{
                    report: session.report,
                    metrics: session.metrics,
                    analysis: session.analysis,
                  }}
                />
              ) : (
                <div className="finance-chat-placeholder">
                  <p className="text-sm text-[var(--v-fg-3)]">Import a filing to unlock analyst-grade Q&A.</p>
                  <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                    <li>· Paste a 10-K or annual report link</li>
                    <li>· Upload PDF annual reports or Excel exports</li>
                    <li>· Get executive summary, ratios, and risks</li>
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

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <FinancePageContent />
    </Suspense>
  );
}