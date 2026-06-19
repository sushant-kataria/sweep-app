'use client';

import { WorkspacePageHeader } from '@/components/workspace/workspace-page-header';
import { useSweepTheme } from '@/hooks/use-sweep-theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function InfoPage({ title, children }: Props) {
  const { theme, toggleTheme } = useSweepTheme();

  return (
    <div className="finance-shell">
      <WorkspacePageHeader theme={theme} onToggleTheme={toggleTheme} />
      <main className="finance-scroll flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="font-pixel text-2xl text-[var(--v-fg)] sm:text-3xl">{title}</h1>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--v-fg-3)]">{children}</div>
        </div>
      </main>
    </div>
  );
}