'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useSweepTheme } from '@/hooks/use-sweep-theme';
import type { MapMetroPoint } from '@/lib/real-estate-market/map-data';

const RealEstateLeafletMap = dynamic(
  () => import('@/components/real-estate/real-estate-leaflet-map').then((m) => m.RealEstateLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="re-map-embed-loading">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    ),
  },
);

type Props = {
  metros: MapMetroPoint[];
  layout?: 'inline' | 'panel';
};

export function RealEstateMapEmbed({ metros, layout = 'panel' }: Props) {
  const { theme } = useSweepTheme();
  const isInline = layout === 'inline';

  return (
    <div className={`re-map-embed-panel${isInline ? ' re-map-embed-panel--inline' : ''}`}>
      <div className="re-map-embed-head">
        <div>
          <h2 className="re-map-embed-title">Market map</h2>
          <p className="re-map-embed-desc">
            {isInline ? 'Search by city or metro · click markers for details' : '30 metros · click to explore'}
          </p>
        </div>
        <Link href="/real-estate/map" className="re-map-embed-full-link">
          <ExternalLink className="h-3 w-3" aria-hidden />
          Full map
        </Link>
      </div>
      <RealEstateLeafletMap metros={metros} theme={theme} variant="embed" />
    </div>
  );
}
