import { notFound } from 'next/navigation';

import { RealEstateScreenResultsView } from '@/components/real-estate/real-estate-screen-results-view';
import { getRealEstateScreenById } from '@/lib/real-estate-market/screens';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RealEstateScreenPage({ params }: Props) {
  const { id } = await params;
  const screen = getRealEstateScreenById(id);
  if (!screen) notFound();

  return <RealEstateScreenResultsView screenId={id} backHref="/real-estate" />;
}
