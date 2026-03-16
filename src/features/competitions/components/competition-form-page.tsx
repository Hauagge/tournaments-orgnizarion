'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CompetitionForm } from '@/features/competitions/components/competition-form';
import {
  useCompetition,
  useCreateCompetition,
  useUpdateCompetition,
} from '@/features/competitions/hooks/use-competitions';
import { CompetitionFormValues } from '@/features/competitions/schemas/competition-form-schema';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';

type CompetitionFormPageProps = {
  competitionId?: string;
};

export default function CompetitionFormPage({
  competitionId,
}: CompetitionFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const setActiveCompetitionId = useCompetitionStore(
    (state) => state.setActiveCompetitionId,
  );

  const isEditing = Boolean(competitionId);
  const competitionQuery = useCompetition(competitionId ?? '');
  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition(competitionId ?? '');

  async function handleSubmit(values: CompetitionFormValues) {
    try {
      const savedCompetition = isEditing
        ? await updateMutation.mutateAsync(values)
        : await createMutation.mutateAsync(values);

      setActiveCompetitionId(savedCompetition.id);
      toast({
        title: isEditing ? 'Competição atualizada' : 'Competição criada',
        description: `${savedCompetition.name} foi salva com sucesso.`,
        variant: 'success',
      });
      router.push('/competitions');
    } catch (error) {
      toast({
        title: 'Falha ao salvar',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar a competição.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <Link href="/competitions" className="w-fit">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para competições
          </Button>
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {isEditing ? 'Editar competição' : 'Nova competição'}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {isEditing
              ? 'Atualize as regras da competição'
              : 'Configure uma nova competição'}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Defina o formato do torneio, duração das lutas e tolerâncias usadas
            nas regras de pesagem e divisão etária.
          </p>
        </div>
      </header>

      {competitionQuery.isLoading && isEditing && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competição...
          </CardContent>
        </Card>
      )}

      {competitionQuery.isError && isEditing && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">
            {competitionQuery.error instanceof Error
              ? competitionQuery.error.message
              : 'Falha ao carregar a competição.'}
          </CardContent>
        </Card>
      )}

      {(!isEditing || competitionQuery.data) && (
        <CompetitionForm
          defaultValues={competitionQuery.data}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          submitLabel={isEditing ? 'Salvar alterações' : 'Criar competição'}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
