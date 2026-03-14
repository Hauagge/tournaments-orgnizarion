'use client';

import { useCategoryStore } from '@/shared/stores/useCategoryStore';
import { Card, CardContent } from '@/shared/ui/card';

export default function FightsTab() {
  const { categories } = useCategoryStore();
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Fights</h1>
        <p className="mt-1 text-slate-600">
          Visualizacao rapida das lutas derivadas das categorias montadas.
        </p>
      </header>
      <div className="p-6 space-y-6">
        {categories.length === 0 ? (
          <p className="text-center">Nenhuma chave gerada ainda.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {categories.map((category, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-2">
                  <h2 className="text-xl font-bold">
                    {category.name} - {category.belt}
                  </h2>
                  <div className="space-y-2">
                    {category?.athletes?.length &&
                      category?.athletes?.length > 0 && (
                        <div className="flex justify-between border p-2 rounded">
                          <span>{category?.athletes[0]?.name}</span>
                          <span className="font-semibold text-gray-500">
                            vs
                          </span>
                          <span>{category?.athletes[1]?.name}</span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
