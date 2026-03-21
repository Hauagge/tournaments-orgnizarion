'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import {
  Athlete,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import {
  useAddAthleteToTeam,
  useRemoveAthleteFromTeam,
  useTeam,
} from '@/features/teams/hooks/use-teams';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import AlertDialog, {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alertDialog';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

type TeamDetailPageProps = {
  teamId: string;
};

export function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const [search, setSearch] = useState('');
  const [athleteToRemove, setAthleteToRemove] = useState<Athlete | null>(null);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { toast } = useToast();
  const teamQuery = useTeam(activeCompetitionId, teamId);
  const team = teamQuery.data;
  const teamAthletes = useMemo(() => team?.athletes ?? [], [team?.athletes]);
  const athleteSearchQuery = useAthletes(
    debouncedSearch.trim().length >= 2 ? activeCompetitionId : null,
    debouncedSearch.trim(),
  );
  const addAthleteMutation = useAddAthleteToTeam(activeCompetitionId, teamId);
  const removeAthleteMutation = useRemoveAthleteFromTeam(
    activeCompetitionId,
    teamId,
  );

  const suggestions = useMemo(() => {
    const athletes = athleteSearchQuery.data ?? [];
    const currentIds = new Set(teamAthletes.map((athlete) => athlete.id));

    return athletes.filter((athlete) => !currentIds.has(athlete.id));
  }, [athleteSearchQuery.data, teamAthletes]);

  async function handleAddAthlete(athlete: Athlete) {
    try {
      await addAthleteMutation.mutateAsync(athlete.id);
      setSearch('');
      toast({
        title: 'Atleta adicionado',
        description: `${athlete.name} agora faz parte de ${team?.name ?? 'a equipe'}.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao adicionar atleta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleConfirmRemove() {
    if (!athleteToRemove) return;

    try {
      await removeAthleteMutation.mutateAsync(athleteToRemove.id);
      toast({
        title: 'Atleta removido',
        description: `${athleteToRemove.name} foi removido da equipe.`,
        variant: 'success',
      });
      setAthleteToRemove(null);
    } catch (error) {
      toast({
        title: 'Falha ao remover atleta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para equipes
        </Link>
      </div>

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
            Selecione uma competição no switcher superior para visualizar a
            equipe.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && teamQuery.isLoading && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando equipe...
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && teamQuery.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">
            {teamQuery.error instanceof Error
              ? teamQuery.error.message
              : 'Falha ao carregar equipe.'}
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && !teamQuery.isLoading && !teamQuery.isError && !team && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-amber-900">
            Equipe não encontrada na competição ativa.
          </CardContent>
        </Card>
      )}

      {team && (
        <>
          <header className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Detalhe da equipe
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                  {team.name}
                </h1>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Adicione atletas pela busca e acompanhe o status de pesagem de
                  cada membro do time.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                <span>
                  {teamAthletes.length} {teamAthletes.length === 1 ? 'atleta' : 'atletas'}
                </span>
              </div>
            </div>
          </header>

          <Card className="overflow-visible">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Adicionar atleta
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Digite pelo menos 2 caracteres para buscar atletas da
                  competição ativa.
                </p>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar atleta por nome"
                  className="pl-9"
                />

                {debouncedSearch.trim().length >= 2 && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {athleteSearchQuery.isLoading ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Buscando atletas...
                      </div>
                    ) : athleteSearchQuery.isError ? (
                      <div className="px-4 py-3 text-sm text-red-600">
                        {athleteSearchQuery.error instanceof Error
                          ? athleteSearchQuery.error.message
                          : 'Falha ao buscar atletas.'}
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Nenhum atleta disponível para adicionar.
                      </div>
                    ) : (
                      suggestions.slice(0, 8).map((athlete) => (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => handleAddAthlete(athlete)}
                          disabled={addAthleteMutation.isPending}
                          className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {athlete.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {athlete.team || 'Sem equipe'} ·{' '}
                              {getWeighInStatusLabel(athlete.weighInStatus)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                            <UserPlus className="h-3.5 w-3.5" />
                            Adicionar
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead>Nome</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Peso declarado</TableHead>
                    <TableHead>Status pesagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamAthletes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                        Nenhum atleta cadastrado nesta equipe.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamAthletes.map((athlete) => (
                      <TableRow key={athlete.id}>
                        <TableCell className="font-medium">{athlete.name}</TableCell>
                        <TableCell>{athlete.belt || '-'}</TableCell>
                        <TableCell>
                          {athlete.age !== null ? `${athlete.age} anos` : '-'}
                        </TableCell>
                        <TableCell>
                          {athlete.declaredWeight !== null
                            ? `${athlete.declaredWeight} kg`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={statusBadgeClassName(athlete.weighInStatus)}>
                            {getWeighInStatusLabel(athlete.weighInStatus)}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setAthleteToRemove(athlete)}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <AlertDialog
        open={Boolean(athleteToRemove)}
        onOpenChange={(open) => {
          if (!open) setAthleteToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atleta da equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{athleteToRemove?.name}</strong> de{' '}
              <strong>{team?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAthleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removeAthleteMutation.isPending}
            >
              {removeAthleteMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function statusBadgeClassName(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700';
    case 'REJECTED':
      return 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700';
    default:
      return 'inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700';
  }
}
