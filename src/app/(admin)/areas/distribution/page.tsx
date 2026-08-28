import AreasDistributionPage from '@/features/areas/components/areas-distribution-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function AreasDistributionRoute() {
  return (
    <ManagementOnly>
      <AreasDistributionPage />
    </ManagementOnly>
  );
}
