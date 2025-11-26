import { TabsContent } from '../../ui/tabs';

import { useState } from 'react';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import CardCategory from '../../CategoryCards';
import { useAthleteStore } from '@/app/store/useAthleteStore';
import { Button } from '../../ui/button';
import { useSeparateBracketByAgeGroup } from '@/app/hooks/useSeparateAthletesCustomaCategory';
import { ExportCategoriesPdfButton } from '../../exportPdfButton';
import { Athlete, Category } from '@/app/types';

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
    <TabsContent value="chaves">
      <div className="  space-y-6">
        <div className="flex items-center gap-2 px-4">
          <ExportCategoriesPdfButton />

          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-auto border px-2 py-1 rounded text-sm w-64"
          />
        </div>
        <Button
          size="xl"
          onClick={handleGenerate}
          disabled={generating || athletes.length === 0}
          className="ml-0 sm:ml-2"
          title={
            athletes.length === 0
              ? 'Adicione atletas para gerar chaves'
              : 'Gerar chaves das lutas'
          }
        >
          {generating ? 'Gerando...' : 'Gerar todas as chaves'}
        </Button>
        {categories.length > 0 ? (
          <div className=" h-[85vh] flex flex-col lg:flex-row gap-6 flex-wrap max-w-screen overflow-hidden ">
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
    </TabsContent>
  );
}
