'use client';

import { useEffect } from 'react';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { RealEstateExplore } from '@/components/real-estate/real-estate-explore';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapCityEntry, MapMetroLite } from '@/lib/real-estate-market/map-data';
import { prefetchRealEstateMapChunk } from '@/lib/real-estate-market/map-prefetch';
import type { MetroSummary } from '@/lib/real-estate-market/types';

type Props = {
  metros: MetroSummary[];
  mapMetrosLite: MapMetroLite[];
  cityIndex: MapCityEntry[];
  generatedAt: string;
  source: string;
};

export function RealEstateExplorerShell({
  metros,
  mapMetrosLite,
  cityIndex,
  generatedAt,
  source,
}: Props) {
  const { theme, toggleTheme } = useSweepTheme();

  useEffect(() => {
    prefetchRealEstateMapChunk();
  }, []);

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="finance-main">
        <FinanceSplitView
          start={
            <section className="finance-report-panel finance-scroll">
              <RealEstateExplore
                metros={metros}
                mapMetrosLite={mapMetrosLite}
                cityIndex={cityIndex}
                generatedAt={generatedAt}
                source={source}
              />
            </section>
          }
          end={
            <section className="finance-chat-panel">
              <div className="finance-chat-placeholder">
                <p className="text-sm text-[var(--v-fg-3)]">
                  Pick a market, screen, or deal to analyze. Everything here uses free public data at no API cost.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-[var(--v-fg-4)]">
                  <li>· Map 30 metros and search by city</li>
                  <li>· 6 investor screens for yield, dips, and inventory</li>
                  <li>· Deal analyzer with live FRED mortgage rates</li>
                  <li>· $0 data cost from Redfin and FRED</li>
                </ul>
              </div>
            </section>
          }
        />
      </main>
    </div>
  );
}
