import ImportAthletesPage from '@/features/imports/components/import-athletes-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function ImportsAthletesRoute() {
  return (
    <ManagementOnly>
      <ImportAthletesPage />
    </ManagementOnly>
  );
}
