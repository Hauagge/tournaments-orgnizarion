'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Shield, Users } from 'lucide-react';
import { TeamFormDrawer } from '@/features/teams/components/team-form-drawer';
import { TeamFormValues } from '@/features/teams/schemas/team-form-schema';
import { useCreateTeam, useTeams } from '@/features/teams/hooks/use-teams';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);

  const { toast } = useToast();
  const teamsQuery = useTeams(activeCompetitionId);
  const createMutation = useCreateTeam(activeCompetitionId);
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const filteredTeams = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    if (!normalizedQuery) {
      return teams;
    }

    return teams.filter((team) =>
      team.name.toLowerCase().includes(normalizedQuery),
    );
  }, [search, teams]);

  async function handleCreateTeam(values: TeamFormValues) {
    if (!activeCompetitionId) return;

    try {
      await createMutation.mutateAsync(values);
      setIsDrawerOpen(false);
      toast({
        title: 'Equipe criada',
        description: `${values.name} foi adicionada à competição.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar equipe',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Equipes
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Organize as equipes da competição ativa
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Cadastre equipes, acompanhe o total de atletas por time e abra o
            detalhe para gerenciar os membros.
          </p>
        </div>
        <Button
          onClick={() => setIsDrawerOpen(true)}
          disabled={!activeCompetitionId || !hasHydrated}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova equipe
        </Button>
      </header>

      {!hasHydrated && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competição ativa...
          </CardContent>
        </Card>
      )}

      {hasHydrated && !activeCompetitionId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-amber-900">
            Selecione uma competição no switcher superior para listar as
            equipes.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && (
        <>
          <Card className="p-0">
            <CardContent className="p-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar equipe por nome"
              />
            </CardContent>
          </Card>

          {teamsQuery.isLoading && (
            <Card>
              <CardContent className="p-6 text-slate-600">
                Carregando equipes...
              </CardContent>
            </Card>
          )}

          {teamsQuery.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">
                {teamsQuery.error instanceof Error
                  ? teamsQuery.error.message
                  : 'Falha ao carregar equipes.'}
              </CardContent>
            </Card>
          )}

          {!teamsQuery.isLoading && !teamsQuery.isError && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeams.length === 0 ? (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="p-8 text-center text-slate-500">
                    Nenhuma equipe encontrada para esta busca.
                  </CardContent>
                </Card>
              ) : (
                filteredTeams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <Card className="h-full border-slate-200 p-0 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-5 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <Shield className="h-5 w-5" />
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                            Equipe
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                            {team.name}
                          </h2>
                          <p className="text-sm text-slate-600">
                            Abra o detalhe para adicionar ou remover atletas.
                          </p>
                        </div>

                        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <Users className="h-4 w-4" />
                          <span>
                            {team.athleteCount}{' '}
                            {team.athleteCount === 1 ? 'atleta' : 'atletas'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}

      <TeamFormDrawer
        isOpen={isDrawerOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleCreateTeam}
      />
    </div>
  );
}
