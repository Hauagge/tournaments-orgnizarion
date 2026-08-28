'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Filter,
  GripVertical,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Save,
  Trophy,
} from 'lucide-react';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { useAreas } from '@/features/areas/hooks/use-areas';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { getCompetitionEntry } from '@/features/competitions/lib/competition-flow';
import { FightFormDialog } from '@/features/fights/components/fight-form-dialog';
import { FightScoreboardDialog } from '@/features/fights/components/fight-scoreboard-dialog';
import { FightsByAreaPdfButton } from '@/features/fights/components/fights-by-area-pdf-button';
import {
  buildFightOrderItems,
  canPersistFightOrder,
  moveFightBeforeVisibleTarget,
  moveFightToEndOfVisibleList,
  sortFightsByOrder,
} from '@/features/fights/lib/reorder-fights';
import {
  useCreateFight,
  useFinishFight,
  useFights,
  useStartFight,
  useUpdateFight,
  useUpdateFightOrder,
} from '@/features/fights/hooks/use-fights';
import {
  Fight,
  FightStatus,
  getFightRoundLabel,
  getFightStatusBadgeClassName,
  getFightStatusLabel,
  resolveFightWinnerName,
} from '@/features/fights/types/fight';
import { getWeighInStatusLabel } from '@/features/athletes/types/athlete';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';
import { useCompetitionSocket } from '@/hooks/useCompetitionSocket';
import { clearAreaScoreboardState } from '@/features/fights/lib/scoreboard-sync';

const winTypeOptions = [
  'POINTS',
  'SUBMISSION',
  'WO',
  'DISQUALIFICATION',
  'REFEREE_DECISION',
] as const;

function getWinTypeLabel(winType: string) {
  switch (winType) {
    case 'POINTS':
      return 'Pontos';
    case 'SUBMISSION':
      return 'Finalização';
    case 'WO':
      return 'W.O.';
    case 'DISQUALIFICATION':
      return 'Desclassificação';
    case 'REFEREE_DECISION':
      return 'Decisão do árbitro';
    default:
      return winType || '-';
  }
}

function getCompactFightStatusBadgeClassName(status: Fight['status']) {
  switch (status) {
    case 'CALLED':
      return 'inline-flex rounded-full border border-violet-900 bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-violet-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
    case 'IN_PROGRESS':
      return 'inline-flex rounded-full border border-blue-900 bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-blue-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
    case 'FINISHED':
      return 'inline-flex rounded-full border border-emerald-900 bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
    default:
      return 'inline-flex rounded-full border border-amber-900 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
  }
}

