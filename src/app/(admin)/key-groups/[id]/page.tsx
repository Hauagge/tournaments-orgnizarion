import KeyGroupDetailPage from '@/features/key-groups/components/key-group-detail-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

type KeyGroupDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function KeyGroupDetailRoute({
  params,
}: KeyGroupDetailRouteProps) {
  const { id } = await params;
  return (
    <ManagementOnly>
      <KeyGroupDetailPage keyGroupId={id} />
    </ManagementOnly>
  );
}
