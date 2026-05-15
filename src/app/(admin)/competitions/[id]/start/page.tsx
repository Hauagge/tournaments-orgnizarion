import CompetitionStartPage from '@/features/competitions/components/competition-start-page';

export default async function CompetitionStartRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CompetitionStartPage competitionId={id} />;
}
