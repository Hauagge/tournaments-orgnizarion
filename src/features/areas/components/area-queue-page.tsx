'use client';

import Link from 'next/link';
import { ArrowLeft, Megaphone } from 'lucide-react';
import {
  useCallNextAreaFight,
  useAreaQueue,
} from '@/features/areas/hooks/use-areas';
import {
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
import { useToast } from '@/shared/ui/use-toast';

export default function AreaQueuePage({ areaId }: { areaId: string }) {
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const queueQuery = useAreaQueue(areaId);
  const callNextMutation = useCallNextAreaFight(activeCompetitionId, areaId);
  const { toast } = useToast();
 // TODO: Adicionar mais lutas na fila e mostrar em tela

 //TODO:Adicionar campo de confirmação de pagamento de pagamento: PENDENTE, PAGO, ISENTO
  const area = queueQuery.data?.area ?? null;
  const nextFight = queueQuery.data?.nextFight ?? null;
  const queue = queueQuery.data?.queue ?? [];

  async function handleCallNext() {
    try {
      await callNextMutation.mutateAsync();
      toast({
        title: 'Proxima luta chamada',
        description: 'A fila da area foi atualizada.',
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
            <Link
              href="/areas"
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500 hover:text-slate-950"
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
            disabled={callNextMutation.isPending || !areaId}
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
          <Card className="border-4 border-slate-900 p-0 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Proxima luta
              </p>

              {nextFight ? (
                <div className="rounded-[24px] border-4 border-slate-900 bg-amber-100 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={getFightStatusBadgeClassName(nextFight.status)}
                    >
                      {getFightStatusLabel(nextFight.status)}
                    </span>
                    {nextFight.categoryName ? (
                      <span className="inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-900">
                        {nextFight.categoryName}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                    {nextFight.athleteA?.name || 'A definir'} vs{' '}
                    {nextFight.athleteB?.name || 'A definir'}
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

          <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead>Posicao</TableHead>
                    <TableHead>Luta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categoria</TableHead>
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
                        <TableCell className="font-semibold">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          {fight.athleteA?.name || 'A definir'} vs{' '}
                          {fight.athleteB?.name || 'A definir'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={getFightStatusBadgeClassName(
                              fight.status,
                            )}
                          >
                            {getFightStatusLabel(fight.status)}
                          </span>
                        </TableCell>
                        <TableCell>{fight.categoryName || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
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
