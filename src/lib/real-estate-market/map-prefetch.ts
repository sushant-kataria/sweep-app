let started = false;

/** Warm the Leaflet map chunk + CSS as soon as the real estate hub mounts. */
export function prefetchRealEstateMapChunk(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  void import('@/components/real-estate/real-estate-leaflet-map');
  void import('leaflet/dist/leaflet.css');
}
