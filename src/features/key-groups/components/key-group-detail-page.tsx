'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, Lock, Medal, Plus, Swords, Trophy } from 'lucide-react';
import { useAreas } from '@/features/areas/hooks/use-areas';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import {
  Athlete,
  getWeighInStatusLabel,
} from '@/features/athletes/types/athlete';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { FightFormDialog } from '@/features/fights/components/fight-form-dialog';
import { useCreateFight } from '@/features/fights/hooks/use-fights';
import {
  Fight,
  getFightRoundLabel,
  getFightStatusLabel,
} from '@/features/fights/types/fight';
import { KeyGroupBuilder } from '@/features/key-groups/components/key-group-builder';
import {
  useGenerateKeyGroupFights,
  useKeyGroup,
  useKeyGroups,
  useLockKeyGroup,
  useUpdateKeyGroup,
} from '@/features/key-groups/hooks/use-key-groups';
import { getKeyGroup } from '@/features/key-groups/api/key-groups-client';
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
  const [isFightFormOpen, setIsFightFormOpen] = useState(false);
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
  const areasQuery = useAreas(activeCompetitionId);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const updateMutation = useUpdateKeyGroup(activeCompetitionId, keyGroupId);
  const generateMutation = useGenerateKeyGroupFights(
    activeCompetitionId,
    keyGroupId,
  );
  const lockMutation = useLockKeyGroup(activeCompetitionId, keyGroupId);
  const createFightMutation = useCreateFight(activeCompetitionId);
  const { toast } = useToast();
  const maxGroupSize = competitionQuery.data?.maxGroupSize ?? 4;

  const keyGroup = keyGroupQuery.data;
  const persistedAthletes = keyGroup?.athletes ?? [];
  const fights = keyGroup?.fights ?? [];
  const isLocked = keyGroup?.locked ?? false;

  const allGroupDetailQueries = useQueries({
    queries: (allGroupsQuery.data ?? []).map((group) => ({
      queryKey: ['key-group-builder-detail', group.id],
      queryFn: () => getKeyGroup(group.id),
      enabled: Boolean(activeCompetitionId),
    })),
  });

  const resolvedGroups = useMemo(() => {
    return (allGroupsQuery.data ?? []).map((group, index) => {
      const detail = allGroupDetailQueries[index]?.data;
      return detail ?? group;
    });
  }, [allGroupDetailQueries, allGroupsQuery.data]);
  const isCompetitionReadinessLoading =
    allGroupsQuery.isLoading || allGroupDetailQueries.some((query) => query.isLoading);
  const hasCompetitionReadinessError =
    allGroupsQuery.isError || allGroupDetailQueries.some((query) => query.isError);

  useEffect(() => {
    setNameDraft(keyGroup?.name ?? '');
    setCategoryDraft(keyGroup?.categoryId ?? '');
    setAthletesDraft(keyGroup?.athletes ?? []);
  }, [keyGroup?.athletes, keyGroup?.categoryId, keyGroup?.name]);

  const athleteGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    resolvedGroups.forEach((group) => {
      group.athletes.forEach((athlete: Athlete) => {
        map.set(athlete.id, { groupId: group.id, groupName: group.name });
      });
    });
    return map;
  }, [resolvedGroups]);

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
  const athleteReadiness = useMemo(
    () => buildAthleteReadinessSummary(athletesDraft),
    [athletesDraft],
  );
  const competitionKeyGroupsReadiness = useMemo(() => {
    if (isCompetitionReadinessLoading || hasCompetitionReadinessError) {
      return null;
    }

    const incompleteGroups = resolvedGroups.filter((group) => group.athletes.length < 2).length;
    const groupsWithoutFights = resolvedGroups.filter(
      (group) => group.athletes.length >= 2 && group.fights.length === 0,
    ).length;

    return {
      totalGroups: resolvedGroups.length,
      incompleteGroups,
      groupsWithoutFights,
      groupsWithFights: resolvedGroups.filter((group) => group.fights.length > 0).length,
      canAdvanceToDistribution:
        resolvedGroups.length > 0 &&
        incompleteGroups === 0 &&
        groupsWithoutFights === 0,
    };
  }, [hasCompetitionReadinessError, isCompetitionReadinessLoading, resolvedGroups]);
  const keyGroupStatus = useMemo(() => {
    if (isLocked) {
      if (isCompetitionReadinessLoading) {
        return {
          label: 'Travada',
          description:
            'A chave foi finalizada. O sistema ainda está confirmando se o restante da competição já pode seguir para distribuição.',
          tone: 'locked' as const,
        };
      }

      if (hasCompetitionReadinessError || !competitionKeyGroupsReadiness) {
        return {
          label: 'Travada',
          description:
            'A chave foi finalizada, mas o estado global das outras chaves ainda não pôde ser confirmado.',
          tone: 'locked' as const,
        };
      }

      return {
        label: 'Travada',
        description:
          competitionKeyGroupsReadiness.canAdvanceToDistribution
            ? 'A chave foi finalizada e a competição já pode seguir para a distribuição das áreas.'
            : 'A chave foi finalizada, mas a competição ainda depende da revisão das outras chaves antes da distribuição.',
        tone: 'locked' as const,
      };
    }

    if (fights.length > 0) {
      return {
        label: 'Lutas geradas',
        description:
          'Os confrontos já existem. Revise as outras chaves antes de distribuir.',
        tone: 'generated' as const,
      };
    }

    return {
      label: 'Aberta',
      description:
        'A chave ainda está em montagem e precisa ser revisada antes da geração das lutas.',
      tone: 'open' as const,
    };
  }, [
    competitionKeyGroupsReadiness,
    fights.length,
    hasCompetitionReadinessError,
    isCompetitionReadinessLoading,
    isLocked,
  ]);
  const fightsGroupedByRound = useMemo(() => {
    const grouped = new Map<number, typeof fights>();

    fights.forEach((fight) => {
      const round = fight.round ?? 0;
      const current = grouped.get(round) ?? [];
      current.push(fight);
      grouped.set(round, current);
    });

    return Array.from(grouped.entries())
      .sort(([roundA], [roundB]) => roundA - roundB)
      .map(([round, items]) => ({
        round,
        label: getFightRoundLabel(round || null),
        fights: [...items].sort((fightA, fightB) => {
          const orderA = fightA.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = fightB.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        }),
      }));
  }, [fights]);

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
    if (athlete.weighInStatus !== 'APPROVED') {
      toast({
        title: 'Pesagem inválida para chave',
        description: `${athlete.name} está com pesagem ${athlete.weighInStatus === 'PENDING' ? 'pendente' : 'reprovada'} e não pode ser adicionado.`,
        variant: 'destructive',
      });
      return;
    }

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
    if (athleteReadiness.approvedAthletes < 2) {
      toast({
        title: 'Chave sem atletas aptos',
        description:
          'A chave precisa de pelo menos 2 atletas com pesagem aprovada para gerar lutas.',
        variant: 'warning',
      });
      return;
    }

    if (athleteReadiness.pendingWeighIn > 0) {
      toast({
        title: 'Finalize a pesagem da chave',
        description:
          `${athleteReadiness.pendingWeighIn} atleta(s) desta chave ainda estão com pesagem pendente.`,
        variant: 'warning',
      });
      return;
    }

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
        description:
          'Os confrontos foram atualizados e o servidor já disparou a distribuição incremental desta chave.',
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

  async function handleCreateManualFight(
    payload: Parameters<typeof createFightMutation.mutateAsync>[0],
  ) {
    try {
      await createFightMutation.mutateAsync(payload);
      setIsFightFormOpen(false);
      toast({
        title: 'Luta criada',
        description: 'A luta manual foi vinculada a esta chave.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar luta',
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
          <header className="rounded-3xl bg-white p-6 shadow-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Detalhe da chave
                </p>
                <div className="mt-3">
                  <StatusBadge tone={keyGroupStatus.tone}>
                    {keyGroupStatus.label}
                  </StatusBadge>
                </div>
                <h1 className="mt-2 text-4xl font-medium tracking-tight text-slate-950">
                  {keyGroup.name}
                </h1>
                <p className="mt-3 max-w-3xl text-slate-600">
                  Ajuste os atletas da chave, gere os confrontos todos contra
                  todos e trave quando a montagem estiver pronta. A distribuição de área agora é decidida no backend.
                </p>
                <p className="mt-2 max-w-3xl text-sm text-slate-700">
                  A chave pode existir antes do fim da pesagem global, mas só atletas com pesagem aprovada podem ser incluídos.
                </p>
                <p className="mt-2 max-w-3xl text-sm font-medium text-slate-700">
                  {keyGroupStatus.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => void handleGenerateFights()}
                  disabled={
                    isLocked ||
                    generateMutation.isPending ||
                    athletesDraft.length < 2 ||
                    athleteReadiness.pendingWeighIn > 0 ||
                    athleteReadiness.approvedAthletes < 2
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

          <Card className="border border-slate-900 p-0 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-medium tracking-tight text-slate-950">
                  Prontidão da chave para gerar lutas
                </h2>
                <p className="text-sm text-slate-600">
                  Gere os confrontos apenas quando os atletas desta chave já estiverem aptos para competir.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ReadinessMetric
                  label="Atletas na chave"
                  value={String(athleteReadiness.totalAthletes)}
                />
                <ReadinessMetric
                  label="Pesagem aprovada"
                  value={String(athleteReadiness.approvedAthletes)}
                  tone="success"
                />
                <ReadinessMetric
                  label="Pesagem pendente"
                  value={String(athleteReadiness.pendingWeighIn)}
                  tone={athleteReadiness.pendingWeighIn > 0 ? 'warning' : 'default'}
                />
                <ReadinessMetric
                  label="Pesagem reprovada"
                  value={String(athleteReadiness.rejectedWeighIn)}
                  tone={athleteReadiness.rejectedWeighIn > 0 ? 'warning' : 'default'}
                />
              </div>

              {athleteReadiness.approvedAthletes >= 2 &&
              athleteReadiness.pendingWeighIn === 0 ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
                  A chave está pronta para gerar lutas: há atletas suficientes, nenhuma pesagem pendente e o backend cuidará da distribuição incremental após a geração.
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  Finalize a preparação da chave antes de gerar lutas. O sistema só libera esta etapa quando houver pelo menos 2 atletas aprovados e nenhuma pesagem pendente.
                </div>
              )}
            </CardContent>
          </Card>

          {isLocked &&
          competitionKeyGroupsReadiness?.canAdvanceToDistribution ? (
            <Card className="border border-emerald-300 bg-emerald-50 p-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium tracking-tight text-emerald-950">
                    Chave pronta para a próxima etapa
                  </h2>
                  <p className="text-sm text-emerald-900">
                    Esta chave já foi travada. Você pode revisar a distribuição global ou seguir para a operação das áreas, conforme o estado atual das filas.
                  </p>
                </div>
                <Link href="/areas/distribution">
                  <Button className="w-full lg:w-auto">Revisar distribuição</Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLocked && isCompetitionReadinessLoading ? (
            <Card className="border border-slate-300 bg-slate-50 p-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium tracking-tight text-slate-950">
                    Confirmando a prontidão da competição
                  </h2>
                  <p className="text-sm text-slate-700">
                    Esta chave já foi travada. Aguarde a conferência das outras chaves antes de avançar para a distribuição.
                  </p>
                </div>
                <Link href="/key-groups">
                  <Button variant="outline" className="w-full lg:w-auto">
                    Voltar para chaves
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLocked && hasCompetitionReadinessError ? (
            <Card className="border border-red-300 bg-red-50 p-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium tracking-tight text-red-950">
                    Não foi possível confirmar o estado global
                  </h2>
                  <p className="text-sm text-red-900">
                    Esta chave já foi travada, mas o sistema não conseguiu validar as demais chaves da competição.
                  </p>
                </div>
                <Link href="/key-groups">
                  <Button variant="outline" className="w-full lg:w-auto">
                    Voltar para chaves
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : isLocked ? (
            <Card className="border border-amber-300 bg-amber-50 p-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium tracking-tight text-amber-950">
                    Continue revisando as outras chaves
                  </h2>
                  <p className="text-sm text-amber-900">
                    Esta chave já foi travada, mas a competição ainda tem {competitionKeyGroupsReadiness?.incompleteGroups ?? 0} chave(s) incompleta(s) e {competitionKeyGroupsReadiness?.groupsWithoutFights ?? 0} sem lutas geradas.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                  {competitionKeyGroupsReadiness?.groupsWithFights ? (
                    <Link href="/areas/distribution">
                      <Button className="w-full lg:w-auto">Distribuir o que já está pronto</Button>
                    </Link>
                  ) : null}
                  <Link href="/key-groups">
                    <Button variant="outline" className="w-full lg:w-auto">
                      Voltar para chaves
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : fights.length > 0 ? (
            <Card className="border border-slate-900 bg-slate-50 p-0 shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium tracking-tight text-slate-950">
                    Chave já pode entrar no fluxo de distribuição
                  </h2>
                  <p className="text-sm text-slate-700">
                    As lutas desta chave já foram geradas e enviadas para distribuição incremental no backend. Você pode revisar a distribuição agora, mesmo antes das demais chaves terminarem.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                  <Link href="/areas/distribution">
                    <Button className="w-full lg:w-auto">Revisar distribuição</Button>
                  </Link>
                  <Link href="/key-groups">
                    <Button variant="outline" className="w-full lg:w-auto">
                      Voltar para chaves
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_280px_auto] lg:items-end">
              <label className="block space-y-2">
                <span className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                  Nome da chave
                </span>
                <Input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  disabled={isLocked}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                  Categoria
                </span>
                <select
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  disabled={isLocked}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
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
            <Card className="border border-amber-900 bg-amber-50 p-0">
              <CardContent className="p-4 text-sm font-medium text-amber-950">
                Existem alterações locais não salvas na chave.
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden border border-slate-900 p-0">
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

          <Card className="overflow-hidden border border-slate-900 p-0">
            <div className="flex items-center justify-between gap-3 border-b-4 border-slate-900 bg-slate-100 px-5 py-4">
              <div className="text-sm font-medium text-slate-600">
                Visualização da chave
              </div>
              <Button
                type="button"
                onClick={() => setIsFightFormOpen(true)}
                disabled={ athletesDraft.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar luta manual
              </Button>
            </div>
            {fights.length === 0 ? (
              <CardContent className="p-6 text-slate-500">
                Nenhuma luta gerada ainda para esta chave.
              </CardContent>
            ) : (
              <div className="space-y-5 p-5">
                <BracketVisualization
                  keyGroupName={keyGroup.name}
                  categoryName={keyGroup.categoryName ?? categoryDraft}
                  areaName={fights[0]?.areaName || 'Área a definir'}
                  athletes={athletesDraft}
                  fights={fights}
                  rounds={fightsGroupedByRound}
                />
              </div>
            )}
          </Card>
        </>
      ) : null}

      <FightFormDialog
        isOpen={isFightFormOpen}
        onClose={() => setIsFightFormOpen(false)}
        onSubmit={(payload) => void handleCreateManualFight(payload)}
        athletes={athletesDraft}
        categories={(categoriesQuery.data ?? []).filter(
          (category) => category.id === categoryDraft,
        )}
        areas={(areasQuery.data ?? []).map((area) => ({
          id: area.id,
          name: area.name,
        }))}
        defaultCategoryId={categoryDraft || null}
        defaultKeyGroupId={keyGroupId}
        isSubmitting={createFightMutation.isPending}
      />

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
    <Card className={`border p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}

function ReadinessMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
      : tone === 'warning'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-slate-300 bg-slate-50 text-slate-950';

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'open' | 'generated' | 'locked';
  children: string;
}) {
  const className =
    tone === 'locked'
      ? 'border-slate-900 bg-slate-900 text-white'
      : tone === 'generated'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
        : 'border-amber-300 bg-amber-50 text-amber-950';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${className}`}
    >
      {children}
    </span>
  );
}

function BracketVisualization({
  keyGroupName,
  categoryName,
  areaName,
  athletes,
  fights,
  rounds,
}: {
  keyGroupName: string;
  categoryName: string;
  areaName: string;
  athletes: Athlete[];
  fights: Fight[];
  rounds: Array<{ round: number; label: string; fights: Fight[] }>;
}) {
  const contextBadges = [categoryName || keyGroupName, athletes[0]?.belt || 'Faixa a definir', areaName];

  if (athletes.length === 2) {
    return (
      <section className="space-y-4">
        <BracketHeader badges={contextBadges} text="Vence quem ganhar 2 de 3 lutas" />
        <div className="grid gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <FightCard
              key={index}
              title={`Luta ${index + 1}${index === 2 ? ' — decisiva' : ''}`}
              fight={fights[index]}
              disabled={index === 2 && !shouldShowDecisiveFight(fights)}
            />
          ))}
        </div>
        <InfoBanner tone="info">
          A luta decisiva é liberada automaticamente quando o placar ficar 1x1.
        </InfoBanner>
      </section>
    );
  }

  if (athletes.length === 3) {
    return (
      <section className="space-y-4">
        <BracketHeader badges={contextBadges} text="Todos lutam contra todos — 3 confrontos" />
        <div className="grid gap-3 lg:grid-cols-3">
          {fights.slice(0, 3).map((fight, index) => (
            <FightCard key={fight.id} title={`Confronto ${index + 1}`} fight={fight} />
          ))}
        </div>
        <RoundRobinTable athletes={athletes} fights={fights} />
        <InfoBanner tone="warning">
          Em empate, aplicar o critério configurado nas regras: pontuação interna e vantagens.
        </InfoBanner>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <BracketHeader badges={contextBadges} text="Próximas fases geradas automaticamente" />
      <div className="overflow-x-auto">
        <div className="flex min-w-[760px] gap-5">
          {rounds.map((round, roundIndex) => (
            <div key={round.label} className="w-64 shrink-0 space-y-3">
              <p className="font-medium text-slate-950">
                {roundIndex === rounds.length - 1 ? 'Final' : round.label}
              </p>
              {round.fights.map((fight) => (
                <div key={fight.id} className="relative">
                  <FightCard
                    title={`Luta ${fight.order ?? '-'}`}
                    fight={fight}
                    final={roundIndex === rounds.length - 1}
                  />
                  {roundIndex < rounds.length - 1 ? (
                    <svg className="absolute -right-5 top-1/2 h-8 w-5 -translate-y-1/2 text-slate-300" viewBox="0 0 20 32" aria-hidden="true">
                      <path d="M0 16H12C16 16 16 8 20 8M12 16C16 16 16 24 20 24" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <InfoBanner tone="success">
        Novas lutas são geradas automaticamente ao confirmar cada resultado.
      </InfoBanner>
    </section>
  );
}

function BracketHeader({ badges, text }: { badges: string[]; text: string }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
            {badge}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function FightCard({
  title,
  fight,
  disabled = false,
  final = false,
}: {
  title: string;
  fight?: Fight;
  disabled?: boolean;
  final?: boolean;
}) {
  const winnerId = fight?.winnerId;

  return (
    <div className={`rounded-xl border p-4 ${final ? 'border-blue-400 border' : 'border-slate-200'} ${disabled ? 'bg-slate-50 opacity-60' : 'bg-white'}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-medium text-slate-950">{title}</p>
        {final && winnerId ? <Trophy className="h-4 w-4 text-amber-500" /> : null}
      </div>
      <AthleteSlot name={fight?.athleteA?.name} active={winnerId === fight?.athleteA?.id} eliminated={Boolean(winnerId && winnerId !== fight?.athleteA?.id)} />
      <AthleteSlot name={fight?.athleteB?.name} active={winnerId === fight?.athleteB?.id} eliminated={Boolean(winnerId && winnerId !== fight?.athleteB?.id)} />
      <p className="mt-3 text-xs text-slate-500">
        {fight ? getFightStatusLabel(fight.status) : disabled ? 'Aguardando empate 1x1' : 'A definir'}
      </p>
    </div>
  );
}

function AthleteSlot({
  name,
  active,
  eliminated,
}: {
  name?: string;
  active: boolean;
  eliminated: boolean;
}) {
  return (
    <div className={`mt-2 rounded-lg border px-3 py-2 text-sm ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : eliminated ? 'border-slate-200 bg-slate-50 text-slate-400 line-through' : 'border-slate-200 bg-white text-slate-700'}`}>
      {active ? <Medal className="mr-2 inline h-4 w-4" /> : null}
      {name || <span className="italic">A definir</span>}
    </div>
  );
}

function RoundRobinTable({ athletes, fights }: { athletes: Athlete[]; fights: Fight[] }) {
  const rows = athletes.map((athlete) => {
    const wins = fights.filter((fight) => fight.winnerId === athlete.id).length;
    const losses = fights.filter((fight) => fight.loserId === athlete.id).length;
    return { athlete, wins, losses, points: wins * 3 };
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table className="rounded-none border-0">
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            <TableHead>Atleta</TableHead>
            <TableHead>Vitórias</TableHead>
            <TableHead>Derrotas</TableHead>
            <TableHead>Pontos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.athlete.id}>
              <TableCell className="font-medium">{row.athlete.name}</TableCell>
              <TableCell>{row.wins}</TableCell>
              <TableCell>{row.losses}</TableCell>
              <TableCell>{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InfoBanner({
  tone,
  children,
}: {
  tone: 'info' | 'success' | 'warning';
  children: ReactNode;
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-blue-200 bg-blue-50 text-blue-800';

  return <div className={`rounded-xl border p-4 text-sm ${className}`}>{children}</div>;
}

function shouldShowDecisiveFight(fights: Fight[]) {
  const firstTwo = fights.slice(0, 2);
  if (firstTwo.length < 2 || firstTwo.some((fight) => !fight.winnerId)) {
    return false;
  }

  return firstTwo[0].winnerId !== firstTwo[1].winnerId;
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full border border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-emerald-900';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full border border-red-900 bg-red-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-red-900';
  }

  return 'inline-flex rounded-full border border-amber-900 bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-amber-900';
}
