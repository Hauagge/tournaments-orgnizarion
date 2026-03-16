import CompetitionFormPage from '@/features/competitions/components/competition-form-page';

export default async function EditCompetitionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CompetitionFormPage competitionId={id} />;
}
