'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, FileUp, PencilLine, Settings2 } from 'lucide-react';
import { useCompetition } from '@/features/competitions/hooks/use-competitions';
import { competitionModeLabels } from '@/features/competitions/types/competition';
import { useCompetitionStore } from '@/shared/stores/useCompetitionStore';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

type CompetitionStartPageProps = {
  competitionId: string;
};

type SetupAction = {
  href: string;
  label: string;
  description: string;
  variant?: 'default' | 'outline';
  icon: typeof FileUp;
};

export default function CompetitionStartPage({
  competitionId,
}: CompetitionStartPageProps) {
  const setActiveCompetitionId = useCompetitionStore(
    (state) => state.setActiveCompetitionId,
  );
  const competitionQuery = useCompetition(competitionId);

  useEffect(() => {
    setActiveCompetitionId(competitionId);
  }, [competitionId, setActiveCompetitionId]);

  if (competitionQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-slate-600">
          Carregando competição...
        </CardContent>
      </Card>
    );
  }

  if (competitionQuery.isError || !competitionQuery.data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-red-700">
          {competitionQuery.error instanceof Error
            ? competitionQuery.error.message
            : 'Falha ao carregar a competição.'}
        </CardContent>
      </Card>
    );
  }

  const competition = competitionQuery.data;
  const nextSteps =
    competition.mode === 'ABSOLUTE_GP' || competition.mode === 'CBJJ'
      ? [
          'Carregar atletas',
          'Configurar áreas',
          'Concluir pesagem',
          'Gerar categorias',
          'Montar lutas e revisar distribuição/áreas',
        ]
      : [
          'Carregar atletas',
          'Configurar áreas',
          'Concluir pesagem',
          'Montar chaves',
          'Gerar lutas por chave e revisar áreas',
        ];
  const actions: SetupAction[] = [
    {
      href: '/imports/athletes',
      label: 'Importar atletas',
      description: 'Fluxo mais rápido para subir a base inteira por CSV.',
      icon: FileUp,
    },
    {
      href: '/athletes',
      label: 'Cadastrar manualmente',
      description: 'Use apenas se a base for pequena ou ajustes forem pontuais.',
      variant: 'outline',
      icon: PencilLine,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm">
        <Link href="/competitions" className="w-fit">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para competições
          </Button>
        </Link>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Competição criada
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            {competition.name} está pronta para começar
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            A configuração base foi salva. A próxima etapa útil é carregar os atletas da competição ativa.
          </p>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-0">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Próxima ação
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Carregar atletas
              </h2>
              <p className="mt-2 text-slate-600">
                Sem atletas aprovados, o restante do fluxo fica bloqueado. Por isso, esta é a única decisão que importa agora.
              </p>
            </div>

            <div className="grid gap-3">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link key={action.href} href={action.href}>
                    <Card className="border-slate-200 p-0 transition hover:border-slate-300 hover:shadow-sm">
                      <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {action.label}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <Button variant={action.variant ?? 'default'}>
                          Abrir
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="p-0">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Resumo útil
                </h2>
              </div>
              <div className="grid gap-3">
                <SummaryItem label="Modo" value={competitionModeLabels[competition.mode]} />
                <SummaryItem
                  label="Duração da luta"
                  value={`${competition.fightDurationSeconds}s`}
                />
                <SummaryItem
                  label="Margem da pesagem"
                  value={`${competition.weighInMarginGrams}g`}
                />
                <SummaryItem
                  label="Divisão etária"
                  value={`${competition.ageSplitYears} ano(s)`}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Fluxo mínimo
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">
                  Ordem recomendada
                </h2>
              </div>
              <ol className="space-y-3">
                {nextSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm font-medium text-slate-700">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <Link href={`/competitions/${competition.id}`}>
                <Button variant="ghost" className="px-0 text-slate-600">
                  Ajustar regras da competição
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}
