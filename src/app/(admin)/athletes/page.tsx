import AthletesPage from '@/features/athletes/components/athletes-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function AthletesRoute() {
  return (
    <ManagementOnly>
      <AthletesPage />
    </ManagementOnly>
  );
}
