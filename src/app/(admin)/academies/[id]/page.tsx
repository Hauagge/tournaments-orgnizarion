import { AcademyDetailPage } from '@/features/academies/components/academy-detail-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

type AcademyDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AcademyDetailRoute({
  params,
}: AcademyDetailRouteProps) {
  const { id } = await params;

  return (

    <ManagementOnly>

      <AcademyDetailPage academyId={id} />

    </ManagementOnly>

  );
}
