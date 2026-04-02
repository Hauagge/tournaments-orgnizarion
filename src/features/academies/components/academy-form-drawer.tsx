'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  AcademyFormValues,
  academyFormSchema,
} from '@/features/academies/schemas/academy-form-schema';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

type AcademyFormDrawerProps = {
  defaultName?: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  title: string;
  description: string;
  onClose: () => void;
  onSubmit: (values: AcademyFormValues) => void | Promise<void>;
};

export function AcademyFormDrawer({
  defaultName = '',
  isOpen,
  isSubmitting = false,
  submitLabel,
  title,
  description,
  onClose,
  onSubmit,
}: AcademyFormDrawerProps) {
  const form = useForm<AcademyFormValues>({
    resolver: zodResolver(academyFormSchema),
    defaultValues: {
      name: defaultName,
    },
  });

  useEffect(() => {
    form.reset({ name: defaultName });
  }, [defaultName, form, isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-md translate-x-0 translate-y-0 rounded-none border-l-4 border-slate-900 p-0">
        <div className="flex h-full flex-col bg-white">
          <DialogHeader className="border-b-4 border-slate-900 px-6 py-5 text-left">
            <DialogTitle className="text-xl font-black text-slate-950">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {description}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex flex-1 flex-col justify-between px-6 py-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nome da academia
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

            <DialogFooter className="border-t border-slate-200 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
