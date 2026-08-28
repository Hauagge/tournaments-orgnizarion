import CategoriesPage from '@/features/categories/components/categories-page';
import { ManagementOnly } from '@/features/auth/components/management-only';

export default function CategoriesRoute() {
  return (
    <ManagementOnly>
      <CategoriesPage />
    </ManagementOnly>
  );
}
