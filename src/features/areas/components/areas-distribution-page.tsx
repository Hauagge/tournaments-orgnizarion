'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { useAreas, useDistributeAreaFights } from '@/features/areas/hooks/use-areas';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { getCompetitionEntry } from '@/features/competitions/lib/competition-flow';
import { useFights } from '@/features/fights/hooks/use-fights';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';

export default function AreasDistributionPage() {
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const athletesQuery = useAthletes(activeCompetitionId, '');
  const areasQuery = useAreas(activeCompetitionId);
  const fightsQuery = useFights(activeCompetitionId);
  const distributeMutation = useDistributeAreaFights(activeCompetitionId);
  const { toast } = useToast();

  const areas = areasQuery.data ?? [];
  const fights = fightsQuery.data ?? [];
  const distributedFights = fights.filter((fight) => Boolean(fight.areaId));
  const pendingDistributionFights = fights.filter((fight) => !fight.areaId);
  const readiness = athletesQuery.data
    ? buildAthleteReadinessSummary(athletesQuery.data)
    : null;
  const flowEntry = competitionQuery.data
    ? getCompetitionEntry(competitionQuery.data.mode, readiness)
    : null;
  const canDistribute =
    fights.length > 0 &&
    areas.length > 0 &&
    pendingDistributionFights.length > 0;
  const canOpenAreaOperation =
    distributedFights.length > 0 && pendingDistributionFights.length === 0;

  async function handleDistribute() {
    if (!activeCompetitionId || !canDistribute) {
      return;
    }

    try {
      await distributeMutation.mutateAsync();
      toast({
        title: 'Lutas distribuídas',
        description: 'As filas das áreas foram atualizadas.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao distribuir lutas',
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
              Áreas / Distribuição
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Distribua as lutas entre as áreas
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Acione a distribuição para montar as filas e abra cada área para operar a chamada.
            </p>
          </div>

          <Button
            onClick={() => void handleDistribute()}
            disabled={
              !activeCompetitionId ||
              !hasHydrated ||
              distributeMutation.isPending ||
              areasQuery.isLoading ||
              fightsQuery.isLoading ||
              !canDistribute
            }
            className={`h-14 rounded-2xl border-4 border-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] ${
              canDistribute
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {distributeMutation.isPending ? 'Distribuindo...' : 'Distribuir lutas'}
          </Button>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competição no topo para distribuir as lutas."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
          <CardContent className="space-y-4 p-5">
            {fightsQuery.isLoading ? <InlineState message="Carregando lutas..." /> : null}
            {fightsQuery.isError ? (
              <InlineState
                message={
                  fightsQuery.error instanceof Error
                    ? fightsQuery.error.message
                    : 'Falha ao carregar lutas.'
                }
                tone="error"
              />
            ) : null}

            {!fightsQuery.isLoading && !fightsQuery.isError ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ValidationMetric
                  label="Lutas totais"
                  value={String(fights.length)}
                />
                <ValidationMetric
                  label="Lutas pendentes"
                  value={String(pendingDistributionFights.length)}
                  tone={
                    pendingDistributionFights.length > 0 ? 'warning' : 'default'
                  }
                />
                <ValidationMetric
                  label="Lutas distribuídas"
                  value={String(distributedFights.length)}
                  tone={
                    distributedFights.length > 0 ? 'success' : 'default'
                  }
                />
                <ValidationMetric
                  label="Áreas cadastradas"
                  value={String(areas.length)}
                  tone={areas.length > 0 ? 'success' : 'warning'}
                />
              </div>
            ) : null}

            {!fightsQuery.isLoading && !fightsQuery.isError ? (
              canDistribute ? (
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
                  A competição está pronta para distribuir lutas: existem confrontos pendentes e áreas disponíveis.
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">
                    A distribuição ainda não é a próxima ação recomendada.
                  </p>
                  <p className="mt-1">
                    Revise primeiro o ponto do fluxo que ainda está bloqueando a montagem das filas.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {fights.length === 0 && flowEntry ? (
                      <Link href={flowEntry.href}>
                        <Button type="button">
                          {flowEntry.label}
                        </Button>
                      </Link>
                    ) : null}
                    {fights.length === 0 && !flowEntry ? (
                      <Button type="button" disabled variant="outline">
                        Aguarde a competição carregar
                      </Button>
                    ) : null}
                    {areas.length === 0 ? (
                      <Link href="/areas">
                        <Button type="button" variant="outline">
                          Configurar áreas
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            ) : null}

            {canOpenAreaOperation ? (
              <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 text-sm text-sky-950">
                <p className="font-semibold">
                  Distribuição pronta para operação.
                </p>
                <p className="mt-1">
                  Todas as lutas já estão distribuídas. O próximo passo recomendado é abrir a operação das áreas para iniciar as chamadas.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/areas">
                    <Button type="button">
                      Abrir operação das áreas
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {areasQuery.isLoading && <InlineState message="Carregando áreas..." />}
            {areasQuery.isError && (
              <InlineState
                message={areasQuery.error instanceof Error ? areasQuery.error.message : 'Falha ao carregar áreas.'}
                tone="error"
              />
            )}
            {!areasQuery.isLoading && !areasQuery.isError && areas.length === 0 && (
              <InlineState message="Cadastre áreas antes de distribuir as lutas." tone="empty" />
            )}

            {!areasQuery.isLoading && !areasQuery.isError && areas.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {areas.map((area) => (
                  <Link key={area.id} href={`/areas/${area.id}`}>
                    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-amber-50">
                      <p className="text-lg font-black text-slate-950">{area.name}</p>
                      <p className="mt-2 text-sm text-slate-600">Fila atual: {area.queueCount} luta(s)</p>
                      <div className="mt-3 space-y-1 text-sm text-slate-500">
                        {getAreaPreviewFights(area).length === 0 ? (
                          <p>Nenhuma luta distribuída</p>
                        ) : (
                          getAreaPreviewFights(area).map((fight, index) => (
                            <p key={`${fight.id}-${index}`}>
                              {index + 1}. {formatFightLabel(fight)}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StateCard({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'warning';
}) {
  const toneClassName = tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-300 bg-white text-slate-600';

  return (
    <Card className={`border-4 p-0 ${toneClassName}`}>
      <CardContent className="p-6">{message}</CardContent>
    </Card>
  );
}

function InlineState({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'error' | 'empty';
}) {
  const className =
    tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-700'
      : tone === 'empty'
      ? 'border-slate-300 bg-slate-50 text-slate-600'
      : 'border-slate-300 bg-white text-slate-600';

  return <div className={`rounded-2xl border p-4 text-sm ${className}`}>{message}</div>;
}

function ValidationMetric({
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
    <div className={`rounded-2xl border-2 p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function formatFightLabel(fight: { athleteA?: { name?: string } | null; athleteB?: { name?: string } | null } | null) {
  if (!fight) {
    return 'Nenhuma luta distribuida';
  }

  return `${fight.athleteA?.name || 'A definir'} vs ${fight.athleteB?.name || 'A definir'}`;
}

function getAreaPreviewFights(area: {
  nextFight:
    | {
        id?: string;
        athleteA?: { name?: string } | null;
        athleteB?: { name?: string } | null;
      }
    | null;
  queue: Array<{
    id?: string;
    athleteA?: { name?: string } | null;
    athleteB?: { name?: string } | null;
  }>;
}) {
  const fights = [area.nextFight, ...area.queue].filter(
    (fight): fight is NonNullable<typeof fight> => Boolean(fight),
  );
  const seen = new Set<string>();

  return fights
    .filter((fight, index) => {
      const key = fight.id ?? `fight-${index}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}
