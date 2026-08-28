import CategoryPage from '@/features/categories/pages/category-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function CategoryDetailsRoute() {
  return (
    <ManagementOnly>
      <CategoryPage />
    </ManagementOnly>
  );
}
