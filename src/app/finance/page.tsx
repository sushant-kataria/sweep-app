'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Moon, Sun } from 'lucide-react';
import { BalanceSheet } from '@/components/dashboard/balance-sheet';
import { FinanceAnalysisPanel } from '@/components/finance/finance-analysis-panel';
import { FinanceBuilder } from '@/components/finance/finance-builder';
import { FinanceChat } from '@/components/finance/finance-chat';
import { FinanceDownloadButton } from '@/components/finance/finance-download-button';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { FinanceMetricsPanel } from '@/components/finance/finance-metrics-panel';
import { SweepLogo } from '@/components/sweep-logo';
import { getDefaultPeriod } from '@/lib/finance-data';
import { buildPreloadedFinanceSession } from '@/lib/finance-session';
import { clearFinanceSession, loadFinanceSession, saveFinanceSession } from '@/lib/finance-storage';
import type { FinanceSession } from '@/lib/finance-types';

const THEME_KEY = 'sweep-theme';

function FinancePageContent() {
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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
    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);

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

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
      <header className="finance-header safe-top">
        <div className="finance-header-inner">
          <div className="flex items-center gap-3">
            <Link href="/" className="grok-ghost-btn" aria-label="Back to chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/" className="grok-header-home">
              <SweepLogo className="h-7 w-7" showWordmark={false} />
            </Link>
            <div>
              <p className="font-pixel text-base text-[var(--v-fg)] sm:text-lg">Finance</p>
              <p className="text-[11px] text-[var(--v-fg-4)]">Institutional analysis & grounded Q&A</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="grok-ghost-btn grok-ghost-btn--wide hidden sm:inline-flex">
              Chat
            </Link>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="grok-ghost-btn"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

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