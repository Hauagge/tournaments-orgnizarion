'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, FileBarChart, Map, Plus, Trophy, Users } from 'lucide-react';
import { CompetitionCard } from '@/features/competitions/components/competition-card';
import { CompetitionUsersPanel } from '@/features/competitions/components/competition-users-panel';
import { RoleGuard } from '@/features/auth/components/role-guard';
import { useRoleAccess } from '@/features/auth/hooks/use-role-access';
import { useCompetitions } from '@/features/competitions/hooks/use-competitions';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export default function CompetitionsListPage() {
  const { data, isLoading, isError, error } = useCompetitions();
  const competitions = Array.isArray(data) ? data : [];
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const setActiveCompetitionId = useCompetitionStore(
    (state) => state.setActiveCompetitionId,
  );
  const { isAllowed: canManageUsers } = useRoleAccess({
    deny: ['DESK', 'PUBLIC'],
  });
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (selectedCompetitionId) {
      return;
    }

    if (activeCompetitionId) {
      setSelectedCompetitionId(activeCompetitionId);
      return;
    }

    if (competitions.length > 0) {
      setSelectedCompetitionId(competitions[0].id);
    }
  }, [activeCompetitionId, competitions, selectedCompetitionId]);

  const selectedCompetition = useMemo(
    () =>
      competitions.find((competition) => competition.id === selectedCompetitionId) ??
      null,
    [competitions, selectedCompetitionId],
  );
  const activeCount = competitions.length;
  const estimatedAthletes = competitions.length * 24;
  const estimatedAreas = Math.max(0, Math.min(8, competitions.length * 2));

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200/70 bg-white px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-8">
            <Link href="/competitions" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                <Trophy className="h-5 w-5" />
              </span>
              <span className="text-lg font-medium text-slate-950">TourneyPro</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
              <Link className="rounded-lg px-3 py-2 text-slate-950" href="/competitions">
                Campeonatos
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-50" href="/athletes">
                Atletas
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-50" href="/areas">
                Áreas
              </Link>
              <Link className="rounded-lg px-3 py-2 hover:bg-slate-50" href="/dashboard">
                Relatórios
              </Link>
            </nav>
          </div>
        <RoleGuard deny={['DESK', 'PUBLIC']}>
          <Link href="/competitions/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo campeonato
            </Button>
          </Link>
        </RoleGuard>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          icon={<Trophy className="h-4 w-4" />}
          value={String(activeCount)}
          label="Campeonatos ativos"
        />
        <DashboardMetric
          icon={<Users className="h-4 w-4" />}
          value={String(estimatedAthletes)}
          label="Atletas inscritos"
        />
        <DashboardMetric
          icon={<Map className="h-4 w-4" />}
          value={String(estimatedAreas)}
          label="Áreas de luta"
        />
        <DashboardMetric
          icon={<Dumbbell className="h-4 w-4" />}
          value="0"
          label="Lutas hoje"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-slate-500" />
          <h1 className="text-2xl font-medium tracking-tight text-slate-950">
            Campeonatos
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-slate-600">
          Gerencie regras, atletas, áreas e chaves dos campeonatos cadastrados.
        </p>
      </section>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competicoes...
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">
            {'message' in (error as object)
              ? String((error as { message?: string }).message)
              : 'Falha ao carregar competições.'}
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && competitions.length === 0 && (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-medium">
              Nenhuma competição cadastrada
            </h2>
            <p className="mt-2 text-slate-600">
              Crie a primeira competição para habilitar o switcher global.
            </p>
            <RoleGuard deny={['DESK', 'PUBLIC']}>
              <Link href="/competitions/new" className="mt-4 inline-block">
                <Button>Criar competição</Button>
              </Link>
            </RoleGuard>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        {competitions.map((competition) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            isActive={competition.id === activeCompetitionId}
            isSelected={competition.id === selectedCompetitionId}
            onSetActive={setActiveCompetitionId}
            onSelect={setSelectedCompetitionId}
          />
        ))}
      </section>

      {selectedCompetition && canManageUsers && (
        <CompetitionUsersPanel competition={selectedCompetition} />
      )}
    </div>
  );
}

function DashboardMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card className="rounded-xl border border-slate-200/70 p-0 shadow-none">
      <CardContent className="p-4">
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600">
          {icon}
        </div>
        <p className="text-3xl font-medium tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}
