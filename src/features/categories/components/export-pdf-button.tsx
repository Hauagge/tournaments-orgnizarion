'use client';

import { Button } from '@/shared/ui/button';
import { useCategoryStore } from '@/shared/stores/useCategoryStore';

export function ExportCategoriesPdfButton() {
  const exportAll = useCategoryStore((s) => s.exportAll);

  return (
    <Button
      size="xl"
      onClick={exportAll}
      className="bg-red-600 hover:bg-red-500 text-white h-10"
    >
      Exportar PDF
    </Button>
  );
}
