'use client';

import { useState } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from '../button';

// Ajuste os paths dos stores conforme sua estrutura
import { useAthleteStore } from '@/app/store/useAthleteStore';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { useToast } from '../use-toast';
import AlertDialog, {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../alertDialog';

type Props = {
  className?: string;
  label?: string;
};

export default function ClearStorageButton({
  className,
  label = 'Limpar dados',
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const aStore = useAthleteStore;
  const cStore = useCategoryStore;

  async function handleConfirm() {
    try {
      // 1) Limpando persist (se usar zustand/persist)
      await aStore?.persist?.clearStorage?.();
      await cStore?.persist?.clearStorage?.();

      // 2) Limpando estados em memória
      useAthleteStore.setState({ athletes: [] });
      useCategoryStore.setState({ categories: [] });

      // 3) (Opcional) forçar rehydrate do persist
      await aStore?.persist?.rehydrate?.();
      await cStore?.persist?.rehydrate?.();

      toast({
        title: 'Dados limpos',
        description: 'Atletas e chaves foram removidos do armazenamento local.',
        variant: 'success',
      });
    } catch (err) {
      // Fallback: se não tiver persist configurado, pelo menos limpa o estado
      try {
        useAthleteStore.setState({ athletes: [] });
        useCategoryStore.setState({ categories: [] });
      } catch {}
      if (err instanceof Error && err.message) {
        toast({
          title: 'Falha ao limpar',
          description:
            err?.message ??
            `Não foi possível limpar o armazenamento. Tente novamente:${err.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Falha ao limpar',
          description:
            'Não foi possível limpar o armazenamento. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
        title="Limpar atletas e chaves salvos no navegador"
      >
        <Eraser className="h-4 w-4 mr-2" />
        {label}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar dados locais?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai remover <strong>todos os atletas</strong> e{' '}
              <strong>todas as chaves/categorias</strong> salvas no navegador
              (localStorage). Você poderá importar/criar novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} closeOnClick>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
