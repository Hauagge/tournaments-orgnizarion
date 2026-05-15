import { AthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { CompetitionMode } from '@/features/competitions/types/competition';

export type CompetitionFlowEntry = {
  href: string;
  label: string;
};

export type CompetitionReadinessStage = 'ATHLETES' | 'WEIGH_IN' | 'READY';

type CompetitionReadinessLike =
  | Pick<
      AthleteReadinessSummary,
      'totalAthletes' | 'approvedAthletes' | 'pendingWeighIn'
    >
  | null
  | undefined;

export function getCompetitionReadinessStage(
  readiness: CompetitionReadinessLike,
): CompetitionReadinessStage {
  if (!readiness || readiness.totalAthletes === 0) {
    return 'ATHLETES';
  }

  if (readiness.pendingWeighIn > 0) {
    return 'WEIGH_IN';
  }

  if (readiness.approvedAthletes < 2) {
    return 'ATHLETES';
  }

  return 'READY';
}

export function getCompetitionEntry(
  mode: CompetitionMode,
  readiness?: CompetitionReadinessLike,
): CompetitionFlowEntry {
  const readinessStage = getCompetitionReadinessStage(readiness);

  if (readinessStage === 'ATHLETES') {
    return {
      href: '/athletes',
      label: 'Preparar atletas',
    };
  }

  if (readinessStage === 'WEIGH_IN') {
    return {
      href: '/weigh-in',
      label: 'Finalizar pesagem',
    };
  }

  if (mode === 'ABSOLUTE_GP') {
    return {
      href: '/categories',
      label: 'Abrir categorias',
    };
  }

  return {
    href: '/key-groups',
    label: 'Abrir chaves',
  };
}

export function getCompetitionSectionItems(
  mode: CompetitionMode,
  readiness?: CompetitionReadinessLike,
) {
  const readinessStage = getCompetitionReadinessStage(readiness);
  const flowBlocked = readinessStage !== 'READY';
  const setupItems = [
    { href: '/athletes', label: 'Atletas', blocked: false },
    { href: '/imports/athletes', label: 'Importação', blocked: false },
    {
      href: '/weigh-in',
      label: 'Pesagem',
      blocked: readinessStage === 'ATHLETES',
    },
  ];

  if (mode === 'ABSOLUTE_GP') {
    return [
      ...setupItems,
      { href: '/categories', label: 'Categorias', blocked: flowBlocked },
      { href: '/fights', label: 'Lutas', blocked: flowBlocked },
      {
        href: '/areas/distribution',
        label: 'Distribuição',
        blocked: flowBlocked,
      },
      { href: '/areas', label: 'Áreas', blocked: flowBlocked },
    ];
  }

  return [
    ...setupItems,
    { href: '/key-groups', label: 'Chaves', blocked: flowBlocked },
    { href: '/fights', label: 'Lutas', blocked: flowBlocked },
    { href: '/areas/distribution', label: 'Distribuição', blocked: flowBlocked },
    { href: '/areas', label: 'Áreas', blocked: flowBlocked },
  ];
}
