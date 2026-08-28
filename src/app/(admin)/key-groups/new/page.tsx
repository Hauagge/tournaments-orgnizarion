import KeyGroupCreatePage from '@/features/key-groups/components/key-group-create-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function KeyGroupCreateRoute() {
  return (
    <ManagementOnly>
      <KeyGroupCreatePage />
    </ManagementOnly>
  );
}
