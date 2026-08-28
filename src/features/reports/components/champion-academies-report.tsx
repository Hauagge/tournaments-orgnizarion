'use client';

import { Fragment, type ReactNode, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Medal, Trophy, Users } from 'lucide-react';
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
import { useChampionAcademiesReport } from '@/features/reports/hooks/use-reports';

type ChampionAcademiesReportProps = {
  title?: string;
};

export function ChampionAcademiesReport({
  title = 'Academias com mais campeões',
}: ChampionAcademiesReportProps) {
  const [expandedAcademy, setExpandedAcademy] = useState<string | null>(null);
  const activeCompetitionId = useCompetitionStore(
    (state) => state.activeCompetitionId,
  );
  const reportQuery = useChampionAcademiesReport(activeCompetitionId);

  const report = reportQuery.data;
  const leader = report?.academies[0] ?? null;
  const totalAcademies = report?.academies.length ?? 0;

  const rows = useMemo(() => report?.academies ?? [], [report?.academies]);

  return (
    <Card className="border-4 border-slate-900 p-0 shadow-[6px_6px_0_0_rgba(15,23,42,0.95)]">
      <CardContent className="space-y-5 p-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
            Relatório
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ranking consolidado pela API com base apenas nos campeões finais das categorias.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Academias com campeões"
            value={String(totalAcademies)}
          />
          <SummaryCard
            icon={<Medal className="h-4 w-4" />}
            label="Total de atletas campeões"
            value={String(report?.totalChampionAthletes ?? 0)}
          />
          <SummaryCard
            icon={<Trophy className="h-4 w-4" />}
            label="Academia líder"
            value={leader?.academyName || '-'}
            helper={
              leader ? `${leader.totalChampions} campeão(ões)` : 'Sem dados'
            }
          />
        </div>

        {reportQuery.isLoading ? (
          <StateBox message="Carregando ranking de academias..." />
        ) : reportQuery.isError ? (
          <StateBox
            message={
              reportQuery.error instanceof Error
                ? reportQuery.error.message
                : 'Falha ao carregar relatório.'
            }
            tone="error"
          />
        ) : rows.length === 0 ? (
          <StateBox
            message="Ainda não há campeões registrados para esta competição."
            tone="empty"
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border-2 border-slate-200">
            <div className="overflow-x-auto">
              <Table className="rounded-none border-0">
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead>Posição</TableHead>
                    <TableHead>Academia</TableHead>
                    <TableHead>Total de campeões</TableHead>
                    <TableHead>Campeões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((academy) => {
                    const academyKey = academy.academyId ?? academy.academyName;
                    const isExpanded = expandedAcademy === academyKey;

                  return (
                      <Fragment key={academyKey}>
                        <TableRow key={academyKey}>
                          <TableCell className="font-black">
                            {academy.position}º
                          </TableCell>
                          <TableCell className="font-semibold">
                            {academy.academyName}
                          </TableCell>
                          <TableCell>{academy.totalChampions}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setExpandedAcademy((current) =>
                                  current === academyKey ? null : academyKey,
                                )
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="mr-2 h-4 w-4" />
                              ) : (
                                <ChevronDown className="mr-2 h-4 w-4" />
                              )}
                              Ver atletas
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded ? (
                          <TableRow key={`${academyKey}-details`}>
                            <TableCell colSpan={4} className="bg-slate-50">
                              <div className="space-y-3 py-2">
                                {academy.champions.map((champion) => (
                                  <div
                                    key={`${academyKey}-${champion.athleteId}-${champion.categoryId || champion.keyGroupId}`}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                  >
                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                      <div>
                                        <p className="font-semibold text-slate-950">
                                          {champion.athleteName}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                          {champion.categoryName ||
                                            champion.keyGroupName ||
                                            '-'}
                                        </p>
                                      </div>
                                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                                        {champion.categoryName &&
                                        champion.keyGroupName ? (
                                          <InfoPill
                                            label={champion.keyGroupName}
                                          />
                                        ) : null}
                                        {champion.belt ? (
                                          <InfoPill label={champion.belt} />
                                        ) : null}
                                        {champion.ageDivision ? (
                                          <InfoPill label={champion.ageDivision} />
                                        ) : null}
                                        {champion.weightDivision ? (
                                          <InfoPill
                                            label={champion.weightDivision}
                                          />
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">{icon}</div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-600">{helper}</p> : null}
    </div>
  );
}

function InfoPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
      {label}
    </span>
  );
}

function StateBox({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'error' | 'empty';
}) {
  const className =
    tone === 'error'
      ? 'border-red-300 bg-red-50 text-red-700'
      : tone === 'empty'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-slate-300 bg-slate-50 text-slate-600';

  return (
    <div className={`rounded-2xl border-2 p-5 ${className}`}>{message}</div>
  );
}
