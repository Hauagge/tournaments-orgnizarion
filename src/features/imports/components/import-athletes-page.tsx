'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FileUp, SearchCheck, Upload } from 'lucide-react';
import {
  useAthleteImportPreview,
  useImportAthletes,
} from '@/features/imports/hooks/use-athlete-import';
import {
  athleteImportCsvColumns,
  AthleteImportPreviewRow,
  AthleteImportSummary,
} from '@/features/imports/types/athlete-import';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { useToast } from '@/shared/ui/use-toast';

export default function ImportAthletesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<AthleteImportPreviewRow[]>([]);
  const [importSummary, setImportSummary] = useState<AthleteImportSummary | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const hasHydrated = useCompetitionStore((state) => state.hasHydrated);
  const previewMutation = useAthleteImportPreview(activeCompetitionId);
  const importMutation = useImportAthletes(activeCompetitionId);
  const { toast } = useToast();

  const validRowsCount = useMemo(
    () => previewRows.filter((row) => row.isValid).length,
    [previewRows],
  );

  async function handlePreview() {
    if (!activeCompetitionId || !selectedFile) return;

    try {
      const csvText = await selectedFile.text();
      const rows = await previewMutation.mutateAsync(csvText);
      setPreviewRows(rows);
      setImportSummary(null);
    } catch (error) {
      toast({
        title: 'Falha ao gerar preview',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  async function handleImport() {
    if (!activeCompetitionId || validRowsCount === 0 || !selectedFile) return;

    try {
      const summary = await importMutation.mutateAsync(selectedFile);
      setImportSummary(summary);
      toast({
        title: 'Importação concluída',
        description: `${summary.imported} atletas importados.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Falha ao importar atletas',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewRows([]);
    setImportSummary(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Importações
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Importe atletas por CSV
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Envie um arquivo CSV com as colunas {athleteImportCsvColumns.join(', ')}.
            O backend será responsável por validar, destrinchar e salvar os atletas
            na competição ativa.
          </p>
        </div>
      </header>

      {!hasHydrated && (
        <Card>
          <CardContent className="p-6 text-slate-600">
            Carregando competição ativa...
          </CardContent>
        </Card>
      )}

      {hasHydrated && !activeCompetitionId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-amber-900">
            Selecione uma competição no switcher superior antes de importar.
          </CardContent>
        </Card>
      )}

      {activeCompetitionId && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="p-0">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Arquivo CSV</h2>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-4 w-4" />
                    Upload arquivo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm text-slate-500">
                        Arquivo pronto para preview e importação.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Nenhum arquivo selecionado
                      </p>
                      <p className="text-sm text-slate-600">
                        Faça upload de um `.csv` com as colunas esperadas.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  Colunas esperadas: {athleteImportCsvColumns.join(', ')}.
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handlePreview}
                    disabled={!selectedFile || previewMutation.isPending}
                  >
                    <SearchCheck className="mr-2 h-4 w-4" />
                    {previewMutation.isPending ? 'Validando...' : 'Preview'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleImport}
                    disabled={
                      !selectedFile ||
                      validRowsCount === 0 ||
                      importMutation.isPending
                    }
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {importMutation.isPending ? 'Importando...' : 'Importar'}
                  </Button>
                  {selectedFile && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewRows([]);
                        setImportSummary(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Limpar arquivo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">Resumo</h2>
                <SummaryRow
                  label="Linhas no preview"
                  value={String(previewRows.length)}
                />
                <SummaryRow
                  label="Linhas válidas"
                  value={String(validRowsCount)}
                />
                <SummaryRow
                  label="Linhas inválidas"
                  value={String(previewRows.length - validRowsCount)}
                />

                {importSummary && (
                  <>
                    <div className="my-2 h-px bg-slate-200" />
                    <SummaryRow
                      label="Importados"
                      value={String(importSummary.imported)}
                    />
                    <SummaryRow
                      label="Falharam"
                      value={String(importSummary.failed)}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link href="/academies">
                        <Button variant="outline" className="w-full">
                          Ver academias
                        </Button>
                      </Link>
                      <Link href="/athletes">
                        <Button variant="outline" className="w-full">
                          Ver atletas importados
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">
                        Motivos
                      </p>
                      {importSummary.reasons.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhum motivo retornado.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {importSummary.reasons.map((reason, index) => (
                            <li
                              key={`${reason}-${index}`}
                              className="rounded-lg bg-slate-100 px-3 py-2"
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {previewMutation.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-red-700">
                {previewMutation.error instanceof Error
                  ? previewMutation.error.message
                  : 'Falha ao validar CSV.'}
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead>Linha</TableHead>
                    {athleteImportCsvColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={athleteImportCsvColumns.length + 2}
                        className="py-10 text-center text-slate-500"
                      >
                        Gere um preview para visualizar as linhas e validações.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewRows.map((row) => (
                      <TableRow
                        key={`${row.line}-${row.data.Nome}`}
                        className={
                          row.isValid ? 'bg-white' : 'bg-red-50 hover:bg-red-50'
                        }
                      >
                        <TableCell className="font-semibold">{row.line}</TableCell>
                        {athleteImportCsvColumns.map((column) => (
                          <TableCell key={column}>{row.data[column] || '-'}</TableCell>
                        ))}
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Sem erros
                            </span>
                          ) : (
                            <ul className="space-y-1 text-sm text-red-700">
                              {row.errors.map((error, index) => (
                                <li key={`${error}-${index}`}>{error}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-base font-semibold text-slate-900">{value}</span>
    </div>
  );
}
