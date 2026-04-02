'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Swords } from 'lucide-react';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import {
  Athlete,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import { KeyGroupBuilder } from '@/features/key-groups/components/key-group-builder';
import {
  useGenerateKeyGroupFights,
  useKeyGroup,
  useKeyGroups,
  useLockKeyGroup,
  useUpdateKeyGroup,
} from '@/features/key-groups/hooks/use-key-groups';
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

type KeyGroupDetailPageProps = {
  keyGroupId: string;
};

export default function KeyGroupDetailPage({
  keyGroupId,
}: KeyGroupDetailPageProps) {
  const [athleteToRemove, setAthleteToRemove] = useState<Athlete | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [athletesDraft, setAthletesDraft] = useState<Athlete[]>([]);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const keyGroupQuery = useKeyGroup(activeCompetitionId, keyGroupId);
  const allGroupsQuery = useKeyGroups(activeCompetitionId);
  const categoriesQuery = useCategories(activeCompetitionId);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const updateMutation = useUpdateKeyGroup(activeCompetitionId, keyGroupId);
  const generateMutation = useGenerateKeyGroupFights(
    activeCompetitionId,
    keyGroupId,
  );
  const lockMutation = useLockKeyGroup(activeCompetitionId, keyGroupId);
  const { toast } = useToast();
  const maxGroupSize = competitionQuery.data?.maxGroupSize ?? 4;

  const keyGroup = keyGroupQuery.data;
  const persistedAthletes = keyGroup?.athletes ?? [];
  const fights = keyGroup?.fights ?? [];
  const isLocked = keyGroup?.locked ?? false;

  useEffect(() => {
    setNameDraft(keyGroup?.name ?? '');
    setCategoryDraft(keyGroup?.categoryId ?? '');
    setAthletesDraft(keyGroup?.athletes ?? []);
  }, [keyGroup?.athletes, keyGroup?.categoryId, keyGroup?.name]);

  const athleteGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    (allGroupsQuery.data ?? []).forEach((group) => {
      group.athletes.forEach((athlete) => {
        map.set(athlete.id, { groupId: group.id, groupName: group.name });
      });
    });
    return map;
  }, [allGroupsQuery.data]);

  const hasUnsavedChanges = useMemo(() => {
    const persistedIds = persistedAthletes.map((athlete) => athlete.id).sort();
    const draftIds = athletesDraft.map((athlete) => athlete.id).sort();

    return (
      nameDraft !== (keyGroup?.name ?? '') ||
      categoryDraft !== (keyGroup?.categoryId ?? '') ||
      persistedIds.length !== draftIds.length ||
      persistedIds.some((id, index) => id !== draftIds[index])
    );
  }, [
    athletesDraft,
    categoryDraft,
    keyGroup?.categoryId,
    keyGroup?.name,
    nameDraft,
    persistedAthletes,
  ]);

  async function handleSaveKeyGroup() {
    if (!keyGroup) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name: nameDraft.trim() || undefined,
        categoryId: categoryDraft || null,
        athleteIds: athletesDraft.map((athlete) => Number(athlete.id)),
      });
      toast({
        title: 'Chave atualizada',
        description: 'Os dados e atletas da chave foram salvos.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao salvar chave',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleAddAthlete(athlete: Athlete) {
    const membership = athleteGroupMap.get(athlete.id);
    if (membership && membership.groupId !== keyGroupId) {
      toast({
        title: 'Atleta já vinculado',
        description: `${athlete.name} já está em ${membership.groupName}.`,
        variant: 'destructive',
      });
      return;
    }

    if (isLocked) {
      toast({
        title: 'Chave travada',
        description: 'Não é possível alterar atletas após travar a chave.',
        variant: 'warning',
      });
      return;
    }

    if (athletesDraft.length >= maxGroupSize) {
      toast({
        title: 'Chave completa',
        description: `A chave já possui ${maxGroupSize} atletas.`,
        variant: 'warning',
      });
      return;
    }

    setAthletesDraft((current) => {
      if (current.some((item) => item.id === athlete.id)) {
        return current;
      }
      console.log('Adicionando atleta à chave:', athlete);
      return [...current, athlete];
    });
  }

  async function handleConfirmRemove() {
    if (!athleteToRemove) {
      return;
    }

    setAthletesDraft((current) =>
      current.filter((athlete) => athlete.id !== athleteToRemove.id),
    );
    setAthleteToRemove(null);
  }

  async function handleGenerateFights() {
    if (athletesDraft.length < 2) {
      toast({
        title: 'Chave incompleta',
        description: 'Adicione pelo menos 2 atletas antes de gerar lutas.',
        variant: 'warning',
      });
      return;
    }

    if (hasUnsavedChanges) {
      toast({
        title: 'Salve a chave antes de gerar',
        description:
          'Existem alterações locais de atletas ou dados ainda não salvas.',
        variant: 'warning',
      });
      return;
    }

    try {
      await generateMutation.mutateAsync();
      toast({
        title: 'Lutas geradas',
        description: 'Os confrontos todos contra todos foram atualizados.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao gerar lutas',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleLock() {
    if (athletesDraft.length < 2) {
      toast({
        title: 'Chave incompleta',
        description: 'Adicione pelo menos 2 atletas antes de travar a chave.',
        variant: 'warning',
      });
      return;
    }

    if (hasUnsavedChanges) {
      toast({
        title: 'Salve a chave antes de travar',
        description:
          'Existem alterações locais de atletas ou dados ainda não salvas.',
        variant: 'warning',
      });
      return;
    }

    try {
      await lockMutation.mutateAsync();
      toast({
        title: 'Chave travada',
        description: 'A chave foi travada com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao travar chave',
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
          href="/key-groups"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para chaves
        </Link>
      </div>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId ? (
        <StateCard
          message="Selecione uma competição no switcher superior para visualizar a chave."
          tone="warning"
        />
      ) : null}

      {activeCompetitionId && keyGroupQuery.isLoading ? (
        <StateCard message="Carregando chave..." />
      ) : null}

      {activeCompetitionId && keyGroupQuery.isError ? (
        <StateCard
          message={
            keyGroupQuery.error instanceof Error
              ? keyGroupQuery.error.message
              : 'Falha ao carregar chave.'
          }
          tone="error"
        />
      ) : null}

      {activeCompetitionId &&
      !keyGroupQuery.isLoading &&
      !keyGroupQuery.isError &&
      !keyGroup ? (
        <StateCard
          message="Chave não encontrada na competição ativa."
          tone="warning"
        />
      ) : null}

      {keyGroup ? (
        <>
          <header className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Detalhe da chave
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                  {keyGroup.name}
                </h1>
                <p className="mt-3 max-w-3xl text-slate-600">
                  Ajuste os atletas da chave, gere os confrontos todos contra
                  todos e trave quando a montagem estiver pronta.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => void handleGenerateFights()}
                  disabled={
                    isLocked ||
                    generateMutation.isPending ||
                    athletesDraft.length < 2
                  }
                >
                  <Swords className="mr-2 h-4 w-4" />
                  {generateMutation.isPending ? 'Gerando...' : 'Gerar lutas'}
                </Button>
                <Button
                  onClick={() => void handleLock()}
                  disabled={
                    isLocked ||
                    lockMutation.isPending ||
                    athletesDraft.length < 2
                  }
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isLocked
                    ? 'Chave travada'
                    : lockMutation.isPending
                      ? 'Travando...'
                      : 'Travar chave'}
                </Button>
              </div>
            </div>
          </header>

          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_280px_auto] lg:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Nome da chave
                </span>
                <Input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  disabled={isLocked}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Categoria
                </span>
                <select
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  disabled={isLocked}
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Sem categoria</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                onClick={() => void handleSaveKeyGroup()}
                disabled={isLocked || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar chave'}
              </Button>
            </CardContent>
          </Card>

          {hasUnsavedChanges ? (
            <Card className="border-4 border-amber-900 bg-amber-50 p-0">
              <CardContent className="p-4 text-sm font-semibold text-amber-950">
                Existem alterações locais não salvas na chave.
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-4 border-slate-900 p-0">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead>Nome</TableHead>
                    <TableHead>Academia</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Status pesagem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {athletesDraft.map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">
                        {athlete.name}
                      </TableCell>
                      <TableCell>{athlete.academy || '-'}</TableCell>
                      <TableCell>{athlete.belt || '-'}</TableCell>
                      <TableCell>{athlete.age ?? '-'} anos</TableCell>
                      <TableCell>{athlete.declaredWeight ?? '-'} kg</TableCell>
                      <TableCell>
                        <span
                          className={statusBadgeClassName(
                            athlete.weighInStatus,
                          )}
                        >
                          {getWeighInStatusLabel(athlete.weighInStatus)}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="ghost"
                          disabled={isLocked}
                          onClick={() => setAthleteToRemove(athlete)}
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <KeyGroupBuilder
            competitionId={activeCompetitionId ?? ''}
            selectedAthletes={athletesDraft}
            athleteGroupMap={athleteGroupMap}
            maxSize={maxGroupSize}
            currentGroupId={keyGroup.id}
            isBusy={
              updateMutation.isPending ||
              generateMutation.isPending ||
              lockMutation.isPending
            }
            isLocked={isLocked}
            onAddAthlete={handleAddAthlete}
            onRemoveAthlete={(athleteId) => {
              const athlete = athletesDraft.find(
                (item) => item.id === athleteId,
              );
              if (athlete) {
                setAthleteToRemove(athlete);
              }
            }}
          />

          <Card className="overflow-hidden border-4 border-slate-900 p-0">
            <div className="border-b-4 border-slate-900 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-600">
              Lutas geradas
            </div>
            {fights.length === 0 ? (
              <CardContent className="p-6 text-slate-500">
                Nenhuma luta gerada ainda para esta chave.
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table className="rounded-none border-0">
                  <TableHeader className="bg-white">
                    <TableRow className="hover:bg-white">
                      <TableHead>Luta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fights.map((fight) => (
                      <TableRow key={fight.id}>
                        <TableCell className="font-medium">
                          {fight.athleteA?.name || 'A definir'} vs{' '}
                          {fight.athleteB?.name || 'A definir'}
                        </TableCell>
                        <TableCell>{fight.status}</TableCell>
                        <TableCell>{fight.areaName || '-'}</TableCell>
                        <TableCell>{fight.categoryName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      ) : null}

      <AlertDialog
        open={Boolean(athleteToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setAthleteToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atleta da chave</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover <strong>{athleteToRemove?.name}</strong> desta
              chave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>
              Remover
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
  tone?: 'default' | 'warning' | 'error';
}) {
  const toneClassName =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : tone === 'error'
        ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-slate-300 bg-white text-slate-600';

  return (
    <Card className={`border-4 p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full border-2 border-red-900 bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-900';
  }

  return 'inline-flex rounded-full border-2 border-amber-900 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900';
}
