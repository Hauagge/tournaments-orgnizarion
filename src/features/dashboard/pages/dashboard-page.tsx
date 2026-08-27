'use client';

import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Activity, ArrowRight, Clock3, Radar } from 'lucide-react';
import { getAreaQueue } from '@/features/areas/api/areas-client';
import { useAreas } from '@/features/areas/hooks/use-areas';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { AreaQueue } from '@/features/areas/types/area';
import { useFights } from '@/features/fights/hooks/use-fights';
import { useCompetitionSocket } from '@/hooks/useCompetitionSocket';
import {
  Fight,
  FightStatus,
  getFightStatusBadgeClassName,
  getFightStatusLabel,
} from '@/features/fights/types/fight';
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

const POLLING_INTERVAL = 4000;

export default function DashboardPage() {
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FightStatus>('ALL');
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const realtime = useCompetitionSocket({
    token,
    competitionId: activeCompetitionId,
  });
  const isRealtimeActive =
    realtime.connected && !realtime.joining && !realtime.joinError;
  const shouldPollCompetitionData = (fights: Fight[]) =>
    fights.some(
      (fight) =>
        fight.status === 'IN_PROGRESS' ||
        fight.status === 'CALLED' ||
        fight.status === 'PENDING',
    );
  const areasQuery = useAreas(activeCompetitionId, {
    refetchInterval: (query) =>
      isRealtimeActive
        ? false
        : Array.isArray(query.state.data) &&
            query.state.data.some(
              (area) => area.queueCount > 0 || area.nextFight !== null,
            )
          ? POLLING_INTERVAL
          : false,
  });
  const fightsQuery = useFights(activeCompetitionId, {
    refetchInterval: (query) =>
      isRealtimeActive
        ? false
        : Array.isArray(query.state.data) && shouldPollCompetitionData(query.state.data as Fight[])
          ? POLLING_INTERVAL
          : false,
  });
  const areas = areasQuery.data ?? [];
  const fights = fightsQuery.data ?? [];
  const shouldPollQueues = !isRealtimeActive && shouldPollCompetitionData(fights);

  const queueQueries = useQueries({
    queries: areas.map((area) => {
      const shouldPollAreaQueue =
        shouldPollQueues && (area.queueCount > 0 || area.nextFight !== null);
      const refetchInterval: number | false = shouldPollAreaQueue
        ? POLLING_INTERVAL
        : false;

      return {
        queryKey: ['dashboard-area-queue', area.id],
        queryFn: () => getAreaQueue(area.id),
        enabled:
          Boolean(activeCompetitionId) &&
          (isRealtimeActive || shouldPollAreaQueue),
        refetchInterval,
      };
    }),
  });

  const areaQueueMap = useMemo(() => {
    const map = new Map<string, AreaQueue>();
    areas.forEach((area, index) => {
      const data = queueQueries[index]?.data;
      if (data) {
        map.set(area.id, data);
      }
    });
    return map;
  }, [areas, queueQueries]);

  const dashboardAreas = useMemo(() => {
    return areas
      .filter((area) => areaFilter === 'ALL' || area.id === areaFilter)
      .map((area) => {
        const queueData = areaQueueMap.get(area.id);
        const currentFight =
          fights.find(
            (fight) => fight.areaId === area.id && fight.status === 'IN_PROGRESS',
          ) ?? null;
        const nextFight =
          queueData?.nextFight ??
          fights.find(
            (fight) => fight.areaId === area.id && fight.status === 'CALLED',
          ) ??
          fights.find(
            (fight) => fight.areaId === area.id && fight.status === 'PENDING',
          ) ??
          area.nextFight;
        const queue = queueData?.queue ?? [];

        return {
          ...area,
          currentFight,
          nextFight,
          queueSize: queue.length || area.queueCount,
        };
      });
  }, [areaFilter, areaQueueMap, areas, fights]);

  const inProgressFights = useMemo(() => {
    return fights.filter((fight) => {
      if (fight.status !== 'IN_PROGRESS') {
        return false;
      }

      if (areaFilter !== 'ALL' && fight.areaId !== areaFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && fight.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [areaFilter, fights, statusFilter]);

  const waitingFights = useMemo(() => {
    return fights.filter((fight) => {
      if (fight.status !== 'PENDING' && fight.status !== 'CALLED') {
        return false;
      }

      if (areaFilter !== 'ALL' && fight.areaId !== areaFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && fight.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [areaFilter, fights, statusFilter]);

  const isLoading =
    activeCompetitionId &&
    (areasQuery.isLoading || fightsQuery.isLoading || queueQueries.some((query) => query.isLoading));
  const isError = areasQuery.isError || fightsQuery.isError || queueQueries.some((query) => query.isError);
  const errorMessage =
    areasQuery.error instanceof Error
      ? areasQuery.error.message
      : fightsQuery.error instanceof Error
        ? fightsQuery.error.message
        : 'Falha ao carregar o dashboard.';

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Monitor de lutas por área
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Acompanhe a luta atual, a próxima chamada e as filas em atualização automática.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <MetricCard
              icon={<Radar className="h-5 w-5" />}
              label="Áreas ativas"
              value={String(dashboardAreas.length)}
            />
            <MetricCard
              icon={<Activity className="h-5 w-5" />}
              label="Em andamento"
              value={String(inProgressFights.length)}
            />
            <MetricCard
              icon={<Clock3 className="h-5 w-5" />}
              label="Aguardando"
              value={String(waitingFights.length)}
            />
          </div>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId ? (
        <StateCard
          message="Selecione uma competição no switcher superior para acompanhar o dashboard."
          tone="warning"
        />
      ) : null}

      {activeCompetitionId ? (
        <Card className="border-4 border-slate-900 p-0">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                Área
              </span>
              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value)}
                className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900"
              >
                <option value="ALL">Todas as áreas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
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
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="CALLED">Chamada</option>
                <option value="PENDING">Aguardando</option>
                <option value="FINISHED">Finalizadas</option>
              </select>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {activeCompetitionId && isLoading ? (
        <StateCard message="Atualizando lutas e filas..." />
      ) : null}

      {activeCompetitionId && !isLoading && isError ? (
        <StateCard message={errorMessage} tone="error" />
      ) : null}

      {activeCompetitionId && !isLoading && !isError ? (
        <>
          <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            {dashboardAreas.length === 0 ? (
              <StateCard
                message="Nenhuma área encontrada para a competição ativa."
                tone="empty"
              />
            ) : (
              dashboardAreas.map((area) => (
                <Card
                  key={area.id}
                  className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]"
                >
                  <CardContent className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                          {area.name}
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">
                          Fila com {area.queueSize} luta(s)
                        </h2>
                      </div>
                      <Link href={`/areas/${area.id}`}>
                        <Button variant="outline">
                          Abrir
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <DashboardFightBlock
                      title="Luta atual"
                      fight={area.currentFight}
                      emptyMessage="Nenhuma luta em andamento."
                      highlight="blue"
                    />

                    <DashboardFightBlock
                      title="Próxima luta"
                      fight={area.nextFight}
                      emptyMessage="Nenhuma luta aguardando."
                      highlight="amber"
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <FightListCard
              title="Em andamento"
              fights={inProgressFights}
              emptyMessage="Nenhuma luta em andamento para os filtros atuais."
            />
            <FightListCard
              title="Aguardando"
              fights={waitingFights}
              emptyMessage="Nenhuma luta aguardando para os filtros atuais."
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[180px] rounded-2xl border-4 border-slate-900 bg-amber-100 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-700">{icon}</div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function DashboardFightBlock({
  title,
  fight,
  emptyMessage,
  highlight,
}: {
  title: string;
  fight: Fight | null;
  emptyMessage: string;
  highlight: 'blue' | 'amber';
}) {
  const className =
    highlight === 'blue'
      ? 'border-blue-900 bg-blue-50'
      : 'border-amber-900 bg-amber-50';

  return (
    <div className={`rounded-2xl border-4 p-4 ${className}`}>
      <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-600">
        {title}
      </p>
      {fight ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={getFightStatusBadgeClassName(fight.status)}>
              {getFightStatusLabel(fight.status)}
            </span>
            {fight.categoryName ? (
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                {fight.categoryName}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-xl font-black text-slate-950">
            {formatFightLabel(fight)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {fight.keyGroupName || fight.areaName || 'Sem identificação'}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">{emptyMessage}</p>
      )}
    </div>
  );
}

function FightListCard({
  title,
  fights,
  emptyMessage,
}: {
  title: string;
  fights: Fight[];
  emptyMessage: string;
}) {
  return (
    <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <div className="border-b-4 border-slate-900 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-600">
        {title}
      </div>
      <div className="overflow-x-auto">
        <Table className="rounded-none border-0">
          <TableHeader className="bg-white">
            <TableRow className="hover:bg-white">
              <TableHead>Luta</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              fights.map((fight) => (
                <TableRow key={fight.id}>
                  <TableCell className="font-medium">{formatFightLabel(fight)}</TableCell>
                  <TableCell>{fight.areaName || '-'}</TableCell>
                  <TableCell>{fight.categoryName || '-'}</TableCell>
                  <TableCell>
                    <span className={getFightStatusBadgeClassName(fight.status)}>
                      {getFightStatusLabel(fight.status)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
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

function formatFightLabel(fight: Fight) {
  return `${fight.athleteA?.name || 'A definir'} vs ${fight.athleteB?.name || 'A definir'}`;
}
