import { TabsContent } from '../../ui/tabs';

import { useState } from 'react';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { useCategorizeAthletesToBrackets } from '@/app/hooks/useCategorizeAthletesToBrackets';
import CardCategory from '../../CategoryCards';
import { useAthleteStore } from '@/app/store/useAthleteStore';
import { useSeparateBracketByAgeGroup } from '@/app/hooks/useSeparateBracketByAgeGroup';

export default function BracketTabs() {
  const [showOnlyWithFights, setShowOnlyWithFights] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { categories } = useCategoryStore();
  const { athletes } = useAthleteStore();

  useCategorizeAthletesToBrackets(athletes);

  const { infantil, juvenil, adulto } = useSeparateBracketByAgeGroup(
    categories,
    showOnlyWithFights,
  );
  return (
    <TabsContent value="chaves">
      <div className="  space-y-6">
        <div className="flex items-center gap-2 px-4">
          <input
            id="fights-filter"
            type="checkbox"
            checked={showOnlyWithFights}
            onChange={(e) => setShowOnlyWithFights(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="fights-filter" className="text-sm">
            Mostrar apenas categorias com luta
          </label>
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-auto border px-2 py-1 rounded text-sm w-64"
          />
        </div>
        {categories.length > 0 ? (
          <div className=" h-[85vh] flex flex-col lg:flex-row gap-6 flex-wrap max-w-screen overflow-hidden ">
            <CardCategory
              categoryName={'🧒 Infantil'}
              categories={infantil}
              searchTerm={searchTerm}
            />
            <CardCategory
              categoryName={'👦 Juvenil'}
              categories={juvenil}
              searchTerm={searchTerm}
            />
            <CardCategory
              categoryName={'🧑 Adulto'}
              categories={adulto}
              searchTerm={searchTerm}
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
