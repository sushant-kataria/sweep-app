import 'leaflet/dist/leaflet.css';

import { RealEstateMapPage } from '@/components/real-estate/real-estate-map-page';
import { buildMapMetros } from '@/lib/real-estate-market/map-data';

export const metadata = {
  title: 'Market map · Real estate · Sweep',
  description: 'Interactive map of US metro and ZIP-level real estate investor data.',
};

export default function RealEstateMapRoute() {
  const metros = buildMapMetros();

  return <RealEstateMapPage metros={metros} />;
}
