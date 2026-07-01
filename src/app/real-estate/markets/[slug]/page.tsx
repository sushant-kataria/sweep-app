import { notFound } from 'next/navigation';

import { MetroDetailView } from '@/components/real-estate/real-estate-explore';
import { getMetroBySlug } from '@/lib/real-estate-market/seed';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RealEstateMetroPage({ params }: Props) {
  const { slug } = await params;
  const metro = getMetroBySlug(slug);
  if (!metro) notFound();

  return (
    <div className="finance-shell min-h-dvh bg-[var(--v-bg)]">
      <main className="finance-main">
        <section className="finance-report-panel finance-scroll mx-auto max-w-6xl p-4">
          <MetroDetailView metro={metro} />
        </section>
      </main>
    </div>
  );
}
