import AreaQueuePage from '@/features/areas/components/area-queue-page';

type AreaQueueRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AreaQueueRoute({ params }: AreaQueueRouteProps) {
  const { id } = await params;
  return <AreaQueuePage areaId={id} />;
}
