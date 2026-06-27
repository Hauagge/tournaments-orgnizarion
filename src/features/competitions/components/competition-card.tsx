'use client';

import type { KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Settings,
  Workflow,
} from 'lucide-react';
import {
  Competition,
  competitionModeLabels,
} from '@/features/competitions/types/competition';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { RoleGuard } from '@/features/auth/components/role-guard';
import { useRoleAccess } from '@/features/auth/hooks/use-role-access';
import { getCompetitionEntry } from '@/features/competitions/lib/competition-flow';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

type CompetitionCardProps = {
  competition: Competition;
  isActive: boolean;
  isSelected: boolean;
  onSetActive: (competitionId: string) => void;
  onSelect: (competitionId: string) => void;
};

export function CompetitionCard({
  competition,
  isActive,
  isSelected,
  onSetActive,
  onSelect,
}: CompetitionCardProps) {
  const router = useRouter();
  const athletesQuery = useAthletes(competition.id, '');
  const { isAllowed: canManageUsers } = useRoleAccess({
    deny: ['DESK', 'PUBLIC'],
  });
  const readiness = athletesQuery.data
    ? buildAthleteReadinessSummary(athletesQuery.data)
    : null;
  const entry = getCompetitionEntry(competition.mode, readiness);
  const athleteCount = athletesQuery.data?.length ?? 0;
  const status = isActive ? 'Em andamento' : fightsNotStarted(readiness) ? 'Configurando' : 'Encerrado';
  const statusClassName = getStatusClassName(status);

  const handleOpenCompetition = () => {
    onSelect(competition.id);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a')) {
      return;
    }

    event.preventDefault();
    handleOpenCompetition();
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleOpenCompetition}
      onKeyDown={handleCardKeyDown}
      className={`cursor-pointer rounded-xl border border-slate-200/70 p-0 shadow-none transition hover:border-slate-300 ${isSelected ? 'ring-1 ring-blue-500' : isActive ? 'ring-1 ring-emerald-300' : ''}`}
    >
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-slate-500">
              {competitionModeLabels[competition.mode]}
            </p>
            <h2 className="mt-2 text-2xl font-medium text-slate-950">
              {competition.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {athleteCount} atletas · {Math.max(1, Math.ceil(athleteCount / 12))} áreas · {competitionModeLabels[competition.mode]}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={statusClassName}>{status}</span>
            {isSelected ? (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                Selecionada
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <Metric label="Duração" value={`${competition.fightDurationSeconds}s`} />
          <Metric label="Pesagem" value={`${competition.weighInMarginGrams}g`} />
          <Metric label="Idade" value={`${competition.ageSplitYears} anos`} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canManageUsers ? (
            <Button
              variant={isSelected ? 'secondary' : 'outline'}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(competition.id);
              }}
            >
              {isSelected ? 'Gerindo usuários' : 'Gerir usuários'}
            </Button>
          ) : null}
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            onClick={(event) => {
              event.stopPropagation();
              onSetActive(competition.id);
            }}
          >
            {isActive ? 'Competição ativa' : 'Definir como ativa'}
          </Button>
          <Button
            className="sm:flex-1"
            disabled={athletesQuery.isLoading && !athletesQuery.data}
            onClick={(event) => {
              event.stopPropagation();
              onSetActive(competition.id);
              router.push(entry.href);
            }}
          >
            {athletesQuery.isLoading && !athletesQuery.data
              ? 'Carregando fluxo...'
              : 'Ver chaves'}
            <Workflow className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            onClick={(event) => {
              event.stopPropagation();
              onSetActive(competition.id);
              router.push(entry.href);
            }}
          >
            {isActive ? 'Ativo' : 'Ativar'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <RoleGuard deny={['DESK', 'PUBLIC']}>
            <Link
              href={`/competitions/${competition.id}`}
              className="sm:flex-1 lg:max-w-[220px]"
              onClick={(event) => event.stopPropagation()}
            >
              <Button className="w-full" variant="default">
                Gerenciar
                <Settings className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </RoleGuard>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function fightsNotStarted(readiness: ReturnType<typeof buildAthleteReadinessSummary> | null) {
  return !readiness || readiness.totalAthletes === 0 || readiness.pendingWeighIn > 0;
}

function getStatusClassName(status: 'Em andamento' | 'Configurando' | 'Encerrado') {
  const base = 'rounded-full border px-3 py-1 text-xs';

  if (status === 'Em andamento') {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (status === 'Configurando') {
    return `${base} border-amber-200 bg-amber-50 text-amber-800`;
  }

  return `${base} border-slate-200 bg-slate-100 text-slate-600`;
}
