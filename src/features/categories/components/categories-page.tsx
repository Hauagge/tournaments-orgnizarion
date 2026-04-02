'use client';

import { useMemo, useState } from 'react';
import { Filter, LoaderCircle, Search } from 'lucide-react';
import { getWeighInStatusLabel } from '@/features/athletes/types/athlete';
import {
  useCategories,
  useCategory,
  useGenerateCategories,
} from '@/features/categories/hooks/use-categories';
import { CategorySummary } from '@/features/categories/types/category';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const { toast } = useToast();

  const categoriesQuery = useCategories(activeCompetitionId);
  const generateMutation = useGenerateCategories(activeCompetitionId);
  const categoryDetailQuery = useCategory(selectedCategoryId);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const beltOptions = useMemo(() => {
    const options = new Set<string>();

    categories.forEach((category) => {
      if (category.belt) {
        options.add(category.belt);
      }
    });

    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        category.name.toLowerCase().includes(normalizedSearch);
      const matchesBelt = beltFilter === 'ALL' || category.belt === beltFilter;

      return matchesSearch && matchesBelt;
    });
  }, [beltFilter, categories, search]);

  async function handleGenerateCategories() {
    if (!activeCompetitionId) {
      return;
    }

    try {
      await generateMutation.mutateAsync();
      toast({
        title: 'Categorias geradas',
        description: 'A lista de categorias foi atualizada com sucesso.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao gerar categorias',
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
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
              Categories
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Gere e revise as categorias da competicao ativa
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600">
              Acione a geracao, filtre a listagem e abra o detalhe para revisar os atletas de cada categoria.
            </p>
          </div>

          <Button
            onClick={() => void handleGenerateCategories()}
            disabled={!activeCompetitionId || !hasHydrated || generateMutation.isPending}
            className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800"
          >
            {generateMutation.isPending ? 'Gerando...' : 'Gerar categorias'}
          </Button>
        </div>
      </header>

      {!hasHydrated && (
        <StateCard message="Carregando competicao ativa..." />
      )}

      {hasHydrated && !activeCompetitionId && (
        <StateCard
          message="Selecione uma competicao no topo para listar as categorias."
          tone="warning"
        />
      )}

      {activeCompetitionId && (
        <>
          <Card className="border-4 border-slate-900 p-0">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_220px]">
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  Buscar por nome
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ex.: Branca juvenil leve"
                    className="pl-9"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  <Filter className="h-4 w-4" />
                  Filtrar faixa
                </span>
                <select
                  value={beltFilter}
                  onChange={(event) => setBeltFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Todas</option>
                  {beltOptions.map((belt) => (
                    <option key={belt} value={belt}>
                      {belt}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          {categoriesQuery.isLoading && <StateCard message="Carregando categorias..." />}

          {categoriesQuery.isError && (
            <StateCard
              message={
                categoriesQuery.error instanceof Error
                  ? categoriesQuery.error.message
                  : 'Falha ao carregar categorias.'
              }
              tone="error"
            />
          )}

          {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 && (
            <StateCard
              message="Nenhuma categoria encontrada. Gere as categorias para popular a listagem."
              tone="empty"
            />
          )}

          {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length > 0 && filteredCategories.length === 0 && (
            <StateCard
              message="Nenhuma categoria corresponde aos filtros atuais."
              tone="empty"
            />
          )}

          {!categoriesQuery.isLoading && !categoriesQuery.isError && filteredCategories.length > 0 && (
            <Card className="overflow-hidden border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
              <div className="overflow-x-auto">
                <Table className="rounded-none border-0">
                  <TableHeader className="bg-slate-100">
                    <TableRow className="hover:bg-slate-100">
                      <TableHead>Nome</TableHead>
                      <TableHead>Faixa</TableHead>
                      <TableHead>Idade min/max</TableHead>
                      <TableHead>Peso min/max</TableHead>
                      <TableHead>Total atletas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="cursor-pointer transition hover:bg-amber-50"
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <TableCell className="font-semibold">{category.name || '-'}</TableCell>
                        <TableCell>{category.belt || '-'}</TableCell>
                        <TableCell>{formatRange(category.ageMin, category.ageMax, 'anos')}</TableCell>
                        <TableCell>{formatRange(category.weightMin, category.weightMax, 'kg')}</TableCell>
                        <TableCell>{category.totalAthletes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          <CategoryDetailDrawer
            categoryId={selectedCategoryId}
            categories={categories}
            isOpen={Boolean(selectedCategoryId)}
            isLoading={categoryDetailQuery.isLoading}
            isError={categoryDetailQuery.isError}
            errorMessage={
              categoryDetailQuery.error instanceof Error
                ? categoryDetailQuery.error.message
                : 'Falha ao carregar o detalhe da categoria.'
            }
            onClose={() => setSelectedCategoryId(null)}
            detail={categoryDetailQuery.data ?? null}
          />
        </>
      )}
    </div>
  );
}

function CategoryDetailDrawer({
  categoryId,
  categories,
  detail,
  isError,
  isLoading,
  errorMessage,
  isOpen,
  onClose,
}: {
  categoryId: string | null;
  categories: CategorySummary[];
  detail: ReturnType<typeof useCategory>['data'] | null;
  isError: boolean;
  isLoading: boolean;
  errorMessage: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const summary = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-2xl translate-x-0 translate-y-0 rounded-none border-l-4 border-slate-900 p-0">
        <div className="flex h-full flex-col bg-white">
          <DialogHeader className="border-b-4 border-slate-900 px-6 py-5">
            <DialogTitle className="text-2xl font-black text-slate-950">
              {detail?.name || summary?.name || 'Detalhe da categoria'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Revise os atletas vinculados e acompanhe o status de pesagem da categoria.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {(detail || summary) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox label="Faixa" value={detail?.belt || summary?.belt || '-'} />
                <InfoBox
                  label="Total atletas"
                  value={String(detail?.totalAthletes ?? summary?.totalAthletes ?? 0)}
                />
                <InfoBox
                  label="Idade min/max"
                  value={formatRange(
                    detail?.ageMin ?? summary?.ageMin ?? null,
                    detail?.ageMax ?? summary?.ageMax ?? null,
                    'anos',
                  )}
                />
                <InfoBox
                  label="Peso min/max"
                  value={formatRange(
                    detail?.weightMin ?? summary?.weightMin ?? null,
                    detail?.weightMax ?? summary?.weightMax ?? null,
                    'kg',
                  )}
                />
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 rounded-2xl border-4 border-slate-900 bg-slate-50 px-4 py-4 text-slate-600">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Carregando atletas da categoria...
              </div>
            )}

            {isError && !isLoading && (
              <StateCard message={errorMessage} tone="error" />
            )}

            {!isLoading && !isError && detail && detail.athletes.length === 0 && (
              <StateCard
                message="Esta categoria ainda nao possui atletas vinculados."
                tone="empty"
              />
            )}

            {!isLoading && !isError && detail && detail.athletes.length > 0 && (
              <Card className="border-4 border-slate-900 p-0">
                <CardContent className="p-0">
                  <div className="border-b-4 border-slate-900 bg-slate-100 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-600">
                    Atletas da categoria
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="rounded-none border-0">
                      <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-slate-50">
                          <TableHead>Nome</TableHead>
                          <TableHead>Academia</TableHead>
                          <TableHead>Faixa</TableHead>
                          <TableHead>Status pesagem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.athletes.map((athlete) => (
                          <TableRow key={athlete.id}>
                            <TableCell className="font-medium">{athlete.name || '-'}</TableCell>
                            <TableCell>{athlete.academy || '-'}</TableCell>
                            <TableCell>{athlete.belt || '-'}</TableCell>
                            <TableCell>
                              <span className={statusBadgeClassName(athlete.weighInStatus)}>
                                {getWeighInStatusLabel(athlete.weighInStatus)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
      ? 'border-amber-400 bg-amber-50 text-amber-950'
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatRange(
  min: number | null,
  max: number | null,
  suffix: string,
) {
  if (min === null && max === null) {
    return '-';
  }

  if (min !== null && max !== null) {
    return `${min} - ${max} ${suffix}`;
  }

  if (min !== null) {
    return `Min ${min} ${suffix}`;
  }

  return `Max ${max} ${suffix}`;
}

function statusBadgeClassName(status: string) {
  if (status === 'APPROVED') {
    return 'inline-flex rounded-full border-2 border-emerald-900 bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900';
  }

  if (status === 'REJECTED') {
    return 'inline-flex rounded-full border-2 border-red-900 bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-900';
  }

  return 'inline-flex rounded-full border-2 border-amber-900 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-900';
}
