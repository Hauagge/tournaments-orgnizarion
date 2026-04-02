import KeyGroupDetailPage from '@/features/key-groups/components/key-group-detail-page';

type KeyGroupDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function KeyGroupDetailRoute({
  params,
}: KeyGroupDetailRouteProps) {
  const { id } = await params;
  return <KeyGroupDetailPage keyGroupId={id} />;
}
