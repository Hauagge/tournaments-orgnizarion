'use client';

import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Card, CardContent } from '../../ui/card';
import { TabsContent } from '../../ui/tabs';

export default function BracketsPage() {
  const { categories } = useCategoryStore();
  return (
    <TabsContent value="lutas">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Chaves de Lutas</h1>
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
                          <span>{category?.athletes[0].name}</span>
                          <span className="font-semibold text-gray-500">
                            vs
                          </span>
                          <span>{category?.athletes[1].name}</span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
