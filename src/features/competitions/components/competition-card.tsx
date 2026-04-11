'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, GitBranch, Scale, TimerReset } from 'lucide-react';
import {
  Competition,
  competitionModeLabels,
} from '@/features/competitions/types/competition';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

type CompetitionCardProps = {
  competition: Competition;
  isActive: boolean;
  onSetActive: (competitionId: string) => void;
};

export function CompetitionCard({
  competition,
  isActive,
  onSetActive,
}: CompetitionCardProps) {
  const router = useRouter();
  const destinationHref = '/key-groups';

  const handleOpenCompetition = () => {
    onSetActive(competition.id);
    router.push(destinationHref);
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
      className={`cursor-pointer border-slate-200 p-0 transition hover:-translate-y-0.5 hover:shadow-md ${isActive ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {competitionModeLabels[competition.mode]}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {competition.name}
            </h2>
          </div>
          {isActive && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Ativa
            </span>
          )}
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <Metric
            icon={<TimerReset className="h-4 w-4" />}
            label="Duração da luta"
            value={`${competition.fightDurationSeconds}s`}
          />
          <Metric
            icon={<Scale className="h-4 w-4" />}
            label="Margem da pesagem"
            value={`${competition.weighInMarginGrams}g`}
          />
          <Metric
            icon={<CalendarClock className="h-4 w-4" />}
            label="Faixa etária"
            value={`${competition.ageSplitYears} anos`}
          />
          <Metric
            icon={<GitBranch className="h-4 w-4" />}
            label="Modo"
            value={competitionModeLabels[competition.mode]}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            onClick={(event) => {
              event.stopPropagation();
              onSetActive(competition.id);
            }}
          >
            {isActive ? 'Competição ativa' : 'Definir como ativa'}
          </Button>
          <Link
            href={`/competitions/${competition.id}`}
            className="sm:flex-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button className="w-full" variant="default">
              Editar competição
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
