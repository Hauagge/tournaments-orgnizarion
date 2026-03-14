'use client';

import { useState } from 'react';
import { useCategoryStore } from '@/shared/stores/useCategoryStore';
import CardCategory from '@/features/categories/components/category-cards';
import { useAthleteStore } from '@/shared/stores/useAthleteStore';
import { Button } from '@/shared/ui/button';
import { useSeparateBracketByAgeGroup } from '@/shared/hooks/useSeparateAthletesCustomaCategory';
import { ExportCategoriesPdfButton } from '@/features/categories/components/export-pdf-button';
import { Athlete, Category } from '@/shared/lib/types';
import ClearStorageButton from '@/shared/ui/clear-storage-button';

const MAX_PER_CATEGORY = 4;

function athleteKey(a: Athlete) {
  return String(a.id ?? `${a.name}|${a.age}|${a.gender}|${a.belt}|${a.weight}`);
}

function updateBounds(c: Category) {
  const ws = c.athletes.map((a) => Number(a.weight));
  c.minWeight = ws.length ? Math.min(...ws) : 0;
  c.maxWeight = ws.length ? Math.max(...ws) : 0;
  c.weightName =
    c.minWeight === c.maxWeight
      ? `${c.minWeight}kg`
      : `${c.minWeight}–${c.maxWeight}kg`;
  const ages = c.athletes.map((a) => a.age);
  if (ages.length) {
    c.ageDivision.min = Math.min(c.ageDivision.min, ...ages);
    c.ageDivision.max = Math.max(c.ageDivision.max, ...ages);
  }
}

export default function BracketTabs() {
  const [searchTerm, setSearchTerm] = useState('');
  const { categories, setCategories, updateFightsFromAthletes } =
    useCategoryStore();
  const { athletes } = useAthleteStore();
  const [generating, setGenerating] = useState(false);

  const { infantil, juvenil } = useSeparateBracketByAgeGroup(categories);

  async function handleGenerate() {
    setGenerating(true);
    try {
      updateFightsFromAthletes(athletes);
    } finally {
      setGenerating(false);
    }
  }

  function removeAthleteEverywhere(next: Category[], key: string) {
    for (const c of next) {
      const idx = c.athletes.findIndex((a) => athleteKey(a) === key);
      if (idx !== -1) {
        c.athletes.splice(idx, 1);
        updateBounds(c);
      }
    }
  }

  function handleAddAthlete(categoryId: number, a: Athlete) {
    const next: Category[] = JSON.parse(JSON.stringify(categories));
    const key = athleteKey(a);
    // remove de qualquer outra categoria
    removeAthleteEverywhere(next, key);
    // adiciona no destino se houver espaço
    const dest = next.find((c) => c.id === categoryId);
    if (!dest) return;
    if (dest.athletes.length >= MAX_PER_CATEGORY) return;
    dest.athletes.push(a);
    updateBounds(dest);
    // reindex opcional (se você quiser reatribuir ids sequenciais): next.forEach((c, i)=> c.id = i+1)
    setCategories?.(next); // certifique-se de ter esse action no store
  }

  function handleRemoveAthlete(categoryId: number, a: Athlete) {
    const next: Category[] = JSON.parse(JSON.stringify(categories));
    const key = athleteKey(a);
    const dest = next.find((c) => c.id === categoryId);
    if (!dest) return;
    const idx = dest.athletes.findIndex((it) => athleteKey(it) === key);
    if (idx !== -1) {
      dest.athletes.splice(idx, 1);
      updateBounds(dest);
      setCategories?.(next);
    }
  }

  function handleRemoveCategory(categoryId: number) {
    const next: Category[] = JSON.parse(JSON.stringify(categories));
    const cat = next.find((c) => c.id === categoryId);
    if (!cat) return;
    if (cat.athletes.length > 0) return; // opção só quando vazia
    const filtered = next.filter((c) => c.id !== categoryId);
    // opcional: reindexar IDs
    filtered.forEach((c, i) => (c.id = i + 1));
    setCategories?.(filtered);
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-slate-600">
          Geracao, ajustes manuais e exportacao das chaves por categoria.
        </p>
      </header>
      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Button
              onClick={handleGenerate}
              disabled={generating || athletes.length === 0}
              className="w-full sm:w-auto"
              title={
                athletes.length === 0
                  ? 'Adicione atletas para gerar chaves'
                  : 'Gerar chaves das lutas'
              }
            >
              {generating ? 'Gerando...' : 'Gerar todas as chaves'}
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded border px-3 text-sm sm:w-72"
              />
              <div className="flex items-center gap-2">
                <ExportCategoriesPdfButton />
                <ClearStorageButton />
              </div>
            </div>
          </div>
        </div>
        {categories.length > 0 ? (
          <div className="h-[85vh] flex flex-col flex-wrap gap-6 overflow-hidden lg:flex-row max-w-screen">
            <CardCategory
              categoryName={'🧒 Infantil'}
              categories={infantil}
              searchTerm={searchTerm}
              athletesPool={athletes}
              onAdd={handleAddAthlete}
              onRemove={handleRemoveAthlete}
              onRemoveCategory={handleRemoveCategory}
              maxPerCategory={MAX_PER_CATEGORY}
            />
            <CardCategory
              categoryName={'👦 Juvenil'}
              categories={juvenil}
              searchTerm={searchTerm}
              athletesPool={athletes}
              onAdd={handleAddAthlete}
              onRemove={handleRemoveAthlete}
              onRemoveCategory={handleRemoveCategory}
              maxPerCategory={MAX_PER_CATEGORY}
            />
          </div>
        ) : (
          <p className="text-center text-lg">
            Nenhuma chave criada. Clique em &quot;Gerar Todas as Chaves&quot;
            para começar.
          </p>
        )}
      </div>
    </section>
  );
}
