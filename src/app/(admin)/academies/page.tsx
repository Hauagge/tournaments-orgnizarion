import AcademiesPage from '@/features/academies/components/academies-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function AcademiesRoute() {
  return (
    <ManagementOnly>
      <AcademiesPage />
    </ManagementOnly>
  );
}
