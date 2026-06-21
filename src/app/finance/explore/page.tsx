'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { FinanceExplore } from '@/components/finance/finance-explore';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';

function FinanceExplorePageContent() {
  const router = useRouter();
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} backHref="/finance" />

      <main className="finance-main">
        <FinanceSplitView
          start={
            <section className="finance-report-panel finance-scroll">
              <FinanceExplore
                onSelectTicker={(ticker) => {
                  router.push(`/finance?ticker=${encodeURIComponent(ticker)}`);
                }}
              />
              <p className="finance-explore-footnote mt-6 text-center text-[11px] text-[var(--v-fg-5)]">
                <Link href="/finance" className="underline-offset-2 hover:underline">
                  ← Back to finance workspace
                </Link>
              </p>
            </section>
          }
          end={
            <section className="finance-chat-panel">
              <div className="finance-chat-placeholder">
                <p className="text-sm text-[var(--v-fg-3)]">Pick a stock from a screen or sector to open its SEC report.</p>
                <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                  <li>· 40+ screens inspired by screener.in</li>
                  <li>· Live RSI, golden cross, and 52-week scans</li>
                  <li>· Balance sheet analysis opens on the finance page</li>
                </ul>
              </div>
            </section>
          }
        />
      </main>
    </div>
  );
}

export default function FinanceExplorePage() {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <FinanceExplorePageContent />
    </Suspense>
  );
}
