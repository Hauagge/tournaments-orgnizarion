'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Settings2 } from 'lucide-react';
import { useCreateAreas, useAreas } from '@/features/areas/hooks/use-areas';
import { RoleGuard } from '@/features/auth/components/role-guard';
import { useRoleAccess } from '@/features/auth/hooks/use-role-access';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/use-toast';

export default function AreasPage() {
  const [areaCount, setAreaCount] = useState(2);
  const [areaNames, setAreaNames] = useState<string[]>(['Area 1', 'Area 2']);

  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const areasQuery = useAreas(activeCompetitionId);
  const createMutation = useCreateAreas(activeCompetitionId);
  const { toast } = useToast();
  const { isAllowed: canCreateAreas } = useRoleAccess({
    deny: ['DESK', 'PUBLIC'],
  });

  useEffect(() => {
    setAreaNames((current) => {
      if (areaCount === current.length) return current;
      const next = Array.from({ length: areaCount }, (_, index) => current[index] ?? `Area ${index + 1}`);
      return next;
    });
  }, [areaCount]);

  const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data]);

  async function handleCreateAreas() {
    if (!activeCompetitionId || areaCount <= 0) {
      return;
    }

    try {
      await createMutation.mutateAsync({
        count: areaCount,
        names: areaNames,
      });
      toast({
        title: 'Areas criadas',
        description: 'A configuracao da competicao foi atualizada.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar areas',
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
              Areas
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Configure e acompanhe as areas da competicao
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Cadastre a quantidade de areas, personalize os nomes e abra a fila de cada uma.
            </p>
          </div>

          <RoleGuard deny={['DESK', 'PUBLIC']}>
            <Link href="/areas/distribution">
              <Button className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800">
                Distribuir lutas
              </Button>
            </Link>
          </RoleGuard>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competicao ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competicao no topo para configurar as areas."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <>
          <div
            className={`grid gap-6 ${
              canCreateAreas
                ? 'xl:grid-cols-[0.9fr_1.1fr]'
                : 'xl:grid-cols-1'
            }`}
          >
            <RoleGuard deny={['DESK', 'PUBLIC']}>
              <Card className="border-4 border-slate-900 p-0">
                <CardContent className="space-y-5 p-5">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      Criar areas
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Defina quantidade e nomes
                    </h2>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                      Quantidade de areas
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={areaCount}
                      onChange={(event) =>
                        setAreaCount(Math.max(1, Number(event.target.value) || 1))
                      }
                    />
                  </label>

                  <div className="space-y-3">
                    {areaNames.map((name, index) => (
                      <label key={index} className="block space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Nome da area {index + 1}
                        </span>
                        <Input
                          value={name}
                          onChange={(event) => {
                            const next = [...areaNames];
                            next[index] = event.target.value;
                            setAreaNames(next);
                          }}
                          placeholder={`Ex.: Tatame ${index + 1}`}
                        />
                      </label>
                    ))}
                  </div>

                  <Button
                    onClick={() => void handleCreateAreas()}
                    disabled={!activeCompetitionId || createMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createMutation.isPending ? 'Salvando...' : 'Criar areas'}
                  </Button>
                </CardContent>
              </Card>
            </RoleGuard>

            <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      Areas cadastradas
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Abra a fila de cada area
                    </h2>
                  </div>
                  <Settings2 className="h-5 w-5 text-slate-400" />
                </div>

                {areasQuery.isLoading && <InlineState message="Carregando areas..." />}
                {areasQuery.isError && (
                  <InlineState
                    message={areasQuery.error instanceof Error ? areasQuery.error.message : 'Falha ao carregar areas.'}
                    tone="error"
                  />
                )}
                {!areasQuery.isLoading && !areasQuery.isError && areas.length === 0 && (
                  <InlineState message="Nenhuma area cadastrada para esta competicao." tone="empty" />
                )}

                {!areasQuery.isLoading && !areasQuery.isError && areas.length > 0 && (
                  <div className="grid gap-3">
                    {areas.map((area) => (
                      <Link key={area.id} href={`/areas/${area.id}`}>
                        <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-amber-50">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-black text-slate-950">{area.name}</p>
                              <p className="mt-1 text-sm text-slate-600">
                                {area.queueCount} luta(s) na fila
                              </p>
                              <div className="mt-3 space-y-1 text-sm text-slate-500">
                                {getAreaPreviewFights(area).length === 0 ? (
                                  <p>Nenhuma luta distribuida</p>
                                ) : (
                                  getAreaPreviewFights(area).map((fight, index) => (
                                    <p key={`${fight.id}-${index}`}>
                                      {index + 1}. {formatFightLabel(fight)}
                                    </p>
                                  ))
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-500" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
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
