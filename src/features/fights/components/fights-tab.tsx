'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Filter, Play, Swords, Trophy } from 'lucide-react';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import {
  useFinishFight,
  useFights,
  useGenerateFights,
  useStartFight,
} from '@/features/fights/hooks/use-fights';
import {
  Fight,
  FightStatus,
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

type KeyFightGroup = {
  id: string;
  label: string;
  fights: Fight[];
};

const winTypeOptions = [
  'POINTS',
  'SUBMISSION',
  'WO',
  'DISQUALIFICATION',
  'REFEREE_DECISION',
] as const;

export default function FightsTab() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | FightStatus>('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [finishFightId, setFinishFightId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState('');
  const [winType, setWinType] = useState<(typeof winTypeOptions)[number]>('POINTS');

  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const fightsQuery = useFights(activeCompetitionId);
  const generateMutation = useGenerateFights(activeCompetitionId);
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
  const competitionMode = competitionQuery.data?.mode ?? 'ABSOLUTE_GP';

  useEffect(() => {
    if (!fightToFinish) {
      setWinnerId('');
      setWinType('POINTS');
      return;
    }

    const firstAvailableWinner = fightToFinish.athleteA?.id ?? fightToFinish.athleteB?.id ?? '';
    setWinnerId(firstAvailableWinner);
    setWinType('POINTS');
  }, [fightToFinish]);

  const areaOptions = useMemo(() => {
    const uniqueAreas = new Map<string, string>();

    fights.forEach((fight) => {
      if (fight.areaName) {
        uniqueAreas.set(fight.areaId ?? fight.areaName, fight.areaName);
      }
    });

    return Array.from(uniqueAreas.entries()).map(([value, label]) => ({ value, label }));
  }, [fights]);

  const filteredFights = useMemo(() => {
    return fights.filter((fight) => {
      const matchesStatus = statusFilter === 'ALL' || fight.status === statusFilter;
      const fightAreaKey = fight.areaId ?? fight.areaName;
      const matchesArea = areaFilter === 'ALL' || fightAreaKey === areaFilter;

      return matchesStatus && matchesArea;
    });
  }, [areaFilter, fights, statusFilter]);

  const groupedKeyFights = useMemo(() => {
    const groups = new Map<string, KeyFightGroup>();

    filteredFights.forEach((fight) => {
      const groupId = fight.keyGroupId ?? `fight-${fight.id}`;
      const existing = groups.get(groupId);

      if (existing) {
        existing.fights.push(fight);
        return;
      }

      groups.set(groupId, {
        id: groupId,
        label: fight.keyGroupName || `Chave ${groupId}`,
        fights: [fight],
      });
    });

    return Array.from(groups.values()).sort((groupA, groupB) => {
      const orderA = Math.min(...groupA.fights.map((fight) => fight.order ?? Number.MAX_SAFE_INTEGER));
      const orderB = Math.min(...groupB.fights.map((fight) => fight.order ?? Number.MAX_SAFE_INTEGER));
      return orderA - orderB;
    });
  }, [filteredFights]);

  async function handleGenerateFights() {
    if (!activeCompetitionId) {
      return;
    }

    try {
      await generateMutation.mutateAsync();
      toast({
        title: 'Lutas geradas',
        description: 'A lista foi atualizada com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao gerar lutas',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleStartFight(fightId: string) {
    try {
      await startMutation.mutateAsync(fightId);
      toast({
        title: 'Luta iniciada',
        description: 'O status da luta foi atualizado.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao iniciar luta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleFinishFight() {
    if (!fightToFinish || !winnerId) {
      return;
    }

    try {
      await finishMutation.mutateAsync({
        fightId: fightToFinish.id,
        payload: { winnerId, winType },
      });
      setFinishFightId(null);
      toast({
        title: 'Luta finalizada',
        description: 'Resultado salvo com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao finalizar luta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
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
              Fights
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Controle as lutas da competicao ativa
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Gere o chaveamento, filtre por status e area, inicie ou finalize lutas sem sair da tela.
            </p>
          </div>

          <Button
            onClick={() => void handleGenerateFights()}
            disabled={!activeCompetitionId || !hasHydrated || generateMutation.isPending}
            className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800"
          >
            {generateMutation.isPending ? 'Gerando...' : 'Gerar lutas'}
          </Button>
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
          {competitionMode === 'KEYS' ? (
            <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Operação das chaves
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Monte as chaves antes de gerar as lutas
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    No modo de chaves, os atletas são organizados em grupos de até 4
                    atletas. Gere ou ajuste as chaves na tela dedicada antes de operar
                    as lutas aqui.
                  </p>
                </div>
                <Link href="/key-groups">
                  <Button variant="outline">Abrir chaves</Button>
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  <Filter className="h-4 w-4" />
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'ALL' | FightStatus)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todos</option>
                  <option value="SCHEDULED">Agendadas</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="FINISHED">Finalizadas</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  <Swords className="h-4 w-4" />
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

          {!fightsQuery.isLoading && !fightsQuery.isError && fights.length === 0 && (
            <StateCard
              message="Nenhuma luta encontrada. Gere as lutas para popular a listagem."
              tone="empty"
            />
          )}

          {!fightsQuery.isLoading && !fightsQuery.isError && fights.length > 0 && filteredFights.length === 0 && (
            <StateCard
              message="Nenhuma luta corresponde aos filtros atuais."
              tone="empty"
            />
          )}

          {!fightsQuery.isLoading &&
            !fightsQuery.isError &&
            filteredFights.length > 0 &&
            (competitionMode === 'KEYS' ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {groupedKeyFights.map((group) => (
                  <Card
                    key={group.id}
                    className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]"
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Chave
                          </p>
                          <h2 className="mt-2 text-2xl font-black text-slate-950">
                            {group.label}
                          </h2>
                        </div>
                        <span className="rounded-full border-2 border-slate-900 bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                          {group.fights.length} lutas
                        </span>
                      </div>

                      <div className="space-y-3">
                        {group.fights.map((fight, index) => (
                          <div
                            key={fight.id}
                            className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                  Luta {index + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFightId(fight.id)}
                                  className="mt-2 text-left text-lg font-black text-slate-950 underline-offset-4 hover:underline"
                                >
                                  {fight.athleteA?.name || 'A definir'} vs {fight.athleteB?.name || 'A definir'}
                                </button>
                                <p className="mt-1 text-sm text-slate-600">
                                  {fight.areaName || 'Sem area'} · {fight.categoryName || 'Sem categoria'}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className={getFightStatusBadgeClassName(fight.status)}>
                                  {getFightStatusLabel(fight.status)}
                                </span>
                                <FightActions
                                  fight={fight}
                                  isStarting={startMutation.isPending}
                                  isFinishing={finishMutation.isPending}
                                  onStart={handleStartFight}
                                  onFinish={(fightId) => setFinishFightId(fightId)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
                <div className="overflow-x-auto">
                  <Table className="rounded-none border-0">
                    <TableHeader className="bg-slate-100">
                      <TableRow className="hover:bg-slate-100">
                        <TableHead>Luta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFights.map((fight) => (
                        <TableRow key={fight.id} className="hover:bg-amber-50">
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => setSelectedFightId(fight.id)}
                              className="text-left font-semibold underline-offset-4 hover:underline"
                            >
                              {fight.athleteA?.name || 'A definir'} vs {fight.athleteB?.name || 'A definir'}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className={getFightStatusBadgeClassName(fight.status)}>
                              {getFightStatusLabel(fight.status)}
                            </span>
                          </TableCell>
                          <TableCell>{fight.areaName || '-'}</TableCell>
                          <TableCell>{fight.categoryName || '-'}</TableCell>
                          <TableCell>
                            <FightActions
                              fight={fight}
                              isStarting={startMutation.isPending}
                              isFinishing={finishMutation.isPending}
                              onStart={handleStartFight}
                              onFinish={(fightId) => setFinishFightId(fightId)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}

          <FightDetailDrawer
            fight={selectedFight}
            isOpen={Boolean(selectedFight)}
            onClose={() => setSelectedFightId(null)}
            onStart={handleStartFight}
            onFinish={(fightId) => setFinishFightId(fightId)}
            isStarting={startMutation.isPending}
            isFinishing={finishMutation.isPending}
          />

          <FinishFightDialog
            fight={fightToFinish}
            isOpen={Boolean(fightToFinish)}
            onClose={() => setFinishFightId(null)}
            winnerId={winnerId}
            winType={winType}
            onWinnerChange={setWinnerId}
            onWinTypeChange={(value) => setWinType(value as (typeof winTypeOptions)[number])}
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
}: {
  fight: Fight;
  isStarting: boolean;
  isFinishing: boolean;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
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
    </div>
  );
}

function FightDetailDrawer({
  fight,
  isOpen,
  onClose,
  onStart,
  onFinish,
  isStarting,
  isFinishing,
}: {
  fight: Fight | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: (fightId: string) => void | Promise<void>;
  onFinish: (fightId: string) => void;
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
      <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-lg translate-x-0 translate-y-0 rounded-none border-l-4 border-slate-900 p-0">
        <div className="flex h-full flex-col bg-white">
          <DialogHeader className="border-b-4 border-slate-900 px-6 py-5 text-left">
            <DialogTitle className="text-xl font-black text-slate-950">
              {fight?.athleteA?.name || 'A definir'} vs {fight?.athleteB?.name || 'A definir'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Revise a luta, confira a pesagem dos atletas e execute as acoes necessarias.
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
                  <DetailItem label="Categoria" value={fight.categoryName || '-'} />
                  <DetailItem label="Ordem" value={fight.order ? String(fight.order) : '-'} />
                  <DetailItem label="Win type" value={fight.winType || '-'} />
                  <DetailItem label="Vencedor" value={resolveWinnerName(fight)} />
                </DetailGrid>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ParticipantCard title="Atleta A" name={fight.athleteA?.name} academy={fight.athleteA?.academy} weighInStatus={fight.athleteA?.weighInStatus} />
                  <ParticipantCard title="Atleta B" name={fight.athleteB?.name} academy={fight.athleteB?.academy} weighInStatus={fight.athleteB?.weighInStatus} />
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
  const winnerOptions = [fight?.athleteA, fight?.athleteB].filter((athlete): athlete is NonNullable<typeof athlete> => Boolean(athlete));

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
                Win type
              </span>
              <select
                value={winType}
                onChange={(event) => onWinTypeChange(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {winTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSubmit} disabled={!winnerId || !winType || isSubmitting}>
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
      <p className="mt-3 text-lg font-black text-slate-950">{name || 'A definir'}</p>
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
