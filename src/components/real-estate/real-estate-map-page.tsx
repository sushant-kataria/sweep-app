'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapMetroPoint } from '@/lib/real-estate-market/map-data';

const RealEstateLeafletMap = dynamic(
  () => import('@/components/real-estate/real-estate-leaflet-map').then((m) => m.RealEstateLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="re-map-loading">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading map…
      </div>
    ),
  },
);

type Props = {
  metros: MapMetroPoint[];
};

export function RealEstateMapPage({ metros }: Props) {
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell re-map-page">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} backHref="/real-estate" />
      <main className="finance-main re-map-main">
        <section className="re-map-panel">
          <header className="re-map-header">
            <h1 className="text-xl font-semibold text-[var(--v-fg)]">Market map</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--v-fg-3)]">
              Explore 30 US metros on an interactive map. Search by city, click a metro to drill into ZIP-level deal
              scores, prices, and yields — synced with Sweep&apos;s Redfin seed data.
            </p>
          </header>
          <RealEstateLeafletMap metros={metros} theme={theme} />
        </section>
      </main>
    </div>
  );
}
