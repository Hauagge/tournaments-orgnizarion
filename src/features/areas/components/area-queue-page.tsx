'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAreaQueue } from '@/features/areas/hooks/use-areas';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import {
  Fight,
  getFightStatusBadgeClassName,
  getFightStatusLabel,
} from '@/features/fights/types/fight';
import { useAreaSocket } from '@/hooks/useAreaSocket';
import { Card, CardContent } from '@/shared/ui/card';

const POLLING_INTERVAL = 4000;

// Agendadas primeiro; em andamento e finalizadas ficam por ultimo.
const STATUS_ORDER: Record<Fight['status'], number> = {
  PENDING: 0,
  CALLED: 0,
  IN_PROGRESS: 1,
  FINISHED: 2,
};

export default function AreaQueuePage({ areaId }: { areaId: string }) {
  const token = useAuthStore((state) => state.token);
  const realtime = useAreaSocket({ token, areaId });
  const isRealtimeActive =
    realtime.connected && !realtime.joining && !realtime.joinError;
  const queueQuery = useAreaQueue(areaId, {
    refetchInterval: isRealtimeActive ? false : POLLING_INTERVAL,
  });

  const area = queueQuery.data?.area ?? null;

  // Fila unica, sem duplicatas e ja ordenada: agendadas no topo, em andamento
  // e finalizadas por ultimo. Dentro de cada grupo, respeita o campo `order`.
  const orderedFights = useMemo(() => {
    const nextFight = queueQuery.data?.nextFight ?? null;
    const queue = queueQuery.data?.queue ?? [];
    const fights = [nextFight, ...queue].filter((fight): fight is Fight =>
      Boolean(fight),
    );
    const seen = new Set<string>();
    const unique = fights.filter((fight, index) => {
      const key = fight.id || `fight-${index}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return unique
      .map((fight, index) => ({ fight, index }))
      .sort((a, b) => {
        const byStatus =
          STATUS_ORDER[a.fight.status] - STATUS_ORDER[b.fight.status];
        if (byStatus !== 0) {
          return byStatus;
        }

        const orderA = a.fight.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.fight.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.index - b.index;
      })
      .map((entry) => entry.fight);
  }, [queueQuery.data]);


  const upcoming =
    orderedFights.find((fight) => fight.status === 'CALLED') ??
    orderedFights.find((fight) => fight.status === 'PENDING') ??
    null;
  const rest = orderedFights.filter((fight) => fight !== upcoming);
  const pendingCount = orderedFights.filter(
    (fight) => fight.status === 'PENDING',
  ).length;
  const isUpcomingCalled = upcoming?.status === 'CALLED';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
      <header className="rounded-3xl border-4 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)] sm:p-6">
        <Link
          href="/areas"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Areas
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {area?.name || 'Area'}
          </h1>
          <span className="inline-flex rounded-full border-2 border-slate-900 bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
            {pendingCount} agendada{pendingCount === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {queueQuery.isLoading && <StateCard message="Carregando fila da area..." />}
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
          {upcoming ? (
            <section
              className={`rounded-3xl border-4 border-slate-900 p-4 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)] sm:p-6 ${
                isUpcomingCalled ? 'bg-violet-100' : 'bg-amber-100'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border-2 border-slate-900 bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                  {isUpcomingCalled ? 'Ja chamada' : 'Proxima'}
                </span>
                <span className={getFightStatusBadgeClassName(upcoming.status)}>
                  {getFightStatusLabel(upcoming.status)}
                </span>
                {upcoming.categoryName ? (
                  <span className="inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                    {upcoming.categoryName}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                {getFightLabel(upcoming)}
              </p>
            </section>
          ) : (
            <StateCard
              message="Nenhuma luta agendada nesta area."
              tone="empty"
            />
          )}

          {rest.length > 0 && (
            <section className="space-y-3">
              <p className="px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Na sequencia
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {rest.map((fight, index) => (
                  <li
                    key={fight.id}
                    className={`flex items-center gap-3 rounded-2xl border-2 border-slate-900 p-3 shadow-[3px_3px_0_0_rgba(15,23,42,0.9)] sm:gap-4 sm:p-4 ${
                      fight.status === 'IN_PROGRESS'
                        ? 'bg-blue-50'
                        : fight.status === 'FINISHED'
                          ? 'bg-slate-50 opacity-60'
                          : fight.status === 'CALLED'
                            ? 'bg-violet-50'
                            : 'bg-white'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-slate-50 text-sm font-black text-slate-950 sm:h-11 sm:w-11 sm:text-base">
                      {(upcoming ? 2 : 1) + index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 sm:text-base">
                        {getFightLabel(fight)}
                      </p>
                      {fight.categoryName ? (
                        <p className="truncate text-xs text-slate-500 sm:text-sm">
                          {fight.categoryName}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${getFightStatusDotClassName(
                        fight.status,
                      )}`}
                      aria-hidden="true"
                      title={getFightStatusLabel(fight.status)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Agendada
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-violet-500" />
              Chamada
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
  if (status === 'CALLED') {
    return 'bg-violet-500';
  }

  if (status === 'IN_PROGRESS') {
    return 'bg-blue-500';
  }

  if (status === 'FINISHED') {
    return 'bg-emerald-500';
  }

  return 'bg-amber-500';
}

function StateCard({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'error' | 'empty';
}) {
  const toneClassName =
    tone === 'error'
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
