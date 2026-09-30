import { JefeDetailClient } from '@/components/dashboard/content/jefe-detail-client';
import { getDashboardData } from '@/lib/actions';

export default async function JefeDetailView() {
  const data = await getDashboardData();
  return <JefeDetailClient data={data} />;
}
