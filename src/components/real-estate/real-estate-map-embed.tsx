'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import { MetroMapPreview } from '@/components/real-estate/metro-map-preview';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapCityEntry, MapMetroLite } from '@/lib/real-estate-market/map-data';
import { prefetchRealEstateMapChunk } from '@/lib/real-estate-market/map-prefetch';

type MapEmbedProps = {
  metros: MapMetroLite[];
  cityIndex: MapCityEntry[];
  theme: 'light' | 'dark';
  variant: 'embed';
};

type Props = {
  metros: MapMetroLite[];
  cityIndex: MapCityEntry[];
  layout?: 'inline' | 'panel';
};

export function RealEstateMapEmbed({ metros, cityIndex, layout = 'panel' }: Props) {
  const { theme } = useSweepTheme();
  const isInline = layout === 'inline';
  const [MapComponent, setMapComponent] = useState<ComponentType<MapEmbedProps> | null>(null);

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
    <div className={`re-map-embed-panel${isInline ? ' re-map-embed-panel--inline' : ''}`}>
      <div className="re-map-embed-head">
        <div>
          <h2 className="re-map-embed-title">Market map</h2>
          <p className="re-map-embed-desc">
            {isInline
              ? 'Search a city, click a pin, and see price, rent, and deal score'
              : '30 metros. Click to explore.'}
          </p>
        </div>
        <Link href="/real-estate/map" className="re-map-embed-full-link" prefetch>
          <ExternalLink className="h-3 w-3" aria-hidden />
          Full map
        </Link>
      </div>
      {MapComponent ? (
        <MapComponent metros={metros} cityIndex={cityIndex} theme={theme} variant="embed" />
      ) : (
        <MetroMapPreview metros={metros} theme={theme} />
      )}
    </div>
  );
}
