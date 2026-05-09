'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Filter, LoaderCircle, Search, Swords } from 'lucide-react';
import { getWeighInStatusLabel } from '@/features/athletes/types/athlete';
import { buildAthleteReadinessSummary } from '@/features/athletes/lib/athlete-readiness';
import { useAthletes } from '@/features/athletes/hooks/use-athletes';
import { useBelts } from '@/features/belts/hooks/use-belts';
import {
  useCategories,
  useCategory,
  useCreateCategory,
  useGenerateCategories,
} from '@/features/categories/hooks/use-categories';
import {
  CategorySummary,
  CreateCategoryPayload,
} from '@/features/categories/types/category';
import { useFights, useGenerateFights } from '@/features/fights/hooks/use-fights';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
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
import { Checkbox } from '@/shared/ui/checkbox';
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

const initialFormState: CreateCategoryPayload = {
  name: '',
  ageMin: null,
  ageMax: null,
  weightMin: null,
  weightMax: null,
  belt: '',
  canMerge: false,
  mergeBelt: null,
};

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isGenerateFightsDialogOpen, setIsGenerateFightsDialogOpen] = useState(false);
  const [hasJustGeneratedFights, setHasJustGeneratedFights] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCategoryPayload>(initialFormState);

  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const { toast } = useToast();

  const categoriesQuery = useCategories(activeCompetitionId);
  const athletesQuery = useAthletes(activeCompetitionId, '');
  const beltsQuery = useBelts();
  const fightsQuery = useFights(activeCompetitionId);
  const generateMutation = useGenerateCategories(activeCompetitionId);
  const createMutation = useCreateCategory(activeCompetitionId);
  const generateFightsMutation = useGenerateFights(activeCompetitionId);
  const categoryDetailQuery = useCategory(selectedCategoryId);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const fights = useMemo(() => fightsQuery.data ?? [], [fightsQuery.data]);
  const beltOptions = useMemo(() => beltsQuery.data ?? [], [beltsQuery.data]);
  const athleteReadiness = useMemo(
    () => buildAthleteReadinessSummary(athletes),
    [athletes],
  );

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
  const categoriesWithAthletes = useMemo(
    () => categories.filter((category) => category.totalAthletes > 0).length,
    [categories],
  );
  const generatedFightsCount = fights.length;
  const hasGeneratedFights = generatedFightsCount > 0;

  function updateCreateForm<K extends keyof CreateCategoryPayload>(
    key: K,
    value: CreateCategoryPayload[K],
  ) {
    setCreateForm((current) => ({ ...current, [key]: value }));
  }

  function handleNumberFieldChange(
    key: 'ageMin' | 'ageMax' | 'weightMin' | 'weightMax',
    value: string,
  ) {
    const trimmed = value.trim();
    updateCreateForm(key, trimmed === '' ? null : Number(trimmed));
  }

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

  async function handleCreateCategory() {
    if (!activeCompetitionId) {
      return;
    }

    if (!createForm.belt.trim()) {
      toast({
        title: 'Faixa obrigatória',
        description: 'Selecione a cor da faixa para criar a categoria.',
        variant: 'destructive',
      });
      return;
    }

    if (
      createForm.ageMin !== null &&
      createForm.ageMax !== null &&
      createForm.ageMin > createForm.ageMax
    ) {
      toast({
        title: 'Faixa etária inválida',
        description: 'A idade mínima não pode ser maior que a idade máxima.',
        variant: 'destructive',
      });
      return;
    }

    if (
      createForm.weightMin !== null &&
      createForm.weightMax !== null &&
      createForm.weightMin > createForm.weightMax
    ) {
      toast({
        title: 'Faixa de peso inválida',
        description: 'O peso mínimo não pode ser maior que o peso máximo.',
        variant: 'destructive',
      });
      return;
    }

    if (createForm.canMerge && !createForm.mergeBelt) {
      toast({
        title: 'Faixa de mesclagem obrigatória',
        description: 'Informe com qual faixa essa categoria pode mesclar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...createForm,
        name: createForm.name?.trim() || undefined,
      });
      setCreateForm(initialFormState);
      toast({
        title: 'Categoria criada',
        description: 'A categoria manual foi adicionada à competição.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao criar categoria',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleGenerateFights() {
    if (!activeCompetitionId) {
      return;
    }

    if (athleteReadiness.approvedAthletes < 2) {
      toast({
        title: 'Atletas insuficientes para gerar lutas',
        description:
          'A competição precisa de pelo menos 2 atletas com pesagem aprovada.',
        variant: 'warning',
      });
      return;
    }

    if (athleteReadiness.pendingWeighIn > 0) {
      toast({
        title: 'Finalize a pesagem antes de gerar lutas',
        description:
          `${athleteReadiness.pendingWeighIn} atleta(s) ainda estão com pesagem pendente.`,
        variant: 'warning',
      });
      return;
    }

    if (categories.length === 0) {
      toast({
        title: 'Sem categorias para gerar lutas',
        description: 'Gere ou cadastre ao menos uma categoria antes de criar as lutas.',
        variant: 'warning',
      });
      return;
    }

    try {
      await generateFightsMutation.mutateAsync();
      setIsGenerateFightsDialogOpen(false);
      setHasJustGeneratedFights(true);
      toast({
        title: 'Lutas geradas',
        description: 'Os confrontos da competição ativa foram atualizados.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao gerar lutas',
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

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerateFightsDialogOpen(true)}
              disabled={
                !activeCompetitionId ||
                !hasHydrated ||
                athletesQuery.isLoading ||
                categoriesQuery.isLoading ||
                categories.length === 0 ||
                !athleteReadiness.canGenerateCompetitionFights ||
                generateFightsMutation.isPending
              }
              className="h-14 rounded-2xl border-4 border-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] text-slate-900 hover:bg-amber-100"
            >
              <Swords className="mr-2 h-5 w-5" />
              {generateFightsMutation.isPending ? 'Gerando lutas...' : 'Gerar lutas'}
            </Button>
            <Button
              onClick={() => void handleGenerateCategories()}
              disabled={!activeCompetitionId || !hasHydrated || generateMutation.isPending}
              className="h-14 rounded-2xl border-4 border-slate-900 bg-slate-900 px-6 text-base font-black uppercase tracking-[0.12em] hover:bg-slate-800"
            >
              {generateMutation.isPending ? 'Gerando...' : 'Gerar categorias'}
            </Button>
          </div>
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
          <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Fluxo do GP absoluto
                </h2>
                <p className="text-sm text-slate-600">
                  Nesta competição, o caminho correto é: categorias, gerar lutas, distribuir áreas e então operar as chamadas.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ReadinessMetric
                  label="Categorias totais"
                  value={String(categories.length)}
                />
                <ReadinessMetric
                  label="Com atletas"
                  value={String(categoriesWithAthletes)}
                  tone={categoriesWithAthletes > 0 ? 'success' : 'default'}
                />
                <ReadinessMetric
                  label="Lutas geradas"
                  value={String(generatedFightsCount)}
                  tone={hasGeneratedFights ? 'success' : 'default'}
                />
                <ReadinessMetric
                  label="Etapa atual"
                  value={hasGeneratedFights ? 'Distribuir' : 'Categorias'}
                  tone={hasGeneratedFights ? 'success' : 'warning'}
                />
              </div>

              <div
                className={`rounded-2xl border-2 p-4 text-sm ${
                  hasGeneratedFights
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-amber-300 bg-amber-50 text-amber-950'
                }`}
              >
                {hasGeneratedFights
                  ? 'As lutas desta competição já existem. O próximo passo operacional é distribuir as áreas.'
                  : 'Você ainda está na etapa de preparação. Revise ou gere as categorias antes de avançar para as lutas.'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Prontidão para gerar lutas
                </h2>
                <p className="text-sm text-slate-600">
                  Antes de gerar os confrontos, confirme se a base de atletas já está pronta.
                </p>
              </div>

              {athletesQuery.isLoading ? (
                <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Carregando prontidão dos atletas...
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ReadinessMetric
                      label="Atletas totais"
                      value={String(athleteReadiness.totalAthletes)}
                    />
                    <ReadinessMetric
                      label="Pesagem aprovada"
                      value={String(athleteReadiness.approvedAthletes)}
                      tone="success"
                    />
                    <ReadinessMetric
                      label="Pesagem pendente"
                      value={String(athleteReadiness.pendingWeighIn)}
                      tone={athleteReadiness.pendingWeighIn > 0 ? 'warning' : 'default'}
                    />
                    <ReadinessMetric
                      label="Pesagem reprovada"
                      value={String(athleteReadiness.rejectedWeighIn)}
                      tone={athleteReadiness.rejectedWeighIn > 0 ? 'warning' : 'default'}
                    />
                  </div>

                  {athleteReadiness.canGenerateCompetitionFights ? (
                    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
                      A base está pronta para gerar lutas: existem pelo menos 2 atletas aprovados e não há pesagens pendentes.
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                      <p className="font-semibold">
                        A geração de lutas ainda não é a próxima ação recomendada.
                      </p>
                      <p className="mt-1">
                        Finalize a preparação dos atletas antes de seguir para os confrontos.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link href="/athletes">
                          <Button type="button" variant="outline">
                            Revisar atletas
                          </Button>
                        </Link>
                        <Link href="/weigh-in">
                          <Button type="button">
                            Finalizar pesagem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {hasJustGeneratedFights ? (
            <Card className="border-4 border-emerald-300 bg-emerald-50 p-0 shadow-[6px_6px_0_0_rgba(5,150,105,0.2)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-emerald-950">
                    Lutas prontas para a próxima etapa
                  </h2>
                  <p className="text-sm text-emerald-900">
                    A geração foi concluída. Agora siga para a distribuição das áreas para preparar a operação.
                  </p>
                </div>
                <Link href="/areas/distribution">
                  <Button className="w-full lg:w-auto">Ir para distribuição</Button>
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
            <CardContent className="space-y-5 p-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Criar categoria manualmente
                </h2>
                <p className="text-sm text-slate-600">
                  Defina os limites da categoria e a regra de mesclagem antes de salvar.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block space-y-2 xl:col-span-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Nome
                  </span>
                  <Input
                    value={createForm.name ?? ''}
                    onChange={(event) => updateCreateForm('name', event.target.value)}
                    placeholder="Opcional. Ex.: Juvenil azul leve"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Idade mínima
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.ageMin ?? ''}
                    onChange={(event) =>
                      handleNumberFieldChange('ageMin', event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Idade máxima
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.ageMax ?? ''}
                    onChange={(event) =>
                      handleNumberFieldChange('ageMax', event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Peso mínimo
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.weightMin ?? ''}
                    onChange={(event) =>
                      handleNumberFieldChange('weightMin', event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Peso máximo
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.weightMax ?? ''}
                    onChange={(event) =>
                      handleNumberFieldChange('weightMax', event.target.value)
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Cor da faixa
                  </span>
                  <select
                    value={createForm.belt}
                    onChange={(event) => updateCreateForm('belt', event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {beltOptions.map((belt) => (
                      <option key={belt} value={belt}>
                        {belt}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Pode mesclar
                  </span>
                  <label className="flex h-10 items-center gap-3 rounded-md border border-gray-300 px-3 text-sm text-slate-700">
                    <Checkbox
                      checked={createForm.canMerge}
                      onCheckedChange={(checked) => {
                        updateCreateForm('canMerge', checked);
                        if (!checked) {
                          updateCreateForm('mergeBelt', null);
                        }
                      }}
                    />
                    Permitir mesclagem
                  </label>
                </div>

                <label className="block space-y-2 xl:col-span-2">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                    Mesclar com faixa
                  </span>
                  <select
                    value={createForm.mergeBelt ?? ''}
                    onChange={(event) =>
                      updateCreateForm(
                        'mergeBelt',
                        event.target.value || null,
                      )
                    }
                    disabled={!createForm.canMerge}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Selecione</option>
                    {beltOptions.map((belt) => (
                      <option key={belt} value={belt}>
                        {belt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleCreateCategory()}
                  disabled={!activeCompetitionId || createMutation.isPending}
                  className="h-12 rounded-2xl border-4 border-slate-900 bg-amber-300 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-950 hover:bg-amber-200"
                >
                  {createMutation.isPending ? 'Salvando...' : 'Criar categoria'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateForm(initialFormState)}
                  disabled={createMutation.isPending}
                  className="h-12 rounded-2xl border-4 border-slate-900 px-5 text-sm font-black uppercase tracking-[0.12em] text-slate-900 hover:bg-slate-100"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

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

          <AlertDialog
            open={isGenerateFightsDialogOpen}
            onOpenChange={setIsGenerateFightsDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gerar lutas da competição?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação usa as categorias atuais da competição ativa para
                  criar ou regenerar os confrontos. Se já existirem lutas
                  montadas, elas podem ser substituídas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={generateFightsMutation.isPending}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleGenerateFights()}
                  closeOnClick={false}
                  disabled={generateFightsMutation.isPending}
                >
                  {generateFightsMutation.isPending ? 'Gerando...' : 'Confirmar geração'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function ReadinessMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
      : tone === 'warning'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-slate-300 bg-slate-50 text-slate-950';

  return (
    <div className={`rounded-2xl border-2 p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
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
