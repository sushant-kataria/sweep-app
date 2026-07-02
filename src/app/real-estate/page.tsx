import { Suspense } from 'react';
import { RealEstateExplorerShell } from '@/components/real-estate/real-estate-explorer-shell';
import { buildMapMetros } from '@/lib/real-estate-market/map-data';
import { getAllMetros, getSeedMeta } from '@/lib/real-estate-market/seed';

export default function RealEstatePage() {
  const metros = getAllMetros();
  const mapMetros = buildMapMetros();
  const meta = getSeedMeta();

  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <RealEstateExplorerShell
        metros={metros}
        mapMetros={mapMetros}
        generatedAt={meta.generatedAt}
        source={meta.source}
      />
    </Suspense>
  );
}
