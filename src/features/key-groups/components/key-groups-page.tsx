'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Boxes, FileDown } from 'lucide-react';
import { Athlete, getWeighInStatusLabel } from '@/features/athletes/types/athlete';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import {
  getBracketsPdfUrl,
  getKeyGroup,
  updateKeyGroup,
} from '@/features/key-groups/api/key-groups-client';
import { useKeyGroups } from '@/features/key-groups/hooks/use-key-groups';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

export default function KeyGroupsPage() {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [pendingRemoval, setPendingRemoval] = useState<{
    groupId: string;
    groupName: string;
    athlete: Athlete;
    athleteIds: number[];
    categoryId: string | null;
  } | null>(null);
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const keyGroupsQuery = useKeyGroups(activeCompetitionId);
  const categoriesQuery = useCategories(activeCompetitionId);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const keyGroups = keyGroupsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const maxGroupSize = competitionQuery.data?.maxGroupSize ?? 4;

  const filteredKeyGroups = useMemo(() => {
    return keyGroups.filter(
      (group) => categoryFilter === 'ALL' || group.categoryId === categoryFilter,
    );
  }, [categoryFilter, keyGroups]);

  const detailQueries = useQueries({
    queries: filteredKeyGroups.map((group) => ({
      queryKey: ['key-group-list-detail', group.id],
      queryFn: () => getKeyGroup(group.id),
      enabled: Boolean(activeCompetitionId) && group.athletes.length === 0,
    })),
  });

  const displayGroups = useMemo(() => {
    return filteredKeyGroups.map((group, index) => {
      const detail = detailQueries[index]?.data;
      return group.athletes.length > 0 ? group : detail ?? group;
    });
  }, [detailQueries, filteredKeyGroups]);

  const removeAthleteMutation = useMutation({
    mutationFn: ({
      groupId,
      athleteIds,
      categoryId,
      groupName,
    }: {
      groupId: string;
      athleteIds: number[];
      categoryId: string | null;
      groupName: string;
    }) =>
      updateKeyGroup(groupId, {
        name: groupName,
        categoryId,
        athleteIds,
      }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['key-groups', activeCompetitionId] }),
        queryClient.invalidateQueries({
          queryKey: ['key-groups', activeCompetitionId, variables.groupId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['key-group-list-detail', variables.groupId],
        }),
      ]);

      setPendingRemoval(null);
      toast({
        title: 'Atleta removido',
        description: 'A chave foi atualizada com sucesso.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao remover atleta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  function handleRequestRemove(groupId: string, athlete: Athlete) {
    const group = displayGroups.find((item) => item.id === groupId);

    if (!group || group.locked) {
      return;
    }

    setPendingRemoval({
      groupId: group.id,
      groupName: group.name,
      athlete,
      categoryId: group.categoryId,
      athleteIds: group.athletes
        .filter((item) => item.id !== athlete.id)
        .map((item) => Number(item.id)),
    });
  }

  function handleConfirmRemove() {
    if (!pendingRemoval) {
      return;
    }

    removeAthleteMutation.mutate({
      groupId: pendingRemoval.groupId,
      groupName: pendingRemoval.groupName,
      categoryId: pendingRemoval.categoryId,
      athleteIds: pendingRemoval.athleteIds,
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Chaves
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Monte chaves com até {maxGroupSize} atletas
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Crie grupos ao vivo, filtre por categoria, acompanhe os atletas
            vinculados e exporte o PDF das chaves da competição ativa.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={!activeCompetitionId || !hasHydrated}
            onClick={() => {
              if (activeCompetitionId) {
                window.open(
                  getBracketsPdfUrl(activeCompetitionId),
                  '_blank',
                  'noopener,noreferrer',
                );
              }
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF das chaves
          </Button>
          <Link href="/key-groups/new">
            <Button disabled={!activeCompetitionId || !hasHydrated}>Nova chave</Button>
          </Link>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId ? (
        <StateCard
          message="Selecione uma competição no switcher superior para listar as chaves."
          tone="warning"
        />
      ) : null}

      {activeCompetitionId ? (
        <Card className="border-4 border-slate-900 p-0">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[280px_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                Categoria
              </span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
              >
                <option value="ALL">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {activeCompetitionId && keyGroupsQuery.isLoading ? (
        <StateCard message="Carregando chaves..." />
      ) : null}

      {activeCompetitionId && keyGroupsQuery.isError ? (
        <StateCard
          message={
            keyGroupsQuery.error instanceof Error
              ? keyGroupsQuery.error.message
              : 'Falha ao carregar chaves.'
          }
          tone="error"
        />
      ) : null}

      {activeCompetitionId &&
      !keyGroupsQuery.isLoading &&
      !keyGroupsQuery.isError &&
      displayGroups.length === 0 ? (
        <StateCard
          message="Nenhuma chave cadastrada para esta competição."
          tone="empty"
        />
      ) : null}

      {activeCompetitionId &&
      !keyGroupsQuery.isLoading &&
      !keyGroupsQuery.isError &&
      displayGroups.length > 0 ? (
        <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
          <div className="overflow-x-auto">
            <Table className="rounded-none border-0">
              <TableHeader className="bg-slate-100">
                <TableRow className="hover:bg-slate-100">
                  <TableHead>Chave</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Atletas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayGroups.map((group) => (
                  <TableRow key={group.id} className="cursor-pointer hover:bg-amber-50">
                    <TableCell className="font-semibold">
                      <Link href={`/key-groups/${group.id}`} className="flex items-center gap-3">
                        <Boxes className="h-4 w-4" />
                        <span>{group.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{group.categoryName || 'Sem categoria'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {group.athletes.map((athlete) => (
                          <div
                            key={athlete.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <p>{athlete.name}</p>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              disabled={group.locked || removeAthleteMutation.isPending}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleRequestRemove(group.id, athlete);
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={
                            group.locked ? lockedBadgeClassName() : draftBadgeClassName()
                          }
                        >
                          {group.locked ? 'Travada' : 'Aberta'}
                        </span>
                        {group.athletes.map((athlete) => (
                          <span
                            key={athlete.id}
                            className={statusBadgeClassName(athlete.weighInStatus)}
                          >
                            {athlete.name.split(' ')[0]}:{' '}
                            {getWeighInStatusLabel(athlete.weighInStatus)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <Link href={`/key-groups/${group.id}`}>
                        <Button variant="outline">Abrir</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <AlertDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => {
          if (!open && !removeAthleteMutation.isPending) {
            setPendingRemoval(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atleta da chave</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{pendingRemoval?.athlete.name}</strong> da chave{' '}
              <strong>{pendingRemoval?.groupName}</strong>?
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

function StateCard({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'warning' | 'error' | 'empty';
}) {
  const toneClassName =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : tone === 'error'
        ? 'border-red-300 bg-red-50 text-red-700'
        : tone === 'empty'
          ? 'border-slate-300 bg-slate-50 text-slate-600'
          : 'border-slate-300 bg-white text-slate-600';

  return (
    <Card className={`border-4 p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-900';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full border-2 border-red-900 bg-red-100 px-2 py-1 text-xs font-black text-red-900';
  }

  return 'inline-flex rounded-full border-2 border-amber-900 bg-amber-100 px-2 py-1 text-xs font-black text-amber-900';
}

function lockedBadgeClassName() {
  return 'inline-flex rounded-full border-2 border-slate-900 bg-slate-900 px-2 py-1 text-xs font-black text-white';
}

function draftBadgeClassName() {
  return 'inline-flex rounded-full border-2 border-slate-400 bg-white px-2 py-1 text-xs font-black text-slate-700';
}
