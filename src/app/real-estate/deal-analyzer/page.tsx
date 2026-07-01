import { DealAnalyzerPage } from '@/components/real-estate/deal-analyzer-page';
import { requireSweepUser } from '@/lib/sweep-auth';

export default async function RealEstateDealAnalyzerRoute() {
  await requireSweepUser('/real-estate/deal-analyzer');
  return <DealAnalyzerPage />;
}
