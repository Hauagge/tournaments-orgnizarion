'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, Play, Trophy } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { FightScoreboardDialog } from '@/features/fights/components/fight-scoreboard-dialog';
import {
  useFinishFight,
  useFights,
  useStartFight,
} from '@/features/fights/hooks/use-fights';
import {
  Fight,
  getFightStatusBadgeClassName,
  getFightStatusLabel,
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

const POLLING_INTERVAL = 4000;

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
    case 'IN_PROGRESS':
      return 'inline-flex rounded-full border border-blue-900 bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-blue-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
    case 'FINISHED':
      return 'inline-flex rounded-full border border-emerald-900 bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
    default:
      return 'inline-flex rounded-full border border-amber-900 bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-900 sm:border-2 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em]';
  }
}

export default function FightsTab() {
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [finishFightId, setFinishFightId] = useState<string | null>(null);
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

  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const realtime = useCompetitionSocket({
    token,
    competitionId: activeCompetitionId,
  });
  const isRealtimeActive =
    realtime.connected && !realtime.joining && !realtime.joinError;
  const fightsQuery = useFights(activeCompetitionId, {
    refetchInterval: (query) =>
      isRealtimeActive
        ? false
        : Array.isArray(query.state.data) &&
            query.state.data.some(
              (fight) =>
                typeof fight === 'object' &&
                fight !== null &&
                'status' in fight &&
                (fight.status === 'IN_PROGRESS' || fight.status === 'SCHEDULED'),
            )
          ? POLLING_INTERVAL
          : false,
  });
  const startMutation = useStartFight(activeCompetitionId);
  const finishMutation = useFinishFight(activeCompetitionId);
  const { toast } = useToast();

  const fights = useMemo(() => fightsQuery.data ?? [], [fightsQuery.data]);
  const selectedFight = useMemo(
    () => fights.find((fight) => fight.id === selectedFightId) ?? null,
    [fights, selectedFightId],
  );
  const fightToFinish = useMemo(
    () => fights.find((fight) => fight.id === finishFightId) ?? null,
    [fights, finishFightId],
  );
  const scoreboardFight = useMemo(
    () => fights.find((fight) => fight.id === scoreboardFightId) ?? null,
    [fights, scoreboardFightId],
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

    fights.forEach((fight) => {
      if (fight.areaName) {
        uniqueAreas.set(fight.areaId ?? fight.areaName, fight.areaName);
      }
    });

    return Array.from(uniqueAreas.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [fights]);

  const areaFilteredFights = useMemo(() => {
    return fights.filter((fight) => {
      const fightAreaKey = fight.areaId ?? fight.areaName;
      const matchesArea = areaFilter === 'ALL' || fightAreaKey === areaFilter;

      return matchesArea;
    });
  }, [areaFilter, fights]);

  const inProgressFights = useMemo(
    () => areaFilteredFights.filter((fight) => fight.status === 'IN_PROGRESS'),
    [areaFilteredFights],
  );

  const upcomingFights = useMemo(() => {
    return areaFilteredFights
      .filter((fight) => fight.status === 'SCHEDULED')
      .sort((fightA, fightB) => {
        const orderA = fightA.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = fightB.order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  }, [areaFilteredFights]);

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

  async function handleFinishFight() {
    if (!fightToFinish || !winnerId) {
      return;
    }

    try {
      const finishedFightAreaId = fightToFinish.areaId;
      await finishMutation.mutateAsync({
        fightId: fightToFinish.id,
        payload: { winnerId, winType },
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
      </header>

      {!hasHydrated && <StateCard message="Carregando competicao ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competicao no topo para listar as lutas."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <>
          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.2fr_repeat(3,minmax(0,0.6fr))]">
              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  Area
                </span>
                <select
                  value={areaFilter}
                  onChange={(event) => setAreaFilter(event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todas</option>
                  {areaOptions.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </select>
              </label>

              <MetricTile
                label="Em andamento"
                value={String(inProgressFights.length)}
                tone="live"
              />
              <MetricTile
                label="Próximas"
                value={String(upcomingFights.length)}
                tone="upcoming"
              />
              <MetricTile
                label="Total"
                value={String(areaFilteredFights.length)}
              />
            </CardContent>
          </Card>

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
            fights.length === 0 && (
              <StateCard
                message="Nenhuma luta encontrada para a competição ativa."
                tone="empty"
              />
            )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            fights.length > 0 &&
            areaFilteredFights.length === 0 && (
              <StateCard
                message="Nenhuma luta corresponde à área selecionada."
                tone="empty"
              />
            )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            areaFilteredFights.length > 0 && (
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
                      message="Nenhuma luta agendada para a sequência atual."
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
                          onOpen={() => setSelectedFightId(fight.id)}
                          onStart={handleStartFight}
                          onFinish={(fightId) => setFinishFightId(fightId)}
                          onOpenScoreboard={(fightId) =>
                            setScoreboardFightId(fightId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>

                <div className="grid gap-3 md:hidden">
                  {areaFilteredFights.map((fight) => (
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
                          onStart={handleStartFight}
                          onFinish={(fightId) => setFinishFightId(fightId)}
                          onOpenScoreboard={(fightId) =>
                            setScoreboardFightId(fightId)
                          }
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
                            Luta
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Status
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
                        {areaFilteredFights.map((fight) => (
                          <TableRow
                            key={fight.id}
                            className="hover:bg-amber-50"
                          >
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
                                onStart={handleStartFight}
                                onFinish={(fightId) =>
                                  setFinishFightId(fightId)
                                }
                                onOpenScoreboard={(fightId) =>
                                  setScoreboardFightId(fightId)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
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
            isStarting={startMutation.isPending}
            isFinishing={finishMutation.isPending}
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
  onStart,
  onFinish,
  onOpenScoreboard,
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard?: (fightId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => void onStart(fight.id)}
        disabled={fight.status !== 'SCHEDULED' || isStarting}
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
  tone?: 'default' | 'live' | 'upcoming';
}) {
  const className =
    tone === 'live'
      ? 'border-red-300 bg-red-50 text-red-900'
      : tone === 'upcoming'
        ? 'border-sky-300 bg-sky-50 text-sky-900'
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
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  onOpen: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
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
        />
      </CardContent>
    </Card>
  );
}

function UpcomingFightCard({
  fight,
  isStarting,
  isFinishing,
  onOpen,
  onStart,
  onFinish,
  onOpenScoreboard,
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  onOpen: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
}) {
  return (
    <Card className="overflow-hidden border-4 border-slate-900 bg-white p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex rounded-full border-2 border-sky-900 bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-900">
            Agendada
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
          onStart={onStart}
          onFinish={onFinish}
          onOpenScoreboard={onOpenScoreboard}
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
  isStarting,
  isFinishing,
}: {
  fight: Fight | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
  onOpenScoreboard: (fightId: string) => void;
  isStarting: boolean;
  isFinishing: boolean;
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
                    label="Ordem"
                    value={fight.order ? String(fight.order) : '-'}
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
                disabled={fight.status !== 'SCHEDULED' || isStarting}
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
  if (!fight.winnerId) {
    return '-';
  }

  if (fight.athleteA?.id === fight.winnerId) {
    return fight.athleteA.name;
  }

  if (fight.athleteB?.id === fight.winnerId) {
    return fight.athleteB.name;
  }

  return fight.winnerId;
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
