'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAreas } from '@/features/areas/hooks/use-areas';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { FightFormDialog } from '@/features/fights/components/fight-form-dialog';
import { useCreateFight, useFights } from '@/features/fights/hooks/use-fights';
import {
  getFightRoundLabel,
  getFightStatusLabel,
  resolveFightWinnerName,
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

export default function CategoryPage() {
  const router = useRouter();
  const { categoryName } = useParams<{ categoryName: string }>();
  const decodedCategoryName = decodeURIComponent(categoryName);
  const [isFightFormOpen, setIsFightFormOpen] = useState(false);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const categoriesQuery = useCategories(activeCompetitionId);
  const athletesQuery = useAthletes(activeCompetitionId, '');
  const fightsQuery = useFights(activeCompetitionId);
  const areasQuery = useAreas(activeCompetitionId);
  const createFightMutation = useCreateFight(activeCompetitionId);
  const { toast } = useToast();

  const category = useMemo(
    () =>
      (categoriesQuery.data ?? []).find(
        (item) => item.name.toLocaleLowerCase('pt-BR') === decodedCategoryName.toLocaleLowerCase('pt-BR'),
      ) ?? null,
    [categoriesQuery.data, decodedCategoryName],
  );

  const fights = useMemo(() => {
    return (fightsQuery.data ?? []).filter((fight) => {
      const sameCategoryId = category?.id && fight.categoryId === category.id;
      const sameCategoryName =
        fight.categoryName.toLocaleLowerCase('pt-BR') ===
        decodedCategoryName.toLocaleLowerCase('pt-BR');
      return Boolean(sameCategoryId || sameCategoryName);
    });
  }, [category?.id, decodedCategoryName, fightsQuery.data]);

  const groupedByRound = useMemo(() => {
    const grouped = new Map<number, typeof fights>();

    fights.forEach((fight) => {
      const round = fight.round ?? 0;
      const current = grouped.get(round) ?? [];
      current.push(fight);
      grouped.set(round, current);
    });

    return Array.from(grouped.entries())
      .sort(([roundA], [roundB]) => roundA - roundB)
      .map(([round, items]) => ({
        label: getFightRoundLabel(round || null),
        fights: [...items].sort((fightA, fightB) => {
          const orderA = fightA.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = fightB.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        }),
      }));
  }, [fights]);

  async function handleCreateFight(
    payload: Parameters<typeof createFightMutation.mutateAsync>[0],
  ) {
    try {
      await createFightMutation.mutateAsync(payload);
      setIsFightFormOpen(false);
      toast({
        title: 'Luta criada',
        description: 'A luta manual foi adicionada à categoria.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar luta',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  if (!hasHydrated) {
    return <StateCard message="Carregando competição ativa..." />;
  }

  if (!activeCompetitionId) {
    return (
      <StateCard message="Selecione uma competição ativa para visualizar a categoria." />
    );
  }

  if (categoriesQuery.isLoading || fightsQuery.isLoading) {
    return <StateCard message="Carregando dados da categoria..." />;
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <StateCard message="Categoria não encontrada para a competição ativa." />
        <Button type="button" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border-4 border-slate-900 bg-white p-6 shadow-[8px_8px_0_0_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para categorias
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              {category.name}
            </h1>
            <p className="mt-2 text-slate-600">
              Visualização operacional da categoria com lutas agrupadas por rodada e intervenção manual.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Atletas" value={String(category.totalAthletes)} />
            <MetricCard label="Lutas" value={String(fights.length)} />
            <Button type="button" className="h-full" onClick={() => setIsFightFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar luta manual
            </Button>
          </div>
        </div>
      </header>

      {groupedByRound.length === 0 ? (
        <StateCard message="Nenhuma luta encontrada nesta categoria." />
      ) : (
        groupedByRound.map((group) => (
          <Card
            key={group.label}
            className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]"
          >
            <div className="border-b-4 border-slate-900 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-600">
              {group.label}
            </div>
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-white">
                    <TableHead>Ordem</TableHead>
                    <TableHead>Luta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Próxima luta</TableHead>
                    <TableHead>Vencedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.fights.map((fight) => (
                    <TableRow key={fight.id}>
                      <TableCell className="font-semibold">
                        {fight.order ?? '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p>
                            {fight.athleteA?.name || 'A definir'} vs{' '}
                            {fight.athleteB?.name || 'A definir'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {fight.athleteA?.academy || 'Sem academia'} ·{' '}
                            {fight.athleteB?.academy || 'Sem academia'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getFightStatusLabel(fight.status)}</TableCell>
                      <TableCell>{fight.areaName || '-'}</TableCell>
                      <TableCell>
                        {fight.nextFightId
                          ? `${fight.nextFightId} (${fight.nextFightSlot || '-'})`
                          : 'Final / campeão'}
                      </TableCell>
                      <TableCell>{resolveFightWinnerName(fight)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ))
      )}

      <FightFormDialog
        isOpen={isFightFormOpen}
        onClose={() => setIsFightFormOpen(false)}
        onSubmit={(payload) => void handleCreateFight(payload)}
        athletes={athletesQuery.data ?? []}
        categories={[category]}
        areas={(areasQuery.data ?? []).map((area) => ({ id: area.id, name: area.name }))}
        defaultCategoryId={category.id}
        isSubmitting={createFightMutation.isPending}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 px-4 py-3 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="border-4 border-slate-300 p-0">
      <CardContent className="p-6 text-slate-600">{message}</CardContent>
    </Card>
  );
}
