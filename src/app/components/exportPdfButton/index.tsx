'use client';

import { Button } from '@/app/components/ui/button';
import { useCategoryStore } from '@/app/store/useCategoryStore';

export function ExportCategoriesPdfButton() {
  const exportAll = useCategoryStore((s) => s.exportAll);

  return (
    <Button
      onClick={exportAll}
      className="bg-red-600 hover:bg-red-500 text-white"
    >
      Exportar PDF de todas as categorias
    </Button>
  );
}
