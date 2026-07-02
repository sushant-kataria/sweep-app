'use client';

import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { RealEstateExplore } from '@/components/real-estate/real-estate-explore';
import { RealEstateMapEmbed } from '@/components/real-estate/real-estate-map-embed';
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

/** ~75% explore / ~25% map on desktop. */
const REAL_ESTATE_SPLIT_RATIO = 0.75;

export function RealEstateExplorerShell({ metros, mapMetros, generatedAt, source }: Props) {
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="finance-main">
        <FinanceSplitView
          defaultRatio={REAL_ESTATE_SPLIT_RATIO}
          storageKey="sweep-real-estate-split"
          start={
            <section className="finance-report-panel finance-scroll">
              <RealEstateExplore metros={metros} generatedAt={generatedAt} source={source} />
            </section>
          }
          end={
            <section className="finance-map-panel">
              <RealEstateMapEmbed metros={mapMetros} />
            </section>
          }
        />
      </main>
    </div>
  );
}
