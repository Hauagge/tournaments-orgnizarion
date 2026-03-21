'use client';

import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import {
  TeamFormValues,
  teamFormSchema,
} from '@/features/teams/schemas/team-form-schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type TeamFormDrawerProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TeamFormValues) => void | Promise<void>;
};

export function TeamFormDrawer({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TeamFormDrawerProps) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset({ name: '' });
    }
  }, [form, isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-950">
                Criar equipe
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Cadastre uma nova equipe na competição ativa.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="flex flex-1 flex-col justify-between px-6 py-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nome da equipe
              </span>
              <Input
                placeholder="Ex.: Checkmat Campinas"
                {...register('name')}
              />
              {errors.name ? (
                <span className="text-sm text-red-600">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Criar equipe'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
