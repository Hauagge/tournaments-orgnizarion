'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ArrowLeftRight, RefreshCcw } from 'lucide-react';
import { ApiError } from '@/shared/api/fetch-client';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import {
  useAreas,
  useDistributeFightsFull,
  useDistributeFightsIncremental,
} from '@/features/areas/hooks/use-areas';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { getCompetitionEntry } from '@/features/competitions/lib/competition-flow';
import { useFights } from '@/features/fights/hooks/use-fights';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

const DEFAULT_REST_GAP_FIGHTS = 2;
const DEFAULT_AGE_SPLIT_YEARS = 2;

export default function AreasDistributionPage() {
  const [restGapFights, setRestGapFights] = useState(DEFAULT_REST_GAP_FIGHTS);
  const [ageSplitYears, setAgeSplitYears] = useState(DEFAULT_AGE_SPLIT_YEARS);

  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const competitionQuery = useCompetition(activeCompetitionId ?? '');
  const athletesQuery = useAthletes(activeCompetitionId, '');
  const areasQuery = useAreas(activeCompetitionId);
  const fightsQuery = useFights(activeCompetitionId);
  const distributeFullMutation = useDistributeFightsFull(activeCompetitionId);
  const distributeIncrementalMutation = useDistributeFightsIncremental(activeCompetitionId);
  const { toast } = useToast();

  const areas = areasQuery.data ?? [];
  const fights = fightsQuery.data ?? [];
  const distributedFights = fights.filter((fight) => Boolean(fight.areaId));
  const pendingDistributionFights = fights.filter((fight) => !fight.areaId);
  const pendingFightIds = useMemo(
    () =>
      pendingDistributionFights
        .map((fight) => Number(fight.id))
        .filter((fightId) => Number.isInteger(fightId) && fightId > 0),
    [pendingDistributionFights],
  );
  const hasPendingFightIds = pendingFightIds.length === pendingDistributionFights.length;
  const readiness = athletesQuery.data
    ? buildAthleteReadinessSummary(athletesQuery.data)
    : null;
  const flowEntry = competitionQuery.data
    ? getCompetitionEntry(competitionQuery.data.mode, readiness)
    : null;
  const canRunFullDistribution =
    fights.length > 0 &&
    areas.length > 0 &&
    !distributeFullMutation.isPending &&
    !distributeIncrementalMutation.isPending;
  const canRunIncrementalDistribution =
    pendingDistributionFights.length > 0 &&
    areas.length > 0 &&
    hasPendingFightIds &&
    !distributeFullMutation.isPending &&
    !distributeIncrementalMutation.isPending;
  const canOpenAreaOperation =
    distributedFights.length > 0 && pendingDistributionFights.length === 0;

  async function handleFullDistribution() {
    if (!activeCompetitionId || !canRunFullDistribution) {
      return;
    }

    try {
      await distributeFullMutation.mutateAsync({
        restGapFights,
        ageSplitYears,
      });
      toast({
        title: 'Redistribuição total concluída',
        description: 'O backend recompôs toda a fila da competição.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao redistribuir tudo',
        description: getDistributionErrorMessage(error, 'FULL'),
        variant: 'destructive',
      });
    }
  }

  async function handleIncrementalDistribution() {
    if (!activeCompetitionId || !canRunIncrementalDistribution) {
      return;
    }

    try {
      await distributeIncrementalMutation.mutateAsync({
        restGapFights,
        fightIds: pendingFightIds,
      });
      toast({
        title: 'Novas lutas distribuídas',
        description: `${pendingFightIds.length} luta(s) foram anexadas às filas pelo backend.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao distribuir novas lutas',
        description: getDistributionErrorMessage(error, 'INCREMENTAL'),
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
              Controle a distribuição manual das lutas
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              O backend agora decide a alocação. Use esta tela apenas para redistribuição total ou para anexar lutas novas às filas existentes.
            </p>
          </div>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competição ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competição no topo para operar a distribuição."
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
                <ValidationMetric label="Lutas totais" value={String(fights.length)} />
                <ValidationMetric
                  label="Sem área"
                  value={String(pendingDistributionFights.length)}
                  tone={pendingDistributionFights.length > 0 ? 'warning' : 'default'}
                />
                <ValidationMetric
                  label="Distribuídas"
                  value={String(distributedFights.length)}
                  tone={distributedFights.length > 0 ? 'success' : 'default'}
                />
                <ValidationMetric
                  label="Áreas cadastradas"
                  value={String(areas.length)}
                  tone={areas.length > 0 ? 'success' : 'warning'}
                />
              </div>
            ) : null}

            <Card className="border-2 border-slate-300 p-0 shadow-none">
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[repeat(2,minmax(0,220px))_1fr]">
                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    Descanso mínimo
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={restGapFights}
                    onChange={(event) =>
                      setRestGapFights(Math.max(0, Number(event.target.value) || 0))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                    Separação etária
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={ageSplitYears}
                    onChange={(event) =>
                      setAgeSplitYears(Math.max(0, Number(event.target.value) || 0))
                    }
                  />
                </label>

                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">Bloqueio operacional do backend</p>
                  <p className="mt-1">
                    A redistribuição total falha se existir qualquer luta em <code>CALLED</code> ou <code>IN_PROGRESS</code>. A incremental também falha se algum <code>fightId</code> enviado estiver nesses estados.
                  </p>
                </div>
              </CardContent>
            </Card>

            {!fightsQuery.isLoading && !fightsQuery.isError ? (
              fights.length === 0 ? (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">
                    Ainda não há lutas para distribuir.
                  </p>
                  <p className="mt-1">
                    Volte para a etapa anterior do fluxo e gere os confrontos antes de usar a distribuição manual.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {flowEntry ? (
                      <Link href={flowEntry.href}>
                        <Button type="button">{flowEntry.label}</Button>
                      </Link>
                    ) : (
                      <Button type="button" disabled variant="outline">
                        Aguarde a competição carregar
                      </Button>
                    )}
                  </div>
                </div>
              ) : null
            ) : null}

            {areasQuery.isLoading && <InlineState message="Carregando áreas..." />}
            {areasQuery.isError && (
              <InlineState
                message={areasQuery.error instanceof Error ? areasQuery.error.message : 'Falha ao carregar áreas.'}
                tone="error"
              />
            )}
            {!areasQuery.isLoading && !areasQuery.isError && areas.length === 0 && (
              <InlineState message="Cadastre áreas antes de usar a distribuição manual." tone="empty" />
            )}

            {!areasQuery.isLoading && !areasQuery.isError && fights.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <ActionCard
                  title="Redistribuir tudo"
                  description="Reconstrói toda a fila da competição com o modo FULL. Use apenas quando fizer sentido reordenar tudo."
                  icon={<RefreshCcw className="h-4 w-4" />}
                  disabled={!canRunFullDistribution || !activeCompetitionId || !hasHydrated || fightsQuery.isLoading || areasQuery.isLoading}
                  busy={distributeFullMutation.isPending}
                  buttonLabel="Redistribuir tudo"
                  onClick={() => void handleFullDistribution()}
                >
                  <p>
                    Payload enviado: <code>{`{ mode: "FULL", restGapFights: ${restGapFights}, ageSplitYears: ${ageSplitYears} }`}</code>
                  </p>
                </ActionCard>

                <ActionCard
                  title="Distribuir novas lutas"
                  description="Anexa apenas as lutas ainda sem área ao final das filas, preservando o que já está montado."
                  icon={<ArrowLeftRight className="h-4 w-4" />}
                  disabled={
                    !canRunIncrementalDistribution ||
                    !activeCompetitionId ||
                    !hasHydrated ||
                    fightsQuery.isLoading ||
                    areasQuery.isLoading
                  }
                  busy={distributeIncrementalMutation.isPending}
                  buttonLabel="Distribuir novas lutas"
                  onClick={() => void handleIncrementalDistribution()}
                >
                  <p>
                    Payload enviado: <code>{`{ mode: "INCREMENTAL", restGapFights: ${restGapFights}, fightIds: [${pendingFightIds.join(', ')}] }`}</code>
                  </p>
                  {!hasPendingFightIds && pendingDistributionFights.length > 0 ? (
                    <p className="mt-2 text-red-700">
                      Existem lutas sem <code>id</code> numérico válido para montar o payload incremental.
                    </p>
                  ) : null}
                </ActionCard>
              </div>
            ) : null}

            {canOpenAreaOperation ? (
              <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 text-sm text-sky-950">
                <p className="font-semibold">Distribuição pronta para operação.</p>
                <p className="mt-1">
                  Todas as lutas atuais já estão com área definida. O próximo passo útil é abrir as áreas e operar as chamadas.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/areas">
                    <Button type="button">Abrir operação das áreas</Button>
                  </Link>
                </div>
              </div>
            ) : null}

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

function getDistributionErrorMessage(
  error: unknown,
  mode: 'FULL' | 'INCREMENTAL',
) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Tente novamente.';
  }

  const normalizedMessage = error.message.toLowerCase();
  const normalizedCode = error.code?.toLowerCase() ?? '';
  const hints = `${normalizedCode} ${normalizedMessage}`;

  if (
    hints.includes('called') ||
    hints.includes('in_progress') ||
    hints.includes('in progress') ||
    hints.includes('blocked while there')
  ) {
    return mode === 'FULL'
      ? 'A redistribuição total está bloqueada porque existe luta em chamada ou em andamento.'
      : 'A distribuição incremental está bloqueada porque a lista enviada contém luta em chamada ou em andamento.';
  }

  return error.message;
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

function ActionCard({
  title,
  description,
  icon,
  buttonLabel,
  busy,
  disabled,
  children,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  buttonLabel: string;
  busy: boolean;
  disabled: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full border border-slate-300 bg-white p-2 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm text-slate-700">{description}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {children}
      </div>

      <Button
        onClick={onClick}
        disabled={disabled}
        className="mt-4 h-12 rounded-2xl border-4 border-slate-900 bg-slate-900 px-5 text-sm font-black uppercase tracking-[0.12em] hover:bg-slate-800"
      >
        {busy ? 'Processando...' : buttonLabel}
      </Button>
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
