'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { downloadBlob } from '@/shared/api/downloadBlob';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useToast } from '@/shared/ui/use-toast';

type ReportButtonsProps = {
  compact?: boolean;
};

export default function ReportButtons({
  compact = false,
}: ReportButtonsProps) {
  const [includeResults, setIncludeResults] = useState(false);
  const [categoryId, setCategoryId] = useState('ALL');
  const activeCompetitionId = useCompetitionStore((state) => state.activeCompetitionId);
  const categoriesQuery = useCategories(activeCompetitionId);
  const { toast } = useToast();

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompetitionId) {
        throw new Error('Selecione uma competição ativa para baixar o PDF.');
      }

      const params = new URLSearchParams();
      params.set('includeResults', String(includeResults));
      if (categoryId !== 'ALL') {
        params.set('categoryId', categoryId);
      }

      return downloadBlob(
        `/competitions/${activeCompetitionId}/reports/pdf/brackets?${params.toString()}`,
        {
          method: 'GET',
        },
        {
          defaultFilename: `brackets-${activeCompetitionId}.pdf`,
        },
      );
    },
    onSuccess: ({ filename }) => {
      toast({
        title: 'PDF baixado',
        description: `Arquivo ${filename} iniciado para download.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Falha ao baixar PDF',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const content = (
    <>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
          Relatórios
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-950">
          Baixar PDF das chaves
        </h2>
      </div>

      <div className={`grid gap-4 ${compact ? 'lg:grid-cols-[1fr_1fr_auto]' : 'lg:grid-cols-[1fr_1fr]'}`}>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            Categoria
          </span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={!activeCompetitionId || categoriesQuery.isLoading}
            className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="ALL">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="checkbox"
            checked={includeResults}
            onChange={(event) => setIncludeResults(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
              Incluir resultados
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Marque para incluir os vencedores no PDF.
            </p>
          </div>
        </label>

        <div className={compact ? 'lg:col-start-3 lg:self-end' : 'lg:col-span-2'}>
          <Button
            onClick={() => void downloadMutation.mutateAsync()}
            disabled={!activeCompetitionId || downloadMutation.isPending}
            className="h-11 w-full"
          >
            {downloadMutation.isPending ? (
              'Baixando...'
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF - Chaves
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  if (compact) {
    return (
      <Card className="border-4 border-slate-900 p-0">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-[0.16em]">
              PDF
            </span>
          </div>
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-4 border-slate-900 p-0">
      <CardContent className="space-y-5 p-5">{content}</CardContent>
    </Card>
  );
}
