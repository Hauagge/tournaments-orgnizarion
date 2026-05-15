'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Megaphone, Radio, Rows3 } from 'lucide-react';
import {
  useCallNextAreaFight,
  useAreaQueue,
} from '@/features/areas/hooks/use-areas';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import {
  Fight,
  getFightStatusBadgeClassName,
  getFightStatusLabel,
} from '@/features/fights/types/fight';
import { useAreaSocket } from '@/hooks/useAreaSocket';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
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

const POLLING_INTERVAL = 4000;

export default function AreaQueuePage({ areaId }: { areaId: string }) {
  const [lastCalledFightLabel, setLastCalledFightLabel] = useState<
    string | null
  >(null);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const token = useAuthStore((state) => state.token);
  const realtime = useAreaSocket({ token, areaId });
  const isRealtimeActive =
    realtime.connected && !realtime.joining && !realtime.joinError;
  const queueQuery = useAreaQueue(areaId, {
    refetchInterval: isRealtimeActive ? false : POLLING_INTERVAL,
  });
  const callNextMutation = useCallNextAreaFight(activeCompetitionId, areaId);
  const { toast } = useToast();

  const area = queueQuery.data?.area ?? null;
  const nextFight = queueQuery.data?.nextFight ?? null;
  const queue = queueQuery.data?.queue ?? [];
  const queuePreview = useMemo(() => {
    const fights = [nextFight, ...queue].filter((fight): fight is Fight =>
      Boolean(fight),
    );
    const seen = new Set<string>();

    return fights.filter((fight, index) => {
      const key = fight.id || `fight-${index}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [nextFight, queue]);
  const nextSequence = useMemo(
    () => queuePreview.filter((fight) => fight.status !== 'FINISHED').slice(1, 4),
    [queuePreview],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTyping || event.repeat || event.key !== 'Enter') {
        return;
      }

      if (
        !nextFight ||
        callNextMutation.isPending ||
        queueQuery.isLoading ||
        queueQuery.isError
      ) {
        return;
      }

      event.preventDefault();
      void handleCallNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    callNextMutation.isPending,
    nextFight,
    queueQuery.isError,
    queueQuery.isLoading,
  ]);

  async function handleCallNext() {
    if (!nextFight) {
      return;
    }

    try {
      await callNextMutation.mutateAsync();
      setLastCalledFightLabel(getFightLabel(nextFight));
      toast({
        title: 'Proxima luta chamada',
        description: `${getFightLabel(nextFight)} foi enviada para chamada.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao chamar proxima luta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <Link href="/areas/distribution" className="hover:text-slate-950">
                Distribuição
              </Link>
              <span>/</span>
              <Link href="/areas" className="hover:text-slate-950">
                Área
              </Link>
              <span>/</span>
              <span className="text-slate-950">Chamada</span>
            </div>
            <Link
              href="/areas"
              className="mt-3 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para areas
            </Link>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Fila da area
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              {area?.name || 'Area'}
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Destaque da proxima luta e fila completa abaixo para operacao
              rapida.
            </p>
          </div>

          <Button
            onClick={() => void handleCallNext()}
            disabled={callNextMutation.isPending || !areaId || !nextFight}
            className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800"
          >
            <Megaphone className="mr-2 h-4 w-4" />
            {callNextMutation.isPending ? 'Chamando...' : 'Chamar proxima'}
          </Button>
        </div>
      </header>

      {queueQuery.isLoading && (
        <StateCard message="Carregando fila da area..." />
      )}
      {queueQuery.isError && (
        <StateCard
          message={
            queueQuery.error instanceof Error
              ? queueQuery.error.message
              : 'Falha ao carregar fila da area.'
          }
          tone="error"
        />
      )}

      {!queueQuery.isLoading && !queueQuery.isError && (
        <>
          <section>
            <Card className="border-4 border-slate-900 p-0 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="space-y-4 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  Proxima luta
                </p>

                {nextFight ? (
                  <div className="rounded-[24px] border-4 border-slate-900 bg-amber-100 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={getFightStatusBadgeClassName(
                          nextFight.status,
                        )}
                      >
                        {getFightStatusLabel(nextFight.status)}
                      </span>
                      {nextFight.categoryName ? (
                        <span className="inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                          {nextFight.categoryName}
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-full border-2 border-slate-900 bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                        Fila #{1}
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                      {getFightLabel(nextFight)}
                    </h2>
                    <p className="mt-3 text-base text-slate-700">
                      {nextFight.areaName || area?.name || 'Sem area definida'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                    Nenhuma luta na fila desta area.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        

          <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Na sequencia
                  </p>
                </div>
                <Rows3 className="h-5 w-5 text-slate-400" />
              </div>

              {nextSequence.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                  Nenhuma outra luta aguardando depois da próxima chamada.
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-3">
                  {nextSequence.map((fight, index) => (
                    <div
                      key={fight.id}
                      className="rounded-2xl border-4 border-slate-900 bg-white p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Fila #{index + 2}
                      </p>
                      <h3 className="mt-2 text-lg font-black text-slate-950">
                        {getFightLabel(fight)}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {fight.categoryName || 'Categoria nao informada'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead className="w-16 whitespace-nowrap sm:w-20">
                      Posicao
                    </TableHead>
                    <TableHead className="w-full min-w-[14rem]">Luta</TableHead>
                    <TableHead className="w-16 whitespace-nowrap sm:w-24">
                      Status
                    </TableHead>
                    {/* <TableHead>Categoria</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-slate-500"
                      >
                        Nenhuma luta na fila.
                      </TableCell>
                    </TableRow>
                  ) : (
                    queue.map((fight, index) => (
                      <TableRow
                        key={fight.id}
                        className={
                          index === 0 ? 'bg-amber-50 hover:bg-amber-50' : ''
                        }
                      >
                        <TableCell className="w-16 whitespace-nowrap font-semibold sm:w-20">
                          {index + 1}
                        </TableCell>
                        <TableCell className="w-full min-w-[14rem]">
                          {fight.athleteA?.name || 'A definir'} vs{' '}
                          {fight.athleteB?.name || 'A definir'}
                        </TableCell>
                        <TableCell className="w-16 whitespace-nowrap sm:w-24">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-3 w-3 shrink-0 rounded-full md:hidden ${getFightStatusDotClassName(
                                fight.status,
                              )}`}
                              aria-hidden="true"
                              title={getFightStatusLabel(fight.status)}
                            />
                            <span
                              className={`hidden md:inline-flex ${getFightStatusBadgeClassName(
                                fight.status,
                              ).replace('inline-flex ', '')}`}
                            >
                              {getFightStatusLabel(fight.status)}
                            </span>
                          </div>
                        </TableCell>
                        {/* <TableCell>{fight.categoryName || '-'}</TableCell> */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t-4 border-slate-900 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
                <span className="font-black uppercase tracking-[0.14em] text-slate-500">
                  Legenda
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  Agendada
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Em andamento
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  Finalizada
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function getFightLabel(fight: Fight | null) {
  if (!fight) {
    return 'A definir vs A definir';
  }

  return `${fight.athleteA?.name || 'A definir'} vs ${fight.athleteB?.name || 'A definir'}`;
}

function getFightStatusDotClassName(status: Fight['status']) {
  if (status === 'IN_PROGRESS') {
    return 'bg-blue-500';
  }

  if (status === 'FINISHED') {
    return 'bg-emerald-500';
  }

  return 'bg-amber-500';
}

function StatusPill({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const toneClassName =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : tone === 'warning'
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-slate-300 bg-slate-50 text-slate-900';

  return (
    <div className={`rounded-2xl border-2 p-4 ${toneClassName}`}>
      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function StateCard({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'error';
}) {
  const toneClassName =
    tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-700'
      : 'border-slate-300 bg-white text-slate-600';

  return (
    <Card className={`border-4 p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}
