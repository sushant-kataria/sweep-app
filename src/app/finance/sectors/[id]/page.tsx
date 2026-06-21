import { notFound } from 'next/navigation';

import { ScreenResultsView } from '@/components/finance/screen-results-view';
import { FINANCE_SECTORS } from '@/lib/finance-screens';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FinanceSectorPage({ params }: Props) {
  const { id } = await params;
  const sector = FINANCE_SECTORS.find((s) => s.id === id);
  if (!sector) notFound();

  return <ScreenResultsView screenId={id} kind="sector" backHref="/finance/explore" />;
}
