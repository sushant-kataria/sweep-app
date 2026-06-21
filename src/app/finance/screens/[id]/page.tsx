import { notFound } from 'next/navigation';

import { ScreenResultsView } from '@/components/finance/screen-results-view';
import { getScreenById } from '@/lib/finance-screens';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FinanceScreenPage({ params }: Props) {
  const { id } = await params;
  const screen = getScreenById(id);
  if (!screen) notFound();

  return <ScreenResultsView screenId={id} kind="screen" backHref="/finance/explore" />;
}
