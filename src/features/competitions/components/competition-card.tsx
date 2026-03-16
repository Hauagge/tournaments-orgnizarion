import type { ReactNode } from 'react';
import Link from 'next/link';
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
  return (
    <Card
      className={`border-slate-200 p-0 ${isActive ? 'ring-2 ring-blue-500' : ''}`}
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
            onClick={() => onSetActive(competition.id)}
          >
            {isActive ? 'Competição ativa' : 'Definir como ativa'}
          </Button>
          <Link href={`/competitions/${competition.id}`} className="sm:flex-1">
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
