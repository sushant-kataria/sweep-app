'use client';

import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { RealEstateExplore } from '@/components/real-estate/real-estate-explore';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapMetroPoint } from '@/lib/real-estate-market/map-data';
import type { MetroSummary } from '@/lib/real-estate-market/types';

type Props = {
  metros: MetroSummary[];
  mapMetros: MapMetroPoint[];
  generatedAt: string;
  source: string;
};

export function RealEstateExplorerShell({ metros, mapMetros, generatedAt, source }: Props) {
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="finance-main">
        <FinanceSplitView
          start={
            <section className="finance-report-panel finance-scroll">
              <RealEstateExplore
                metros={metros}
                mapMetros={mapMetros}
                generatedAt={generatedAt}
                source={source}
              />
            </section>
          }
          end={
            <section className="finance-chat-panel">
              <div className="finance-chat-placeholder">
                <p className="text-sm text-[var(--v-fg-3)]">Browse metros and investor screens with free public data.</p>
                <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                  <li>· 30 major US metros, ZIP-level medians</li>
                  <li>· 6 investor screens (yield, dips, DOM, inventory)</li>
                  <li>· Deal analyzer with FRED mortgage rates</li>
                  <li>· $0 data cost — Redfin + FRED only</li>
                </ul>
              </div>
            </section>
          }
        />
      </main>
    </div>
  );
}
