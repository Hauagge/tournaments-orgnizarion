'use client';

import { Card, CardContent } from '../ui/card';
import { useRouter } from 'next/navigation';
import { Category } from '@/app/types';

type BracketsPageProps = {
  categories: Array<Category>;
  categoryName?: string;
  redirectToCategory?: boolean;
  searchTerm?: string;
};

export default function CardCategory({
  categories,
  categoryName,
  searchTerm = '',
}: BracketsPageProps) {
  const router = useRouter();
  return (
    <div className="space-y-4 max-h-full overflow-y-auto flex-1">
      <h2 className="text-xl font-bold text-center">{categoryName}</h2>
      {categories
        .filter((category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .map((category) => (
          <Card
            key={category.name}
            className="cursor-pointer hover:shadow-lg"
            onClick={() =>
              router.push(`/category/${encodeURIComponent(category.name)}`)
            }
          >
            <CardContent>
              <h3 className="text-lg font-bold">{category.name}</h3>
              <p>
                Idade: {category?.ageDivision.min} - {category?.ageDivision.max}{' '}
                anos
              </p>
              <p>
                Peso: {category?.minWeight} - {category?.maxWeight} kg
              </p>
              <p>{category.fights?.length || 0} lutas</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
