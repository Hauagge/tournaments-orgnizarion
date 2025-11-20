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
  const onlyCategoriesNotEmpty = categories.filter(
    (category) => category.athletes && category.athletes.length > 0,
  );
  return (
    <div className="space-y-4 max-h-full overflow-y-auto flex-1">
      <h2 className="text-xl font-bold text-center">{categoryName}</h2>
      {onlyCategoriesNotEmpty
        .filter((category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .map((category) => (
          <Card
            key={category.id}
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
                Peso: {category?.minWeight} kg - {category?.maxWeight} kg
              </p>
              <p>{category.athletes?.length || 0} Atletas</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
