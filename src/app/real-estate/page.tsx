import { Suspense } from 'react';
import { FinanceSplitView } from '@/components/finance/finance-split-view';
import { RealEstateExplore } from '@/components/real-estate/real-estate-explore';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { RealEstateExplorerShell } from '@/components/real-estate/real-estate-explorer-shell';
import { getAllMetros, getSeedMeta } from '@/lib/real-estate-market/seed';

export default function RealEstatePage() {
  const metros = getAllMetros();
  const meta = getSeedMeta();

  return (
    <Suspense fallback={<div className="finance-shell min-h-dvh bg-[var(--v-bg)]" />}>
      <RealEstateExplorerShell metros={metros} generatedAt={meta.generatedAt} source={meta.source} />
    </Suspense>
  );
}
