'use client';

import { PricingPageContent } from '@/components/pricing/pricing-page-content';
import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';

export default function PricingPage() {
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="finance-scroll flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <PricingPageContent />
        </div>
      </main>
    </div>
  );
}
