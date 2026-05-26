'use client';

import React, { useState } from 'react';
import { LoaderCircle, UsersRound } from 'lucide-react';
import { useDistributeAthletesInCategories } from '@/features/categories/hooks/use-categories';
import { DistributeAthletesResponse } from '@/features/categories/types/category';
import AlertDialog, {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alertDialog';
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
import { useToast } from '@/shared/ui/use-toast';

type DistributeAthletesButtonProps = {
  competitionId: string | null;
  disabled?: boolean;
  className?: string;
};

const genericDistributionErrorMessage =
  'Não foi possível distribuir os atletas nas categorias. Tente novamente.';

export function DistributeAthletesButton({
  competitionId,
  disabled = false,
  className,
}: DistributeAthletesButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distributionResult, setDistributionResult] =
    useState<DistributeAthletesResponse | null>(null);
  const mutation = useDistributeAthletesInCategories(competitionId);
  const { toast } = useToast();

  const isBusy = mutation.isPending || isSubmitting;
  const isButtonDisabled = disabled || !competitionId || isBusy;

  async function handleConfirmDistribution() {
    if (!competitionId || isBusy) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await mutation.mutateAsync(false);
      setDistributionResult(response);
      setIsConfirmOpen(false);
      setIsResultOpen(response.summary.notAllocatedCount > 0);
      toast({
        title: 'Distribuição concluída',
        description: buildDistributionSummary(response.summary),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao distribuir atletas',
        description: getDistributionErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <Button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isButtonDisabled}
          className={className}
        >
          {isBusy ? (
            <>
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              Distribuindo atletas...
            </>
          ) : (
            <>
              <UsersRound className="mr-2 h-5 w-5" />
              Distribuir atletas nas categorias
            </>
          )}
        </Button>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar distribuição automática</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá distribuir automaticamente os atletas nas categorias
              existentes conforme faixa, peso, idade e regras de mescla
              configuradas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmDistribution()}
              disabled={isBusy}
              aria-label="Confirmar distribuição"
            >
              {isBusy ? 'Distribuindo...' : 'Confirmar distribuição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {distributionResult ? (
        <Card className="border-4 border-emerald-300 bg-emerald-50 p-0 shadow-[6px_6px_0_0_rgba(5,150,105,0.18)]">
          <CardContent className="space-y-3 p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-emerald-950">
                Resultado da distribuição
              </h2>
              <p className="text-sm text-emerald-900">
                {buildDistributionSummary(distributionResult.summary)}
              </p>
            </div>

            {distributionResult.summary.notAllocatedCount > 0 ? (
              <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 lg:flex-row lg:items-center lg:justify-between">
                <p>
                  {distributionResult.summary.notAllocatedCount} atleta(s) não
                  foram alocados. Revise os motivos antes de seguir.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResultOpen(true)}
                >
                  Ver não alocados
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atletas não alocados</DialogTitle>
            <DialogDescription>
              Revise os atletas que ficaram fora da distribuição automática e
              os motivos informados pelo backend.
            </DialogDescription>
          </DialogHeader>

          {distributionResult?.notAllocated.length ? (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {distributionResult.notAllocated.map((athlete) => (
                <div
                  key={`${athlete.athleteId}-${athlete.athleteName}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-950">
                    {athlete.athleteName}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {athlete.reasons.map((reason) => (
                      <li key={`${athlete.athleteId}-${reason}`}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Todos os atletas foram alocados nesta distribuição.
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsResultOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildDistributionSummary(
  summary: DistributeAthletesResponse['summary'],
) {
  return `Distribuição concluída: ${summary.allocatedCount} de ${summary.totalAthletes} atletas alocados. ${summary.notAllocatedCount} atletas não foram alocados.`;
}

function getDistributionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return genericDistributionErrorMessage;
}
