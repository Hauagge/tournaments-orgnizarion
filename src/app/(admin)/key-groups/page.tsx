import KeyGroupsPage from '@/features/key-groups/components/key-groups-page';
import { ManagementOnly } from '@/features/auth/components/management-only';



export default function KeyGroupsRoute() {
  return (
    <ManagementOnly>
      <KeyGroupsPage />
    </ManagementOnly>
  );
}
