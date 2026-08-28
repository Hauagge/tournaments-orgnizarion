import WeighInTab from '@/features/weighin/components/weighin-tab';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function WeighInRoute() {
  return (
    <ManagementOnly>
      <WeighInTab />
    </ManagementOnly>
  );
}
