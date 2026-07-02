'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ComponentType } from 'react';
import { MetroMapPreview } from '@/components/real-estate/metro-map-preview';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapMetroPoint } from '@/lib/real-estate-market/map-data';
import { prefetchRealEstateMapChunk } from '@/lib/real-estate-market/map-prefetch';

type FullMapProps = {
  metros: MapMetroPoint[];
  theme: 'light' | 'dark';
  variant: 'full';
  initialMetroSlug: string | null;
};

type Props = {
  metros: MapMetroPoint[];
};

function RealEstateMapPageInner({ metros }: Props) {
  const { theme, toggleTheme } = useSweepTheme();
  const searchParams = useSearchParams();
  const initialMetroSlug = searchParams.get('metro');
  const previewMetros = metros.map(({ zips: _zips, ...lite }) => lite);
  const [MapComponent, setMapComponent] = useState<ComponentType<FullMapProps> | null>(null);

  useEffect(() => {
    prefetchRealEstateMapChunk();
    let cancelled = false;
    void import('@/components/real-estate/real-estate-leaflet-map').then((mod) => {
      if (!cancelled) setMapComponent(() => mod.RealEstateLeafletMap);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
            <Link href="/real-estate" className="mt-2 inline-block text-xs text-[var(--v-fg-4)] underline-offset-2 hover:underline">
              ← Back to real estate hub
            </Link>
          </header>
          {MapComponent ? (
            <MapComponent metros={metros} theme={theme} variant="full" initialMetroSlug={initialMetroSlug} />
          ) : (
            <MetroMapPreview metros={previewMetros} theme={theme} />
          )}
        </section>
      </main>
    </div>
  );
}

export function RealEstateMapPage({ metros }: Props) {
  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <RealEstateMapPageInner metros={metros} />
    </Suspense>
  );
}
