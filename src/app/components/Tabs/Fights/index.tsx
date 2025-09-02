'use client';

import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Card, CardContent } from '../../ui/card';
import { TabsContent } from '../../ui/tabs';

export default function BracketsPage() {
  const { categories } = useCategoryStore();
  console.log('Lutasa:', categories);
  return (
    <TabsContent value="atletas">
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
                    {category?.fights?.length &&
                      category?.fights?.length > 0 &&
                      category?.fights.map((it, idx) => {
                        return it ? (
                          <div
                            key={idx}
                            className="flex justify-between border p-2 rounded"
                          >
                            <span>{it.athletes[0]}</span>
                            <span className="font-semibold text-gray-500">
                              vs
                            </span>
                            <span>{it.athletes[1]}</span>
                          </div>
                        ) : (
                          <div
                            key={idx}
                            className="flex justify-between border p-2 rounded"
                          >
                            <span>Sem atleta</span>
                            <span className="font-semibold text-gray-500">
                              vs
                            </span>
                            <span>Sem atleta</span>
                          </div>
                        );
                      })}
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
