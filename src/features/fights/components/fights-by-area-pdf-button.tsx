'use client';

import React, { useState } from 'react';
import { FileDown, LoaderCircle } from 'lucide-react';
import { useExportFightsByAreaPdf } from '@/features/fights/hooks/use-fights';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/use-toast';

type FightsByAreaPdfButtonProps = {
  competitionId: string | null;
  disabled?: boolean;
};

const genericPdfErrorMessage =
  'Não foi possível gerar o PDF de lutas por área. Tente novamente.';

export function FightsByAreaPdfButton({
  competitionId,
  disabled = false,
}: FightsByAreaPdfButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutation = useExportFightsByAreaPdf(competitionId);
  const { toast } = useToast();

  const isBusy = mutation.isPending || isSubmitting;
  const isDisabled = disabled || !competitionId || isBusy;

  async function handleExportPdf() {
    if (isDisabled) {
      return;
    }

    try {
      setIsSubmitting(true);
      await mutation.mutateAsync();
      toast({
        title: 'PDF gerado',
        description: 'PDF de lutas por área gerado com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao gerar PDF',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isDisabled}
      onClick={() => void handleExportPdf()}
      className="h-12 rounded-2xl border-4 border-slate-900 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-900 hover:bg-slate-100"
    >
      {isBusy ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Gerar PDF de lutas por área
        </>
      )}
    </Button>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return genericPdfErrorMessage;
}
