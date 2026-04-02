'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { useAreas, useDistributeAreaFights } from '@/features/areas/hooks/use-areas';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';

export default function AreasDistributionPage() {
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const areasQuery = useAreas(activeCompetitionId);
  const distributeMutation = useDistributeAreaFights(activeCompetitionId);
  const { toast } = useToast();

  const areas = areasQuery.data ?? [];

  async function handleDistribute() {
    if (!activeCompetitionId) {
      return;
    }

    try {
      await distributeMutation.mutateAsync();
      toast({
        title: 'Lutas distribuidas',
        description: 'As filas das areas foram atualizadas.',
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
              Areas / Distribution
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Distribua as lutas entre as areas
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Acione a distribuicao para montar as filas e abra cada area para operar a chamada.
            </p>
          </div>

          <Button
            onClick={() => void handleDistribute()}
            disabled={!activeCompetitionId || !hasHydrated || distributeMutation.isPending}
            className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {distributeMutation.isPending ? 'Distribuindo...' : 'Distribuir lutas'}
          </Button>
        </div>
      </header>

      {!hasHydrated && <StateCard message="Carregando competicao ativa..." />}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competicao no topo para distribuir as lutas."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
          <CardContent className="space-y-4 p-5">
            {areasQuery.isLoading && <InlineState message="Carregando areas..." />}
            {areasQuery.isError && (
              <InlineState
                message={areasQuery.error instanceof Error ? areasQuery.error.message : 'Falha ao carregar areas.'}
                tone="error"
              />
            )}
            {!areasQuery.isLoading && !areasQuery.isError && areas.length === 0 && (
              <InlineState message="Cadastre areas antes de distribuir as lutas." tone="empty" />
            )}

            {!areasQuery.isLoading && !areasQuery.isError && areas.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {areas.map((area) => (
                  <Link key={area.id} href={`/areas/${area.id}`}>
                    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-amber-50">
                      <p className="text-lg font-black text-slate-950">{area.name}</p>
                      <p className="mt-2 text-sm text-slate-600">Fila atual: {area.queueCount} luta(s)</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Proxima: {area.nextFight ? `${area.nextFight.athleteA?.name || 'A definir'} vs ${area.nextFight.athleteB?.name || 'A definir'}` : 'Nenhuma luta distribuida'}
                      </p>
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