export default function FightsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FightStatus>('ALL');
  const [roundFilter, setRoundFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [finishFightId, setFinishFightId] = useState<string | null>(null);
  const [fightFormMode, setFightFormMode] = useState<'create' | 'edit'>('create');
  const [fightFormFightId, setFightFormFightId] = useState<string | null>(null);
  const [finishPreset, setFinishPreset] = useState<{
    fightId: string;
    winnerId: string;
    winType: (typeof winTypeOptions)[number];
  } | null>(null);
  const [scoreboardFightId, setScoreboardFightId] = useState<string | null>(null);
  const [scoreboardAutoStartToken, setScoreboardAutoStartToken] = useState(0);
  const [winnerId, setWinnerId] = useState('');
  const [winType, setWinType] =
    useState<(typeof winTypeOptions)[number]>('POINTS');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [draftOrderedFights, setDraftOrderedFights] = useState<Fight[]>([]);
  const [hasPendingOrderChanges, setHasPendingOrderChanges] = useState(false);
  const [draggedFightId, setDraggedFightId] = useState<string | null>(null);
  const [dragOverFightId, setDragOverFightId] = useState<string | null>(null);

  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const athletesQuery = useAthletes(activeCompetitionId, '');
  const areasQuery = useAreas(activeCompetitionId);
  const categoriesQuery = useCategories(activeCompetitionId);
  useCompetitionSocket({
    token,
    competitionId: activeCompetitionId,
  });
  const fightsQuery = useFights(activeCompetitionId);
  const createFightMutation = useCreateFight(activeCompetitionId);
  const startMutation = useStartFight(activeCompetitionId);
  const finishMutation = useFinishFight(activeCompetitionId);
  const updateFightMutation = useUpdateFight(activeCompetitionId);
  const updateFightOrderMutation = useUpdateFightOrder(activeCompetitionId);
  const { toast } = useToast();

  const fights = useMemo(
    () => sortFightsByOrder(fightsQuery.data ?? []),
    [fightsQuery.data],
  );
  useEffect(() => {
    if (!hasPendingOrderChanges) {
      setDraftOrderedFights(fights);
    }
  }, [fights, hasPendingOrderChanges]);

  const orderedFights = hasPendingOrderChanges ? draftOrderedFights : fights;
  const areasWithActiveFight = useMemo(() => {
    const areaIds = new Set<string>();
    for (const fight of fights) {
      if (fight.status === 'IN_PROGRESS' && fight.areaId) {
        areaIds.add(fight.areaId);
      }
    }
    return areaIds;
  }, [fights]);
  const selectedFight = useMemo(
    () => orderedFights.find((fight) => fight.id === selectedFightId) ?? null,
    [orderedFights, selectedFightId],
  );
  const fightToFinish = useMemo(
    () => orderedFights.find((fight) => fight.id === finishFightId) ?? null,
    [orderedFights, finishFightId],
  );
  const scoreboardFight = useMemo(
    () => orderedFights.find((fight) => fight.id === scoreboardFightId) ?? null,
    [orderedFights, scoreboardFightId],
  );
  const editingFight = useMemo(
    () => orderedFights.find((fight) => fight.id === fightFormFightId) ?? null,
    [fightFormFightId, orderedFights],
  );

  useEffect(() => {
    if (!fightToFinish) {
      setWinnerId('');
      setWinType('POINTS');
      return;
    }

    if (finishPreset && finishPreset.fightId === fightToFinish.id) {
      setWinnerId(finishPreset.winnerId);
      setWinType(finishPreset.winType);
      return;
    }

    const firstAvailableWinner =
      fightToFinish.athleteA?.id ?? fightToFinish.athleteB?.id ?? '';
    setWinnerId(firstAvailableWinner);
    setWinType('POINTS');
  }, [fightToFinish, finishPreset]);

  useEffect(() => {
    setCurrentTime(new Date());

    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const areaOptions = useMemo(() => {
    const uniqueAreas = new Map<string, string>();

    (areasQuery.data ?? []).forEach((area) => {
      uniqueAreas.set(area.id, area.name);
    });

    orderedFights.forEach((fight) => {
      const key = fight.areaId ?? fight.areaName;
      if (key && fight.areaName) {
        uniqueAreas.set(key, fight.areaName);
      }
    });

    return Array.from(uniqueAreas.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [areasQuery.data, orderedFights]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = new Map<string, string>();

    (categoriesQuery.data ?? []).forEach((category) => {
      uniqueCategories.set(category.id, category.name);
    });

    orderedFights.forEach((fight) => {
      const key = fight.categoryId ?? fight.categoryName;
      if (key && fight.categoryName) {
        uniqueCategories.set(key, fight.categoryName);
      }
    });

    return Array.from(uniqueCategories.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [categoriesQuery.data, orderedFights]);

  const roundOptions = useMemo(() => {
    return Array.from(
      new Set(
        orderedFights
          .map((fight) => fight.round)
          .filter((round): round is number => typeof round === 'number'),
      ),
    ).sort((roundA, roundB) => roundA - roundB);
  }, [orderedFights]);

  const filteredFights = useMemo(() => {
    return orderedFights.filter((fight) => {
      const fightAreaKey = fight.areaId ?? fight.areaName;
      const matchesArea = areaFilter === 'ALL' || fightAreaKey === areaFilter;
      const fightCategoryKey = fight.categoryId ?? fight.categoryName;
      const matchesCategory =
        categoryFilter === 'ALL' || fightCategoryKey === categoryFilter;
      const matchesStatus =
        statusFilter === 'ALL' || fight.status === statusFilter;
      const matchesRound =
        roundFilter === 'ALL' || String(fight.round ?? '') === roundFilter;
      const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
      const haystack = [
        fight.athleteA?.name,
        fight.athleteB?.name,
        fight.winner?.name,
        fight.categoryName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      const matchesSearch =
        normalizedSearch.length === 0 || haystack.includes(normalizedSearch);

      return (
        matchesArea &&
        matchesCategory &&
        matchesStatus &&
        matchesRound &&
        matchesSearch
      );
    });
  }, [
    areaFilter,
    categoryFilter,
    orderedFights,
    roundFilter,
    searchTerm,
    statusFilter,
  ]);

  const visibleFightIds = useMemo(
    () => filteredFights.map((fight) => fight.id),
    [filteredFights],
  );

  const inProgressFights = useMemo(
    () => filteredFights.filter((fight) => fight.status === 'IN_PROGRESS'),
    [filteredFights],
  );

  const upcomingFights = useMemo(() => {
    return filteredFights.filter(
      (fight) => fight.status === 'PENDING' || fight.status === 'CALLED',
    );
  }, [filteredFights]);
  const unassignedFights = useMemo(
    () => orderedFights.filter((fight) => !fight.areaId),
    [orderedFights],
  );
  const canSaveFightOrder =
    hasPendingOrderChanges &&
    orderedFights.length > 0 &&
    canPersistFightOrder(orderedFights) &&
    !updateFightOrderMutation.isPending;
  const readiness = athletesQuery.data
    ? buildAthleteReadinessSummary(athletesQuery.data)
    : null;
  const flowEntry = competitionQuery.data
    ? getCompetitionEntry(competitionQuery.data.mode, readiness)
    : null;
  const contextualNextStep = useMemo(() => {
    if (orderedFights.length === 0) {
      if (!flowEntry) {
        return {
          href: null,
          label: '',
          title: 'Carregando a etapa correta da competição.',
          description:
            'Aguarde a identificação do tipo da competição antes de seguir para a geração das lutas.',
        };
      }

      return {
        href: flowEntry.href,
        label: flowEntry.label,
        title: 'A competição ainda não tem lutas geradas.',
        description:
          'Volte para a etapa correta do fluxo e gere os confrontos antes de operar as áreas.',
      };
    }

    if (unassignedFights.length > 0) {
      return {
        href: '/areas/distribution',
        label: 'Distribuição manual',
        title: 'Existem lutas sem área definida.',
        description:
          `${unassignedFights.length} luta(s) ainda não receberam área. Use a distribuição manual.`,
      };
    }

    return null;
  }, [flowEntry, orderedFights.length, unassignedFights.length]);

  async function handleStartFight(fightId: string) {
    try {
      await startMutation.mutateAsync(fightId);
      setScoreboardFightId(fightId);
      setScoreboardAutoStartToken(Date.now());
      toast({
        title: 'Luta iniciada',
        description: 'O status da luta foi atualizado.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao iniciar luta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleSubmitFightForm(
    payload: Parameters<typeof createFightMutation.mutateAsync>[0],
  ) {
    try {
      if (fightFormMode === 'edit' && editingFight) {
        await updateFightMutation.mutateAsync({
          fightId: editingFight.id,
          payload,
        });
        toast({
          title: 'Luta atualizada',
          description: 'Os dados da luta foram salvos com sucesso.',
          variant: 'success',
        });
      } else {
        await createFightMutation.mutateAsync(payload);
        toast({
          title: 'Luta criada',
          description: 'A luta manual foi adicionada à chave.',
          variant: 'success',
        });
      }

      setFightFormFightId(null);
    } catch (error) {
      toast({
        title: 'Falha ao salvar luta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleFinishFight() {
    if (!fightToFinish || !winnerId) {
      return;
    }

    const hasSingleAthlete =
      Boolean(fightToFinish.athleteA) !== Boolean(fightToFinish.athleteB);
    if (hasSingleAthlete && winType !== 'WO') {
      toast({
        title: 'Resultado inválido',
        description:
          'Lutas com apenas um atleta só podem ser finalizadas como W.O.',
        variant: 'warning',
      });
      return;
    }

    const allowOverride =
      fightToFinish.status === 'FINISHED'
        ? window.confirm(
            'Esta luta já está finalizada. Confirma a troca de vencedor e a atualização da progressão da chave?',
          )
        : false;

    if (fightToFinish.status === 'FINISHED' && !allowOverride) {
      return;
    }

    try {
      const finishedFightAreaId = fightToFinish.areaId;
      await finishMutation.mutateAsync({
        fightId: fightToFinish.id,
        payload: { winnerId, winType, allowOverride },
      });
      if (finishedFightAreaId) {
        clearAreaScoreboardState(finishedFightAreaId);
      }
      setFinishPreset(null);
      setFinishFightId(null);
      toast({
        title: 'Luta finalizada',
        description: 'Resultado salvo com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao finalizar luta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  function handleSubmissionFinishSelection(fightId: string, selectedWinnerId: string) {
    setFinishPreset({
      fightId,
      winnerId: selectedWinnerId,
      winType: 'SUBMISSION',
    });
    setScoreboardFightId(null);
    setFinishFightId(fightId);
  }

  function handleDragStartFight(fightId: string) {
    if (updateFightOrderMutation.isPending) {
      return;
    }

    setDraggedFightId(fightId);
    setDragOverFightId(fightId);
  }

  function handleDragEnterFight(targetFightId: string) {
    if (!draggedFightId || draggedFightId === targetFightId) {
      return;
    }

    setDragOverFightId(targetFightId);
  }

  function handleDragEndFight() {
    setDraggedFightId(null);
    setDragOverFightId(null);
  }

  function handleDropFight(targetFightId: string) {
    if (!draggedFightId || updateFightOrderMutation.isPending) {
      handleDragEndFight();
      return;
    }

    const nextOrder = moveFightBeforeVisibleTarget(
      orderedFights,
      visibleFightIds,
      draggedFightId,
      targetFightId,
    );

    if (nextOrder !== orderedFights) {
      setDraftOrderedFights(nextOrder);
      setHasPendingOrderChanges(true);
    }

    handleDragEndFight();
  }

  function handleDropAtEnd() {
    if (!draggedFightId || updateFightOrderMutation.isPending) {
      handleDragEndFight();
      return;
    }

    const nextOrder = moveFightToEndOfVisibleList(
      orderedFights,
      visibleFightIds,
      draggedFightId,
    );

    if (nextOrder !== orderedFights) {
      setDraftOrderedFights(nextOrder);
      setHasPendingOrderChanges(true);
    }

    handleDragEndFight();
  }

  function handleResetFightOrder() {
    setDraftOrderedFights(fights);
    setHasPendingOrderChanges(false);
    handleDragEndFight();
  }

  async function handleSaveFightOrder() {
    if (!activeCompetitionId || !canSaveFightOrder) {
      return;
    }

    const previousServerOrder = fights;

    try {
      await updateFightOrderMutation.mutateAsync({
        items: buildFightOrderItems(orderedFights),
      });
      setHasPendingOrderChanges(false);
      toast({
        title: 'Ordem atualizada',
        description: 'A sequência das lutas foi salva com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      setDraftOrderedFights(previousServerOrder);
      setHasPendingOrderChanges(false);
      toast({
        title: 'Falha ao atualizar ordem',
        description:
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : 'Não foi possível atualizar a ordem das lutas. Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Lutas
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Acompanhe lutas em andamento e próximas chamadas
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Monitore o que está acontecendo agora, veja a sequência das
              próximas lutas e opere resultados sem sair da tela.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <FightsByAreaPdfButton
              competitionId={activeCompetitionId}
              disabled={!hasHydrated}
            />
            <div className="rounded-2xl border-4 border-slate-900 bg-amber-100 px-5 py-3 text-right">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Agora
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {currentTime
                  ? currentTime.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '--:--:--'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competição no topo para listar as lutas."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <>
          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.7fr))_auto]">
                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    <Search className="h-4 w-4" />
                    Pesquisar por atleta ou categoria
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Ex.: João, Adulto Leve"
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    <Filter className="h-4 w-4" />
                    Categoria
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                  >
                    <option value="ALL">Todas</option>
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as 'ALL' | FightStatus)
                    }
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                  >
                    <option value="ALL">Todos</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CALLED">Chamada</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="FINISHED">Finalizada</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Rodada
                  </span>
                  <select
                    value={roundFilter}
                    onChange={(event) => setRoundFilter(event.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                  >
                    <option value="ALL">Todas</option>
                    {roundOptions.map((round) => (
                      <option key={round} value={String(round)}>
                        {getFightRoundLabel(round)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Área
                  </span>
                  <select
                    value={areaFilter}
                    onChange={(event) => setAreaFilter(event.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
                  >
                    <option value="ALL">Todas</option>
                    {areaOptions.map((area) => (
                      <option key={area.value} value={area.value}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-11 w-full"
                    onClick={() => {
                      setFightFormMode('create');
                      setFightFormFightId('NEW');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar luta manual
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <MetricTile
                  label="Em andamento"
                  value={String(inProgressFights.length)}
                  tone="live"
                />
                <MetricTile
                  label="Pendentes"
                  value={String(upcomingFights.length)}
                  tone="upcoming"
                />
                <MetricTile
                  label="Sem área"
                  value={String(unassignedFights.length)}
                  tone={unassignedFights.length > 0 ? 'warning' : 'default'}
                />
                <MetricTile
                  label="Filtradas"
                  value={String(filteredFights.length)}
                />
              </div>
            </CardContent>
          </Card>

          {!fightsQuery.isLoading && !fightsQuery.isError && orderedFights.length > 0 && (
            <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Ordenação manual
                  </p>
                  <p className="text-sm text-slate-700">
                    Arraste as linhas na tabela para reordenar a sequência visível. Ao salvar, o front envia a lista completa com <code>fightId</code> e <code>orderIndex</code>.
                  </p>
                  {!canPersistFightOrder(orderedFights) ? (
                    <p className="text-sm text-red-700">
                      Esta listagem possui luta com identificador inválido para persistência da ordem.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetFightOrder}
                    disabled={!hasPendingOrderChanges || updateFightOrderMutation.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Desfazer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSaveFightOrder()}
                    disabled={!canSaveFightOrder}
                    className="h-12 rounded-2xl border-4 border-slate-900 bg-slate-900 px-5 text-sm font-black uppercase tracking-[0.12em] hover:bg-slate-800"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateFightOrderMutation.isPending ? 'Salvando ordem...' : 'Salvar ordem'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {contextualNextStep ? (
            <Card className="border-4 border-amber-300 bg-amber-50 p-0 shadow-[6px_6px_0_0_rgba(120,53,15,0.14)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-900">
                    Próxima ação recomendada
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {contextualNextStep.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-700">
                    {contextualNextStep.description}
                  </p>
                </div>

                {contextualNextStep.href ? (
                  <Link href={contextualNextStep.href}>
                    <Button className="h-12 rounded-2xl border-4 border-slate-900 bg-slate-900 px-5 text-sm font-black uppercase tracking-[0.12em] hover:bg-slate-800">
                      {contextualNextStep.label}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    disabled
                    className="h-12 rounded-2xl border-4 border-slate-300 bg-slate-200 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-500"
                  >
                    Aguarde
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-4 border-emerald-300 bg-emerald-50 p-0 shadow-[6px_6px_0_0_rgba(6,95,70,0.12)]">
              <CardContent className="p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-900">
                  Operação liberada
                </p>
                <p className="mt-2 text-sm text-emerald-950">
                  As lutas já estão geradas e distribuídas. A tela pode permanecer focada em monitoramento e operação.
                </p>
              </CardContent>
            </Card>
          )}

          {fightsQuery.isLoading && <StateCard message="Carregando lutas..." />}

          {fightsQuery.isError && (
            <StateCard
              message={
                fightsQuery.error instanceof Error
                  ? fightsQuery.error.message
                  : 'Falha ao carregar lutas.'
              }
              tone="error"
            />
          )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            orderedFights.length === 0 && (
              <StateCard
                message="Nenhuma luta encontrada para a competição ativa."
                tone="empty"
              />
            )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            orderedFights.length > 0 &&
            filteredFights.length === 0 && (
              <StateCard
                message="Nenhuma luta corresponde aos filtros selecionados."
                tone="empty"
              />
            )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            filteredFights.length > 0 && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-2xl font-black text-slate-950">
                      Lutas em andamento
                    </h2>
                  </div>

                  {inProgressFights.length === 0 ? (
                    <StateCard
                      message="Nenhuma luta em andamento no momento."
                      tone="empty"
                    />
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {inProgressFights.map((fight) => (
                        <LiveFightCard
                          key={fight.id}
                          fight={fight}
                          isStarting={startMutation.isPending}
                          isFinishing={finishMutation.isPending}
                          onOpen={() => setSelectedFightId(fight.id)}
                          onStart={handleStartFight}
                          onFinish={(fightId) => setFinishFightId(fightId)}
                          onOpenScoreboard={(fightId) =>
                            setScoreboardFightId(fightId)
                          }
                          onEdit={(fightId) => {
                            setFightFormMode('edit');
                            setFightFormFightId(fightId);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-sky-500" />
                    <h2 className="text-2xl font-black text-slate-950">
                      Próximas lutas
                    </h2>
                  </div>

                  {upcomingFights.length === 0 ? (
                    <StateCard
                      message="Nenhuma luta pendente para a sequência atual."
                      tone="empty"
                    />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {upcomingFights.map((fight) => (
                        <UpcomingFightCard
                          key={fight.id}
                          fight={fight}
                          isStarting={startMutation.isPending}
                          isFinishing={finishMutation.isPending}
                          isAreaBusy={Boolean(
                            fight.areaId && areasWithActiveFight.has(fight.areaId),
                          )}
                          onOpen={() => setSelectedFightId(fight.id)}
                          onStart={handleStartFight}
                          onFinish={(fightId) => setFinishFightId(fightId)}
                          onOpenScoreboard={(fightId) =>
                            setScoreboardFightId(fightId)
                          }
                          onEdit={(fightId) => {
                            setFightFormMode('edit');
                            setFightFormFightId(fightId);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <div className="grid gap-3 md:hidden">
                  {filteredFights.map((fight) => (
                    <Card
                      key={fight.id}
                      className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]"
                    >
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedFightId(fight.id)}
                            className="text-left text-sm font-semibold leading-5 text-slate-950 underline-offset-4 hover:underline"
                          >
                            {fight.athleteA?.name || 'A definir'} vs {fight.athleteB?.name || 'A definir'}
                          </button>
                          <span className={getCompactFightStatusBadgeClassName(fight.status)}>
                            {getFightStatusLabel(fight.status)}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                              Área
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {fight.areaName || '-'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                              Categoria
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {fight.categoryName || '-'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                              Vencedor
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {resolveWinnerName(fight)}
                            </p>
                          </div>
                        </div>

                        <FightActions
                          fight={fight}
                          isStarting={startMutation.isPending}
                          isFinishing={finishMutation.isPending}
                          isAreaBusy={Boolean(
                            fight.areaId && areasWithActiveFight.has(fight.areaId),
                          )}
                          onStart={handleStartFight}
                          onFinish={(fightId) => setFinishFightId(fightId)}
                          onOpenScoreboard={(fightId) =>
                            setScoreboardFightId(fightId)
                          }
                          onEdit={(fightId) => {
                            setFightFormMode('edit');
                            setFightFormFightId(fightId);
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="hidden overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)] md:block">
                  <div className="overflow-x-auto">
                    <Table className="rounded-none border-0">
                      <TableHeader className="bg-slate-100">
                        <TableRow className="hover:bg-slate-100">
                          <TableHead className="text-xs sm:text-sm">
                            Ordem
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Luta
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Status
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Rodada
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Área
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Categoria
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Vencedor
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFights.map((fight) => (
                          <TableRow
                            key={fight.id}
                            draggable={!updateFightOrderMutation.isPending}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', fight.id);
                              handleDragStartFight(fight.id);
                            }}
                            onDragEnter={() => handleDragEnterFight(fight.id)}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              handleDragEnterFight(fight.id);
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleDropFight(fight.id);
                            }}
                            onDragEnd={handleDragEndFight}
                            className={`hover:bg-amber-50 ${
                              draggedFightId === fight.id
                                ? 'opacity-45'
                                : dragOverFightId === fight.id
                                  ? 'border-t-4 border-sky-400 bg-sky-50'
                                  : ''
                            }`}
                          >
                            <TableCell className="py-3">
                              <FightOrderHandle
                                order={fight.order}
                                isDragging={draggedFightId === fight.id}
                                isSaving={updateFightOrderMutation.isPending}
                              />
                            </TableCell>
                            <TableCell className="py-3">
                              <button
                                type="button"
                                onClick={() => setSelectedFightId(fight.id)}
                                className="text-left text-sm font-semibold leading-5 underline-offset-4 hover:underline"
                              >
                                {fight.athleteA?.name || 'A definir'} vs{' '}
                                {fight.athleteB?.name || 'A definir'}
                              </button>
                            </TableCell>
                            <TableCell className="py-3 text-xs sm:text-sm">
                              <span
                                className={getCompactFightStatusBadgeClassName(
                                  fight.status,
                                )}
                              >
                                {getFightStatusLabel(fight.status)}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-xs sm:text-sm">
                              {getFightRoundLabel(fight.round)}
                            </TableCell>
                            <TableCell className="py-3 text-xs sm:text-sm">
                              {fight.areaName || '-'}
                            </TableCell>
                            <TableCell className="py-3 text-xs sm:text-sm">
                              {fight.categoryName || '-'}
                            </TableCell>
                            <TableCell className="py-3 text-xs sm:text-sm">
                              {resolveWinnerName(fight)}
                            </TableCell>
                            <TableCell className="py-3">
                              <FightActions
                                fight={fight}
                                isStarting={startMutation.isPending}
                                isFinishing={finishMutation.isPending}
                                isAreaBusy={Boolean(
                                  fight.areaId &&
                                    areasWithActiveFight.has(fight.areaId),
                                )}
                                onStart={handleStartFight}
                                onFinish={(fightId) =>
                                  setFinishFightId(fightId)
                                }
                                onOpenScoreboard={(fightId) =>
                                  setScoreboardFightId(fightId)
                                }
                                onEdit={(fightId) => {
                                  setFightFormMode('edit');
                                  setFightFormFightId(fightId);
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {draggedFightId ? (
                          <TableRow
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              setDragOverFightId('__END__');
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              handleDropAtEnd();
                            }}
                            className={
                              dragOverFightId === '__END__'
                                ? 'bg-sky-50'
                                : 'bg-slate-50'
                            }
                          >
                            <TableCell colSpan={8} className="py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                              Solte aqui para mover ao final da lista visível
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </>
            )}

          <FightDetailDrawer
            fight={selectedFight}
            isOpen={Boolean(selectedFight)}
            onClose={() => setSelectedFightId(null)}
            onStart={handleStartFight}
            onFinish={(fightId) => setFinishFightId(fightId)}
            onOpenScoreboard={(fightId) => setScoreboardFightId(fightId)}
            onEdit={(fightId) => {
              setFightFormMode('edit');
              setFightFormFightId(fightId);
            }}
            isStarting={startMutation.isPending}
            isFinishing={finishMutation.isPending}
            isAreaBusy={Boolean(
              selectedFight?.areaId &&
                areasWithActiveFight.has(selectedFight.areaId),
            )}
          />

          <FightFormDialog
            isOpen={Boolean(fightFormFightId)}
            onClose={() => setFightFormFightId(null)}
            onSubmit={(payload) => void handleSubmitFightForm(payload)}
            athletes={athletesQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
            areas={(areasQuery.data ?? []).map((area) => ({
              id: area.id,
              name: area.name,
            }))}
            fight={fightFormMode === 'edit' ? editingFight : null}
            isSubmitting={
              createFightMutation.isPending || updateFightMutation.isPending
            }
          />

          <FightScoreboardDialog
            fight={scoreboardFight}
            isOpen={Boolean(scoreboardFight)}
            initialDurationSeconds={300}
            autoStartToken={scoreboardAutoStartToken}
            onClose={() => setScoreboardFightId(null)}
            onSubmissionFinishSelection={handleSubmissionFinishSelection}
            onFinish={(fightId) => {
              setFinishPreset(null);
              setScoreboardFightId(null);
              setFinishFightId(fightId);
            }}
          />

          <FinishFightDialog
            fight={fightToFinish}
            isOpen={Boolean(fightToFinish)}
            onClose={() => {
              setFinishPreset(null);
              setFinishFightId(null);
            }}
            winnerId={winnerId}
            winType={winType}
            onWinnerChange={setWinnerId}
            onWinTypeChange={(value) =>
              setWinType(value as (typeof winTypeOptions)[number])
            }
            onSubmit={() => void handleFinishFight()}
            isSubmitting={finishMutation.isPending}
          />
        </>
      )}
    </div>
  );
}

function FightActions({
  fight,
  isStarting,
  isFinishing,
  isAreaBusy = false,
  onStart,
  onFinish,
  onOpenScoreboard,
  onEdit,
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  isAreaBusy?: boolean;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard?: (fightId: string) => void;
  onEdit?: (fightId: string) => void;
}) {
  const hasNoArea = !fight.areaId;
  const startDisabledReason = hasNoArea
    ? 'Distribua esta luta para uma área antes de iniciar.'
    : isAreaBusy
      ? 'Esta área já tem uma luta em andamento.'
      : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => void onStart(fight.id)}
        disabled={
          (fight.status !== 'PENDING' && fight.status !== 'CALLED') ||
          isStarting ||
          hasNoArea ||
          isAreaBusy
        }
        title={startDisabledReason}
      >
        <Play className="mr-2 h-4 w-4" />
        Iniciar
      </Button>
      <Button
        type="button"
        onClick={() => onFinish(fight.id)}
        disabled={fight.status === 'FINISHED' || isFinishing}
      >
        <Trophy className="mr-2 h-4 w-4" />
        Finalizar
      </Button>
      {fight.status === 'IN_PROGRESS' && onOpenScoreboard ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenScoreboard(fight.id)}
        >
          Placar
        </Button>
      ) : null}
      {onEdit ? (
        <Button type="button" variant="outline" onClick={() => onEdit(fight.id)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      ) : null}
    </div>
  );
}

function FightOrderHandle({
  order,
  isDragging,
  isSaving,
}: {
  order: number | null;
  isDragging: boolean;
  isSaving: boolean;
}) {
  return (
    <div
      className={`flex min-w-[112px] items-center gap-2 ${
        isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-grab'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <div className="min-w-10 text-sm font-black text-slate-950">
        {order ?? '--'}
      </div>
      <span
        aria-hidden="true"
        className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1 text-slate-500"
      >
        <GripVertical className="h-4 w-4" />
      </span>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'live' | 'upcoming' | 'warning';
}) {
  const className =
    tone === 'live'
      ? 'border-red-300 bg-red-50 text-red-900'
      : tone === 'upcoming'
        ? 'border-sky-300 bg-sky-50 text-sky-900'
        : tone === 'warning'
          ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-slate-300 bg-slate-50 text-slate-900';

  return (
    <div className={`rounded-2xl border-2 p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function LiveFightCard({
  fight,
  isStarting,
  isFinishing,
  onOpen,
  onStart,
  onFinish,
  onOpenScoreboard,
  onEdit,
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  onOpen: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
  onEdit: (fightId: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-4 border-red-300 bg-gradient-to-br from-red-100 via-orange-50 to-white p-0 shadow-[6px_6px_0_0_rgba(127,29,29,0.18)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-red-700 bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Ao vivo
          </div>
          <span className={getFightStatusBadgeClassName(fight.status)}>
            {getFightStatusLabel(fight.status)}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left"
        >
          <FighterCard
            name={fight.athleteA?.name}
            academy={fight.athleteA?.academy}
            tone="live"
          />
          <div className="py-3 text-center text-lg font-black uppercase tracking-[0.18em] text-red-700">
            VS
          </div>
          <FighterCard
            name={fight.athleteB?.name}
            academy={fight.athleteB?.academy}
            tone="live"
          />
        </button>

        <div className="flex flex-wrap gap-2 border-t-2 border-red-200 pt-4">
          <InfoPill label={fight.areaName || 'Sem área'} tone="live" />
          <InfoPill label={fight.categoryName || 'Sem categoria'} tone="live" />
          {fight.order ? (
            <InfoPill label={`Ordem ${fight.order}`} tone="live" />
          ) : null}
        </div>

        <FightActions
          fight={fight}
          isStarting={isStarting}
          isFinishing={isFinishing}
          onStart={onStart}
          onFinish={onFinish}
          onOpenScoreboard={onOpenScoreboard}
          onEdit={onEdit}
        />
      </CardContent>
    </Card>
  );
}

function UpcomingFightCard({
  fight,
  isStarting,
  isFinishing,
  isAreaBusy,
  onOpen,
  onStart,
  onFinish,
  onOpenScoreboard,
  onEdit,
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  isAreaBusy: boolean;
  onOpen: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
  onEdit: (fightId: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-4 border-slate-900 bg-white p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex rounded-full border-2 border-sky-900 bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-900">
            Pendente
          </span>
          <div className="text-right">
            <p className="text-lg font-black text-slate-950">
              {fight.order ? `#${fight.order}` : '--'}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Ordem prevista
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left"
        >
          <FighterCard
            name={fight.athleteA?.name}
            academy={fight.athleteA?.academy}
            tone="upcoming"
          />
          <div className="py-3 text-center text-lg font-black uppercase tracking-[0.18em] text-slate-500">
            VS
          </div>
          <FighterCard
            name={fight.athleteB?.name}
            academy={fight.athleteB?.academy}
            tone="upcoming"
          />
        </button>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <InfoPill label={fight.areaName || 'Sem área'} tone="upcoming" />
          <InfoPill
            label={fight.categoryName || 'Sem categoria'}
            tone="upcoming"
          />
        </div>

        <FightActions
          fight={fight}
          isStarting={isStarting}
          isFinishing={isFinishing}
          isAreaBusy={isAreaBusy}
          onStart={onStart}
          onFinish={onFinish}
          onOpenScoreboard={onOpenScoreboard}
          onEdit={onEdit}
        />
      </CardContent>
    </Card>
  );
}

function FighterCard({
  name,
  academy,
  tone,
}: {
  name?: string;
  academy?: string;
  tone: 'live' | 'upcoming';
}) {
  const className =
    tone === 'live'
      ? 'border-red-200 bg-white'
      : 'border-slate-200 bg-slate-50';
  const textClassName = 'text-slate-950';
  const subClassName = 'text-slate-500';

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className={`text-lg font-black ${textClassName}`}>
        {name || 'A definir'}
      </p>
      <p className={`mt-1 text-sm ${subClassName}`}>
        {academy || 'Sem academia'}
      </p>
    </div>
  );
}

function InfoPill({
  label,
  tone,
}: {
  label: string;
  tone: 'live' | 'upcoming';
}) {
  const className =
    tone === 'live'
      ? 'border-red-200 bg-white text-slate-700'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function FightDetailDrawer({
  fight,
  isOpen,
  onClose,
  onStart,
  onFinish,
  onOpenScoreboard,
  onEdit,
  isStarting,
  isFinishing,
  isAreaBusy,
}: {
  fight: Fight | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
  onEdit: (fightId: string) => void;
  isStarting: boolean;
  isFinishing: boolean;
  isAreaBusy: boolean;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-[min(92vw,64rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:border-4 sm:border-slate-900">
        <div className="flex h-full flex-col bg-white">
          <DialogHeader className="border-b-4 border-slate-900 px-6 py-5 text-left">
            <DialogTitle className="text-xl font-black text-slate-950">
              {fight?.athleteA?.name || 'A definir'} vs{' '}
              {fight?.athleteB?.name || 'A definir'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Revise a luta, confira a pesagem dos atletas e execute as acoes
              necessarias.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {fight ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <span className={getFightStatusBadgeClassName(fight.status)}>
                    {getFightStatusLabel(fight.status)}
                  </span>
                  {fight.areaName ? (
                    <span className="inline-flex rounded-full border-2 border-slate-900 bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                      {fight.areaName}
                    </span>
                  ) : null}
                </div>

                <DetailGrid>
                  <DetailItem
                    label="Categoria"
                    value={fight.categoryName || '-'}
                  />
                  <DetailItem
                    label="Chave"
                    value={fight.keyGroupName || (fight.keyGroupId ? `Chave ${fight.keyGroupId}` : '-')}
                  />
                  <DetailItem
                    label="Ordem"
                    value={fight.order ? String(fight.order) : '-'}
                  />
                  <DetailItem
                    label="Rodada"
                    value={getFightRoundLabel(fight.round)}
                  />
                  <DetailItem
                    label="Tipo de vitória"
                    value={getWinTypeLabel(fight.winType)}
                  />
                  <DetailItem
                    label="Vencedor"
                    value={resolveWinnerName(fight)}
                  />
                </DetailGrid>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ParticipantCard
                    title="Atleta A"
                    name={fight.athleteA?.name}
                    academy={fight.athleteA?.academy}
                    weighInStatus={fight.athleteA?.weighInStatus}
                  />
                  <ParticipantCard
                    title="Atleta B"
                    name={fight.athleteB?.name}
                    academy={fight.athleteB?.academy}
                    weighInStatus={fight.athleteB?.weighInStatus}
                  />
                </div>
              </>
              ) : null}
          </div>

          {fight ? (
            <DialogFooter className="border-t border-slate-200 px-6 py-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => void onStart(fight.id)}
                disabled={
                  (fight.status !== 'PENDING' && fight.status !== 'CALLED') ||
                  isStarting ||
                  !fight.areaId ||
                  isAreaBusy
                }
                title={
                  !fight.areaId
                    ? 'Distribua esta luta para uma área antes de iniciar.'
                    : isAreaBusy
                      ? 'Esta área já tem uma luta em andamento.'
                      : undefined
                }
              >
                Iniciar
              </Button>
              <Button
                type="button"
                onClick={() => onFinish(fight.id)}
                disabled={fight.status === 'FINISHED' || isFinishing}
              >
                Finalizar
              </Button>
              {fight.status === 'IN_PROGRESS' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenScoreboard(fight.id)}
                >
                  Placar
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(fight.id)}
              >
                Editar
              </Button>
            </DialogFooter>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FinishFightDialog({
  fight,
  isOpen,
  onClose,
  winnerId,
  winType,
  onWinnerChange,
  onWinTypeChange,
  onSubmit,
  isSubmitting,
}: {
  fight: Fight | null;
  isOpen: boolean;
  onClose: () => void;
  winnerId: string;
  winType: string;
  onWinnerChange: (value: string) => void;
  onWinTypeChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const winnerOptions = [fight?.athleteA, fight?.athleteB].filter(
    (athlete): athlete is NonNullable<typeof athlete> => Boolean(athlete),
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg rounded-[28px] border-4 border-slate-900 p-0">
        <div className="space-y-5 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-950">
              Finalizar luta
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Escolha o vencedor e o tipo de vitoria antes de encerrar a luta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                Vencedor
              </span>
              <select
                value={winnerId}
                onChange={(event) => onWinnerChange(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {winnerOptions.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                Tipo de vitória
              </span>
              <select
                value={winType}
                onChange={(event) => onWinTypeChange(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {winTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {getWinTypeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!winnerId || !winType || isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Finalizar luta'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ParticipantCard({
  title,
  name,
  academy,
  weighInStatus,
}: {
  title: string;
  name?: string;
  academy?: string;
  weighInStatus?: string;
}) {
  return (
    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-lg font-black text-slate-950">
        {name || 'A definir'}
      </p>
      <p className="mt-1 text-sm text-slate-600">{academy || 'Sem academia'}</p>
      <p className="mt-3 text-sm font-semibold text-slate-700">
        Pesagem: {getWeighInStatusLabel(weighInStatus || 'PENDING')}
      </p>
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function resolveWinnerName(fight: Fight) {
  return resolveFightWinnerName(fight);
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
