import { notFound } from 'next/navigation';

import { ZipDetailView } from '@/components/real-estate/real-estate-explore';
import { getZipRow } from '@/lib/real-estate-market/seed';

type Props = {
  params: Promise<{ zip: string }>;
};

export default async function RealEstateZipPage({ params }: Props) {
  const { zip } = await params;
  const row = getZipRow(zip);
  if (!row) notFound();

  return (
    <div className="finance-shell min-h-dvh bg-[var(--v-bg)]">
      <main className="finance-main">
        <section className="finance-report-panel finance-scroll mx-auto max-w-4xl p-4">
          <ZipDetailView zip={row} />
        </section>
      </main>
    </div>
  );
}
