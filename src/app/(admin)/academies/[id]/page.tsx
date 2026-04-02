import { AcademyDetailPage } from '@/features/academies/components/academy-detail-page';

type AcademyDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AcademyDetailRoute({
  params,
}: AcademyDetailRouteProps) {
  const { id } = await params;

  return <AcademyDetailPage academyId={id} />;
}
